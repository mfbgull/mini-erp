import { useState } from 'react';
import { MoreVertical, Edit, Trash2, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './BorderAccentWarehouseCard.css';

interface BorderAccentWarehouseCardProps {
  warehouse: any;
  onEdit: (warehouse: any) => void;
  onDelete: (warehouse: any) => void;
  showDetails?: boolean;
  onDetailsChange?: (show: boolean) => void;
}

export default function BorderAccentWarehouseCard({ 
  warehouse, 
  onEdit, 
  onDelete, 
  showDetails: externalShowDetails,
  onDetailsChange 
}: BorderAccentWarehouseCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const internalShowDetails = !externalShowDetails ? false : externalShowDetails;
  const navigate = useNavigate();

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
    onEdit(warehouse);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    onDelete(warehouse);
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
    onEdit(warehouse);
  };

  const handleDeleteFromModal = () => {
    onDetailsChange?.(false);
    onDelete(warehouse);
  };

  const handleViewItems = () => {
    onDetailsChange?.(false);
    navigate(`/inventory/items?warehouse=${warehouse.id}`);
  };

  return (
    <>
      <div className="warehouse-card" onClick={handleCardClick}>
        <div className="card-top">
          <p className="card-warehouse-name">{warehouse.warehouse_name}</p>
          
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

        <div className="warehouse-row-divider">
          <p className="warehouse-code-text">{warehouse.warehouse_code}</p>
          <p className="warehouse-location-text">{warehouse.location || 'No location'}</p>
        </div>
      </div>

      {internalShowDetails && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="hero-stock-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle"></div>
            
            <div className="modal-header">
              <h3 className="modal-title">{warehouse.warehouse_name}</h3>
              <p className="modal-code">{warehouse.warehouse_code}</p>
            </div>
            
            <div className="hero-stock-banner warehouse-banner">
              <div className="stock-label">Location</div>
              <div className="stock-value-container">
                <span className="stock-value">{warehouse.location || 'N/A'}</span>
              </div>
            </div>
            
            <div className="modal-content">
              <div className="info-row">
                <span className="info-label">Warehouse Code</span>
                <span className="info-value">{warehouse.warehouse_code}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Warehouse Name</span>
                <span className="info-value">{warehouse.warehouse_name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Location</span>
                <span className="info-value">{warehouse.location || 'Not specified'}</span>
              </div>
              
              {warehouse.description && (
                <div className="description-box">
                  <div className="description-label">Description</div>
                  <p className="description-text">{warehouse.description}</p>
                </div>
              )}
            </div>
            
            <div className="modal-actions">
              <button className="action-btn view-items-btn" onClick={handleViewItems}>
                <Package size={18} />
                View Items
              </button>
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
