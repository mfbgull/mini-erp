import { memo } from 'react';
import toast from 'react-hot-toast';
import { X, User, Package, Check, Plus } from 'lucide-react';

import Button from '../common/Button';
import FormInput from '../common/FormInput';
import type { SOMobileWizardProps, SOFormItem } from '../../utils/salesOrderTypes';

const SOMobileWizard = memo(function SOMobileWizard({
  customer, soDate, deliveryDate, status, warehouseId, notes, items, currentStep,
  customers, warehouses, inventoryItems, mutationPending, id,
  formatCurrency, calculateItemTotal, calculateSubtotal, calculateDiscount, calculateTax, calculateTotal,
  onSelectCustomer, onSetSoDate, onSetDeliveryDate, onSetStatus, onSetWarehouseId, onSetNotes,
  onSetCurrentStep, onAddItem, onRemoveItem, onSubmit,
}: SOMobileWizardProps) {
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="form-section">
            <div className="form-field">
              <label>Select Customer</label>
              <FormInput name="customer_name" type="searchable-select"
                value={customer ? customer.customer_name : ''}
                onChange={(e) => {
                  const selected = customers.find((c) => c.customer_name === e.target.value);
                  if (selected) onSelectCustomer(selected);
                }}
                options={customers.map((c) => ({ value: c.customer_name, label: `${c.customer_name}${c.customer_code ? ` (${c.customer_code})` : ''}` }))}
                placeholder="Search customer..." />
            </div>
            {customer && (
              <div className="customer-select-card selected mt-4" style={{ marginTop: '16px' }}>
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
            <div className="form-grid" style={{ marginTop: '16px' }}>
              <div className="form-field">
                <label>SO Date</label>
                <input type="date" value={soDate} onChange={(e) => onSetSoDate(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Delivery Date</label>
                <input type="date" value={deliveryDate} onChange={(e) => onSetDeliveryDate(e.target.value)} />
              </div>
            </div>
            <div className="form-grid" style={{ marginTop: '16px' }}>
              <div className="form-field">
                <label>Warehouse</label>
                <select value={warehouseId} onChange={(e) => onSetWarehouseId(e.target.value)}>
                  <option value="">Select Warehouse</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.warehouse_name || w.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>Status</label>
                <select value={status} onChange={(e) => onSetStatus(e.target.value)}>
                  <option value="Draft">Draft</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Invoiced">Invoiced</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="form-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontWeight: 600 }}>Line Items</h3>
              <Button variant="secondary" onClick={() => onSetCurrentStep(3)}>
                <Plus size={16} style={{ marginRight: '4px' }} /> Add Item
              </Button>
            </div>
            {items.filter((i) => i.item_id).length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><Package size={32} /></div>
                <div className="empty-state-title">No items added</div>
                <div className="empty-state-message">Add items to this sales order</div>
                <Button variant="primary" onClick={() => onSetCurrentStep(3)}>Add First Item</Button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {items.filter((i) => i.item_id || i.name).map((item) => (
                  <div key={item.id} className="customer-select-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{item.name || 'Unnamed Item'}</div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                          {item.quantity} x {formatCurrency(item.unitPrice)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600, color: '#2563eb' }}>{formatCurrency(calculateItemTotal(item))}</div>
                        <button onClick={() => onRemoveItem(item.id)}
                          style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px', background: 'none', border: 'none', cursor: 'pointer' }}>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                    <span>Subtotal</span><span>{formatCurrency(calculateSubtotal())}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                    <span>Discount</span><span>-{formatCurrency(calculateDiscount())}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                    <span>Tax</span><span>{formatCurrency(calculateTax())}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, borderTop: '1px solid #e5e7eb', paddingTop: '8px' }}>
                    <span>Total</span><span style={{ color: '#2563eb' }}>{formatCurrency(calculateTotal())}</span>
                  </div>
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
              <button onClick={() => onSetCurrentStep(2)} style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '60vh', overflowY: 'auto' }}>
              {inventoryItems.map((invItem) => (
                <div key={invItem.id} className="customer-select-card"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onClick={() => {
                    const newItem: SOFormItem = {
                      id: Date.now(), item_id: invItem.id, name: invItem.item_name,
                      quantity: 1, unitPrice: invItem.standard_selling_price || 0, taxRate: 0,
                      discount: { type: 'flat', value: 0 },
                    };
                    onAddItem(newItem);
                    onSetCurrentStep(2);
                  }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{invItem.item_name}</div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>Stock: {invItem.current_stock}</div>
                  </div>
                  <div style={{ fontWeight: 600 }}>{formatCurrency(invItem.standard_selling_price)}</div>
                </div>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="form-section">
            <h3 style={{ fontWeight: 600, marginBottom: '16px' }}>Review Sales Order</h3>
            <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Customer</div>
              <div style={{ fontWeight: 500 }}>{customer?.customer_name}</div>
              <div style={{ fontSize: '14px', marginTop: '8px', color: '#6b7280', marginBottom: '4px' }}>Details</div>
              <div style={{ fontWeight: 500, fontSize: '14px' }}>SO Date: {soDate}</div>
              <div style={{ fontWeight: 500, fontSize: '14px' }}>Delivery: {deliveryDate || 'Not set'}</div>
              <div style={{ fontWeight: 500, fontSize: '14px' }}>
                Warehouse: {warehouses.find((w) => String(w.id) === String(warehouseId))?.warehouse_name || warehouses.find((w) => String(w.id) === String(warehouseId))?.name || 'Not selected'}
              </div>
            </div>
            <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
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
              <select value={status} onChange={(e) => onSetStatus(e.target.value)}>
                <option value="Draft">Draft</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Invoiced">Invoiced</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div className="form-field">
              <label>Notes</label>
              <textarea value={notes} onChange={(e) => onSetNotes(e.target.value)} rows={3} />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="sales-order-form-page">
      <div className="form-header" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>{id ? 'Edit Sales Order' : 'New Sales Order'}</h2>
        <button onClick={() => window.history.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
          <X size={24} />
        </button>
      </div>

      {currentStep !== 3 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '16px', background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
          {[1, 2, 4].map((step) => (
            <button key={step}
              onClick={() => {
                if (step === 2 && !customer) { toast.error('Select customer first'); return; }
                if (step === 4) { if (!customer) { toast.error('Select customer first'); return; } if (!items.some((i) => i.item_id || i.name)) { toast.error('Add items first'); return; } }
                onSetCurrentStep(step);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 500,
                color: currentStep === step ? '#fff' : currentStep > step ? '#2563eb' : '#6b7280',
                background: currentStep === step ? '#2563eb' : currentStep > step ? '#dbeafe' : '#f3f4f6',
                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: currentStep === step ? '#fff' : currentStep > step ? '#2563eb' : '#d1d5db',
                color: currentStep === step ? '#2563eb' : '#fff', fontSize: '12px', fontWeight: 600,
              }}>
                {currentStep > step ? <Check size={14} /> : step === 1 ? '1' : step === 2 ? '2' : '3'}
              </div>
              <span style={{ whiteSpace: 'nowrap' }}>{step === 1 ? 'Customer' : step === 2 ? 'Items' : 'Review'}</span>
            </button>
          ))}
        </div>
      )}

      <div style={{ padding: '24px' }}>{renderStep()}</div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 24px', background: '#f3f4f6', borderTop: '1px solid #e5e7eb' }}>
        {currentStep === 1 && (
          <Button variant="primary" onClick={() => { if (customer) onSetCurrentStep(2); else toast.error('Please select a customer'); }}>
            Next: Items
          </Button>
        )}
        {currentStep === 2 && (
          <Button variant="primary" onClick={() => { if (items.some((i) => i.item_id || i.name)) onSetCurrentStep(4); else toast.error('Please add at least one item'); }}>
            Next: Review
          </Button>
        )}
        {currentStep === 4 && (
          <Button variant="primary" onClick={onSubmit} loading={mutationPending}>
            {id ? 'Update Sales Order' : 'Create Sales Order'}
          </Button>
        )}
      </div>
    </div>
  );
});

export default SOMobileWizard;
