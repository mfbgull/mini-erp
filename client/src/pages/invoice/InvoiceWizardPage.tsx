import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { X, User, Package, Plus, DollarSign, Check } from 'lucide-react';

import InvoiceStep1Customer from './InvoiceStep1Customer';
import InvoiceStep2Items from './InvoiceStep2Items';
import InvoiceStep3AddItem from './InvoiceStep3AddItem';
import InvoiceStep4Payment from './InvoiceStep4Payment';
import InvoiceStep5Review from './InvoiceStep5Review';
import { useInvoice } from '../../context/InvoiceContext';
import { mobileInvoiceApi } from '../../utils/invoiceApi';

import '../../styles/pages/invoice.css';

export default function InvoiceWizardPage() {
  const navigate = useNavigate();
  const { draftId } = useParams();
  const { 
    currentStep, 
    totalSteps, 
    calculateSubtotal, 
    calculateTotal, 
    calculateBalance,
    dispatch,
    isLoading,
    payment,
    items
  } = useInvoice();

  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Load draft if provided
  useEffect(() => {
    if (draftId) {
      loadDraft(draftId);
    }
  }, [draftId]);

  const loadDraft = async (id: string) => {
    try {
      const response = await mobileInvoiceApi.getDraft(id);
      if (response.success && response.data) {
        const draft = response.data;
        if (draft.items_data) {
          const itemsData = JSON.parse(draft.items_data);
          dispatch({ type: 'SET_CUSTOMER', payload: draft.customer_id ? {
            id: draft.customer_id,
            name: '',
            email: '',
            phone: '',
            balance: 0
          } : null });
          dispatch({ type: 'SET_INVOICE_DATE', payload: draft.invoice_date || '' });
          dispatch({ type: 'SET_DUE_DATE', payload: draft.due_date || '' });
          dispatch({ type: 'SET_TERMS', payload: draft.terms || '' });
          dispatch({ type: 'SET_NOTES', payload: draft.notes || '' });
        }
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  };

  const handleClose = () => {
    // Check if there are unsaved changes
    if (items.length > 0 || currentStep > 1) {
      setShowExitConfirm(true);
    } else {
      navigate(-1);
    }
  };

  const handleExitConfirmed = () => {
    navigate(-1);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <InvoiceStep1Customer />;
      case 2:
        return <InvoiceStep2Items />;
      case 3:
        return <InvoiceStep3AddItem />;
      case 4:
        return <InvoiceStep4Payment />;
      case 5:
        return <InvoiceStep5Review />;
      default:
        return <InvoiceStep1Customer />;
    }
  };

  const steps = [
    { number: 1, label: 'Customer', icon: User },
    { number: 2, label: 'Items', icon: Package },
    { number: 3, label: 'Add', icon: Plus },
    { number: 4, label: 'Payment', icon: DollarSign },
    { number: 5, label: 'Review', icon: Check },
  ];

  return (
    <div className="mobile-invoice-wizard">
      <div className="miw-header">
        <div className="miw-header-top">
          <button className="miw-close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
          <div className="miw-title">Create Invoice</div>
          <div className="miw-header-right miw-header-spacer" />
        </div>
        
        {currentStep < 5 && (
          <div className="miw-progress-steps">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep >= step.number;
              const isCurrent = currentStep === step.number;
              
              return (
                <div 
                  key={step.number}
                  className={`miw-progress-step ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}`}
                >
                  <div className="miw-step-number">
                    {step.number}
                  </div>
                  <span className="miw-step-label">{step.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="miw-content">
        {renderStep()}
      </div>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="miw-modal-overlay" onClick={() => setShowExitConfirm(false)}>
          <div className="miw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="miw-modal-title">Discard Invoice?</div>
            <div className="miw-modal-message">
              You have unsaved changes. Are you sure you want to exit?
            </div>
            <div className="miw-modal-actions">
              <button 
                className="miw-modal-btn miw-modal-btn-secondary"
                onClick={() => setShowExitConfirm(false)}
              >
                Continue Editing
              </button>
              <button 
                className="miw-modal-btn miw-modal-btn-danger"
                onClick={handleExitConfirmed}
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="miw-loading-overlay">
          <div className="miw-loading-spinner" />
        </div>
      )}
    </div>
  );
}
