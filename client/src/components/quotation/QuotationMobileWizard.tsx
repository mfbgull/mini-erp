import { X, User, Package, Plus, Check } from 'lucide-react';
import Button from '../common/Button';
import FormInput from '../common/FormInput';
import type { QuotationMobileWizardProps, QuotationFormItem } from '../../types';

export default function QuotationMobileWizard({
  customer,
  customers,
  items,
  inventoryItems,
  quotationDate,
  expiryDate,
  status,
  notes,
  terms,
  currentStep,
  isEditMode,
  isSaving,
  formatCurrency,
  calculateItemTotal,
  calculateSubtotal,
  calculateDiscount,
  calculateTax,
  calculateTotal,
  onSelectCustomer,
  onUpdateQuotationDate,
  onUpdateExpiryDate,
  onUpdateStatus,
  onUpdateNotes,
  onUpdateTerms,
  onAddItem,
  onRemoveItem,
  onStepChange,
  onSubmit,
  onCancel,
}: QuotationMobileWizardProps) {
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="form-section">
            <div className="form-field">
              <label>Select Customer</label>
              <FormInput
                name="customer_name"
                type="searchable-select"
                value={customer ? customer.customer_name : ''}
                onChange={(e) => {
                  const selected = customers.find(c => c.customer_name === e.target.value);
                  if (selected) onSelectCustomer(selected);
                }}
                options={customers.map(c => ({
                  value: c.customer_name,
                  label: `${c.customer_name}${c.customer_code ? ` (${c.customer_code})` : ''}`
                }))}
                placeholder="Search customer..."
              />
            </div>
            {customer && (
              <div className="customer-select-card selected mt-4">
                <div className="customer-info">
                  <div className="customer-icon"><User size={24} /></div>
                  <div className="customer-details">
                    <div className="customer-name">{customer.customer_name}</div>
                    <div className="customer-meta">{customer.email}</div>
                    <div className="customer-meta">{customer.phone}</div>
                  </div>
                </div>
              </div>
            )}
            <div className="form-grid mt-4">
              <div className="form-field">
                <label>Quotation Date</label>
                <input type="date" value={quotationDate} onChange={(e) => onUpdateQuotationDate(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Expiry Date</label>
                <input type="date" value={expiryDate} onChange={(e) => onUpdateExpiryDate(e.target.value)} />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="form-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontWeight: 600 }}>Line Items</h3>
              <Button variant="secondary" onClick={() => onStepChange(3)}>
                <Plus size={16} className="mr-1" /> Add Item
              </Button>
            </div>
            {items.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><Package size={32} /></div>
                <div className="empty-state-title">No items added</div>
                <div className="empty-state-message">Add items to your quotation</div>
                <Button variant="primary" onClick={() => onStepChange(3)}>Add First Item</Button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {items.filter(item => item.item_id || item.description).map(item => (
                  <div key={item.id} className="customer-select-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{item.description || 'Unnamed Item'}</div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                          {item.quantity} x {formatCurrency(item.rate)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600, color: '#2563eb' }}>
                          {formatCurrency(calculateItemTotal(item))}
                        </div>
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="totals-section" style={{ marginTop: '16px' }}>
                  <div className="totals-row"><span>Subtotal</span><span>{formatCurrency(calculateSubtotal())}</span></div>
                  <div className="totals-row"><span>Tax</span><span>{formatCurrency(calculateTax())}</span></div>
                  <div className="totals-row total"><span>Total</span><span>{formatCurrency(calculateTotal())}</span></div>
                </div>
              </div>
            )}
          </div>
        );
      case 3:
        return (
          <div className="form-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontWeight: 600 }}>Select Item</h3>
              <button onClick={() => onStepChange(2)} style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '60vh', overflowY: 'auto' }}>
              {inventoryItems.map(item => (
                <div
                  key={item.id}
                  className="customer-select-card"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onClick={() => {
                    const newItem: QuotationFormItem = {
                      id: Date.now(),
                      item_id: item.id,
                      description: item.item_name,
                      quantity: 1,
                      rate: item.standard_selling_price || 0,
                      tax: 0,
                      discount: { type: 'flat', value: 0 }
                    };
                    onAddItem(newItem);
                    onStepChange(2);
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>{item.item_name}</div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>Stock: {item.current_stock}</div>
                  </div>
                  <div style={{ fontWeight: 600 }}>{formatCurrency(item.standard_selling_price || 0)}</div>
                </div>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="form-section">
            <h3 style={{ fontWeight: 600, marginBottom: '16px' }}>Review Quotation</h3>
            <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Customer</div>
              <div style={{ fontWeight: 500 }}>{customer?.customer_name}</div>
              <div style={{ fontSize: '14px', marginTop: '8px', color: '#6b7280', marginBottom: '4px' }}>Dates</div>
              <div style={{ fontWeight: 500, fontSize: '14px' }}>Date: {quotationDate}</div>
              <div style={{ fontWeight: 500, fontSize: '14px' }}>Expiry: {expiryDate}</div>
            </div>
            <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Summary</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                <span>Subtotal</span><span>{formatCurrency(calculateSubtotal())}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                <span>Discount</span><span>-{formatCurrency(calculateDiscount())}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                <span>Tax</span><span>{formatCurrency(calculateTax())}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, borderTop: '1px solid #e5e7eb', paddingTop: '8px' }}>
                <span>Total</span><span style={{ color: '#2563eb' }}>{formatCurrency(calculateTotal())}</span>
              </div>
            </div>
            <div className="form-field" style={{ marginBottom: '16px' }}>
              <label>Status</label>
              <select value={status} onChange={(e) => onUpdateStatus(e.target.value)}>
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div className="form-field" style={{ marginBottom: '16px' }}>
              <label>Notes</label>
              <textarea value={notes} onChange={(e) => onUpdateNotes(e.target.value)} rows={2} />
            </div>
            <div className="form-field">
              <label>Terms</label>
              <textarea value={terms} onChange={(e) => onUpdateTerms(e.target.value)} rows={2} />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="quotation-form-page">
      <div className="form-header">
        <h2>{isEditMode ? 'Edit Quotation' : 'New Quotation'}</h2>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
          <X size={24} />
        </button>
      </div>

      {currentStep !== 3 && (
        <div className="wizard-steps">
          <button
            className={`wizard-step ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}
            onClick={() => onStepChange(1)}
          >
            <div className="wizard-step-number">{currentStep > 1 ? <Check size={14} /> : '1'}</div>
            <span className="wizard-step-label">Customer</span>
          </button>
          <button
            className={`wizard-step ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`}
            onClick={() => { if (customer) onStepChange(2); }}
          >
            <div className="wizard-step-number">{currentStep > 2 ? <Check size={14} /> : '2'}</div>
            <span className="wizard-step-label">Items</span>
          </button>
          <button
            className={`wizard-step ${currentStep === 4 ? 'active' : ''}`}
            onClick={() => {
              if (!customer) return;
              if (!items.some(i => i.item_id || i.description)) return;
              onStepChange(4);
            }}
          >
            <div className="wizard-step-number">3</div>
            <span className="wizard-step-label">Review</span>
          </button>
        </div>
      )}

      <div className="form-body">{renderStep()}</div>

      <div className="form-actions">
        {currentStep === 1 && (
          <Button variant="primary" onClick={() => { if (customer) onStepChange(2); }}>
            Next: Items
          </Button>
        )}
        {currentStep === 2 && (
          <Button variant="primary" onClick={() => { if (items.some(i => i.item_id || i.description)) onStepChange(4); }}>
            Next: Review
          </Button>
        )}
        {currentStep === 4 && (
          <Button variant="primary" onClick={onSubmit} loading={isSaving}>
            {isEditMode ? 'Update Quotation' : 'Create Quotation'}
          </Button>
        )}
      </div>
    </div>
  );
}
