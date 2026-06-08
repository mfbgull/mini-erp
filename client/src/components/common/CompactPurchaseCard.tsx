import { useState } from 'react';

import { format } from 'date-fns';
import { MoreVertical, Eye, Edit2, X, ShoppingCart, RotateCcw } from 'lucide-react';

import Card from './Card';
import { formatCurrency } from '../../utils/formatters';
import '../../styles/components/card.css';
import './CompactPurchaseCard.css';

interface Purchase {
  id: number;
  purchase_no: string;
  purchase_date: string;
  item_name: string;
  item_code?: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  supplier_name: string;
  warehouse_name: string;
  unit_of_measure?: string;
  invoice_no?: string;
}

interface CompactPurchaseCardProps {
  purchase: Purchase;
  onView: (purchase: Purchase) => void;
  onEdit: (purchase: Purchase) => void;
  onReturn?: (purchase: Purchase) => void;
}

export function CompactPurchaseCard({ purchase, onView, onEdit, onReturn }: CompactPurchaseCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

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
      <Card variant="compact" hoverable className="compact-purchase-card" onClick={handleCardClick}>
        <Card.Row justify="space-between" align="center" className="card-content-clickable">
          <div className="purchase-info-section">
            <p className="purchase-item-name">{purchase.item_name}</p>
            <div className="purchase-meta">
              <span className="purchase-item-code">{purchase.purchase_no}</span>
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
                  <button type="button" className="dropdown-item" onClick={() => { setShowMenu(false); onView(purchase); }}>
                    <Eye className="dropdown-icon" />
                    View
                  </button>
                  <button type="button" className="dropdown-item" onClick={() => { setShowMenu(false); onEdit(purchase); }}>
                    <Edit2 className="dropdown-icon" />
                    Edit
                  </button>
                  {onReturn && (
                    <button type="button" className="dropdown-item" onClick={() => { setShowMenu(false); onReturn(purchase); }}>
                      <RotateCcw className="dropdown-icon" />
                      Return
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="purchase-amount-row">
            <div className="quantity-display">
              <span className="qty-text qty-positive">
                {formatCurrency(parseFloat(String(purchase.total_cost || 0)))}
              </span>
            </div>
          </div>
        </Card.Row>

        <div className="purchase-card-info-row">
          <span className="purchase-qty-text">
            {parseFloat(String(purchase.quantity || 0)).toFixed(2)} {purchase.unit_of_measure || 'units'}
          </span>
          <span className="purchase-date-text">
            {purchase.purchase_date ? format(new Date(purchase.purchase_date), 'dd MMM') : ''}
          </span>
        </div>
      </Card>

      {showDetails && (
        <div className="item-preview-overlay" onClick={() => setShowDetails(false)}>
          <div className="item-preview-container" onClick={(e) => e.stopPropagation()}>
            <div className="swipe-indicator"></div>

            <div className="item-preview-header">
              <div className="item-preview-title-section">
                <h2 className="item-preview-title">{purchase.purchase_no}</h2>
                <span className="item-preview-code">{purchase.item_name}</span>
              </div>
              <button className="item-preview-close" onClick={() => setShowDetails(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="item-preview-content">
              <div className="item-preview-stats">
                <div className="preview-stat">
                  <span className="preview-stat-label">Total</span>
                  <span className="preview-stat-value stock-normal">
                    {formatCurrency(parseFloat(String(purchase.total_cost || 0)))}
                  </span>
                </div>
                <div className="preview-stat">
                  <span className="preview-stat-label">Qty</span>
                  <span className="preview-stat-value">
                    {parseFloat(String(purchase.quantity || 0)).toFixed(2)}
                  </span>
                </div>
                <div className="preview-stat">
                  <span className="preview-stat-label">Unit Cost</span>
                  <span className="preview-stat-value" style={{ fontSize: '14px' }}>
                    {formatCurrency(parseFloat(String(purchase.unit_cost || 0)))}
                  </span>
                </div>
              </div>

              <div className="preview-details-grid">
                <div className="preview-detail-item">
                  <span className="preview-detail-label">Purchase Date</span>
                  <span className="preview-detail-value">
                    {purchase.purchase_date ? format(new Date(purchase.purchase_date), 'dd MMM yyyy') : ''}
                  </span>
                </div>
                {purchase.item_code && (
                  <div className="preview-detail-item">
                    <span className="preview-detail-label">Item Code</span>
                    <span className="preview-detail-value">{purchase.item_code}</span>
                  </div>
                )}
                <div className="preview-detail-item">
                  <span className="preview-detail-label">Supplier</span>
                  <span className="preview-detail-value">{purchase.supplier_name || 'N/A'}</span>
                </div>
                <div className="preview-detail-item">
                  <span className="preview-detail-label">Warehouse</span>
                  <span className="preview-detail-value">{purchase.warehouse_name || 'N/A'}</span>
                </div>
                {purchase.invoice_no && (
                  <div className="preview-detail-item">
                    <span className="preview-detail-label">Invoice No</span>
                    <span className="preview-detail-value">{purchase.invoice_no}</span>
                  </div>
                )}
                <div className="preview-detail-item">
                  <span className="preview-detail-label">Unit</span>
                  <span className="preview-detail-value">{purchase.unit_of_measure || 'units'}</span>
                </div>
              </div>
            </div>

            <div className="item-preview-actions">
              <button className="preview-action-btn edit-btn" onClick={() => { setShowDetails(false); onView(purchase); }}>
                <Eye size={16} />
                View
              </button>
              <button className="preview-action-btn delete-btn" onClick={() => { setShowDetails(false); onEdit(purchase); }}>
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

export default function CompactPurchaseCardView({
  purchases,
  onView,
  onEdit,
  onReturn
}: {
  purchases: Purchase[],
  onView: (purchase: Purchase) => void,
  onEdit: (purchase: Purchase) => void,
  onReturn?: (purchase: Purchase) => void
}) {
  if (purchases.length === 0) {
    return (
      <div className="compact-mobile-cards-wrapper">
        <div className="mobile-empty-state">
          <ShoppingCart className="empty-icon" size={48} />
          <div className="empty-title">No purchases found</div>
          <div className="empty-subtitle">Purchases will appear here</div>
        </div>
      </div>
    );
  }

  return (
    <div className="compact-mobile-cards-wrapper">
      <div className="compact-mobile-cards-container">
        {purchases.map((purchase) => (
          <CompactPurchaseCard key={purchase.id} purchase={purchase} onView={onView} onEdit={onEdit} onReturn={onReturn} />
        ))}
      </div>
    </div>
  );
}
