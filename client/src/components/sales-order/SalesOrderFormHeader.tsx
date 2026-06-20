import { memo } from 'react';
import { Hash, Eye, Send } from 'lucide-react';

import Button from '../common/Button';
import FormInput from '../common/FormInput';
import type { SOFormHeaderProps } from '../../types';
import { getStatusColor } from '../../utils/salesOrderCalculations';

const SOFormHeader = memo(function SOFormHeader({
  customer, soDate, deliveryDate, status, warehouseId,
  customers, warehouses, company,
  mutationPending, id, formatCurrency, calculateTotal,
  onSelectCustomer, onSetSoDate, onSetDeliveryDate, onSetStatus, onSetWarehouseId,
  onSubmit, onBack, onPreview,
}: SOFormHeaderProps) {
  return (
    <>
      <div className="action-bar-modern">
        <div className="action-left">
          <select
            value={status}
            onChange={(e) => onSetStatus(e.target.value)}
            className={`status-select-modern ${getStatusColor(status)}`}
          >
            <option value="Draft">Draft</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Invoiced">Invoiced</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <div className="action-right">
          <Button variant="secondary" onClick={onBack}>
            Cancel
          </Button>
          {id && onPreview && (
            <button className="action-btn-secondary" onClick={onPreview}>
              <Eye className="action-icon" />
              <span>Preview</span>
            </button>
          )}
          <Button variant="primary" onClick={onSubmit} loading={mutationPending}>
            <Send className="action-icon" />
            {id ? 'Update' : 'Create'} Sales Order
          </Button>
        </div>
      </div>

      <div className="invoice-header-modern">
          <div className="header-grid-modern">
            <div className="header-section">
              <h1 className="invoice-title-modern">SALES ORDER</h1>
              <div className="invoice-number-modern">
                <Hash className="hash-icon" />
                <span>{id ? `SO-${String(id).padStart(4, '0')}` : 'NEW'}</span>
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
              <div className="section-label-modern">ORDER TO</div>
              <FormInput
                name="customer_name"
                type="searchable-select"
                value={customer ? customer.customer_name : ''}
                onChange={(e) => {
                  const selected = customers.find((c) => c.customer_name === e.target.value);
                  if (selected) onSelectCustomer(selected);
                }}
                options={customers.map((c) => ({
                  value: c.customer_name,
                  label: `${c.customer_name}${c.customer_code ? ` (${c.customer_code})` : ''}`,
                }))}
                placeholder="Select customer..."
                required
              />
              {customer && (
                <div className="contact-info-modern mt-2">
                  <div>{customer.email}</div>
                  <div>{customer.phone}</div>
                </div>
              )}
            </div>

            <div className="header-section text-right">
              <div className="invoice-total-modern">{formatCurrency(calculateTotal())}</div>
              <div className="invoice-meta-modern">
                <div>
                  <span className="meta-label">SO Date: </span>
                  <input
                    type="date"
                    value={soDate}
                    onChange={(e) => onSetSoDate(e.target.value)}
                    className="date-input-inline"
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit' }}
                  />
                </div>
                <div>
                  <span className="meta-label">Delivery: </span>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => onSetDeliveryDate(e.target.value)}
                    className="date-input-inline"
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit' }}
                  />
                </div>
                <div>
                  <span className="meta-label">Warehouse: </span>
                  <select
                    value={warehouseId}
                    onChange={(e) => onSetWarehouseId(e.target.value)}
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
    </>
  );
});

export default SOFormHeader;
