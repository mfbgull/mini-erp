import React, { useState } from 'react';
import { Search } from 'lucide-react';
import './CompactStockByWarehouseCard.css';

interface StockByWarehouse {
  id: number;
  item_id: number;
  item_code: string;
  item_name: string;
  warehouse_id: number;
  warehouse_code: string;
  warehouse_name: string;
  quantity: number;
  unit_of_measure: string;
}

interface CompactStockByWarehouseCardViewProps {
  stockData: StockByWarehouse[];
  onRowClick: (item: StockByWarehouse) => void;
}

export default function CompactStockByWarehouseCardView({
  stockData,
  onRowClick
}: CompactStockByWarehouseCardViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStock = stockData.filter(item =>
    item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.item_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.warehouse_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filteredStock.length === 0) {
    return (
      <div className="compact-mobile-cards-wrapper">
        <div className="compact-mobile-search-container">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search stock..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="compact-mobile-search-input"
          />
        </div>
        <div className="mobile-empty-state">
          <div className="empty-icon">📦</div>
          <div className="empty-title">
            {searchTerm ? 'No matching stock' : 'No stock found'}
          </div>
          <div className="empty-subtitle">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Stock items will appear here'}
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
          placeholder="Search stock..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="compact-mobile-search-input"
        />
      </div>

      <div className="compact-mobile-cards-container">
        {filteredStock.map((item) => {
          const hasMultipleWarehouses = stockData.filter(s => s.item_id === item.item_id).length > 1;

          return (
            <div
              key={`${item.item_id}-${item.warehouse_id}`}
              className="compact-mobile-card stock-card"
              onClick={() => onRowClick(item)}
            >
              <div className="compact-card-content">
                <div className="compact-item-info">
                  <span className="compact-item-name">{item.item_name}</span>
                  <span className="compact-item-code">{item.item_code}</span>
                </div>
                <div className="compact-stock-info">
                  <span className="compact-stock-qty">{parseFloat(String(item.quantity || 0)).toFixed(2)}</span>
                  <span className="compact-stock-unit">{item.unit_of_measure}</span>
                </div>
                {hasMultipleWarehouses && (
                  <span className="compact-multi-badge" title="Available in multiple warehouses">📍</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
