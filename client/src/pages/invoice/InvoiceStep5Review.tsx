import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Calendar, FileText } from 'lucide-react';

import StickyFooter from './components/StickyFooter';
import { useInvoice } from '../../context/InvoiceContext';
import { useSettings } from '../../context/SettingsContext';
import { mobileInvoiceApi } from '../../utils/invoiceApi';


import '../../styles/pages/invoice.css';

export default function InvoiceStep5Review() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { formatCurrency } = useSettings();
  const {
    customer,
    invoiceDate,
    dueDate,
    terms,
    notes,
    items,
    payment,
    calculateSubtotal,
    calculateTax,
    calculateDiscount,
    calculateTotal,
    calculateBalance,
    goToStep,
    isLoading
  } = useInvoice();

  const [saveMode, setSaveMode] = useState<'save' | 'save-new'>('save');
  const [isItemsExpanded, setIsItemsExpanded] = useState(true);

  const handleSave = async () => {
    if (!customer) {
      toast.error('Customer is required');
      return;
    }

    if (items.length === 0) {
      toast.error('At least one item is required');
      return;
    }

    setSaveMode('save');
    
    try {
      const invoiceData = {
        customer_id: customer.id,
        invoice_date: invoiceDate,
        due_date: dueDate,
        terms,
        notes,
        items: items.map(item => ({
          item_id: item.itemId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          tax_rate: item.taxRate,
          discount_type: 'percentage' as const,
          discount_value: 0
        })),
        record_payment: payment.recordPayment,
        payment: payment.recordPayment ? {
          payment_date: payment.paymentDate,
          amount: payment.amount,
          payment_method: payment.method,
          reference_no: payment.reference,
          notes: payment.notes
        } : undefined
      };

      const response = await mobileInvoiceApi.submitInvoice(invoiceData);

      if (response.success) {
        toast.success('Invoice created successfully!');
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        queryClient.invalidateQueries({ queryKey: ['customers'] });
        
        // Navigate to the new invoice print view
        navigate(`/sales/invoice/${response.data.id}/view`);
      } else {
        toast.error(response.message || 'Failed to create invoice');
      }
    } catch (error: unknown) {
      console.error('Error creating invoice:', error);
      toast.error(error.response?.data?.error || 'Failed to create invoice');
    }
  };

  const handleSaveAndNew = async () => {
    setSaveMode('save-new');
    await handleSave();
  };

  const handleBack = () => {
    goToStep(4);
  };

  return (
    <div className="miw-step-5">
      {/* Customer Info Card */}
      {customer && (
        <div className="miw-customer-info-card" onClick={() => goToStep(1)}>
          <div className="miw-customer-info-content">
            <span className="miw-customer-info-label">Customer: </span>
            <span className="miw-customer-info-name">{customer.name}</span>
            {customer.email && <span className="miw-customer-info-contact"> ({customer.email})</span>}
          </div>
        </div>
      )}

      {/* Items Summary */}
      {items.length > 0 && (
        <div className="miw-added-items">
          <div 
            className="miw-added-items-header"
            onClick={() => setIsItemsExpanded(!isItemsExpanded)}
          >
            <span className="miw-added-items-title">Items ({items.length})</span>
            {isItemsExpanded ? (
              <ChevronUp size={18} className="miw-expand-icon" />
            ) : (
              <ChevronDown size={18} className="miw-expand-icon" />
            )}
          </div>
          <div
            className={`miw-added-items-list ${isItemsExpanded ? 'miw-items-list-expanded-short' : 'miw-items-list-collapsed'}`}
          >
            {items.map((item: InvoiceItem, index: number) => (
              <div 
                key={item.id} 
                className="miw-added-item"
                onClick={() => goToStep(3)}
              >
                <div className="miw-added-item-serial">{index + 1}.</div>
                <div className="miw-added-item-info">
                  <div className="miw-added-item-name">{item.name}</div>
                  <div className="miw-added-item-details">
                    <span>Qty: {item.quantity}</span>
                    {item.discount > 0 && <span className="miw-discount-badge">Disc: {item.discount}%</span>}
                    <span>Tax: {item.taxRate}%</span>
                  </div>
                </div>
                <div className="miw-added-item-total">${item.amount.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoice Dates Card - At Top Above Summary */}
      <div className="miw-card miw-card-inline">
        <div className="miw-flex-center-gap miw-mb-12">
          <Calendar size={18} className="miw-icon-primary" />
          <span className="miw-text-sm-bold">Invoice Details</span>
        </div>
        <div className="miw-inline-row">
          <div className="miw-inline-item miw-inline-50">
            <span className="miw-summary-label">Invoice Date</span>
            <span className="miw-summary-value">
              {invoiceDate ? new Date(invoiceDate).toLocaleDateString() : '-'}
            </span>
          </div>
          <div className="miw-inline-item miw-inline-50">
            <span className="miw-summary-label">Due Date</span>
            <span className="miw-summary-value">
              {dueDate ? new Date(dueDate).toLocaleDateString() : '-'}
            </span>
          </div>
        </div>
        {terms && (
          <div className="miw-mt-10">
            <span className="miw-summary-label">Terms</span>
            <span className="miw-summary-value">{terms}</span>
          </div>
        )}
      </div>

      {/* Summary Card */}
      <div className="miw-card">
        <div className="miw-card-header">
          <span className="miw-card-title">Summary</span>
        </div>
        
        <div className="miw-summary-card">
          {/* Subtotal */}
          <div className="miw-summary-row">
            <span className="miw-summary-label">Subtotal</span>
            <span className="miw-summary-value">{formatCurrency(calculateSubtotal())}</span>
          </div>
          
          {/* Tax */}
          <div className="miw-summary-row">
            <span className="miw-summary-label">Tax</span>
            <span className="miw-summary-value">{formatCurrency(calculateTax())}</span>
          </div>
          
          {/* Discount */}
          <div className="miw-summary-row">
            <span className="miw-summary-label">Discount</span>
            <span className="miw-summary-value">-{formatCurrency(calculateDiscount())}</span>
          </div>
          
          <div className="miw-summary-divider miw-divider" />

          {/* Total */}
          <div className="miw-summary-row total">
            <span className="miw-summary-label miw-text-15-bold">Total</span>
            <span className="miw-summary-value miw-text-18-bold">
              {formatCurrency(calculateTotal())}
            </span>
          </div>

          {/* Paid */}
          {payment.recordPayment && payment.amount > 0 && (
            <div className="miw-summary-row miw-mt-6">
              <span className="miw-summary-label">Paid</span>
              <span className="miw-summary-value miw-text-success-bold">
                -{formatCurrency(payment.amount)}
              </span>
            </div>
          )}

          {/* Balance Due */}
          <div className="miw-summary-row total miw-mt-6">
            <span className="miw-summary-label miw-text-14-bold">Balance Due</span>
            <span className={`miw-summary-value miw-text-16-bold ${calculateBalance() > 0 ? 'miw-text-warning' : 'miw-text-success'}`}>
              {formatCurrency(Math.abs(calculateBalance()))}
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {notes && (
        <div className="miw-card miw-mt-12">
          <div className="miw-flex-center-gap-sm">
            <FileText size={16} className="miw-icon-gray" />
            <span className="miw-text-xs-bold-gray">Notes</span>
          </div>
          <p className="miw-text-sm-dark">{notes}</p>
        </div>
      )}

      {/* Sticky Footer with Summary */}
      <StickyFooter
        subtotal={calculateSubtotal()}
        total={calculateTotal()}
        paid={payment.recordPayment ? payment.amount : 0}
        balance={calculateBalance()}
        onBack={handleBack}
        onContinue={handleSave}
        continueLabel="Save Invoice"
      />
    </div>
  );
}
