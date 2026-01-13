import { useState, useRef, useEffect } from 'react';
import { useInvoice } from '../../context/InvoiceContext';
import { ChevronDown, ChevronUp, CreditCard } from 'lucide-react';
import StickyFooter from './components/StickyFooter';
import toast from 'react-hot-toast';
import './MobileInvoice.css';

export default function InvoiceStep4Payment() {
  const { 
    dispatch, 
    items,
    customer,
    payment, 
    calculateTotal,
    calculateBalance,
    calculateSubtotal,
    nextStep,
    goToStep,
    isLoading
  } = useInvoice();

  const [paymentMethods, setPaymentMethods] = useState([
    { id: 'cash', name: 'Cash' },
    { id: 'card', name: 'Card' },
    { id: 'bank', name: 'Bank Transfer' },
    { id: 'check', name: 'Check' }
  ]);

  const [isPaymentExpanded, setIsPaymentExpanded] = useState(true); // Start expanded
  const [isItemsExpanded, setIsItemsExpanded] = useState(true);
  
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Focus amount input when payment form expands
  useEffect(() => {
    if (isPaymentExpanded) {
      setTimeout(() => {
        amountInputRef.current?.focus();
        amountInputRef.current?.select();
      }, 100);
    }
  }, [isPaymentExpanded]);

  // Initialize payment when component mounts (step 4)
  useEffect(() => {
    if (!payment.recordPayment) {
      dispatch({
        type: 'SET_PAYMENT',
        payload: { recordPayment: true, amount: calculateTotal() }
      });
    }
  }, []);

  const handleTogglePayment = () => {
    setIsPaymentExpanded(!isPaymentExpanded);
    if (!isPaymentExpanded) {
      // Set default payment amount to balance when expanding
      dispatch({
        type: 'SET_PAYMENT',
        payload: { recordPayment: true, amount: calculateTotal() }
      });
    }
  };

  const handlePaymentChange = (field: string, value: any) => {
    dispatch({
      type: 'SET_PAYMENT',
      payload: { [field]: value }
    });
  };

  const handleContinue = () => {
    if (payment.recordPayment) {
      if (payment.amount <= 0) {
        toast.error('Payment amount must be greater than 0');
        return;
      }
      if (payment.amount > calculateTotal()) {
        toast.error('Payment amount cannot exceed invoice total');
        return;
      }
    }
    nextStep();
  };

  const handleBack = () => {
    goToStep(3);
  };

  return (
    <div className="miw-step-4">
      {/* Customer Info Card - Click to Change */}
      {customer && (
        <div className="miw-customer-info-card" onClick={() => goToStep(1)}>
          <div className="miw-customer-info-content">
            <span className="miw-customer-info-label">Customer: </span>
            <span className="miw-customer-info-name">{customer.name}</span>
            {customer.email && <span className="miw-customer-info-contact"> ({customer.email})</span>}
          </div>
        </div>
      )}

      {/* Items Summary */}
      {items.length > 0 && (
        <div className="miw-added-items">
          <div 
            className="miw-added-items-header"
            onClick={() => setIsItemsExpanded(!isItemsExpanded)}
          >
            <span className="miw-added-items-title">Items ({items.length})</span>
            {isItemsExpanded ? (
              <ChevronUp size={18} className="miw-expand-icon" />
            ) : (
              <ChevronDown size={18} className="miw-expand-icon" />
            )}
          </div>
          <div 
            className={`miw-added-items-list ${isItemsExpanded ? 'expanded' : 'collapsed'}`}
            style={{ maxHeight: isItemsExpanded ? '300px' : '0' }}
          >
            {items.map((item: any, index: number) => (
              <div 
                key={item.id} 
                className="miw-added-item"
                onClick={() => goToStep(3)}
              >
                <div className="miw-added-item-serial">{index + 1}.</div>
                <div className="miw-added-item-info">
                  <div className="miw-added-item-name">{item.name}</div>
                  <div className="miw-added-item-details">
                    <span>Qty: {item.quantity}</span>
                    {item.discount > 0 && <span className="miw-discount-badge">Disc: {item.discount}%</span>}
                    <span>Tax: {item.taxRate}%</span>
                  </div>
                </div>
                <div className="miw-added-item-total">${item.amount.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Toggle Card */}
      <div className="miw-card" style={{ marginBottom: '12px' }}>
        <div 
          className="miw-toggle" 
          onClick={handleTogglePayment}
          style={{ padding: '8px 0' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CreditCard size={20} style={{ color: 'var(--primary, #367BF5)' }} />
            <span className="miw-toggle-label" style={{ fontSize: '15px', fontWeight: 600 }}>Record Payment</span>
          </div>
          <div className={`miw-toggle-switch ${isPaymentExpanded ? 'active' : ''}`} />
        </div>
      </div>

      {/* Payment Form */}
      {isPaymentExpanded && (
        <div className="miw-payment-form">
          {/* Row 1: Method | Date */}
          <div className="miw-inline-row">
            <div className="miw-inline-item miw-inline-50">
              <label className="miw-label">Method</label>
              <select
                className="miw-input miw-select"
                value={payment.method}
                onChange={(e) => handlePaymentChange('method', e.target.value)}
              >
                {paymentMethods.map((method: any) => (
                  <option key={method.id} value={method.name}>
                    {method.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="miw-inline-item miw-inline-50">
              <label className="miw-label">Date</label>
              <input
                type="date"
                className="miw-input"
                value={payment.paymentDate}
                onChange={(e) => handlePaymentChange('paymentDate', e.target.value)}
              />
            </div>
          </div>

          {/* Row 2: Reference | Amount */}
          <div className="miw-inline-row">
            <div className="miw-inline-item miw-inline-50">
              <label className="miw-label">Reference (Optional)</label>
              <input
                type="text"
                className="miw-input"
                placeholder="Check #, Transaction ID"
                value={payment.reference}
                onChange={(e) => handlePaymentChange('reference', e.target.value)}
              />
            </div>
            
            <div className="miw-inline-item miw-inline-50">
              <label className="miw-label">Amount</label>
              <div style={{ position: 'relative' }}>
                <span style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: '#6b7280',
                  fontWeight: 600,
                  fontSize: '14px'
                }}>$</span>
                <input
                  ref={amountInputRef}
                  type="number"
                  className="miw-input"
                  placeholder="0.00"
                  value={payment.amount || ''}
                  onChange={(e) => handlePaymentChange('amount', parseFloat(e.target.value) || 0)}
                  style={{ paddingLeft: '28px', fontSize: '16px', fontWeight: 600 }}
                />
              </div>
            </div>
          </div>

          {/* Row 3: Notes */}
          <div className="miw-form-section">
            <label className="miw-label">Notes (Optional)</label>
            <textarea
              className="miw-input miw-textarea"
              placeholder="Add notes..."
              value={payment.notes}
              onChange={(e) => handlePaymentChange('notes', e.target.value)}
              style={{ minHeight: '70px' }}
            />
          </div>
        </div>
      )}

      {/* Sticky Footer with Summary and Buttons */}
      <StickyFooter
        subtotal={calculateSubtotal()}
        total={calculateTotal()}
        paid={payment.amount || 0}
        balance={calculateBalance()}
        onBack={handleBack}
        onContinue={handleContinue}
        continueLabel="Review"
      />
    </div>
  );
}
