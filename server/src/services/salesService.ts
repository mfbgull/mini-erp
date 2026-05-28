import Database from 'better-sqlite3';
import QuotationModel from '../models/Quotation';
import SalesOrderModel from '../models/SalesOrder';
import InvoiceModel from '../models/Invoice';
import db from '../config/database';

/**
 * Sales Service
 * 
 * Provides high-level business logic for the full sales cycle:
 * Quotation → Sales Order → Invoice
 * 
 * All methods use transactions for data consistency.
 */

export interface SalesCycleChain {
  quotation?: any;
  salesOrder?: any;
  invoice?: any;
}

class SalesService {
  /**
   * Get the complete sales cycle chain for a quotation
   */
  static getQuotationCycleChain(quotationId: number): SalesCycleChain {
    return QuotationModel.getSalesCycleChain(quotationId, db);
  }

  /**
   * Get the complete sales cycle chain for a sales order
   */
  static getSalesOrderCycleChain(salesOrderId: number): SalesCycleChain {
    return SalesOrderModel.getSalesCycleChain(salesOrderId, db);
  }

  /**
   * Get the complete sales cycle chain for an invoice
   */
  static getInvoiceCycleChain(invoiceId: number): SalesCycleChain {
    return InvoiceModel.getSalesCycleChain(invoiceId, db);
  }

  /**
   * Convert a quotation to a sales order
   * This is a wrapper around QuotationModel.convertToSalesOrder
   * with additional business logic if needed
   */
  static convertQuotationToSalesOrder(
    quotationId: number,
    userId: number,
    overrides?: {
      so_date?: string;
      delivery_date?: string;
      notes?: string;
    }
  ): { salesOrderId: number; salesOrderNo: string } {
    const transaction = db.transaction(() => {
      // Get quotation to validate
      const quotation = QuotationModel.getById(quotationId, db);
      if (!quotation) {
        throw new Error('Quotation not found');
      }

      // Check if already converted
      if (quotation.status === 'Converted') {
        throw new Error('Quotation already converted to sales order');
      }

      // Check if expired
      if (quotation.expiry_date) {
        const today = new Date().toISOString().split('T')[0];
        if (quotation.expiry_date < today) {
          throw new Error('Quotation has expired');
        }
      }

      // Convert
      const result = QuotationModel.convertToSalesOrder(quotationId, userId, db);

      return result;
    });

    return transaction();
  }

  /**
   * Convert a sales order to an invoice
   * This is a wrapper around SalesOrderModel.convertToInvoice
   * with additional business logic if needed
   */
  static convertSalesOrderToInvoice(
    salesOrderId: number,
    userId: number,
    invoiceData?: {
      invoice_date?: string;
      due_date?: string;
      notes?: string;
      record_payment?: boolean;
      payment_date?: string;
      payment_amount?: number;
      payment_method?: string;
    }
  ): { invoiceId: number; invoiceNo: string } {
    const transaction = db.transaction(() => {
      // Get sales order to validate
      const salesOrder = SalesOrderModel.getById(salesOrderId, db);
      if (!salesOrder) {
        throw new Error('Sales order not found');
      }

      // Check status
      if (salesOrder.status === 'Cancelled') {
        throw new Error('Cannot convert cancelled sales order');
      }

      if (salesOrder.status === 'Invoiced' || salesOrder.status === 'Completed') {
        throw new Error(`Sales order already ${salesOrder.status}`);
      }

      // Convert
      const result = SalesOrderModel.convertToInvoice(salesOrderId, userId, db, {
        invoice_date: invoiceData?.invoice_date,
        due_date: invoiceData?.due_date,
        notes: invoiceData?.notes,
      });

      return result;
    });

    return transaction();
  }

  /**
   * Get all quotations with optional filters
   */
  static getQuotations(filters?: {
    status?: string;
    customer_id?: number;
    customer_name?: string;
    start_date?: string;
    end_date?: string;
    warehouse_id?: number;
    limit?: number;
  }) {
    return QuotationModel.getAll(filters, db);
  }

  /**
   * Get a single quotation with items
   */
  static getQuotation(id: number) {
    return QuotationModel.getById(id, db);
  }

  /**
   * Create a new quotation
   */
  static createQuotation(data: any, userId: number) {
    return QuotationModel.create(data, userId, db);
  }

  /**
   * Update a quotation
   */
  static updateQuotation(id: number, data: any, userId: number) {
    return QuotationModel.update(id, data, userId, db);
  }

  /**
   * Delete a quotation
   */
  static deleteQuotation(id: number, userId: number) {
    return QuotationModel.delete(id, userId, db);
  }

  /**
   * Get all sales orders with optional filters
   */
  static getSalesOrders(filters?: {
    status?: string;
    customer_id?: number;
    customer_name?: string;
    start_date?: string;
    end_date?: string;
    warehouse_id?: number;
    source_type?: string;
    limit?: number;
  }) {
    return SalesOrderModel.getAll(filters, db);
  }

  /**
   * Get a single sales order with items
   */
  static getSalesOrder(id: number) {
    return SalesOrderModel.getById(id, db);
  }

  /**
   * Create a new sales order
   */
  static createSalesOrder(data: any, userId: number) {
    return SalesOrderModel.create(data, userId, db);
  }

  /**
   * Update a sales order
   */
  static updateSalesOrder(id: number, data: any, userId: number) {
    return SalesOrderModel.update(id, data, userId, db);
  }

  /**
   * Delete a sales order
   */
  static deleteSalesOrder(id: number, userId: number) {
    return SalesOrderModel.delete(id, userId, db);
  }

  /**
   * Cancel a sales order — reverses linked invoice stock if invoiced.
   */
  static cancelSalesOrder(id: number, userId: number) {
    return SalesOrderModel.cancel(id, userId, db);
  }

  /**
   * Get all invoices with optional filters
   */
  static getInvoices(filters?: {
    status?: string;
    customer_id?: number;
    customer_name?: string;
    start_date?: string;
    end_date?: string;
    source_type?: string;
    so_id?: number;
    limit?: number;
  }) {
    return InvoiceModel.getAll(filters, db);
  }

  /**
   * Get a single invoice with items
   */
  static getInvoice(id: number) {
    return InvoiceModel.getById(id, db);
  }

  /**
   * Get invoices by sales order
   */
  static getInvoicesBySalesOrder(soId: number) {
    return InvoiceModel.getBySalesOrderId(soId, db);
  }

  /**
   * Get invoices by quotation
   */
  static getInvoicesByQuotation(quotationId: number) {
    return InvoiceModel.getByQuotationId(quotationId, db);
  }

  /**
   * Get invoice statistics by customer
   */
  static getInvoiceStatsByCustomer(customerId: number) {
    return InvoiceModel.getStatsByCustomer(customerId, db);
  }

  /**
   * Get invoice statistics by date range
   */
  static getInvoiceStatsByDateRange(startDate: string, endDate: string) {
    return InvoiceModel.getStatsByDateRange(startDate, endDate, db);
  }

  /**
   * Get sales dashboard summary
   */
  static getDashboardSummary() {
    const quotations = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Draft' THEN 1 ELSE 0 END) as draft,
        SUM(CASE WHEN status = 'Sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'Converted' THEN 1 ELSE 0 END) as converted
      FROM quotations
    `).get() as { total: number; draft: number; sent: number; converted: number };

    const salesOrders = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Draft' THEN 1 ELSE 0 END) as draft,
        SUM(CASE WHEN status = 'Confirmed' THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN status = 'Invoiced' THEN 1 ELSE 0 END) as invoiced
      FROM sales_orders
    `).get() as { total: number; draft: number; confirmed: number; invoiced: number };

    const invoices = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Unpaid' THEN 1 ELSE 0 END) as unpaid,
        SUM(CASE WHEN status = 'Paid' THEN 1 ELSE 0 END) as paid,
        SUM(CASE WHEN status = 'Partially Paid' THEN 1 ELSE 0 END) as partially_paid,
        SUM(total_amount) as total_revenue,
        SUM(balance_amount) as outstanding_receivables
      FROM invoices
    `).get() as {
      total: number;
      unpaid: number;
      paid: number;
      partially_paid: number;
      total_revenue: number;
      outstanding_receivables: number;
    };

    return {
      quotations: {
        total: quotations.total,
        draft: quotations.draft,
        sent: quotations.sent,
        pending_conversion: quotations.total - quotations.converted
      },
      sales_orders: {
        total: salesOrders.total,
        draft: salesOrders.draft,
        confirmed: salesOrders.confirmed,
        pending_invoicing: salesOrders.confirmed
      },
      invoices: {
        total: invoices.total,
        unpaid: invoices.unpaid,
        paid: invoices.paid,
        partially_paid: invoices.partially_paid,
        total_revenue: invoices.total_revenue,
        outstanding_receivables: invoices.outstanding_receivables
      }
    };
  }
}

export default SalesService;
