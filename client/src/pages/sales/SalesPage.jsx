import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AgGridReact } from 'ag-grid-react';
import { format } from 'date-fns';
import { FileText, ShoppingCart, DollarSign, AlertTriangle, Plus, Eye, Edit2, Trash2, Search, X, Download, BarChart3, Wallet, RotateCcw, Ban, MoreVertical } from 'lucide-react';

import InvoicePreview from './InvoicePreview';
import InvoiceReturn from './InvoiceReturn';
import Button from '../../components/common/Button';
import CompactInvoiceCardView from '../../components/common/CompactInvoiceCard';
import DropdownMenu from '../../components/common/DropdownMenu';
import StatCard, { StatsGrid } from '../../components/common/StatCard';
import { useSettings } from '../../context/SettingsContext';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { useTranslation } from '../../hooks/useTranslation';
import api from '../../utils/api';
import './SalesPage.css';
import '../../styles/components/stat-card.css';

export default function SalesPage() {
  const queryClient = useQueryClient();
  const { formatCurrency } = useSettings();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isMobile } = useMobileDetection();
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPOSSales, setShowPOSSales] = useState(false);
  const [returnInvoice, setReturnInvoice] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

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

  // Filter invoices by search term and optionally exclude POS
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    // Hide POS invoices by default — toggle to show them
    if (!showPOSSales && inv.source_type === 'POS') return false;
    return true;
  });

  // Delete invoice mutation
  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoiceId) => {
      return api.delete(`/invoices/${invoiceId}`);
    },
    onSuccess: () => {
      toast.success(t('sales.invoiceDeleted'));
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || t('messages.error'));
    }
  });

  // Cancel invoice mutation
  const cancelInvoiceMutation = useMutation({
    mutationFn: async (invoiceId) => {
      return api.put(`/invoices/${invoiceId}/cancel`);
    },
    onSuccess: () => {
      toast.success('Invoice cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to cancel invoice');
    }
  });

  const canDeleteInvoice = (invoice) => {
    const paidAmount = parseFloat(invoice.paid_amount || 0);
    const returnedAmount = parseFloat(invoice.returned_amount || 0);
    const deletableStatuses = ['Draft', 'Unpaid'];
    return deletableStatuses.includes(invoice.status) && paidAmount === 0 && returnedAmount === 0;
  };

  const handleDeleteInvoice = (invoice) => {
    if (!canDeleteInvoice(invoice)) {
      toast.error('Only unpaid/draft invoices with no payments or returns can be deleted. Use Cancel instead.');
      return;
    }
    if (window.confirm(`${t('sales.confirmDelete')} "${invoice.invoice_no}"?`)) {
      deleteInvoiceMutation.mutate(invoice.id);
    }
  };

  const handleCancelInvoice = (invoice) => {
    if (invoice.status === 'Cancelled') {
      toast.error('Invoice is already cancelled');
      return;
    }
    if (window.confirm(`Are you sure you want to cancel invoice "${invoice.invoice_no}"? This will mark it as cancelled but keep all records.`)) {
      cancelInvoiceMutation.mutate(invoice.id);
    }
  };

  // Return invoice mutation
  const returnInvoiceMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return api.post(`/invoices/${id}/return`, data);
    },
    onSuccess: () => {
      toast.success('Return processed successfully');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setIsReturnModalOpen(false);
      setReturnInvoice(null);
      setReturnItems([]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to process return');
    }
  });

  const handleOpenReturn = async (invoice) => {
    try {
      const response = await api.get(`/invoices/${invoice.id}`);
      const invoiceData = response.data;
      const items = invoiceData.items || [];
      setReturnInvoice({
        id: invoiceData.id,
        invoice_no: invoiceData.invoice_no,
        invoice_date: invoiceData.invoice_date,
        customer_id: invoiceData.customer_id,
        customer_name: invoiceData.customer_name,
        total_amount: invoiceData.total_amount,
        status: invoiceData.status,
      });
      setReturnItems(items);
      setIsReturnModalOpen(true);
    } catch (error) {
      toast.error('Failed to load invoice data');
    }
  };

  const handleSubmitReturn = (returnPayload) => {
    if (!returnInvoice) return;
    returnInvoiceMutation.mutate({
      id: returnInvoice.id,
      data: returnPayload
    });
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
      headerName: t('fields.date'),
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
      width: 160,
      cellRenderer: (params) => {
        const hasReturn = parseFloat(params.data?.returned_amount || 0) > 0;
        return (
          <div className="status-cell">
            <span className={`status-badge status-${(params.value || 'unknown').toLowerCase().replace(' ', '-')}`}>
              {params.value || 'Unknown'}
            </span>
            {hasReturn && (
              <span className="status-badge status-returned">
                Returned
              </span>
            )}
          </div>
        );
      }
    },
    {
      headerName: t('common.actions'),
      field: 'actions',
      width: 70,
      sortable: false,
      filter: false,
      cellRenderer: (params) => (
        <DropdownMenu
          trigger={
            <button className="action-menu-trigger" title={t('common.actions')}>
              <MoreVertical size={16} />
            </button>
          }
          items={[
            { label: 'View', icon: <Eye size={16} />, onClick: () => navigate(`/sales/invoice/${params.data.id}/view`) },
            { label: 'Edit', icon: <Edit2 size={16} />, onClick: () => navigate(`/sales/invoice/${params.data.id}?mode=edit`) },
            ...(params.data?.status !== 'Cancelled'
              ? [
                  { label: 'Return', icon: <RotateCcw size={16} />, onClick: () => handleOpenReturn(params.data) },
                  { label: 'Cancel', icon: <Ban size={16} />, onClick: () => handleCancelInvoice(params.data), destructive: true }
                ]
              : [])
          ]}
          align="end"
        />
      )
    }
  ];

  return (
    <div className="sales-page">
      <div className="page-header" id="salesPageHeader">
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
      <StatsGrid className="compact">
        <StatCard icon={FileText} label={t('sales.allInvoices')} value={invoiceTotals.count} />
        <StatCard icon={ShoppingCart} label={t('sales.totalSales')} value={formatCurrency(invoiceTotals.total)} />
        <StatCard icon={DollarSign} label={t('sales.totalPaid')} value={formatCurrency(invoiceTotals.paid)} />
        <StatCard icon={AlertTriangle} label={t('sales.totalDue')} value={formatCurrency(invoiceTotals.outstanding)} />
      </StatsGrid>        <div className="search-quick-row">
        <div className="search-section">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              className="search-input-field"
              placeholder={t('sales.searchPlaceholder') || "Search invoices..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="search-clear-btn"
                onClick={() => setSearchTerm('')}
                type="button"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            className={`pos-filter-toggle ${showPOSSales ? 'active' : ''}`}
            onClick={() => setShowPOSSales(!showPOSSales)}
            type="button"
            title={showPOSSales ? 'Hide POS sales' : 'Show POS sales'}
          >
            <ShoppingCart size={16} />
            <span>{showPOSSales ? 'Hide POS' : 'POS'}</span>
          </button>
        </div>
        <div className="quick-actions">
          <button className="quick-action-btn" onClick={() => navigate("/pos")} type="button">
            <Wallet className="action-icon" size={24} />
            <span className="action-text">{t('sales.pos')}</span>
          </button>
          <button
            className="quick-action-btn"
            onClick={() => navigate("/reports/sales-summary")}
            type="button"
          >
            <BarChart3 className="action-icon" size={24} />
            <span className="action-text">{t('sales.salesReport')}</span>
          </button>
          <button
            className="quick-action-btn"
            onClick={() => navigate("/reports/stock-valuation")}
            type="button"
          >
            <DollarSign className="action-icon" size={24} />
            <span className="action-text">{t('sales.stockValuation')}</span>
          </button>
          <button
            className="quick-action-btn"
            onClick={() => navigate("/sales/returns")}
            type="button"
          >
            <RotateCcw className="action-icon" size={24} />
            <span className="action-text">Returns</span>
          </button>
          <button
            className="quick-action-btn"
            onClick={() => toast.success('Export coming soon')}
            type="button"
          >
            <Download className="action-icon" size={24} />
            <span className="action-text">{t('common.export')}</span>
          </button>
        </div>
      </div>

      {/* Invoices Grid */}
      <div className="sales-content">
        {invoicesLoading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : isMobile ? (
          <CompactInvoiceCardView
            invoices={filteredInvoices}
            onView={(invoice) => setPreviewInvoice(invoice)}
            onEdit={(invoice) => navigate(`/sales/invoice/${invoice.id}?mode=edit`)}
            onDelete={handleDeleteInvoice}
            onReturn={handleOpenReturn}
            onCancel={handleCancelInvoice}
          />
        ) : (
          <div className="ag-theme-quartz grid-fill">
            <AgGridReact theme="legacy"
              rowData={filteredInvoices}
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

      {/* Mobile Preview Modal */}
      {previewInvoice && (
        <InvoicePreview
          invoice={previewInvoice}
          onClose={() => setPreviewInvoice(null)}
          onEdit={() => navigate(`/sales/invoice/${previewInvoice.id}?mode=edit`)}
          onDelete={() => handleDeleteInvoice(previewInvoice)}
          onReturn={() => handleOpenReturn(previewInvoice)}
        />
      )}

      {/* Return Modal */}
      {isReturnModalOpen && returnInvoice && (
        <InvoiceReturn
          invoice={returnInvoice}
          items={returnItems}
          onClose={() => {
            setIsReturnModalOpen(false);
            setReturnInvoice(null);
            setReturnItems([]);
          }}
          onSubmit={handleSubmitReturn}
          loading={returnInvoiceMutation.isPending}
        />
      )}
    </div>
  );
}
