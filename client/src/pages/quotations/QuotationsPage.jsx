import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AgGridReact } from 'ag-grid-react';
import { format } from 'date-fns';
import { FileText, Plus, Eye, Edit2, Trash2, ArrowRight } from 'lucide-react';

import Button from '../../components/common/Button';
import { useSettings } from '../../context/SettingsContext';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { salesApi } from '../../utils/salesApi';
import './QuotationsPage.css';

export default function QuotationsPage() {
  const queryClient = useQueryClient();
  const { formatCurrency } = useSettings();
  const navigate = useNavigate();
  const { isMobile } = useMobileDetection();

  useKeyboardShortcut('Alt+N', () => {
    navigate('/quotations/create');
  }, { context: 'quotations', id: 'quotations-new' });

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ['quotations'],
    queryFn: async () => {
      const response = await salesApi.getQuotations();
      return Array.isArray(response) ? response : (response.data || []);
    }
  });

  const quotationTotals = {
    count: quotations.length,
    total: quotations.reduce((sum, q) => sum + parseFloat(q.total_amount || 0), 0),
    draft: quotations.filter(q => q.status === 'Draft').length,
    sent: quotations.filter(q => q.status === 'Sent').length,
    converted: quotations.filter(q => q.status === 'Converted').length
  };

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return salesApi.deleteQuotation(id);
    },
    onSuccess: () => {
      toast.success('Quotation deleted successfully');
      queryClient.invalidateQueries(['quotations']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete quotation');
    }
  });

  const handleDelete = (quotation) => {
    if (window.confirm(`Delete quotation "${quotation.quotation_no}"?`)) {
      deleteMutation.mutate(quotation.id);
    }
  };

  const columnDefs = [
    {
      headerName: 'Quotation #',
      field: 'quotation_no',
      sortable: true,
      filter: true,
      width: 130,
      cellRenderer: (params) => (
        <span
          className="link-text"
          onClick={() => navigate(`/quotations/${params.data.id}`)}
        >
          {params.value}
        </span>
      )
    },
    {
      headerName: 'Date',
      field: 'quotation_date',
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
      headerName: 'Expiry',
      field: 'expiry_date',
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
      width: 100,
      cellRenderer: (params) => {
        const status = params.value?.toLowerCase();
        let className = 'status-badge ';
        switch (status) {
          case 'draft': className += 'status-draft'; break;
          case 'sent': className += 'status-sent'; break;
          case 'accepted': className += 'status-accepted'; break;
          case 'rejected': className += 'status-rejected'; break;
          case 'converted': className += 'status-converted'; break;
          case 'expired': className += 'status-expired'; break;
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
            onClick={() => navigate(`/quotations/${params.data.id}`)}
          >
            <Eye size={16} />
          </button>
          <button
            type="button"
            className="icon-btn"
            title="Edit"
            onClick={() => navigate(`/quotations/${params.data.id}/edit`)}
          >
            <Edit2 size={16} />
          </button>
          {params.data.status !== 'Converted' && (
            <button
              type="button"
              className="icon-btn"
              title="Convert to SO"
              onClick={() => navigate(`/quotations/${params.data.id}/convert`)}
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
    { key: 'quotation_no', label: 'Quotation #' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'total_amount', label: 'Amount', format: (v) => formatCurrency(parseFloat(String(v || 0))) },
    { key: 'status', label: 'Status' }
  ];

  return (
    <div className="quotations-page">
      <div className="page-header">
        <div className="header-title">
          <FileText size={24} />
          <h1>Quotations</h1>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={18} />}
          onClick={() => navigate('/quotations/create')}
        >
          New Quotation
        </Button>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <span className="summary-label">Total</span>
          <span className="summary-value">{quotationTotals.count}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Draft</span>
          <span className="summary-value">{quotationTotals.draft}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Sent</span>
          <span className="summary-value">{quotationTotals.sent}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Converted</span>
          <span className="summary-value">{quotationTotals.converted}</span>
        </div>
      </div>

      <div className="grid-container ag-theme-alpine">
        <AgGridReact
          rowData={quotations}
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
