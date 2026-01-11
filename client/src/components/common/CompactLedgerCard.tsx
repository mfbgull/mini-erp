import { useState } from 'react';
import { MoreVertical, Eye, X } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/formatters';
import './CompactLedgerCard.css';

interface LedgerEntry {
  id: number;
  transaction_date: string;
  transaction_type: string;
  reference_no?: string;
  description?: string;
  debit: number;
  credit: number;
  balance: number;
}

interface CompactLedgerCardProps {
  entry: LedgerEntry;
  onView?: (entry: LedgerEntry) => void;
  formatCurrency: (amount: number | string) => string;
}

export function CompactLedgerCard({ entry, onView, formatCurrency }: CompactLedgerCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'invoice': return 'type-invoice';
      case 'payment': return 'type-payment';
      case 'adjustment': return 'type-adjustment';
      case 'opening_balance': return 'type-opening';
      case 'credit_note': return 'type-credit';
      case 'debit_note': return 'type-debit';
      default: return 'type-default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'invoice': return '📄';
      case 'payment': return '💳';
      case 'adjustment': return '⚖️';
      case 'opening_balance': return '📊';
      case 'credit_note': return '📉';
      case 'debit_note': return '📈';
      default: return '📋';
    }
  };

  const handleCardClick = () => {
    setShowDetails(true);
  };

  const isDebit = parseFloat(String(entry.debit || 0)) > 0;
  const isCredit = parseFloat(String(entry.credit || 0)) > 0;

  return (
    <>
      <div className="compact-ledger-card" onClick={handleCardClick}>
        <div className="ledger-date">
          <span className="date-day">
            {entry.transaction_date ? format(new Date(entry.transaction_date), 'dd') : ''}
          </span>
          <span className="date-month">
            {entry.transaction_date ? format(new Date(entry.transaction_date), 'MMM') : ''}
          </span>
        </div>

        <div className="ledger-info">
          <p className="ledger-type">
            <span className="type-icon">{getTypeIcon(entry.transaction_type)}</span>
            {entry.transaction_type || 'Transaction'}
          </p>
          {entry.reference_no && (
            <p className="ledger-ref">{entry.reference_no}</p>
          )}
        </div>

        <div className="ledger-amounts">
          {isDebit && (
            <p className="amount-debit">
              {formatCurrency(entry.debit || 0)}
            </p>
          )}
          {isCredit && (
            <p className="amount-credit">
              {formatCurrency(entry.credit || 0)}
            </p>
          )}
          <p className="amount-balance">
            {formatCurrency(entry.balance || 0)}
          </p>
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && (
        <div className="details-modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="details-header">
              <div>
                <h3 className="details-title">{entry.transaction_type || 'Transaction'}</h3>
                {entry.reference_no && (
                  <p className="details-subtitle">{entry.reference_no}</p>
                )}
              </div>
              <button className="close-button" onClick={() => setShowDetails(false)}>
                <X className="close-icon" />
              </button>
            </div>

            <div className="details-content">
              {/* Transaction Type */}
              <div className="detail-section">
                <div className={`type-banner ${getTypeColor(entry.transaction_type)}`}>
                  <span className="type-icon-large">{getTypeIcon(entry.transaction_type)}</span>
                  {entry.transaction_type || 'Transaction'}
                </div>
              </div>

              {/* Amounts */}
              <div className="detail-section">
                <h4 className="section-title">Amounts</h4>
                <div className="detail-grid">
                  {isDebit && (
                    <div className="detail-item">
                      <span className="detail-label">Debit</span>
                      <span className="detail-value debit">
                        {formatCurrency(entry.debit || 0)}
                      </span>
                    </div>
                  )}
                  {isCredit && (
                    <div className="detail-item">
                      <span className="detail-label">Credit</span>
                      <span className="detail-value credit">
                        {formatCurrency(entry.credit || 0)}
                      </span>
                    </div>
                  )}
                  <div className="detail-item">
                    <span className="detail-label">Balance</span>
                    <span className={`detail-value ${parseFloat(String(entry.balance || 0)) > 0 ? 'debit' : 'credit'}`}>
                      {formatCurrency(entry.balance || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="detail-section">
                <h4 className="section-title">Details</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Date</span>
                    <span className="detail-value">
                      {entry.transaction_date ? format(new Date(entry.transaction_date), 'MMMM dd, yyyy') : ''}
                    </span>
                  </div>
                  {entry.reference_no && (
                    <div className="detail-item">
                      <span className="detail-label">Reference</span>
                      <span className="detail-value">{entry.reference_no}</span>
                    </div>
                  )}
                </div>
              </div>

              {entry.description && (
                <div className="detail-section">
                  <h4 className="section-title">Description</h4>
                  <p className="description-text">{entry.description}</p>
                </div>
              )}
            </div>

            {onView && (
              <div className="details-actions">
                <button className="action-btn view-btn" onClick={() => {
                  setShowDetails(false);
                  onView(entry);
                }}>
                  <Eye className="btn-icon" />
                  View Details
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function CompactLedgerCardView({ 
  ledger, 
  onView,
  formatCurrency 
}: { 
  ledger: LedgerEntry[], 
  onView?: (entry: LedgerEntry) => void,
  formatCurrency: (amount: number | string) => string
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLedger = ledger.filter(entry =>
    entry.transaction_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.reference_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate running balance
  let runningBalance = 0;
  const ledgerWithBalance = filteredLedger.map(entry => {
    runningBalance += parseFloat(String(entry.debit || 0)) - parseFloat(String(entry.credit || 0));
    return { ...entry, calculatedBalance: runningBalance };
  });

  if (ledgerWithBalance.length === 0) {
    return (
      <div className="compact-mobile-cards-wrapper">
        <div className="compact-mobile-search-container">
          <input
            type="text"
            placeholder="Search ledger..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="compact-mobile-search-input"
          />
        </div>
        <div className="mobile-empty-state">
          <div className="empty-icon">📊</div>
          <div className="empty-title">
            {searchTerm ? 'No matching entries' : 'No ledger entries found'}
          </div>
          <div className="empty-subtitle">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Transaction history will appear here'}
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
          placeholder="Search ledger..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="compact-mobile-search-input"
        />
      </div>

      <div className="compact-mobile-cards-container">
        {ledgerWithBalance.map((entry) => (
          <CompactLedgerCard
            key={entry.id}
            entry={{ ...entry, balance: entry.calculatedBalance || entry.balance }}
            onView={onView}
            formatCurrency={formatCurrency}
          />
        ))}
      </div>
    </div>
  );
}
