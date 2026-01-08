import { forwardRef } from 'react';
import './InvoiceTemplate.css';

interface InvoiceItem {
  quantity: number;
  unit_price?: number;
  rate?: number;
  tax_rate?: number;
  tax?: number;
  discount_type?: string;
  discount?: { type?: string; value?: number };
  discount_value?: number;
  item_name?: string;
  description?: string;
  item_code?: string;
}

interface Invoice {
  invoice_no: string;
  status: string;
  invoice_date: string;
  due_date: string;
  payment_terms_days?: number;
  customer_name: string;
  customer_address?: string;
  customer_phone?: string;
  customer_email?: string;
  items?: InvoiceItem[];
  notes?: string;
  terms?: string;
  total_amount: number;
  paid_amount?: number;
  balance_amount?: number;
  discount_type?: string;
  discount_value?: number;
}

interface Company {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
}

interface InvoiceTemplateProps {
  invoice: Invoice;
  company?: Company;
}

const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(({ invoice, company }, ref) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const calculateItemTotal = (item: InvoiceItem) => {
    const quantity = parseFloat(item.quantity.toString()) || 0;
    const rate = parseFloat((item.unit_price || item.rate).toString()) || 0;
    const taxRate = parseFloat((item.tax_rate || item.tax).toString()) || 0;
    const discountType = item.discount_type || item.discount?.type || 'flat';
    const discountValue = parseFloat((item.discount_value || item.discount?.value).toString()) || 0;

    let subtotal = quantity * rate;

    if (discountType === 'percentage') {
      subtotal -= subtotal * (discountValue / 100);
    } else {
      subtotal -= discountValue;
    }

    subtotal += subtotal * (taxRate / 100);

    return subtotal;
  };

  const getSubtotal = () => {
    return (invoice.items || []).reduce((sum, item) => {
      const quantity = parseFloat(item.quantity.toString()) || 0;
      const rate = parseFloat((item.unit_price || item.rate).toString()) || 0;
      return sum + (quantity * rate);
    }, 0);
  };

  const getTotalDiscount = () => {
    let discount = 0;

    (invoice.items || []).forEach(item => {
      const quantity = parseFloat(item.quantity.toString()) || 0;
      const rate = parseFloat((item.unit_price || item.rate).toString()) || 0;
      const discountType = item.discount_type || item.discount?.type || 'flat';
      const discountValue = parseFloat((item.discount_value || item.discount?.value).toString()) || 0;
      const subtotal = quantity * rate;

      if (discountType === 'percentage') {
        discount += subtotal * (discountValue / 100);
      } else {
        discount += discountValue;
      }
    });

    if (invoice.discount_type && invoice.discount_value) {
      const subtotal = getSubtotal();
      if (invoice.discount_type === 'percentage') {
        discount += subtotal * (invoice.discount_value / 100);
      } else {
        discount += invoice.discount_value;
      }
    }

    return discount;
  };

  const getTotalTax = () => {
    return (invoice.items || []).reduce((sum, item) => {
      const quantity = parseFloat(item.quantity.toString()) || 0;
      const rate = parseFloat((item.unit_price || item.rate).toString()) || 0;
      const taxRate = parseFloat((item.tax_rate || item.tax).toString()) || 0;
      const discountType = item.discount_type || item.discount?.type || 'flat';
      const discountValue = parseFloat((item.discount_value || item.discount?.value).toString()) || 0;

      let subtotal = quantity * rate;
      if (discountType === 'percentage') {
        subtotal -= subtotal * (discountValue / 100);
      } else {
        subtotal -= discountValue;
      }

      return sum + (subtotal * (taxRate / 100));
    }, 0);
  };

  const getStatusClass = (status: string) => {
    const statusMap: Record<string, string> = {
      'Paid': 'status-paid',
      'Partially Paid': 'status-partial',
      'Unpaid': 'status-unpaid',
      'Overdue': 'status-overdue',
      'Draft': 'status-draft',
      'Cancelled': 'status-cancelled'
    };
    return statusMap[status] || 'status-unpaid';
  };

  return (
    <div className="invoice-template" ref={ref}>
      <div className="invoice-template-header">
        <div className="invoice-template-brand">
          <div className="invoice-template-logo">
            <div className="logo-placeholder">{(company?.name || 'M')[0]}</div>
          </div>
          <div className="invoice-template-company">
            <h1 className="company-name">{company?.name || 'Mini ERP'}</h1>
            <p className="company-detail">{company?.address || '456 Enterprise Ave, BC 12345'}</p>
            <p className="company-detail">{company?.phone || '+1 123 456 7890'}</p>
            <p className="company-detail">{company?.email || 'support@minierp.com'}</p>
            {company?.taxId && <p className="company-detail">Tax ID: {company.taxId}</p>}
          </div>
        </div>
        <div className="invoice-template-title-section">
          <h2 className="invoice-template-title">INVOICE</h2>
          <div className="invoice-template-number">{invoice.invoice_no}</div>
          <div className={`invoice-template-status ${getStatusClass(invoice.status)}`}>
            {invoice.status || 'Unpaid'}
          </div>
        </div>
      </div>

      <div className="invoice-template-info">
        <div className="invoice-template-bill-to">
          <h3 className="info-label">Bill To</h3>
          <p className="customer-name">{invoice.customer_name}</p>
          {invoice.customer_address && <p className="customer-detail">{invoice.customer_address}</p>}
          {invoice.customer_phone && <p className="customer-detail">{invoice.customer_phone}</p>}
          {invoice.customer_email && <p className="customer-detail">{invoice.customer_email}</p>}
        </div>
        <div className="invoice-template-details">
          <div className="detail-row">
            <span className="detail-label">Invoice Date</span>
            <span className="detail-value">{formatDate(invoice.invoice_date)}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Due Date</span>
            <span className="detail-value">{formatDate(invoice.due_date)}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Payment Terms</span>
            <span className="detail-value">Net {invoice.payment_terms_days || 14} Days</span>
          </div>
        </div>
      </div>

      <div className="invoice-template-items">
        <table className="invoice-template-table">
          <thead>
            <tr>
              <th className="col-item">Item</th>
              <th className="col-qty">Qty</th>
              <th className="col-rate">Rate</th>
              <th className="col-discount">Discount</th>
              <th className="col-tax">Tax</th>
              <th className="col-amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items || []).map((item, index) => {
              const quantity = parseFloat(item.quantity.toString()) || 0;
              const rate = parseFloat((item.unit_price || item.rate).toString()) || 0;
              const discountType = item.discount_type || item.discount?.type || 'flat';
              const discountValue = parseFloat((item.discount_value || item.discount?.value).toString()) || 0;
              const taxRate = parseFloat((item.tax_rate || item.tax).toString()) || 0;

              return (
                <tr key={index}>
                  <td className="col-item">
                    <div className="item-name">{item.item_name || item.description}</div>
                    {item.item_code && <div className="item-code">{item.item_code}</div>}
                  </td>
                  <td className="col-qty">{quantity}</td>
                  <td className="col-rate">{formatCurrency(rate)}</td>
                  <td className="col-discount">
                    {discountValue > 0
                      ? (discountType === 'percentage' ? `${discountValue}%` : formatCurrency(discountValue))
                      : '-'
                    }
                  </td>
                  <td className="col-tax">{taxRate > 0 ? `${taxRate}%` : '-'}</td>
                  <td className="col-amount">{formatCurrency(calculateItemTotal(item))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="invoice-template-summary">
        <div className="summary-notes">
          {invoice.notes && (
            <div className="notes-section">
              <h4>Notes</h4>
              <p>{invoice.notes}</p>
            </div>
          )}
          {invoice.terms && (
            <div className="terms-section">
              <h4>Terms & Conditions</h4>
              <p>{invoice.terms}</p>
            </div>
          )}
        </div>
        <div className="summary-totals">
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatCurrency(getSubtotal())}</span>
          </div>
          {getTotalDiscount() > 0 && (
            <div className="summary-row discount">
              <span>Discount</span>
              <span>-{formatCurrency(getTotalDiscount())}</span>
            </div>
          )}
          {getTotalTax() > 0 && (
            <div className="summary-row">
              <span>Tax</span>
              <span>{formatCurrency(getTotalTax())}</span>
            </div>
          )}
          <div className="summary-row total">
            <span>Total</span>
            <span>{formatCurrency(invoice.total_amount)}</span>
          </div>
          {invoice.paid_amount && invoice.paid_amount > 0 && (
            <>
              <div className="summary-row paid">
                <span>Paid</span>
                <span>-{formatCurrency(invoice.paid_amount)}</span>
              </div>
              <div className="summary-row balance">
                <span>Balance Due</span>
                <span>{formatCurrency(invoice.balance_amount || 0)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="invoice-template-footer">
        <div className="footer-message">
          <p>Thank you for your business!</p>
        </div>
        <div className="footer-payment-info">
          <h4>Payment Information</h4>
          <p>Please make payment within {invoice.payment_terms_days || 14} days of invoice date.</p>
          <p>For questions, contact us at {company?.email || 'support@minierp.com'}</p>
        </div>
      </div>
    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';

export default InvoiceTemplate;
