import { useState } from 'react';

import { format } from 'date-fns';
import { MoreVertical, Eye, Edit2, Trash2, X, CreditCard, Search } from 'lucide-react';

import Card from './Card';
import { formatCurrency } from '../../utils/formatters';
import '../../styles/components/card.css';

interface Payment {
  id: number;
  payment_no: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  reference_no?: string;
  notes?: string;
  customer_name?: string;
}

interface CompactPaymentCardProps {
  payment: Payment;
  onView?: (payment: Payment) => void;
  onEdit: (payment: Payment) => void;
  onDelete?: (payment: Payment) => void;
}

export function CompactPaymentCard({ payment, onView, onEdit, onDelete }: CompactPaymentCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const getMethodClass = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'cash': return 'stock-normal';
      case 'check': return 'stock-low';
      case 'bank transfer': return 'stock-normal';
      case 'credit card': return 'stock-low';
      case 'debit card': return 'stock-normal';
      default: return 'stock-normal';
    }
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
      <Card variant="compact" hoverable className="compact-payment-card" onClick={handleCardClick}>
        <Card.Row justify="space-between" align="center" className="card-content-clickable">
          <div className="payment-info-section">
            <p className="payment-item-name">{payment.payment_no}</p>
            <div className="payment-meta">
              <span className="payment-item-code">{payment.payment_method || 'Cash'}</span>
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
                  {onView && (
                    <button type="button" className="dropdown-item" onClick={() => { setShowMenu(false); onView(payment); }}>
                      <Eye className="dropdown-icon" />
                      View
                    </button>
                  )}
                  <button type="button" className="dropdown-item" onClick={() => { setShowMenu(false); onEdit(payment); }}>
                    <Edit2 className="dropdown-icon" />
                    Edit
                  </button>
                  {onDelete && (
                    <button type="button" className="dropdown-item delete" onClick={() => { setShowMenu(false); onDelete(payment); }}>
                      <Trash2 className="dropdown-icon" />
                      Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="payment-amount-row">
            <div className="quantity-display">
              <span className="qty-text qty-positive">
                {formatCurrency(parseFloat(String(payment.amount || 0)))}
              </span>
            </div>
          </div>
        </Card.Row>

        <div className="payment-card-date-row">
          <span className="payment-method-badge">
            {payment.payment_method || 'Cash'}
          </span>
          <span className="payment-date-text">
            {payment.payment_date ? format(new Date(payment.payment_date), 'dd MMM') : ''}
          </span>
        </div>
      </Card>

      {showDetails && (
        <div className="item-preview-overlay" onClick={() => setShowDetails(false)}>
          <div className="item-preview-container" onClick={(e) => e.stopPropagation()}>
            <div className="swipe-indicator"></div>

            <div className="item-preview-header">
              <div className="item-preview-title-section">
                <h2 className="item-preview-title">{payment.payment_no}</h2>
                <span className="item-preview-code">{payment.customer_name || 'Payment'}</span>
              </div>
              <button className="item-preview-close" onClick={() => setShowDetails(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="item-preview-content">
              <div className="item-preview-stats">
                <div className="preview-stat">
                  <span className="preview-stat-label">Amount</span>
                  <span className="preview-stat-value stock-normal">
                    {formatCurrency(parseFloat(String(payment.amount || 0)))}
                  </span>
                </div>
                <div className="preview-stat">
                  <span className="preview-stat-label">Method</span>
                  <span className="preview-stat-value" style={{ fontSize: '14px' }}>
                    {payment.payment_method || 'Cash'}
                  </span>
                </div>
                <div className="preview-stat">
                  <span className="preview-stat-label">Date</span>
                  <span className="preview-stat-value" style={{ fontSize: '14px' }}>
                    {payment.payment_date ? format(new Date(payment.payment_date), 'dd MMM') : ''}
                  </span>
                </div>
              </div>

              <div className="preview-details-grid">
                <div className="preview-detail-item">
                  <span className="preview-detail-label">Payment Date</span>
                  <span className="preview-detail-value">
                    {payment.payment_date ? format(new Date(payment.payment_date), 'dd MMM yyyy') : ''}
                  </span>
                </div>
                <div className="preview-detail-item">
                  <span className="preview-detail-label">Payment Method</span>
                  <span className="preview-detail-value">
                    <span className={`status-badge ${getMethodClass(payment.payment_method)}`}>
                      {payment.payment_method || 'Cash'}
                    </span>
                  </span>
                </div>
                {payment.reference_no && (
                  <div className="preview-detail-item">
                    <span className="preview-detail-label">Reference No</span>
                    <span className="preview-detail-value">{payment.reference_no}</span>
                  </div>
                )}
                {payment.notes && (
                  <div className="preview-detail-item full-width">
                    <span className="preview-detail-label">Notes</span>
                    <span className="preview-detail-value">{payment.notes}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="item-preview-actions">
              <button className="preview-action-btn edit-btn" onClick={() => { setShowDetails(false); onEdit(payment); }}>
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

export default function CompactPaymentCardView({
  payments,
  onView,
  onEdit,
  onDelete
}: {
  payments: Payment[],
  onView?: (payment: Payment) => void,
  onEdit: (payment: Payment) => void,
  onDelete?: (payment: Payment) => void
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPayments = payments.filter(payment =>
    payment.payment_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.payment_method?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.reference_no?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filteredPayments.length === 0) {
    return (
      <div className="compact-mobile-cards-wrapper">
        <div className="compact-mobile-search-container">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="compact-mobile-search-input"
          />
        </div>
        <div className="mobile-empty-state">
          <CreditCard className="empty-icon" size={48} />
          <div className="empty-title">{searchTerm ? 'No matching payments' : 'No payments found'}</div>
          <div className="empty-subtitle">{searchTerm ? 'Try adjusting your search' : 'Payments will appear here'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="compact-mobile-cards-wrapper">
      <div className="compact-mobile-search-container">
        <Search className="search-icon" size={18} />
        <input
          type="text"
          placeholder="Search payments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="compact-mobile-search-input"
        />
      </div>

      <div className="compact-mobile-cards-container">
        {filteredPayments.map((payment) => (
          <CompactPaymentCard key={payment.id} payment={payment} onView={onView} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}
