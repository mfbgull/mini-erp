import { format } from 'date-fns';
import { Eye, Edit2, ShoppingCart, RotateCcw } from 'lucide-react';
import { CompactCardShell } from './CompactCardShell';
import { formatCurrency } from '../../utils/formatters';
import '../../styles/components/card.css';
import './CompactPurchaseCard.css';

interface Purchase {
  id: number; purchase_no: string; purchase_date: string; item_name: string; item_code?: string;
  quantity: number; unit_cost: number; total_cost: number; supplier_name: string;
  warehouse_name: string; unit_of_measure?: string; invoice_no?: string;
}

interface CompactPurchaseCardProps {
  purchase: Purchase;
  onView: (p: Purchase) => void;
  onEdit: (p: Purchase) => void;
  onReturn?: (p: Purchase) => void;
}

export function CompactPurchaseCard({ purchase, onView, onEdit, onReturn }: CompactPurchaseCardProps) {
  return (
    <CompactCardShell
      className="compact-purchase-card"
      menuItems={[
        { label: 'View', icon: <Eye className="dropdown-icon" />, onClick: () => onView(purchase) },
        { label: 'Edit', icon: <Edit2 className="dropdown-icon" />, onClick: () => onEdit(purchase) },
        ...(onReturn ? [{ label: 'Return', icon: <RotateCcw className="dropdown-icon" />, onClick: () => onReturn(purchase) }] : []),
      ]}
      detailTitle={purchase.purchase_no}
      detailContent={
        <>
          <div className="item-preview-stats">
            <div className="preview-stat"><span className="preview-stat-label">Total</span><span className="preview-stat-value stock-normal">{formatCurrency(parseFloat(String(purchase.total_cost || 0)))}</span></div>
            <div className="preview-stat"><span className="preview-stat-label">Qty</span><span className="preview-stat-value">{parseFloat(String(purchase.quantity || 0)).toFixed(2)}</span></div>
            <div className="preview-stat"><span className="preview-stat-label">Unit Cost</span><span className="preview-stat-value" style={{ fontSize: '14px' }}>{formatCurrency(parseFloat(String(purchase.unit_cost || 0)))}</span></div>
          </div>
          <div className="preview-details-grid">
            <div className="preview-detail-item"><span className="preview-detail-label">Purchase Date</span><span className="preview-detail-value">{purchase.purchase_date ? format(new Date(purchase.purchase_date), 'dd MMM yyyy') : ''}</span></div>
            {purchase.item_code && <div className="preview-detail-item"><span className="preview-detail-label">Item Code</span><span className="preview-detail-value">{purchase.item_code}</span></div>}
            <div className="preview-detail-item"><span className="preview-detail-label">Supplier</span><span className="preview-detail-value">{purchase.supplier_name || 'N/A'}</span></div>
            <div className="preview-detail-item"><span className="preview-detail-label">Warehouse</span><span className="preview-detail-value">{purchase.warehouse_name || 'N/A'}</span></div>
            {purchase.invoice_no && <div className="preview-detail-item"><span className="preview-detail-label">Invoice No</span><span className="preview-detail-value">{purchase.invoice_no}</span></div>}
            <div className="preview-detail-item"><span className="preview-detail-label">Unit</span><span className="preview-detail-value">{purchase.unit_of_measure || 'units'}</span></div>
          </div>
        </>
      }
    >
      <div className="purchase-info-section">
        <p className="purchase-item-name">{purchase.item_name}</p>
        <div className="purchase-meta"><span className="purchase-item-code">{purchase.purchase_no}</span></div>
      </div>
      <div className="purchase-amount-row">
        <div className="quantity-display"><span className="qty-text qty-positive">{formatCurrency(parseFloat(String(purchase.total_cost || 0)))}</span></div>
      </div>
      <div className="purchase-card-info-row">
        <span className="purchase-qty-text">{parseFloat(String(purchase.quantity || 0)).toFixed(2)} {purchase.unit_of_measure || 'units'}</span>
        <span className="purchase-date-text">{purchase.purchase_date ? format(new Date(purchase.purchase_date), 'dd MMM') : ''}</span>
      </div>
    </CompactCardShell>
  );
}

export default function CompactPurchaseCardView({ purchases, onView, onEdit, onReturn }: {
  purchases: Purchase[]; onView: (p: Purchase) => void; onEdit: (p: Purchase) => void; onReturn?: (p: Purchase) => void;
}) {
  if (purchases.length === 0) return (
    <div className="compact-mobile-cards-wrapper"><div className="mobile-empty-state">
      <ShoppingCart className="empty-icon" size={48} /><div className="empty-title">No purchases found</div>
    </div></div>
  );
  return (
    <div className="compact-mobile-cards-wrapper"><div className="compact-mobile-cards-container">
      {purchases.map((p) => <CompactPurchaseCard key={p.id} purchase={p} onView={onView} onEdit={onEdit} onReturn={onReturn} />)}
    </div></div>
  );
}
