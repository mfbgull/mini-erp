import { useState } from 'react';
import { useInvoice } from '../../context/InvoiceContext';
import { mobileInvoiceApi } from '../../utils/invoiceApi';
import { Search, Calendar, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import './MobileInvoice.css';

export default function InvoiceStep1Customer() {
  const { 
    dispatch, 
    customer, 
    invoiceDate, 
    dueDate, 
    terms, 
    notes,
    calculateSubtotal,
    calculateTotal,
    calculateBalance,
    canProceedToStep,
    nextStep
  } = useInvoice();

  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showTermsDropdown, setShowTermsDropdown] = useState(false);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [paymentTerms, setPaymentTerms] = useState<any[]>([]);

  // Load payment terms on mount
  // For now, use hardcoded terms matching the wireframe
  const termsOptions = [
    { name: 'Due on Receipt', days: 0 },
    { name: 'Net 7', days: 7 },
    { name: 'Net 14', days: 14 },
    { name: 'Net 21', days: 21 },
    { name: 'Net 30', days: 30 },
    { name: 'Net 45', days: 45 },
    { name: 'Net 60', days: 60 },
  ];

  // Search customers
  const handleCustomerSearch = async (query: string) => {
    setCustomerSearch(query);
    
    if (query.trim().length < 2) {
      setCustomerResults([]);
      setShowCustomerDropdown(false);
      return;
    }

    setIsSearchingCustomers(true);
    try {
      const response = await mobileInvoiceApi.searchCustomers(query);
      if (response.success) {
        setCustomerResults(response.data);
        setShowCustomerDropdown(true);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
    } finally {
      setIsSearchingCustomers(false);
    }
  };

  // Select customer
  const handleSelectCustomer = (customerData: any) => {
    dispatch({
      type: 'SET_CUSTOMER',
      payload: {
        id: customerData.id,
        name: customerData.customer_name,
        email: customerData.email || '',
        phone: customerData.phone || '',
        balance: 0 // We could fetch this, but keeping it simple
      }
    });
    setCustomerSearch(customerData.customer_name);
    setShowCustomerDropdown(false);
  };

  // Handle Continue
  const handleContinue = () => {
    if (!customer) {
      toast.error('Please select a customer');
      return;
    }
    nextStep();
  };

  return (
    <div className="miw-step-1">
      {/* Customer Selector Card */}
      <div className="miw-card">
        <div className="miw-card-header">
          <span className="miw-card-title">Customer</span>
        </div>
        
        <div className="miw-customer-selector">
          <div className="miw-customer-icon">
            <Search size={20} />
          </div>
          <div className="miw-customer-info" style={{ flex: 1 }}>
            {customer ? (
              <>
                <div className="miw-customer-name">{customer.name}</div>
                {customer.email && <div className="miw-customer-secondary">{customer.email}</div>}
              </>
            ) : (
              <>
                <input
                  type="text"
                  className="miw-input"
                  placeholder="Select customer..."
                  value={customerSearch}
                  onChange={(e) => handleCustomerSearch(e.target.value)}
                  onFocus={() => customerSearch.length >= 2 && setShowCustomerDropdown(true)}
                />
              </>
            )}
          </div>
        </div>

        {/* Customer Search Dropdown */}
        {showCustomerDropdown && (
          <div className="miw-customer-dropdown">
            {customerResults.map((c: any) => (
              <div
                key={c.id}
                className="miw-customer-dropdown-item"
                onClick={() => handleSelectCustomer(c)}
              >
                <div className="miw-customer-dropdown-name">{c.customer_name}</div>
                <div className="miw-customer-dropdown-code">{c.customer_code}</div>
              </div>
            ))}
            {customerResults.length === 0 && !isSearchingCustomers && (
              <div className="miw-customer-dropdown-empty">
                No customers found
              </div>
            )}
          </div>
        )}
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
        
        <div 
          className="miw-select-container"
          onClick={() => setShowTermsDropdown(!showTermsDropdown)}
        >
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
            style={{ 
              position: 'absolute', 
              right: 12, 
              top: '50%', 
              transform: 'translateY(-50%)',
              pointerEvents: 'none'
            }}
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
          <button 
            className="btn btn-primary"
            onClick={handleContinue}
            disabled={!customer}
            style={{ 
              width: '100%',
              height: '48px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 600,
              boxShadow: '0 2px 4px rgba(54, 123, 245, 0.3)'
            }}
          >
            Continue
          </button>
        </div>
    </div>
  );
}
