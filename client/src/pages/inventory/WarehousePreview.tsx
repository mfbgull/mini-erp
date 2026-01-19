import React from 'react';
import { X, Edit, Trash2 } from 'lucide-react';
import './WarehousePreview.css';

interface WarehousePreviewProps {
  warehouse: {
    id: number;
    warehouse_code: string;
    warehouse_name: string;
    location?: string;
  };
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function WarehousePreview({ warehouse, onClose, onEdit, onDelete }: WarehousePreviewProps) {
  return (
    <div className="warehouse-preview-overlay" onClick={onClose}>
      <div className="warehouse-preview-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="warehouse-preview-header">
          <div className="warehouse-preview-title-section">
            <h2 className="warehouse-preview-title">{warehouse.warehouse_name}</h2>
            <span className="warehouse-preview-code">{warehouse.warehouse_code}</span>
          </div>
          <button className="warehouse-preview-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Content - Card Style */}
        <div className="warehouse-preview-content">
          {/* Details Grid */}
          <div className="preview-details-grid">
            {warehouse.location && (
              <div className="preview-detail-item full-width">
                <span className="preview-detail-label">Location</span>
                <span className="preview-detail-value location-display">
                  {warehouse.location}
                </span>
              </div>
            )}

            <div className="preview-detail-item">
              <span className="preview-detail-label">Warehouse Code</span>
              <span className="preview-detail-value">
                <code className="warehouse-code-badge">{warehouse.warehouse_code}</code>
              </span>
            </div>

            <div className="preview-detail-item">
              <span className="preview-detail-label">Status</span>
              <span className="preview-detail-value">
                <span className="status-badge active">Active</span>
              </span>
            </div>
          </div>

          {/* Info notice */}
          <div className="warehouse-info-notice">
            <span className="notice-icon">ℹ️</span>
            <span className="notice-text">This warehouse can be used for stock movements and inventory tracking</span>
          </div>
        </div>

        {/* Actions */}
        <div className="warehouse-preview-actions">
          <button className="preview-action-btn edit-btn" onClick={onEdit}>
            <Edit size={18} />
            <span>Edit Warehouse</span>
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