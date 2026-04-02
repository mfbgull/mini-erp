import Database from 'better-sqlite3';

export interface Invoice {
  id: number;
  invoice_no: string;
  customer_id: number;
  customer_name?: string;
  so_id?: number; // Sales Order ID
  source_type?: 'SALES_ORDER' | 'DIRECT' | null;
  quotation_id?: number; // Direct link to quotation (if created via SO from quotation)
  invoice_date: string;
  due_date?: string;
  status: 'Draft' | 'Sent' | 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled';
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  discount_scope?: string;
  discount_type?: string;
  discount_value?: number;
  notes?: string;
  terms?: string;
  warehouse_id?: number;
  warehouse_code?: string;
  warehouse_name?: string;
  created_by: number;
  created_by_username?: string;
  created_at: string;
  updated_at: string;
  items?: InvoiceItem[];
  so_no?: string; // Joined field when source_type is 'SALES_ORDER'
  quotation_no?: string; // Joined field when quotation_id exists
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  item_id: number;
  item_code: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  amount: number;
  tax_rate: number;
  discount_type: 'none' | 'percentage' | 'flat';
  discount_value: number;
}

export interface CreateInvoiceDTO {
  customer_id: number;
  customer_name?: string;
  so_id?: number;
  source_type?: 'SALES_ORDER' | 'DIRECT' | null;
  quotation_id?: number;
  invoice_date: string;
  due_date?: string;
  status?: 'Draft' | 'Sent' | 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled';
  notes?: string;
  terms?: string;
  warehouse_id?: number;
  items: CreateInvoiceItemDTO[];
  discount_scope?: string;
  discount_type?: string;
  discount_value?: number;
}

export interface CreateInvoiceItemDTO {
  item_id: number;
  quantity: number;
  unit_price: number;
  tax_rate?: number;
  discount_type?: 'none' | 'percentage' | 'flat';
  discount_value?: number;
}

export interface UpdateInvoiceDTO {
  customer_id?: number;
  customer_name?: string;
  invoice_date?: string;
  due_date?: string;
  status?: 'Draft' | 'Sent' | 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled';
  notes?: string;
  terms?: string;
  warehouse_id?: number;
  items?: CreateInvoiceItemDTO[];
  discount_scope?: string;
  discount_type?: string;
  discount_value?: number;
}

export interface InvoiceFilters {
  status?: string;
  customer_id?: number;
  customer_name?: string;
  start_date?: string;
  end_date?: string;
  source_type?: string;
  so_id?: number;
  limit?: number;
}

class InvoiceModel {
  /**
   * Get invoice by ID with items and source links
   */
  static getById(id: number, db: Database.Database): Invoice | undefined {
    const invoice = db.prepare(`
      SELECT
        i.*,
        so.so_no,
        q.quotation_no,
        w.warehouse_code,
        w.warehouse_name,
        u.username as created_by_username
      FROM invoices i
      LEFT JOIN sales_orders so ON i.so_id = so.id
      LEFT JOIN quotations q ON i.quotation_id = q.id
      LEFT JOIN warehouses w ON i.warehouse_id = w.id
      LEFT JOIN users u ON i.created_by = u.id
      WHERE i.id = ?
    `).get(id) as Invoice | undefined;

    if (!invoice) {
      return undefined;
    }

    // Get items
    const items = db.prepare(`
      SELECT
        id, invoice_id, item_id, item_code, item_name,
        quantity, unit_price, amount, tax_rate, discount_type, discount_value
      FROM invoice_items
      WHERE invoice_id = ?
      ORDER BY id
    `).all(id) as InvoiceItem[];

    return {
      ...invoice,
      items
    };
  }

  /**
   * Get all invoices with filters
   */
  static getAll(filters: InvoiceFilters = {}, db: Database.Database): Invoice[] {
    let query = `
      SELECT
        i.*,
        so.so_no,
        q.quotation_no,
        w.warehouse_code,
        w.warehouse_name,
        u.username as created_by_username
      FROM invoices i
      LEFT JOIN sales_orders so ON i.so_id = so.id
      LEFT JOIN quotations q ON i.quotation_id = q.id
      LEFT JOIN warehouses w ON i.warehouse_id = w.id
      LEFT JOIN users u ON i.created_by = u.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (filters.status) {
      query += ` AND i.status = ?`;
      params.push(filters.status);
    }

    if (filters.customer_id) {
      query += ` AND i.customer_id = ?`;
      params.push(filters.customer_id);
    }

    if (filters.customer_name) {
      query += ` AND i.customer_name LIKE ?`;
      params.push(`%${filters.customer_name}%`);
    }

    if (filters.start_date) {
      query += ` AND i.invoice_date >= ?`;
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      query += ` AND i.invoice_date <= ?`;
      params.push(filters.end_date);
    }

    if (filters.source_type) {
      query += ` AND i.source_type = ?`;
      params.push(filters.source_type);
    }

    if (filters.so_id) {
      query += ` AND i.so_id = ?`;
      params.push(filters.so_id);
    }

    query += ` ORDER BY i.invoice_date DESC, i.created_at DESC`;

    if (filters.limit) {
      query += ` LIMIT ?`;
      params.push(filters.limit);
    }

    const invoices = db.prepare(query).all(...params) as Invoice[];

    // Get items for each invoice
    return invoices.map(invoice => {
      const items = db.prepare(`
        SELECT
          id, invoice_id, item_id, item_code, item_name,
          quantity, unit_price, amount, tax_rate, discount_type, discount_value
        FROM invoice_items
        WHERE invoice_id = ?
        ORDER BY id
      `).all(invoice.id) as InvoiceItem[];

      return {
        ...invoice,
        items
      };
    });
  }

  /**
   * Get sales cycle chain for an invoice (quotation -> SO -> invoice)
   */
  static getSalesCycleChain(invoiceId: number, db: Database.Database): {
    quotation: any | undefined;
    salesOrder: any | undefined;
    invoice: Invoice | undefined;
  } {
    const invoice = this.getById(invoiceId, db);

    let salesOrder = undefined;
    let quotation = undefined;

    if (invoice?.so_id) {
      salesOrder = db.prepare(`
        SELECT
          so.*,
          w.warehouse_code,
          w.warehouse_name,
          u.username as created_by_username,
          q.quotation_no
        FROM sales_orders so
        LEFT JOIN warehouses w ON so.warehouse_id = w.id
        LEFT JOIN users u ON so.created_by = u.id
        LEFT JOIN quotations q ON so.source_id = q.id AND so.source_type = 'QUOTATION'
        WHERE so.id = ?
      `).get(invoice.so_id) as any | undefined;

      // Get quotation if SO has source
      if (salesOrder?.source_type === 'QUOTATION' && salesOrder.source_id) {
        quotation = db.prepare(`
          SELECT
            q.*,
            w.warehouse_code,
            w.warehouse_name,
            u.username as created_by_username
          FROM quotations q
          LEFT JOIN warehouses w ON q.warehouse_id = w.id
          LEFT JOIN users u ON q.created_by = u.id
          WHERE q.id = ?
        `).get(salesOrder.source_id) as any | undefined;
      }
    } else if (invoice?.quotation_id) {
      // Direct quotation link (if invoice was created directly from quotation)
      quotation = db.prepare(`
        SELECT
          q.*,
          w.warehouse_code,
          w.warehouse_name,
          u.username as created_by_username
        FROM quotations q
        LEFT JOIN warehouses w ON q.warehouse_id = w.id
        LEFT JOIN users u ON q.created_by = u.id
        WHERE q.id = ?
      `).get(invoice.quotation_id) as any | undefined;
    }

    return {
      quotation,
      salesOrder,
      invoice
    };
  }

  /**
   * Get invoices by sales order ID
   */
  static getBySalesOrderId(soId: number, db: Database.Database): Invoice[] {
    return this.getAll({ so_id: soId }, db);
  }

  /**
   * Get invoices by quotation ID (via SO or direct)
   */
  static getByQuotationId(quotationId: number, db: Database.Database): Invoice[] {
    const query = `
      SELECT
        i.*,
        so.so_no,
        q.quotation_no,
        w.warehouse_code,
        w.warehouse_name,
        u.username as created_by_username
      FROM invoices i
      LEFT JOIN sales_orders so ON i.so_id = so.id AND so.source_id = ?
      LEFT JOIN quotations q ON i.quotation_id = q.id OR (so.source_id = q.id)
      LEFT JOIN warehouses w ON i.warehouse_id = w.id
      LEFT JOIN users u ON i.created_by = u.id
      WHERE i.quotation_id = ? OR i.so_id IN (SELECT id FROM sales_orders WHERE source_id = ?)
      ORDER BY i.invoice_date DESC
    `;

    const invoices = db.prepare(query).all(quotationId, quotationId, quotationId) as Invoice[];

    // Get items for each invoice
    return invoices.map(invoice => {
      const items = db.prepare(`
        SELECT
          id, invoice_id, item_id, item_code, item_name,
          quantity, unit_price, amount, tax_rate, discount_type, discount_value
        FROM invoice_items
        WHERE invoice_id = ?
        ORDER BY id
      `).all(invoice.id) as InvoiceItem[];

      return {
        ...invoice,
        items
      };
    });
  }

  /**
   * Update invoice source tracking (used when converting SO to invoice)
   */
  static updateSourceTracking(
    invoiceId: number,
    soId: number,
    quotationId: number | null,
    db: Database.Database
  ): void {
    db.prepare(`
      UPDATE invoices
      SET source_type = 'SALES_ORDER',
          so_id = ?,
          quotation_id = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(soId, quotationId, invoiceId);
  }

  /**
   * Get invoice statistics by customer
   */
  static getStatsByCustomer(customerId: number, db: Database.Database): {
    total_invoices: number;
    total_amount: number;
    paid_amount: number;
    outstanding_amount: number;
    avg_invoice_value: number;
  } {
    return db.prepare(`
      SELECT
        COUNT(*) as total_invoices,
        COALESCE(SUM(total_amount), 0) as total_amount,
        COALESCE(SUM(paid_amount), 0) as paid_amount,
        COALESCE(SUM(balance_amount), 0) as outstanding_amount,
        COALESCE(AVG(total_amount), 0) as avg_invoice_value
      FROM invoices
      WHERE customer_id = ?
    `).get(customerId) as {
      total_invoices: number;
      total_amount: number;
      paid_amount: number;
      outstanding_amount: number;
      avg_invoice_value: number;
    };
  }

  /**
   * Get invoice statistics by date range
   */
  static getStatsByDateRange(
    startDate: string,
    endDate: string,
    db: Database.Database
  ): {
    total_invoices: number;
    total_amount: number;
    paid_amount: number;
    outstanding_amount: number;
    avg_invoice_value: number;
  } {
    return db.prepare(`
      SELECT
        COUNT(*) as total_invoices,
        COALESCE(SUM(total_amount), 0) as total_amount,
        COALESCE(SUM(paid_amount), 0) as paid_amount,
        COALESCE(SUM(balance_amount), 0) as outstanding_amount,
        COALESCE(AVG(total_amount), 0) as avg_invoice_value
      FROM invoices
      WHERE invoice_date BETWEEN ? AND ?
    `).get(startDate, endDate) as {
      total_invoices: number;
      total_amount: number;
      paid_amount: number;
      outstanding_amount: number;
      avg_invoice_value: number;
    };
  }
}

export default InvoiceModel;
