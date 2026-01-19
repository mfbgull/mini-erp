import { Response } from 'express';
import { AuthRequest } from '../types';
import db from '../config/database';

// ============================================
// DRAFT INVOICE MANAGEMENT
// ============================================

/**
 * Create a new draft invoice for mobile session
 */
export async function createDraft(req: AuthRequest, res: Response) {
    try {
        const { session_id, customer_id, invoice_date, due_date, terms, notes, items_data } = req.body;
        
        // Generate session ID if not provided
        const finalSessionId = session_id || `mobile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Check if draft already exists for this session
        const existingDraft = db.prepare(`
            SELECT id FROM invoice_drafts 
            WHERE session_id = ? AND status = 'draft'
            AND expires_at > datetime('now')
        `).get(finalSessionId);
        
        if (existingDraft) {
            // Update existing draft
            db.prepare(`
                UPDATE invoice_drafts 
                SET customer_id = ?, invoice_date = ?, due_date = ?, 
                    terms = ?, notes = ?, items_data = ?,
                    updated_at = datetime('now')
                WHERE id = ?
            `).run(
                customer_id || null,
                invoice_date || null,
                due_date || null,
                terms || null,
                notes || null,
                items_data ? JSON.stringify(items_data) : null,
                (existingDraft as { id: number }).id
            );
            
            return res.json({
                success: true,
                data: { id: (existingDraft as { id: number }).id, session_id: finalSessionId },
                message: 'Draft updated successfully'
            });
        }
        
        // Create new draft
        const result = db.prepare(`
            INSERT INTO invoice_drafts (
                session_id, customer_id, invoice_date, due_date, 
                terms, notes, items_data, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')
        `).run(
            finalSessionId,
            customer_id || null,
            invoice_date || null,
            due_date || null,
            terms || null,
            notes || null,
            items_data ? JSON.stringify(items_data) : null
        );
        
        res.status(201).json({
            success: true,
            data: { id: result.lastInsertRowid, session_id: finalSessionId },
            message: 'Draft created successfully'
        });
    } catch (error) {
        console.error('Create draft error:', error);
        res.status(500).json({ error: 'Failed to create draft' });
    }
}

/**
 * Update an existing draft invoice
 */
export async function updateDraft(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;
        const { customer_id, invoice_date, due_date, terms, notes, items_data, status } = req.body;
        
        const draft = db.prepare('SELECT * FROM invoice_drafts WHERE id = ?').get(id);
        
        if (!draft) {
            return res.status(404).json({ error: 'Draft not found' });
        }
        
        // Check if draft has expired
        const draftData = draft as { expires_at: string };
        const expiresAt = new Date(draftData.expires_at);
        if (expiresAt < new Date()) {
            return res.status(410).json({ error: 'Draft has expired' });
        }
        
        db.prepare(`
            UPDATE invoice_drafts 
            SET customer_id = ?, invoice_date = ?, due_date = ?, 
                terms = ?, notes = ?, items_data = ?, status = ?,
                updated_at = datetime('now')
            WHERE id = ?
        `).run(
            customer_id || null,
            invoice_date || null,
            due_date || null,
            terms || null,
            notes || null,
            items_data ? JSON.stringify(items_data) : null,
            status || 'draft',
            parseInt(id, 10)
        );
        
        res.json({
            success: true,
            message: 'Draft updated successfully'
        });
    } catch (error) {
        console.error('Update draft error:', error);
        res.status(500).json({ error: 'Failed to update draft' });
    }
}

/**
 * Get a draft invoice by ID
 */
export async function getDraft(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;
        
        const draft = db.prepare('SELECT * FROM invoice_drafts WHERE id = ?').get(id);
        
        if (!draft) {
            return res.status(404).json({ error: 'Draft not found' });
        }
        
        // Check if draft has expired
        const draftData = draft as { expires_at: string };
        const expiresAt = new Date(draftData.expires_at);
        if (expiresAt < new Date()) {
            return res.status(410).json({ error: 'Draft has expired' });
        }
        
        const draftWithItems = draft as { items_data: string | null };
        const parsedDraft = {
            ...draftWithItems,
            items_data: draftWithItems.items_data ? JSON.parse(draftWithItems.items_data) : []
        };
        
        res.json({
            success: true,
            data: parsedDraft
        });
    } catch (error) {
        console.error('Get draft error:', error);
        res.status(500).json({ error: 'Failed to get draft' });
    }
}

/**
 * Delete a draft invoice
 */
export async function deleteDraft(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;
        
        const result = db.prepare('DELETE FROM invoice_drafts WHERE id = ?').run(parseInt(id, 10));
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Draft not found' });
        }
        
        res.json({
            success: true,
            message: 'Draft deleted successfully'
        });
    } catch (error) {
        console.error('Delete draft error:', error);
        res.status(500).json({ error: 'Failed to delete draft' });
    }
}

// ============================================
// SEARCH ENDPOINTS
// ============================================

/**
 * Search items for mobile autocomplete
 */
export async function searchItems(req: AuthRequest, res: Response) {
    try {
        const { q, limit = 20 } = req.query;
        
        let query = `
            SELECT 
                id, item_code, item_name, description, 
                category, unit_of_measure, current_stock,
                standard_selling_price as price, standard_cost as cost,
                is_raw_material, is_finished_good, is_purchased
            FROM items 
            WHERE is_active = 1
        `;
        
        const params: (string | number)[] = [];
        
        if (q && (q as string).trim().length > 0) {
            const searchTerm = `%${(q as string).trim()}%`;
            query += ` AND (item_name LIKE ? OR item_code LIKE ? OR description LIKE ?)`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        
        // Filter to only sellable items (finished goods or purchased items, not raw materials)
        query += ` AND (is_finished_good = 1 OR is_purchased = 1) AND is_raw_material = 0`;
        
        query += ` ORDER BY item_name ASC LIMIT ?`;
        params.push(parseInt(limit as string, 10));
        
        const items = db.prepare(query).all(...params);
        
        res.json({
            success: true,
            data: items,
            count: (items as []).length
        });
    } catch (error) {
        console.error('Search items error:', error);
        res.status(500).json({ error: 'Failed to search items' });
    }
}

/**
 * Search customers for mobile autocomplete
 */
export async function searchCustomers(req: AuthRequest, res: Response) {
    try {
        const { q, limit = 20 } = req.query;
        console.log('[searchCustomers] Query:', q, 'Limit:', limit);

        let query = `
            SELECT
                id, customer_code, customer_name, contact_person,
                email, phone, billing_address, payment_terms,
                is_active
            FROM customers
            WHERE is_active = 1
        `;

        const params: (string | number)[] = [];

        if (q && (q as string).trim().length > 0) {
            const searchTerm = `%${(q as string).trim()}%`;
            query += ` AND (customer_name LIKE ? OR customer_code LIKE ? OR phone LIKE ? OR email LIKE ?)`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        query += ` ORDER BY customer_name ASC LIMIT ?`;
        params.push(parseInt(limit as string, 10));

        console.log('[searchCustomers] Running query with params:', params);
        const customers = db.prepare(query).all(...params);
        console.log('[searchCustomers] Found:', customers.length, 'customers');

        res.json({
            success: true,
            data: customers,
            count: (customers as []).length
        });
    } catch (error) {
        console.error('Search customers error:', error);
        res.status(500).json({ error: 'Failed to search customers' });
    }
}

// ============================================
// CONFIGURATION ENDPOINTS
// ============================================

/**
 * Get all active tax rates
 */
export async function getTaxRates(req: AuthRequest, res: Response) {
    try {
        const taxRates = db.prepare(`
            SELECT id, name, rate, is_default 
            FROM tax_rates 
            WHERE is_active = 1 
            ORDER BY rate ASC
        `).all();
        
        res.json({
            success: true,
            data: taxRates
        });
    } catch (error) {
        console.error('Get tax rates error:', error);
        res.status(500).json({ error: 'Failed to get tax rates' });
    }
}

/**
 * Get all active payment terms
 */
export async function getPaymentTerms(req: AuthRequest, res: Response) {
    try {
        const paymentTerms = db.prepare(`
            SELECT id, name, days, is_default 
            FROM payment_terms 
            WHERE is_active = 1 
            ORDER BY days ASC
        `).all();
        
        res.json({
            success: true,
            data: paymentTerms
        });
    } catch (error) {
        console.error('Get payment terms error:', error);
        res.status(500).json({ error: 'Failed to get payment terms' });
    }
}

// ============================================
// FINAL SUBMISSION
// ============================================

/**
 * Submit final invoice (creates actual invoice from draft or direct data)
 */
export async function submitInvoice(req: AuthRequest, res: Response) {
    try {
        const { 
            draft_id,
            invoice_no, customer_id, invoice_date, due_date, 
            status = 'Unpaid', terms, notes, items,
            record_payment, payment
        } = req.body;
        
        // Validation
        if (!customer_id) {
            return res.status(400).json({ error: 'Customer is required', field: 'customer_id' });
        }
        
        if (!invoice_date) {
            return res.status(400).json({ error: 'Invoice date is required', field: 'invoice_date' });
        }
        
        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'At least one item is required', field: 'items' });
        }
        
        // Calculate totals
        let subtotal = 0;
        let totalTax = 0;
        
        const processedItems = items.map((item: any) => {
            const itemSubtotal = (item.quantity || 0) * (item.unit_price || 0);
            const itemTax = itemSubtotal * ((item.tax_rate || 0) / 100);
            subtotal += itemSubtotal;
            totalTax += itemTax;
            return {
                ...item,
                amount: itemSubtotal + itemTax
            };
        });
        
        const total_amount = subtotal + totalTax;
        
        // Generate invoice number if not provided
        const finalInvoiceNo = invoice_no || generateInvoiceNumber();
        
        // Start transaction
        const transaction = db.transaction(() => {
            // Insert invoice
            const invoiceResult = db.prepare(`
                INSERT INTO invoices (
                    invoice_no, customer_id, invoice_date, due_date, status,
                    total_amount, paid_amount, balance_amount, notes, terms, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                finalInvoiceNo,
                customer_id,
                invoice_date,
                due_date || invoice_date,
                status,
                total_amount,
                0,
                total_amount,
                notes || null,
                terms || null,
                req.user.id
            );
            
            const invoiceId = invoiceResult.lastInsertRowid;
            
            // Insert invoice items
            processedItems.forEach((item: any) => {
                const amount = (item.quantity || 0) * (item.unit_price || 0);
                db.prepare(`
                    INSERT INTO invoice_items (
                        invoice_id, item_id, quantity, unit_price, 
                        amount, tax_rate, discount_type, discount_value
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    invoiceId,
                    item.item_id,
                    item.quantity,
                    item.unit_price,
                    amount,
                    item.tax_rate || 0,
                    item.discount_type || 'percentage',
                    item.discount_value || 0
                );
            });
            
            // If payment is being recorded
            if (record_payment && payment) {
                const paymentAmount = payment.amount || 0;
                
                // Generate payment number
                const maxPaymentNo = db.prepare(`
                    SELECT MAX(payment_no) as max_no 
                    FROM payments 
                    WHERE payment_no LIKE 'PAY%'
                `).get();
                
                let newPaymentNo = 'PAY001';
                if (maxPaymentNo && (maxPaymentNo as { max_no: string }).max_no) {
                    const lastNumber = parseInt((maxPaymentNo as { max_no: string }).max_no.replace('PAY', ''), 10);
                    newPaymentNo = `PAY${String(lastNumber + 1).padStart(3, '0')}`;
                }
                
                // Insert payment
                const paymentResult = db.prepare(`
                    INSERT INTO payments (
                        payment_no, customer_id, invoice_id, payment_date,
                        amount, payment_method, reference_no, notes, created_by
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    newPaymentNo,
                    customer_id,
                    invoiceId,
                    payment.payment_date || invoice_date,
                    paymentAmount,
                    payment.payment_method || 'Cash',
                    payment.reference_no || null,
                    payment.notes || null,
                    req.user.id
                );
                
                const paymentId = paymentResult.lastInsertRowid;
                
                // Insert payment allocation
                db.prepare(`
                    INSERT INTO payment_allocations (payment_id, invoice_id, amount)
                    VALUES (?, ?, ?)
                `).run(paymentId, invoiceId, paymentAmount);
                
                // Update invoice with payment
                db.prepare(`
                    UPDATE invoices 
                    SET paid_amount = ?, balance_amount = ?, status = ?
                    WHERE id = ?
                `).run(paymentAmount, total_amount - paymentAmount, 
                    paymentAmount >= total_amount ? 'Paid' : 'Partially Paid',
                    invoiceId);
            }
            
            // Delete draft if provided
            if (draft_id) {
                db.prepare('DELETE FROM invoice_drafts WHERE id = ?').run(parseInt(draft_id, 10));
            }
            
            return invoiceId;
        });
        
        const invoiceId = transaction();
        
        // Get created invoice
        const createdInvoice = db.prepare(`
            SELECT 
                i.*, 
                c.customer_name, c.email as customer_email, 
                c.phone as customer_phone, c.billing_address as customer_address
            FROM invoices i
            LEFT JOIN customers c ON i.customer_id = c.id
            WHERE i.id = ?
        `).get(invoiceId);
        
        res.status(201).json({
            success: true,
            data: createdInvoice,
            message: 'Invoice created successfully'
        });
    } catch (error) {
        console.error('Submit invoice error:', error);
        res.status(500).json({ error: 'Failed to create invoice: ' + (error as Error).message });
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    return `INV-${year}-${timestamp.padStart(6, '0')}`;
}

export default {
    createDraft,
    updateDraft,
    getDraft,
    deleteDraft,
    searchItems,
    searchCustomers,
    getTaxRates,
    getPaymentTerms,
    submitInvoice
};
