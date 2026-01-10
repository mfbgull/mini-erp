import React from 'react';
import { X, Eye, Edit2, CreditCard, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/formatters';
import './CustomerPreview.css';

interface Customer {
  id: number;
  customer_code: string;
  customer_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  billing_address?: string;
  shipping_address?: string;
  current_balance: number;
  credit_limit?: number;
  is_active?: boolean;
  payment_terms_days?: number;
  opening_balance?: number;
  created_at?: string;
}

interface CustomerPreviewProps {
  customer: Customer;
  onClose: () => void;
  onView?: () => void;
  onEdit?: () => void;
  onAddPayment?: () => void;
}

export default function CustomerPreview({
  customer,
  onClose,
  onView,
  onEdit,
  onAddPayment
}: CustomerPreviewProps) {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const hasCreditLimit = customer.credit_limit && customer.credit_limit > 0;
  const creditUtilization = hasCreditLimit 
    ? ((customer.current_balance || 0) / customer.credit_limit) * 100 
    : 0;

  return (
    <div className="mobile-preview-backdrop" onClick={handleBackdropClick}>
      <div className="mobile-preview-container">
        {/* Header */}
        <div className="mobile-preview-header">
          <div className="preview-icon customer-icon">
            <FileText size={24} />
          </div>
          <div className="preview-title-section">
            <h2 className="preview-title">{customer.customer_name}</h2>
            <p className="preview-subtitle">{customer.customer_code}</p>
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
              <div className="stat-icon-wrapper balance">
                <FileText size={20} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Current Balance</p>
                <p className={`stat-value ${customer.current_balance > 0 ? 'warning' : ''}`}>
                  {formatCurrency(parseFloat(String(customer.current_balance || 0)))}
                </p>
              </div>
            </div>

            {hasCreditLimit && (
              <div className="preview-stat-card">
                <div className="stat-icon-wrapper credit">
                  <CreditCard size={20} />
                </div>
                <div className="stat-content">
                  <p className="stat-label">Credit Limit</p>
                  <p className="stat-value">
                    {formatCurrency(parseFloat(String(customer.credit_limit || 0)))}
                  </p>
                  <p className="stat-subtitle">
                    {creditUtilization.toFixed(1)}% utilized
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="preview-section">
            <div className={`customer-status-banner ${customer.is_active ? 'active' : 'inactive'}`}>
              <span className="status-indicator"></span>
              {customer.is_active ? 'Active Customer' : 'Inactive Customer'}
            </div>
          </div>

          {/* Contact Information */}
          <div className="preview-section">
            <h3 className="preview-section-title">Contact Information</h3>
            <div className="preview-detail-grid">
              {customer.contact_person && (
                <div className="preview-detail-item">
                  <span className="detail-label">Contact Person</span>
                  <span className="detail-value">{customer.contact_person}</span>
                </div>
              )}
              {customer.phone && (
                <div className="preview-detail-item">
                  <span className="detail-label">Phone</span>
                  <span className="detail-value">{customer.phone}</span>
                </div>
              )}
              {customer.email && (
                <div className="preview-detail-item">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{customer.email}</span>
                </div>
              )}
              {customer.payment_terms_days && (
                <div className="preview-detail-item">
                  <span className="detail-label">Payment Terms</span>
                  <span className="detail-value">{customer.payment_terms_days} days</span>
                </div>
              )}
            </div>
          </div>

          {/* Address */}
          {customer.billing_address && (
            <div className="preview-section">
              <h3 className="preview-section-title">Billing Address</h3>
              <div className="preview-address-card">
                {customer.billing_address.split('\n').map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
            </div>
          )}

          {customer.shipping_address && customer.shipping_address !== customer.billing_address && (
            <div className="preview-section">
              <h3 className="preview-section-title">Shipping Address</h3>
              <div className="preview-address-card">
                {customer.shipping_address.split('\n').map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mobile-preview-actions">
          {onEdit && (
            <button className="preview-action-btn primary" onClick={onEdit}>
              <Edit2 size={18} />
              <span>Edit Customer</span>
            </button>
          )}
          {onView && (
            <button className="preview-action-btn secondary" onClick={onView}>
              <Eye size={18} />
              <span>View Statements</span>
            </button>
          )}
          {onAddPayment && (
            <button className="preview-action-btn success" onClick={onAddPayment}>
              <CreditCard size={18} />
              <span>Add Payment</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
