import { Edit, Trash2, Package, AlertTriangle, Ban } from 'lucide-react';
import { CompactCardShell } from './CompactCardShell';
import { useSettings } from '../../context/SettingsContext';
import type { Item } from '../../types/index';
import '../../styles/components/card.css';
import './CompactItemCard.css';

interface CompactItemCardProps {
  item: Item;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
}

export function CompactItemCard({ item, onEdit, onDelete }: CompactItemCardProps) {
  const { formatCurrency } = useSettings();
  const isLowStock = item.reorder_level > 0 && item.current_stock <= item.reorder_level;
  const isOutOfStock = parseFloat(String(item.current_stock || 0)) === 0;

  return (
    <CompactCardShell
      className="compact-item-card"
      menuItems={[
        { label: 'Edit', icon: <Edit className="dropdown-icon" />, onClick: () => onEdit(item) },
        { label: 'Delete', icon: <Trash2 className="dropdown-icon" />, onClick: () => onDelete(item), variant: 'danger' },
      ]}
      detailTitle={item.item_name}
      detailContent={
        <>
          <div className="item-preview-stats">
            <div className="preview-stat">
              <span className="preview-stat-label">Stock</span>
              <span className={`preview-stat-value ${isOutOfStock ? 'stock-out-of-stock' : isLowStock ? 'stock-low' : 'stock-normal'}`}>{parseFloat(String(item.current_stock || 0)).toFixed(2)}</span>
            </div>
            <div className="preview-stat">
              <span className="preview-stat-label">Cost</span>
              <span className="preview-stat-value">{formatCurrency(item.standard_cost || 0)}</span>
            </div>
            <div className="preview-stat">
              <span className="preview-stat-label">Price</span>
              <span className="preview-stat-value">{formatCurrency(item.standard_selling_price || 0)}</span>
            </div>
          </div>
          <div className="preview-details-grid">
            {item.category && <div className="preview-detail-item"><span className="preview-detail-label">Category</span><span className="preview-detail-value"><span className="category-badge">{item.category}</span></span></div>}
            <div className="preview-detail-item"><span className="preview-detail-label">Unit</span><span className="preview-detail-value">{item.unit_of_measure || 'Nos'}</span></div>
            <div className="preview-detail-item"><span className="preview-detail-label">Reorder Level</span><span className="preview-detail-value">{item.reorder_level || 0}</span></div>
            {item.description && <div className="preview-detail-item full-width"><span className="preview-detail-label">Description</span><span className="preview-detail-value">{item.description}</span></div>}
            <div className="preview-detail-item full-width">
              <span className="preview-detail-label">Item Type</span>
              <div className="preview-type-tags">
                {item.is_raw_material && <span className="tag raw-material">Raw Material</span>}
                {item.is_finished_good && <span className="tag finished-good">Finished Good</span>}
                {item.is_purchased && <span className="tag purchased">Purchased</span>}
                {item.is_manufactured && <span className="tag manufactured">Manufactured</span>}
              </div>
            </div>
          </div>
          {isLowStock && <div className="stock-alert preview-alert"><AlertTriangle className="alert-icon" size={18} /><span className="alert-text">Low stock: below reorder level</span></div>}
          {isOutOfStock && <div className="stock-alert error preview-alert"><Ban className="alert-icon" size={18} /><span className="alert-text">Out of stock</span></div>}
        </>
      }
    >
      <div className="item-info-section">
        <p className="item-item-name">{item.item_name}</p>
        <div className="item-meta"><span className="item-item-code">{item.item_code}</span></div>
      </div>
      <div className="item-stock-row">
        <div className="quantity-display">
          <span className={`qty-text ${isOutOfStock ? 'qty-zero' : isLowStock ? 'qty-low' : 'qty-positive'}`}>{parseFloat(String(item.current_stock || 0)).toFixed(2)}</span>
          <span className="unit">{item.unit_of_measure}</span>
        </div>
      </div>
    </CompactCardShell>
  );
}

export function CompactItemCardView({ items, onEdit, onDelete }: { items: Item[]; onEdit: (i: Item) => void; onDelete: (i: Item) => void }) {
  if (items.length === 0) return (
    <div className="compact-mobile-cards-wrapper"><div className="mobile-empty-state">
      <Package className="empty-icon" size={48} /><div className="empty-title">No items found</div>
    </div></div>
  );
  return (
    <div className="compact-mobile-cards-wrapper"><div className="compact-mobile-cards-container">
      {items.map((i) => <CompactItemCard key={i.id} item={i} onEdit={onEdit} onDelete={onDelete} />)}
    </div></div>
  );
}

export default CompactItemCardView;
