import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit, X, Trash2, Loader2 } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import './ItemCard.css';

interface Item {
  id: number;
  item_code: string;
  item_name: string;
  description?: string;
  category?: string;
  unit_of_measure: string;
  current_stock: number;
  reorder_level: number;
  standard_cost: number;
  standard_selling_price: number;
  is_raw_material: boolean;
  is_finished_good: boolean;
  is_purchased: boolean;
  is_manufactured: boolean;
  created_at?: string;
  updated_at?: string;
}

interface ItemCardProps {
  item: Item;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
}

export function ItemCard({ item, onEdit, onDelete }: ItemCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const { formatCurrency } = useSettings();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowDetails(false);
        setShowMenu(false);
      }
    };

    if (showDetails || showMenu) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showDetails, showMenu]);

  useEffect(() => {
    if (showDetails && cardRef.current) {
      const focusableElements = cardRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      };

      document.addEventListener('keydown', handleTabKey);
      firstElement?.focus();

      return () => {
        document.removeEventListener('keydown', handleTabKey);
      };
    }
  }, [showDetails]);

  const handleCardClick = () => {
    if (!showMenu) {
      setShowDetails(true);
    }
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(prev => !prev);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    setShowDetails(false);
    onEdit(item);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    setShowDetails(false);
    onDelete(item);
  };

  const isLowStock = item.reorder_level > 0 && item.current_stock <= item.reorder_level;
  const isOutOfStock = item.current_stock === 0;

  return (
    <>
      <div
        className="item-card"
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        aria-label={`Item: ${item.item_name}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick();
          }
        }}
      >
        <div className="item-card-content">
          <div className="item-card-info">
            <h3 className="item-card-name">{item.item_name}</h3>
            <span className={`item-card-stock ${isOutOfStock ? 'out-of-stock' : isLowStock ? 'low-stock' : ''}`}>
              {parseFloat(String(item.current_stock || 0)).toFixed(2)} {item.unit_of_measure}
            </span>
          </div>
          
          <div className="item-card-menu" ref={menuRef}>
            <button
              type="button"
              className="menu-trigger"
              onClick={handleMenuToggle}
              aria-label="More actions"
              aria-haspopup="true"
              aria-expanded={showMenu}
            >
              <MoreVertical size={20} />
            </button>

            {showMenu && (
              <div className="menu-dropdown" role="menu">
                <button
                  type="button"
                  className="menu-item"
                  onClick={handleEdit}
                  role="menuitem"
                >
                  <Edit size={16} />
                  <span>Edit</span>
                </button>
                
                <div className="menu-divider" />
                
                <button
                  type="button"
                  className="menu-item menu-item-destructive"
                  onClick={handleDelete}
                  role="menuitem"
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showDetails && (
        <div
          className="item-modal-overlay"
          onClick={() => setShowDetails(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="item-modal-title"
        >
          <div
            className="item-modal"
            onClick={(e) => e.stopPropagation()}
            ref={cardRef}
          >
            <div className="item-modal-header">
              <div className="item-modal-title-section">
                <h2 id="item-modal-title" className="item-modal-title">
                  {item.item_name}
                </h2>
                <span className="item-modal-code">{item.item_code}</span>
              </div>
              <button
                type="button"
                className="item-modal-close"
                onClick={() => setShowDetails(false)}
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            </div>

            <div className="item-modal-content">
              {isLoading ? (
                <div className="item-loading-state">
                  <Loader2 size={32} className="item-loading-spinner" />
                  <p>Loading item details...</p>
                </div>
              ) : (
                <>
                  <section className="item-section">
                    <h3 className="item-section-title">Basic Information</h3>
                    <div className="item-details-grid">
                      <div className="item-detail-item">
                        <span className="item-detail-label">Item Code</span>
                        <span className="item-detail-value">{item.item_code}</span>
                      </div>
                      <div className="item-detail-item">
                        <span className="item-detail-label">Category</span>
                        <span className="item-detail-value">{item.category || 'N/A'}</span>
                      </div>
                      <div className="item-detail-item">
                        <span className="item-detail-label">Unit of Measure</span>
                        <span className="item-detail-value">{item.unit_of_measure}</span>
                      </div>
                    </div>
                  </section>

                  {item.description && (
                    <section className="item-section">
                      <h3 className="item-section-title">Description</h3>
                      <p className="item-description">{item.description}</p>
                    </section>
                  )}

                  <section className="item-section">
                    <h3 className="item-section-title">Stock Information</h3>
                    <div className="item-details-grid">
                      <div className="item-detail-item">
                        <span className="item-detail-label">Current Stock</span>
                        <span className={`item-detail-value ${isOutOfStock ? 'out-of-stock' : isLowStock ? 'low-stock' : ''}`}>
                          {parseFloat(String(item.current_stock || 0)).toFixed(2)} {item.unit_of_measure}
                        </span>
                      </div>
                      <div className="item-detail-item">
                        <span className="item-detail-label">Reorder Level</span>
                        <span className="item-detail-value">{parseFloat(String(item.reorder_level || 0)).toFixed(2)}</span>
                      </div>
                      <div className="item-detail-item">
                        <span className="item-detail-label">Stock Value</span>
                        <span className="item-detail-value">
                          {formatCurrency((item.current_stock || 0) * (item.standard_cost || 0))}
                        </span>
                      </div>
                    </div>
                    {(isLowStock || isOutOfStock) && (
                      <div className="item-alert">
                        {isOutOfStock ? 'Out of stock' : 'Below reorder level'}
                      </div>
                    )}
                  </section>

                  <section className="item-section">
                    <h3 className="item-section-title">Pricing</h3>
                    <div className="item-details-grid">
                      <div className="item-detail-item">
                        <span className="item-detail-label">Standard Cost</span>
                        <span className="item-detail-value">{formatCurrency(item.standard_cost || 0)}</span>
                      </div>
                      <div className="item-detail-item">
                        <span className="item-detail-label">Selling Price</span>
                        <span className="item-detail-value">{formatCurrency(item.standard_selling_price || 0)}</span>
                      </div>
                    </div>
                  </section>

                  <section className="item-section">
                    <h3 className="item-section-title">Item Type</h3>
                    <div className="item-type-badges">
                      {item.is_raw_material && <span className="item-type-badge raw">Raw Material</span>}
                      {item.is_finished_good && <span className="item-type-badge finished">Finished Good</span>}
                      {item.is_purchased && <span className="item-type-badge purchased">Purchased</span>}
                      {item.is_manufactured && <span className="item-type-badge manufactured">Manufactured</span>}
                    </div>
                  </section>

                  {(item.created_at || item.updated_at) && (
                    <section className="item-section item-section-meta">
                      <div className="item-meta-grid">
                        {item.created_at && (
                          <div className="item-meta-item">
                            <span className="item-meta-label">Created</span>
                            <span className="item-meta-value">
                              {new Date(item.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {item.updated_at && (
                          <div className="item-meta-item">
                            <span className="item-meta-label">Last Updated</span>
                            <span className="item-meta-value">
                              {new Date(item.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>

            <div className="item-modal-actions">
              <button
                type="button"
                className="item-action-btn item-action-secondary"
                onClick={() => setShowDetails(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="item-action-btn item-action-primary"
                onClick={handleEdit}
              >
                <Edit size={18} />
                Edit Item
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ItemCard;
