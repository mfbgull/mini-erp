import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { format } from 'date-fns';
import './CompactStockMovementCard.css';

interface StockMovement {
  id: number;
  movement_no: string;
  movement_date: string;
  item_code: string;
  item_name: string;
  warehouse_name: string;
  movement_type: string;
  quantity: number;
  unit_of_measure: string;
  remarks?: string;
}

interface CompactStockMovementCardViewProps {
  movements: StockMovement[];
  onRowClick: (movement: StockMovement) => void;
}

export default function CompactStockMovementCardView({
  movements,
  onRowClick
}: CompactStockMovementCardViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMovements = movements.filter(movement =>
    movement.movement_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    movement.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    movement.item_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    movement.movement_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'PURCHASE': return 'type-purchase';
      case 'SALE': return 'type-sale';
      case 'PRODUCTION': return 'type-production';
      case 'TRANSFER': return 'type-transfer';
      case 'ADJUSTMENT': return 'type-adjustment';
      default: return 'type-default';
    }
  };

  const getMovementTypeIcon = (type: string) => {
    switch (type) {
      case 'PURCHASE': return '📥';
      case 'SALE': return '📤';
      case 'PRODUCTION': return '🏭';
      case 'TRANSFER': return '🔄';
      case 'ADJUSTMENT': return '⚙️';
      default: return '📋';
    }
  };

  if (filteredMovements.length === 0) {
    return (
      <div className="compact-mobile-cards-wrapper">
        <div className="compact-mobile-search-container">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search movements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="compact-mobile-search-input"
          />
        </div>
        <div className="mobile-empty-state">
          <div className="empty-icon">📋</div>
          <div className="empty-title">
            {searchTerm ? 'No matching movements' : 'No movements found'}
          </div>
          <div className="empty-subtitle">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Stock movements will appear here'}
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
          placeholder="Search movements..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="compact-mobile-search-input"
        />
      </div>

      <div className="compact-mobile-cards-container">
        {filteredMovements.map((movement) => {
          const isIn = movement.quantity >= 0;
          
          return (
            <div
              key={movement.id}
              className="compact-mobile-card movement-card"
              onClick={() => onRowClick(movement)}
            >
              <div className="compact-card-content">
                {/* Left: Movement info */}
                <div className="compact-item-info">
                  <div className="movement-header">
                    <span className={`movement-type-badge ${getMovementTypeColor(movement.movement_type)}`}>
                      <span className="movement-icon">{getMovementTypeIcon(movement.movement_type)}</span>
                      {movement.movement_type}
                    </span>
                    <span className="movement-date">
                      {format(new Date(movement.movement_date), 'dd MMM yyyy')}
                    </span>
                  </div>
                  <p className="compact-item-name">{movement.item_name}</p>
                  <p className="compact-item-code">{movement.item_code}</p>
                </div>

                {/* Right: Quantity + Warehouse */}
                <div className="compact-item-right">
                  <div className="compact-stock-display">
                    <p className="stock-label">{isIn ? 'IN' : 'OUT'}</p>
                    <p className={`stock-value ${isIn ? 'stock-normal' : 'stock-out-of-stock'}`}>
                      {isIn ? '+' : ''}{Math.abs(parseFloat(String(movement.quantity || 0))).toFixed(2)}
                    </p>
                    <p className="stock-unit">{movement.unit_of_measure}</p>
                  </div>

                  <div className="movement-warehouse">
                    <span className="warehouse-label">Warehouse</span>
                    <span className="warehouse-value">{movement.warehouse_name}</span>
                  </div>
                </div>
              </div>

              {/* Movement No footer */}
              <div className="movement-footer">
                <span className="movement-no">#{movement.movement_no}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}