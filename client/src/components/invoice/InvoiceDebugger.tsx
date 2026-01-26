import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';

interface InvoiceDebuggerProps {
  invoiceId: string;
}

export default function InvoiceDebugger({ invoiceId }: InvoiceDebuggerProps) {
  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ['invoice-debug', invoiceId],
    queryFn: async () => {
      const response = await api.get(`/invoices/${invoiceId}`);
      return response.data;
    },
    enabled: !!invoiceId,
  });

  if (isLoading) return <div>Loading invoice data...</div>;
  if (error) return <div>Error loading invoice: {error.message}</div>;

  return (
    <div style={{ 
      position: 'fixed', 
      top: 10, 
      right: 10, 
      background: 'white', 
      border: '1px solid #ccc', 
      padding: '10px',
      zIndex: 9999,
      maxWidth: '300px',
      fontSize: '12px'
    }}>
      <h4>Invoice Debug Info</h4>
      <pre>{JSON.stringify({
        id: invoice?.id,
        invoice_no: invoice?.invoice_no,
        status: invoice?.status,
        customer_name: invoice?.customer_name,
        total_amount: invoice?.total_amount,
        paid_amount: invoice?.paid_amount,
        balance_amount: invoice?.balance_amount,
        items_count: invoice?.items?.length
      }, null, 2)}</pre>
    </div>
  );
}