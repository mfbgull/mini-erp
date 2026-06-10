import { useState } from 'react';

import { format } from 'date-fns';
import { MoreVertical, Eye, Edit2, Trash2, X, FileText, RotateCcw } from 'lucide-react';

import Card from './Card';
import { formatCurrency } from '../../utils/formatters';
import '../../styles/components/card.css';
import './CompactInvoiceCard.css';

interface Invoice {
  id: number;
  invoice_no: string;
  invoice_date: string;
  customer_name: string;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  status: string;
  due_date?: string;
}

interface CompactInvoiceCardProps {
  invoice: Invoice;
  onView: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
  onDelete?: (invoice: Invoice) => void;
  onReturn?: (invoice: Invoice) => void;
  onCancel?: (invoice: Invoice) => void;
}

export function CompactInvoiceCard({ invoice, onView, onEdit, onDelete, onReturn, onCancel }: CompactInvoiceCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const getStatusClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'stock-normal';
      case 'partial':
      case 'partially paid': return 'stock-low';
      case 'overdue': return 'stock-out-of-stock';
      case 'cancelled': return 'stock-out-of-stock';
      default: return 'stock-low';
    }
  };

  const isPaid = parseFloat(String(invoice.balance_amount || '0')) === 0;

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
      <Card variant="compact" hoverable onClick={handleCardClick} className="compact-invoice-card">
        <div className="card-content-clickable">
          <div className="invoice-info-section">
            <p className="invoice-item-name">{invoice.customer_name}</p>
            <div className="invoice-meta">
              <span className="invoice-item-code">{invoice.invoice_no}</span>
            </div>
          </div>

          <div className="invoice-amount-row">
            <div className="quantity-display">
              <span className={`qty-text ${isPaid ? 'qty-positive' : 'qty-low'}`}>
                {formatCurrency(parseFloat(String(invoice.total_amount || 0)))}
              </span>
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
                  <button type="button" className="dropdown-item" onClick={() => { setShowMenu(false); onView(invoice); }}>
                    <Eye className="dropdown-icon" />
                    View
                  </button>
                  <button type="button" className="dropdown-item" onClick={() => { setShowMenu(false); onEdit(invoice); }}>
                    <Edit2 className="dropdown-icon" />
                    Edit
                  </button>
                  {onReturn && (
                    <button type="button" className="dropdown-item" onClick={() => { setShowMenu(false); onReturn(invoice); }}>
                      <RotateCcw className="dropdown-icon" />
                      Return
                    </button>
                  )}
                  {onDelete && (() => {
                    const paidAmt = parseFloat(String(invoice.paid_amount || '0'));
                    const returnedAmt = parseFloat(String((invoice as Record<string, unknown>).returned_amount || '0'));
                    const isDeletable = ['Draft', 'Unpaid'].includes(invoice.status) && paidAmt === 0 && returnedAmt === 0;
                    return isDeletable ? (
                      <button type="button" className="dropdown-item delete" onClick={() => { setShowMenu(false); onDelete(invoice); }}>
                        <Trash2 className="dropdown-icon" />
                        Delete
                      </button>
                    ) : null;
                  })()}
                  {onCancel && invoice.status !== 'Cancelled' && (
                    <button type="button" className="dropdown-item delete" onClick={() => { setShowMenu(false); onCancel(invoice); }}>
                      <X className="dropdown-icon" />
                      Cancel
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="invoice-card-status-row">
          <span className={`status-badge ${getStatusClass(invoice.status)}`}>
            {invoice.status || 'Pending'}
          </span>
          <span className="invoice-date-text">
            {invoice.invoice_date ? format(new Date(invoice.invoice_date), 'dd MMM') : ''}
          </span>
        </div>
      </Card>

      {showDetails && (
        <div className="item-preview-overlay" onClick={() => setShowDetails(false)}>
          <div className="item-preview-container" onClick={(e) => e.stopPropagation()}>
            <div className="swipe-indicator"></div>

            <div className="item-preview-header">
              <div className="item-preview-title-section">
                <h2 className="item-preview-title">{invoice.invoice_no}</h2>
                <span className="item-preview-code">{invoice.customer_name}</span>
              </div>
              <button className="item-preview-close" onClick={() => setShowDetails(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="item-preview-content">
              <div className="item-preview-stats">
                <div className="preview-stat">
                  <span className="preview-stat-label">Total</span>
                  <span className="preview-stat-value">
                    {formatCurrency(parseFloat(String(invoice.total_amount || 0)))}
                  </span>
                </div>
                <div className="preview-stat">
                  <span className="preview-stat-label">Paid</span>
                  <span className="preview-stat-value stock-normal">
                    {formatCurrency(parseFloat(String(invoice.paid_amount || 0)))}
                  </span>
                </div>
                <div className="preview-stat">
                  <span className="preview-stat-label">Balance</span>
                  <span className={`preview-stat-value ${isPaid ? 'stock-normal' : 'stock-out-of-stock'}`}>
                    {formatCurrency(parseFloat(String(invoice.balance_amount || 0)))}
                  </span>
                </div>
              </div>

              <div className="preview-details-grid">
                <div className="preview-detail-item">
                  <span className="preview-detail-label">Status</span>
                  <span className="preview-detail-value">
                    <span className={`status-badge ${getStatusClass(invoice.status)}`}>
                      {invoice.status || 'Pending'}
                    </span>
                  </span>
                </div>
                <div className="preview-detail-item">
                  <span className="preview-detail-label">Invoice Date</span>
                  <span className="preview-detail-value">
                    {invoice.invoice_date ? format(new Date(invoice.invoice_date), 'dd MMM yyyy') : ''}
                  </span>
                </div>
                {invoice.due_date && (
                  <div className="preview-detail-item">
                    <span className="preview-detail-label">Due Date</span>
                    <span className="preview-detail-value">
                      {format(new Date(invoice.due_date), 'dd MMM yyyy')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="item-preview-actions">
              <button className="preview-action-btn edit-btn" onClick={() => { setShowDetails(false); onView(invoice); }}>
                <Eye size={16} />
                View
              </button>
              <button className="preview-action-btn delete-btn" onClick={() => { setShowDetails(false); onEdit(invoice); }}>
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

export default function CompactInvoiceCardView({ invoices, onView, onEdit, onDelete, onReturn, onCancel }: {
  invoices: Invoice[],
  onView: (invoice: Invoice) => void,
  onEdit: (invoice: Invoice) => void,
  onDelete?: (invoice: Invoice) => void,
  onReturn?: (invoice: Invoice) => void,
  onCancel?: (invoice: Invoice) => void
}) {
  if (invoices.length === 0) {
    return (
      <div className="compact-mobile-cards-wrapper">
        <div className="mobile-empty-state">
          <FileText className="empty-icon" size={48} />
          <div className="empty-title">No invoices found</div>
          <div className="empty-subtitle">Invoices will appear here</div>
        </div>
      </div>
    );
  }

  return (
    <div className="compact-mobile-cards-wrapper">
      <div className="compact-mobile-cards-container">
        {invoices.map((invoice) => (
          <CompactInvoiceCard key={invoice.id} invoice={invoice} onView={onView} onEdit={onEdit} onDelete={onDelete} onReturn={onReturn} onCancel={onCancel} />
        ))}
      </div>
    </div>
  );
}
