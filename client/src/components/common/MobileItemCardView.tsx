import { Item } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface MobileItemCardViewProps {
  items: Item[];
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
  onRowClick: (item: Item) => void;
}

export default function MobileItemCardView({
  items,
  onEdit,
  onDelete,
  onRowClick
}: MobileItemCardViewProps) {
  if (items.length === 0) {
    return (
      <div className="mobile-empty-state">
        <div className="empty-icon">📦</div>
        <div className="empty-title">No items found</div>
        <div className="empty-subtitle">Create your first item to get started</div>
      </div>
    );
  }

  return (
    <div className="mobile-cards-container">
      {items.map((item) => {
        const isLowStock = item.reorder_level > 0 && item.current_stock <= item.reorder_level;
        const isOutOfStock = item.current_stock === 0;

        return (
          <div
            key={item.id}
            className={`mobile-card ${isLowStock ? 'card-warning' : ''} ${isOutOfStock ? 'card-error' : ''}`}
            onClick={() => onRowClick(item)}
          >
            <div className="card-header">
              <div className="item-info">
                <div className="item-name">{item.item_name}</div>
                <div className="item-code">Code: {item.item_code}</div>
              </div>
              <div className="item-category">
                {item.category && (
                  <span className="category-badge">{item.category}</span>
                )}
              </div>
            </div>

            <div className="card-content">
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">UOM</span>
                  <span className="value">{item.unit_of_measure || 'Nos'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Stock</span>
                  <span className={`value ${isOutOfStock ? 'text-error' : isLowStock ? 'text-warning' : 'text-success'}`}>
                    {item.current_stock || 0}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">Cost</span>
                  <span className="value">{formatCurrency(item.standard_cost || 0)}</span>
                </div>
                <div className="info-item">
                  <span className="label">Price</span>
                  <span className="value">{formatCurrency(item.standard_selling_price || 0)}</span>
                </div>
              </div>

              <div className="item-details">
                {item.description && (
                  <div className="detail-item">
                    <span className="label">Description</span>
                    <span className="value">{item.description}</span>
                  </div>
                )}

                <div className="detail-item">
                  <span className="label">Reorder Level</span>
                  <span className="value">{item.reorder_level || 0}</span>
                </div>

                <div className="type-tags">
                  <span className="type-tag">Item Type:</span>
                  <div className="tag-container">
                    {item.is_raw_material && (
                      <span className="tag raw-material">Raw Material</span>
                    )}
                    {item.is_finished_good && (
                      <span className="tag finished-good">Finished Good</span>
                    )}
                    {item.is_purchased && (
                      <span className="tag purchased">Purchased</span>
                    )}
                    {item.is_manufactured && (
                      <span className="tag manufactured">Manufactured</span>
                    )}
                  </div>
                </div>
              </div>

              {isLowStock && (
                <div className="stock-alert">
                  <span className="alert-icon">⚠️</span>
                  <span className="alert-text">Low stock: below reorder level</span>
                </div>
              )}

              {isOutOfStock && (
                <div className="stock-alert error">
                  <span className="alert-icon">🚫</span>
                  <span className="alert-text">Out of stock</span>
                </div>
              )}
            </div>

            <div className="card-actions">
              <button
                className="action-btn edit-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(item);
                }}
              >
                Edit
              </button>
              <button
                className="action-btn delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default MobileItemCardView;