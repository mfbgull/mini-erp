import React from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import './StockMovementPreview.css';

interface StockMovementPreviewProps {
  movement: {
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
  };
  onClose: () => void;
}

export default function StockMovementPreview({ movement, onClose }: StockMovementPreviewProps) {
  const isIn = movement.quantity >= 0;

  const getMovementTypeInfo = (type: string) => {
    switch (type) {
      case 'PURCHASE': return { icon: '📥', label: 'Purchase', color: '#22c55e', bg: '#dcfce7' };
      case 'SALE': return { icon: '📤', label: 'Sale', color: '#ef4444', bg: '#fee2e2' };
      case 'PRODUCTION': return { icon: '🏭', label: 'Production', color: '#8b5cf6', bg: '#ede9fe' };
      case 'TRANSFER': return { icon: '🔄', label: 'Transfer', color: '#3b82f6', bg: '#dbeafe' };
      case 'ADJUSTMENT': return { icon: '⚙️', label: 'Adjustment', color: '#f59e0b', bg: '#fef3c7' };
      default: return { icon: '📋', label: type, color: '#6b7280', bg: '#f3f4f6' };
    }
  };

  const typeInfo = getMovementTypeInfo(movement.movement_type);

  return (
    <div className="movement-preview-overlay" onClick={onClose}>
      <div className="movement-preview-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div 
          className="movement-preview-header"
          style={{ background: `linear-gradient(135deg, ${typeInfo.bg} 0%, white 100%)` }}
        >
          <div className="movement-preview-title-section">
            <div className="movement-type-large">
              <span className="type-icon">{typeInfo.icon}</span>
              <span className="type-label" style={{ color: typeInfo.color }}>{typeInfo.label}</span>
            </div>
            <span className="movement-preview-code">#{movement.movement_no}</span>
          </div>
          <button className="movement-preview-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="movement-preview-content">
          {/* Quantity Card */}
          <div className="quantity-card">
            <div className="quantity-main">
              <span className="quantity-direction" style={{ color: isIn ? '#22c55e' : '#ef4444' }}>
                {isIn ? 'STOCK IN' : 'STOCK OUT'}
              </span>
              <span className="quantity-value" style={{ color: isIn ? '#22c55e' : '#ef4444' }}>
                {isIn ? '+' : '-'}{Math.abs(parseFloat(String(movement.quantity || 0))).toFixed(2)}
              </span>
              <span className="quantity-unit">{movement.unit_of_measure}</span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="preview-details-grid">
            <div className="preview-detail-item">
              <span className="preview-detail-label">Date</span>
              <span className="preview-detail-value">
                {format(new Date(movement.movement_date), 'MMMM dd, yyyy')}
              </span>
            </div>

            <div className="preview-detail-item">
              <span className="preview-detail-label">Warehouse</span>
              <span className="preview-detail-value">{movement.warehouse_name}</span>
            </div>

            <div className="preview-detail-item full-width">
              <span className="preview-detail-label">Item</span>
              <div className="item-info-row">
                <span className="item-name">{movement.item_name}</span>
                <code className="item-code">{movement.item_code}</code>
              </div>
            </div>

            {movement.remarks && (
              <div className="preview-detail-item full-width">
                <span className="preview-detail-label">Remarks</span>
                <span className="preview-detail-value remarks-value">{movement.remarks}</span>
              </div>
            )}
          </div>

          {/* Info Notice */}
          <div className="movement-info-notice">
            <span className="notice-icon">ℹ️</span>
            <span className="notice-text">
              This {movement.movement_type.toLowerCase()} movement has been recorded and stock levels updated.
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="movement-preview-actions">
          <button className="preview-action-btn secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}