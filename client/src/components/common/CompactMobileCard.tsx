import React, { useState } from 'react';
import { Search, MoreVertical, Edit, Trash2 } from 'lucide-react';
import DropdownMenu from './DropdownMenu';
import './CompactMobileCard.css';

interface Item {
  id: number;
  item_name: string;
  item_code: string;
  current_stock: number;
  standard_selling_price?: number;
  reorder_level?: number;
}

interface CompactMobileCardViewProps {
  items: Item[];
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
  onRowClick: (item: Item) => void;
}

export default function CompactMobileCardView({
  items,
  onEdit,
  onDelete,
  onRowClick
}: CompactMobileCardViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = items.filter(item =>
    item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.item_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockDisplay = (item: Item) => {
    const stock = parseFloat(String(item.current_stock || 0));
    const isLowStock = item.reorder_level && item.reorder_level > 0 && stock <= item.reorder_level;
    const isOutOfStock = stock === 0;

    if (isOutOfStock) return { stock, className: 'stock-out-of-stock' };
    if (isLowStock) return { stock, className: 'stock-low' };
    return { stock, className: 'stock-normal' };
  };

  const handleCardClick = (item: Item, e: React.MouseEvent) => {
    // Check if the click originated from the menu button or its children
    const target = e.target as HTMLElement;
    const menuButton = target.closest('.compact-menu-trigger');
    
    // If click was on the menu button, don't trigger row click
    if (menuButton) {
      return;
    }
    
    // Otherwise, trigger row click
    onRowClick(item);
  };

  if (filteredItems.length === 0) {
    return (
      <div className="compact-mobile-cards-wrapper">
        <div className="compact-mobile-search-container">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="compact-mobile-search-input"
          />
        </div>
        <div className="mobile-empty-state">
          <div className="empty-icon">📦</div>
          <div className="empty-title">
            {searchTerm ? 'No matching items' : 'No items found'}
          </div>
          <div className="empty-subtitle">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Create your first item to get started'}
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
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="compact-mobile-search-input"
        />
      </div>

      <div className="compact-mobile-cards-container">
        {filteredItems.map((item) => {
          const { stock, className: stockClass } = getStockDisplay(item);

          return (
            <div
              key={item.id}
              className="compact-mobile-card"
              onClick={(e) => handleCardClick(item, e)}
            >
              <div className="compact-card-content">
                {/* Left: Item info */}
                <div className="compact-item-info">
                  <p className="compact-item-name">{item.item_name}</p>
                  <p className="compact-item-code">{item.item_code}</p>
                </div>

                {/* Right: Stock + menu */}
                <div className="compact-item-right">
                  {/* Stock display */}
                  <div className="compact-stock-display">
                    <p className="stock-label">Stock</p>
                    <p className={`stock-value ${stockClass}`}>
                      {stock.toFixed(2)}
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
                          onEdit(item);
                        }
                      },
                      {
                        label: 'Delete',
                        icon: <Trash2 size={16} />,
                        destructive: true,
                        onClick: () => {
                          onDelete(item);
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
