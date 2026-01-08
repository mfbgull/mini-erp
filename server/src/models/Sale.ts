import Database from 'better-sqlite3';
import StockMovementModel from './StockMovement';

interface Sale {
  id: number;
  sale_no: string;
  item_id: number;
  warehouse_id: number;
  quantity: number;
  unit_price: number;
  total_amount: number;
  customer_name?: string;
  sale_date: string;
  invoice_no?: string;
  remarks?: string;
  status?: string;
  created_by: number;
  created_at?: string;
  item_code?: string;
  item_name?: string;
  unit_of_measure?: string;
  warehouse_code?: string;
  warehouse_name?: string;
  created_by_username?: string;
}

interface SaleFilters {
  start_date?: string;
  end_date?: string;
  item_id?: number;
  warehouse_id?: number;
  customer_name?: string;
  limit?: number;
}

interface CreateSaleDTO {
  item_id: number;
  warehouse_id: number;
  quantity: number;
  unit_price: number;
  customer_name?: string;
  sale_date: string;
  invoice_no?: string;
  remarks?: string;
}

class SaleModel {
  static recordSale(data: CreateSaleDTO, userId: number, db: Database.Database): Sale {
    const { item_id, warehouse_id, quantity, unit_price, customer_name, sale_date, invoice_no, remarks } = data;

    const transaction = db.transaction(() => {
      const stockBalance = db.prepare(`
        SELECT quantity FROM stock_balances
        WHERE item_id = ? AND warehouse_id = ?
      `).get(item_id, warehouse_id) as { quantity: any } | undefined;

      const availableStock = stockBalance ? parseFloat(String(stockBalance.quantity)) : 0;

      if (availableStock < quantity) {
        throw new Error(`Insufficient stock. Available: ${availableStock}, Required: ${quantity}`);
      }

      const saleNo = this.generateSaleNo(db);

      const saleStmt = db.prepare(`
        INSERT INTO sales (
          sale_no, item_id, warehouse_id, quantity, unit_price, total_amount,
          customer_name, sale_date, invoice_no, remarks, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const totalAmount = quantity * unit_price;

      const result = saleStmt.run(
        saleNo,
        item_id,
        warehouse_id,
        quantity,
        unit_price,
        totalAmount,
        customer_name || null,
        sale_date,
        invoice_no || null,
        remarks || null,
        userId
      );

      const saleId = result.lastInsertRowid as number;

      const movementNo = StockMovementModel.generateMovementNo(db);
      const result2 = db.prepare(`
        INSERT INTO stock_movements (
          movement_no, item_id, warehouse_id, movement_type,
          quantity, unit_cost, reference_doctype, reference_docno,
          remarks, movement_date, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        movementNo,
        item_id,
        warehouse_id,
        'SALE',
        -quantity,
        null,
        'Sale',
        saleNo,
        `Sale: ${saleNo}${customer_name ? ' to ' + customer_name : ''}`,
        sale_date,
        userId
      );

      const existingBalance = db.prepare(`
        SELECT * FROM stock_balances
        WHERE item_id = ? AND warehouse_id = ?
      `).get(item_id, warehouse_id) as any;

      if (existingBalance) {
        db.prepare(`
          UPDATE stock_balances
          SET quantity = quantity + ?,
              last_updated = CURRENT_TIMESTAMP
          WHERE item_id = ? AND warehouse_id = ?
        `).run(-quantity, item_id, warehouse_id);
      } else {
        db.prepare(`
          INSERT INTO stock_balances (item_id, warehouse_id, quantity)
          VALUES (?, ?, ?)
        `).run(item_id, warehouse_id, -quantity);
      }

      db.prepare(`
        UPDATE items
        SET current_stock = (
          SELECT COALESCE(SUM(quantity), 0)
          FROM stock_balances
          WHERE item_id = ?
        )
        WHERE id = ?
      `).run(item_id, item_id);

      db.prepare(`
        INSERT INTO activity_log (user_id, action, entity_type, entity_id, description)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        userId,
        'CREATE',
        'Sale',
        saleId,
        `Recorded sale ${saleNo}: ${quantity} units`
      );

      return this.getById(saleId, db) as Sale;
    });

    return transaction();
  }

  static generateSaleNo(db: Database.Database): string {
    const year = new Date().getFullYear();
    const settingKey = `SALE_last_no_${year}`;

    const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get(settingKey) as { value: string } | undefined;

    let nextNo = 1;
    if (setting) {
      nextNo = parseInt(setting.value) + 1;
    }

    db.prepare(`
      INSERT OR REPLACE INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `).run(settingKey, nextNo.toString());

    return `SALE-${year}-${nextNo.toString().padStart(4, '0')}`;
  }

  static getAll(filters: SaleFilters = {}, db: Database.Database): Sale[] {
    let query = `
      SELECT
        s.*,
        i.item_code,
        i.item_name,
        i.unit_of_measure,
        w.warehouse_code,
        w.warehouse_name,
        u.username as created_by_username
      FROM sales s
      JOIN items i ON s.item_id = i.id
      JOIN warehouses w ON s.warehouse_id = w.id
      JOIN users u ON s.created_by = u.id
      `;

    const params: any[] = [];

    if (filters.start_date) {
      query += ` AND s.sale_date >= ?`;
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      query += ` AND s.sale_date <= ?`;
      params.push(filters.end_date);
    }

    if (filters.item_id) {
      query += ` AND s.item_id = ?`;
      params.push(filters.item_id);
    }

    if (filters.warehouse_id) {
      query += ` AND s.warehouse_id = ?`;
      params.push(filters.warehouse_id);
    }

    if (filters.customer_name) {
      query += ` AND s.customer_name LIKE ?`;
      params.push(`%${filters.customer_name}%`);
    }

    query += ` ORDER BY s.sale_date DESC, s.created_at DESC`;

    if (filters.limit) {
      query += ` LIMIT ?`;
      params.push(filters.limit);
    }

    return db.prepare(query).all(...params) as Sale[];
  }

  static getById(id: number, db: Database.Database): Sale | undefined {
    return db.prepare(`
      SELECT
        s.*,
        i.item_code,
        i.item_name,
        i.unit_of_measure,
        w.warehouse_code,
        w.warehouse_name,
        u.username as created_by_username
      FROM sales s
      JOIN items i ON s.item_id = i.id
      JOIN warehouses w ON s.warehouse_id = w.id
      JOIN users u ON s.created_by = u.id
      WHERE s.id = ?
    `).get(id) as Sale | undefined;
  }

  static getSummaryByItem(item_id: number, db: Database.Database) {
    return db.prepare(`
      SELECT
        COUNT(*) as sale_count,
        SUM(quantity) as total_quantity,
        SUM(total_amount) as total_revenue,
        AVG(unit_price) as avg_unit_price,
        MIN(sale_date) as first_sale_date,
        MAX(sale_date) as last_sale_date
      FROM sales
      WHERE item_id = ?
    `).get(item_id);
  }

  static getSummaryByDateRange(start_date: string, end_date: string, db: Database.Database) {
    return db.prepare(`
      SELECT
        COUNT(*) as sale_count,
        SUM(quantity) as total_quantity,
        SUM(total_amount) as total_revenue,
        COUNT(DISTINCT item_id) as unique_items,
        COUNT(DISTINCT customer_name) as unique_customers
      FROM sales
      WHERE sale_date BETWEEN ? AND ?
    `).get(start_date, end_date);
  }

  static getTopCustomers(limit: number = 10, db: Database.Database) {
    return db.prepare(`
      SELECT
        customer_name,
        COUNT(*) as sale_count,
        SUM(quantity) as total_quantity,
        SUM(total_amount) as total_revenue
      FROM sales
      WHERE customer_name IS NOT NULL
        GROUP BY customer_name
        ORDER BY total_revenue DESC
        LIMIT ?
    `).all(limit);
  }

  static getItemCustomerPriceHistory(item_id: number, customer_id: number, db: Database.Database) {
    const query = `
      SELECT
        c.customer_name,
        COUNT(*) AS transaction_count,
        MIN(
          CASE
            WHEN ii.discount_type = 'percentage' THEN
              (ii.unit_price * (1.0 - COALESCE(ii.discount_value, 0) / 100.0)) * (1.0 + COALESCE(ii.tax_rate, 0) / 100.0)
            ELSE
              (ii.unit_price - COALESCE(ii.discount_value, 0) * 1.0 / ii.quantity) * (1.0 + COALESCE(ii.tax_rate, 0) / 100.0)
          END
        ) AS lowest_price,
        MAX(
          CASE
            WHEN ii.discount_type = 'percentage' THEN
              (ii.unit_price * (1.0 - COALESCE(ii.discount_value, 0) / 100.0)) * (1.0 + COALESCE(ii.tax_rate, 0) / 100.0)
            ELSE
              (ii.unit_price - COALESCE(ii.discount_value, 0) * 1.0 / ii.quantity) * (1.0 + COALESCE(ii.tax_rate, 0) / 100.0)
          END
        ) AS highest_price,
        AVG(
          CASE
            WHEN ii.discount_type = 'percentage' THEN
              (ii.unit_price * (1.0 - COALESCE(ii.discount_value, 0) / 100.0)) * (1.0 + COALESCE(ii.tax_rate, 0) / 100.0)
            ELSE
              (ii.unit_price - COALESCE(ii.discount_value, 0) * 1.0 / ii.quantity) * (1.0 + COALESCE(ii.tax_rate, 0) / 100.0)
          END
        ) AS avg_price
      FROM invoice_items ii
      INNER JOIN invoices i ON ii.invoice_id = i.id
      INNER JOIN customers c ON i.customer_id = c.id
      WHERE ii.item_id = ?
        AND i.customer_id = ?
    `;

    const summary = db.prepare(query).get(item_id, customer_id) as any;

    if (!summary || !summary.transaction_count) {
      return null;
    }

    const lastSaleQuery = `
      SELECT
        i.invoice_no AS last_invoice_id,
        i.invoice_date AS invoice_date,
        CASE
          WHEN ii.discount_type = 'percentage' THEN
            (ii.unit_price * (1.0 - COALESCE(ii.discount_value, 0) / 100.0)) * (1.0 + COALESCE(ii.tax_rate, 0) / 100.0)
          ELSE
            (ii.unit_price - COALESCE(ii.discount_value, 0) * 1.0 / ii.quantity) * (1.0 + COALESCE(ii.tax_rate, 0) / 100.0)
        END AS last_price
      FROM invoice_items ii
      INNER JOIN invoices i ON ii.invoice_id = i.id
      WHERE ii.item_id = ?
        AND i.customer_id = ?
      ORDER BY i.invoice_date DESC, i.id DESC
      LIMIT 1
    `;

    const lastSale = db.prepare(lastSaleQuery).get(item_id, customer_id) as any;

    return {
      customer_name: summary.customer_name,
      transaction_count: summary.transaction_count,
      lowest_price: summary.lowest_price,
      highest_price: summary.highest_price,
      avg_price: summary.avg_price,
      last_price: lastSale?.last_price,
      last_invoice_id: lastSale?.last_invoice_id,
      invoice_date: lastSale?.invoice_date
    };
  }

  static delete(id: number, userId: number, db: Database.Database): boolean {
    const sale = this.getById(id, db);

    if (!sale) {
      throw new Error('Sale not found');
    }

    db.prepare('DELETE FROM sales WHERE id = ?').run(id);

    db.prepare(`
      INSERT INTO activity_log (user_id, action, entity_type, entity_id, description)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      userId,
      'DELETE',
      'Sale',
      id,
      `Deleted sale ${sale.sale_no}`
    );

    return true;
  }
}

export default SaleModel;
