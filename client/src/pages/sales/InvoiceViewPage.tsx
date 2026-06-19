import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ArrowLeft, Printer, Download, Edit2, Mail, RotateCcw, Ban, Receipt } from 'lucide-react';
import { createRoot } from 'react-dom/client';

import InvoiceReturn from './InvoiceReturn';
import Button from '../../components/common/Button';
import InvoiceTemplateA4 from '../../components/invoice/InvoiceTemplateA4';
import ThermalInvoiceTemplate from '../../components/invoice/ThermalInvoiceTemplate';
import thermalStyles from '../../components/invoice/ThermalInvoiceTemplate.css?inline';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { useTranslation } from '../../hooks/useTranslation';
import api from '../../utils/api';
import { formatCurrency } from '../../utils/formatters';
import './InvoiceViewPage.css';

interface InvoiceData {
  id: number;
  invoice_no: string;
  invoice_date: string;
  due_date: string;
  customer_id: number;
  customer_name: string;
  customer_address?: string;
  customer_phone?: string;
  customer_email?: string;
  items: Array<Record<string, unknown>>;
  total_amount: number;
  paid_amount?: number;
  balance_amount?: number;
  returned_amount?: number;
  status: string;
  payment_terms_days?: number;
  notes?: string;
  terms?: string;
  discount_type?: string;
  discount_value?: number;
}

interface ReturnPayload {
  items: { invoice_item_id: number; return_quantity: number; reason: string }[];
  disposition: 'refund' | 'credit' | 'adjust';
  adjust_invoice_ids?: number[];
}

interface CompanyInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
}

interface Payment {
  id: number;
  payment_date: string;
  payment_method: string;
  reference_no?: string;
  amount: number;
}

export default function InvoiceViewPage() {
  const { id: invoiceId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isMobile } = useMobileDetection();
  const { t } = useTranslation();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnMutation, setReturnMutationState] = useState({ loading: false });
  const [isCancelling, setIsCancelling] = useState(false);

  const { data: invoice, isLoading, error } = useQuery<InvoiceData>({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      const response = await api.get(`/invoices/${invoiceId}`);
      return response.data;
    },
    enabled: !!invoiceId,
    retry: 1,
    staleTime: 0,
  });

  const { data: settings = {} } = useQuery<Record<string, { value?: string }>>({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data;
    }
  });

  const company: CompanyInfo = {
    name: settings.company_name?.value || 'Mini ERP',
    email: settings.company_email?.value || 'support@minierp.com',
    phone: settings.company_phone?.value || '+1 123 456 7890',
    address: settings.company_address?.value || '456 Enterprise Ave, BC 12345',
    taxId: settings.company_tax_id?.value || '',
  };

  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ['invoice-payments', invoiceId],
    queryFn: async () => {
      const response = await api.get(`/invoices/${invoiceId}/payments`);
      return response.data.data || [];
    },
    enabled: !!invoiceId,
    staleTime: 30000,
  });

  const handlePrint = () => {
    window.print();
  };

  const handlePrintReceipt = () => {
    if (!invoice) return;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      toast.error(t('errors.allowPopups'));
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt ${invoice.invoice_no}</title>
          <style>
            @page { size: 80mm 297mm; margin: 0; }
            body { margin: 0; padding: 0; background: #fff; width: 80mm; }
            * { box-sizing: border-box; }
          </style>
          <style>${thermalStyles}</style>
        </head>
        <body>
          <div id="thermal-print-root"></div>
        </body>
      </html>
    `);
    printWindow.document.close();

    const rootEl = printWindow.document.getElementById('thermal-print-root');
    if (rootEl) {
      const root = createRoot(rootEl);
      root.render(
        <ThermalInvoiceTemplate
          invoice={{
            invoice_no: invoice.invoice_no,
            invoice_date: invoice.invoice_date,
            customer_name: invoice.customer_name,
            customer_address: invoice.customer_address,
            customer_phone: invoice.customer_phone,
            customer_email: invoice.customer_email,
            items: invoice.items as Array<{ quantity?: number; unit_price?: number; rate?: number; item_name?: string; description?: string; item_code?: string }>,
            total_amount: invoice.total_amount,
            paid_amount: invoice.paid_amount,
            balance_amount: invoice.balance_amount,
            returned_amount: invoice.returned_amount,
            payment_terms_days: invoice.payment_terms_days,
          }}
          company={company}
        />
      );

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          printWindow.print();
          printWindow.close();
        });
      });
    }

    toast.success(t('common.receiptPrinting'));
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`${invoice?.invoice_no ?? 'invoice'}.pdf`);

      toast.success('PDF downloaded successfully');
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Failed to generate PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleEmail = () => {
    if (invoice?.customer_email) {
      const subject = encodeURIComponent(`Invoice ${invoice.invoice_no} from ${company.name}`);
      const body = encodeURIComponent(
        `Dear ${invoice.customer_name},\n\n` +
        `Please find attached Invoice ${invoice.invoice_no} for the amount of $${invoice.total_amount?.toFixed(2)}.\n\n` +
        `Due Date: ${new Date(invoice.due_date).toLocaleDateString()}\n\n` +
        `Thank you for your business.\n\n` +
        `Best regards,\n${company.name}`
      );
      window.open(`mailto:${invoice.customer_email}?subject=${subject}&body=${body}`);
    } else {
      toast.error('Customer email not available');
    }
  };

  const handleCancel = async () => {
    if (!invoice) return;
    if (invoice.status === 'Cancelled') {
      toast.error('Invoice is already cancelled');
      return;
    }
    if (!window.confirm(`Are you sure you want to cancel invoice "${invoice.invoice_no}"? This will mark it as cancelled but keep all records.`)) {
      return;
    }
    setIsCancelling(true);
    try {
      await api.put(`/invoices/${invoiceId}/cancel`);
      toast.success('Invoice cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || 'Failed to cancel invoice');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReturn = async (returnPayload: ReturnPayload) => {
    if (!invoice) return;
    setReturnMutationState({ loading: true });
    try {
      await api.post(`/invoices/${invoiceId}/return`, returnPayload);
      toast.success('Return processed successfully');
      setIsReturnModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || 'Failed to process return');
    } finally {
      setReturnMutationState({ loading: false });
    }
  };

  if (isLoading) {
    return (
      <div className="invoice-view-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="invoice-view-page">
        <div className="error-container">
          <h2>Invoice not found</h2>
          <p>The invoice you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
          <Button onClick={() => navigate('/sales')}>Back to Sales</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="invoice-view-page">
      <div className="invoice-view-toolbar no-print">
        <div className="toolbar-left">
          <h2 className="toolbar-title">Invoice {invoice.invoice_no}</h2>
        </div>
        <div className="toolbar-right">
          {invoice.status !== 'Cancelled' && (
            <Button variant="secondary" onClick={() => setIsReturnModalOpen(true)}>
              <RotateCcw size={18} />
              Return
            </Button>
          )}
          {invoice.status !== 'Cancelled' && (
            <Button variant="danger" onClick={handleCancel} loading={isCancelling}>
              <Ban size={18} />
              Cancel
            </Button>
          )}
          <Button variant="secondary" onClick={() => navigate(`/sales/invoice/${invoiceId}?mode=edit`)}>
            <Edit2 size={18} />
            Edit
          </Button>
          <Button variant="secondary" onClick={handleEmail}>
            <Mail size={18} />
            Email
          </Button>
          <Button variant="secondary" onClick={handleDownloadPDF} loading={isExporting}>
            <Download size={18} />
            PDF
          </Button>
          <Button variant="primary" onClick={handlePrint}>
            <Printer size={18} />
            {t('sales.printA4')}
          </Button>
          <Button variant="secondary" onClick={handlePrintReceipt}>
            <Receipt size={18} />
            {t('sales.receipt')}
          </Button>
        </div>
      </div>

      {parseFloat(String(invoice.returned_amount || 0)) > 0 && (
        <div className="returned-amount-banner">
          <RotateCcw size={16} />
          <span>Returned total: <strong>{formatCurrency(parseFloat(String(invoice.returned_amount)))}</strong></span>
        </div>
      )}

      <div className="invoice-view-container">
        <div className="invoice-preview-wrapper">
          <InvoiceTemplateA4
            ref={invoiceRef}
            invoice={invoice}
            company={company}
            payments={payments}
          />
        </div>
      </div>

      {isReturnModalOpen && invoice && (
        <InvoiceReturn
          invoice={{
            id: invoice.id,
            invoice_no: invoice.invoice_no,
            invoice_date: invoice.invoice_date,
            customer_id: invoice.customer_id,
            customer_name: invoice.customer_name,
            total_amount: invoice.total_amount,
            status: invoice.status,
          }}
          items={(invoice.items || []) as Array<{ id: number; item_id: number; item_name: string; item_code?: string; quantity: number; unit_price: number; unit_of_measure?: string; returned_qty?: number; tax_rate?: number }>}
          onClose={() => setIsReturnModalOpen(false)}
          onSubmit={handleReturn}
          loading={returnMutation.loading}
        />
      )}

      {isMobile && (
        <div className="mobile-action-bar">
          <Button variant="primary" onClick={() => navigate(-1)} className="fab-button">
            <ArrowLeft size={18} />
            Back
          </Button>
        </div>
      )}
    </div>
  );
}
