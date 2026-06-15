import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AgGridReact } from 'ag-grid-react';
import { format } from 'date-fns';
import { ShoppingCart, FileText, Clock, CheckCircle, Send, Plus, Eye, Edit2, Trash2, ArrowRight, MoreVertical } from 'lucide-react';

import Button from '../../components/common/Button';
import DropdownMenu from '../../components/common/DropdownMenu';
import StatCard, { StatsGrid } from '../../components/common/StatCard';
import { useSettings } from '../../context/SettingsContext';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { useTranslation } from '../../hooks/useTranslation';
import { salesApi } from '../../utils/salesApi';
import './SalesOrdersPage.css';

export default function SalesOrdersPage() {
  const queryClient = useQueryClient();
  const { formatCurrency } = useSettings();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isMobile } = useMobileDetection();

  useKeyboardShortcut('Alt+N', () => {
    navigate('/sales-orders/create');
  }, { context: 'sales-orders', id: 'sales-orders-new', label: 'New sales order' });

  const { data: salesOrders = [], isLoading } = useQuery({
    queryKey: ['sales-orders'],
    queryFn: async () => {
      const response = await salesApi.getSalesOrders();
      return Array.isArray(response) ? response : (response.data || []);
    }
  });

  const orderTotals = {
    count: salesOrders.length,
    total: salesOrders.reduce((sum, so) => sum + parseFloat(so.total_amount || 0), 0),
    draft: salesOrders.filter(so => so.status === 'Draft').length,
    confirmed: salesOrders.filter(so => so.status === 'Confirmed').length,
    invoiced: salesOrders.filter(so => so.status === 'Invoiced').length
  };

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return salesApi.deleteSalesOrder(id);
    },
    onSuccess: () => {
      toast.success(t('salesOrders.deleted'));
      queryClient.invalidateQueries(['sales-orders']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || t('salesOrders.failed'));
    }
  });

  const handleDelete = (order) => {
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
      cellRenderer: (params) => (
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
      valueFormatter: (params) => params.value ? format(new Date(params.value), 'dd MMM yyyy') : ''
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
      valueFormatter: (params) => params.value ? format(new Date(params.value), 'dd MMM yyyy') : '-'
    },
    {
      headerName: t('salesOrders.amount'),
      field: 'total_amount',
      sortable: true,
      width: 120,
      type: 'rightAligned',
      valueFormatter: (params) => formatCurrency(parseFloat(String(params.value || 0)))
    },
    {
      headerName: t('salesOrders.status'),
      field: 'status',
      sortable: true,
      filter: true,
      width: 110,
      cellRenderer: (params) => {
        const status = params.value?.toLowerCase();
        let className = 'status-badge ';
        switch (status) {
          case 'draft': className += 'status-draft'; break;
          case 'confirmed': className += 'status-confirmed'; break;
          case 'invoiced': className += 'status-invoiced'; break;
          case 'completed': className += 'status-completed'; break;
          case 'cancelled': className += 'status-cancelled'; break;
          default: className += 'status-draft';
        }
        return <span className={className}>{params.value}</span>;
      }
    },
    {
      headerName: t('salesOrders.actions'),
      field: 'actions',
      width: 70,
      cellRenderer: (params) => (
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
      sortable: false,
      filter: false
    }
  ];

  const mobileColumns = [
    { key: 'so_no', label: t('salesOrders.soNo') },
    { key: 'customer_name', label: t('salesOrders.customer') },
    { key: 'total_amount', label: t('salesOrders.amount'), format: (v) => formatCurrency(parseFloat(String(v || 0))) },
    { key: 'status', label: t('salesOrders.status') }
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
          icon={<Plus size={18} />}
          onClick={() => navigate('/sales-orders/create')}
        >
          {t('salesOrders.newSalesOrder')}
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
          <AgGridReact theme="legacy"
            rowData={salesOrders}
            columnDefs={columnDefs}
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
            onRowDoubleClicked={(params) => navigate(`/sales-orders/${params.data.id}`)}
          />
        </div>
      </div>
    </div>
  );
}
