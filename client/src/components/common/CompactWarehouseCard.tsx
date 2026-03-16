import { useState } from 'react';

import { MoreVertical, Edit, Trash2, X } from 'lucide-react';

import Card from './Card';
import type { Warehouse as WarehouseType } from '../../types';
import '../../styles/components/card.css';

interface CompactWarehouseCardProps {
  warehouse: WarehouseType;
  onEdit: (warehouse: WarehouseType) => void;
  onDelete: (warehouse: WarehouseType) => void;
}

export function CompactWarehouseCard({ warehouse, onEdit, onDelete }: CompactWarehouseCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

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
    onEdit(warehouse);
  };

  const handleDelete = () => {
    setShowMenu(false);
    onDelete(warehouse);
  };

  const handleBackdropClick = () => {
    setShowMenu(false);
  };

  return (
    <>
      <Card variant="compact" hoverable onClick={handleCardClick} className="compact-item-card">
        <Card.Row justify="space-between" align="center" className="card-content-clickable">
          <div className="item-info-section">
            <p className="item-item-name">{warehouse.warehouse_name}</p>
            <div className="item-meta">
              <span className="item-item-code">{warehouse.warehouse_code}</span>
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
              <span className={`qty-text ${warehouse.is_active ? 'qty-positive' : 'qty-zero'}`}>
                {warehouse.is_active ? 'Active' : 'Inactive'}
              </span>
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
                <h2 className="item-preview-title">{warehouse.warehouse_name}</h2>
                <span className="item-preview-code">{warehouse.warehouse_code}</span>
              </div>
              <button className="item-preview-close" onClick={() => setShowDetails(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="item-preview-content">
              <div className="item-preview-stats">
                <div className="preview-stat">
                  <span className="preview-stat-label">Code</span>
                  <span className="preview-stat-value">{warehouse.warehouse_code}</span>
                </div>
                <div className="preview-stat">
                  <span className="preview-stat-label">Status</span>
                  <span className={`preview-stat-value ${warehouse.is_active ? 'stock-normal' : 'stock-out-of-stock'}`}>
                    {warehouse.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="preview-details-grid">
                <div className="preview-detail-item">
                  <span className="preview-detail-label">Warehouse Code</span>
                  <span className="preview-detail-value">{warehouse.warehouse_code}</span>
                </div>
                <div className="preview-detail-item">
                  <span className="preview-detail-label">Warehouse Name</span>
                  <span className="preview-detail-value">{warehouse.warehouse_name}</span>
                </div>
                {warehouse.location && (
                  <div className="preview-detail-item full-width">
                    <span className="preview-detail-label">Location</span>
                    <span className="preview-detail-value">{warehouse.location}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="item-preview-actions">
              <button className="preview-action-btn edit-btn" onClick={() => {
                setShowDetails(false);
                onEdit(warehouse);
              }}>
                <Edit size={16} />
                Edit
              </button>
              <button className="preview-action-btn delete-btn" onClick={() => {
                setShowDetails(false);
                onDelete(warehouse);
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
