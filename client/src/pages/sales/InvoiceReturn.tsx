import { useState, useEffect } from 'react';

import { format } from 'date-fns';
import { X, RotateCcw, Minus, Plus, Info, DollarSign, Banknote, FileText } from 'lucide-react';

import { useFormValidation } from '../../hooks/useFormValidation';
import { invoiceReturnItemSchema } from '../../schemas';
import { formatCurrency } from '../../utils/formatters';
import api from '../../utils/api';
import './InvoiceReturn.css';

interface InvoiceItem {
  id: number;
  item_id: number;
  item_name: string;
  item_code?: string;
  quantity: number;
  unit_price: number;
  unit_of_measure?: string;
  returned_qty?: number;
  tax_rate?: number;
}

interface InvoiceReturnItem {
  invoice_item_id: number;
  item_id: number;
  item_name: string;
  item_code?: string;
  original_quantity: number;
  returned_qty: number;
  available_quantity: number;
  return_quantity: number;
  unit_price: number;
  unit_of_measure?: string;
}

interface Invoice {
  id: number;
  invoice_no: string;
  invoice_date: string;
  customer_id: number;
  customer_name: string;
  total_amount: number;
  status: string;
}

interface UnpaidInvoice {
  id: number;
  invoice_no: string;
  invoice_date: string;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  status: string;
}

interface InvoiceReturnProps {
  invoice: Invoice;
  items: InvoiceItem[];
  onClose: () => void;
  onSubmit: (returnData: {
    items: { invoice_item_id: number; return_quantity: number; reason: string }[];
    disposition: 'refund' | 'credit' | 'adjust';
    adjust_invoice_ids?: number[];
  }) => void;
  loading?: boolean;
}

export default function InvoiceReturn({ invoice, items, onClose, onSubmit, loading }: InvoiceReturnProps) {
  const [returnItems, setReturnItems] = useState<InvoiceReturnItem[]>([]);
  const [reason, setReason] = useState('');
  const { errors: validationErrors, validate } = useFormValidation(invoiceReturnItemSchema);
  const [returnErrors, setErrors] = useState<Record<number, string>>({});
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [disposition, setDisposition] = useState<'refund' | 'credit' | 'adjust'>('refund');
  const [unpaidInvoices, setUnpaidInvoices] = useState<UnpaidInvoice[]>([]);
  const [selectedAdjustInvoices, setSelectedAdjustInvoices] = useState<number[]>([]);
  const [loadingUnpaid, setLoadingUnpaid] = useState(false);

  // Initialize state when items prop changes
  useEffect(() => {
    setIsInitialLoad(false);
    
    if (items && items.length > 0) {
      const mappedItems = items.map((item) => {
        const originalQty = parseFloat(String(item.quantity)) || 0;
        const returnedQty = parseFloat(String(item.returned_qty)) || 0;
        const availableQty = Math.max(0, originalQty - returnedQty);
        
        return {
          invoice_item_id: item.id,
          item_id: item.item_id,
          item_name: item.item_name,
          item_code: item.item_code,
          original_quantity: originalQty,
          returned_qty: returnedQty,
          available_quantity: availableQty,
          return_quantity: 0,
          unit_price: parseFloat(String(item.unit_price)) || 0,
          unit_of_measure: item.unit_of_measure
        };
      });
      setReturnItems(mappedItems);
    }

    // Default disposition based on invoice status
    if (invoice.status === 'Paid' || invoice.status === 'Partially Paid') {
      setDisposition('refund');
    } else {
      setDisposition('credit');
    }
  }, [items, invoice]);

  // Fetch unpaid invoices when disposition changes to 'adjust'
  useEffect(() => {
    if (disposition === 'adjust' && invoice.customer_id) {
      setLoadingUnpaid(true);
      api.get('/invoices', {
        params: {
          customerId: invoice.customer_id,
          status: 'Unpaid,Partially Paid'
        }
      })
        .then((response) => {
          const data = response.data?.data || response.data || [];
          // Filter to only invoices with balance > 0, exclude the current invoice
          const filtered = data.filter((inv: UnpaidInvoice) => 
            inv.id !== invoice.id && 
            (inv.balance_amount || 0) > 0
          );
          setUnpaidInvoices(filtered);
        })
        .catch(() => {
          setUnpaidInvoices([]);
        })
        .finally(() => {
          setLoadingUnpaid(false);
        });
    } else {
      setUnpaidInvoices([]);
      setSelectedAdjustInvoices([]);
    }
  }, [disposition, invoice.customer_id, invoice.id]);

  const handleQuantityChange = (itemId: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    const itemIndex = returnItems.findIndex(i => i.invoice_item_id === itemId);
    
    if (itemIndex === -1) return;

    const item = returnItems[itemIndex];
    
    if (numValue < 0) {
      setErrors(prev => ({ ...prev, [itemId]: 'Quantity cannot be negative' }));
      return;
    }
    
    if (numValue > item.available_quantity) {
      setErrors(prev => ({ ...prev, [itemId]: `Maximum: ${item.available_quantity} (already returned ${item.returned_qty} of ${item.original_quantity})` }));
      return;
    }

    if (numValue === 0 && parseFloat(value) !== 0) {
      setErrors(prev => ({ ...prev, [itemId]: 'Quantity must be a valid number' }));
      return;
    }

    setErrors(prev => ({ ...prev, [itemId]: '' }));
    
    const updated = [...returnItems];
    updated[itemIndex].return_quantity = numValue;
    setReturnItems(updated);
  };

  const incrementQuantity = (itemId: number) => {
    const item = returnItems.find(i => i.invoice_item_id === itemId);
    if (item && item.return_quantity < item.available_quantity) {
      handleQuantityChange(itemId, String(item.return_quantity + 1));
    }
  };

  const decrementQuantity = (itemId: number) => {
    const item = returnItems.find(i => i.invoice_item_id === itemId);
    if (item && item.return_quantity > 0) {
      handleQuantityChange(itemId, String(item.return_quantity - 1));
    }
  };

  const calculateReturnTotal = () => {
    return returnItems.reduce((sum, item) => sum + (item.return_quantity * item.unit_price), 0);
  };

  const handleToggleInvoice = (invoiceId: number) => {
    setSelectedAdjustInvoices(prev => {
      if (prev.includes(invoiceId)) {
        return prev.filter(id => id !== invoiceId);
      }
      return [...prev, invoiceId];
    });
  };

  const handleSelectAllUnpaid = () => {
    const allIds = unpaidInvoices.map(inv => inv.id);
    setSelectedAdjustInvoices(
      selectedAdjustInvoices.length === allIds.length ? [] : allIds
    );
  };

  const handleSubmit = () => {
    const itemsToReturn = returnItems.filter(item => item.return_quantity > 0);

    if (itemsToReturn.length === 0) {
      alert('Please select at least one item to return');
      return;
    }

    if (!reason.trim()) {
      alert('Please enter a reason for the return');
      return;
    }

    if (disposition === 'adjust' && selectedAdjustInvoices.length === 0) {
      alert('Please select at least one invoice to adjust against, or choose a different disposition');
      return;
    }

    // Validate return items
    const hasErrors = itemsToReturn.some(item => {
      const isValid = validate({ return_quantity: item.return_quantity });
      return !isValid;
    });

    if (hasErrors) {
      alert('Please enter valid return quantities');
      return;
    }

    onSubmit({
      items: itemsToReturn.map(item => ({
        invoice_item_id: item.invoice_item_id,
        return_quantity: item.return_quantity,
        reason
      })),
      disposition,
      adjust_invoice_ids: disposition === 'adjust' ? selectedAdjustInvoices : undefined
    });
  };

  const hasReturns = returnItems.some(item => item.return_quantity > 0);
  const returnTotal = calculateReturnTotal();

  return (
    <div className="invoice-return-overlay" onClick={onClose}>
      <div className="invoice-return-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="invoice-return-header">
          <div className="return-title-section">
            <RotateCcw size={24} className="return-icon" />
            <div>
              <h2 className="return-title">Return Invoice</h2>
              <p className="return-subtitle">{invoice.invoice_no} - {invoice.customer_name}</p>
            </div>
          </div>
          <button className="return-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="invoice-return-content">
          {/* Invoice Info */}
          <div className="return-invoice-info">
            <div className="info-item">
              <span className="info-label">Invoice Date</span>
              <span className="info-value">
                {invoice.invoice_date ? format(new Date(invoice.invoice_date), 'MMM dd, yyyy') : ''}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Status</span>
              <span className={`info-value status-badge ${invoice.status?.toLowerCase()}`}>
                {invoice.status}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Original Total</span>
              <span className="info-value total">
                {formatCurrency(invoice.total_amount)}
              </span>
            </div>
          </div>

          {/* Return Reason */}
          <div className="return-reason-section">
            <label className="reason-label">Return Reason *</label>
            <textarea
              className="reason-input"
              placeholder="Enter reason for return..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>

          {/* Items Selection */}
          <div className="return-items-section">
            <h3 className="section-title">Select Items to Return</h3>
            
            {isInitialLoad ? (
              <div className="no-items-message">
                <p>Loading items...</p>
              </div>
            ) : returnItems.length === 0 ? (
              <div className="no-items-message">
                <p>No items found in this invoice</p>
                <p className="debug-info">Items received: {Array.isArray(items) ? items.length : 'invalid'}</p>
              </div>
            ) : (
              <div className="items-list">
                {returnItems.map((item) => {
                  const returnAmount = item.return_quantity * item.unit_price;
                  const hasError = returnErrors[item.invoice_item_id];
                  const isFullyReturned = item.available_quantity <= 0;
                  
                  return (
                    <div key={item.invoice_item_id} className={`return-item-row ${item.return_quantity > 0 ? 'selected' : ''} ${hasError ? 'has-error' : ''} ${isFullyReturned ? 'fully-returned' : ''}`}>
                      <div className="item-info">
                        <span className="item-name">{item.item_name}</span>
                        <span className="item-code">
                          {item.item_code && `${item.item_code} • `}
                          {formatCurrency(item.unit_price)}/{item.unit_of_measure || 'unit'}
                        </span>
                        <span className="return-qty-info">
                          {item.returned_qty > 0 ? (
                            <>Already returned: <strong>{item.returned_qty}</strong> | Available: <strong>{item.available_quantity}</strong></>
                          ) : (
                            <>Available: <strong>{item.available_quantity}</strong></>
                          )}
                          {isFullyReturned && (
                            <span className="fully-returned-badge">Fully returned</span>
                          )}
                        </span>
                      </div>

                      <div className="quantity-control">
                        <span className="qty-label">Return:</span>
                        <button
                          type="button"
                          className="qty-btn minus"
                          onClick={() => decrementQuantity(item.invoice_item_id)}
                          disabled={item.return_quantity === 0 || isFullyReturned}
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          className="qty-input"
                          value={item.return_quantity}
                          onChange={(e) => handleQuantityChange(item.invoice_item_id, e.target.value)}
                          min="0"
                          max={item.available_quantity}
                          step="1"
                          disabled={isFullyReturned}
                        />
                        <button
                          type="button"
                          className="qty-btn plus"
                          onClick={() => incrementQuantity(item.invoice_item_id)}
                          disabled={item.return_quantity >= item.available_quantity || isFullyReturned}
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="item-return-amount">
                        {item.return_quantity > 0 && (
                          <>
                            <span className="return-qty">{item.return_quantity} ×</span>
                            <span className="return-value">-{formatCurrency(returnAmount)}</span>
                          </>
                        )}
                      </div>

                      {hasError && <span className="error-message">{hasError}</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Disposition Options */}
          {hasReturns && (
            <div className="return-disposition-section">
              <h3 className="section-title">
                <Info size={16} />
                How to handle the returned amount?
              </h3>
              <p className="disposition-hint">
                You are returning <strong>{formatCurrency(returnTotal)}</strong> worth of items.
              </p>

              <div className="disposition-options">
                {/* Refund Option */}
                <label className={`disposition-option ${disposition === 'refund' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="disposition"
                    value="refund"
                    checked={disposition === 'refund'}
                    onChange={() => setDisposition('refund')}
                  />
                  <div className="disposition-option-content">
                    <div className="disposition-option-header">
                      <Banknote size={20} />
                      <span className="disposition-option-title">Refund to Customer</span>
                    </div>
                    <p className="disposition-option-desc">
                      Pay the returned amount back to the customer in cash or bank transfer.
                    </p>
                  </div>
                </label>

                {/* Credit Option */}
                <label className={`disposition-option ${disposition === 'credit' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="disposition"
                    value="credit"
                    checked={disposition === 'credit'}
                    onChange={() => setDisposition('credit')}
                  />
                  <div className="disposition-option-content">
                    <div className="disposition-option-header">
                      <DollarSign size={20} />
                      <span className="disposition-option-title">Customer Credit</span>
                    </div>
                    <p className="disposition-option-desc">
                      Keep the amount as a credit balance on the customer's account for future purchases.
                    </p>
                  </div>
                </label>

                {/* Adjust Option */}
                <label className={`disposition-option ${disposition === 'adjust' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="disposition"
                    value="adjust"
                    checked={disposition === 'adjust'}
                    onChange={() => setDisposition('adjust')}
                  />
                  <div className="disposition-option-content">
                    <div className="disposition-option-header">
                      <FileText size={20} />
                      <span className="disposition-option-title">Adjust Against Unpaid Invoices</span>
                    </div>
                    <p className="disposition-option-desc">
                      Apply the return credit to one or more outstanding unpaid or partially-paid invoices.
                    </p>
                  </div>
                </label>
              </div>

              {/* Invoice Selection for Adjust Mode */}
              {disposition === 'adjust' && (
                <div className="adjust-invoice-selection">
                  <div className="adjust-invoice-header">
                    <span className="adjust-invoice-title">
                      Select Invoices to Adjust
                      {unpaidInvoices.length > 0 && (
                        <span className="adjust-invoice-count">({unpaidInvoices.length} available)</span>
                      )}
                    </span>
                    {unpaidInvoices.length > 0 && (
                      <button
                        type="button"
                        className="select-all-btn"
                        onClick={handleSelectAllUnpaid}
                      >
                        {selectedAdjustInvoices.length === unpaidInvoices.length ? 'Deselect All' : 'Select All'}
                      </button>
                    )}
                  </div>

                  {loadingUnpaid ? (
                    <div className="no-items-message">
                      <p>Loading unpaid invoices...</p>
                    </div>
                  ) : unpaidInvoices.length === 0 ? (
                    <div className="no-items-message">
                      <p>No unpaid or partially-paid invoices found for this customer.</p>
                      <p className="disposition-hint">
                        Choose a different disposition option, or the amount will be kept as customer credit.
                      </p>
                    </div>
                  ) : (
                    <div className="adjust-invoice-list">
                      {unpaidInvoices.map((inv) => {
                        const isSelected = selectedAdjustInvoices.includes(inv.id);
                        return (
                          <label
                            key={inv.id}
                            className={`adjust-invoice-item ${isSelected ? 'selected' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleInvoice(inv.id)}
                            />
                            <div className="adjust-invoice-info">
                              <span className="adjust-invoice-no">{inv.invoice_no}</span>
                              <span className="adjust-invoice-date">
                                {inv.invoice_date ? format(new Date(inv.invoice_date), 'MMM dd, yyyy') : ''}
                              </span>
                            </div>
                            <div className="adjust-invoice-amounts">
                              <span className="adjust-invoice-total">{formatCurrency(inv.total_amount)}</span>
                              <span className="adjust-invoice-balance">
                                Balance: <strong>{formatCurrency(inv.balance_amount)}</strong>
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {selectedAdjustInvoices.length > 0 && (
                    <div className="adjust-summary">
                      <span>{selectedAdjustInvoices.length} invoice(s) selected</span>
                      <span className="adjust-credit-amount">
                        Credit: {formatCurrency(Math.min(
                          returnTotal,
                          unpaidInvoices
                            .filter(inv => selectedAdjustInvoices.includes(inv.id))
                            .reduce((sum, inv) => sum + inv.balance_amount, 0)
                        ))} / {formatCurrency(returnTotal)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Return Summary */}
          {hasReturns && (
            <div className="return-summary">
              <div className="summary-row">
                <span>Items to Return:</span>
                <span>{returnItems.filter(i => i.return_quantity > 0).length}</span>
              </div>
              <div className="summary-row">
                <span>Total Quantity:</span>
                <span>{returnItems.reduce((sum, i) => sum + i.return_quantity, 0)}</span>
              </div>
              <div className="summary-row total">
                <span>Return Amount:</span>
                <span className="negative">-{formatCurrency(returnTotal)}</span>
              </div>
              {disposition === 'credit' && (
                <div className="summary-row credit-note">
                  <span>Disposition:</span>
                  <span>Added to customer credit balance</span>
                </div>
              )}
              {disposition === 'refund' && (
                <div className="summary-row refund-note">
                  <span>Disposition:</span>
                  <span>Cash refund to customer</span>
                </div>
              )}
              {disposition === 'adjust' && (
                <div className="summary-row adjust-note">
                  <span>Disposition:</span>
                  <span>Adjusted against {selectedAdjustInvoices.length} invoice(s)</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="invoice-return-actions">
          <button className="action-btn cancel" onClick={onClose}>
            Cancel
          </button>
          <button 
            className={`action-btn submit ${!hasReturns || !reason.trim() || loading ? 'disabled' : ''}`}
            onClick={handleSubmit}
            disabled={!hasReturns || !reason.trim() || loading}
          >
            <RotateCcw size={18} />
            {loading ? 'Processing...' : 'Process Return'}
          </button>
        </div>
      </div>
    </div>
  );
}
