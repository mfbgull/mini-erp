import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Eye, Edit, Trash2, X } from 'lucide-react';
import './SupplierCard.css';

export function SupplierCard({ supplier, onView, onEdit, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const menuRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
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
    const handleEsc = (event) => {
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
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      const handleTabKey = (e) => {
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

  const handleMenuToggle = (e) => {
    e.stopPropagation();
    setShowMenu(prev => !prev);
  };

  const handleView = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    setShowDetails(true);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    setShowDetails(false);
    onEdit(supplier);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    setShowDetails(false);
    onDelete(supplier);
  };

  return (
    <>
      <div
        className="supplier-card"
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        aria-label={`Supplier: ${supplier.supplier_name}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick();
          }
        }}
      >
        <div className="supplier-card-content">
          <div className="supplier-card-info">
            <h3 className="supplier-card-name">{supplier.supplier_name}</h3>
            <span className={`supplier-card-status ${supplier.is_active ? 'active' : 'inactive'}`}>
              {supplier.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="supplier-card-menu" ref={menuRef}>
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
                  onClick={handleView}
                  role="menuitem"
                >
                  <Eye size={16} />
                  <span>View</span>
                </button>

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
          className="supplier-modal-overlay"
          onClick={() => setShowDetails(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="supplier-modal-title"
        >
          <div
            className="supplier-modal"
            onClick={(e) => e.stopPropagation()}
            ref={cardRef}
          >
            <div className="supplier-modal-header">
              <div className="supplier-modal-title-section">
                <h2 id="supplier-modal-title" className="supplier-modal-title">
                  {supplier.supplier_name}
                </h2>
                <span className="supplier-modal-code">{supplier.supplier_code}</span>
              </div>
              <button
                type="button"
                className="supplier-modal-close"
                onClick={() => setShowDetails(false)}
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            </div>

            <div className="supplier-modal-content">
              <section className="supplier-section">
                <h3 className="supplier-section-title">Basic Information</h3>
                <div className="supplier-details-grid">
                  <div className="supplier-detail-item">
                    <span className="supplier-detail-label">Supplier Code</span>
                    <span className="supplier-detail-value">{supplier.supplier_code}</span>
                  </div>
                  <div className="supplier-detail-item">
                    <span className="supplier-detail-label">Status</span>
                    <span className={`supplier-detail-value supplier-status-badge ${supplier.is_active ? 'active' : 'inactive'}`}>
                      {supplier.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="supplier-detail-item">
                    <span className="supplier-detail-label">Payment Terms</span>
                    <span className="supplier-detail-value">{supplier.payment_terms || 'Net 30'}</span>
                  </div>
                </div>
              </section>

              <section className="supplier-section">
                <h3 className="supplier-section-title">Contact Information</h3>
                <div className="supplier-details-grid">
                  <div className="supplier-detail-item">
                    <span className="supplier-detail-label">Contact Person</span>
                    <span className="supplier-detail-value">{supplier.contact_person || 'N/A'}</span>
                  </div>
                  <div className="supplier-detail-item">
                    <span className="supplier-detail-label">Email</span>
                    <span className="supplier-detail-value">{supplier.email || 'N/A'}</span>
                  </div>
                  <div className="supplier-detail-item">
                    <span className="supplier-detail-label">Phone</span>
                    <span className="supplier-detail-value">{supplier.phone || 'N/A'}</span>
                  </div>
                </div>
              </section>

              {supplier.address && (
                <section className="supplier-section">
                  <h3 className="supplier-section-title">Address</h3>
                  <p className="supplier-address">{supplier.address}</p>
                </section>
              )}

              {supplier.notes && (
                <section className="supplier-section">
                  <h3 className="supplier-section-title">Notes</h3>
                  <p className="supplier-notes">{supplier.notes}</p>
                </section>
              )}

              {(supplier.created_at || supplier.updated_at) && (
                <section className="supplier-section supplier-section-meta">
                  <div className="supplier-meta-grid">
                    {supplier.created_at && (
                      <div className="supplier-meta-item">
                        <span className="supplier-meta-label">Created</span>
                        <span className="supplier-meta-value">
                          {new Date(supplier.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {supplier.updated_at && (
                      <div className="supplier-meta-item">
                        <span className="supplier-meta-label">Last Updated</span>
                        <span className="supplier-meta-value">
                          {new Date(supplier.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>

            <div className="supplier-modal-actions">
              <button
                type="button"
                className="supplier-action-btn supplier-action-secondary"
                onClick={() => setShowDetails(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="supplier-action-btn supplier-action-primary"
                onClick={handleEdit}
              >
                <Edit size={18} />
                Edit Supplier
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SupplierCard;
