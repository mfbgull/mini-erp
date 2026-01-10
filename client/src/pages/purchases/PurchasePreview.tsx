import React from 'react';
import { X, Eye, Edit2, Printer, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/formatters';
import './PurchasePreview.css';

interface Purchase {
  id: number;
  purchase_no: string;
  purchase_date: string;
  item_name: string;
  item_code?: string;
  item_id: number;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  supplier_name: string;
  warehouse_name: string;
  warehouse_id: number;
  unit_of_measure?: string;
  invoice_no?: string;
  remarks?: string;
  created_at?: string;
}

interface PurchasePreviewProps {
  purchase: Purchase;
  onClose: () => void;
  onView?: () => void;
  onEdit?: () => void;
}

export default function PurchasePreview({
  purchase,
  onClose,
  onView,
  onEdit
}: PurchasePreviewProps) {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="mobile-preview-backdrop" onClick={handleBackdropClick}>
      <div className="mobile-preview-container">
        {/* Header */}
        <div className="mobile-preview-header">
          <div className="preview-icon purchase-icon">
            <FileText size={24} />
          </div>
          <div className="preview-title-section">
            <h2 className="preview-title">{purchase.purchase_no}</h2>
            <p className="preview-subtitle">Purchase Details</p>
          </div>
          <button className="preview-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="mobile-preview-content">
          {/* Key Stats */}
          <div className="preview-stats-grid">
            <div className="preview-stat-card">
              <div className="stat-icon-wrapper purchase">
                <FileText size={20} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Total Cost</p>
                <p className="stat-value purchase-value">
                  {formatCurrency(parseFloat(String(purchase.total_cost || 0)))}
                </p>
              </div>
            </div>

            <div className="preview-stat-card">
              <div className="stat-icon-wrapper success">
                <FileText size={20} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Quantity</p>
                <p className="stat-value">
                  {parseFloat(String(purchase.quantity || 0)).toFixed(3)} {purchase.unit_of_measure || ''}
                </p>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="preview-section">
            <h3 className="preview-section-title">Item Information</h3>
            <div className="preview-detail-grid">
              <div className="preview-detail-item">
                <span className="detail-label">Item Name</span>
                <span className="detail-value">{purchase.item_name}</span>
              </div>
              {purchase.item_code && (
                <div className="preview-detail-item">
                  <span className="detail-label">Item Code</span>
                  <span className="detail-value">{purchase.item_code}</span>
                </div>
              )}
              <div className="preview-detail-item">
                <span className="detail-label">Unit Cost</span>
                <span className="detail-value">{formatCurrency(parseFloat(String(purchase.unit_cost || 0)))}</span>
              </div>
              <div className="preview-detail-item">
                <span className="detail-label">Quantity</span>
                <span className="detail-value">{parseFloat(String(purchase.quantity || 0)).toFixed(3)} {purchase.unit_of_measure || ''}</span>
              </div>
              <div className="preview-detail-item full-width">
                <span className="detail-label">Total Cost</span>
                <span className="detail-value highlight">{formatCurrency(parseFloat(String(purchase.total_cost || 0)))}</span>
              </div>
            </div>
          </div>

          {/* Supplier & Warehouse */}
          <div className="preview-section">
            <h3 className="preview-section-title">Supplier & Location</h3>
            <div className="preview-detail-grid">
              <div className="preview-detail-item">
                <span className="detail-label">Supplier</span>
                <span className="detail-value">{purchase.supplier_name || '—'}</span>
              </div>
              <div className="preview-detail-item">
                <span className="detail-label">Warehouse</span>
                <span className="detail-value">{purchase.warehouse_name || '—'}</span>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="preview-section">
            <h3 className="preview-section-title">Date Information</h3>
            <div className="preview-detail-grid">
              <div className="preview-detail-item">
                <span className="detail-label">Purchase Date</span>
                <span className="detail-value">
                  {purchase.purchase_date ? format(new Date(purchase.purchase_date), 'MMMM dd, yyyy') : '—'}
                </span>
              </div>
              {purchase.invoice_no && (
                <div className="preview-detail-item">
                  <span className="detail-label">Invoice Number</span>
                  <span className="detail-value">{purchase.invoice_no}</span>
                </div>
              )}
            </div>
          </div>

          {/* Remarks */}
          {purchase.remarks && (
            <div className="preview-section">
              <h3 className="preview-section-title">Remarks</h3>
              <p className="preview-remarks">{purchase.remarks}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mobile-preview-actions">
          {onEdit && (
            <button className="preview-action-btn primary" onClick={onEdit}>
              <Edit2 size={18} />
              <span>Edit Purchase</span>
            </button>
          )}
          {onView && (
            <button className="preview-action-btn secondary" onClick={onView}>
              <Eye size={18} />
              <span>View Details</span>
            </button>
          )}
          <button className="preview-action-btn secondary" onClick={() => window.print()}>
            <Printer size={18} />
            <span>Print</span>
          </button>
        </div>
      </div>
    </div>
  );
}
