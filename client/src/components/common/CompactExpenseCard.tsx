import { useState, useEffect } from 'react';

import { MoreVertical, Edit, Trash2, X, Loader2 } from 'lucide-react';

import Card from './Card';
import { useSettings } from '../../context/SettingsContext';
import api from '../../utils/api';
import { handleError } from '../../utils/errors';

import '../../styles/components/card.css';
import './CompactExpenseCard.css';

interface Expense {
  id: number;
  expense_no: string;
  expense_category: string;
  description?: string;
  amount: number;
  expense_date: string;
  payment_method?: string;
  reference_no?: string;
  vendor_name?: string;
  project?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

interface CompactExpenseCardProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: number) => void;
}

function getStatusClass(status: string): string {
  const s = (status || '').toLowerCase();
  if (s === 'paid') return 'expense-status-paid';
  if (s === 'approved') return 'expense-status-approved';
  if (s === 'pending') return 'expense-status-pending';
  return 'expense-status-rejected';
}

export function CompactExpenseCard({ expense, onEdit, onDelete }: CompactExpenseCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [detailedExpense, setDetailedExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { formatCurrency } = useSettings();

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
    return () => document.removeEventListener('keydown', handleEsc);
  }, [showDetails, showMenu]);

  const handleCardClick = async () => {
    if (showMenu) return;
    setIsLoading(true);
    setShowDetails(true);
    try {
      const response = await api.get(`/expenses/${expense.id}`);
      setDetailedExpense(response.data.data ?? response.data);
    } catch (error) {
      handleError(error, 'CompactExpenseCard.handleCardClick');
      setDetailedExpense(expense);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = () => {
    setShowMenu(false);
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

  const displayExp = detailedExpense || expense;

  const formattedDate = displayExp.expense_date
    ? new Date(displayExp.expense_date).toLocaleDateString()
    : '';

  return (
    <>
      <Card variant="compact" hoverable onClick={handleCardClick} className="compact-item-card">
        <Card.Row justify="space-between" align="center" className="card-content-clickable">
          <div className="item-info-section">
            <p className="item-item-name">{displayExp.expense_no}</p>
            <div className="item-meta">
              <span className="item-item-code">{displayExp.expense_category}</span>
              {formattedDate && <span className="item-date">{formattedDate}</span>}
            </div>
          </div>

          <div className="menu-container" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="menu-trigger"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
            >
              <MoreVertical className="menu-icon" />
            </button>

            {showMenu && (
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

          <div className="item-stock-row">
            <div className="quantity-display">
              <span className="qty-text qty-positive">
                {formatCurrency(displayExp.amount || 0)}
              </span>
              <span className={`expense-status-badge ${getStatusClass(displayExp.status)}`}>
                {displayExp.status}
              </span>
            </div>
          </div>
        </Card.Row>
      </Card>

      {showDetails && (
        <div className="item-preview-overlay" onClick={() => setShowDetails(false)}>
          <div
            className="Item-preview-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="swipe-indicator"></div>

            <div className="item-preview-header">
              <div className="item-preview-title-section">
                <h2 className="item-preview-title">{displayExp.expense_no}</h2>
                <span className="item-preview-code">{displayExp.expense_category}</span>
              </div>
              <button className="item-preview-close" onClick={() => setShowDetails(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="item-preview-content">
              {isLoading ? (
                <div className="expense-loading">
                  <Loader2 size={28} className="expense-spinner" />
                  <p>Loading details...</p>
                </div>
              ) : (
                <>
                  <div className="expense-preview-section">
                    <div className="expense-preview-row">
                      <span className="expense-preview-label">Expense No</span>
                      <span className="expense-preview-value">{displayExp.expense_no}</span>
                    </div>
                    <div className="expense-preview-row">
                      <span className="expense-preview-label">Category</span>
                      <span className="expense-preview-value">{displayExp.expense_category}</span>
                    </div>
                    <div className="expense-preview-row">
                      <span className="expense-preview-label">Date</span>
                      <span className="expense-preview-value">
                        {displayExp.expense_date 
                          ? new Date(displayExp.expense_date).toLocaleDateString() 
                          : '-'}
                      </span>
                    </div>
                    <div className="expense-preview-row">
                      <span className="expense-preview-label">Amount</span>
                      <span className="expense-preview-value expense-amount">
                        {formatCurrency(displayExp.amount || 0)}
                      </span>
                    </div>
                    <div className="expense-preview-row">
                      <span className="expense-preview-label">Status</span>
                      <span className={`expense-preview-value ${getStatusClass(displayExp.status)}`}>
                        {displayExp.status}
                      </span>
                    </div>
                    {displayExp.payment_method && (
                      <div className="expense-preview-row">
                        <span className="expense-preview-label">Payment Method</span>
                        <span className="expense-preview-value">{displayExp.payment_method}</span>
                      </div>
                    )}
                    {displayExp.reference_no && (
                      <div className="expense-preview-row">
                        <span className="expense-preview-label">Reference No</span>
                        <span className="expense-preview-value">{displayExp.reference_no}</span>
                      </div>
                    )}
                    {displayExp.vendor_name && (
                      <div className="expense-preview-row">
                        <span className="expense-preview-label">Vendor</span>
                        <span className="expense-preview-value">{displayExp.vendor_name}</span>
                      </div>
                    )}
                    {displayExp.project && (
                      <div className="expense-preview-row">
                        <span className="expense-preview-label">Project</span>
                        <span className="expense-preview-value">{displayExp.project}</span>
                      </div>
                    )}
                  </div>

                  {displayExp.description && (
                    <div className="expense-description-section">
                      <h3 className="expense-description-title">Description</h3>
                      <p className="expense-description-text">{displayExp.description}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="item-preview-footer">
              <button className="preview-action-btn" onClick={handleEdit}>
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

interface CompactExpenseCardViewProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: number) => void;
}

export function CompactExpenseCardView({ expenses, onEdit, onDelete }: CompactExpenseCardViewProps) {
  return (
    <div className="compact-mobile-cards-wrapper">
      <div className="compact-mobile-cards-container">
        {expenses.map((expense) => (
          <CompactExpenseCard
            key={expense.id}
            expense={expense}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

export default CompactExpenseCardView;
