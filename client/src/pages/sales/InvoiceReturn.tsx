import { useState, useEffect } from 'react';
import { X, RotateCcw, Minus, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/formatters';
import './InvoiceReturn.css';

interface InvoiceItem {
  id: number;
  item_id: number;
  item_name: string;
  item_code?: string;
  quantity: number;
  unit_price: number;
  unit_of_measure?: string;
}

interface InvoiceReturnItem {
  invoice_item_id: number;
  item_id: number;
  item_name: string;
  item_code?: string;
  original_quantity: number;
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

interface InvoiceReturnProps {
  invoice: Invoice;
  items: InvoiceItem[];
  onClose: () => void;
  onSubmit: (returnItems: { invoice_item_id: number; return_quantity: number; reason: string }[]) => void;
}

interface InvoiceReturnProps {
  invoice: Invoice;
  items: InvoiceItem[];
  onClose: () => void;
  onSubmit: (returnItems: { invoice_item_id: number; return_quantity: number; reason: string }[]) => void;
}

export default function InvoiceReturn({ invoice, items, onClose, onSubmit }: InvoiceReturnProps) {
  const [returnItems, setReturnItems] = useState<InvoiceReturnItem[]>([]);
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<{ [key: number]: string }>({});
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Initialize state when items prop changes
  useEffect(() => {
    console.log('[InvoiceReturn] items prop received:', JSON.stringify(items));
    setIsInitialLoad(false);
    
    if (items && items.length > 0) {
      console.log('[InvoiceReturn] Processing', items.length, 'items...');
      const mappedItems = items.map((item, index) => {
        console.log('[InvoiceReturn] Mapping item', index, ':', JSON.stringify(item));
        return {
          invoice_item_id: item.id,
          item_id: item.item_id,
          item_name: item.item_name,
          item_code: item.item_code,
          original_quantity: parseFloat(String(item.quantity)) || 0,
          return_quantity: 0,
          unit_price: parseFloat(String(item.unit_price)) || 0,
          unit_of_measure: item.unit_of_measure
        };
      });
      console.log('[InvoiceReturn] Mapped items:', JSON.stringify(mappedItems));
      setReturnItems(mappedItems);
    } else {
      console.log('[InvoiceReturn] No items to process - items is:', items);
    }
  }, [items]);

  const handleQuantityChange = (itemId: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    const itemIndex = returnItems.findIndex(i => i.invoice_item_id === itemId);
    
    if (itemIndex === -1) return;

    const item = returnItems[itemIndex];
    
    if (numValue < 0) {
      setErrors(prev => ({ ...prev, [itemId]: 'Quantity cannot be negative' }));
      return;
    }
    
    if (numValue > item.original_quantity) {
      setErrors(prev => ({ ...prev, [itemId]: `Maximum: ${item.original_quantity}` }));
      return;
    }

    setErrors(prev => ({ ...prev, [itemId]: '' }));
    
    const updated = [...returnItems];
    updated[itemIndex].return_quantity = numValue;
    setReturnItems(updated);
  };

  const incrementQuantity = (itemId: number) => {
    const item = returnItems.find(i => i.invoice_item_id === itemId);
    if (item && item.return_quantity < item.original_quantity) {
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

    onSubmit(
      itemsToReturn.map(item => ({
        invoice_item_id: item.invoice_item_id,
        return_quantity: item.return_quantity,
        reason
      }))
    );
  };

  const hasReturns = returnItems.some(item => item.return_quantity > 0);

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
                <p className="debug-info">Raw items: {JSON.stringify(items)}</p>
              </div>
            ) : (
              <div className="items-list">
                {returnItems.map((item) => {
                  const returnAmount = item.return_quantity * item.unit_price;
                  const hasError = errors[item.invoice_item_id];
                  
                  return (
                    <div key={item.invoice_item_id} className={`return-item-row ${item.return_quantity > 0 ? 'selected' : ''} ${hasError ? 'has-error' : ''}`}>
                      <div className="item-info">
                        <span className="item-name">{item.item_name}</span>
                        <span className="item-code">
                          {item.item_code && `${item.item_code} • `}
                          {formatCurrency(item.unit_price)}/{item.unit_of_measure || 'unit'}
                        </span>
                      </div>

                      <div className="quantity-control">
                        <span className="qty-label">Return:</span>
                        <button
                          type="button"
                          className="qty-btn minus"
                          onClick={() => decrementQuantity(item.invoice_item_id)}
                          disabled={item.return_quantity === 0}
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          className="qty-input"
                          value={item.return_quantity}
                          onChange={(e) => handleQuantityChange(item.invoice_item_id, e.target.value)}
                          min="0"
                          max={item.original_quantity}
                          step="1"
                        />
                        <button
                          type="button"
                          className="qty-btn plus"
                          onClick={() => incrementQuantity(item.invoice_item_id)}
                          disabled={item.return_quantity >= item.original_quantity}
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
                <span className="negative">-{formatCurrency(calculateReturnTotal())}</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="invoice-return-actions">
          <button className="action-btn cancel" onClick={onClose}>
            Cancel
          </button>
          <button 
            className={`action-btn submit ${!hasReturns || !reason.trim() ? 'disabled' : ''}`}
            onClick={handleSubmit}
            disabled={!hasReturns || !reason.trim()}
          >
            <RotateCcw size={18} />
            Process Return
          </button>
        </div>
      </div>
    </div>
  );
}
