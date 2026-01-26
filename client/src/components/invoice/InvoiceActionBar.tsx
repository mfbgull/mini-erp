import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, Edit2, Printer, Download, Mail, ArrowLeft } from 'lucide-react';
import Button from '../common/Button';
import { useInvoiceNavigation } from '../../hooks/useInvoiceNavigation';
import './InvoiceRouter.css';

interface InvoiceActionBarProps {
  invoiceId: string;
  currentMode: 'view' | 'edit';
  invoice?: any;
  onPrint?: () => void;
  onDownload?: () => void;
  onEmail?: () => void;
}

export default function InvoiceActionBar({
  invoiceId,
  currentMode,
  invoice,
  onPrint,
  onDownload,
  onEmail
}: InvoiceActionBarProps) {
  const [searchParams] = useSearchParams();
  const { viewInvoice, editInvoice } = useInvoiceNavigation();
  
  const returnTo = searchParams.get('returnTo') || '/sales';
  const action = searchParams.get('action');

  // Handle action-based auto-triggers
  React.useEffect(() => {
    if (currentMode === 'view' && action) {
      switch (action) {
        case 'print':
          onPrint?.();
          break;
        case 'download':
          onDownload?.();
          break;
        case 'email':
          onEmail?.();
          break;
      }
    }
  }, [action, currentMode, onPrint, onDownload, onEmail]);

  return (
    <div className="invoice-action-bar">
      <div className="action-bar-left">
        <Button 
          variant="secondary" 
          onClick={() => window.location.href = returnTo}
        >
          <ArrowLeft size={18} />
          Back
        </Button>
        
        {invoice && (
          <div className="invoice-info">
            <span className="invoice-number">#{invoice.invoice_no}</span>
            <span className={`invoice-status status-${invoice.status?.toLowerCase()}`}>
              {invoice.status}
            </span>
          </div>
        )}
      </div>

      <div className="action-bar-right">
        {currentMode === 'edit' ? (
          <Button 
            variant="secondary" 
            onClick={() => viewInvoice(invoiceId, returnTo)}
          >
            <Eye size={18} />
            Preview
          </Button>
        ) : (
          <>
            <Button 
              variant="secondary" 
              onClick={() => editInvoice(invoiceId, returnTo)}
            >
              <Edit2 size={18} />
              Edit
            </Button>
            
            <Button variant="secondary" onClick={onEmail}>
              <Mail size={18} />
              Email
            </Button>
            
            <Button variant="secondary" onClick={onDownload}>
              <Download size={18} />
              PDF
            </Button>
            
            <Button variant="primary" onClick={onPrint}>
              <Printer size={18} />
              Print
            </Button>
          </>
        )}
      </div>
    </div>
  );
}