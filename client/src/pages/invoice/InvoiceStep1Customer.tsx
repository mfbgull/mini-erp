import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import { Search, Calendar, ChevronDown, Check, User } from 'lucide-react';

import Button from '../../components/common/Button';
import { useInvoice } from '../../context/InvoiceContext';
import { mobileInvoiceApi } from '../../utils/invoiceApi';
import '../../styles/pages/invoice.css';

export default function InvoiceStep1Customer() {
  const { 
    dispatch, 
    customer, 
    invoiceDate, 
    dueDate, 
    terms, 
    notes,
    nextStep
  } = useInvoice();

  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const termsOptions = [
    { name: 'Due on Receipt', days: 0 },
    { name: 'Net 7', days: 7 },
    { name: 'Net 14', days: 14 },
    { name: 'Net 21', days: 21 },
    { name: 'Net 30', days: 30 },
    { name: 'Net 45', days: 45 },
    { name: 'Net 60', days: 60 },
  ];

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await mobileInvoiceApi.searchCustomers('');
      if (response.success) {
        setCustomers(response.data);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const filteredCustomers = customers.filter((c: any) =>
    c.customer_name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.customer_code?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const handleSelectCustomer = (customerData: any) => {
    dispatch({
      type: 'SET_CUSTOMER',
      payload: {
        id: customerData.id,
        name: customerData.customer_name,
        email: customerData.email || '',
        phone: customerData.phone || '',
        balance: 0
      }
    });
  };

  const handleClearCustomer = () => {
    dispatch({ type: 'SET_CUSTOMER', payload: null });
    setCustomerSearch('');
  };

  const handleContinue = () => {
    if (!customer) {
      toast.error('Please select a customer');
      return;
    }
    nextStep();
  };

  return (
    <div className="miw-step-1">
      <div className="miw-search-box">
        <input
          type="text"
          className="miw-search-input"
          placeholder="Search customers..."
          value={customerSearch}
          onChange={(e) => setCustomerSearch(e.target.value)}
        />
      </div>
      
      <div className="miw-selection-list">
        {filteredCustomers.map((c: any) => (
          <div
            key={c.id}
            className={`miw-selection-card ${customer?.id === c.id ? 'selected' : ''}`}
            onClick={() => handleSelectCustomer(c)}
          >
            <div className="miw-card-main">
              <span className="miw-card-title">{c.customer_name}</span>
              <span className="miw-card-subtitle">{c.customer_code}</span>
            </div>
            {customer?.id === c.id && <Check size={20} className="miw-check-icon" />}
          </div>
        ))}
      </div>

      {/* Date Row */}
      <div className="miw-card">
        <div className="miw-card-header">
          <span className="miw-card-title">Dates</span>
        </div>
        
        <div className="miw-date-row">
          <button 
            className={`miw-date-btn ${invoiceDate ? 'selected' : ''}`}
            onClick={() => {
              // For now, just use a simple prompt
              const newDate = prompt('Invoice Date (YYYY-MM-DD):', invoiceDate);
              if (newDate) dispatch({ type: 'SET_INVOICE_DATE', payload: newDate });
            }}
          >
            <div className="miw-date-label">Invoice Date</div>
            <div className="miw-date-value">
              {invoiceDate ? new Date(invoiceDate).toLocaleDateString() : 'Select'}
            </div>
          </button>
          
          <button 
            className={`miw-date-btn ${dueDate ? 'selected' : ''}`}
            onClick={() => {
              const newDate = prompt('Due Date (YYYY-MM-DD):', dueDate);
              if (newDate) dispatch({ type: 'SET_DUE_DATE', payload: newDate });
            }}
          >
            <div className="miw-date-label">Due Date</div>
            <div className="miw-date-value">
              {dueDate ? new Date(dueDate).toLocaleDateString() : 'Select'}
            </div>
          </button>
        </div>
      </div>

      {/* Terms Dropdown */}
      <div className="miw-card">
        <div className="miw-card-header">
          <span className="miw-card-title">Payment Terms</span>
        </div>
        
        <div className="miw-select-container">
          <select
            className="miw-input miw-select"
            value={terms}
            onChange={(e) => dispatch({ type: 'SET_TERMS', payload: e.target.value })}
          >
            {termsOptions.map((term: any) => (
              <option key={term.name} value={term.name}>
                {term.name}
              </option>
            ))}
          </select>
            <ChevronDown
              size={16}
              className="miw-select-chevron"
            />
        </div>
      </div>

      {/* Notes */}
      <div className="miw-card">
        <div className="miw-card-header">
          <span className="miw-card-title">Notes</span>
        </div>
        
        <textarea
          className="miw-input miw-textarea"
          placeholder="Add notes (optional)..."
          value={notes}
          onChange={(e) => dispatch({ type: 'SET_NOTES', payload: e.target.value })}
        />
      </div>

        {/* Continue Button */}
        <div className="miw-step-actions">
          <Button
            variant="primary"
            className="miw-continue-btn-full"
            onClick={handleContinue}
            disabled={!customer}
          >
            Continue
          </Button>
        </div>
    </div>
  );
}
