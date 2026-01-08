import Database from 'better-sqlite3';

interface PurchaseOrder {
  id: number;
  po_no: string;
  supplier_id: number;
  po_date: string;
  expected_delivery_date?: string;
  status: string;
  total_amount: number;
  notes?: string;
  warehouse_id?: number;
  created_by: number;
  created_at?: string;
  updated_at?: string;
  supplier_name?: string;
  supplier_code?: string;
  warehouse_name?: string;
  warehouse_code?: string;
  created_by_username?: string;
}

interface PurchaseOrderItem {
  id: number;
  po_id: number;
  item_id: number;
  quantity: number;
  received_quantity: number;
  unit_price: number;
  amount: number;
  item_code?: string;
  item_name?: string;
  unit_of_measure?: string;
  pending_quantity?: number;
}

interface GoodsReceipt {
  id: number;
  receipt_no: string;
  po_id: number;
  receipt_date: string;
  warehouse_id: number;
  remarks?: string;
  created_by: number;
  created_at?: string;
  warehouse_name?: string;
  created_by_username?: string;
  total_quantity?: number;
  total_amount?: number;
}

interface GoodsReceiptItem {
  id: number;
  receipt_id: number;
  po_item_id: number;
  item_id: number;
  received_quantity: number;
  item_code?: string;
  item_name?: string;
  unit_of_measure?: string;
}

interface CreatePurchaseOrderDTO {
  supplier_id: number;
  po_date: string;
  expected_delivery_date?: string;
  status?: string;
  notes?: string;
  warehouse_id?: number;
  items: Array<{
    item_id: number;
    quantity: number;
    unit_price: number;
  }>;
}

interface CreateGoodsReceiptDTO {
  po_id: number;
  receipt_date: string;
  warehouse_id: number;
  remarks?: string;
  items: Array<{
    po_item_id: number;
    received_quantity: number;
  }>;
}

interface PurchaseOrderFilters {
  supplier_id?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}

class PurchaseOrderModel {
  static create(data: CreatePurchaseOrderDTO, userId: number, db: Database.Database): PurchaseOrder {
    const { supplier_id, po_date, expected_delivery_date, status = 'Draft', notes, warehouse_id, items } = data;

    if (!items || items.length === 0) {
      throw new Error('At least one item is required');
    }

    const transaction = db.transaction(() => {
      // Generate PO number
      const poNo = this.generatePONo(db);

      // Calculate total amount
      const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

      // Insert PO header
      const poStmt = db.prepare(`
        INSERT INTO purchase_orders (
          po_no, supplier_id, po_date, expected_delivery_date,
          status, total_amount, notes, warehouse_id, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const poResult = poStmt.run(
        poNo,
        supplier_id,
        po_date,
        expected_delivery_date || null,
        status,
        totalAmount,
        notes || null,
        warehouse_id || null,
        userId
      );

      const poId = poResult.lastInsertRowid as number;

      // Insert PO items
      const itemStmt = db.prepare(`
        INSERT INTO purchase_order_items (
          po_id, item_id, quantity, unit_price, amount
        ) VALUES (?, ?, ?, ?, ?)
      `);

      for (const item of items) {
        const amount = item.quantity * item.unit_price;
        itemStmt.run(poId, item.item_id, item.quantity, item.unit_price, amount);
      }

      // Create AP ledger entry (if submitted)
      if (status === 'Submitted') {
        SupplierLedgerModel.createEntry({
          supplier_id,
          transaction_date: po_date,
          transaction_type: 'PURCHASE_ORDER',
          reference_no: poNo,
          debit: totalAmount,
          credit: 0,
          description: `Purchase Order ${poNo}`
        }, db);
      }

      // Log activity
      db.prepare(`
        INSERT INTO activity_log (user_id, action, entity_type, entity_id, description)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        userId,
        'CREATE',
        'PurchaseOrder',
        poId,
        `Created PO ${poNo} with ${items.length} items`
      );

      return this.getById(poId, db) as PurchaseOrder;
    });

    return transaction();
  }

  static generatePONo(db: Database.Database): string {
    const year = new Date().getFullYear();
    const settingKey = `PO_last_no_${year}`;

    const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get(settingKey) as { value: string } | undefined;

    let nextNo = 1;
    if (setting) {
      nextNo = parseInt(setting.value) + 1;
    }

    db.prepare(`
      INSERT OR REPLACE INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `).run(settingKey, nextNo.toString());

    return `PO-${year}-${nextNo.toString().padStart(4, '0')}`;
  }

  static getAll(filters: PurchaseOrderFilters = {}, db: Database.Database): PurchaseOrder[] {
    let query = `
      SELECT
        po.*,
        s.supplier_name,
        s.supplier_code,
        w.warehouse_name,
        w.warehouse_code,
        u.username as created_by_username
      FROM purchase_orders po
      JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN warehouses w ON po.warehouse_id = w.id
      JOIN users u ON po.created_by = u.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (filters.supplier_id) {
      query += ` AND po.supplier_id = ?`;
      params.push(filters.supplier_id);
    }

    if (filters.status) {
      query += ` AND po.status = ?`;
      params.push(filters.status);
    }

    if (filters.start_date) {
      query += ` AND po.po_date >= ?`;
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      query += ` AND po.po_date <= ?`;
      params.push(filters.end_date);
    }

    query += ` ORDER BY po.po_date DESC, po.created_at DESC`;

    if (filters.limit) {
      query += ` LIMIT ?`;
      params.push(filters.limit);
    }

    return db.prepare(query).all(...params) as PurchaseOrder[];
  }

  static getById(id: number, db: Database.Database): PurchaseOrder | undefined {
    return db.prepare(`
      SELECT
        po.*,
        s.supplier_name,
        s.supplier_code,
        w.warehouse_name,
        w.warehouse_code,
        u.username as created_by_username
      FROM purchase_orders po
      JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN warehouses w ON po.warehouse_id = w.id
      JOIN users u ON po.created_by = u.id
      WHERE po.id = ?
    `).get(id) as PurchaseOrder | undefined;
  }

  static getItems(poId: number, db: Database.Database): PurchaseOrderItem[] {
    return db.prepare(`
      SELECT
        poi.*,
        i.item_code,
        i.item_name,
        i.unit_of_measure,
        (poi.quantity - poi.received_quantity) as pending_quantity
      FROM purchase_order_items poi
      JOIN items i ON poi.item_id = i.id
      WHERE poi.po_id = ?
      ORDER BY poi.id
    `).all(poId) as PurchaseOrderItem[];
  }

  static update(id: number, data: Partial<CreatePurchaseOrderDTO>, userId: number, db: Database.Database): PurchaseOrder {
    const po = this.getById(id, db);

    if (!po) {
      throw new Error('Purchase Order not found');
    }

    if (po.status !== 'Draft') {
      throw new Error('Only Draft Purchase Orders can be edited');
    }

    const { supplier_id, po_date, expected_delivery_date, notes, warehouse_id } = data;

    const transaction = db.transaction(() => {
      // Recalculate total from existing items
      const totalAmount = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM purchase_order_items
        WHERE po_id = ?
      `).get(id) as { total: number };

      const stmt = db.prepare(`
        UPDATE purchase_orders
        SET supplier_id = COALESCE(?, supplier_id),
            po_date = COALESCE(?, po_date),
            expected_delivery_date = COALESCE(?, expected_delivery_date),
            total_amount = ?,
            notes = COALESCE(?, notes),
            warehouse_id = COALESCE(?, warehouse_id),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      stmt.run(
        supplier_id || null,
        po_date || null,
        expected_delivery_date || null,
        totalAmount.total,
        notes || null,
        warehouse_id || null,
        id
      );

      db.prepare(`
        INSERT INTO activity_log (user_id, action, entity_type, entity_id, description)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        userId,
        'UPDATE',
        'PurchaseOrder',
        id,
        `Updated PO ${po.po_no}`
      );

      return this.getById(id, db) as PurchaseOrder;
    });

    return transaction();
  }

  static addItem(poId: number, itemData: { item_id: number; quantity: number; unit_price: number }, db: Database.Database): PurchaseOrderItem {
    const po = this.getById(poId, db);

    if (!po) {
      throw new Error('Purchase Order not found');
    }

    if (po.status !== 'Draft') {
      throw new Error('Cannot add items to non-Draft Purchase Orders');
    }

    const transaction = db.transaction(() => {
      const amount = itemData.quantity * itemData.unit_price;

      const stmt = db.prepare(`
        INSERT INTO purchase_order_items (po_id, item_id, quantity, unit_price, amount)
        VALUES (?, ?, ?, ?, ?)
      `);

      const result = stmt.run(poId, itemData.item_id, itemData.quantity, itemData.unit_price, amount);

      // Update total
      const totalAmount = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM purchase_order_items
        WHERE po_id = ?
      `).get(poId) as { total: number };

      db.prepare(`
        UPDATE purchase_orders
        SET total_amount = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(totalAmount.total, poId);

      return db.prepare(`
        SELECT poi.*, i.item_code, i.item_name, i.unit_of_measure
        FROM purchase_order_items poi
        JOIN items i ON poi.item_id = i.id
        WHERE poi.id = ?
      `).get(result.lastInsertRowid) as PurchaseOrderItem;
    });

    return transaction();
  }

  static updateItem(itemId: number, itemData: { quantity: number; unit_price: number }, db: Database.Database): PurchaseOrderItem {
    const item = db.prepare(`
      SELECT poi.*, po.status
      FROM purchase_order_items poi
      JOIN purchase_orders po ON poi.po_id = po.id
      WHERE poi.id = ?
    `).get(itemId) as { po_id: number; status: string } | undefined;

    if (!item) {
      throw new Error('Purchase Order Item not found');
    }

    if (item.status !== 'Draft') {
      throw new Error('Cannot edit items in non-Draft Purchase Orders');
    }

    const amount = itemData.quantity * itemData.unit_price;

    const transaction = db.transaction(() => {
      db.prepare(`
        UPDATE purchase_order_items
        SET quantity = ?, unit_price = ?, amount = ?
        WHERE id = ?
      `).run(itemData.quantity, itemData.unit_price, amount, itemId);

      // Update PO total
      const totalAmount = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM purchase_order_items
        WHERE po_id = ?
      `).get(item.po_id) as { total: number };

      db.prepare(`
        UPDATE purchase_orders
        SET total_amount = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(totalAmount.total, item.po_id);

      return db.prepare(`
        SELECT poi.*, i.item_code, i.item_name, i.unit_of_measure
        FROM purchase_order_items poi
        JOIN items i ON poi.item_id = i.id
        WHERE poi.id = ?
      `).get(itemId) as PurchaseOrderItem;
    });

    return transaction();
  }

  static removeItem(itemId: number, db: Database.Database): boolean {
    const item = db.prepare(`
      SELECT poi.*, po.status
      FROM purchase_order_items poi
      JOIN purchase_orders po ON poi.po_id = po.id
      WHERE poi.id = ?
    `).get(itemId) as { po_id: number; status: string } | undefined;

    if (!item) {
      throw new Error('Purchase Order Item not found');
    }

    if (item.status !== 'Draft') {
      throw new Error('Cannot remove items from non-Draft Purchase Orders');
    }

    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM purchase_order_items WHERE id = ?').run(itemId);

      // Update PO total
      const totalAmount = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM purchase_order_items
        WHERE po_id = ?
      `).get(item.po_id) as { total: number };

      db.prepare(`
        UPDATE purchase_orders
        SET total_amount = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(totalAmount.total, item.po_id);

      return true;
    });

    return transaction();
  }

  static updateStatus(id: number, status: string, userId: number, db: Database.Database): PurchaseOrder {
    const po = this.getById(id, db);

    if (!po) {
      throw new Error('Purchase Order not found');
    }

    const validTransitions: Record<string, string[]> = {
      'Draft': ['Submitted', 'Cancelled'],
      'Submitted': ['Partially Received', 'Cancelled'],
      'Partially Received': ['Completed', 'Cancelled'],
      'Completed': [],
      'Cancelled': []
    };

    if (!validTransitions[po.status]?.includes(status)) {
      throw new Error(`Cannot transition from ${po.status} to ${status}`);
    }

    const transaction = db.transaction(() => {
      db.prepare(`
        UPDATE purchase_orders
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(status, id);

      // Create AP ledger entry if submitting
      if (status === 'Submitted' && po.status !== 'Submitted') {
        SupplierLedgerModel.createEntry({
          supplier_id: po.supplier_id,
          transaction_date: po.po_date,
          transaction_type: 'PURCHASE_ORDER',
          reference_no: po.po_no,
          debit: po.total_amount,
          credit: 0,
          description: `Purchase Order ${po.po_no}`
        }, db);
      }

      db.prepare(`
        INSERT INTO activity_log (user_id, action, entity_type, entity_id, description)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        userId,
        'UPDATE',
        'PurchaseOrder',
        id,
        `Changed PO ${po.po_no} status from ${po.status} to ${status}`
      );

      return this.getById(id, db) as PurchaseOrder;
    });

    return transaction();
  }

  static delete(id: number, userId: number, db: Database.Database): boolean {
    const po = this.getById(id, db);

    if (!po) {
      throw new Error('Purchase Order not found');
    }

    if (po.status !== 'Draft') {
      throw new Error('Only Draft Purchase Orders can be deleted');
    }

    db.prepare('DELETE FROM purchase_orders WHERE id = ?').run(id);

    db.prepare(`
      INSERT INTO activity_log (user_id, action, entity_type, entity_id, description)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      userId,
      'DELETE',
      'PurchaseOrder',
      id,
      `Deleted PO ${po.po_no}`
    );

    return true;
  }

  static getReceipts(poId: number, db: Database.Database): GoodsReceipt[] {
    return db.prepare(`
      SELECT
        gr.*,
        w.warehouse_name,
        u.username as created_by_username,
        COALESCE(SUM(gri.received_quantity), 0) as total_quantity,
        COALESCE(SUM(gri.received_quantity * poi.unit_price), 0) as total_amount
      FROM goods_receipts gr
      LEFT JOIN warehouses w ON gr.warehouse_id = w.id
      JOIN users u ON gr.created_by = u.id
      LEFT JOIN goods_receipt_items gri ON gr.id = gri.receipt_id
      LEFT JOIN purchase_order_items poi ON gri.po_item_id = poi.id
      WHERE gr.po_id = ?
      GROUP BY gr.id
      ORDER BY gr.receipt_date DESC, gr.created_at DESC
    `).all(poId) as GoodsReceipt[];
  }

  static addReceipt(data: CreateGoodsReceiptDTO, userId: number, db: Database.Database): GoodsReceipt {
    const { po_id, receipt_date, warehouse_id, remarks, items } = data;

    if (!items || items.length === 0) {
      throw new Error('At least one item must be received');
    }

    const po = this.getById(po_id, db);

    if (!po) {
      throw new Error('Purchase Order not found');
    }

    if (po.status === 'Draft' || po.status === 'Cancelled') {
      throw new Error('Cannot receive items for Draft or Cancelled Purchase Orders');
    }

    const transaction = db.transaction(() => {
      // Validate quantities
      for (const receiptItem of items) {
        const poItem = db.prepare(`
          SELECT * FROM purchase_order_items WHERE id = ?
        `).get(receiptItem.po_item_id) as { po_id: number; quantity: number; received_quantity: number; item_id: number };

        if (!poItem) {
          throw new Error('Purchase Order Item not found');
        }

        const pending = poItem.quantity - poItem.received_quantity;
        if (receiptItem.received_quantity > pending) {
          throw new Error(`Cannot receive more than pending quantity (${pending})`);
        }
      }

      // Generate receipt number
      const receiptNo = this.generateReceiptNo(db);

      // Insert goods receipt
      const receiptStmt = db.prepare(`
        INSERT INTO goods_receipts (
          receipt_no, po_id, receipt_date, warehouse_id, remarks, created_by
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);

      const receiptResult = receiptStmt.run(
        receiptNo,
        po_id,
        receipt_date,
        warehouse_id,
        remarks || null,
        userId
      );

      const receiptId = receiptResult.lastInsertRowid as number;

      // Insert receipt items and update PO items
      const receiptItemStmt = db.prepare(`
        INSERT INTO goods_receipt_items (receipt_id, po_item_id, item_id, received_quantity)
        VALUES (?, ?, ?, ?)
      `);

      let totalQuantity = 0;
      let totalAmount = 0;

      for (const receiptItem of items) {
        const poItem = db.prepare(`
          SELECT * FROM purchase_order_items WHERE id = ?
        `).get(receiptItem.po_item_id) as { po_id: number; item_id: number; quantity: number; received_quantity: number; unit_price: number };

        receiptItemStmt.run(receiptId, receiptItem.po_item_id, poItem.item_id, receiptItem.received_quantity);

        // Update PO item received_quantity
        const newReceived = poItem.received_quantity + receiptItem.received_quantity;
        db.prepare(`
          UPDATE purchase_order_items
          SET received_quantity = ?
          WHERE id = ?
        `).run(newReceived, receiptItem.po_item_id);

        // Create stock movement
        db.prepare(`
          INSERT INTO stock_movements (
            movement_no, item_id, warehouse_id, movement_type,
            quantity, unit_cost, reference_doctype, reference_docno,
            remarks, movement_date, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          'STK-' + new Date().getFullYear() + '-' + Date.now(),
          poItem.item_id,
          warehouse_id,
          'PURCHASE',
          receiptItem.received_quantity,
          poItem.unit_price,
          'GOODS_RECEIPT',
          receiptNo,
          `Receipt ${receiptNo} against PO ${po.po_no}`,
          receipt_date,
          userId
        );

        // Update stock balance
        const existingBalance = db.prepare(`
          SELECT * FROM stock_balances
          WHERE item_id = ? AND warehouse_id = ?
        `).get(poItem.item_id, warehouse_id) as any;

        if (existingBalance) {
          db.prepare(`
            UPDATE stock_balances
            SET quantity = quantity + ?, last_updated = CURRENT_TIMESTAMP
            WHERE item_id = ? AND warehouse_id = ?
          `).run(receiptItem.received_quantity, poItem.item_id, warehouse_id);
        } else {
          db.prepare(`
            INSERT INTO stock_balances (item_id, warehouse_id, quantity)
            VALUES (?, ?, ?)
          `).run(poItem.item_id, warehouse_id, receiptItem.received_quantity);
        }

        totalQuantity += receiptItem.received_quantity;
        totalAmount += receiptItem.received_quantity * poItem.unit_price;
      }

      // Update item current_stock
      for (const receiptItem of items) {
        const poItem = db.prepare(`
          SELECT item_id FROM purchase_order_items WHERE id = ?
        `).get(receiptItem.po_item_id) as { item_id: number };

        db.prepare(`
          UPDATE items
          SET current_stock = (
            SELECT COALESCE(SUM(quantity), 0)
            FROM stock_balances
            WHERE item_id = ?
          )
          WHERE id = ?
        `).run(poItem.item_id, poItem.item_id);
      }

      // Calculate and update PO status
      const newStatus = this.calculateStatus(po_id, db);
      if (newStatus !== po.status) {
        db.prepare(`
          UPDATE purchase_orders
          SET status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(newStatus, po_id);
      }

      // Log activity
      db.prepare(`
        INSERT INTO activity_log (user_id, action, entity_type, entity_id, description)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        userId,
        'CREATE',
        'GoodsReceipt',
        receiptId,
        `Recorded receipt ${receiptNo}: ${totalQuantity} units, ${totalAmount.toFixed(2)} total`
      );

      return db.prepare(`
        SELECT
          gr.*,
          w.warehouse_name,
          u.username as created_by_username
        FROM goods_receipts gr
        LEFT JOIN warehouses w ON gr.warehouse_id = w.id
        JOIN users u ON gr.created_by = u.id
        WHERE gr.id = ?
      `).get(receiptId) as GoodsReceipt;
    });

    return transaction();
  }

  static generateReceiptNo(db: Database.Database): string {
    const year = new Date().getFullYear();
    const settingKey = `GR_last_no_${year}`;

    const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get(settingKey) as { value: string } | undefined;

    let nextNo = 1;
    if (setting) {
      nextNo = parseInt(setting.value) + 1;
    }

    db.prepare(`
      INSERT OR REPLACE INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `).run(settingKey, nextNo.toString());

    return `GR-${year}-${nextNo.toString().padStart(4, '0')}`;
  }

  static calculateStatus(poId: number, db: Database.Database): string {
    const result = db.prepare(`
      SELECT
        COUNT(*) as total_items,
        SUM(CASE WHEN received_quantity > 0 THEN 1 ELSE 0 END) as items_received,
        SUM(CASE WHEN received_quantity >= quantity THEN 1 ELSE 0 END) as items_completed
      FROM purchase_order_items
      WHERE po_id = ?
    `).get(poId) as { total_items: number; items_received: number; items_completed: number };

    if (result.items_completed === result.total_items) {
      return 'Completed';
    } else if (result.items_received > 0) {
      return 'Partially Received';
    } else {
      return 'Submitted'; // Default if not Draft
    }
  }

  static getSummaryBySupplier(supplierId: number, db: Database.Database) {
    return db.prepare(`
      SELECT
        COUNT(*) as total_pos,
        SUM(CASE WHEN status = 'Draft' THEN 1 ELSE 0 END) as draft_pos,
        SUM(CASE WHEN status = 'Submitted' THEN 1 ELSE 0 END) as submitted_pos,
        SUM(CASE WHEN status = 'Partially Received' THEN 1 ELSE 0 END) as partially_received_pos,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_pos,
        SUM(total_amount) as total_value
      FROM purchase_orders
      WHERE supplier_id = ?
    `).get(supplierId);
  }

  static getPendingOrders(db: Database.Database): PurchaseOrder[] {
    return this.getAll({ status: 'Submitted' }, db);
  }
}

// Import SupplierLedgerModel at the bottom to avoid circular dependency
import SupplierLedgerModel from './SupplierLedger';

export default PurchaseOrderModel;
