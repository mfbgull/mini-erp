import { useState } from 'react';
import { X, User, Package, DollarSign, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import './InvoiceWizard.css';

interface InvoiceItem {
  item_id: number;
  item_name: string;
  item_code: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface InvoiceWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InvoiceWizard({ isOpen, onClose }: InvoiceWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form data
  const [customers, setCustomers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(10);
  const [createdInvoice, setCreatedInvoice] = useState<any>(null);

  // Fetch data on mount
  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await api.get('/inventory/items');
      setItems(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    }
  };

  const loadStepData = async () => {
    if (step === 1 && customers.length === 0) await fetchCustomers();
    if (step === 2 && items.length === 0) await fetchItems();
  };

  const handleOpen = () => {
    setStep(1);
    setSelectedCustomer(null);
    setInvoiceItems([]);
    setDiscountPercent(0);
    setTaxPercent(10);
    setCreatedInvoice(null);
    loadStepData();
  };

  // Calculations
  const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * taxPercent) / 100;
  const totalAmount = taxableAmount + taxAmount;

  // Step 1: Customer Selection
  const renderStep1 = () => (
    <div className="wizard-step">
      <div className="step-header">
        <User size={24} />
        <h3>Step 1: Select Customer</h3>
      </div>
      <div className="form-group">
        <label>Choose a customer</label>
        <select
          value={selectedCustomer?.id || ''}
          onChange={(e) => {
            const customer = customers.find(c => c.id === parseInt(e.target.value));
            setSelectedCustomer(customer);
          }}
          className="form-select"
        >
          <option value="">Select a customer...</option>
          {customers.map((customer: any) => (
            <option key={customer.id} value={customer.id}>
              {customer.customer_name} ({customer.customer_code})
            </option>
          ))}
        </select>
      </div>
      <div className="wizard-actions">
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button
          className="btn btn-primary"
          disabled={!selectedCustomer}
          onClick={() => setStep(2)}
        >
          Continue <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );

  // Step 2: Items Selection
  const renderStep2 = () => (
    <div className="wizard-step">
      <div className="step-header">
        <Package size={24} />
        <h3>Step 2: Add Items</h3>
      </div>
      <div className="items-list">
        {items.filter((i: any) => i.current_stock > 0).slice(0, 10).map((item: any) => {
          const existingItem = invoiceItems.find(ii => ii.item_id === item.id);
          return (
            <div key={item.id} className="item-row">
              <div className="item-info">
                <span className="item-name">{item.item_name}</span>
                <span className="item-code">{item.item_code}</span>
                <span className="item-price">${parseFloat(item.standard_price || 0).toFixed(2)}</span>
              </div>
              <div className="item-quantity">
                <input
                  type="number"
                  min="0"
                  max={item.current_stock}
                  value={existingItem?.quantity || ''}
                  onChange={(e) => {
                    const qty = parseInt(e.target.value) || 0;
                    if (qty === 0) {
                      setInvoiceItems(invoiceItems.filter(ii => ii.item_id !== item.id));
                    } else {
                      const total = qty * parseFloat(item.standard_price || 0);
                      if (existingItem) {
                        setInvoiceItems(invoiceItems.map(ii =>
                          ii.item_id === item.id ? { ...ii, quantity: qty, total } : ii
                        ));
                      } else {
                        setInvoiceItems([...invoiceItems, {
                          item_id: item.id,
                          item_name: item.item_name,
                          item_code: item.item_code,
                          quantity: qty,
                          unit_price: parseFloat(item.standard_price || 0),
                          total
                        }]);
                      }
                    }
                  }}
                  className="qty-input"
                  placeholder="0"
                />
                <span className="stock-badge">{item.current_stock} in stock</span>
              </div>
            </div>
          );
        })}
      </div>
      {invoiceItems.length > 0 && (
        <div className="items-summary">
          <span>{invoiceItems.length} items added</span>
          <span>Subtotal: ${subtotal.toFixed(2)}</span>
        </div>
      )}
      <div className="wizard-actions">
        <button className="btn btn-secondary" onClick={() => setStep(1)}>
          <ChevronLeft size={16} /> Back
        </button>
        <button
          className="btn btn-primary"
          disabled={invoiceItems.length === 0}
          onClick={() => setStep(3)}
        >
          Continue <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );

  // Step 3: Pricing & Discounts
  const renderStep3 = () => (
    <div className="wizard-step">
      <div className="step-header">
        <DollarSign size={24} />
        <h3>Step 3: Pricing & Discounts</h3>
      </div>
      <div className="pricing-form">
        <div className="form-group">
          <label>Discount (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={discountPercent}
            onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>Tax Rate (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={taxPercent}
            onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
            className="form-input"
          />
        </div>
      </div>
      <div className="price-breakdown">
        <div className="price-row">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="price-row discount">
          <span>Discount ({discountPercent}%)</span>
          <span>-${discountAmount.toFixed(2)}</span>
        </div>
        <div className="price-row">
          <span>Tax ({taxPercent}%)</span>
          <span>${taxAmount.toFixed(2)}</span>
        </div>
        <div className="price-row total">
          <span>Total</span>
          <span>${totalAmount.toFixed(2)}</span>
        </div>
      </div>
      <div className="wizard-actions">
        <button className="btn btn-secondary" onClick={() => setStep(2)}>
          <ChevronLeft size={16} /> Back
        </button>
        <button className="btn btn-primary" onClick={() => setStep(4)}>
          Continue <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );

  // Step 4: Review
  const renderStep4 = () => (
    <div className="wizard-step">
      <div className="step-header">
        <Check size={24} />
        <h3>Step 4: Review</h3>
      </div>
      <div className="review-section">
        <div className="review-customer">
          <strong>Customer:</strong> {selectedCustomer?.customer_name}
        </div>
        <div className="review-items">
          <h4>Items</h4>
          {invoiceItems.map((item, idx) => (
            <div key={idx} className="review-item">
              <span>{item.item_name} x {item.quantity}</span>
              <span>${item.total.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="review-totals">
          <div className="review-row">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="review-row">
            <span>Discount ({discountPercent}%)</span>
            <span>-${discountAmount.toFixed(2)}</span>
          </div>
          <div className="review-row">
            <span>Tax ({taxPercent}%)</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
          <div className="review-row total">
            <span>Total</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>
      <div className="wizard-actions">
        <button className="btn btn-secondary" onClick={() => setStep(3)}>
          <ChevronLeft size={16} /> Back
        </button>
        <button
          className="btn btn-success"
          onClick={createInvoice}
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Invoice'}
        </button>
      </div>
    </div>
  );

  // Step 5: Confirmation
  const renderStep5 = () => (
    <div className="wizard-step">
      <div className="step-header success">
        <Check size={48} />
        <h3>Invoice Created!</h3>
        <p>Invoice #{createdInvoice?.invoice_no}</p>
      </div>
      <div className="confirmation-details">
        <div className="confirm-row">
          <span>Customer</span>
          <span>{selectedCustomer?.customer_name}</span>
        </div>
        <div className="confirm-row">
          <span>Items</span>
          <span>{invoiceItems.length}</span>
        </div>
        <div className="confirm-row total">
          <span>Total</span>
          <span>${totalAmount.toFixed(2)}</span>
        </div>
      </div>
      <div className="wizard-actions">
        <button className="btn btn-secondary" onClick={handleOpen}>
          Create Another
        </button>
        <button className="btn btn-primary" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );

  const createInvoice = async () => {
    setLoading(true);
    try {
      const response = await api.post('/invoices', {
        customer_id: selectedCustomer.id,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: invoiceItems.map(item => ({
          item_id: item.item_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total
        })),
        discount_percent: discountPercent,
        tax_percent: taxPercent,
        total_amount: totalAmount
      });
      setCreatedInvoice(response.data);
      setStep(5);
      toast.success('Invoice created successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="invoice-wizard-overlay" onClick={onClose}>
      <div className="invoice-wizard-modal" onClick={(e) => e.stopPropagation()}>
        {step < 5 && (
          <div className="wizard-progress">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={`progress-step ${step >= s ? 'active' : ''}`}>
                <div className="step-number">{s}</div>
                <span className="step-label">
                  {s === 1 && 'Customer'}
                  {s === 2 && 'Items'}
                  {s === 3 && 'Pricing'}
                  {s === 4 && 'Review'}
                </span>
              </div>
            ))}
          </div>
        )}
        <button className="wizard-close" onClick={onClose}>
          <X size={20} />
        </button>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
      </div>
    </div>
  );
}
