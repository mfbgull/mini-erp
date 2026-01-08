import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { format } from 'date-fns';
import { AgGridReact } from 'ag-grid-react';
import {
  MoreHorizontal,
  Eye,
  Edit2,
  Check,
  X,
  Trash2,
  PackageCheck,
  FileCheck
} from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import './PurchaseOrdersPage.css';

// Actions Menu Component (rendered via portal)
function ActionsMenu({ po, onClose, navigate }) {
  const menuRef = useRef(null);
  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      return api.put(`/purchase-orders/${id}/status`, { status });
    },
    onSuccess: () => {
      toast.success('Status updated successfully');
      queryClient.invalidateQueries(['purchaseOrders']);
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update status');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return api.delete(`/purchase-orders/${id}`);
    },
    onSuccess: () => {
      toast.success('Purchase order deleted successfully');
      queryClient.invalidateQueries(['purchaseOrders']);
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete purchase order');
    }
  });

  const handleStatusUpdate = (newStatus) => {
    const messages = {
      'Submitted': 'Submit this purchase order? This will create an AP liability.',
      'Partially Received': 'Mark as Partially Received?',
      'Completed': 'Mark as Completed? All items should be received.',
      'Cancelled': 'Cancel this purchase order? This action cannot be undone.'
    };

    if (window.confirm(messages[newStatus] || `Change status to ${newStatus}?`)) {
      statusMutation.mutate({ id: po.id, status: newStatus });
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete PO "${po.po_no}"? This action cannot be undone.`)) {
      deleteMutation.mutate(po.id);
    }
  };

  const canEdit = po.status === 'Draft';
  const canSubmit = po.status === 'Draft';
  const canPartialReceive = po.status === 'Submitted';
  const canComplete = po.status === 'Submitted' || po.status === 'Partially Received';
  const canCancel = ['Draft', 'Submitted', 'Partially Received'].includes(po.status);
  const canDelete = ['Draft', 'Submitted', 'Partially Received'].includes(po.status);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const isLoading = statusMutation.isPending || deleteMutation.isPending;

  return createPortal(
    <div className="actions-menu-overlay">
      <div className="actions-menu-dropdown" ref={menuRef}>
        <button
          className="action-item"
          onClick={() => {
            navigate(`/purchase-orders/${po.id}`);
            onClose();
          }}
        >
          <Eye size={16} />
          View Details
        </button>

        {canEdit && (
          <button
            className="action-item"
            onClick={() => {
              navigate(`/purchase-orders/${po.id}/edit`);
              onClose();
            }}
          >
            <Edit2 size={16} />
            Edit PO
          </button>
        )}

        {canSubmit && (
          <button
            className="action-item"
            onClick={() => handleStatusUpdate('Submitted')}
            disabled={isLoading}
          >
            <FileCheck size={16} />
            Mark as Submitted
          </button>
        )}

        {canPartialReceive && (
          <button
            className="action-item"
            onClick={() => handleStatusUpdate('Partially Received')}
            disabled={isLoading}
          >
            <PackageCheck size={16} />
            Mark as Partially Received
          </button>
        )}

        {canComplete && (
          <button
            className="action-item"
            onClick={() => handleStatusUpdate('Completed')}
            disabled={isLoading}
          >
            <Check size={16} />
            Mark as Completed
          </button>
        )}

        {canCancel && (
          <button
            className="action-item"
            onClick={() => handleStatusUpdate('Cancelled')}
            disabled={isLoading}
          >
            <X size={16} />
            Mark as Cancelled
          </button>
        )}

        {canDelete && (
          <>
            <div className="action-divider" />
            <button
              className="action-item danger"
              onClick={handleDelete}
              disabled={isLoading}
            >
              <Trash2 size={16} />
              Delete PO
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

export default function PurchaseOrdersPage() {
  const navigate = useNavigate();
  const { formatCurrency } = useSettings();
  const [statusFilter, setStatusFilter] = useState('');
  const [openMenu, setOpenMenu] = useState(null);

  const { data: pos = [], isLoading } = useQuery({
    queryKey: ['purchaseOrders', statusFilter],
    queryFn: async () => {
      const response = await api.get('/purchase-orders', {
        params: statusFilter ? { status: statusFilter } : {}
      });
      return response.data;
    }
  });

  const columnDefs = [
    {
      headerName: 'PO #',
      field: 'po_no',
      sortable: true,
      filter: true,
      flex: 1,
      cellRenderer: (params) => (
        <button
          className="link-button"
          onClick={() => navigate(`/purchase-orders/${params.data.id}`)}
        >
          {params.value}
        </button>
      )
    },
    {
      headerName: 'Date',
      field: 'po_date',
      sortable: true,
      filter: 'agDateColumnFilter',
      flex: 1,
      valueFormatter: params => format(new Date(params.value), 'dd MMM yyyy')
    },
    {
      headerName: 'Supplier',
      field: 'supplier_name',
      sortable: true,
      filter: true,
      flex: 2
    },
    {
      headerName: 'Status',
      field: 'status',
      sortable: true,
      filter: true,
      flex: 1,
      cellRenderer: (params) => {
        const statusColors = {
          'Draft': 'status-draft',
          'Submitted': 'status-submitted',
          'Partially Received': 'status-partial',
          'Completed': 'status-completed',
          'Cancelled': 'status-cancelled'
        };
        return (
          <span className={`status-badge ${statusColors[params.value] || 'status-draft'}`}>
            {params.value}
          </span>
        );
      }
    },
    {
      headerName: 'Total',
      field: 'total_amount',
      sortable: true,
      filter: 'agNumberColumnFilter',
      flex: 1,
      valueFormatter: params => formatCurrency(parseFloat(params.value))
    },
    {
      headerName: 'Warehouse',
      field: 'warehouse_name',
      filter: true,
      flex: 1.5
    },
    {
      headerName: '',
      field: 'actions',
      sortable: false,
      filter: false,
      flex: 0.6,
      minWidth: 60,
      cellRenderer: (params) => {
        const po = params.data;
        const isMenuOpen = openMenu === po.id;

        return (
          <div className="actions-cell">
            <button
              className="actions-menu-btn"
              onClick={() => setOpenMenu(isMenuOpen ? null : po.id)}
              title="Actions"
            >
              <MoreHorizontal size={18} />
            </button>

            {isMenuOpen && <ActionsMenu po={po} onClose={() => setOpenMenu(null)} navigate={navigate} />}
          </div>
        );
      }
    }
  ];

  // Calculate summary stats
  const stats = {
    total: pos.length,
    draft: pos.filter(po => po.status === 'Draft').length,
    submitted: pos.filter(po => po.status === 'Submitted').length,
    partial: pos.filter(po => po.status === 'Partially Received').length,
    completed: pos.filter(po => po.status === 'Completed').length,
    totalValue: pos.reduce((sum, po) => sum + parseFloat(po.total_amount), 0)
  };

  return (
    <div className="purchase-orders-page">
      <div className="page-header">
        <div>
          <h1>Purchase Orders</h1>
          <p className="page-subtitle">Manage purchase orders and track deliveries</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => navigate('/purchase-orders/create')}
        >
          + Create Purchase Order
        </button>
      </div>

      {isLoading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          <div className="summary-cards">
            <div className="summary-card">
              <div className="summary-label">Total POs</div>
              <div className="summary-value">{stats.total}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Draft</div>
              <div className="summary-value">{stats.draft}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Submitted</div>
              <div className="summary-value">{stats.submitted}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Partially Received</div>
              <div className="summary-value">{stats.partial}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Completed</div>
              <div className="summary-value">{stats.completed}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Total Value</div>
              <div className="summary-value">{formatCurrency(stats.totalValue)}</div>
            </div>
          </div>

          <div className="filters-bar">
            <label>Status Filter:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="Draft">Draft</option>
              <option value="Submitted">Submitted</option>
              <option value="Partially Received">Partially Received</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="ag-theme-quartz" style={{ height: 600, width: '100%' }}>
            <AgGridReact
              rowData={pos}
              columnDefs={columnDefs}
              defaultColDef={{
                resizable: true,
                sortable: false,
                filter: false
              }}
              pagination={true}
              paginationPageSize={20}
              paginationPageSizeSelector={[10, 20, 50, 100]}
            />
          </div>
        </>
      )}
    </div>
  );
}
