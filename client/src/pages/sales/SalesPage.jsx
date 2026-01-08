import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSettings } from '../../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { AgGridReact } from 'ag-grid-react';
import { FileText, ShoppingCart, Plus, Eye, Edit2 } from 'lucide-react';
import api from '../../utils/api';
import Button from '../../components/common/Button';
import './SalesPage.css';

export default function SalesPage() {
  const queryClient = useQueryClient();
  const { formatCurrency } = useSettings();
  const navigate = useNavigate();

  // Fetch invoices
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const response = await api.get('/invoices');
      return response.data.data || [];
    }
  });

  // Calculate totals
  const invoiceTotals = {
    count: invoices.length,
    total: invoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0),
    paid: invoices.reduce((sum, inv) => sum + parseFloat(inv.paid_amount || 0), 0),
    outstanding: invoices.reduce((sum, inv) => sum + parseFloat(inv.balance_amount || 0), 0)
  };

  // Invoice column definitions
  const invoiceColumnDefs = [
    {
      headerName: 'Invoice #',
      field: 'invoice_no',
      sortable: true,
      filter: true,
      width: 130,
      cellRenderer: (params) => (
        <span
          className="invoice-link"
          onClick={() => navigate(`/sales/invoice/${params.data.id}/view`)}
        >
          {params.value}
        </span>
      )
    },
    {
      headerName: 'Date',
      field: 'invoice_date',
      sortable: true,
      filter: 'agDateColumnFilter',
      width: 110,
      valueFormatter: params => params.value ? format(new Date(params.value), 'dd MMM yyyy') : ''
    },
    {
      headerName: 'Customer',
      field: 'customer_name',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 150
    },
    {
      headerName: 'Due Date',
      field: 'due_date',
      sortable: true,
      filter: 'agDateColumnFilter',
      width: 110,
      valueFormatter: params => params.value ? format(new Date(params.value), 'dd MMM yyyy') : ''
    },
    {
      headerName: 'Total',
      field: 'total_amount',
      sortable: true,
      filter: 'agNumberColumnFilter',
      width: 110,
      valueFormatter: params => formatCurrency(parseFloat(params.value || 0))
    },
    {
      headerName: 'Paid',
      field: 'paid_amount',
      sortable: true,
      filter: 'agNumberColumnFilter',
      width: 100,
      valueFormatter: params => formatCurrency(parseFloat(params.value || 0)),
      cellClass: 'text-success'
    },
    {
      headerName: 'Balance',
      field: 'balance_amount',
      sortable: true,
      filter: 'agNumberColumnFilter',
      width: 100,
      valueFormatter: params => formatCurrency(parseFloat(params.value || 0)),
      cellClass: params => parseFloat(params.value || 0) > 0 ? 'text-danger' : ''
    },
    {
      headerName: 'Status',
      field: 'status',
      sortable: true,
      filter: true,
      width: 120,
      cellRenderer: (params) => (
        <span className={`status-badge status-${(params.value || 'unknown').toLowerCase().replace(' ', '-')}`}>
          {params.value || 'Unknown'}
        </span>
      )
    },
    {
      headerName: 'Actions',
      field: 'actions',
      width: 120,
      sortable: false,
      filter: false,
      cellRenderer: (params) => (
        <div className="action-buttons">
          <button
            className="action-btn view-btn"
            onClick={() => navigate(`/sales/invoice/${params.data.id}/view`)}
            title="View Invoice"
          >
            <Eye size={14} />
          </button>
          <button
            className="action-btn edit-btn"
            onClick={() => navigate(`/sales/invoice/${params.data.id}`)}
            title="Edit Invoice"
          >
            <Edit2 size={14} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="sales-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Sales</h1>
          <p className="page-subtitle">Manage invoices</p>
        </div>
        <div className="header-actions">
          <Button variant="primary" onClick={() => navigate('/sales/invoice')}>
            <Plus size={18} />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-icon invoices">
            <FileText size={24} />
          </div>
          <div className="summary-content">
            <div className="summary-value">{invoiceTotals.count}</div>
            <div className="summary-label">Total Invoices</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon revenue">
            <ShoppingCart size={24} />
          </div>
          <div className="summary-content">
            <div className="summary-value">{formatCurrency(invoiceTotals.total)}</div>
            <div className="summary-label">Total Invoiced</div>
          </div>
        </div>
        <div className="summary-card success">
          <div className="summary-content">
            <div className="summary-value">{formatCurrency(invoiceTotals.paid)}</div>
            <div className="summary-label">Total Received</div>
          </div>
        </div>
        <div className="summary-card warning">
          <div className="summary-content">
            <div className="summary-value">{formatCurrency(invoiceTotals.outstanding)}</div>
            <div className="summary-label">Outstanding</div>
          </div>
        </div>
      </div>

      {/* Invoices Grid */}
      <div className="sales-content">
        {invoicesLoading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="ag-theme-quartz" style={{ height: 500, width: '100%' }}>
            <AgGridReact
              rowData={invoices}
              columnDefs={invoiceColumnDefs}
              defaultColDef={{
                resizable: true,
                sortable: true,
                filter: true
              }}
              pagination={true}
              paginationPageSize={15}
              paginationPageSizeSelector={[10, 15, 25, 50]}
              rowSelection={{ mode: 'singleRow' }}
              onRowDoubleClicked={(params) => navigate(`/sales/invoice/${params.data.id}/view`)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
