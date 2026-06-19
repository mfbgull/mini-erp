import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { MoreVertical, Eye, Edit, Trash2, X, FileCheck, PackageCheck } from 'lucide-react';

import type { PurchaseOrder, PurchaseOrderItem } from '../../utils/purchaseOrderTypes';
import { useSettings } from '../../context/SettingsContext';
import api from '../../utils/api';
import './PurchaseOrderCard.css';

interface PurchaseOrderCardProps {
  po: PurchaseOrder & { items?: PurchaseOrderItem[] };
}

interface StatusMutationParams {
  id: number;
  status: string;
}

export function PurchaseOrderCard({ po }: PurchaseOrderCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { formatCurrency } = useSettings();

  const statusMutation = useMutation<void, Error, StatusMutationParams>({
    mutationFn: async ({ id, status }) => {
      await api.post(`/purchase-orders/${id}/status`, { status });
    },
    onSuccess: () => {
      toast.success('Status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      setShowMenu(false);
    },
    onError: (error: Error) => {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Failed to update status');
    }
  });

  const deleteMutation = useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await api.delete(`/purchase-orders/${id}`);
    },
    onSuccess: () => {
      toast.success('Purchase order deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      setShowMenu(false);
    },
    onError: (error: Error) => {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Failed to delete purchase order');
    }
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setShowDetails(false); setShowMenu(false); }
    };
    if (showDetails || showMenu) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [showDetails, showMenu]);

  const handleCardClick = () => { if (!showMenu) setShowDetails(true); };

  const handleMenuToggle = (e: React.MouseEvent) => { e.stopPropagation(); setShowMenu(prev => !prev); };

  const handleView = (e: React.MouseEvent) => { e.stopPropagation(); setShowMenu(false); setShowDetails(true); };

  const handleEdit = (e: React.MouseEvent) => { e.stopPropagation(); setShowMenu(false); setShowDetails(false); navigate(`/purchase-orders/${po.id}/edit`); };

  const handleStatusUpdate = (newStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const messages: Record<string, string> = {
      'Submitted': 'Submit this purchase order? This will create an AP liability.',
      'Partially Received': 'Mark as Partially Received?',
      'Completed': 'Mark as Completed? All items should be received.',
      'Cancelled': 'Cancel this purchase order? This action cannot be undone.'
    };
    if (window.confirm(messages[newStatus] || `Change status to ${newStatus}?`)) {
      statusMutation.mutate({ id: po.id, status: newStatus });
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete PO "${po.po_no}"? This action cannot be undone.`)) {
      deleteMutation.mutate(po.id);
    }
  };

  const canEdit = po.status === 'Draft';
  const canSubmit = po.status === 'Draft';
  const canReceive = ['Submitted', 'Partially Received'].includes(po.status);
  const canCancel = ['Draft', 'Submitted', 'Partially Received'].includes(po.status);
  const canDelete = ['Draft', 'Submitted', 'Partially Received'].includes(po.status);
  const isLoading = statusMutation.isPending || deleteMutation.isPending;

  const getStatusClass = (status: string) => {
    const statusClasses: Record<string, string> = {
      'Draft': 'draft', 'Submitted': 'submitted', 'Partially Received': 'partial', 'Completed': 'completed', 'Cancelled': 'cancelled'
    };
    return statusClasses[status] || 'draft';
  };

  return (
    <>
      <div className="po-card" onClick={handleCardClick} role="button" tabIndex={0} aria-label={`Purchase Order: ${po.po_no}`}
        onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(); } }}>
        <div className="po-card-content">
          <div className="po-card-info">
            <h3 className="po-card-name">{po.po_no}</h3>
            <span className="po-card-supplier">{po.supplier_name}</span>
            <span className={`po-card-status ${getStatusClass(po.status)}`}>{po.status}</span>
          </div>
          <div className="po-card-menu" ref={menuRef}>
            <button type="button" className="menu-trigger" onClick={handleMenuToggle} aria-label="More actions" aria-haspopup="true" aria-expanded={showMenu}>
              <MoreVertical size={20} />
            </button>
            {showMenu && (
              <div className="menu-dropdown" role="menu">
                <button type="button" className="menu-item" onClick={handleView} role="menuitem"><Eye size={16} /><span>View</span></button>
                {canEdit && <button type="button" className="menu-item" onClick={handleEdit} role="menuitem"><Edit size={16} /><span>Edit</span></button>}
                {canSubmit && <button type="button" className="menu-item" onClick={(e) => handleStatusUpdate('Submitted', e)} role="menuitem" disabled={isLoading}><FileCheck size={16} /><span>Submit</span></button>}
                {canReceive && <button type="button" className="menu-item" onClick={(e) => { e.stopPropagation(); setShowMenu(false); navigate(`/purchase-orders/${po.id}`); }} role="menuitem"><PackageCheck size={16} /><span>Receive Items</span></button>}
                {canCancel && <button type="button" className="menu-item" onClick={(e) => handleStatusUpdate('Cancelled', e)} role="menuitem" disabled={isLoading}><X size={16} /><span>Cancel</span></button>}
                {canDelete && <><div className="menu-divider" /><button type="button" className="menu-item menu-item-destructive" onClick={handleDelete} role="menuitem" disabled={isLoading}><Trash2 size={16} /><span>Delete</span></button></>}
              </div>
            )}
          </div>
        </div>
      </div>
      {showDetails && (
        <div className="po-modal-overlay" onClick={() => setShowDetails(false)} role="dialog" aria-modal="true" aria-labelledby="po-modal-title">
          <div className="po-modal" onClick={(e: React.MouseEvent) => e.stopPropagation()} ref={cardRef}>
            <div className="po-modal-header">
              <div className="po-modal-title-section">
                <h2 id="po-modal-title" className="po-modal-title">{po.po_no}</h2>
                <span className={`po-modal-status ${getStatusClass(po.status)}`}>{po.status}</span>
              </div>
              <button type="button" className="po-modal-close" onClick={() => setShowDetails(false)} aria-label="Close modal"><X size={24} /></button>
            </div>
            <div className="po-modal-content">
              <section className="po-section">
                <h3 className="po-section-title">Order Information</h3>
                <div className="po-details-grid">
                  <div className="po-detail-item"><span className="po-detail-label">Date</span><span className="po-detail-value">{format(new Date(po.po_date), 'dd MMM yyyy')}</span></div>
                  {po.expected_delivery_date && <div className="po-detail-item"><span className="po-detail-label">Expected Delivery</span><span className="po-detail-value">{format(new Date(po.expected_delivery_date), 'dd MMM yyyy')}</span></div>}
                  <div className="po-detail-item"><span className="po-detail-label">Supplier</span><span className="po-detail-value">{po.supplier_name}</span></div>
                  {po.warehouse_name && <div className="po-detail-item"><span className="po-detail-label">Warehouse</span><span className="po-detail-value">{po.warehouse_name}</span></div>}
                  {po.created_by_username && <div className="po-detail-item"><span className="po-detail-label">Created By</span><span className="po-detail-value">{po.created_by_username}</span></div>}
                  <div className="po-detail-item"><span className="po-detail-label">Total Amount</span><span className="po-detail-value po-total-amount">{formatCurrency(parseFloat(String(po.total_amount)))}</span></div>
                </div>
              </section>
              {po.items && po.items.length > 0 && (
                <section className="po-section">
                  <h3 className="po-section-title">Items ({po.items.length})</h3>
                  <div className="po-items-list">
                    {po.items.map((item: PurchaseOrderItem) => {
                      const pending = (item.quantity || 0) - (item.received_quantity || 0);
                      return (
                        <div key={item.id} className="po-item-preview">
                          <div className="po-item-preview-header">
                            <span className="po-item-preview-name">{item.item_code} - {item.item_name}</span>
                            <span className="po-item-preview-total">{formatCurrency((item.quantity || 0) * (item.unit_price || 0))}</span>
                          </div>
                          <div className="po-item-preview-details">
                            <div className="po-item-preview-row"><span>Ordered</span><span>{item.quantity} {item.unit_of_measure}</span></div>
                            <div className="po-item-preview-row"><span>Received</span><span>{item.received_quantity || 0} {item.unit_of_measure}</span></div>
                            <div className="po-item-preview-row"><span>Pending</span><span>{pending} {item.unit_of_measure}</span></div>
                            <div className="po-item-preview-row"><span>Unit Price</span><span>{formatCurrency(item.unit_price)}</span></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
              {po.notes && <section className="po-section"><h3 className="po-section-title">Notes</h3><p className="po-notes">{po.notes}</p></section>}
              {(po.created_at || po.updated_at) && (
                <section className="po-section po-section-meta">
                  <div className="po-meta-grid">
                    {po.created_at && <div className="po-meta-item"><span className="po-meta-label">Created</span><span className="po-meta-value">{new Date(po.created_at).toLocaleDateString()}</span></div>}
                    {po.updated_at && <div className="po-meta-item"><span className="po-meta-label">Last Updated</span><span className="po-meta-value">{new Date(po.updated_at).toLocaleDateString()}</span></div>}
                  </div>
                </section>
              )}
            </div>
            <div className="po-modal-actions">
              <button type="button" className="po-action-btn po-action-secondary" onClick={() => setShowDetails(false)}>Close</button>
              {canSubmit && <button type="button" className="po-action-btn po-action-success" onClick={(e) => { handleStatusUpdate('Submitted', e); setShowDetails(false); }} disabled={isLoading}><FileCheck size={18} />{isLoading ? 'Submitting...' : 'Submit PO'}</button>}
              {canReceive && <button type="button" className="po-action-btn po-action-success" onClick={() => { setShowDetails(false); navigate(`/purchase-orders/${po.id}`); }}><PackageCheck size={18} />Receive Items</button>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PurchaseOrderCard;
