import { useState } from 'react';

import { X, Package, MapPin, Search, AlertTriangle } from 'lucide-react';

import Card from './Card';
import '../../styles/components/card.css';

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

interface CompactStockByWarehouseCardProps {
  item: StockByWarehouse;
}

export function CompactStockByWarehouseCard({ item }: CompactStockByWarehouseCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const isZeroStock = parseFloat(String(item.quantity || 0)) === 0;

  return (
    <>
      <Card variant="compact" hoverable onClick={() => setShowDetails(true)} className="compact-stock-card">
        <Card.Row justify="space-between" align="center" className="card-content-clickable">
          <div className="stock-info-section">
            <p className="stock-item-name">{item.item_name}</p>
            <div className="stock-meta">
              <span className="stock-item-code">{item.item_code}</span>
            </div>
          </div>

          <div className="stock-row">
            <div className="quantity-display">
              <span className={`qty-text ${isZeroStock ? 'qty-zero' : 'qty-positive'}`}>
                {parseFloat(String(item.quantity || 0)).toFixed(2)}
              </span>
              <span className="unit">{item.unit_of_measure}</span>
            </div>
          </div>
        </Card.Row>

        <div className="stock-card-warehouse-row">
          <MapPin size={12} />
          <span className="warehouse-text">{item.warehouse_name}</span>
        </div>
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
              <div className="preview-details-grid">
                <div className="preview-detail-item">
                  <span className="preview-detail-label">Item</span>
                  <span className="preview-detail-value">{item.item_name}</span>
                </div>
                <div className="preview-detail-item">
                  <span className="preview-detail-label">Code</span>
                  <span className="preview-detail-value">{item.item_code}</span>
                </div>
                <div className="preview-detail-item">
                  <span className="preview-detail-label">Warehouse</span>
                  <span className="preview-detail-value">{item.warehouse_name}</span>
                </div>
                <div className="preview-detail-item">
                  <span className="preview-detail-label">Stock</span>
                  <span className={`preview-detail-value ${isZeroStock ? 'stock-out-of-stock' : 'stock-normal'}`}>
                    {parseFloat(String(item.quantity || 0)).toFixed(2)} {item.unit_of_measure}
                  </span>
                </div>
              </div>

              {isZeroStock && (
                <div className="stock-alert preview-alert">
                  <AlertTriangle className="alert-icon" size={18} />
                  <span className="alert-text">Zero stock</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface CompactStockByWarehouseCardViewProps {
  stockData: StockByWarehouse[];
}

export default function CompactStockByWarehouseCardView({
  stockData
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
          <Package className="empty-icon" size={48} />
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
        {filteredStock.map((item) => (
          <CompactStockByWarehouseCard key={`${item.item_id}-${item.warehouse_id}`} item={item} />
        ))}
      </div>
    </div>
  );
}
