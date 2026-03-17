import { useState, useEffect } from 'react';

import { MoreVertical, Edit, Trash2, X, Loader2 } from 'lucide-react';

import Card from './Card';
import api from '../../utils/api';
import { handleError } from '../../utils/errors';

import '../../styles/components/card.css';
import './CompactProductionCard.css';

interface ProductionInput {
  id: number;
  item_id?: number;
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
  warehouse_name?: string;
  remarks?: string;
  inputs?: ProductionInput[];
  created_at?: string;
  updated_at?: string;
}

interface CompactProductionCardProps {
  production: Production;
  onEdit: (production: Production) => void;
  onDelete: (id: number) => void;
}

export function CompactProductionCard({ production, onEdit, onDelete }: CompactProductionCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [detailedProduction, setDetailedProduction] = useState<Production | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      const response = await api.get(`/productions/${production.id}`);
      setDetailedProduction(response.data);
    } catch (error) {
      handleError(error, 'CompactProductionCard.handleCardClick');
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
    onEdit(production);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onDelete(production.id);
  };

  const displayProd = detailedProduction || production;

  const formattedDate = production.production_date
    ? new Date(production.production_date).toLocaleDateString()
    : '';

  return (
    <>
      <Card variant="compact" hoverable onClick={handleCardClick} className="compact-item-card">
        <Card.Row justify="space-between" align="center" className="card-content-clickable">
          <div className="item-info-section">
            <p className="item-item-name">{displayProd.output_item_name}</p>
            <div className="item-meta">
              <span className="item-item-code">{displayProd.production_no}</span>
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
                {displayProd.output_quantity}
              </span>
              <span className="unit">{displayProd.output_uom}</span>
            </div>
          </div>
        </Card.Row>
      </Card>

      {showDetails && (
        <div className="item-preview-overlay" onClick={() => setShowDetails(false)}>
          <div
            className="item-preview-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="swipe-indicator"></div>

            <div className="item-preview-header">
              <div className="item-preview-title-section">
                <h2 className="item-preview-title">{displayProd.output_item_name}</h2>
                <span className="item-preview-code">{displayProd.production_no}</span>
              </div>
              <button className="item-preview-close" onClick={() => setShowDetails(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="item-preview-content">
              {isLoading ? (
                <div className="production-loading">
                  <Loader2 size={28} className="production-spinner" />
                  <p>Loading details...</p>
                </div>
              ) : (
                <>
                  <div className="production-preview-section">
                    <div className="production-preview-row">
                      <span className="production-preview-label">Production No</span>
                      <span className="production-preview-value">{displayProd.production_no}</span>
                    </div>
                    <div className="production-preview-row">
                      <span className="production-preview-label">Date</span>
                      <span className="production-preview-value">
                        {displayProd.production_date 
                          ? new Date(displayProd.production_date).toLocaleDateString() 
                          : '-'}
                      </span>
                    </div>
                    <div className="production-preview-row">
                      <span className="production-preview-label">Output Item</span>
                      <span className="production-preview-value">
                        {displayProd.output_item_name}
                        {displayProd.output_item_code && ` (${displayProd.output_item_code})`}
                      </span>
                    </div>
                    <div className="production-preview-row">
                      <span className="production-preview-label">Quantity</span>
                      <span className="production-preview-value">
                        {displayProd.output_quantity} {displayProd.output_uom}
                      </span>
                    </div>
                    {displayProd.warehouse_name && (
                      <div className="production-preview-row">
                        <span className="production-preview-label">Warehouse</span>
                        <span className="production-preview-value">{displayProd.warehouse_name}</span>
                      </div>
                    )}
                  </div>

                  {displayProd.inputs && displayProd.inputs.length > 0 && (
                    <div className="production-items-section">
                      <h3 className="production-items-title">Inputs ({displayProd.inputs.length})</h3>
                      <div className="production-items-list">
                        {displayProd.inputs.map((input) => (
                          <div key={input.id} className="production-item-row">
                            <div className="production-item-info">
                              <span className="production-item-name">{input.item_name}</span>
                              <span className="production-item-code">{input.item_code}</span>
                            </div>
                            <div className="production-item-qty">
                              {input.quantity} {input.unit_of_measure}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {displayProd.remarks && (
                    <div className="production-remarks-section">
                      <h3 className="production-remarks-title">Remarks</h3>
                      <p className="production-remarks-text">{displayProd.remarks}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="item-preview-footer">
              <button className="preview-action-btn" onClick={handleEdit}>
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

interface CompactProductionCardViewProps {
  productions: Production[];
  onEdit: (production: Production) => void;
  onDelete: (id: number) => void;
}

export function CompactProductionCardView({ productions, onEdit, onDelete }: CompactProductionCardViewProps) {
  return (
    <div className="compact-mobile-cards-wrapper">
      <div className="compact-mobile-cards-container">
        {productions.map((production) => (
          <CompactProductionCard
            key={production.id}
            production={production}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

export default CompactProductionCardView;
