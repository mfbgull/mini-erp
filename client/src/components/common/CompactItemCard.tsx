import { useState } from 'react';
import { MoreVertical, Edit, Trash2, X } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import './CompactItemCard.css';

interface CompactItemCardProps {
  item: any;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
}

export function CompactItemCard({ item, onEdit, onDelete }: CompactItemCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { formatCurrency } = useSettings();

  console.log('CompactItemCard rendered for:', item.item_name, 'showMenu:', showMenu);

  const isLowStock = item.reorder_level > 0 && item.current_stock <= item.reorder_level;
  const isOutOfStock = parseFloat(item.current_stock || 0) === 0;

  const handleCardClick = () => {
    setShowDetails(true);
  };

  const handleMenuToggle = (e) => {
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
      <div className="compact-item-card">
        {/* Clickable content area */}
        <div className="card-content-clickable" onClick={handleCardClick}>
          <div className="item-info">
            <p className="item-name">{item.item_name}</p>
            <p className="item-code">{item.item_code}</p>
          </div>

          <div className="stock-info">
            <p className="stock-label">Stock</p>
            <p className={`stock-value ${isOutOfStock ? 'out-of-stock' : isLowStock ? 'low-stock' : ''}`}>
              {parseFloat(item.current_stock || 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Menu button - separate from clickable area */}
        <div className="menu-container">
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
              <div className="dropdown-menu" style={{ border: '3px solid blue' }}>
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
      </div>

      {/* Details Modal */}
      {showDetails && (
        <div className="details-modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="details-header">
              <div>
                <h3 className="details-title">{item.item_name}</h3>
                <p className="details-code">{item.item_code}</p>
              </div>
              <button className="close-button" onClick={() => setShowDetails(false)}>
                <X className="close-icon" />
              </button>
            </div>

            <div className="details-content">
              <div className="detail-section">
                <h4 className="section-title">Basic Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Item Code</span>
                    <span className="detail-value">{item.item_code}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Item Name</span>
                    <span className="detail-value">{item.item_name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Category</span>
                    <span className="detail-value">{item.category || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Unit of Measure</span>
                    <span className="detail-value">{item.unit_of_measure}</span>
                  </div>
                </div>
              </div>

              {item.description && (
                <div className="detail-section">
                  <h4 className="section-title">Description</h4>
                  <p className="description-text">{item.description}</p>
                </div>
              )}

              <div className="detail-section">
                <h4 className="section-title">Stock Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Current Stock</span>
                    <span className={`detail-value ${isOutOfStock ? 'out-of-stock' : isLowStock ? 'low-stock' : ''}`}>
                      {parseFloat(item.current_stock || 0).toFixed(2)} {item.unit_of_measure}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Reorder Level</span>
                    <span className="detail-value">{parseFloat(item.reorder_level || 0).toFixed(2)}</span>
                  </div>
                  {isLowStock && (
                    <div className="detail-item alert">
                      <span className="detail-label">⚠️ Alert</span>
                      <span className="detail-value">Below reorder level</span>
                    </div>
                  )}
                  {isOutOfStock && (
                    <div className="detail-item alert">
                      <span className="detail-label">🚫 Alert</span>
                      <span className="detail-value">Out of stock</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h4 className="section-title">Pricing</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Standard Cost</span>
                    <span className="detail-value">{formatCurrency(item.standard_cost || 0)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Selling Price</span>
                    <span className="detail-value">{formatCurrency(item.standard_selling_price || 0)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Stock Value</span>
                    <span className="detail-value">
                      {formatCurrency((item.current_stock || 0) * (item.standard_cost || 0))}
                    </span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4 className="section-title">Item Type</h4>
                <div className="type-badges">
                  {item.is_raw_material && <span className="type-badge raw">Raw Material</span>}
                  {item.is_finished_good && <span className="type-badge finished">Finished Good</span>}
                  {item.is_purchased && <span className="type-badge purchased">Purchased</span>}
                  {item.is_manufactured && <span className="type-badge manufactured">Manufactured</span>}
                </div>
              </div>
            </div>

            <div className="details-actions">
              <button className="action-btn edit-btn" onClick={() => {
                setShowDetails(false);
                onEdit(item);
              }}>
                <Edit className="btn-icon" />
                Edit Item
              </button>
              <button className="action-btn delete-btn" onClick={() => {
                setShowDetails(false);
                onDelete(item);
              }}>
                <Trash2 className="btn-icon" />
                Delete Item
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
