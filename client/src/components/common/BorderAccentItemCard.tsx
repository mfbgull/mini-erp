import { useState } from 'react';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import './BorderAccentItemCard.css';

interface BorderAccentItemCardProps {
  item: any;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
  showDetails?: boolean;
  onDetailsChange?: (show: boolean) => void;
}

export default function BorderAccentItemCard({ 
  item, 
  onEdit, 
  onDelete, 
  showDetails: externalShowDetails,
  onDetailsChange 
}: BorderAccentItemCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const internalShowDetails = !externalShowDetails ? false : externalShowDetails;
  const isLowStock = item.reorder_level > 0 && item.current_stock <= item.reorder_level;
  const isOutOfStock = parseFloat(item.current_stock || 0) === 0;
  const { formatCurrency } = useSettings();

  const handleCardClick = () => {
    onDetailsChange?.(true);
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(prev => !prev);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    onEdit(item);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    onDelete(item);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
  };

  const handleCloseModal = () => {
    onDetailsChange?.(false);
  };

  const handleEditFromModal = () => {
    onDetailsChange?.(false);
    onEdit(item);
  };

  const handleDeleteFromModal = () => {
    onDetailsChange?.(false);
    onDelete(item);
  };

  return (
    <>
      <div className="item-card" onClick={handleCardClick}>
        <div className="card-top">
          <p className="card-item-name">{item.item_name}</p>
          
          <div className="menu-container" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="menu-trigger-btn"
              onClick={handleMenuToggle}
            >
              <MoreVertical size={16} />
            </button>

            {menuOpen && (
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
        </div>

        <div className="stock-row-divider">
          <p className="stock-label-text">Stock:</p>
          <p className={`stock-value-text ${isOutOfStock ? 'out-of-stock' : isLowStock ? 'low-stock' : ''}`}>
            {parseFloat(item.current_stock || 0).toFixed(2)} {item.unit_of_measure}
          </p>
        </div>
      </div>

      {internalShowDetails && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="hero-stock-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle"></div>
            
            <div className="modal-header">
              <h3 className="modal-title">{item.item_name}</h3>
              <p className="modal-code">{item.item_code}</p>
            </div>
            
            <div className="hero-stock-banner">
              <div className="stock-label">Current Stock</div>
              <div className="stock-value-container">
                <span className="stock-value">{parseFloat(item.current_stock || 0).toFixed(2)}</span>
                <span className="stock-unit">{item.unit_of_measure}</span>
              </div>
            </div>
            
            <div className="modal-content">
              <div className="info-row">
                <span className="info-label">Category</span>
                <span className="info-value">{item.category || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Unit of Measure</span>
                <span className="info-value">{item.unit_of_measure}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Standard Cost</span>
                <span className="info-value">{formatCurrency(item.standard_cost || 0)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Stock Value</span>
                <span className="info-value">{formatCurrency((item.current_stock || 0) * (item.standard_cost || 0))}</span>
              </div>
              
              {item.description && (
                <div className="description-box">
                  <div className="description-label">Description</div>
                  <p className="description-text">{item.description}</p>
                </div>
              )}
              
              <div className="type-badges">
                {(item.is_raw_material === 1 || item.is_raw_material === true) && (
                  <span className="badge raw-badge">Raw Material</span>
                )}
                {(item.is_purchased === 1 || item.is_purchased === true) && (
                  <span className="badge purchased-badge">Purchased</span>
                )}
                {(item.is_finished_good === 1 || item.is_finished_good === true) && (
                  <span className="badge finished-badge">Finished Good</span>
                )}
                {(item.is_manufactured === 1 || item.is_manufactured === true) && (
                  <span className="badge manufactured-badge">Manufactured</span>
                )}
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="action-btn edit-btn" onClick={handleEditFromModal}>
                Edit
              </button>
              <button className="action-btn delete-btn" onClick={handleDeleteFromModal}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
