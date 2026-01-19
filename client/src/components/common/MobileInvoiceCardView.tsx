import { Invoice } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface MobileInvoiceCardViewProps {
  invoices: Invoice[];
  onView: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
}

export default function MobileInvoiceCardView({ invoices, onView, onEdit }: MobileInvoiceCardViewProps) {
  if (invoices.length === 0) {
    return (
      <div className="mobile-empty-state">
        <div className="empty-icon">📄</div>
        <div className="empty-title">No invoices found</div>
        <div className="empty-subtitle">Create your first invoice to get started</div>
      </div>
    );
  }

  return (
    <div className="mobile-cards-container">
      {invoices.map((invoice) => {
        const statusClass = getStatusClass(invoice.status);
        const isOverdue = invoice.balance_amount > 0 && new Date(invoice.due_date) < new Date();

        return (
          <div key={invoice.id} className="mobile-card">
            <div className="card-header">
              <div className="invoice-info">
                <div className="invoice-number">{invoice.invoice_no}</div>
                <div className="customer-name">{invoice.customer_name}</div>
              </div>
              <div className={`status-badge ${statusClass}`}>
                {invoice.status || 'Unknown'}
              </div>
            </div>

            <div className="card-content">
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Date</span>
                  <span className="value">{formatDate(invoice.invoice_date)}</span>
                </div>
                <div className="info-item">
                  <span className="label">Due Date</span>
                  <span className={`value ${isOverdue ? 'text-error' : ''}`}>
                    {formatDate(invoice.due_date)}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">Total</span>
                  <span className="value">{formatCurrency(invoice.total_amount)}</span>
                </div>
                <div className="info-item">
                  <span className="label">Paid</span>
                  <span className="value">{formatCurrency(invoice.paid_amount)}</span>
                </div>
              </div>

              <div className="financial-section">
                <div className="financial-item">
                  <span className="label">Balance</span>
                  <span className={`value ${invoice.balance_amount > 0 ? 'balance-outstanding' : 'balance-paid'}`}>
                    {formatCurrency(invoice.balance_amount)}
                  </span>
                </div>
                {invoice.balance_amount > 0 && (
                  <div className="financial-item">
                    <span className="label">Days Overdue</span>
                    <span className="value">
                      {getDaysOverdue(invoice.due_date)}
                    </span>
                  </div>
                )}
              </div>

              {invoice.items && invoice.items.length > 0 && (
                <div className="items-section">
                  <span className="label">Items</span>
                  <div className="items-list">
                    {invoice.items.slice(0, 3).map((item, index) => (
                      <div key={index} className="item-row">
                        <span className="item-name">{item.item_name}</span>
                        <span className="item-qty">Qty: {item.quantity}</span>
                        <span className="item-price">{formatCurrency(item.rate)}</span>
                      </div>
                    ))}
                    {invoice.items.length > 3 && (
                      <div className="more-items">
                        +{invoice.items.length - 3} more items
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="card-actions">
              <button
                className="action-btn view-btn"
                onClick={() => onView(invoice)}
              >
                View Invoice
              </button>
              <button
                className="action-btn edit-btn"
                onClick={() => onEdit(invoice)}
              >
                Edit
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getStatusClass(status: string): string {
  const statusLower = (status || '').toLowerCase();
  if (statusLower.includes('paid')) return 'status-paid';
  if (statusLower.includes('cancelled')) return 'status-cancelled';
  if (statusLower.includes('draft')) return 'status-draft';
  return 'status-submitted';
}

function getDaysOverdue(dueDate: string): string {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Not due';
  if (diffDays === 1) return '1 day overdue';
  return `${diffDays} days overdue`;
}

export default MobileInvoiceCardView;