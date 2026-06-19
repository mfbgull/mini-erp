import { Hash, Eye, Send } from 'lucide-react';
import Button from '../common/Button';
import FormInput from '../common/FormInput';
import { getStatusColor } from '../../utils/quotationCalculations';
import type { QuotationFormHeaderProps } from '../../utils/quotationTypes';

export default function QuotationFormHeader({
  customer,
  customers,
  quotationDate,
  expiryDate,
  status,
  company,
  totalAmount,
  formatCurrency,
  isEditMode,
  isSaving,
  id,
  children,
  onSelectCustomer,
  onUpdateQuotationDate,
  onUpdateExpiryDate,
  onUpdateStatus,
  onSubmit,
  onCancel,
}: QuotationFormHeaderProps & { children?: React.ReactNode }) {
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
            <option value="Sent">Sent</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
            <option value="Converted">Converted</option>
            <option value="Expired">Expired</option>
          </select>
        </div>

        <div className="action-right">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          {isEditMode && (
            <button
              className="action-btn-secondary"
              onClick={() => window.location.href = `/quotations/${id}`}
            >
              <Eye className="action-icon" />
              <span>Preview</span>
            </button>
          )}
          <Button variant="primary" onClick={onSubmit} loading={isSaving}>
            <Send className="action-icon" />
            {isEditMode ? 'Update' : 'Create'} Quotation
          </Button>
        </div>
      </div>

      {/* Invoice Document — wraps header grid + items table */}
      <div className="invoice-document-modern">
        <div className="invoice-header-modern">
          <div className="header-grid-modern quotation-header-grid">
            <div className="header-section">
              <h1 className="invoice-title-modern">QUOTATION</h1>
              <div className="invoice-number-modern">
                <Hash className="hash-icon" />
                <span>{id ? `QTN-${id.toString().padStart(4, '0')}` : 'NEW'}</span>
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
              <div className="section-label-modern">QUOTE TO</div>
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
              <div className="invoice-total-modern">{formatCurrency(totalAmount)}</div>
              <div className="invoice-meta-modern">
                <div>
                  <span className="meta-label">Date: </span>
                  <input
                    type="date"
                    value={quotationDate}
                    onChange={(e) => onUpdateQuotationDate(e.target.value)}
                    className="date-input-inline"
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit' }}
                  />
                </div>
                <div>
                  <span className="meta-label">Expiry: </span>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => onUpdateExpiryDate(e.target.value)}
                    className="date-input-inline"
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit' }}
                  />
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
