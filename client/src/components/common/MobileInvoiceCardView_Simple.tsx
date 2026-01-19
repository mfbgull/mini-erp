import React, { useState } from 'react';
import { Search } from 'lucide-react';
import './MobileCardView.css';

interface Invoice {
  id: number;
  invoice_no: string;
  customer_name: string;
  total_amount: number;
  balance_amount: number;
}

interface MobileInvoiceCardViewProps {
  invoices: Invoice[];
  onView: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
}

interface MobileInvoiceCardViewProps {
  invoices: Invoice[];
  onView: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
}

export default function MobileInvoiceCardView({
  invoices,
  onView,
  onEdit
}: MobileInvoiceCardViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filteredInvoices.length === 0) {
    return (
      <div className="mobile-cards-wrapper">
        <div className="mobile-search-container">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mobile-search-input"
          />
        </div>
        <div className="mobile-empty-state">
          <div className="empty-icon">📄</div>
          <div className="empty-title">
            {searchTerm ? 'No matching invoices' : 'No invoices found'}
          </div>
          <div className="empty-subtitle">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Create your first invoice to get started'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-cards-wrapper">
      <div className="mobile-search-container">
        <Search className="search-icon" size={18} />
        <input
          type="text"
          placeholder="Search invoices..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mobile-search-input"
        />
      </div>
      <div className="mobile-cards-container">
        {filteredInvoices.map((invoice) => (
        <div key={invoice.id} className="mobile-card">
          <div className="card-header">
            <div className="invoice-info">
              <div className="invoice-number">{invoice.invoice_no}</div>
              <div className="customer-name">{invoice.customer_name}</div>
            </div>
          </div>

          <div className="card-content">
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Total</span>
                <span className="value">{invoice.total_amount}</span>
              </div>
              <div className="info-item">
                <span className="label">Balance</span>
                <span className="value">{invoice.balance_amount}</span>
              </div>
            </div>
          </div>

          <div className="card-actions">
            <button
              className="action-btn view-btn"
              onClick={() => onView(invoice)}
            >
              View Invoice
            </button>
            <button
              className="action-btn edit-btn"
              onClick={() => onEdit(invoice)}
            >
              Edit
            </button>
          </div>
        </div>
      ))}
    </div>
    </div>
  );
}