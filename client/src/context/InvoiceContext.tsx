import React, { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react';

// ============================================
// Types
// ============================================

export interface InvoiceItem {
  id: string;
  itemId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discount: number;
  amount: number;
}

export interface InvoiceCustomer {
  id: number;
  name: string;
  email: string;
  phone: string;
  balance: number;
}

export interface PaymentDetails {
  recordPayment: boolean;
  paymentDate: string;
  amount: number;
  method: string;
  reference: string;
  notes: string;
}

export interface InvoiceDraft {
  customer: InvoiceCustomer | null;
  invoiceDate: string;
  dueDate: string;
  terms: string;
  notes: string;
  items: InvoiceItem[];
  payment: PaymentDetails;
  discount: {
    type: 'percentage' | 'flat';
    value: number;
  };
}

interface InvoiceState extends InvoiceDraft {
  currentStep: number;
  totalSteps: number;
  isLoading: boolean;
  draftId: string | null;
}

type InvoiceAction =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'SET_CUSTOMER'; payload: InvoiceCustomer | null }
  | { type: 'SET_INVOICE_DATE'; payload: string }
  | { type: 'SET_DUE_DATE'; payload: string }
  | { type: 'SET_TERMS'; payload: string }
  | { type: 'SET_NOTES'; payload: string }
  | { type: 'ADD_ITEM'; payload: InvoiceItem }
  | { type: 'UPDATE_ITEM'; payload: { id: string; updates: Partial<InvoiceItem> } }
  | { type: 'DELETE_ITEM'; payload: string }
  | { type: 'SET_PAYMENT'; payload: Partial<PaymentDetails> }
  | { type: 'SET_DISCOUNT'; payload: { type: 'percentage' | 'flat'; value: number } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_DRAFT_ID'; payload: string | null }
  | { type: 'LOAD_DRAFT'; payload: InvoiceDraft }
  | { type: 'RESET' };

interface InvoiceContextType extends InvoiceState {
  dispatch: React.Dispatch<InvoiceAction>;
  calculateSubtotal: () => number;
  calculateTax: () => number;
  calculateDiscount: () => number;
  calculateTotal: () => number;
  calculateBalance: () => number;
  canProceedToStep: (step: number) => boolean;
  goToStep: (step: number) => void;
  nextStep: () => void;
  saveDraft: () => Promise<void>;
  resetInvoice: () => void;
}

const initialState: InvoiceState = {
  customer: null,
  invoiceDate: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  terms: 'Net 14',
  notes: '',
  items: [],
  payment: {
    recordPayment: false,
    paymentDate: new Date().toISOString().split('T')[0],
    amount: 0,
    method: 'Cash',
    reference: '',
    notes: ''
  },
  discount: {
    type: 'flat',
    value: 0
  },
  currentStep: 1,
  totalSteps: 5,
  isLoading: false,
  draftId: null
};

function calculateItemAmount(item: InvoiceItem): number {
  const subtotal = item.quantity * item.unitPrice;
  const discountAmount = item.discount || 0;
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (item.taxRate / 100);
  return afterDiscount + taxAmount;
}

function reducer(state: InvoiceState, action: InvoiceAction): InvoiceState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: Math.max(1, Math.min(action.payload, state.totalSteps)) };
    
    case 'NEXT_STEP':
      return { ...state, currentStep: Math.min(state.currentStep + 1, state.totalSteps) };
    
    case 'PREV_STEP':
      return { ...state, currentStep: Math.max(state.currentStep - 1, 1) };
    
    case 'SET_CUSTOMER':
      return { ...state, customer: action.payload };
    
    case 'SET_INVOICE_DATE':
      return { ...state, invoiceDate: action.payload };
    
    case 'SET_DUE_DATE':
      return { ...state, dueDate: action.payload };
    
    case 'SET_TERMS':
      return { ...state, terms: action.payload };
    
    case 'SET_NOTES':
      return { ...state, notes: action.payload };
    
    case 'ADD_ITEM': {
      const newItem = { ...action.payload, amount: calculateItemAmount(action.payload) };
      return { ...state, items: [...state.items, newItem] };
    }
    
    case 'UPDATE_ITEM': {
      const updatedItems = state.items.map(item => {
        if (item.id === action.payload.id) {
          const updatedItem = { ...item, ...action.payload.updates };
          return { ...updatedItem, amount: calculateItemAmount(updatedItem) };
        }
        return item;
      });
      return { ...state, items: updatedItems };
    }
    
    case 'DELETE_ITEM':
      return { ...state, items: state.items.filter(item => item.id !== action.payload) };
    
    case 'SET_PAYMENT':
      return { ...state, payment: { ...state.payment, ...action.payload } };
    
    case 'SET_DISCOUNT':
      return { ...state, discount: action.payload };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_DRAFT_ID':
      return { ...state, draftId: action.payload };
    
    case 'LOAD_DRAFT':
      return { ...state, ...action.payload, currentStep: 1 };
    
    case 'RESET':
      return initialState;
    
    default:
      return state;
  }
}

// ============================================
// Context
// ============================================

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

// ============================================
// Provider
// ============================================

interface InvoiceProviderProps {
  children: ReactNode;
}

export function InvoiceProvider({ children }: InvoiceProviderProps) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Calculate subtotal
  const calculateSubtotal = useCallback(() => {
    return state.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  }, [state.items]);

  // Calculate tax
  const calculateTax = useCallback(() => {
    return state.items.reduce((sum, item) => {
      const subtotal = item.quantity * item.unitPrice;
      const discount = item.discount || 0;
      const afterDiscount = subtotal - discount;
      return sum + (afterDiscount * (item.taxRate / 100));
    }, 0);
  }, [state.items]);

  // Calculate discount
  const calculateDiscount = useCallback(() => {
    return state.items.reduce((sum, item) => sum + (item.discount || 0), 0);
  }, [state.items]);

  // Calculate total
  const calculateTotal = useCallback(() => {
    return calculateSubtotal() + calculateTax() - calculateDiscount();
  }, [calculateSubtotal, calculateTax, calculateDiscount]);

  // Calculate balance
  const calculateBalance = useCallback(() => {
    const total = calculateTotal();
    if (state.payment.recordPayment) {
      return total - state.payment.amount;
    }
    return total;
  }, [calculateTotal, state.payment]);

  // Check if user can proceed to a step
  const canProceedToStep = useCallback((step: number): boolean => {
    switch (step) {
      case 2: // Items
        return !!(state.customer && state.invoiceDate && state.dueDate);
      case 3: // Add items - always allowed when coming from step 2
        return state.items.length >= 0; // Can always access to add items
      case 4: // Payment
        return state.items.length > 0;
      case 5: // Review
        return state.items.length > 0;
      default:
        return true;
    }
  }, [state.customer, state.invoiceDate, state.dueDate, state.items.length]);

  // Go to next step
  const nextStep = useCallback(() => {
    if (state.currentStep < state.totalSteps && canProceedToStep(state.currentStep + 1)) {
      dispatch({ type: 'NEXT_STEP' });
    }
  }, [canProceedToStep, state.currentStep, state.totalSteps]);

  // Go to specific step
  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= state.totalSteps && canProceedToStep(step)) {
      dispatch({ type: 'SET_STEP', payload: step });
    }
  }, [canProceedToStep, state.totalSteps]);

  // Save draft to server
  const saveDraft = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const draftData = {
        customer_id: state.customer?.id,
        invoice_date: state.invoiceDate,
        due_date: state.dueDate,
        terms: state.terms,
        notes: state.notes,
        items_data: state.items.map(item => ({
          itemId: item.itemId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          discount: item.discount
        }))
      };

      const response = await fetch('/api/mobile-invoices/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(draftData)
      });

      if (!response.ok) {
        throw new Error('Failed to save draft');
      }

      const data = await response.json();
      dispatch({ type: 'SET_DRAFT_ID', payload: data.data.id.toString() });
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.customer?.id, state.invoiceDate, state.dueDate, state.terms, state.notes, state.items]);

  // Reset invoice
  const resetInvoice = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const value: InvoiceContextType = {
    ...state,
    dispatch,
    calculateSubtotal,
    calculateTax,
    calculateDiscount,
    calculateTotal,
    calculateBalance,
    canProceedToStep,
    goToStep,
    nextStep,
    saveDraft,
    resetInvoice
  };

  return (
    <InvoiceContext.Provider value={value}>
      {children}
    </InvoiceContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function useInvoice() {
  const context = useContext(InvoiceContext);
  if (context === undefined) {
    throw new Error('useInvoice must be used within an InvoiceProvider');
  }
  return context;
}

// ============================================
// Auto-save draft effect
// ============================================

export function useAutoSaveDraft(intervalMs: number = 30000) {
  const { saveDraft, draftId, customer } = useInvoice();

  useEffect(() => {
    // Only auto-save if we have some data
    if (!customer) return;

    const interval = setInterval(() => {
      saveDraft();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [saveDraft, intervalMs, customer]);
}
