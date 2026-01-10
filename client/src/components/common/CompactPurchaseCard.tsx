import React, { useState } from 'react';
import { Search, Eye, Edit2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/formatters';
import './CompactPurchaseCard.css';

interface Purchase {
  id: number;
  purchase_no: string;
  purchase_date: string;
  item_name: string;
  item_code?: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  supplier_name: string;
  warehouse_name: string;
  unit_of_measure?: string;
  invoice_no?: string;
}

interface CompactPurchaseCardViewProps {
  purchases: Purchase[];
  onView: (purchase: Purchase) => void;
  onEdit: (purchase: Purchase) => void;
  onNew: () => void;
}

export default function CompactPurchaseCardView({
  purchases,
  onView,
  onEdit,
  onNew
}: CompactPurchaseCardViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPurchases = purchases.filter(purchase =>
    purchase.purchase_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filteredPurchases.length === 0) {
    return (
      <div className="compact-mobile-cards-wrapper">
        <div className="compact-mobile-search-container">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search purchases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="compact-mobile-search-input"
          />
        </div>
        
        <div className="mobile-empty-state">
          <div className="empty-icon">🛒</div>
          <div className="empty-title">
            {searchTerm ? 'No matching purchases' : 'No purchases found'}
          </div>
          <div className="empty-subtitle">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Record your first purchase to get started'}
          </div>
        </div>
        
        <button className="mobile-fab" onClick={onNew}>
          <Plus size={24} />
        </button>
      </div>
    );
  }

  return (
    <div className="compact-mobile-cards-wrapper">
      <div className="compact-mobile-search-container">
        <Search className="search-icon" size={18} />
        <input
          type="text"
          placeholder="Search purchases..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="compact-mobile-search-input"
        />
      </div>

      <div className="compact-mobile-cards-container">
        {filteredPurchases.map((purchase) => (
          <div
            key={purchase.id}
            className="compact-mobile-card purchase-card"
            onClick={() => onView(purchase)}
          >
            <div className="compact-card-content">
              {/* Left: Purchase info */}
              <div className="compact-item-info">
                <div className="purchase-header">
                  <span className="purchase-no">{purchase.purchase_no}</span>
                  <span className="purchase-date">
                    {purchase.purchase_date ? format(new Date(purchase.purchase_date), 'dd MMM yyyy') : ''}
                  </span>
                </div>
                <p className="compact-item-name">{purchase.item_name}</p>
                <p className="compact-item-code">
                  {purchase.item_code && `${purchase.item_code} • `}
                  {purchase.supplier_name || 'No supplier'}
                </p>
              </div>

              {/* Right: Amounts */}
              <div className="compact-item-right">
                <div className="compact-stock-display">
                  <p className="stock-label">Total Cost</p>
                  <p className="stock-value purchase-value">
                    {formatCurrency(parseFloat(String(purchase.total_cost || 0)))}
                  </p>
                  <p className="stock-balance">
                    {parseFloat(String(purchase.quantity || 0)).toFixed(3)} {purchase.unit_of_measure || 'units'} @ {formatCurrency(parseFloat(String(purchase.unit_cost || 0)))}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions footer */}
            <div className="purchase-actions">
              <button 
                className="purchase-action-btn"
                onClick={(e) => { e.stopPropagation(); onView(purchase); }}
              >
                <Eye size={16} />
                <span>View</span>
              </button>
              <button 
                className="purchase-action-btn"
                onClick={(e) => { e.stopPropagation(); onEdit(purchase); }}
              >
                <Edit2 size={16} />
                <span>Edit</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="mobile-fab" onClick={onNew}>
        <Plus size={24} />
      </button>
    </div>
  );
}
