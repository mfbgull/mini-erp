import { useState, useMemo, useCallback } from 'react';

import { format } from 'date-fns';
import { MoreVertical, Eye, X, FileText, CreditCard, Scale, BarChart3, TrendingDown, TrendingUp, ClipboardList, Search, ChevronDown, ChevronRight } from 'lucide-react';

import Card from './Card';
import { groupLedgerByInvoice } from '../../utils/ledgerGrouping';
import type { InvoiceGroup, LedgerGroupNode } from '../../utils/ledgerGrouping';
import type { LedgerEntry } from '../../types';
import { calculateLedgerTotals } from '../../utils/customerCalculations';
import '../../styles/components/card.css';
import './CompactLedgerCard.css';

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
  formatCurrency,
  returnedInvoiceNos
}: {
  ledger: LedgerEntry[],
  onView?: (entry: LedgerEntry) => void,
  formatCurrency: (amount: number | string) => string,
  returnedInvoiceNos?: Set<string>
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const totals = useMemo(() => calculateLedgerTotals(ledger, returnedInvoiceNos), [ledger, returnedInvoiceNos]);

  const filteredLedger = useMemo(() => {
    if (!searchTerm) return ledger;
    const term = searchTerm.toLowerCase();
    return ledger.filter(entry =>
      entry.transaction_type?.toLowerCase().includes(term) ||
      entry.reference_no?.toLowerCase().includes(term) ||
      entry.description?.toLowerCase().includes(term)
    );
  }, [ledger, searchTerm]);

  const groupedNodes = useMemo(() => groupLedgerByInvoice(filteredLedger), [filteredLedger]);

  const toggleGroup = useCallback((gid: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(gid)) next.delete(gid);
      else next.add(gid);
      return next;
    });
  }, []);

  if (groupedNodes.length === 0) {
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
            <span className="total-value debit">{formatCurrency(totals.debit)}</span>
          </div>
          <div className="total-item">
            <span className="total-label">Total Credit</span>
            <span className="total-value credit">{formatCurrency(totals.credit)}</span>
          </div>
          <div className="total-item">
            <span className="total-label">Current Balance</span>
            <span className={`total-value balance ${totals.balance > 0 ? 'positive' : 'zero'}`}>
              {formatCurrency(totals.balance)}
            </span>
          </div>
        </div>
      </div>

      <div className="compact-mobile-cards-container">
        {groupedNodes.map((node) => {
          if (node.type === 'ungrouped') {
            return (
              <CompactLedgerCard
                key={`u-${node.entry.id}`}
                entry={node.entry}
                onView={onView}
                formatCurrency={formatCurrency}
              />
            );
          }

          const group = node as InvoiceGroup;
          const gid = `g-${group.invoice.reference_no}`;
          const isExpanded = expandedGroups.has(gid);

          return (
            <div key={gid} className="ledger-group-mobile">
              <Card
                variant="compact"
                hoverable
                className="ledger-group-header-card"
                onClick={() => toggleGroup(gid)}
              >
                <Card.Row justify="space-between" align="center" className="card-content-clickable">
                  <div className="ledger-info-section">
                    <div className="ledger-group-header-row">
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <p className="ledger-item-name">{group.invoice.reference_no}</p>
                    </div>
                    <div className="ledger-meta">
                      <span className="ledger-item-code">
                        {group.children.length} payment{group.children.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="ledger-amount-row">
                    <div className="quantity-display">
                      <span className="qty-text qty-low">
                        {formatCurrency(group.invoice.debit || 0)}
                      </span>
                    </div>
                  </div>
                </Card.Row>
                <div className="ledger-card-info-row">
                  <span className="ledger-type-text">
                    <FileText size={14} />
                    INVOICE
                  </span>
                  <span className="ledger-date-text">
                    {group.invoice.transaction_date ? format(new Date(group.invoice.transaction_date), 'dd MMM') : ''}
                  </span>
                  <span className={`ledger-balance-badge ${group.balance > 0 ? 'outstanding' : 'paid'}`}>
                    Bal: {formatCurrency(group.balance)}
                  </span>
                </div>
              </Card>

              {isExpanded && (
                <div className="ledger-group-children">
                  {group.children.map((child) => (
                    <div key={child.id} className="ledger-child-wrapper">
                      <CompactLedgerCard
                        entry={child}
                        onView={onView}
                        formatCurrency={formatCurrency}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
