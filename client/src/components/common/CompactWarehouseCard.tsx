import React, { useState } from 'react';
import { Search, MoreVertical, Edit, Trash2 } from 'lucide-react';
import DropdownMenu from './DropdownMenu';
import './CompactWarehouseCard.css';

interface Warehouse {
  id: number;
  warehouse_code: string;
  warehouse_name: string;
  location?: string;
}

interface CompactWarehouseCardViewProps {
  warehouses: Warehouse[];
  onEdit: (warehouse: Warehouse) => void;
  onDelete: (warehouse: Warehouse) => void;
  onRowClick: (warehouse: Warehouse) => void;
}

export default function CompactWarehouseCardView({
  warehouses,
  onEdit,
  onDelete,
  onRowClick
}: CompactWarehouseCardViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredWarehouses = warehouses.filter(warehouse =>
    warehouse.warehouse_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warehouse.warehouse_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warehouse.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filteredWarehouses.length === 0) {
    return (
      <div className="compact-mobile-cards-wrapper">
        <div className="compact-mobile-search-container">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search warehouses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="compact-mobile-search-input"
          />
        </div>
        <div className="mobile-empty-state">
          <div className="empty-icon">🏭</div>
          <div className="empty-title">
            {searchTerm ? 'No matching warehouses' : 'No warehouses found'}
          </div>
          <div className="empty-subtitle">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Create your first warehouse to get started'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="compact-mobile-cards-wrapper">
      <div className="compact-mobile-search-container">
        <Search className="search-icon" size={18} />
        <input
          type="text"
          placeholder="Search warehouses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="compact-mobile-search-input"
        />
      </div>

      <div className="compact-mobile-cards-container">
        {filteredWarehouses.map((warehouse) => {
          return (
            <div
              key={warehouse.id}
              className="compact-mobile-card warehouse-card"
              onClick={(e) => {
                const target = e.target as HTMLElement;
                const menuButton = target.closest('.compact-menu-trigger');
                if (menuButton) return;
                onRowClick(warehouse);
              }}
            >
              <div className="compact-card-content">
                {/* Left: Warehouse info */}
                <div className="compact-item-info">
                  <p className="compact-item-name">{warehouse.warehouse_name}</p>
                  <p className="compact-item-code">{warehouse.warehouse_code}</p>
                </div>

                {/* Right: Location + menu */}
                <div className="compact-item-right">
                  {/* Location display */}
                  <div className="compact-stock-display">
                    <p className="stock-label">Location</p>
                    <p className="stock-value location-value">
                      {warehouse.location || 'N/A'}
                    </p>
                  </div>

                  {/* Dropdown menu trigger */}
                  <DropdownMenu
                    trigger={
                      <button className="compact-menu-trigger">
                        <MoreVertical className="menu-icon" size={18} />
                      </button>
                    }
                    items={[
                      {
                        label: 'Edit',
                        icon: <Edit size={16} />,
                        onClick: () => {
                          onEdit(warehouse);
                        }
                      },
                      {
                        label: 'Delete',
                        icon: <Trash2 size={16} />,
                        destructive: true,
                        onClick: () => {
                          onDelete(warehouse);
                        }
                      }
                    ] as any}
                    align="end"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}