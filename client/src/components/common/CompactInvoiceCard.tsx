import { useState } from 'react';
import { MoreVertical, Eye, Edit2, X } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/formatters';
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
}

export function CompactInvoiceCard({ invoice, onView, onEdit }: CompactInvoiceCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'status-paid';
      case 'partial': 
      case 'partially paid': return 'status-partial';
      case 'overdue': return 'status-overdue';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-pending';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return '✓';
      case 'partial': 
      case 'partially paid': return '~';
      case 'overdue': return '⚠';
      case 'cancelled': return '✕';
      default: return '○';
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

  const handleView = () => {
    setShowMenu(false);
    onView(invoice);
  };

  const handleEdit = () => {
    setShowMenu(false);
    onEdit(invoice);
  };

  const handleBackdropClick = () => {
    setShowMenu(false);
  };

  return (
    <>
      <div className="compact-invoice-card">
        {/* Clickable content area */}
        <div className="card-content-clickable" onClick={handleCardClick}>
          <div className="invoice-info">
            <p className="invoice-name">{invoice.customer_name}</p>
            <p className="invoice-code">{invoice.invoice_no}</p>
          </div>

          <div className="invoice-amount-info">
            <p className="amount-label">Total</p>
            <p className={`amount-value ${isPaid ? 'amount-paid' : ''}`}>
              {formatCurrency(parseFloat(String(invoice.total_amount || 0)))}
            </p>
            {parseFloat(String(invoice.balance_amount || 0)) > 0 && (
              <p className="amount-balance">
                {formatCurrency(parseFloat(String(invoice.balance_amount || 0)))}
              </p>
            )}
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
                <button type="button" className="dropdown-item" onClick={handleView}>
                  <Eye className="dropdown-icon" />
                  View
                </button>
                <button type="button" className="dropdown-item" onClick={handleEdit}>
                  <Edit2 className="dropdown-icon" />
                  Edit
                </button>
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
                <h3 className="details-title">{invoice.invoice_no}</h3>
                <p className="details-subtitle">{invoice.customer_name}</p>
              </div>
              <button className="close-button" onClick={() => setShowDetails(false)}>
                <X className="close-icon" />
              </button>
            </div>

            <div className="details-content">
              {/* Status */}
              <div className="detail-section">
                <div className={`status-banner ${getStatusColor(invoice.status)}`}>
                  <span className="status-icon">{getStatusIcon(invoice.status)}</span>
                  {invoice.status || 'Pending'}
                </div>
              </div>

              {/* Amounts */}
              <div className="detail-section">
                <h4 className="section-title">Amounts</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Total Amount</span>
                    <span className="detail-value">
                      {formatCurrency(parseFloat(String(invoice.total_amount || 0)))}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Paid Amount</span>
                    <span className="detail-value">
                      {formatCurrency(parseFloat(String(invoice.paid_amount || 0)))}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Balance</span>
                    <span className={`detail-value ${parseFloat(String(invoice.balance_amount || 0)) > 0 ? 'balance-due' : ''}`}>
                      {formatCurrency(parseFloat(String(invoice.balance_amount || 0)))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="detail-section">
                <h4 className="section-title">Dates</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Invoice Date</span>
                    <span className="detail-value">
                      {invoice.invoice_date ? format(new Date(invoice.invoice_date), 'MMMM dd, yyyy') : ''}
                    </span>
                  </div>
                  {invoice.due_date && (
                    <div className="detail-item">
                      <span className="detail-label">Due Date</span>
                      <span className="detail-value">
                        {format(new Date(invoice.due_date), 'MMMM dd, yyyy')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="details-actions">
              <button className="action-btn view-btn" onClick={() => {
                setShowDetails(false);
                onView(invoice);
              }}>
                <Eye className="btn-icon" />
                View Invoice
              </button>
              <button className="action-btn edit-btn" onClick={() => {
                setShowDetails(false);
                onEdit(invoice);
              }}>
                <Edit2 className="btn-icon" />
                Edit Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function CompactInvoiceCardView({ invoices, onView, onEdit }: { invoices: Invoice[], onView: (invoice: Invoice) => void, onEdit: (invoice: Invoice) => void }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filteredInvoices.length === 0) {
    return (
      <div className="compact-mobile-cards-wrapper">
        <div className="compact-mobile-search-container">
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="compact-mobile-search-input"
          />
        </div>
        <div className="mobile-empty-state">
          <div className="empty-icon">📄</div>
          <div className="empty-title">
            {searchTerm ? 'No matching invoices' : 'No invoices found'}
          </div>
          <div className="empty-subtitle">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Create your first invoice to get started'}
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
          placeholder="Search invoices..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="compact-mobile-search-input"
        />
      </div>

      <div className="compact-mobile-cards-container">
        {filteredInvoices.map((invoice) => (
          <CompactInvoiceCard
            key={invoice.id}
            invoice={invoice}
            onView={onView}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
}
