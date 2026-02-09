import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit, X, CheckCircle, Trash2, Loader2 } from 'lucide-react';
import api from '../../utils/api';
import './ProductionCard.css';

interface ProductionInput {
  id: number;
  item_name: string;
  item_code: string;
  quantity: number;
  unit_of_measure: string;
}

interface Production {
  id: number;
  production_no: string;
  production_date: string;
  output_item_name: string;
  output_item_code?: string;
  output_quantity: number;
  output_uom: string;
  finished_goods_warehouse_name: string;
  remarks?: string;
  inputs?: ProductionInput[];
  created_at?: string;
  updated_at?: string;
}

interface ProductionCardProps {
  production: Production;
  onEdit: (production: Production) => void;
  onDelete: (production: Production) => void;
}

export function ProductionCard({ production, onEdit, onDelete }: ProductionCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [detailedProduction, setDetailedProduction] = useState<Production | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

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

  const handleCardClick = async () => {
    if (!showMenu) {
      setIsLoading(true);
      setShowDetails(true);
      try {
        const response = await api.get(`/productions/${production.id}`);
        setDetailedProduction(response.data);
      } catch (error) {
        console.error('Failed to load production details:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(prev => !prev);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onEdit(production);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onDelete(production);
  };

  return (
    <>
      <div
        className="production-card"
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        aria-label={`Production: ${production.production_no}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick();
          }
        }}
      >
        <div className="production-card-content">
          <div className="production-card-info">
            <h3 className="production-card-no">{production.production_no}</h3>
                <span className="production-card-date">
                  {new Date(production.production_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
          </div>

          <div className="production-card-menu" ref={menuRef}>
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
          className="production-modal-overlay"
          onClick={() => setShowDetails(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="production-modal-title"
        >
          <div
            className="production-modal"
            onClick={(e) => e.stopPropagation()}
            ref={cardRef}
          >
            <div className="production-modal-header">
              <div className="production-modal-title-section">
                <h2 id="production-modal-title" className="production-modal-title">
                  {detailedProduction?.production_no || production.production_no}
                </h2>
                <span className="production-modal-date">
                  {new Date(detailedProduction?.production_date || production.production_date).toLocaleDateString()}
                </span>
              </div>
              <button
                type="button"
                className="production-modal-close"
                onClick={() => setShowDetails(false)}
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            </div>

            <div className="production-modal-content">
              {isLoading ? (
                <div className="production-loading-state">
                  <Loader2 size={32} className="production-loading-spinner" />
                  <p>Loading production details...</p>
                </div>
              ) : (
                <>
                  <section className="production-section">
                    <h3 className="production-section-title">Output Product</h3>
                    <div className="production-details-grid">
                      <div className="production-detail-item">
                        <span className="production-detail-label">Item</span>
                        <span className="production-detail-value">{detailedProduction?.output_item_name || production.output_item_name}</span>
                      </div>
                      <div className="production-detail-item">
                        <span className="production-detail-label">Quantity Produced</span>
                        <span className="production-detail-value production-output-qty">
                          {parseFloat(String(detailedProduction?.output_quantity || production.output_quantity)).toFixed(2)} {detailedProduction?.output_uom || production.output_uom}
                        </span>
                      </div>
                      <div className="production-detail-item">
                        <span className="production-detail-label">Warehouse</span>
                        <span className="production-detail-value">{detailedProduction?.finished_goods_warehouse_name || production.finished_goods_warehouse_name}</span>
                      </div>
                    </div>
                  </section>

                  {(detailedProduction?.remarks || production.remarks) && (
                    <section className="production-section">
                      <h3 className="production-section-title">Remarks</h3>
                      <p className="production-remarks">{detailedProduction?.remarks || production.remarks}</p>
                    </section>
                  )}

                  <section className="production-section">
                    <h3 className="production-section-title">
                      Raw Materials Consumed
                      <span className="production-input-count">({(detailedProduction?.inputs || production.inputs)?.length || 0} items)</span>
                    </h3>

                    {(detailedProduction?.inputs || production.inputs)?.length > 0 ? (
                      <div className="production-inputs-list">
                        {(detailedProduction?.inputs || production.inputs).map((input, index) => (
                          <div key={input.id || index} className="production-input-row">
                            <div className="production-input-info">
                              <span className="production-input-name">{input.item_name}</span>
                              <span className="production-input-code">{input.item_code}</span>
                            </div>
                            <span className="production-input-qty">
                              {parseFloat(String(input.quantity)).toFixed(2)} {input.unit_of_measure}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="production-no-inputs">No raw materials recorded</p>
                    )}
                  </section>

                  {((detailedProduction?.created_at || production.created_at) || (detailedProduction?.updated_at || production.updated_at)) && (
                    <section className="production-section production-section-meta">
                      <div className="production-meta-grid">
                        {(detailedProduction?.created_at || production.created_at) && (
                          <div className="production-meta-item">
                            <span className="production-meta-label">Created</span>
                            <span className="production-meta-value">
                              {new Date(detailedProduction?.created_at || production.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {(detailedProduction?.updated_at || production.updated_at) && (
                          <div className="production-meta-item">
                            <span className="production-meta-label">Last Updated</span>
                            <span className="production-meta-value">
                              {new Date(detailedProduction?.updated_at || production.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>

            <div className="production-modal-actions">
              <button
                type="button"
                className="production-action-btn production-action-secondary"
                onClick={() => setShowDetails(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="production-action-btn production-action-primary"
                onClick={() => {
                  setShowDetails(false);
                  onEdit(detailedProduction || production);
                }}
                disabled={isLoading}
              >
                <Edit size={18} />
                Edit Production
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ProductionCard;
