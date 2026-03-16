import { useState, useRef, useEffect } from 'react';

import { MoreVertical, Edit, X, Trash2, Loader2 } from 'lucide-react';

import api from '../../utils/api';
import './ExpenseCard.css';

interface Expense {
  id: number;
  expense_no: string;
  expense_category: string;
  description: string;
  amount: number;
  expense_date: string;
  payment_method: string;
  reference_no?: string;
  vendor_name?: string;
  project?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

interface ExpenseCardProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: number) => void;
  formatCurrency: (amount: number) => string;
}

export function ExpenseCard({ expense, onEdit, onDelete, formatCurrency }: ExpenseCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [detailedExpense, setDetailedExpense] = useState<Expense | null>(null);
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
        const response = await api.get(`/expenses/${expense.id}`);
        setDetailedExpense(response.data.data);
      } catch (error) {
        console.error('Failed to load expense details:', error);
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
    onEdit(expense);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onDelete(expense.id);
  };

  const getStatusClass = (status: string) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'paid') return 'status-paid';
    if (statusLower === 'approved') return 'status-approved';
    if (statusLower === 'pending') return 'status-pending';
    return 'status-cancelled';
  };

  const displayExpense = detailedExpense || expense;

  return (
    <>
      <div
        className="expense-card"
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        aria-label={`Expense: ${expense.expense_no}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick();
          }
        }}
      >
        <div className="expense-card-content">
          <div className="expense-card-info">
            <h3 className="expense-card-no">{expense.expense_no}</h3>
            <span className="expense-card-category">{expense.expense_category}</span>
          </div>

          <div className="expense-card-amount">
            {formatCurrency(expense.amount)}
          </div>

          <div className="expense-card-menu" ref={menuRef}>
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
          className="expense-modal-overlay"
          onClick={() => setShowDetails(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="expense-modal-title"
        >
          <div
            className="expense-modal"
            onClick={(e) => e.stopPropagation()}
            ref={cardRef}
          >
            <div className="expense-modal-header">
              <div className="expense-modal-title-section">
                <h2 id="expense-modal-title" className="expense-modal-title">
                  {displayExpense.expense_no}
                </h2>
                <span className={`expense-modal-status ${getStatusClass(displayExpense.status)}`}>
                  {displayExpense.status}
                </span>
              </div>
              <button
                type="button"
                className="expense-modal-close"
                onClick={() => setShowDetails(false)}
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            </div>

            <div className="expense-modal-content">
              {isLoading ? (
                <div className="expense-loading-state">
                  <Loader2 size={32} className="expense-loading-spinner" />
                  <p>Loading expense details...</p>
                </div>
              ) : (
                <>
                  <section className="expense-section">
                    <h3 className="expense-section-title">Expense Details</h3>
                    <div className="expense-details-grid">
                      <div className="expense-detail-item">
                        <span className="expense-detail-label">Category</span>
                        <span className="expense-detail-value">{displayExpense.expense_category}</span>
                      </div>
                      <div className="expense-detail-item">
                        <span className="expense-detail-label">Amount</span>
                        <span className="expense-detail-value expense-amount">
                          {formatCurrency(displayExpense.amount)}
                        </span>
                      </div>
                      <div className="expense-detail-item">
                        <span className="expense-detail-label">Date</span>
                        <span className="expense-detail-value">
                          {new Date(displayExpense.expense_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="expense-detail-item">
                        <span className="expense-detail-label">Payment Method</span>
                        <span className="expense-detail-value">{displayExpense.payment_method || '—'}</span>
                      </div>
                    </div>
                  </section>

                  {displayExpense.description && (
                    <section className="expense-section">
                      <h3 className="expense-section-title">Description</h3>
                      <p className="expense-description">{displayExpense.description}</p>
                    </section>
                  )}

                  <section className="expense-section">
                    <h3 className="expense-section-title">Additional Information</h3>
                    <div className="expense-details-grid">
                      <div className="expense-detail-item">
                        <span className="expense-detail-label">Vendor</span>
                        <span className="expense-detail-value">{displayExpense.vendor_name || '—'}</span>
                      </div>
                      <div className="expense-detail-item">
                        <span className="expense-detail-label">Reference No</span>
                        <span className="expense-detail-value">{displayExpense.reference_no || '—'}</span>
                      </div>
                      <div className="expense-detail-item">
                        <span className="expense-detail-label">Project</span>
                        <span className="expense-detail-value">{displayExpense.project || '—'}</span>
                      </div>
                    </div>
                  </section>

                  {(displayExpense.created_at || displayExpense.updated_at) && (
                    <section className="expense-section expense-section-meta">
                      <div className="expense-meta-grid">
                        {displayExpense.created_at && (
                          <div className="expense-meta-item">
                            <span className="expense-meta-label">Created</span>
                            <span className="expense-meta-value">
                              {new Date(displayExpense.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {displayExpense.updated_at && (
                          <div className="expense-meta-item">
                            <span className="expense-meta-label">Last Updated</span>
                            <span className="expense-meta-value">
                              {new Date(displayExpense.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>

            <div className="expense-modal-actions">
              <button
                type="button"
                className="expense-action-btn expense-action-secondary"
                onClick={() => setShowDetails(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="expense-action-btn expense-action-primary"
                onClick={() => {
                  setShowDetails(false);
                  onEdit(displayExpense);
                }}
                disabled={isLoading}
              >
                <Edit size={18} />
                Edit Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ExpenseCard;
