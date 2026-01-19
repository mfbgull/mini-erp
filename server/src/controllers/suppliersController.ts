import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import { logCRUD, ActionType } from '../services/activityLogger';
import db from '../config/database';

function getSuppliers(req: Request, res: Response): void {
  try {
    const query = `
      SELECT 
        id,
        supplier_code,
        supplier_name,
        contact_person,
        email,
        phone,
        address,
        payment_terms,
        is_active,
        created_at,
        updated_at
      FROM suppliers
      WHERE is_active = 1
      ORDER BY supplier_name
    `;

    const suppliers = db.prepare(query).all();

    res.json({
      success: true,
      data: suppliers
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch suppliers'
    });
  }
}

function createSupplier(req: Request, res: Response): void {
  try {
    const {
      supplier_code,
      supplier_name,
      contact_person,
      email,
      phone,
      address,
      payment_terms
    } = req.body;

    if (!supplier_code || !supplier_name) {
      res.status(400).json({
        success: false,
        error: 'Supplier code and name are required'
      });
      return;
    }

    const query = `
      INSERT INTO suppliers (
        supplier_code,
        supplier_name,
        contact_person,
        email,
        phone,
        address,
        payment_terms
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const result = db.prepare(query).run(
      supplier_code,
      supplier_name,
      contact_person || null,
      email || null,
      phone || null,
      address || null,
      payment_terms || null
    );

    // Log supplier creation using activity logger
    logCRUD(ActionType.SUPPLIER_CREATE, 'Supplier', result.lastInsertRowid as number, `Created supplier: ${supplier_name} (${supplier_code})`, (req as AuthRequest).user?.id);

    res.status(201).json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        supplier_code,
        supplier_name,
        contact_person,
        email,
        phone,
        address,
        payment_terms
      }
    });
  } catch (error: any) {
    console.error('Error creating supplier:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({
        success: false,
        error: 'Supplier code already exists'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to create supplier'
      });
    }
  }
}

function updateSupplier(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const {
      supplier_name,
      contact_person,
      email,
      phone,
      address,
      payment_terms,
      is_active
    } = req.body;

    const query = `
      UPDATE suppliers SET
        supplier_name = ?,
        contact_person = ?,
        email = ?,
        phone = ?,
        address = ?,
        payment_terms = ?,
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const result = db.prepare(query).run(
      supplier_name,
      contact_person || null,
      email || null,
      phone || null,
      address || null,
      payment_terms || null,
      is_active !== undefined ? (is_active ? 1 : 0) : 1,
      id
    );

    if (result.changes === 0) {
      res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
      return;
    }

    // Log supplier update using activity logger
    const supplierId = Array.isArray(id) ? id[0] : id;
    logCRUD(ActionType.SUPPLIER_UPDATE, 'Supplier', parseInt(supplierId, 10), `Updated supplier: ${supplier_name}`, (req as AuthRequest).user?.id);

    res.json({
      success: true,
      data: {
        id: parseInt(supplierId, 10),
        supplier_name,
        contact_person,
        email,
        phone,
        address,
        payment_terms,
        is_active: is_active !== undefined ? (is_active ? 1 : 0) : 1
      }
    });
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update supplier'
    });
  }
}

function deleteSupplier(req: Request, res: Response): void {
  try {
    const { id } = req.params;

    // Check if supplier has any purchase orders
    const checkQuery = `SELECT COUNT(*) as count FROM purchase_orders WHERE supplier_id = ?`;
    const checkResult = db.prepare(checkQuery).get(id) as { count: number };

    if (checkResult.count > 0) {
      res.status(400).json({
        success: false,
        error: 'Cannot delete supplier with existing purchase orders'
      });
      return;
    }

    const query = `DELETE FROM suppliers WHERE id = ?`;
    const result = db.prepare(query).run(id);

    if (result.changes === 0) {
      res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
      return;
    }

    // Log supplier deletion using activity logger
    const deleteId = Array.isArray(id) ? id[0] : id;
    const existingSupplier = db.prepare('SELECT supplier_name, supplier_code FROM suppliers WHERE id = ?').get(deleteId) as { supplier_name?: string, supplier_code?: string } | undefined;
    logCRUD(ActionType.SUPPLIER_DELETE, 'Supplier', parseInt(deleteId, 10), `Deleted supplier: ${existingSupplier?.supplier_name || 'Unknown'} (${existingSupplier?.supplier_code || 'N/A'})`, (req as AuthRequest).user?.id);

    res.json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete supplier'
    });
  }
}

function getSupplierById(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const query = `
      SELECT * FROM suppliers
      WHERE id = ?
    `;
    const supplier = db.prepare(query).get(id);
    if (!supplier) {
      res.status(404).json({ success: false, error: 'Supplier not found' });
      return;
    }
    res.json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch supplier' });
  }
}

function getNextSupplierCode(req: Request, res: Response): void {
  try {
    const query = `SELECT COUNT(*) as count FROM suppliers`;
    const result = db.prepare(query).get() as { count: number };
    const nextNumber = result.count + 1;
    const code = `SUP${String(nextNumber).padStart(4, '0')}`;
    res.json({ success: true, data: { code } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate supplier code' });
  }
}

export default {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierById,
  getNextSupplierCode
};