import { format } from 'date-fns';
import { Eye, Edit2, Trash2, FileText, RotateCcw, Ban } from 'lucide-react';
import { CompactCardShell } from './CompactCardShell';
import { formatCurrency } from '../../utils/formatters';
import '../../styles/components/card.css';
import './CompactInvoiceCard.css';

interface Invoice {
  id: number;
  invoice_no: string;
  invoice_date: string;
  customer_name: string;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  status: string;
  due_date?: string;
}

interface CompactInvoiceCardProps {
  invoice: Invoice;
  onView: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
  onDelete?: (invoice: Invoice) => void;
  onReturn?: (invoice: Invoice) => void;
  onCancel?: (invoice: Invoice) => void;
}

function getStatusClass(status: string) {
  switch (status?.toLowerCase()) {
    case 'paid': return 'stock-normal';
    case 'returned': return 'stock-normal';
    case 'partial':
    case 'partially paid':
    case 'partially returned': return 'stock-low';
    case 'overdue': return 'stock-out-of-stock';
    case 'cancelled': return 'stock-out-of-stock';
    default: return 'stock-low';
  }
}

export function CompactInvoiceCard({ invoice, onView, onEdit, onDelete, onReturn, onCancel }: CompactInvoiceCardProps) {
  const isPaid = parseFloat(String(invoice.balance_amount || '0')) === 0;
  const paidAmt = parseFloat(String(invoice.paid_amount || '0'));
  const returnedAmt = parseFloat(String((invoice as unknown as Record<string, unknown>).returned_amount || '0'));
  const isDeletable = ['Draft', 'Unpaid'].includes(invoice.status) && paidAmt === 0 && returnedAmt === 0;

  const menuItems = [
    { label: 'View', icon: <Eye className="dropdown-icon" />, onClick: () => onView(invoice) },
    { label: 'Edit', icon: <Edit2 className="dropdown-icon" />, onClick: () => onEdit(invoice) },
    ...(onReturn ? [{ label: 'Return', icon: <RotateCcw className="dropdown-icon" />, onClick: () => onReturn(invoice) }] : []),
    ...(onDelete && isDeletable ? [{ label: 'Delete', icon: <Trash2 className="dropdown-icon" />, onClick: () => onDelete(invoice), variant: 'danger' as const }] : []),
    ...(onCancel && invoice.status !== 'Cancelled' ? [{ label: 'Cancel', icon: <Ban className="dropdown-icon" />, onClick: () => onCancel(invoice), variant: 'danger' as const }] : []),
  ];

  return (
    <CompactCardShell
      className="compact-invoice-card"
      menuItems={menuItems}
      detailTitle={invoice.invoice_no}
      detailContent={
        <>
          <div className="item-preview-stats">
            <div className="preview-stat">
              <span className="preview-stat-label">Total</span>
              <span className="preview-stat-value">{formatCurrency(parseFloat(String(invoice.total_amount || 0)))}</span>
            </div>
            <div className="preview-stat">
              <span className="preview-stat-label">Paid</span>
              <span className="preview-stat-value stock-normal">{formatCurrency(parseFloat(String(invoice.paid_amount || 0)))}</span>
            </div>
            <div className="preview-stat">
              <span className="preview-stat-label">Balance</span>
              <span className={`preview-stat-value ${isPaid ? 'stock-normal' : 'stock-out-of-stock'}`}>{formatCurrency(parseFloat(String(invoice.balance_amount || 0)))}</span>
            </div>
          </div>
          <div className="preview-details-grid">
            <div className="preview-detail-item">
              <span className="preview-detail-label">Status</span>
              <span className="preview-detail-value"><span className={`status-badge ${getStatusClass(invoice.status)}`}>{invoice.status || 'Pending'}</span></span>
            </div>
            <div className="preview-detail-item">
              <span className="preview-detail-label">Invoice Date</span>
              <span className="preview-detail-value">{invoice.invoice_date ? format(new Date(invoice.invoice_date), 'dd MMM yyyy') : ''}</span>
            </div>
            {invoice.due_date && (
              <div className="preview-detail-item">
                <span className="preview-detail-label">Due Date</span>
                <span className="preview-detail-value">{format(new Date(invoice.due_date), 'dd MMM yyyy')}</span>
              </div>
            )}
          </div>
        </>
      }
    >
      <div className="invoice-info-section">
        <p className="invoice-item-name">{invoice.customer_name}</p>
        <div className="invoice-meta"><span className="invoice-item-code">{invoice.invoice_no}</span></div>
      </div>
      <div className="invoice-amount-row">
        <div className="quantity-display">
          <span className={`qty-text ${isPaid ? 'qty-positive' : 'qty-low'}`}>{formatCurrency(parseFloat(String(invoice.total_amount || 0)))}</span>
        </div>
      </div>
      <div className="invoice-card-status-row">
        <span className={`status-badge ${getStatusClass(invoice.status)}`}>{invoice.status || 'Pending'}</span>
        <span className="invoice-date-text">{invoice.invoice_date ? format(new Date(invoice.invoice_date), 'dd MMM') : ''}</span>
      </div>
    </CompactCardShell>
  );
}

export default function CompactInvoiceCardView({ invoices, onView, onEdit, onDelete, onReturn, onCancel }: {
  invoices: Invoice[]; onView: (i: Invoice) => void; onEdit: (i: Invoice) => void;
  onDelete?: (i: Invoice) => void; onReturn?: (i: Invoice) => void; onCancel?: (i: Invoice) => void;
}) {
  if (invoices.length === 0) return (
    <div className="compact-mobile-cards-wrapper"><div className="mobile-empty-state">
      <FileText className="empty-icon" size={48} /><div className="empty-title">No invoices found</div>
    </div></div>
  );
  return (
    <div className="compact-mobile-cards-wrapper"><div className="compact-mobile-cards-container">
      {invoices.map((i) => <CompactInvoiceCard key={i.id} invoice={i} onView={onView} onEdit={onEdit} onDelete={onDelete} onReturn={onReturn} onCancel={onCancel} />)}
    </div></div>
  );
}
