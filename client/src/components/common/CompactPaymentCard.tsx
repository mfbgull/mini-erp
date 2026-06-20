import { useState } from 'react';
import { format } from 'date-fns';
import { Eye, Edit2, Trash2, CreditCard, Search } from 'lucide-react';
import { CompactCardShell } from './CompactCardShell';
import { formatCurrency } from '../../utils/formatters';
import '../../styles/components/card.css';
import './CompactPaymentCard.css';

interface Payment {
  id: number; payment_no: string; payment_date: string; amount: number;
  payment_method: string; reference_no?: string; notes?: string; customer_name?: string;
}

interface CompactPaymentCardProps {
  payment: Payment;
  onView?: (p: Payment) => void;
  onEdit: (p: Payment) => void;
  onDelete?: (p: Payment) => void;
}

function getMethodClass(method: string) {
  switch (method?.toLowerCase()) {
    case 'cash': case 'bank transfer': case 'debit card': return 'stock-normal';
    case 'check': case 'credit card': return 'stock-low';
    default: return 'stock-normal';
  }
}

export function CompactPaymentCard({ payment, onView, onEdit, onDelete }: CompactPaymentCardProps) {
  const menuItems = [
    ...(onView ? [{ label: 'View', icon: <Eye className="dropdown-icon" />, onClick: () => onView(payment) }] : []),
    { label: 'Edit', icon: <Edit2 className="dropdown-icon" />, onClick: () => onEdit(payment) },
    ...(onDelete ? [{ label: 'Delete', icon: <Trash2 className="dropdown-icon" />, onClick: () => onDelete(payment), variant: 'danger' as const }] : []),
  ];

  return (
    <CompactCardShell
      className="compact-payment-card"
      menuItems={menuItems}
      detailTitle={payment.payment_no}
      detailContent={
        <>
          <div className="item-preview-stats">
            <div className="preview-stat"><span className="preview-stat-label">Amount</span><span className="preview-stat-value stock-normal">{formatCurrency(parseFloat(String(payment.amount || 0)))}</span></div>
            <div className="preview-stat"><span className="preview-stat-label">Method</span><span className="preview-stat-value" style={{ fontSize: '14px' }}>{payment.payment_method || 'Cash'}</span></div>
            <div className="preview-stat"><span className="preview-stat-label">Date</span><span className="preview-stat-value" style={{ fontSize: '14px' }}>{payment.payment_date ? format(new Date(payment.payment_date), 'dd MMM') : ''}</span></div>
          </div>
          <div className="preview-details-grid">
            <div className="preview-detail-item"><span className="preview-detail-label">Payment Date</span><span className="preview-detail-value">{payment.payment_date ? format(new Date(payment.payment_date), 'dd MMM yyyy') : ''}</span></div>
            <div className="preview-detail-item"><span className="preview-detail-label">Payment Method</span><span className="preview-detail-value"><span className={`status-badge ${getMethodClass(payment.payment_method)}`}>{payment.payment_method || 'Cash'}</span></span></div>
            {payment.reference_no && <div className="preview-detail-item"><span className="preview-detail-label">Reference No</span><span className="preview-detail-value">{payment.reference_no}</span></div>}
            {payment.notes && <div className="preview-detail-item full-width"><span className="preview-detail-label">Notes</span><span className="preview-detail-value">{payment.notes}</span></div>}
          </div>
        </>
      }
    >
      <div className="payment-info-section">
        <p className="payment-item-name">{payment.payment_no}</p>
        <div className="payment-meta"><span className="payment-item-code">{payment.payment_method || 'Cash'}</span></div>
      </div>
      <div className="payment-amount-row">
        <div className="quantity-display"><span className="qty-text qty-positive">{formatCurrency(parseFloat(String(payment.amount || 0)))}</span></div>
      </div>
      <div className="payment-card-date-row">
        <span className="payment-method-badge">{payment.payment_method || 'Cash'}</span>
        <span className="payment-date-text">{payment.payment_date ? format(new Date(payment.payment_date), 'dd MMM') : ''}</span>
      </div>
    </CompactCardShell>
  );
}

export default function CompactPaymentCardView({ payments, onView, onEdit, onDelete }: {
  payments: Payment[]; onView?: (p: Payment) => void; onEdit: (p: Payment) => void; onDelete?: (p: Payment) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const filtered = payments.filter(p =>
    p.payment_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.payment_method?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.reference_no?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="compact-mobile-cards-wrapper">
      <div className="compact-mobile-search-container">
        <Search className="search-icon" size={18} />
        <input type="text" placeholder="Search payments..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="compact-mobile-search-input" />
      </div>
      {filtered.length === 0 ? (
        <div className="mobile-empty-state">
          <CreditCard className="empty-icon" size={48} />
          <div className="empty-title">{searchTerm ? 'No matching payments' : 'No payments found'}</div>
        </div>
      ) : (
        <div className="compact-mobile-cards-container">
          {filtered.map((p) => <CompactPaymentCard key={p.id} payment={p} onView={onView} onEdit={onEdit} onDelete={onDelete} />)}
        </div>
      )}
    </div>
  );
}
