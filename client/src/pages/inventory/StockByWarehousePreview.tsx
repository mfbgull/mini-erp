import React from 'react';
import { X } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import './StockByWarehousePreview.css';

interface StockByWarehousePreviewProps {
  stockData: {
    id: number;
    item_id: number;
    item_code: string;
    item_name: string;
    warehouse_id: number;
    warehouse_code: string;
    warehouse_name: string;
    quantity: number;
    unit_of_measure: string;
    standard_cost?: number;
  };
  onClose: () => void;
}

export default function StockByWarehousePreview({ stockData, onClose }: StockByWarehousePreviewProps) {
  const value = stockData.standard_cost 
    ? stockData.standard_cost * stockData.quantity 
    : null;

  return (
    <div className="stock-preview-overlay" onClick={onClose}>
      <div className="stock-preview-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="stock-preview-header">
          <div className="stock-preview-title-section">
            <h2 className="stock-preview-title">{stockData.item_name}</h2>
            <div className="stock-preview-badges">
              <span className="item-code-badge">{stockData.item_code}</span>
              <span className="warehouse-code-badge">{stockData.warehouse_code}</span>
            </div>
          </div>
          <button className="stock-preview-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="stock-preview-content">
          {/* Quantity Card */}
          <div className="quantity-card">
            <div className="quantity-main">
              <span className="quantity-label">Current Stock</span>
              <span className="quantity-value stock-normal">
                {parseFloat(String(stockData.quantity || 0)).toFixed(2)}
              </span>
              <span className="quantity-unit">{stockData.unit_of_measure}</span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="preview-details-grid">
            <div className="preview-detail-item">
              <span className="preview-detail-label">Warehouse</span>
              <span className="preview-detail-value warehouse-name">
                {stockData.warehouse_name}
              </span>
            </div>

            <div className="preview-detail-item">
              <span className="preview-detail-label">Unit</span>
              <span className="preview-detail-value">{stockData.unit_of_measure}</span>
            </div>

            {stockData.standard_cost && (
              <>
                <div className="preview-detail-item">
                  <span className="preview-detail-label">Unit Cost</span>
                  <span className="preview-detail-value">{formatCurrency(stockData.standard_cost)}</span>
                </div>

                <div className="preview-detail-item">
                  <span className="preview-detail-label">Total Value</span>
                  <span className="preview-detail-value total-value">
                    {formatCurrency(value || 0)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Info Notice */}
          <div className="stock-info-notice">
            <span className="notice-icon">ℹ️</span>
            <span className="notice-text">
              This shows the current stock level for this item in the selected warehouse.
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="stock-preview-actions">
          <button className="preview-action-btn secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}