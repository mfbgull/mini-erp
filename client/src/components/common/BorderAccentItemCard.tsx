import { useState } from 'react';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import './BorderAccentItemCard.css';

interface BorderAccentItemCardProps {
  item: any;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
  showDetails?: boolean;
  onDetailsChange?: (show: boolean) => void;
}

export default function BorderAccentItemCard({ 
  item, 
  onEdit, 
  onDelete, 
  showDetails: externalShowDetails,
  onDetailsChange 
}: BorderAccentItemCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isLowStock = item.reorder_level > 0 && item.current_stock <= item.reorder_level;
  const isOutOfStock = parseFloat(item.current_stock || 0) === 0;
  const { formatCurrency } = useSettings();

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
    onEdit(item);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    onDelete(item);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
  };

  return (
    <>
      <div className="item-card" onClick={handleCardClick}>
        <div className="card-top">
          <p className="card-item-name">{item.item_name}</p>
          
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

        <div className="stock-row-divider">
          <p className="stock-label-text">Stock:</p>
          <p className={`stock-value-text ${isOutOfStock ? 'out-of-stock' : isLowStock ? 'low-stock' : ''}`}>
            {parseFloat(item.current_stock || 0).toFixed(2)} {item.unit_of_measure}
          </p>
        </div>
      </div>
    </>
  );
}
