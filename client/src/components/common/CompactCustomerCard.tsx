import { useState } from 'react';

import { MoreVertical, Eye, Edit2, CreditCard, X, Users } from 'lucide-react';

import Card from './Card';
import { formatCurrency } from '../../utils/formatters';
import '../../styles/components/card.css';

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

export function CompactCustomerCard({ customer, onView, onEdit, onAddPayment }: CompactCustomerCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const getBalanceStatus = (customer: Customer) => {
    if (!customer.current_balance || customer.current_balance === 0) {
      return 'stock-normal';
    }
    if (customer.credit_limit && customer.credit_limit > 0) {
      const utilization = (customer.current_balance / customer.credit_limit) * 100;
      if (utilization >= 90) return 'stock-out-of-stock';
      if (utilization >= 75) return 'stock-low';
    }
    return 'stock-normal';
  };

  const handleCardClick = () => {
    setShowDetails(true);
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(prev => !prev);
  };

  const handleBackdropClick = () => {
    setShowMenu(false);
  };

  return (
    <>
      <Card variant="compact" hoverable onClick={handleCardClick} className={`compact-customer-card ${!customer.is_active ? 'customer-inactive' : ''}`}>
        <Card.Row justify="space-between" align="center" className="card-content-clickable">
          <div className="customer-info-section">
            <p className="customer-item-name">{customer.customer_name}</p>
            <div className="customer-meta">
              <span className="customer-item-code">{customer.customer_code}</span>
            </div>
          </div>

          <div className="menu-container" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="menu-trigger" onClick={handleMenuToggle}>
              <MoreVertical className="menu-icon" />
            </button>

            {showMenu && (
              <>
                <div className="menu-backdrop" onClick={handleBackdropClick} />
                <div className="dropdown-menu">
                  <button type="button" className="dropdown-item" onClick={() => { setShowMenu(false); onView(customer); }}>
                    <Eye className="dropdown-icon" />
                    View
                  </button>
                  <button type="button" className="dropdown-item" onClick={() => { setShowMenu(false); onEdit(customer); }}>
                    <Edit2 className="dropdown-icon" />
                    Edit
                  </button>
                  <button type="button" className="dropdown-item" onClick={() => { setShowMenu(false); onAddPayment(customer); }}>
                    <CreditCard className="dropdown-icon" />
                    Payment
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="customer-balance-row">
            <div className="quantity-display">
              <span className={`qty-text ${getBalanceStatus(customer)}`}>
                {formatCurrency(parseFloat(String(customer.current_balance || 0)))}
              </span>
            </div>
          </div>
        </Card.Row>

        <div className="customer-card-status-row">
          <span className="customer-contact">
            {customer.phone || 'No phone'}
          </span>
          {!customer.is_active && (
            <span className="inactive-badge">Inactive</span>
          )}
        </div>
      </Card>

      {showDetails && (
        <div className="item-preview-overlay" onClick={() => setShowDetails(false)}>
          <div className="item-preview-container" onClick={(e) => e.stopPropagation()}>
            <div className="swipe-indicator"></div>

            <div className="item-preview-header">
              <div className="item-preview-title-section">
                <h2 className="item-preview-title">{customer.customer_name}</h2>
                <span className="item-preview-code">{customer.customer_code}</span>
              </div>
              <button className="item-preview-close" onClick={() => setShowDetails(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="item-preview-content">
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
            </div>

            <div className="item-preview-actions">
              <button className="preview-action-btn edit-btn" onClick={() => { setShowDetails(false); onView(customer); }}>
                <Eye size={16} />
                View
              </button>
              <button className="preview-action-btn delete-btn" onClick={() => { setShowDetails(false); onEdit(customer); }}>
                <Edit2 size={16} />
                Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function CompactCustomerCardView({
  customers,
  onView,
  onEdit,
  onAddPayment
}: {
  customers: Customer[],
  onView: (customer: Customer) => void,
  onEdit: (customer: Customer) => void,
  onAddPayment: (customer: Customer) => void
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
