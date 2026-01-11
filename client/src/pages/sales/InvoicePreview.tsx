import React from 'react';
import { X, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/formatters';
import './InvoicePreview.css';

interface InvoicePreviewProps {
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
    customer_address?: string;
    customer_phone?: string;
    customer_email?: string;
  };
  onClose: () => void;
  onEdit: () => void;
  onDelete?: () => void;
}

export default function InvoicePreview({ invoice, onClose, onEdit, onDelete }: InvoicePreviewProps) {
  const isPaid = parseFloat(String(invoice.balance_amount || '0')) === 0;
  const isOverdue = invoice.status?.toLowerCase() === 'overdue';

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return { bg: '#dcfce7', color: '#15803d', border: '#86efac' };
      case 'partial': 
      case 'partially paid': return { bg: '#fef3c7', color: '#b45309', border: '#fcd34d' };
      case 'overdue': return { bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' };
      case 'cancelled': return { bg: '#f3f4f6', color: '#6b7280', border: '#d1d5db' };
      default: return { bg: '#e0f2fe', color: '#0369a1', border: '#7dd3fc' };
    }
  };

  const statusInfo = getStatusColor(invoice.status);

  return (
    <div className="invoice-preview-overlay" onClick={onClose}>
      <div className="invoice-preview-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="invoice-preview-header">
          <div className="invoice-preview-title-section">
            <h2 className="invoice-preview-title">{invoice.invoice_no}</h2>
            <p className="invoice-preview-subtitle">{invoice.customer_name}</p>
          </div>
          <button className="invoice-preview-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Status Banner */}
        <div 
          className="invoice-status-banner"
          style={{ 
            background: `linear-gradient(135deg, ${statusInfo.bg} 0%, white 100%)`,
            borderColor: statusInfo.border 
          }}
        >
          <span className="status-icon">
            {invoice.status?.toLowerCase() === 'paid' ? '✓' : 
             invoice.status?.toLowerCase() === 'overdue' ? '⚠' :
             invoice.status?.toLowerCase() === 'partial' ? '~' : '○'}
          </span>
          <span className="status-label" style={{ color: statusInfo.color }}>
            {invoice.status || 'Pending'}
          </span>
        </div>

        {/* Content - Card Style */}
        <div className="invoice-preview-content">
          {/* Quick Stats Row */}
          <div className="invoice-preview-stats">
            <div className="preview-stat">
              <span className="preview-stat-label">Total</span>
              <span className="preview-stat-value">
                {formatCurrency(parseFloat(String(invoice.total_amount || 0)))}
              </span>
            </div>
            <div className="preview-stat">
              <span className="preview-stat-label">Paid</span>
              <span className="preview-stat-value paid">
                {formatCurrency(parseFloat(String(invoice.paid_amount || 0)))}
              </span>
            </div>
            <div className="preview-stat">
              <span className="preview-stat-label">Balance</span>
              <span className={`preview-stat-value ${isPaid ? 'balance-paid' : 'balance-due'}`}>
                {formatCurrency(parseFloat(String(invoice.balance_amount || 0)))}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="preview-details-grid">
            <div className="preview-detail-item">
              <span className="preview-detail-label">Invoice Date</span>
              <span className="preview-detail-value">
                {invoice.invoice_date ? format(new Date(invoice.invoice_date), 'MMMM dd, yyyy') : ''}
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

            {invoice.customer_phone && (
              <div className="preview-detail-item">
                <span className="preview-detail-label">Phone</span>
                <span className="preview-detail-value">{invoice.customer_phone}</span>
              </div>
            )}

            {invoice.customer_email && (
              <div className="preview-detail-item">
                <span className="preview-detail-label">Email</span>
                <span className="preview-detail-value">{invoice.customer_email}</span>
              </div>
            )}

            {invoice.customer_address && (
              <div className="preview-detail-item full-width">
                <span className="preview-detail-label">Billing Address</span>
                <span className="preview-detail-value address">
                  {invoice.customer_address.split('\n').map((line, idx) => (
                    <span key={idx}>{line}</span>
                  ))}
                </span>
              </div>
            )}
          </div>

          {/* Overdue Alert */}
          {isOverdue && parseFloat(String(invoice.balance_amount || 0)) > 0 && (
            <div className="stock-alert error preview-alert">
              <span className="alert-icon">⚠️</span>
              <span className="alert-text">Invoice is overdue - balance due</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="invoice-preview-actions">
          <button className="preview-action-btn edit-btn" onClick={onEdit}>
            <Edit2 size={18} />
            <span>Edit Invoice</span>
          </button>
          {onDelete && (
            <button className="preview-action-btn delete-btn" onClick={onDelete}>
              <Trash2 size={18} />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
