import { useState } from 'react';

import { format } from 'date-fns';
import { MoreVertical, Eye, X, FileText, CreditCard, Scale, BarChart3, TrendingDown, TrendingUp, ClipboardList, Search } from 'lucide-react';

import Card from './Card';
import '../../styles/components/card.css';
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
  const [showMenu, setShowMenu] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'invoice': return <FileText size={14} />;
      case 'payment': return <CreditCard size={14} />;
      case 'adjustment': return <Scale size={14} />;
      case 'opening_balance': return <BarChart3 size={14} />;
      case 'credit_note': return <TrendingDown size={14} />;
      case 'debit_note': return <TrendingUp size={14} />;
      default: return <ClipboardList size={14} />;
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

  const isDebit = parseFloat(String(entry.debit || 0)) > 0;

  return (
    <>
      <Card variant="compact" hoverable onClick={handleCardClick} className="compact-ledger-card">
        <Card.Row justify="space-between" align="center" className="card-content-clickable">
          <div className="ledger-info-section">
            <p className="ledger-item-name">{entry.transaction_type || 'Transaction'}</p>
            <div className="ledger-meta">
              <span className="ledger-item-code">{entry.reference_no || 'No ref'}</span>
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
                    <button type="button" className="dropdown-item" onClick={() => { setShowMenu(false); onView(entry); }}>
                      <Eye className="dropdown-icon" />
                      View
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="ledger-amount-row">
            <div className="quantity-display">
              <span className={`qty-text ${isDebit ? 'qty-low' : 'qty-positive'}`}>
                {isDebit ? formatCurrency(entry.debit || 0) : formatCurrency(entry.credit || 0)}
              </span>
            </div>
          </div>
        </Card.Row>

        <div className="ledger-card-info-row">
          <span className="ledger-type-text">
            {getTypeIcon(entry.transaction_type)}
            {entry.transaction_type || 'Transaction'}
          </span>
          <span className="ledger-date-text">
            {entry.transaction_date ? format(new Date(entry.transaction_date), 'dd MMM') : ''}
          </span>
        </div>
      </Card>

      {showDetails && (
        <div className="item-preview-overlay" onClick={() => setShowDetails(false)}>
          <div className="item-preview-container" onClick={(e) => e.stopPropagation()}>
            <div className="swipe-indicator"></div>

            <div className="item-preview-header">
              <div className="item-preview-title-section">
                <h2 className="item-preview-title">{entry.transaction_type || 'Transaction'}</h2>
                <span className="item-preview-code">{entry.reference_no || 'No reference'}</span>
              </div>
              <button className="item-preview-close" onClick={() => setShowDetails(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="item-preview-content">
              <div className="item-preview-stats">
                <div className="preview-stat">
                  <span className="preview-stat-label">Debit</span>
                  <span className="preview-stat-value stock-low">
                    {formatCurrency(entry.debit || 0)}
                  </span>
                </div>
                <div className="preview-stat">
                  <span className="preview-stat-label">Credit</span>
                  <span className="preview-stat-value stock-normal">
                    {formatCurrency(entry.credit || 0)}
                  </span>
                </div>
                <div className="preview-stat">
                  <span className="preview-stat-label">Balance</span>
                  <span className={`preview-stat-value ${parseFloat(String(entry.balance || 0)) > 0 ? 'stock-low' : 'stock-normal'}`}>
                    {formatCurrency(entry.balance || 0)}
                  </span>
                </div>
              </div>

              <div className="preview-details-grid">
                <div className="preview-detail-item">
                  <span className="preview-detail-label">Date</span>
                  <span className="preview-detail-value">
                    {entry.transaction_date ? format(new Date(entry.transaction_date), 'dd MMM yyyy') : ''}
                  </span>
                </div>
                <div className="preview-detail-item">
                  <span className="preview-detail-label">Type</span>
                  <span className="preview-detail-value">
                    <span className="status-badge stock-low">
                      {entry.transaction_type || 'Transaction'}
                    </span>
                  </span>
                </div>
                {entry.description && (
                  <div className="preview-detail-item full-width">
                    <span className="preview-detail-label">Description</span>
                    <span className="preview-detail-value">{entry.description}</span>
                  </div>
                )}
              </div>
            </div>

            {onView && (
              <div className="item-preview-actions">
                <button className="preview-action-btn edit-btn" onClick={() => { setShowDetails(false); onView(entry); }}>
                  <Eye size={16} />
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

  const totalDebit = ledger.reduce((sum, item) => sum + parseFloat(String(item.debit || 0)), 0);
  const totalCredit = ledger.reduce((sum, item) => sum + parseFloat(String(item.credit || 0)), 0);
  const currentBalance = totalDebit - totalCredit;

  const ledgerWithBalance = filteredLedger.reduce((acc, entry) => {
    const entryDebit = parseFloat(String(entry.debit || 0));
    const entryCredit = parseFloat(String(entry.credit || 0));
    const previousBalance = acc.length > 0 ? acc[acc.length - 1].calculatedBalance : 0;
    const calculatedBalance = previousBalance + entryDebit - entryCredit;
    acc.push({ ...entry, calculatedBalance });
    return acc;
  }, [] as Array<typeof ledger[0] & { calculatedBalance: number }>);

  if (ledgerWithBalance.length === 0) {
    return (
      <div className="compact-mobile-cards-wrapper">
        <div className="compact-mobile-search-container">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search ledger..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="compact-mobile-search-input"
          />
        </div>
        <div className="mobile-empty-state">
          <BarChart3 className="empty-icon" size={48} />
          <div className="empty-title">{searchTerm ? 'No matching entries' : 'No ledger entries found'}</div>
          <div className="empty-subtitle">{searchTerm ? 'Try adjusting your search' : 'Transactions will appear here'}</div>
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
          placeholder="Search ledger..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="compact-mobile-search-input"
        />
      </div>

      <div className="ledger-totals">
        <div className="totals-grid">
          <div className="total-item">
            <span className="total-label">Total Debit</span>
            <span className="total-value debit">{formatCurrency(totalDebit)}</span>
          </div>
          <div className="total-item">
            <span className="total-label">Total Credit</span>
            <span className="total-value credit">{formatCurrency(totalCredit)}</span>
          </div>
          <div className="total-item">
            <span className="total-label">Current Balance</span>
            <span className={`total-value balance ${currentBalance > 0 ? 'positive' : 'zero'}`}>
              {formatCurrency(currentBalance)}
            </span>
          </div>
        </div>
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
