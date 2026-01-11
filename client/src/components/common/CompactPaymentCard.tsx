import { useState } from 'react';
import { MoreVertical, Eye, Edit2, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/formatters';
import './CompactPaymentCard.css';

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

  const getMethodColor = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'cash': return 'method-cash';
      case 'check': return 'method-check';
      case 'bank transfer': return 'method-bank';
      case 'credit card': return 'method-credit';
      case 'debit card': return 'method-debit';
      default: return 'method-default';
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

  const handleView = () => {
    setShowMenu(false);
    if (onView) {
      onView(payment);
    }
  };

  const handleEdit = () => {
    setShowMenu(false);
    onEdit(payment);
  };

  const handleDelete = () => {
    setShowMenu(false);
    if (onDelete) {
      onDelete(payment);
    }
  };

  const handleBackdropClick = () => {
    setShowMenu(false);
  };

  return (
    <>
      <div className="compact-payment-card">
        {/* Clickable content area */}
        <div className="card-content-clickable" onClick={handleCardClick}>
          <div className="payment-info">
            <p className="payment-no">{payment.payment_no}</p>
            <p className="payment-method-badge">
              <span className={`method-dot ${getMethodColor(payment.payment_method)}`}></span>
              {payment.payment_method || 'Cash'}
            </p>
          </div>

          <div className="payment-amount-info">
            <p className="amount-label">Amount</p>
            <p className="amount-value">
              {formatCurrency(parseFloat(String(payment.amount || 0)))}
            </p>
            <p className="payment-date">
              {payment.payment_date ? format(new Date(payment.payment_date), 'MMM dd, yyyy') : ''}
            </p>
          </div>
        </div>

        {/* Menu button - separate from clickable area */}
        <div className="menu-container">
          <button
            type="button"
            className="menu-trigger"
            onClick={handleMenuToggle}
          >
            <MoreVertical className="menu-icon" />
          </button>

          {showMenu && (
            <>
              <div className="menu-backdrop" onClick={handleBackdropClick} />
              <div className="dropdown-menu">
                {onView && (
                  <button type="button" className="dropdown-item" onClick={handleView}>
                    <Eye className="dropdown-icon" />
                    View
                  </button>
                )}
                <button type="button" className="dropdown-item" onClick={handleEdit}>
                  <Edit2 className="dropdown-icon" />
                  Edit
                </button>
                {onDelete && (
                  <button type="button" className="dropdown-item delete" onClick={handleDelete}>
                    <Trash2 className="dropdown-icon" />
                    Delete
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && (
        <div className="details-modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="details-header">
              <div>
                <h3 className="details-title">{payment.payment_no}</h3>
                {payment.customer_name && (
                  <p className="details-subtitle">{payment.customer_name}</p>
                )}
              </div>
              <button className="close-button" onClick={() => setShowDetails(false)}>
                <X className="close-icon" />
              </button>
            </div>

            <div className="details-content">
              {/* Amount */}
              <div className="detail-section">
                <div className="amount-display">
                  <span className="amount-label">Payment Amount</span>
                  <span className="amount-value-large">
                    {formatCurrency(parseFloat(String(payment.amount || 0)))}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="detail-section">
                <h4 className="section-title">Details</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Payment Date</span>
                    <span className="detail-value">
                      {payment.payment_date ? format(new Date(payment.payment_date), 'MMMM dd, yyyy') : ''}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Payment Method</span>
                    <span className="detail-value">
                      <span className={`method-badge ${getMethodColor(payment.payment_method)}`}>
                        {payment.payment_method || 'Cash'}
                      </span>
                    </span>
                  </div>
                  {payment.reference_no && (
                    <div className="detail-item">
                      <span className="detail-label">Reference No</span>
                      <span className="detail-value">{payment.reference_no}</span>
                    </div>
                  )}
                </div>
              </div>

              {payment.notes && (
                <div className="detail-section">
                  <h4 className="section-title">Notes</h4>
                  <p className="notes-text">{payment.notes}</p>
                </div>
              )}
            </div>

            <div className="details-actions">
              <button className="action-btn edit-btn" onClick={() => {
                setShowDetails(false);
                onEdit(payment);
              }}>
                <Edit2 className="btn-icon" />
                Edit Payment
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
          <input
            type="text"
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="compact-mobile-search-input"
          />
        </div>
        <div className="mobile-empty-state">
          <div className="empty-icon">💳</div>
          <div className="empty-title">
            {searchTerm ? 'No matching payments' : 'No payments found'}
          </div>
          <div className="empty-subtitle">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Record your first payment to get started'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="compact-mobile-cards-wrapper">
      <div className="compact-mobile-search-container">
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
          <CompactPaymentCard
            key={payment.id}
            payment={payment}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
