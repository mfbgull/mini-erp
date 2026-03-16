import { useState } from 'react';

import { MoreVertical, Edit, Trash2, X, Package, AlertTriangle, Ban } from 'lucide-react';

import Card from './Card';
import { useSettings } from '../../context/SettingsContext';
import type { Item } from '../../types/index';
import '../../styles/components/card.css';

interface CompactItemCardProps {
  item: Item;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
}

export function CompactItemCard({ item, onEdit, onDelete }: CompactItemCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { formatCurrency } = useSettings();

  const isLowStock = item.reorder_level > 0 && item.current_stock <= item.reorder_level;
  const isOutOfStock = parseFloat(String(item.current_stock || 0)) === 0;

  const handleCardClick = () => {
    setShowDetails(true);
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(prev => !prev);
  };

  const handleEdit = () => {
    setShowMenu(false);
    onEdit(item);
  };

  const handleDelete = () => {
    setShowMenu(false);
    onDelete(item);
  };

  const handleBackdropClick = () => {
    setShowMenu(false);
  };

  return (
    <>
      <Card variant="compact" hoverable onClick={handleCardClick} className="compact-item-card">
        <Card.Row justify="space-between" align="center" className="card-content-clickable">
          <div className="item-info-section">
            <p className="item-item-name">{item.item_name}</p>
            <div className="item-meta">
              <span className="item-item-code">{item.item_code}</span>
            </div>
          </div>

          <div className="menu-container" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="menu-trigger"
              onClick={handleMenuToggle}
            >
              <MoreVertical className="menu-icon" />
            </button>

            {showMenu && (
              <>
                <div className="menu-backdrop" onClick={handleBackdropClick} />
                <div className="dropdown-menu">
                  <button type="button" className="dropdown-item" onClick={handleEdit}>
                    <Edit className="dropdown-icon" />
                    Edit
                  </button>
                  <button type="button" className="dropdown-item delete" onClick={handleDelete}>
                    <Trash2 className="dropdown-icon" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="item-stock-row">
            <div className="quantity-display">
              <span className={`qty-text ${isOutOfStock ? 'qty-zero' : isLowStock ? 'qty-low' : 'qty-positive'}`}>
                {parseFloat(String(item.current_stock || 0)).toFixed(2)}
              </span>
              <span className="unit">{item.unit_of_measure}</span>
            </div>
          </div>
        </Card.Row>
      </Card>

      {showDetails && (
        <div className="item-preview-overlay" onClick={() => setShowDetails(false)}>
          <div
            className="item-preview-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="swipe-indicator"></div>

            <div className="item-preview-header">
              <div className="item-preview-title-section">
                <h2 className="item-preview-title">{item.item_name}</h2>
                <span className="item-preview-code">{item.item_code}</span>
              </div>
              <button className="item-preview-close" onClick={() => setShowDetails(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="item-preview-content">
              <div className="item-preview-stats">
                <div className="preview-stat">
                  <span className="preview-stat-label">Stock</span>
                  <span className={`preview-stat-value ${isOutOfStock ? 'stock-out-of-stock' : isLowStock ? 'stock-low' : 'stock-normal'}`}>
                    {parseFloat(String(item.current_stock || 0)).toFixed(2)}
                  </span>
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
                {item.category && (
                  <div className="preview-detail-item">
                    <span className="preview-detail-label">Category</span>
                    <span className="preview-detail-value">
                      <span className="category-badge">{item.category}</span>
                    </span>
                  </div>
                )}

                <div className="preview-detail-item">
                  <span className="preview-detail-label">Unit of Measure</span>
                  <span className="preview-detail-value">{item.unit_of_measure || 'Nos'}</span>
                </div>

                <div className="preview-detail-item">
                  <span className="preview-detail-label">Reorder Level</span>
                  <span className="preview-detail-value">{item.reorder_level || 0}</span>
                </div>

                {item.description && (
                  <div className="preview-detail-item full-width">
                    <span className="preview-detail-label">Description</span>
                    <span className="preview-detail-value">{item.description}</span>
                  </div>
                )}

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

              {isLowStock && (
                <div className="stock-alert preview-alert">
                  <AlertTriangle className="alert-icon" size={18} />
                  <span className="alert-text">Low stock: below reorder level</span>
                </div>
              )}

              {isOutOfStock && (
                <div className="stock-alert error preview-alert">
                  <Ban className="alert-icon" size={18} />
                  <span className="alert-text">Out of stock</span>
                </div>
              )}
            </div>

            <div className="item-preview-actions">
              <button className="preview-action-btn edit-btn" onClick={() => {
                setShowDetails(false);
                onEdit(item);
              }}>
                <Edit size={16} />
                Edit
              </button>
              <button className="preview-action-btn delete-btn" onClick={() => {
                setShowDetails(false);
                onDelete(item);
              }}>
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface CompactItemCardViewProps {
  items: Item[];
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
}

export function CompactItemCardView({ items, onEdit, onDelete }: CompactItemCardViewProps) {
  if (items.length === 0) {
    return (
      <div className="compact-mobile-cards-wrapper">
        <div className="mobile-empty-state">
          <Package className="empty-icon" size={48} />
          <div className="empty-title">No items found</div>
          <div className="empty-subtitle">Create your first item to get started</div>
        </div>
      </div>
    );
  }

  return (
    <div className="compact-mobile-cards-wrapper">
      <div className="compact-mobile-cards-container">
        {items.map((item) => (
          <CompactItemCard key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

export default CompactItemCardView;
