import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ArrowLeft, Printer, Download, Edit2, Mail, Share2, RotateCcw } from 'lucide-react';

import Button from '../../components/common/Button';
import InvoiceTemplate from '../../components/invoice/InvoiceTemplate';
import InvoiceReturn from './InvoiceReturn';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { formatCurrency } from '../../utils/formatters';
import api from '../../utils/api';
import './InvoiceViewPage.css';

export default function InvoiceViewPage() {
  const { id: invoiceId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isMobile } = useMobileDetection();
  const invoiceRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnMutation, setReturnMutationState] = useState({ loading: false });

  // Fetch invoice data
  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      const response = await api.get(`/invoices/${invoiceId}`);
      // The API returns the invoice object directly, not wrapped in a data property
      return response.data;
    },
    enabled: !!invoiceId,
    retry: 1, // Retry once if request fails
    staleTime: 0, // Always fetch fresh data
  });

  // Fetch company settings
  const { data: settings = {} } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data;
    }
  });

  const company = {
    name: settings.company_name?.value || 'Mini ERP',
    email: settings.company_email?.value || 'support@minierp.com',
    phone: settings.company_phone?.value || '+1 123 456 7890',
    address: settings.company_address?.value || '456 Enterprise Ave, BC 12345',
    taxId: settings.company_tax_id?.value || '',
  };

  const handlePrint = () => {
    window.print();
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
      pdf.save(`${invoice.invoice_no}.pdf`);

      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF export error:', error);
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

  const handleReturn = async (returnPayload) => {
    if (!invoice) return;
    setReturnMutationState({ loading: true });
    try {
      // Send the full returnPayload to the backend — let the server normalize
      await api.post(`/invoices/${invoiceId}/return`, returnPayload);
      toast.success('Return processed successfully');
      setIsReturnModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    } catch (error) {
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
          <p>The invoice you're looking for doesn't exist or has been deleted.</p>
          <Button onClick={() => navigate('/sales')}>Back to Sales</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="invoice-view-page">
      {/* Toolbar */}
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
            Print
          </Button>
        </div>
      </div>

      {/* Returned Amount Banner */}
      {parseFloat(invoice.returned_amount || 0) > 0 && (
        <div className="returned-amount-banner">
          <RotateCcw size={16} />
          <span>Returned total: <strong>{formatCurrency(parseFloat(invoice.returned_amount))}</strong></span>
        </div>
      )}

      {/* Invoice Preview */}
      <div className="invoice-view-container">
        <div className="invoice-preview-wrapper">
          <InvoiceTemplate
            ref={invoiceRef}
            invoice={invoice}
            company={company}
          />
        </div>
      </div>

      {/* Return Modal */}
      {isReturnModalOpen && invoice && (
        <InvoiceReturn
          invoice={{
            id: invoice.id,
            invoice_no: invoice.invoice_no,
            invoice_date: invoice.invoice_date,
            customer_id: invoice.customer_id,
            customer_name: invoice.customer_name,
            total_amount: invoice.total_amount,
            status: invoice.status
          }}
          items={invoice.items || []}
          onClose={() => setIsReturnModalOpen(false)}
          onSubmit={handleReturn}
          loading={returnMutation.loading}
        />
      )}

      {/* Mobile Action Bar */}
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
