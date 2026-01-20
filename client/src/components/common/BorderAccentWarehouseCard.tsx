import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MoreVertical, Edit, Trash2, Package, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import api from '../../utils/api';
import './BorderAccentWarehouseCard.css';

interface BorderAccentWarehouseCardProps {
  warehouse: any;
  onEdit: (warehouse: any) => void;
  onDelete: (warehouse: any) => void;
  onBack?: () => void;
  showItems?: boolean;
  onShowItemsChange?: (show: boolean) => void;
}

export default function BorderAccentWarehouseCard({ 
  warehouse, 
  onEdit, 
  onDelete,
  onBack,
  showItems: externalShowItems,
  onShowItemsChange
}: BorderAccentWarehouseCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showItems, setShowItems] = useState(externalShowItems || false);
  const internalShowItems = showItems;

  // Fetch items for this warehouse
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['items', warehouse.id],
    queryFn: async () => {
      const response = await api.get('/inventory/items');
      return response.data.data.filter((item: any) => 
        item.warehouse_id == warehouse.id || item.warehouse == warehouse.id
      );
    },
    enabled: internalShowItems
  });

  const handleCardClick = () => {
    if (onShowItemsChange) {
      onShowItemsChange(!externalShowItems);
    } else {
      setShowItems(!showItems);
    }
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

  const handleCloseItems = () => {
    if (onShowItemsChange) {
      onShowItemsChange(false);
    } else {
      setShowItems(false);
    }
  };

  const handleEditFromModal = () => {
    onEdit(warehouse);
  };

  const handleDeleteFromModal = () => {
    onDelete(warehouse);
  };

  const handleViewItemsToggle = () => {
    if (onShowItemsChange) {
      onShowItemsChange(!externalShowItems);
    } else {
      setShowItems(!showItems);
    }
  };

  // Calculate stock value
  const totalStockValue = items.reduce((sum: number, item: any) => 
    sum + (parseFloat(item.current_stock || 0) * parseFloat(item.standard_cost || 0)), 0
  );

  const totalStock = items.reduce((sum: number, item: any) => 
    sum + parseFloat(item.current_stock || 0), 0
  );

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

      {internalShowItems && (
        <div className="warehouse-items-panel">
          {/* Header */}
          <div className="warehouse-items-header">
            <button className="warehouse-items-back-btn" onClick={handleCloseItems}>
              <ArrowLeft size={18} />
              Back to Warehouses
            </button>
            <div className="warehouse-items-title">
              <Package size={20} />
              <span>Items in: <strong>{warehouse.warehouse_name}</strong></span>
            </div>
          </div>

          {/* Stats */}
          <div className="warehouse-items-stats">
            <div className="warehouse-item-stat">
              <span className="stat-number">{items.length}</span>
              <span className="stat-label">Total Items</span>
            </div>
            <div className="warehouse-item-stat">
              <span className="stat-number">{totalStock.toFixed(2)}</span>
              <span className="stat-label">Total Stock</span>
            </div>
            <div className="warehouse-item-stat">
              <span className="stat-number">Rs {totalStockValue.toFixed(2)}</span>
              <span className="stat-label">Stock Value</span>
            </div>
          </div>

          {/* Items List */}
          <div className="warehouse-items-list">
            {itemsLoading ? (
              <div className="warehouse-items-loading">
                <div className="spinner"></div>
                <p>Loading items...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="warehouse-items-empty">
                <Package size={48} />
                <p>No items in this warehouse</p>
              </div>
            ) : (
              items.map((item: any) => (
                <div key={item.id} className="warehouse-item-card">
                  <div className="warehouse-item-info">
                    <span className="warehouse-item-name">{item.item_name}</span>
                    <span className="warehouse-item-code">{item.item_code}</span>
                  </div>
                  <div className="warehouse-item-stock">
                    <span className="stock-number">{parseFloat(item.current_stock || 0).toFixed(2)}</span>
                    <span className="stock-unit">{item.unit_of_measure}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* FAB */}
          <div className="warehouse-items-fab">
            <button className="warehouse-fab-btn">
              + New Item
            </button>
          </div>
        </div>
      )}
    </>
  );
}
