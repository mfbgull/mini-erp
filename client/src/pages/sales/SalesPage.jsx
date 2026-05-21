import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AgGridReact } from 'ag-grid-react';
import { format } from 'date-fns';
import { FileText, ShoppingCart, DollarSign, AlertTriangle, Plus, Eye, Edit2, Trash2 } from 'lucide-react';

import InvoicePreview from './InvoicePreview';
import Button from '../../components/common/Button';
import CompactInvoiceCardView from '../../components/common/CompactInvoiceCard';
import StatCard, { StatsGrid } from '../../components/common/StatCard';
import { useSettings } from '../../context/SettingsContext';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { useTranslation } from '../../hooks/useTranslation';
import api from '../../utils/api';
import './SalesPage.css';

export default function SalesPage() {
  const queryClient = useQueryClient();
  const { formatCurrency } = useSettings();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isMobile } = useMobileDetection();
  const [previewInvoice, setPreviewInvoice] = useState(null);

  useKeyboardShortcut('Alt+N', () => {
    navigate('/sales/invoice');
  }, { context: 'sales', id: 'sales-new-invoice' });

  useKeyboardShortcut('Alt+O', () => {
    navigate('/pos');
  }, { context: 'sales', id: 'sales-open-pos' });

  useKeyboardShortcut('Alt+C', () => {
    navigate('/customers');
  }, { context: 'sales', id: 'sales-open-customers' });

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

  // Delete invoice mutation
  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoiceId) => {
      return api.delete(`/invoices/${invoiceId}`);
    },
    onSuccess: () => {
      toast.success(t('sales.invoiceDeleted'));
      queryClient.invalidateQueries(['invoices']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || t('messages.error'));
    }
  });

  const handleDeleteInvoice = (invoice) => {
    if (window.confirm(`${t('sales.confirmDelete')} "${invoice.invoice_no}"?`)) {
      deleteInvoiceMutation.mutate(invoice.id);
    }
  };

  // Invoice column definitions
  const invoiceColumnDefs = [
    {
      headerName: t('sales.invoiceNo'),
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
      headerName: t('sales.date'),
      field: 'invoice_date',
      sortable: true,
      filter: 'agDateColumnFilter',
      width: 110,
      valueFormatter: params => params.value ? format(new Date(params.value), 'dd MMM yyyy') : ''
    },
    {
      headerName: t('fields.customer'),
      field: 'customer_name',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 150
    },
    {
      headerName: t('sales.dueDate'),
      field: 'due_date',
      sortable: true,
      filter: 'agDateColumnFilter',
      width: 110,
      valueFormatter: params => params.value ? format(new Date(params.value), 'dd MMM yyyy') : ''
    },
    {
      headerName: t('fields.total'),
      field: 'total_amount',
      sortable: true,
      filter: 'agNumberColumnFilter',
      width: 110,
      valueFormatter: params => formatCurrency(parseFloat(params.value || 0))
    },
    {
      headerName: t('status.paid'),
      field: 'paid_amount',
      sortable: true,
      filter: 'agNumberColumnFilter',
      width: 100,
      valueFormatter: params => formatCurrency(parseFloat(params.value || 0)),
      cellClass: 'text-success'
    },
    {
      headerName: t('fields.balance'),
      field: 'balance_amount',
      sortable: true,
      filter: 'agNumberColumnFilter',
      width: 100,
      valueFormatter: params => formatCurrency(parseFloat(params.value || 0)),
      cellClass: params => parseFloat(params.value || 0) > 0 ? 'text-danger' : ''
    },
    {
      headerName: t('fields.status'),
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
      headerName: t('sales.actions'),
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
            onClick={() => navigate(`/sales/invoice/${params.data.id}?mode=edit`)}
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
          <h1>{t('nav.sales')}</h1>
          <p className="page-subtitle">{t('sales.invoices')}</p>
        </div>
        <div className="header-actions">
          <Button variant="primary" onClick={() => navigate('/sales/invoice')}>
            <Plus size={18} />
            {t('sales.newInvoice')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <StatsGrid>
        <StatCard icon={FileText} label={t('sales.allInvoices')} value={invoiceTotals.count} />
        <StatCard icon={ShoppingCart} label={t('sales.totalSales')} value={formatCurrency(invoiceTotals.total)} />
        <StatCard icon={DollarSign} label={t('sales.totalPaid')} value={formatCurrency(invoiceTotals.paid)} />
        <StatCard icon={AlertTriangle} label={t('sales.totalDue')} value={formatCurrency(invoiceTotals.outstanding)} />
      </StatsGrid>

      {/* Invoices Grid */}
      <div className="sales-content">
        {invoicesLoading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : isMobile ? (
          <CompactInvoiceCardView
            invoices={invoices}
            onView={(invoice) => setPreviewInvoice(invoice)}
            onEdit={(invoice) => navigate(`/sales/invoice/${invoice.id}?mode=edit`)}
            onDelete={handleDeleteInvoice}
          />
        ) : (
          <div className="ag-theme-quartz" style={{ height: 500, width: '100%' }}>
            <AgGridReact theme="legacy"
              rowData={invoices}
              columnDefs={invoiceColumnDefs}
              defaultColDef={{
              theme:"legacy",
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

      {/* Mobile Preview Modal */}
      {previewInvoice && (
        <InvoicePreview
          invoice={previewInvoice}
          onClose={() => setPreviewInvoice(null)}
          onEdit={() => navigate(`/sales/invoice/${previewInvoice.id}?mode=edit`)}
          onDelete={() => handleDeleteInvoice(previewInvoice)}
        />
      )}
    </div>
  );
}
