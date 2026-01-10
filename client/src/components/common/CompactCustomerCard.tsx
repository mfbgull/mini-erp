import React, { useState } from 'react';
import { Search, Eye, Edit2, CreditCard } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import './CompactCustomerCard.css';

interface Customer {
  id: number;
  customer_code: string;
  customer_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  current_balance: number;
  credit_limit?: number;
  is_active?: boolean;
  payment_terms_days?: number;
}

interface CompactCustomerCardViewProps {
  customers: Customer[];
  onView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onAddPayment: (customer: Customer) => void;
}

export default function CompactCustomerCardView({
  customers,
  onView,
  onEdit,
  onAddPayment
}: CompactCustomerCardViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = customers.filter(customer =>
    customer.customer_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  );

  const getBalanceStatus = (customer: Customer) => {
    if (!customer.current_balance || customer.current_balance === 0) {
      return 'status-paid';
    }
    if (customer.credit_limit && customer.credit_limit > 0) {
      const utilization = (customer.current_balance / customer.credit_limit) * 100;
      if (utilization >= 90) return 'status-overdue';
      if (utilization >= 75) return 'status-partial';
    }
    return 'status-pending';
  };

  if (filteredCustomers.length === 0) {
    return (
      <div className="compact-mobile-cards-wrapper">
        <div className="compact-mobile-search-container">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="compact-mobile-search-input"
          />
        </div>
        <div className="mobile-empty-state">
          <div className="empty-icon">👥</div>
          <div className="empty-title">
            {searchTerm ? 'No matching customers' : 'No customers found'}
          </div>
          <div className="empty-subtitle">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Add your first customer to get started'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="compact-mobile-cards-wrapper">
      <div className="compact-mobile-search-container">
        <Search className="search-icon" size={18} />
        <input
          type="text"
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="compact-mobile-search-input"
        />
      </div>

      <div className="compact-mobile-cards-container">
        {filteredCustomers.map((customer) => {
          const balanceStatus = getBalanceStatus(customer);
          const hasCreditLimit = customer.credit_limit && customer.credit_limit > 0;
          
          return (
            <div
              key={customer.id}
              className={`compact-mobile-card customer-card ${!customer.is_active ? 'customer-inactive' : ''}`}
              onClick={() => onView(customer)}
            >
              <div className="compact-card-content">
                {/* Left: Customer info */}
                <div className="compact-item-info">
                  <div className="customer-header">
                    <span className="customer-code">{customer.customer_code}</span>
                    {!customer.is_active && (
                      <span className="customer-inactive-badge">Inactive</span>
                    )}
                  </div>
                  <p className="compact-item-name">{customer.customer_name}</p>
                  <p className="compact-item-code">
                    {customer.contact_person && `${customer.contact_person} • `}
                    {customer.phone || 'No phone'}
                  </p>
                </div>

                {/* Right: Balance */}
                <div className="compact-item-right">
                  <div className="compact-stock-display">
                    <p className="stock-label">Balance</p>
                    <p className={`stock-value ${balanceStatus}`}>
                      {formatCurrency(parseFloat(String(customer.current_balance || 0)))}
                    </p>
                    {hasCreditLimit && (
                      <p className="stock-balance">
                        Limit: {formatCurrency(parseFloat(String(customer.credit_limit || 0)))}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions footer */}
              <div className="customer-actions">
                <button 
                  className="customer-action-btn"
                  onClick={(e) => { e.stopPropagation(); onView(customer); }}
                >
                  <Eye size={16} />
                  <span>View</span>
                </button>
                <button 
                  className="customer-action-btn"
                  onClick={(e) => { e.stopPropagation(); onEdit(customer); }}
                >
                  <Edit2 size={16} />
                  <span>Edit</span>
                </button>
                <button 
                  className="customer-action-btn primary"
                  onClick={(e) => { e.stopPropagation(); onAddPayment(customer); }}
                >
                  <CreditCard size={16} />
                  <span>Payment</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
