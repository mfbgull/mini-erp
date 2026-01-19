import React from 'react';
import { X, Eye, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/formatters';
import './SalesPreview.css';

interface SalesPreviewProps {
  invoice: {
    id: number;
    invoice_no: string;
    invoice_date: string;
    customer_name: string;
    total_amount: number;
    paid_amount: number;
    balance_amount: number;
    status: string;
    due_date?: string;
  };
  onClose: () => void;
  onView: () => void;
  onEdit: () => void;
}

export default function SalesPreview({ invoice, onClose, onView, onEdit }: SalesPreviewProps) {
  const isPaid = parseFloat(String(invoice.balance_amount || 0)) === 0;

  const getStatusInfo = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return { icon: '✓', color: '#15803d', bg: '#dcfce7' };
      case 'partial': 
      case 'partially paid': return { icon: '~', color: '#b45309', bg: '#fef3c7' };
      case 'overdue': return { icon: '⚠', color: '#dc2626', bg: '#fee2e2' };
      case 'cancelled': return { icon: '✕', color: '#6b7280', bg: '#f3f4f6' };
      default: return { icon: '○', color: '#0369a1', bg: '#e0f2fe' };
    }
  };

  const statusInfo = getStatusInfo(invoice.status);

  return (
    <div className="sales-preview-overlay" onClick={onClose}>
      <div className="sales-preview-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div 
          className="sales-preview-header"
          style={{ background: `linear-gradient(135deg, ${statusInfo.bg} 0%, white 100%)` }}
        >
          <div className="sales-preview-title-section">
            <div className="invoice-status-large">
              <span className="status-icon">{statusInfo.icon}</span>
              <span className="status-label" style={{ color: statusInfo.color }}>{invoice.status || 'Pending'}</span>
            </div>
            <span className="sales-preview-code">{invoice.invoice_no}</span>
          </div>
          <button className="sales-preview-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="sales-preview-content">
          {/* Amount Card */}
          <div className="amount-card">
            <div className="amount-main">
              <span className="amount-label">Total Amount</span>
              <span className="amount-value">{formatCurrency(parseFloat(String(invoice.total_amount || 0)))}</span>
              {parseFloat(String(invoice.balance_amount || 0)) > 0 && (
                <span className="amount-balance">
                  Balance: {formatCurrency(parseFloat(String(invoice.balance_amount || 0)))}
                </span>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="preview-details-grid">
            <div className="preview-detail-item">
              <span className="preview-detail-label">Customer</span>
              <span className="preview-detail-value">{invoice.customer_name}</span>
            </div>

            <div className="preview-detail-item">
              <span className="preview-detail-label">Invoice Date</span>
              <span className="preview-detail-value">
                {invoice.invoice_date ? format(new Date(invoice.invoice_date), 'MMMM dd, yyyy') : ''}
              </span>
            </div>

            <div className="preview-detail-item">
              <span className="preview-detail-label">Amount Paid</span>
              <span className="preview-detail-value paid-amount">
                {formatCurrency(parseFloat(String(invoice.paid_amount || 0)))}
              </span>
            </div>

            {invoice.due_date && (
              <div className="preview-detail-item">
                <span className="preview-detail-label">Due Date</span>
                <span className="preview-detail-value">
                  {format(new Date(invoice.due_date), 'MMMM dd, yyyy')}
                </span>
              </div>
            )}
          </div>

          {/* Info Notice */}
          <div className="sales-info-notice">
            <span className="notice-icon">ℹ️</span>
            <span className="notice-text">
              View full invoice details to see line items and payment history.
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="sales-preview-actions">
          <button className="preview-action-btn secondary" onClick={onEdit}>
            <Edit2 size={18} />
            <span>Edit</span>
          </button>
          <button className="preview-action-btn primary" onClick={onView}>
            <Eye size={18} />
            <span>View Full Invoice</span>
          </button>
        </div>
      </div>
    </div>
  );
}