import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import { logCRUD, ActionType } from '../services/activityLogger';
import db from '../config/database';
import logger from '../utils/logger';
import { initializeSequenceFromMax, getNextSequenceNumber } from '../utils/sequence';
import SupplierModel from '../models/Supplier';

function getSuppliers(req: Request, res: Response): void {
  try {
    const suppliers = SupplierModel.getAll(db);

    res.json({
      success: true,
      data: suppliers
    });
  } catch (error) {
    logger.error('Error fetching suppliers:', error);
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

    const id = SupplierModel.create({
      supplier_code,
      supplier_name,
      contact_person,
      email,
      phone,
      address,
      payment_terms
    }, db);

    // Log supplier creation using activity logger
    logCRUD(ActionType.SUPPLIER_CREATE, 'Supplier', id, `Created supplier: ${supplier_name} (${supplier_code})`, (req as AuthRequest).user?.id);
    req.activityLogged = true;

    res.status(201).json({
      success: true,
      data: {
        id,
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
    logger.error('Error creating supplier:', error);
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
    const supplierId = parseInt(Array.isArray(id) ? id[0] : id, 10);
    const {
      supplier_name,
      contact_person,
      email,
      phone,
      address,
      payment_terms,
      is_active
    } = req.body;

    const result = SupplierModel.update(supplierId, {
      supplier_name,
      contact_person,
      email,
      phone,
      address,
      payment_terms,
      is_active
    }, db);

    if (result.changes === 0) {
      res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
      return;
    }

    // Log supplier update using activity logger
    logCRUD(ActionType.SUPPLIER_UPDATE, 'Supplier', supplierId, `Updated supplier: ${supplier_name}`, (req as AuthRequest).user?.id);
    req.activityLogged = true;

    res.json({
      success: true,
      data: {
        id: supplierId,
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
    logger.error('Error updating supplier:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update supplier'
    });
  }
}

function deleteSupplier(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const deleteId = Array.isArray(id) ? id[0] : id;
    const supplierId = parseInt(deleteId, 10);

    // Check if supplier has any purchase orders
    const poCount = SupplierModel.countPurchaseOrders(supplierId, db);

    if (poCount.count > 0) {
      res.status(400).json({
        success: false,
        error: 'Cannot delete supplier with existing purchase orders'
      });
      return;
    }

    // Query supplier info BEFORE deletion so we can log it
    const existingSupplier = SupplierModel.getById(supplierId, db);

    SupplierModel.delete(supplierId, db);

    // Log supplier deletion using activity logger
    logCRUD(ActionType.SUPPLIER_DELETE, 'Supplier', supplierId, `Deleted supplier: ${existingSupplier?.supplier_name || 'Unknown'} (${existingSupplier?.supplier_code || 'N/A'})`, (req as AuthRequest).user?.id);
    req.activityLogged = true;

    res.json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting supplier:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete supplier'
    });
  }
}

function getSupplierById(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const supplierId = parseInt(Array.isArray(id) ? id[0] : id, 10);
    const supplier = SupplierModel.getById(supplierId, db);
    if (!supplier) {
      res.status(404).json({ success: false, error: 'Supplier not found' });
      return;
    }
    res.json({ success: true, data: supplier });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch supplier' });
  }
}

function getNextSupplierCode(req: Request, res: Response): void {
  try {
    initializeSequenceFromMax(db, 'SUP_last_no', 'suppliers', 'supplier_code', 'SUP-');
    const nextNumber = getNextSequenceNumber(db, 'SUP_last_no');
    const code = `SUP-${String(nextNumber).padStart(3, '0')}`;
    res.json({ success: true, data: { code } });
  } catch (error) {
    logger.error('Error generating supplier code:', error);
    const code = 'SUP-001';
    res.json({ success: true, data: { code } });
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
