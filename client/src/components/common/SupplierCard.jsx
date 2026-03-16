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
          className="item-preview-overlay"
          onClick={() => setShowDetails(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="supplier-preview-title"
        >
          <div
            className="item-preview-container"
            onClick={(e) => e.stopPropagation()}
            ref={cardRef}
          >
            <div className="swipe-indicator"></div>

            <div className="item-preview-header">
              <div className="item-preview-title-section">
                <h2 id="supplier-preview-title" className="item-preview-title">
                  {supplier.supplier_name}
                </h2>
                <span className="item-preview-code">{supplier.supplier_code}</span>
              </div>
              <button
                type="button"
                className="item-preview-close"
                onClick={() => setShowDetails(false)}
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>

            <div className="item-preview-content">
              <div className="item-preview-stats">
                <div className="preview-stat">
                  <span className="preview-stat-label">Status</span>
                  <span className={`preview-stat-value ${supplier.is_active ? 'stock-normal' : 'stock-out-of-stock'}`}>
                    {supplier.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="preview-stat">
                  <span className="preview-stat-label">Payment Terms</span>
                  <span className="preview-stat-value">{supplier.payment_terms || 'Net 30'}</span>
                </div>
              </div>

              <div className="preview-details-grid">
                <div className="preview-detail-item">
                  <span className="preview-detail-label">Supplier Code</span>
                  <span className="preview-detail-value">{supplier.supplier_code}</span>
                </div>
                <div className="preview-detail-item">
                  <span className="preview-detail-label">Contact Person</span>
                  <span className="preview-detail-value">{supplier.contact_person || '—'}</span>
                </div>
                <div className="preview-detail-item">
                  <span className="preview-detail-label">Email</span>
                  <span className="preview-detail-value">{supplier.email || '—'}</span>
                </div>
                <div className="preview-detail-item">
                  <span className="preview-detail-label">Phone</span>
                  <span className="preview-detail-value">{supplier.phone || '—'}</span>
                </div>
                {supplier.address && (
                  <div className="preview-detail-item full-width">
                    <span className="preview-detail-label">Address</span>
                    <span className="preview-detail-value">{supplier.address}</span>
                  </div>
                )}
                {supplier.notes && (
                  <div className="preview-detail-item full-width">
                    <span className="preview-detail-label">Notes</span>
                    <span className="preview-detail-value">{supplier.notes}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="item-preview-actions">
              <button
                type="button"
                className="preview-action-btn edit-btn"
                onClick={handleEdit}
              >
                <Edit size={16} />
                Edit
              </button>
              <button
                type="button"
                className="preview-action-btn delete-btn"
                onClick={handleDelete}
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SupplierCard;
