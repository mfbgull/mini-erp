import { Customer } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface MobileCardViewProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onAddPayment: (customer: Customer) => void;
  onRecalculate: (id: number) => void;
}

export default function MobileCardView({
  customers,
  onEdit,
  onAddPayment,
  onRecalculate
}: MobileCardViewProps) {
  if (customers.length === 0) {
    return (
      <div className="mobile-empty-state">
        <div className="empty-icon">📋</div>
        <div className="empty-title">No customers found</div>
        <div className="empty-subtitle">Create your first customer to get started</div>
      </div>
    );
  }

  return (
    <div className="mobile-cards-container">
      {customers.map((customer) => {
        const utilization = customer.credit_limit
          ? ((customer.current_balance || 0) / customer.credit_limit) * 100
          : 0;

        return (
          <div key={customer.id} className="mobile-card">
            <div className="card-header">
              <div className="customer-info">
                <div className="customer-name">{customer.customer_name}</div>
                <div className="customer-code">Code: {customer.customer_code}</div>
              </div>
              <div className="status-badge">
                {customer.is_active ? (
                  <span className="status-active">Active</span>
                ) : (
                  <span className="status-inactive">Inactive</span>
                )}
              </div>
            </div>

            <div className="card-content">
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Contact</span>
                  <span className="value">
                    {customer.contact_person || '—'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">Phone</span>
                  <span className="value">{customer.phone}</span>
                </div>
                <div className="info-item">
                  <span className="label">Email</span>
                  <span className="value">{customer.email || '—'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Payment Terms</span>
                  <span className="value">{customer.payment_terms_days || 0} days</span>
                </div>
              </div>

              <div className="financial-section">
                <div className="financial-item">
                  <span className="label">Credit Limit</span>
                  <span className="value">{formatCurrency(customer.credit_limit || 0)}</span>
                </div>
                <div className="financial-item">
                  <span className="label">Current Balance</span>
                  <span className={`value ${customer.current_balance > 0 ? 'balance-outstanding' : 'balance-paid'}`}>
                    {formatCurrency(customer.current_balance || 0)}
                  </span>
                </div>
                <div className="financial-item">
                  <span className="label">Credit Used</span>
                  <div className="utilization-container">
                    <div className="utilization-bar">
                      <div
                        className={`utilization-fill ${getUtilizationClass(utilization)}`}
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                      />
                    </div>
                    <span className={`utilization-text ${getUtilizationClass(utilization)}`}>
                      {utilization.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {customer.billing_address && (
                <div className="address-section">
                  <span className="label">Billing Address</span>
                  <div className="address-value">{customer.billing_address}</div>
                </div>
              )}
            </div>

            <div className="card-actions">
              <button
                className="action-btn view-btn"
                onClick={() => window.location.href = `/customers/${customer.id}`}
              >
                View Details
              </button>
              <button
                className="action-btn edit-btn"
                onClick={() => onEdit(customer)}
              >
                Edit
              </button>
              <button
                className="action-btn payment-btn"
                onClick={() => onAddPayment(customer)}
              >
                Add Payment
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getUtilizationClass(utilization: number): string {
  if (utilization >= 90) return 'utilization-high';
  if (utilization >= 75) return 'utilization-medium';
  return 'utilization-low';
}

export default MobileCardView;