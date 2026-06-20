import { Hash, Eye, Send } from 'lucide-react';
import Button from '../common/Button';
import FormInput from '../common/FormInput';
import { getStatusColor } from '../../utils/statusColors';
import type { POFormHeaderProps } from '../../types';

export default function PurchaseOrderFormHeader({
  supplier,
  suppliers,
  poDate,
  deliveryDate,
  status,
  warehouseId,
  warehouses,
  company,
  totalAmount,
  formatCurrency,
  isEditMode,
  isSaving,
  id,
  children,
  onSelectSupplier,
  onUpdatePoDate,
  onUpdateDeliveryDate,
  onUpdateStatus,
  onUpdateWarehouse,
  onSubmit,
  onCancel,
}: POFormHeaderProps) {
  return (
    <>
      {/* Action Bar */}
      <div className="action-bar-modern">
        <div className="action-left">
          <select
            value={status}
            onChange={(e) => onUpdateStatus(e.target.value)}
            className={`status-select-modern ${getStatusColor(status)}`}
          >
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Partially Received">Partially Received</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div className="action-right">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          {isEditMode && (
            <button
              className="action-btn-secondary"
              onClick={() => window.location.href = `/purchase-orders/${id}`}
            >
              <Eye className="action-icon" />
              <span>Preview</span>
            </button>
          )}
          <Button variant="primary" onClick={onSubmit} loading={isSaving}>
            <Send className="action-icon" />
            {isEditMode ? 'Update' : 'Create'} Purchase Order
          </Button>
        </div>
      </div>

      {/* Invoice Document — wraps header grid + items table */}
      <div className="invoice-document-modern">
        <div className="invoice-header-modern">
          <div className="header-grid-modern">
            <div className="header-section">
              <h1 className="invoice-title-modern">PURCHASE ORDER</h1>
              <div className="invoice-number-modern">
                <Hash className="hash-icon" />
                <span>{isEditMode ? `PO-${String(id).padStart(4, '0')}` : 'NEW'}</span>
              </div>
            </div>

            <div className="header-section">
              <div className="section-label-modern">FROM</div>
              <div className="company-name-modern">{company.name}</div>
              <div className="contact-info-modern">
                <div>{company.email}</div>
                <div>{company.phone}</div>
              </div>
            </div>

            <div className="header-section customer-section">
              <div className="section-label-modern">SUPPLIER</div>
              <FormInput
                name="supplier_name"
                type="searchable-select"
                value={supplier ? supplier.supplier_name : ''}
                onChange={(e) => {
                  const selected = suppliers.find(s => s.supplier_name === e.target.value);
                  if (selected) onSelectSupplier(selected);
                }}
                options={suppliers.map(s => ({
                  value: s.supplier_name,
                  label: `${s.supplier_name}${s.supplier_code ? ` (${s.supplier_code})` : ''}`
                }))}
                placeholder="Select supplier..."
                required
              />
            </div>

            <div className="header-section text-right">
              <div className="invoice-total-modern">{formatCurrency(totalAmount)}</div>
              <div className="invoice-meta-modern">
                <div>
                  <span className="meta-label">PO Date: </span>
                  <input
                    type="date"
                    value={poDate}
                    onChange={(e) => onUpdatePoDate(e.target.value)}
                    className="date-input-inline"
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit' }}
                  />
                </div>
                <div>
                  <span className="meta-label">Delivery: </span>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => onUpdateDeliveryDate(e.target.value)}
                    className="date-input-inline"
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit' }}
                  />
                </div>
                <div>
                  <span className="meta-label">Warehouse: </span>
                  <select
                    value={warehouseId}
                    onChange={(e) => onUpdateWarehouse(e.target.value)}
                    className="date-input-inline"
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit', cursor: 'pointer' }}
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.warehouse_name || w.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {children}
      </div>
    </>
  );
}
