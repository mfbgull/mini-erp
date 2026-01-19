import React, { useState } from 'react';
import { Search } from 'lucide-react';
import './MobileCardView.css';

interface Item {
  id: number;
  item_name: string;
  item_code: string;
  current_stock: number;
}

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
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = items.filter(item =>
    item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.item_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filteredItems.length === 0) {
    return (
      <div className="mobile-cards-wrapper">
        <div className="mobile-search-container">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mobile-search-input"
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
    <div className="mobile-cards-wrapper">
      <div className="mobile-search-container">
        <Search className="search-icon" size={18} />
        <input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mobile-search-input"
        />
      </div>
      <div className="mobile-cards-container">
        {filteredItems.map((item) => (
        <div
          key={item.id}
          className="mobile-card"
          onClick={() => onRowClick(item)}
        >
          <div className="card-header">
            <div className="item-info">
              <div className="item-name">{item.item_name}</div>
              <div className="item-code">Code: {item.item_code}</div>
            </div>
          </div>

          <div className="card-content">
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Stock</span>
                <span className="value">{item.current_stock}</span>
              </div>
            </div>
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
      ))}
    </div>
    </div>
  );
}