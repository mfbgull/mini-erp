import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AgGridReact } from 'ag-grid-react';
import { format } from 'date-fns';
import { ShoppingCart, Plus, Eye, Edit2, Trash2, ArrowRight } from 'lucide-react';

import Button from '../../components/common/Button';
import { useSettings } from '../../context/SettingsContext';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { salesApi } from '../../utils/salesApi';
import './SalesOrdersPage.css';

export default function SalesOrdersPage() {
  const queryClient = useQueryClient();
  const { formatCurrency } = useSettings();
  const navigate = useNavigate();
  const { isMobile } = useMobileDetection();

  useKeyboardShortcut('Alt+N', () => {
    navigate('/sales-orders/create');
  }, { context: 'sales-orders', id: 'sales-orders-new' });

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
      toast.success('Sales order deleted successfully');
      queryClient.invalidateQueries(['sales-orders']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete sales order');
    }
  });

  const handleDelete = (order) => {
    if (window.confirm(`Delete sales order "${order.so_no}"?`)) {
      deleteMutation.mutate(order.id);
    }
  };

  const columnDefs = [
    {
      headerName: 'SO #',
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
      headerName: 'Date',
      field: 'so_date',
      sortable: true,
      filter: 'agDateColumnFilter',
      width: 110,
      valueFormatter: (params) => params.value ? format(new Date(params.value), 'dd MMM yyyy') : ''
    },
    {
      headerName: 'Customer',
      field: 'customer_name',
      sortable: true,
      filter: true,
      width: 180
    },
    {
      headerName: 'Delivery',
      field: 'delivery_date',
      sortable: true,
      width: 110,
      valueFormatter: (params) => params.value ? format(new Date(params.value), 'dd MMM yyyy') : '-'
    },
    {
      headerName: 'Amount',
      field: 'total_amount',
      sortable: true,
      width: 120,
      type: 'rightAligned',
      valueFormatter: (params) => formatCurrency(parseFloat(String(params.value || 0)))
    },
    {
      headerName: 'Status',
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
      headerName: 'Actions',
      field: 'actions',
      width: 160,
      cellRenderer: (params) => (
        <div className="action-buttons">
          <button
            type="button"
            className="icon-btn"
            title="View"
            onClick={() => navigate(`/sales-orders/${params.data.id}`)}
          >
            <Eye size={16} />
          </button>
          <button
            type="button"
            className="icon-btn"
            title="Edit"
            onClick={() => navigate(`/sales-orders/${params.data.id}/edit`)}
          >
            <Edit2 size={16} />
          </button>
          {params.data.status !== 'Invoiced' && params.data.status !== 'Completed' && (
            <button
              type="button"
              className="icon-btn"
              title="Convert to Invoice"
              onClick={() => navigate(`/sales-orders/${params.data.id}/convert`)}
            >
              <ArrowRight size={16} />
            </button>
          )}
          <button
            type="button"
            className="icon-btn danger"
            title="Delete"
            onClick={() => handleDelete(params.data)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
      sortable: false,
      filter: false
    }
  ];

  const defaultColDef = {
    resizable: true
  };

  const mobileColumns = [
    { key: 'so_no', label: 'SO #' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'total_amount', label: 'Amount', format: (v) => formatCurrency(parseFloat(String(v || 0))) },
    { key: 'status', label: 'Status' }
  ];

  return (
    <div className="sales-orders-page">
      <div className="page-header">
        <div className="header-title">
          <ShoppingCart size={24} />
          <h1>Sales Orders</h1>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={18} />}
          onClick={() => navigate('/sales-orders/create')}
        >
          New Sales Order
        </Button>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <span className="summary-label">Total</span>
          <span className="summary-value">{orderTotals.count}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Draft</span>
          <span className="summary-value">{orderTotals.draft}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Confirmed</span>
          <span className="summary-value">{orderTotals.confirmed}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Invoiced</span>
          <span className="summary-value">{orderTotals.invoiced}</span>
        </div>
      </div>

      <div className="grid-container ag-theme-alpine">
        <AgGridReact
          rowData={salesOrders}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          pagination={true}
          paginationPageSize={20}
          animateRows={true}
          loading={isLoading}
        />
      </div>
    </div>
  );
}
