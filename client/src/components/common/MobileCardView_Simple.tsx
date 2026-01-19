import React, { useState } from 'react';
import { Search } from 'lucide-react';
import './MobileCardView.css';

interface Customer {
  id: number;
  customer_name: string;
  customer_code: string;
  current_balance: number;
}

interface MobileCardViewProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onAddPayment: (customer: Customer) => void;
}

export default function MobileCardView({
  customers,
  onEdit,
  onAddPayment
}: MobileCardViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = customers.filter(customer =>
    customer.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customer_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filteredCustomers.length === 0) {
    return (
      <div className="mobile-cards-wrapper">
        <div className="mobile-search-container">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mobile-search-input"
          />
        </div>
        <div className="mobile-empty-state">
          <div className="empty-icon">📋</div>
          <div className="empty-title">
            {searchTerm ? 'No matching customers' : 'No customers found'}
          </div>
          <div className="empty-subtitle">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Create your first customer to get started'}
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
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mobile-search-input"
        />
      </div>
      <div className="mobile-cards-container">
        {filteredCustomers.map((customer) => (
        <div key={customer.id} className="mobile-card">
          <div className="card-header">
            <div className="customer-info">
              <div className="customer-name">{customer.customer_name}</div>
              <div className="customer-code">Code: {customer.customer_code}</div>
            </div>
          </div>

          <div className="card-content">
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Balance</span>
                <span className="value">{customer.current_balance}</span>
              </div>
            </div>
          </div>

          <div className="card-actions">
            <button
              className="action-btn edit-btn"
              onClick={() => onEdit(customer)}
            >
              Edit
            </button>
            <button
              className="action-btn payment-btn"
              onClick={() => onAddPayment(customer)}
            >
              Add Payment
            </button>
          </div>
        </div>
      ))}
    </div>
    </div>
  );
}