import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AgGridReact } from 'ag-grid-react';
import { format } from 'date-fns';
import { ShoppingCart, FileText, CheckCircle, Send, Plus, Eye, Edit2, Trash2, ArrowRight, MoreVertical } from 'lucide-react';

import Button from '../../components/common/Button';
import DropdownMenu from '../../components/common/DropdownMenu';
import StatCard, { StatsGrid } from '../../components/common/StatCard';
import { useSettings } from '../../context/SettingsContext';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import { useTranslation } from '../../hooks/useTranslation';
import { salesApi } from '../../utils/salesApi';
import { createActionColDef } from '../../utils/agGridIntegration';
import './SalesOrdersPage.css';
import '../../styles/ag-grid-status-cells.css';
import { getStatusCellClass } from '../../utils/statusCellUtils';

interface SalesOrder {
  id: number;
  so_no: string;
  so_date: string;
  customer_name: string;
  delivery_date: string;
  total_amount: number | string;
  status: string;
}

interface OrderTotals {
  count: number;
  total: number;
  draft: number;
  confirmed: number;
  invoiced: number;
}

export default function SalesOrdersPage() {
  const queryClient = useQueryClient();
  const { formatCurrency } = useSettings();
  const { t } = useTranslation();
  const navigate = useNavigate();

  useKeyboardShortcut('Alt+N', () => {
    navigate('/sales-orders/create');
  }, { context: 'sales-orders', id: 'sales-orders-new', label: 'New sales order' });

  const { data: salesOrders = [], isLoading } = useQuery<SalesOrder[]>({
    queryKey: ['sales-orders'],
    queryFn: async () => {
      const response = await salesApi.getSalesOrders();
      return Array.isArray(response) ? response : (response.data || []);
    }
  });

  const orderTotals: OrderTotals = {
    count: salesOrders.length,
    total: salesOrders.reduce((sum, so) => sum + parseFloat(String(so.total_amount || 0)), 0),
    draft: salesOrders.filter(so => so.status === 'Draft').length,
    confirmed: salesOrders.filter(so => so.status === 'Confirmed').length,
    invoiced: salesOrders.filter(so => so.status === 'Invoiced').length
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return salesApi.deleteSalesOrder(id);
    },
    onSuccess: () => {
      toast.success(t('salesOrders.deleted'));
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || t('salesOrders.failed'));
    }
  });

  const handleDelete = (order: SalesOrder) => {
    if (window.confirm(t('salesOrders.confirmDelete'))) {
      deleteMutation.mutate(order.id);
    }
  };

  const columnDefs = [
    {
      headerName: t('salesOrders.soNo'),
      field: 'so_no',
      sortable: true,
      filter: true,
      width: 130,
      cellRenderer: (params: { data: SalesOrder; value: string }) => (
        <span
          className="link-text"
          onClick={() => navigate(`/sales-orders/${params.data.id}`)}
        >
          {params.value}
        </span>
      )
    },
    {
      headerName: t('salesOrders.date'),
      field: 'so_date',
      sortable: true,
      filter: 'agDateColumnFilter',
      width: 110,
      valueFormatter: (params: { value: string }) => params.value ? format(new Date(params.value), 'dd MMM yyyy') : ''
    },
    {
      headerName: t('salesOrders.customer'),
      field: 'customer_name',
      sortable: true,
      filter: true,
      width: 180
    },
    {
      headerName: t('salesOrders.delivery'),
      field: 'delivery_date',
      sortable: true,
      width: 110,
      valueFormatter: (params: { value: string }) => params.value ? format(new Date(params.value), 'dd MMM yyyy') : '-'
    },
    {
      headerName: t('salesOrders.amount'),
      field: 'total_amount',
      sortable: true,
      width: 120,
      type: 'rightAligned',
      valueFormatter: (params: { value: string | number }) => formatCurrency(parseFloat(String(params.value || 0)))
    },
    {
      headerName: t('salesOrders.status'),
      field: 'status',
      sortable: true,
      filter: true,
      width: 110,
      cellRenderer: (params: { value: string }) => params.value,
      cellClass: (params: { value: string }) => getStatusCellClass(params.value),
    },
    createActionColDef({
      headerName: t('salesOrders.actions'),
      cellRenderer: (params: { data: SalesOrder }) => (
        <DropdownMenu
          trigger={
            <button className="action-menu-trigger" title={t('salesOrders.actions')}>
              <MoreVertical size={16} />
            </button>
          }
          items={[
            { label: t('salesOrders.viewDetails'), icon: <Eye size={16} />, onClick: () => navigate(`/sales-orders/${params.data.id}`) },
            { label: t('salesOrders.edit'), icon: <Edit2 size={16} />, onClick: () => navigate(`/sales-orders/${params.data.id}/edit`) },
            ...(params.data.status !== 'Invoiced' && params.data.status !== 'Completed'
              ? [{ label: t('salesOrders.convertToInvoice'), icon: <ArrowRight size={16} />, onClick: () => navigate(`/sales-orders/${params.data.id}/convert`) }]
              : []),
            { label: t('salesOrders.delete'), icon: <Trash2 size={16} />, onClick: () => handleDelete(params.data), destructive: true },
          ]}
          align="end"
        />
      ),
    })
  ];

  return (
    <div className="sales-orders-page">
      <div className="page-header">
        <div className="header-title">
          <ShoppingCart size={24} />
          <h1>{t('salesOrders.salesOrders')}</h1>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/sales-orders/create')}
        >
          <Plus size={18} /> {t('salesOrders.newSalesOrder')}
        </Button>
      </div>

      <StatsGrid className="compact">
        <StatCard icon={ShoppingCart} label={t('common.total')} value={orderTotals.count} />
        <StatCard icon={FileText} label={t('salesOrders.draft')} value={orderTotals.draft} />
        <StatCard icon={CheckCircle} label={t('salesOrders.confirmed')} value={orderTotals.confirmed} />
        <StatCard icon={Send} label={t('salesOrders.invoiced')} value={orderTotals.invoiced} />
      </StatsGrid>

      <div className="sales-orders-content">
        <div className="ag-theme-quartz grid-fill">
          <AgGridReact
            rowData={salesOrders}
            columnDefs={columnDefs as any}
            defaultColDef={{
              resizable: true,
              sortable: true,
              filter: true
            }}
            pagination={true}
            paginationPageSize={15}
            paginationPageSizeSelector={[10, 15, 25, 50]}
            rowSelection={{ mode: 'singleRow' }}
            animateRows={true}
            loading={isLoading}
            onRowDoubleClicked={(params: { data: SalesOrder }) => navigate(`/sales-orders/${params.data.id}`)}
          />
        </div>
      </div>
    </div>
  );
}
