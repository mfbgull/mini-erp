import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit, X, Power, Trash2, Loader2 } from 'lucide-react';
import api from '../../utils/api';
import './BOMCard.css';

interface BOMItem {
  id: number;
  item_name: string;
  item_code: string;
  quantity: number;
  unit_of_measure: string;
}

interface BOM {
  id: number;
  bom_no: string;
  bom_name: string;
  finished_item_name: string;
  finished_item_code?: string;
  quantity: number;
  finished_uom: string;
  is_active: boolean;
  description?: string;
  items?: BOMItem[];
  created_at?: string;
  updated_at?: string;
}

interface BOMCardProps {
  bom: BOM;
  onEdit: (bom: BOM) => void;
  onToggleStatus: (bom: BOM) => void;
  onDelete: (bom: BOM) => void;
}

export function BOMCard({ bom, onEdit, onToggleStatus, onDelete }: BOMCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [detailedBom, setDetailedBom] = useState<BOM | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
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

  // Handle ESC key for modal
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

  // Trap focus in modal when open
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
        const response = await api.get(`/boms/${bom.id}`);
        setDetailedBom(response.data);
      } catch (error) {
        console.error('Failed to load BOM details:', error);
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
    onEdit(bom);
  };

  const handleToggleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onToggleStatus(bom);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onDelete(bom);
  };

  return (
    <>
      {/* BOM Card */}
      <div
        className="bom-card"
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        aria-label={`BOM: ${bom.bom_name}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick();
          }
        }}
      >
        <div className="bom-card-content">
          <h3 className="bom-card-name">{bom.bom_name}</h3>
          
          {/* Three-dot menu */}
          <div className="bom-card-menu" ref={menuRef}>
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
                
                <button
                  type="button"
                  className="menu-item menu-item-secondary"
                  onClick={handleToggleStatus}
                  role="menuitem"
                >
                  <Power size={16} />
                  <span>{bom.is_active ? 'Deactivate' : 'Activate'}</span>
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

      {/* Details Modal */}
      {showDetails && (
        <div
          className="bom-modal-overlay"
          onClick={() => setShowDetails(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="bom-modal-title"
        >
          <div
            className="bom-modal"
            onClick={(e) => e.stopPropagation()}
            ref={cardRef}
          >
            {/* Modal Header */}
            <div className="bom-modal-header">
              <div className="bom-modal-title-section">
                <h2 id="bom-modal-title" className="bom-modal-title">
                  {detailedBom?.bom_name || bom.bom_name}
                </h2>
                <span className={`bom-status-badge ${(detailedBom?.is_active ?? bom.is_active) ? 'active' : 'inactive'}`}>
                  {(detailedBom?.is_active ?? bom.is_active) ? 'Active' : 'Inactive'}
                </span>
              </div>
              <button
                type="button"
                className="bom-modal-close"
                onClick={() => setShowDetails(false)}
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="bom-modal-content">
              {isLoading ? (
                <div className="bom-loading-state">
                  <Loader2 size={32} className="bom-loading-spinner" />
                  <p>Loading BOM details...</p>
                </div>
              ) : (
                <>
                  {/* Basic Info Section */}
                  <section className="bom-section">
                    <h3 className="bom-section-title">Basic Information</h3>
                    <div className="bom-details-grid">
                      <div className="bom-detail-item">
                        <span className="bom-detail-label">BOM Number</span>
                        <span className="bom-detail-value">{detailedBom?.bom_no || bom.bom_no}</span>
                      </div>
                      <div className="bom-detail-item">
                        <span className="bom-detail-label">Finished Item</span>
                        <span className="bom-detail-value">{detailedBom?.finished_item_name || bom.finished_item_name}</span>
                      </div>
                      <div className="bom-detail-item">
                        <span className="bom-detail-label">Output Quantity</span>
                        <span className="bom-detail-value">{detailedBom?.quantity || bom.quantity} {detailedBom?.finished_uom || bom.finished_uom}</span>
                      </div>
                    </div>
                  </section>

                  {/* Description Section */}
                  {(detailedBom?.description || bom.description) && (
                    <section className="bom-section">
                      <h3 className="bom-section-title">Description</h3>
                      <p className="bom-description">{detailedBom?.description || bom.description}</p>
                    </section>
                  )}

                  {/* Raw Materials Section */}
                  <section className="bom-section">
                    <h3 className="bom-section-title">
                      Raw Materials
                      <span className="bom-item-count">({(detailedBom?.items || bom.items)?.length || 0} items)</span>
                    </h3>

                    {(detailedBom?.items || bom.items)?.length > 0 ? (
                      <div className="bom-items-list">
                        {(detailedBom?.items || bom.items).map((item, index) => (
                          <div key={item.id || index} className="bom-item-row">
                            <div className="bom-item-info">
                              <span className="bom-item-name">{item.item_name}</span>
                              <span className="bom-item-code">{item.item_code}</span>
                            </div>
                            <span className="bom-item-qty">
                              {item.quantity} {item.unit_of_measure}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="bom-no-items">No raw materials defined</p>
                    )}
                  </section>

                  {/* Metadata Section */}
                  {((detailedBom?.created_at || bom.created_at) || (detailedBom?.updated_at || bom.updated_at)) && (
                    <section className="bom-section bom-section-meta">
                      <div className="bom-meta-grid">
                        {(detailedBom?.created_at || bom.created_at) && (
                          <div className="bom-meta-item">
                            <span className="bom-meta-label">Created</span>
                            <span className="bom-meta-value">
                              {new Date(detailedBom?.created_at || bom.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {(detailedBom?.updated_at || bom.updated_at) && (
                          <div className="bom-meta-item">
                            <span className="bom-meta-label">Last Updated</span>
                            <span className="bom-meta-value">
                              {new Date(detailedBom?.updated_at || bom.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>

            {/* Modal Actions */}
            <div className="bom-modal-actions">
              <button
                type="button"
                className="bom-action-btn bom-action-secondary"
                onClick={() => setShowDetails(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="bom-action-btn bom-action-primary"
                onClick={async () => {
                  setShowDetails(false);
                  const bomToEdit = detailedBom || bom;
                  if (bomToEdit && bomToEdit.id) {
                    await onEdit(bomToEdit);
                  }
                }}
              >
                <Edit size={18} />
                Edit BOM
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default BOMCard;
