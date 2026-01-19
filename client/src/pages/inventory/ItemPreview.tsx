import React from 'react';
import { X, Edit, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import './ItemPreview.css';

interface ItemPreviewProps {
  item: {
    id: number;
    item_code: string;
    item_name: string;
    description?: string;
    category?: string;
    unit_of_measure?: string;
    current_stock: number;
    standard_cost: number;
    standard_selling_price: number;
    reorder_level?: number;
    is_raw_material?: boolean;
    is_finished_good?: boolean;
    is_purchased?: boolean;
    is_manufactured?: boolean;
  };
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ItemPreview({ item, onClose, onEdit, onDelete }: ItemPreviewProps) {
  const isLowStock = item.reorder_level > 0 && item.current_stock <= item.reorder_level;
  const isOutOfStock = item.current_stock === 0;

  return (
    <div className="item-preview-overlay" onClick={onClose}>
      <div className="item-preview-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="item-preview-header">
          <div className="item-preview-title-section">
            <h2 className="item-preview-title">{item.item_name}</h2>
            <span className="item-preview-code">{item.item_code}</span>
          </div>
          <button className="item-preview-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Content - Card Style */}
        <div className="item-preview-content">
          {/* Quick Stats Row */}
          <div className="item-preview-stats">
            <div className="preview-stat">
              <span className="preview-stat-label">Stock</span>
              <span className={`preview-stat-value ${
                isOutOfStock ? 'stock-out-of-stock' : isLowStock ? 'stock-low' : 'stock-normal'
              }`}>
                {parseFloat(String(item.current_stock || 0)).toFixed(2)}
              </span>
            </div>
            <div className="preview-stat">
              <span className="preview-stat-label">Cost</span>
              <span className="preview-stat-value">{formatCurrency(item.standard_cost || 0)}</span>
            </div>
            <div className="preview-stat">
              <span className="preview-stat-label">Price</span>
              <span className="preview-stat-value">{formatCurrency(item.standard_selling_price || 0)}</span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="preview-details-grid">
            {item.category && (
              <div className="preview-detail-item">
                <span className="preview-detail-label">Category</span>
                <span className="preview-detail-value">
                  <span className="category-badge">{item.category}</span>
                </span>
              </div>
            )}

            <div className="preview-detail-item">
              <span className="preview-detail-label">Unit of Measure</span>
              <span className="preview-detail-value">{item.unit_of_measure || 'Nos'}</span>
            </div>

            <div className="preview-detail-item">
              <span className="preview-detail-label">Reorder Level</span>
              <span className="preview-detail-value">{item.reorder_level || 0}</span>
            </div>

            {item.description && (
              <div className="preview-detail-item full-width">
                <span className="preview-detail-label">Description</span>
                <span className="preview-detail-value">{item.description}</span>
              </div>
            )}

            {/* Item Types */}
            <div className="preview-detail-item full-width">
              <span className="preview-detail-label">Item Type</span>
              <div className="preview-type-tags">
                {item.is_raw_material && <span className="tag raw-material">Raw Material</span>}
                {item.is_finished_good && <span className="tag finished-good">Finished Good</span>}
                {item.is_purchased && <span className="tag purchased">Purchased</span>}
                {item.is_manufactured && <span className="tag manufactured">Manufactured</span>}
              </div>
            </div>
          </div>

          {/* Stock Alerts */}
          {isLowStock && (
            <div className="stock-alert preview-alert">
              <span className="alert-icon">⚠️</span>
              <span className="alert-text">Low stock: below reorder level</span>
            </div>
          )}

          {isOutOfStock && (
            <div className="stock-alert error preview-alert">
              <span className="alert-icon">🚫</span>
              <span className="alert-text">Out of stock</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="item-preview-actions">
          <button className="preview-action-btn edit-btn" onClick={onEdit}>
            <Edit size={18} />
            <span>Edit Item</span>
          </button>
          <button className="preview-action-btn delete-btn" onClick={onDelete}>
            <Trash2 size={18} />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}