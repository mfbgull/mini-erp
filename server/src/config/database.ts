import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import * as bcrypt from 'bcrypt';
import logger from '../utils/logger';

// Database file path - use DATABASE_PATH env var if set (Electron), otherwise default
const dbDir = process.env.DATABASE_PATH || path.join(__dirname, '../../../database');
const dbPath = path.join(dbDir, 'erp.db');

// Ensure database directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create database connection
const db = new Database(dbPath, {
  verbose: process.env.NODE_ENV === 'development' ? (msg: string) => logger.debug(msg) : undefined
});

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Initialize database with schema if tables don't exist
function initializeDatabase(): void {
  logger.info('Checking database initialization...');

  // Check if users table exists
  const tableCheck = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name='users'
  `).get() as { name: string } | undefined;

  if (!tableCheck) {
    logger.info('Database not initialized. Running migration...');

    const initSQL = fs.readFileSync(
      path.join(__dirname, '../migrations/init.sql'),
      'utf8'
    );

    db.exec(initSQL);

    logger.info('✅ Database schema created successfully!');

    createDefaultUser();
    createDefaultWarehouse();

    logger.info('✅ Database initialization complete!');
  } else {
    logger.info('✅ Database already initialized.');
  }

  runInvoiceMigration();
  runCustomerARMigrations();
}

function createDefaultUser(): void {
  const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');

  if (!existingUser) {
    const passwordHash = bcrypt.hashSync('admin123', 12);

    const stmt = db.prepare(`
      INSERT INTO users (username, email, password_hash, full_name, role, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run('admin', 'admin@minierp.local', passwordHash, 'Administrator', 'admin', 1);

    logger.info('✅ Default admin user created (username: admin, password: admin123)');
  }
}

function createDefaultWarehouse(): void {
  const existingWarehouse = db.prepare('SELECT id FROM warehouses WHERE warehouse_code = ?').get('WH-001');

  if (!existingWarehouse) {
    const stmt = db.prepare(`
      INSERT INTO warehouses (warehouse_code, warehouse_name, location, is_active)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run('WH-001', 'Main Warehouse', 'Default Location', 1);

    logger.info('✅ Default warehouse created (WH-001)');
  }
}

function runInvoiceMigration(): void {
  try {
    const columnCheck = db.prepare(`
      SELECT COUNT(*) as count FROM pragma_table_info('invoices')
      WHERE name='discount_scope'
    `).get() as { count: number };

    if (columnCheck.count === 0) {
      logger.info('Running invoice discount/tax migration...');

      const migrationSQL = fs.readFileSync(
        path.join(__dirname, '../migrations/add-invoice-discount-tax-fields.sql'),
        'utf8'
      );

      db.exec(migrationSQL);

      logger.info('✅ Invoice discount/tax migration completed!');
    }
  } catch (error: any) {
    logger.error('Invoice migration error:', error.message);
  }
}

function runCustomerARMigrations(): void {
  try {
    const columnsToCheck = [
      {name: 'credit_limit', sql: 'ALTER TABLE customers ADD COLUMN credit_limit DECIMAL(15,2) DEFAULT 0'},
      {name: 'current_balance', sql: 'ALTER TABLE customers ADD COLUMN current_balance DECIMAL(15,2) DEFAULT 0'},
      {name: 'opening_balance', sql: 'ALTER TABLE customers ADD COLUMN opening_balance DECIMAL(15,2) DEFAULT 0'},
      {name: 'payment_terms_days', sql: 'ALTER TABLE customers ADD COLUMN payment_terms_days INTEGER DEFAULT 14'}
    ];

    for (const column of columnsToCheck) {
      const columnCheck = db.prepare(`
        SELECT COUNT(*) as count FROM pragma_table_info('customers')
        WHERE name=?
      `).get(column.name) as { count: number } | undefined;

      if (!columnCheck || columnCheck.count === 0) {
        logger.info(`Adding missing column: ${column.name}...`);
        db.exec(column.sql);
        logger.info(`✅ Added ${column.name} column successfully!`);
      }
    }

    const ledgerTableCheck = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='customer_ledger'
    `).get() as { name: string } | undefined;

    if (!ledgerTableCheck) {
      logger.info('Running customer ledger migration...');

      const ledgerSQL = fs.readFileSync(
        path.join(__dirname, '../migrations/create-customer-ledger.sql'),
        'utf8'
      );

      db.exec(ledgerSQL);

      logger.info('✅ Customer ledger migration completed!');
    }

    const allocationsTableCheck = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='payment_allocations'
    `).get() as { name: string } | undefined;

    if (!allocationsTableCheck) {
      logger.info('Running payment allocations migration...');

      const allocationsSQL = fs.readFileSync(
        path.join(__dirname, '../migrations/create-payment-allocations.sql'),
        'utf8'
      );

      db.exec(allocationsSQL);

      logger.info('✅ Payment allocations migration completed!');
    }

    logger.info('Ensuring customer_id values are integers...');
    db.exec(`
      UPDATE invoices SET customer_id = CAST(customer_id AS INTEGER) WHERE typeof(customer_id) = 'text';
      UPDATE payments SET customer_id = CAST(customer_id AS INTEGER) WHERE typeof(customer_id) = 'text';
    `);
    logger.info('✅ Customer ID type fix completed!');

    logger.info('Recalculating invoice balances from payment allocations...');
    db.exec(`
      UPDATE invoices SET
        paid_amount = COALESCE((
          SELECT SUM(pa.amount)
          FROM payment_allocations pa
          WHERE pa.invoice_id = invoices.id
        ), 0),
        balance_amount = total_amount - COALESCE((
          SELECT SUM(pa.amount)
          FROM payment_allocations pa
          WHERE pa.invoice_id = invoices.id
        ), 0)
    `);

    db.exec(`
      UPDATE invoices SET status = 'Paid' WHERE balance_amount = 0 AND total_amount > 0;
      UPDATE invoices SET status = 'Partially Paid' WHERE balance_amount > 0 AND balance_amount < total_amount AND paid_amount > 0;
      UPDATE invoices SET status = 'Unpaid' WHERE paid_amount = 0 OR paid_amount IS NULL;
    `);
    logger.info('✅ Invoice balance recalculation completed!');

    logger.info('Recalculating stock balances from movements...');

    const movementSums = db.prepare(`
      SELECT item_id, warehouse_id, SUM(quantity) as total_qty
      FROM stock_movements
      GROUP BY item_id, warehouse_id
    `).all() as { item_id: number; warehouse_id: number; total_qty: number }[];

    for (const sum of movementSums) {
      const existing = db.prepare('SELECT id, quantity FROM stock_balances WHERE item_id = ? AND warehouse_id = ?').get(sum.item_id, sum.warehouse_id) as { id: number; quantity: number } | undefined;

      if (existing) {
        if (existing.quantity !== sum.total_qty) {
          const item = db.prepare('SELECT item_code FROM items WHERE id = ?').get(sum.item_id) as { item_code: string } | undefined;
          const wh = db.prepare('SELECT warehouse_code FROM warehouses WHERE id = ?').get(sum.warehouse_id) as { warehouse_code: string } | undefined;
          logger.info(`Fixing ${item?.item_code} in ${wh?.warehouse_code}: ${existing.quantity} -> ${sum.total_qty}`);
          db.prepare('UPDATE stock_balances SET quantity = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?').run(sum.total_qty, existing.id);
        }
      } else {
        db.prepare('INSERT INTO stock_balances (item_id, warehouse_id, quantity) VALUES (?, ?, ?)').run(sum.item_id, sum.warehouse_id, sum.total_qty);
      }
    }

    const orphanedBalances = db.prepare(`
      SELECT sb.id, i.item_code, w.warehouse_code
      FROM stock_balances sb
      JOIN items i ON sb.item_id = i.id
      JOIN warehouses w ON sb.warehouse_id = w.id
      WHERE NOT EXISTS (
        SELECT 1 FROM stock_movements sm
        WHERE sm.item_id = sb.item_id AND sm.warehouse_id = sb.warehouse_id
      )
    `).all() as { id: number; item_code: string; warehouse_code: string }[];

    for (const orphan of orphanedBalances) {
      logger.info(`Removing orphaned balance: ${orphan.item_code} in ${orphan.warehouse_code}`);
      db.prepare('DELETE FROM stock_balances WHERE id = ?').run(orphan.id);
    }

    logger.info('✅ Stock balances recalculated from movements!');

    logger.info('Syncing item current_stock from stock_balances...');
    db.exec(`
      UPDATE items SET current_stock = (
        SELECT COALESCE(SUM(quantity), 0)
        FROM stock_balances
        WHERE stock_balances.item_id = items.id
      )
    `);
    logger.info('✅ Item stock synced from warehouse balances!');

    logger.info('Fixing payment ledger descriptions...');
    const paymentLedgerEntries = db.prepare(`
      SELECT cl.id, cl.reference_no, cl.description
      FROM customer_ledger cl
      WHERE cl.transaction_type = 'PAYMENT'
        AND cl.description LIKE 'Payment against %'
    `).all() as { id: number; reference_no: string; description: string }[];

    for (const entry of paymentLedgerEntries) {
      const match = entry.description.match(/Payment against (.+)/);
      if (match) {
        const invoiceRefs = match[1].split(',').map((s: string) => s.trim());
        const invoiceNumbers = invoiceRefs.map((ref: string) => {
          if (/[a-zA-Z]/.test(ref)) {
            return ref;
          }
          const invoiceId = parseInt(ref, 10);
          if (!isNaN(invoiceId)) {
            const invoice = db.prepare('SELECT invoice_no FROM invoices WHERE id = ?').get(invoiceId) as { invoice_no: string } | undefined;
            return invoice ? invoice.invoice_no : `Invoice #${invoiceId}`;
          }
          return ref;
        });

        const newDescription = `Payment against ${invoiceNumbers.join(', ')}`;
        if (newDescription !== entry.description) {
          db.prepare('UPDATE customer_ledger SET description = ? WHERE id = ?').run(newDescription, entry.id);
        }
      }
    }
    logger.info('✅ Payment ledger descriptions fixed!');
  } catch (error: any) {
    logger.error('Customer AR migration error:', error.message);
  }
}

function runExpensesMigration(): void {
  try {
    const expensesTableCheck = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='expenses'
    `).get() as { name: string } | undefined;

    if (!expensesTableCheck) {
      logger.info('Running expenses migration...');

      const expensesSQL = fs.readFileSync(
        path.join(__dirname, '../migrations/add-expenses-table.sql'),
        'utf8'
      );

      db.exec(expensesSQL);

      logger.info('✅ Expenses migration completed!');
    }

    const categoriesTableCheck = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='expense_categories'
    `).get() as { name: string } | undefined;

    if (!categoriesTableCheck) {
      logger.info('Running expense categories migration...');

      const categorySQL = `
        CREATE TABLE IF NOT EXISTS expense_categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category_name VARCHAR(100) UNIQUE NOT NULL,
          description TEXT,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        INSERT OR IGNORE INTO expense_categories (category_name, description) VALUES
        ('Office Supplies', 'Stationery, printing, office materials'),
        ('Travel', 'Transportation, accommodation, meals during business travel'),
        ('Utilities', 'Electricity, water, internet, phone bills'),
        ('Rent', 'Office or warehouse rental expenses'),
        ('Salaries', 'Employee salaries and wages'),
        ('Marketing', 'Advertising, promotion, marketing expenses'),
        ('Maintenance', 'Equipment maintenance, repair costs'),
        ('Insurance', 'Business insurance premiums'),
        ('Taxes', 'Tax payments and fees'),
        ('Professional Services', 'Consulting, legal, accounting fees'),
        ('Training', 'Employee training and development'),
        ('Equipment', 'Purchase of equipment and tools'),
        ('Fuel', 'Fuel expenses for company vehicles'),
        ('Meals', 'Business meals and entertainment'),
        ('Other', 'Miscellaneous business expenses');
      `;

      db.exec(categorySQL);

      logger.info('✅ Expense categories migration completed!');
    }
  } catch (error: any) {
    logger.error('Expenses migration error:', error.message);
  }
}

function runPurchasesMigration(): void {
  try {
    const purchasesTableCheck = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='purchases'
    `).get() as { name: string } | undefined;

    if (!purchasesTableCheck) {
      logger.info('Running purchases migration...');

      const purchasesSQL = fs.readFileSync(
        path.join(__dirname, '../migrations/add-purchases-table.sql'),
        'utf8'
      );

      db.exec(purchasesSQL);

      logger.info('✅ Purchases migration completed!');
    }
  } catch (error: any) {
    logger.error('Purchases migration error:', error.message);
  }
}

function runProductionsMigration(): void {
  try {
    const productionsTableCheck = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='productions'
    `).get() as { name: string } | undefined;

    if (!productionsTableCheck) {
      logger.info('Running productions migration...');

      const productionsSQL = fs.readFileSync(
        path.join(__dirname, '../migrations/add-production-tables.sql'),
        'utf8'
      );

      db.exec(productionsSQL);

      logger.info('✅ Productions migration completed!');
    }
  } catch (error: any) {
    logger.error('Productions migration error:', error.message);
  }
}

function runBOMMigration(): void {
  try {
    const bomTableCheck = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='boms'
    `).get() as { name: string } | undefined;

    if (!bomTableCheck) {
      logger.info('Running BOM migration...');

      const bomSQL = fs.readFileSync(
        path.join(__dirname, '../migrations/add-bom-tables.sql'),
        'utf8'
      );

      db.exec(bomSQL);

      logger.info('✅ BOM migration completed!');
    }
  } catch (error: any) {
    logger.error('BOM migration error:', error.message);
  }
}

function runSalesMigration(): void {
  try {
    const salesTableCheck = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='sales'
    `).get() as { name: string } | undefined;

    if (!salesTableCheck) {
      logger.info('Running sales migration...');

      const salesSQL = fs.readFileSync(
        path.join(__dirname, '../migrations/add-sales-table.sql'),
        'utf8'
      );

      db.exec(salesSQL);

      logger.info('✅ Sales migration completed!');
    }

    // Check and run sales cycle migration (quotations & sales orders)
    const salesCycleCheck = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='quotations'
    `).get() as { name: string } | undefined;

    if (!salesCycleCheck) {
      logger.info('Running sales cycle migration (quotations & sales orders)...');

      try {
        // Create quotations table
        db.exec(`
          CREATE TABLE IF NOT EXISTS quotations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            quotation_no VARCHAR(50) UNIQUE NOT NULL,
            customer_id INTEGER NOT NULL,
            customer_name VARCHAR(200),
            quotation_date DATE NOT NULL,
            expiry_date DATE,
            status VARCHAR(20) DEFAULT 'Draft',
            source_type VARCHAR(20),
            total_amount DECIMAL(15,2) DEFAULT 0,
            notes TEXT,
            terms TEXT,
            warehouse_id INTEGER,
            created_by INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Create quotation_items table
        db.exec(`
          CREATE TABLE IF NOT EXISTS quotation_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            quotation_id INTEGER NOT NULL,
            item_id INTEGER NOT NULL,
            item_code VARCHAR(50),
            item_name VARCHAR(200),
            quantity DECIMAL(15,3) NOT NULL,
            unit_price DECIMAL(15,2) NOT NULL,
            discount_type VARCHAR(20) DEFAULT 'none',
            discount_value DECIMAL(15,2) DEFAULT 0,
            tax_rate DECIMAL(5,2) DEFAULT 0,
            amount DECIMAL(15,2) NOT NULL
          )
        `);

        // Add columns to existing tables if not exist
        try { db.exec(`ALTER TABLE sales_orders ADD COLUMN source_type VARCHAR(20)`); } catch {}
        try { db.exec(`ALTER TABLE sales_orders ADD COLUMN source_id INTEGER`); } catch {}
        try { db.exec(`ALTER TABLE sales_orders ADD COLUMN customer_name VARCHAR(200)`); } catch {}
        try { db.exec(`ALTER TABLE invoices ADD COLUMN source_type VARCHAR(20)`); } catch {}
        try { db.exec(`ALTER TABLE invoices ADD COLUMN quotation_id INTEGER`); } catch {}
        try { db.exec(`ALTER TABLE invoices ADD COLUMN customer_name VARCHAR(200)`); } catch {}

        logger.info('✅ Sales cycle migration completed!');
      } catch (migrationError: any) {
        logger.error('Sales cycle migration error:', String(migrationError));
      }
    }
  } catch (error: any) {
    logger.error('Sales migration error:', error.message);
  }
}

function runSupplierLedgerMigration(): void {
  try {
    const supplierLedgerTableCheck = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='supplier_ledger'
    `).get() as { name: string } | undefined;

    if (!supplierLedgerTableCheck) {
      logger.info('Running supplier ledger migration...');

      const supplierLedgerSQL = fs.readFileSync(
        path.join(__dirname, '../migrations/create-supplier-ledger.sql'),
        'utf8'
      );

      db.exec(supplierLedgerSQL);

      logger.info('✅ Supplier ledger migration completed!');
    }
  } catch (error: any) {
    logger.error('Supplier ledger migration error:', error.message);
  }
}

function runActivityLogMigration(): void {
  try {
    // Check if log_level column exists
    const columnCheck = db.prepare(`
      SELECT COUNT(*) as count FROM pragma_table_info('activity_log')
      WHERE name='log_level'
    `).get() as { count: number };

    if (columnCheck.count === 0) {
      logger.info('Running activity log enhancement migration...');

      // Add new columns
      db.exec(`ALTER TABLE activity_log ADD COLUMN log_level VARCHAR(20) DEFAULT 'INFO'`);
      db.exec(`ALTER TABLE activity_log ADD COLUMN ip_address VARCHAR(45)`);
      db.exec(`ALTER TABLE activity_log ADD COLUMN user_agent TEXT`);
      db.exec(`ALTER TABLE activity_log ADD COLUMN metadata TEXT`);
      db.exec(`ALTER TABLE activity_log ADD COLUMN duration_ms INTEGER`);

      // Create indexes
      db.exec(`CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_activity_log_user_created_at ON activity_log(user_id, created_at)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_activity_log_entity_created_at ON activity_log(entity_type, entity_id, created_at)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_activity_log_log_level ON activity_log(log_level)`);

      logger.info('✅ Activity log enhancement migration completed!');
    }
  } catch (error: any) {
    logger.error('Activity log migration error:', error.message);
  }
}

function runRawMaterialsWarehouseMigration(): void {
  try {
    const columnCheck = db.prepare(`
      SELECT COUNT(*) as count FROM pragma_table_info('productions')
      WHERE name='raw_materials_warehouse_id'
    `).get() as { count: number };

    if (columnCheck.count === 0) {
      logger.info('Running raw materials warehouse migration...');

      const migrationSQL = fs.readFileSync(
        path.join(__dirname, '../migrations/add-raw-materials-warehouse.sql'),
        'utf8'
      );

      db.exec(migrationSQL);

      logger.info('✅ Raw materials warehouse migration completed!');
    }
  } catch (error: any) {
    logger.error('Raw materials warehouse migration error:', error.message);
  }
}

function runProductionInputsWarehouseMigration(): void {
  try {
    const columnCheck = db.prepare(`
      SELECT COUNT(*) as count FROM pragma_table_info('production_inputs')
      WHERE name='warehouse_id'
    `).get() as { count: number };

    if (columnCheck.count === 0) {
      logger.info('Running production inputs warehouse migration...');

      const migrationSQL = fs.readFileSync(
        path.join(__dirname, '../migrations/add-warehouse-to-production-inputs.sql'),
        'utf8'
      );

      db.exec(migrationSQL);

      logger.info('✅ Production inputs warehouse migration completed!');
    }
  } catch (error: any) {
    logger.error('Production inputs warehouse migration error:', error.message);
  }
}

function runMobileInvoiceMigration(): void {
  try {
    const taxRatesTableCheck = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='tax_rates'
    `).get() as { name: string } | undefined;

    if (!taxRatesTableCheck) {
      logger.info('Running mobile invoice tables migration...');

      const mobileInvoiceSQL = fs.readFileSync(
        path.join(__dirname, '../migrations/add-mobile-invoice-tables.sql'),
        'utf8'
      );

      db.exec(mobileInvoiceSQL);

      logger.info('✅ Mobile invoice tables migration completed!');
    }
  } catch (error: any) {
    logger.error('Mobile invoice migration error:', error.message);
  }
}

function runMissingIndexesMigration(): void {
  try {
    const indexCheck = db.prepare(`
      SELECT COUNT(*) as count FROM sqlite_master
      WHERE type='index' AND name='idx_payment_allocations_payment'
    `).get() as { count: number };

    if (indexCheck.count === 0) {
      logger.info('Running missing indexes migration...');

      const indexSQL = fs.readFileSync(
        path.join(__dirname, '../migrations/add-missing-indexes.sql'),
        'utf8'
      );

      db.exec(indexSQL);

      logger.info('✅ Missing indexes migration completed!');
    }
  } catch (error: any) {
    logger.error('Missing indexes migration error:', error.message);
  }
}

initializeDatabase();
runExpensesMigration();
runPurchasesMigration();
runProductionsMigration();
runBOMMigration();
runSalesMigration();
runSupplierLedgerMigration();
runActivityLogMigration();
runRawMaterialsWarehouseMigration();
runProductionInputsWarehouseMigration();
runMobileInvoiceMigration();
runMissingIndexesMigration();
runProductionOverheadMigration();
runRolesPermissionsMigration();

export default db;

function runProductionOverheadMigration(): void {
  try {
    const hasOverheadCost = db.prepare(
      `SELECT COUNT(*) as count FROM pragma_table_info('productions') WHERE name='overhead_cost'`
    ).get() as { count: number };
    if (!hasOverheadCost.count) {
      logger.info('Running production overhead_cost migration...');
      db.prepare(`ALTER TABLE productions ADD COLUMN overhead_cost DECIMAL(15,2) DEFAULT 0`).run();
      logger.info('✅ Production overhead_cost migration completed!');
    }
  } catch (error: any) {
    logger.error('Production overhead migration error:', error.message);
  }
}

function runRolesPermissionsMigration(): void {
  try {
    const rolesTableCheck = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='roles'
    `).get() as { name: string } | undefined;

    if (!rolesTableCheck) {
      logger.info('Running roles and permissions migration...');

      const rolesPermissionsSQL = fs.readFileSync(
        path.join(__dirname, '../migrations/add-roles-permissions.sql'),
        'utf8'
      );

      db.exec(rolesPermissionsSQL);

      logger.info('✅ Roles and permissions migration completed!');

      // Seed default permissions
      seedDefaultPermissions();
    }
  } catch (error: any) {
    logger.error('Roles and permissions migration error:', error.message);
  }
}

function seedDefaultPermissions(): void {
  try {
    logger.info('Seeding default permissions...');

    // Define all permissions by module
    const permissions = [
      // Dashboard
      { name: 'dashboard:read', module: 'dashboard', action: 'read', description: 'View dashboard' },
      
      // Users
      { name: 'users:read', module: 'users', action: 'read', description: 'View users' },
      { name: 'users:create', module: 'users', action: 'create', description: 'Create users' },
      { name: 'users:update', module: 'users', action: 'update', description: 'Update users' },
      { name: 'users:delete', module: 'users', action: 'delete', description: 'Delete users' },
      
      // Inventory
      { name: 'inventory:read', module: 'inventory', action: 'read', description: 'View inventory' },
      { name: 'inventory:create', module: 'inventory', action: 'create', description: 'Create inventory items' },
      { name: 'inventory:update', module: 'inventory', action: 'update', description: 'Update inventory items' },
      { name: 'inventory:delete', module: 'inventory', action: 'delete', description: 'Delete inventory items' },
      
      // Sales
      { name: 'sales:read', module: 'sales', action: 'read', description: 'View sales' },
      { name: 'sales:create', module: 'sales', action: 'create', description: 'Create sales' },
      { name: 'sales:update', module: 'sales', action: 'update', description: 'Update sales' },
      { name: 'sales:delete', module: 'sales', action: 'delete', description: 'Delete sales' },
      
      // Purchases
      { name: 'purchases:read', module: 'purchases', action: 'read', description: 'View purchases' },
      { name: 'purchases:create', module: 'purchases', action: 'create', description: 'Create purchases' },
      { name: 'purchases:update', module: 'purchases', action: 'update', description: 'Update purchases' },
      { name: 'purchases:delete', module: 'purchases', action: 'delete', description: 'Delete purchases' },
      
      // Reports
      { name: 'reports:read', module: 'reports', action: 'read', description: 'View reports' },
      
      // Settings
      { name: 'settings:read', module: 'settings', action: 'read', description: 'View settings' },
      { name: 'settings:update', module: 'settings', action: 'update', description: 'Update settings' },
      
      // Roles & Permissions
      { name: 'roles:read', module: 'roles', action: 'read', description: 'View roles' },
      { name: 'roles:create', module: 'roles', action: 'create', description: 'Create roles' },
      { name: 'roles:update', module: 'roles', action: 'update', description: 'Update roles' },
      { name: 'roles:delete', module: 'roles', action: 'delete', description: 'Delete roles' },
    ];

    // Insert permissions
    for (const perm of permissions) {
      db.prepare(`
        INSERT OR IGNORE INTO permissions (permission_name, module, action, description)
        VALUES (?, ?, ?, ?)
      `).run(perm.name, perm.module, perm.action, perm.description);
    }

    // Assign all permissions to Admin role
    const adminRole = db.prepare('SELECT id FROM roles WHERE role_name = ?').get('Admin') as { id: number };
    const allPermissions = db.prepare('SELECT id FROM permissions').all() as { id: number }[];
    
    for (const perm of allPermissions) {
      db.prepare(`
        INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
        VALUES (?, ?)
      `).run(adminRole.id, perm.id);
    }

    // Assign read-only permissions to User role
    const userRole = db.prepare('SELECT id FROM roles WHERE role_name = ?').get('User') as { id: number };
    const readPermissions = db.prepare(`
      SELECT id FROM permissions WHERE action = 'read'
      AND module NOT IN ('roles', 'settings')
    `).all() as { id: number }[];
    
    for (const perm of readPermissions) {
      db.prepare(`
        INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
        VALUES (?, ?)
      `).run(userRole.id, perm.id);
    }

    logger.info('✅ Default permissions seeded successfully!');
  } catch (error: any) {
    logger.error('Seed default permissions error:', error.message);
  }
}
