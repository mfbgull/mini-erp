import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import * as bcrypt from 'bcrypt';

// Database file path - use DATABASE_PATH env var if set (Electron), otherwise default
const dbDir = process.env.DATABASE_PATH || path.join(__dirname, '../../../database');
const dbPath = path.join(dbDir, 'erp.db');

// Ensure database directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create database connection
const db = new Database(dbPath, {
  verbose: process.env.NODE_ENV === 'development' ? console.log : null
});

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Initialize database with schema if tables don't exist
function initializeDatabase(): void {
  console.log('Checking database initialization...');

  // Check if users table exists
  const tableCheck = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name='users'
  `).get() as { name: string } | undefined;

  if (!tableCheck) {
    console.log('Database not initialized. Running migration...');

    const initSQL = fs.readFileSync(
      path.join(__dirname, '../migrations/init.sql'),
      'utf8'
    );

    db.exec(initSQL);

    console.log('✅ Database schema created successfully!');

    createDefaultUser();
    createDefaultWarehouse();

    console.log('✅ Database initialization complete!');
  } else {
    console.log('✅ Database already initialized.');
  }

  runInvoiceMigration();
  runCustomerARMigrations();
}

function createDefaultUser(): void {
  const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');

  if (!existingUser) {
    const passwordHash = bcrypt.hashSync('admin123', 8);

    const stmt = db.prepare(`
      INSERT INTO users (username, email, password_hash, full_name, role, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run('admin', 'admin@minierp.local', passwordHash, 'Administrator', 'admin', 1);

    console.log('✅ Default admin user created (username: admin, password: admin123)');
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

    console.log('✅ Default warehouse created (WH-001)');
  }
}

function runInvoiceMigration(): void {
  try {
    const columnCheck = db.prepare(`
      SELECT COUNT(*) as count FROM pragma_table_info('invoices')
      WHERE name='discount_scope'
    `).get() as { count: number };

    if (columnCheck.count === 0) {
      console.log('Running invoice discount/tax migration...');

      const migrationSQL = fs.readFileSync(
        path.join(__dirname, '../migrations/add-invoice-discount-tax-fields.sql'),
        'utf8'
      );

      db.exec(migrationSQL);

      console.log('✅ Invoice discount/tax migration completed!');
    }
  } catch (error: any) {
    console.error('Invoice migration error:', error.message);
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
        console.log(`Adding missing column: ${column.name}...`);
        db.exec(column.sql);
        console.log(`✅ Added ${column.name} column successfully!`);
      }
    }

    const ledgerTableCheck = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='customer_ledger'
    `).get() as { name: string } | undefined;

    if (!ledgerTableCheck) {
      console.log('Running customer ledger migration...');

      const ledgerSQL = fs.readFileSync(
        path.join(__dirname, '../migrations/create-customer-ledger.sql'),
        'utf8'
      );

      db.exec(ledgerSQL);

      console.log('✅ Customer ledger migration completed!');
    }

    const allocationsTableCheck = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='payment_allocations'
    `).get() as { name: string } | undefined;

    if (!allocationsTableCheck) {
      console.log('Running payment allocations migration...');

      const allocationsSQL = fs.readFileSync(
        path.join(__dirname, '../migrations/create-payment-allocations.sql'),
        'utf8'
      );

      db.exec(allocationsSQL);

      console.log('✅ Payment allocations migration completed!');
    }

    console.log('Ensuring customer_id values are integers...');
    db.exec(`
      UPDATE invoices SET customer_id = CAST(customer_id AS INTEGER) WHERE typeof(customer_id) = 'text';
      UPDATE payments SET customer_id = CAST(customer_id AS INTEGER) WHERE typeof(customer_id) = 'text';
    `);
    console.log('✅ Customer ID type fix completed!');

    console.log('Recalculating invoice balances from payment allocations...');
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
    console.log('✅ Invoice balance recalculation completed!');

    console.log('Recalculating stock balances from movements...');

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
          console.log(`Fixing ${item?.item_code} in ${wh?.warehouse_code}: ${existing.quantity} -> ${sum.total_qty}`);
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
      console.log(`Removing orphaned balance: ${orphan.item_code} in ${orphan.warehouse_code}`);
      db.prepare('DELETE FROM stock_balances WHERE id = ?').run(orphan.id);
    }

    console.log('✅ Stock balances recalculated from movements!');

    console.log('Syncing item current_stock from stock_balances...');
    db.exec(`
      UPDATE items SET current_stock = (
        SELECT COALESCE(SUM(quantity), 0)
        FROM stock_balances
        WHERE stock_balances.item_id = items.id
      )
    `);
    console.log('✅ Item stock synced from warehouse balances!');

    console.log('Fixing payment ledger descriptions...');
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
    console.log('✅ Payment ledger descriptions fixed!');
  } catch (error: any) {
    console.error('Customer AR migration error:', error.message);
  }
}

function runExpensesMigration(): void {
  try {
    const expensesTableCheck = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='expenses'
    `).get() as { name: string } | undefined;

    if (!expensesTableCheck) {
      console.log('Running expenses migration...');

      const expensesSQL = fs.readFileSync(
        path.join(__dirname, '../migrations/add-expenses-table.sql'),
        'utf8'
      );

      db.exec(expensesSQL);

      console.log('✅ Expenses migration completed!');
    }

    const categoriesTableCheck = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='expense_categories'
    `).get() as { name: string } | undefined;

    if (!categoriesTableCheck) {
      console.log('Running expense categories migration...');

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

      console.log('✅ Expense categories migration completed!');
    }
  } catch (error: any) {
    console.error('Expenses migration error:', error.message);
  }
}

function runPurchasesMigration(): void {
  try {
    const purchasesTableCheck = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='purchases'
    `).get() as { name: string } | undefined;

    if (!purchasesTableCheck) {
      console.log('Running purchases migration...');

      const purchasesSQL = fs.readFileSync(
        path.join(__dirname, '../migrations/add-purchases-table.sql'),
        'utf8'
      );

      db.exec(purchasesSQL);

      console.log('✅ Purchases migration completed!');
    }
  } catch (error: any) {
    console.error('Purchases migration error:', error.message);
  }
}

function runProductionsMigration(): void {
  try {
    const productionsTableCheck = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='productions'
    `).get() as { name: string } | undefined;

    if (!productionsTableCheck) {
      console.log('Running productions migration...');

      const productionsSQL = fs.readFileSync(
        path.join(__dirname, '../migrations/add-production-tables.sql'),
        'utf8'
      );

      db.exec(productionsSQL);

      console.log('✅ Productions migration completed!');
    }
  } catch (error: any) {
    console.error('Productions migration error:', error.message);
  }
}

function runBOMMigration(): void {
  try {
    const bomTableCheck = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='boms'
    `).get() as { name: string } | undefined;

    if (!bomTableCheck) {
      console.log('Running BOM migration...');

      const bomSQL = fs.readFileSync(
        path.join(__dirname, '../migrations/add-bom-tables.sql'),
        'utf8'
      );

      db.exec(bomSQL);

      console.log('✅ BOM migration completed!');
    }
  } catch (error: any) {
    console.error('BOM migration error:', error.message);
  }
}

function runSalesMigration(): void {
  try {
    const salesTableCheck = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='sales'
    `).get() as { name: string } | undefined;

    if (!salesTableCheck) {
      console.log('Running sales migration...');

      const salesSQL = fs.readFileSync(
        path.join(__dirname, '../migrations/add-sales-table.sql'),
        'utf8'
      );

      db.exec(salesSQL);

      console.log('✅ Sales migration completed!');
    }
  } catch (error: any) {
    console.error('Sales migration error:', error.message);
  }
}

function runSupplierLedgerMigration(): void {
  try {
    const supplierLedgerTableCheck = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='supplier_ledger'
    `).get() as { name: string } | undefined;

    if (!supplierLedgerTableCheck) {
      console.log('Running supplier ledger migration...');

      const supplierLedgerSQL = fs.readFileSync(
        path.join(__dirname, '../migrations/create-supplier-ledger.sql'),
        'utf8'
      );

      db.exec(supplierLedgerSQL);

      console.log('✅ Supplier ledger migration completed!');
    }
  } catch (error: any) {
    console.error('Supplier ledger migration error:', error.message);
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
      console.log('Running activity log enhancement migration...');

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

      console.log('✅ Activity log enhancement migration completed!');
    }
  } catch (error: any) {
    console.error('Activity log migration error:', error.message);
  }
}

function runRawMaterialsWarehouseMigration(): void {
  try {
    const columnCheck = db.prepare(`
      SELECT COUNT(*) as count FROM pragma_table_info('productions')
      WHERE name='raw_materials_warehouse_id'
    `).get() as { count: number };

    if (columnCheck.count === 0) {
      console.log('Running raw materials warehouse migration...');

      const migrationSQL = fs.readFileSync(
        path.join(__dirname, '../migrations/add-raw-materials-warehouse.sql'),
        'utf8'
      );

      db.exec(migrationSQL);

      console.log('✅ Raw materials warehouse migration completed!');
    }
  } catch (error: any) {
    console.error('Raw materials warehouse migration error:', error.message);
  }
}

function runProductionInputsWarehouseMigration(): void {
  try {
    const columnCheck = db.prepare(`
      SELECT COUNT(*) as count FROM pragma_table_info('production_inputs')
      WHERE name='warehouse_id'
    `).get() as { count: number };

    if (columnCheck.count === 0) {
      console.log('Running production inputs warehouse migration...');

      const migrationSQL = fs.readFileSync(
        path.join(__dirname, '../migrations/add-warehouse-to-production-inputs.sql'),
        'utf8'
      );

      db.exec(migrationSQL);

      console.log('✅ Production inputs warehouse migration completed!');
    }
  } catch (error: any) {
    console.error('Production inputs warehouse migration error:', error.message);
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

export default db;
