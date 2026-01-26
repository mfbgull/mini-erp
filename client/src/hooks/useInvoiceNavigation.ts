import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

export interface InvoiceNavigationOptions {
  mode?: 'view' | 'edit';
  action?: 'view' | 'edit' | 'print' | 'download' | 'email';
  returnTo?: string;
}

export function useInvoiceNavigation() {
  const navigate = useNavigate();

  const navigateToInvoice = useCallback((
    invoiceId: string | number, 
    options: InvoiceNavigationOptions = {}
  ) => {
    const { mode, action, returnTo } = options;
    
    // Build URL with query parameters
    const params = new URLSearchParams();
    
    if (mode) params.set('mode', mode);
    if (action) params.set('action', action);
    if (returnTo) params.set('returnTo', returnTo);
    
    const queryString = params.toString();
    const url = `/sales/invoice/${invoiceId}${queryString ? `?${queryString}` : ''}`;
    
    navigate(url);
  }, [navigate]);

  const viewInvoice = useCallback((invoiceId: string | number, returnTo?: string) => {
    navigateToInvoice(invoiceId, { mode: 'view', action: 'view', returnTo });
  }, [navigateToInvoice]);

  const editInvoice = useCallback((invoiceId: string | number, returnTo?: string) => {
    navigateToInvoice(invoiceId, { mode: 'edit', action: 'edit', returnTo });
  }, [navigateToInvoice]);

  const printInvoice = useCallback((invoiceId: string | number) => {
    navigateToInvoice(invoiceId, { mode: 'view', action: 'print' });
  }, [navigateToInvoice]);

  const downloadInvoice = useCallback((invoiceId: string | number) => {
    navigateToInvoice(invoiceId, { mode: 'view', action: 'download' });
  }, [navigateToInvoice]);

  const emailInvoice = useCallback((invoiceId: string | number) => {
    navigateToInvoice(invoiceId, { mode: 'view', action: 'email' });
  }, [navigateToInvoice]);

  return {
    navigateToInvoice,
    viewInvoice,
    editInvoice,
    printInvoice,
    downloadInvoice,
    emailInvoice,
  };
}