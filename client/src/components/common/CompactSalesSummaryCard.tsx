import { useState } from 'react';

import { format } from 'date-fns';
import { MoreVertical, Eye, X, Search, BarChart3 } from 'lucide-react';

import Card from './Card';
import { useSettings } from '../../context/SettingsContext';

import './CompactItemCard.css';

interface SalesSummaryItem {
  invoice_date: string;
  invoice_no: string;
  customer_id: number;
  customer_name: string;
  total_sales: number;
  total_items: number;
  paid_amount: number;
  balance_amount: number;
  status: string;
}

interface CompactSalesSummaryCardProps {
  sale: SalesSummaryItem;
}

export function CompactSalesSummaryCard({ sale }: CompactSalesSummaryCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { formatCurrency } = useSettings();

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

  const isPaid = parseFloat(String(sale.balance_amount || '0')) === 0;

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
      <Card variant="compact" hoverable onClick={handleCardClick} className="compact-item-card">
        <Card.Row justify="space-between" align="center" className="card-content-clickable">
          <div className="item-info-section">
            <p className="item-item-name">{sale.customer_name}</p>
            <div className="item-meta">
              <span className="item-item-code">{sale.invoice_no}</span>
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
                  <button type="button" className="dropdown-item" onClick={() => { setShowMenu(false); setShowDetails(true); }}>
                    <Eye className="dropdown-icon" />
                    View Details
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="item-stock-row">
            <div className="quantity-display">
              <span className={`qty-text ${isPaid ? 'qty-positive' : 'qty-low'}`}>
                {formatCurrency(parseFloat(String(sale.total_sales || 0)))}
              </span>
            </div>
            <span className={`status-badge ${getStatusClass(sale.status)}`}>
              {sale.status || 'Pending'}
            </span>
          </div>
        </Card.Row>
      </Card>

      {showDetails && (
        <div className="item-preview-overlay" onClick={() => setShowDetails(false)}>
          <div className="item-preview-container" onClick={(e) => e.stopPropagation()}>
            <div className="swipe-indicator"></div>
            <div className="item-preview-header">
              <div className="item-preview-title-section">
                <h2 className="item-preview-title">{sale.invoice_no}</h2>
                <span className="item-preview-code">{sale.customer_name}</span>
              </div>
              <button className="item-preview-close" onClick={() => setShowDetails(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="item-preview-content">
              <div className="item-preview-stats">
                <div className="preview-stat">
                  <span className="preview-stat-label">Total Sales</span>
                  <span className="preview-stat-value">
                    {formatCurrency(parseFloat(String(sale.total_sales || 0)))}
                  </span>
                </div>
                <div className="preview-stat">
                  <span className="preview-stat-label">Paid</span>
                  <span className="preview-stat-value stock-normal">
                    {formatCurrency(parseFloat(String(sale.paid_amount || 0)))}
                  </span>
                </div>
                <div className="preview-stat">
                  <span className="preview-stat-label">Balance</span>
                  <span className={`preview-stat-value ${isPaid ? 'stock-normal' : 'stock-out-of-stock'}`}>
                    {formatCurrency(parseFloat(String(sale.balance_amount || 0)))}
                  </span>
                </div>
              </div>

              <div className="preview-details-grid">
                <div className="preview-detail-item">
                  <span className="preview-detail-label">Status</span>
                  <span className="preview-detail-value">
                    <span className={`status-badge ${getStatusClass(sale.status)}`}>
                      {sale.status || 'Pending'}
                    </span>
                  </span>
                </div>
                <div className="preview-detail-item">
                  <span className="preview-detail-label">Invoice Date</span>
                  <span className="preview-detail-value">
                    {sale.invoice_date ? format(new Date(sale.invoice_date), 'dd MMM yyyy') : '-'}
                  </span>
                </div>
                <div className="preview-detail-item">
                  <span className="preview-detail-label">Items Sold</span>
                  <span className="preview-detail-value">{sale.total_items || 0}</span>
                </div>
                <div className="preview-detail-item">
                  <span className="preview-detail-label">Customer</span>
                  <span className="preview-detail-value">{sale.customer_name}</span>
                </div>
              </div>
            </div>

            <div className="item-preview-actions">
              <button className="preview-action-btn edit-btn" onClick={() => setShowDetails(false)}>
                <Eye size={16} />
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface CompactSalesSummaryCardViewProps {
  sales: SalesSummaryItem[];
}

export default function CompactSalesSummaryCardView({ sales }: CompactSalesSummaryCardViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSales = sales.filter(sale =>
    sale.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filteredSales.length === 0) {
    return (
      <div className="compact-mobile-cards-wrapper">
        <div className="compact-mobile-search-container">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search by customer or invoice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="compact-mobile-search-input"
          />
        </div>
        <div className="mobile-empty-state">
          <BarChart3 className="empty-icon" size={48} />
          <div className="empty-title">{searchTerm ? 'No matching sales' : 'No sales data'}</div>
          <div className="empty-subtitle">{searchTerm ? 'Try adjusting your search' : 'Sales data will appear here'}</div>
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
          placeholder="Search by customer or invoice..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="compact-mobile-search-input"
        />
      </div>
      <div className="compact-mobile-cards-container">
        {filteredSales.map((sale, index) => (
          <CompactSalesSummaryCard
            key={`${sale.invoice_no}-${index}`}
            sale={sale}
          />
        ))}
      </div>
    </div>
  );
}
