import { useState } from 'react';

import { format } from 'date-fns';
import { ArrowUp, ArrowDown, X, Download, Upload, Factory, ArrowLeftRight, Settings, ClipboardList } from 'lucide-react';

import Card from './Card';
import '../../styles/components/card.css';

interface StockMovement {
  id: number;
  movement_no: string;
  movement_date: string;
  item_code: string;
  item_name: string;
  warehouse_name: string;
  movement_type: string;
  quantity: number;
  unit_of_measure: string;
  remarks?: string;
}

interface CompactStockMovementCardProps {
  movement: StockMovement;
}

export function CompactStockMovementCard({ movement }: CompactStockMovementCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const isStockIn = movement.quantity >= 0;

  const getTypeBadgeClass = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'PURCHASE':
        return 'type-purchase';
      case 'SALE':
        return 'type-sale';
      case 'PRODUCTION':
        return 'type-production';
      case 'TRANSFER':
        return 'type-transfer';
      case 'ADJUSTMENT':
        return 'type-adjustment';
      default:
        return '';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'PURCHASE': return <Download size={14} />;
      case 'SALE': return <Upload size={14} />;
      case 'PRODUCTION': return <Factory size={14} />;
      case 'TRANSFER': return <ArrowLeftRight size={14} />;
      case 'ADJUSTMENT': return <Settings size={14} />;
      default: return <ClipboardList size={14} />;
    }
  };

  return (
    <>
      <Card variant="compact" hoverable onClick={() => setShowDetails(true)} className="compact-movement-card">
        <Card.Row justify="space-between" align="center" className="card-content-clickable">
          <div className="movement-info-section">
            <p className="movement-item-name">{movement.item_name}</p>
            <div className="movement-meta">
              <span className="movement-code">{movement.item_code}</span>
            </div>
          </div>

          <div className="movement-row">
            <div className="quantity-display">
              {isStockIn ? (
                <ArrowUp size={14} className="qty-in-icon" />
              ) : (
                <ArrowDown size={14} className="qty-out-icon" />
              )}
              <span className={isStockIn ? 'qty-in' : 'qty-out'}>
                {isStockIn ? '+' : ''}{parseFloat(String(movement.quantity)).toFixed(2)}
              </span>
              <span className="unit">{movement.unit_of_measure}</span>
            </div>
          </div>
        </Card.Row>

        <div className="movement-card-type-row">
          <span className={`movement-type-badge ${getTypeBadgeClass(movement.movement_type)}`}>
            {getTypeIcon(movement.movement_type)}
            {movement.movement_type}
          </span>
          <span className="warehouse-text">{movement.warehouse_name}</span>
          <span className="movement-date-text">{format(new Date(movement.movement_date), 'dd MMM')}</span>
        </div>
      </Card>

      {showDetails && (
        <div className="item-preview-overlay" onClick={() => setShowDetails(false)}>
          <div
            className="item-preview-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="swipe-indicator"></div>

            <div className="item-preview-header">
              <div className="item-preview-title-section">
                <h2 className="item-preview-title">{movement.item_name}</h2>
                <span className="item-preview-code">{movement.movement_no}</span>
              </div>
              <button className="item-preview-close" onClick={() => setShowDetails(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="item-preview-content">
              <div className="item-preview-stats">
                <div className="preview-stat">
                  <span className="preview-stat-label">Quantity</span>
                  <span className={`preview-stat-value ${isStockIn ? 'stock-normal' : 'stock-out-of-stock'}`}>
                    {isStockIn ? '+' : ''}{parseFloat(String(movement.quantity)).toFixed(2)}
                  </span>
                </div>
                <div className="preview-stat">
                  <span className="preview-stat-label">Unit</span>
                  <span className="preview-stat-value">{movement.unit_of_measure}</span>
                </div>
                <div className="preview-stat">
                  <span className="preview-stat-label">Type</span>
                  <span className={`preview-stat-value ${isStockIn ? 'stock-normal' : 'stock-out-of-stock'}`} style={{ fontSize: '14px' }}>
                    {isStockIn ? 'IN' : 'OUT'}
                  </span>
                </div>
              </div>

              <div className="preview-details-grid">
                <div className="preview-detail-item">
                  <span className="preview-detail-label">Movement No</span>
                  <span className="preview-detail-value">{movement.movement_no}</span>
                </div>
                <div className="preview-detail-item">
                  <span className="preview-detail-label">Date</span>
                  <span className="preview-detail-value">
                    {format(new Date(movement.movement_date), 'dd MMM yyyy')}
                  </span>
                </div>
                <div className="preview-detail-item">
                  <span className="preview-detail-label">Item Code</span>
                  <span className="preview-detail-value">{movement.item_code}</span>
                </div>
                <div className="preview-detail-item">
                  <span className="preview-detail-label">Warehouse</span>
                  <span className="preview-detail-value">{movement.warehouse_name}</span>
                </div>
                <div className="preview-detail-item full-width">
                  <span className="preview-detail-label">Movement Type</span>
                  <span className="preview-detail-value">
                    <span className={`movement-type-badge ${getTypeBadgeClass(movement.movement_type)}`}>
                      {getTypeIcon(movement.movement_type)}
                      {movement.movement_type}
                    </span>
                  </span>
                </div>
              </div>

              {movement.remarks && (
                <div className="preview-detail-item full-width" style={{ marginTop: 'var(--space-md)' }}>
                  <span className="preview-detail-label">Remarks</span>
                  <span className="preview-detail-value">{movement.remarks}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface CompactStockMovementCardViewProps {
  movements: StockMovement[];
}

export default function CompactStockMovementCardView({
  movements
}: CompactStockMovementCardViewProps) {
  return (
    <div className="compact-mobile-cards-wrapper">
      {movements.length === 0 ? (
        <div className="mobile-empty-state">
          <ClipboardList className="empty-icon" size={48} />
          <div className="empty-title">No movements found</div>
          <div className="empty-subtitle">Stock movements will appear here</div>
        </div>
      ) : (
        <div className="compact-mobile-cards-container">
          {movements.map((movement) => (
            <CompactStockMovementCard key={movement.id} movement={movement} />
          ))}
        </div>
      )}
    </div>
  );
}