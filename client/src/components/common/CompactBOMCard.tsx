import { useState, useEffect } from 'react';

import { MoreVertical, Edit, Trash2, X, Loader2 } from 'lucide-react';

import Card from './Card';
import { useSettings } from '../../context/SettingsContext';
import api from '../../utils/api';
import { handleError } from '../../utils/errors';

import '../../styles/components/card.css';
import './CompactBOMCard.css';

interface BOMItem {
  id: number;
  item_id?: number;
  item_name: string;
  item_code: string;
  quantity: number;
  unit_of_measure: string;
  standard_cost?: number;
  line_cost?: number;
}

interface BOM {
  id: number;
  bom_no: string;
  bom_name: string;
  finished_item_name: string;
  finished_item_code?: string;
  quantity: number;
  finished_uom: string;
  is_active: boolean | number;
  description?: string;
  item_count?: number;
  total_material_cost?: number;
  items?: BOMItem[];
  created_at?: string;
  updated_at?: string;
}

interface CompactBOMCardProps {
  bom: BOM;
  onEdit: (bom: BOM) => void;
  onToggleStatus: (bom: BOM) => void;
  onDelete: (bom: BOM) => void;
}

export function CompactBOMCard({ bom, onEdit, onToggleStatus, onDelete }: CompactBOMCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [detailedBom, setDetailedBom] = useState<BOM | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { formatCurrency } = useSettings();

  const isActive = bom.is_active === 1 || bom.is_active === true;

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
    setIsLoading(true);
    setShowDetails(true);
    try {
      const response = await api.get(`/boms/${bom.id}`);
      setDetailedBom(response.data);
    } catch (error) {
      handleError(error, 'CompactBOMCard.handleCardClick');
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

  const displayBom = detailedBom || bom;
  const displayActive = displayBom.is_active === 1 || displayBom.is_active === true;

  return (
    <>
      <Card variant="compact" hoverable onClick={handleCardClick} className="compact-item-card">
        <Card.Row justify="space-between" align="center" className="card-content-clickable">
          <div className="item-info-section">
            <p className="item-item-name">{bom.bom_name}</p>
            <div className="item-meta">
              <span className="item-item-code">{bom.bom_no}</span>
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
                  <button type="button" className="dropdown-item" onClick={handleToggleStatus}>
                    <X className="dropdown-icon" />
                    {isActive ? 'Deactivate' : 'Activate'}
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
              <span className={`qty-text ${isActive ? 'qty-positive' : 'qty-zero'}`}>
                {bom.item_count || 0}
              </span>
              <span className="unit">items</span>
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
                <h2 className="item-preview-title">{displayBom.bom_name}</h2>
                <span className="item-preview-code">{displayBom.bom_no}</span>
              </div>
              <button className="item-preview-close" onClick={() => setShowDetails(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="item-preview-content">
              {isLoading ? (
                <div className="bom-compact-loading">
                  <Loader2 size={28} className="bom-compact-spinner" />
                  <p>Loading details...</p>
                </div>
              ) : (
                <>
                  <div className="bom-preview-section">
                    <div className="bom-preview-row">
                      <span className="bom-preview-label">Finished Item</span>
                      <span className="bom-preview-value">
                        {displayBom.finished_item_name}
                        {displayBom.finished_item_code && ` (${displayBom.finished_item_code})`}
                      </span>
                    </div>
                    <div className="bom-preview-row">
                      <span className="bom-preview-label">Quantity</span>
                      <span className="bom-preview-value">
                        {displayBom.quantity} {displayBom.finished_uom}
                      </span>
                    </div>
                    <div className="bom-preview-row">
                      <span className="bom-preview-label">Status</span>
                      <span className={`bom-preview-value ${displayActive ? 'status-active' : 'status-inactive'}`}>
                        {displayActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {displayBom.total_material_cost !== undefined && (
                      <div className="bom-preview-row">
                        <span className="bom-preview-label">Total Cost</span>
                        <span className="bom-preview-value bom-total-cost">
                          {formatCurrency(displayBom.total_material_cost)}
                        </span>
                      </div>
                    )}
                  </div>

                  {displayBom.items && displayBom.items.length > 0 && (
                    <div className="bom-items-section">
                      <h3 className="bom-items-title">Materials ({displayBom.items.length})</h3>
                      <div className="bom-items-list">
                        {displayBom.items.map((item) => (
                          <div key={item.id} className="bom-item-row">
                            <div className="bom-item-info">
                              <span className="bom-item-name">{item.item_name}</span>
                              <span className="bom-item-code">{item.item_code}</span>
                            </div>
                            <div className="bom-item-qty">
                              {item.quantity} {item.unit_of_measure}
                            </div>
                            {item.line_cost !== undefined && (
                              <div className="bom-item-cost">
                                {formatCurrency(item.line_cost)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {displayBom.description && (
                    <div className="bom-description-section">
                      <h3 className="bom-description-title">Description</h3>
                      <p className="bom-description-text">{displayBom.description}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="item-preview-footer">
              <button className="preview-action-btn" onClick={handleEdit}>
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

interface CompactBOMCardViewProps {
  boms: BOM[];
  onEdit: (bom: BOM) => void;
  onToggleStatus: (bom: BOM) => void;
  onDelete: (bom: BOM) => void;
}

export function CompactBOMCardView({ boms, onEdit, onToggleStatus, onDelete }: CompactBOMCardViewProps) {
  return (
    <div className="compact-mobile-cards-wrapper">
      <div className="compact-mobile-cards-container">
        {boms.map((bom) => (
          <CompactBOMCard
            key={bom.id}
            bom={bom}
            onEdit={onEdit}
            onToggleStatus={onToggleStatus}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

export default CompactBOMCardView;
