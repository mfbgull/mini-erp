import { Eye, Edit2, CreditCard, Users } from 'lucide-react';
import { CompactCardShell } from './CompactCardShell';
import { formatCurrency } from '../../utils/formatters';
import '../../styles/components/card.css';
import './CompactCustomerCard.css';

interface Customer {
  id: number;
  customer_code: string;
  customer_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  current_balance: number;
  credit_limit?: number;
  is_active?: boolean;
  payment_terms_days?: number;
}

interface CompactCustomerCardProps {
  customer: Customer;
  onView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onAddPayment: (customer: Customer) => void;
}

function getBalanceStatus(customer: Customer) {
  if (!customer.current_balance || customer.current_balance === 0) return 'stock-normal';
  if (customer.credit_limit && customer.credit_limit > 0) {
    const utilization = (customer.current_balance / customer.credit_limit) * 100;
    if (utilization >= 90) return 'stock-out-of-stock';
    if (utilization >= 75) return 'stock-low';
  }
  return 'stock-normal';
}

export function CompactCustomerCard({ customer, onView, onEdit, onAddPayment }: CompactCustomerCardProps) {
  return (
    <CompactCardShell
      className={`compact-customer-card ${!customer.is_active ? 'customer-inactive' : ''}`}
      menuItems={[
        { label: 'View', icon: <Eye className="dropdown-icon" />, onClick: () => onView(customer) },
        { label: 'Edit', icon: <Edit2 className="dropdown-icon" />, onClick: () => onEdit(customer) },
        { label: 'Payment', icon: <CreditCard className="dropdown-icon" />, onClick: () => onAddPayment(customer) },
      ]}
      detailTitle={customer.customer_name}
      detailContent={
        <>
          <div className="item-preview-stats">
            <div className="preview-stat">
              <span className="preview-stat-label">Balance</span>
              <span className={`preview-stat-value ${getBalanceStatus(customer)}`}>
                {formatCurrency(parseFloat(String(customer.current_balance || 0)))}
              </span>
            </div>
            <div className="preview-stat">
              <span className="preview-stat-label">Credit Limit</span>
              <span className="preview-stat-value">
                {customer.credit_limit ? formatCurrency(parseFloat(String(customer.credit_limit))) : 'N/A'}
              </span>
            </div>
            <div className="preview-stat">
              <span className="preview-stat-label">Status</span>
              <span className={`preview-stat-value ${customer.is_active ? 'stock-normal' : 'stock-out-of-stock'}`}>
                {customer.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <div className="preview-details-grid">
            {customer.contact_person && (
              <div className="preview-detail-item">
                <span className="preview-detail-label">Contact Person</span>
                <span className="preview-detail-value">{customer.contact_person}</span>
              </div>
            )}
            {customer.phone && (
              <div className="preview-detail-item">
                <span className="preview-detail-label">Phone</span>
                <span className="preview-detail-value">{customer.phone}</span>
              </div>
            )}
            {customer.email && (
              <div className="preview-detail-item full-width">
                <span className="preview-detail-label">Email</span>
                <span className="preview-detail-value">{customer.email}</span>
              </div>
            )}
            {customer.payment_terms_days !== undefined && (
              <div className="preview-detail-item">
                <span className="preview-detail-label">Payment Terms</span>
                <span className="preview-detail-value">{customer.payment_terms_days} days</span>
              </div>
            )}
          </div>
        </>
      }
    >
      <div className="customer-info-section">
        <p className="customer-item-name">{customer.customer_name}</p>
        <div className="customer-meta">
          <span className="customer-item-code">{customer.customer_code}</span>
        </div>
      </div>
      <div className="customer-balance-row">
        <div className="quantity-display">
          <span className={`qty-text ${getBalanceStatus(customer)}`}>
            {formatCurrency(parseFloat(String(customer.current_balance || 0)))}
          </span>
        </div>
      </div>
      <div className="customer-card-status-row">
        <span className="customer-contact">{customer.phone || 'No phone'}</span>
        {!customer.is_active && <span className="inactive-badge">Inactive</span>}
      </div>
    </CompactCardShell>
  );
}

export default function CompactCustomerCardView({
  customers,
  onView,
  onEdit,
  onAddPayment,
}: {
  customers: Customer[];
  onView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onAddPayment: (customer: Customer) => void;
}) {
  if (customers.length === 0) {
    return (
      <div className="compact-mobile-cards-wrapper">
        <div className="mobile-empty-state">
          <Users className="empty-icon" size={48} />
          <div className="empty-title">No customers found</div>
          <div className="empty-subtitle">Add your first customer to get started</div>
        </div>
      </div>
    );
  }

  return (
    <div className="compact-mobile-cards-wrapper">
      <div className="compact-mobile-cards-container">
        {customers.map((customer) => (
          <CompactCustomerCard key={customer.id} customer={customer} onView={onView} onEdit={onEdit} onAddPayment={onAddPayment} />
        ))}
      </div>
    </div>
  );
}
