import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AgGridReact } from 'ag-grid-react';
import { format } from 'date-fns';
import { FileText, Send, CheckCircle, ArrowRight, Plus, Eye, Edit2, Trash2 } from 'lucide-react';

import Button from '../../components/common/Button';
import StatCard, { StatsGrid } from '../../components/common/StatCard';
import { useSettings } from '../../context/SettingsContext';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { useTranslation } from '../../hooks/useTranslation';
import { salesApi } from '../../utils/salesApi';
import './QuotationsPage.css';

export default function QuotationsPage() {
  const queryClient = useQueryClient();
  const { formatCurrency } = useSettings();
  const { t } = useTranslation();
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
      toast.success(t('quotations.deleted'));
      queryClient.invalidateQueries(['quotations']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || t('quotations.failed'));
    }
  });

  const handleDelete = (quotation) => {
    if (window.confirm(t('quotations.confirmDelete'))) {
      deleteMutation.mutate(quotation.id);
    }
  };

  const columnDefs = [
    {
      headerName: t('quotations.quotation'),
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
      headerName: t('quotations.date'),
      field: 'quotation_date',
      sortable: true,
      filter: 'agDateColumnFilter',
      width: 110,
      valueFormatter: (params) => params.value ? format(new Date(params.value), 'dd MMM yyyy') : ''
    },
    {
      headerName: t('quotations.customer'),
      field: 'customer_name',
      sortable: true,
      filter: true,
      width: 180
    },
    {
      headerName: t('quotations.expiry'),
      field: 'expiry_date',
      sortable: true,
      width: 110,
      valueFormatter: (params) => params.value ? format(new Date(params.value), 'dd MMM yyyy') : '-'
    },
    {
      headerName: t('quotations.amount'),
      field: 'total_amount',
      sortable: true,
      width: 120,
      type: 'rightAligned',
      valueFormatter: (params) => formatCurrency(parseFloat(String(params.value || 0)))
    },
    {
      headerName: t('quotations.status'),
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
      headerName: t('quotations.actions'),
      field: 'actions',
      width: 160,
      cellRenderer: (params) => (
        <div className="action-buttons">
          <button
            type="button"
            className="icon-btn"
            title={t('quotations.viewDetails')}
            onClick={() => navigate(`/quotations/${params.data.id}`)}
          >
            <Eye size={16} />
          </button>
          <button
            type="button"
            className="icon-btn"
            title={t('quotations.edit')}
            onClick={() => navigate(`/quotations/${params.data.id}/edit`)}
          >
            <Edit2 size={16} />
          </button>
          {params.data.status !== 'Converted' && (
            <button
              type="button"
              className="icon-btn"
              title={t('quotations.convertToSo')}
              onClick={() => navigate(`/quotations/${params.data.id}/convert`)}
            >
              <ArrowRight size={16} />
            </button>
          )}
          <button
            type="button"
            className="icon-btn danger"
            title={t('quotations.delete')}
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

  const mobileColumns = [
    { key: 'quotation_no', label: t('quotations.quotation') },
    { key: 'customer_name', label: t('quotations.customer') },
    { key: 'total_amount', label: t('quotations.amount'), format: (v) => formatCurrency(parseFloat(String(v || 0))) },
    { key: 'status', label: t('quotations.status') }
  ];

  return (
    <div className="quotations-page">
      <div className="page-header">
        <div className="header-title">
          <FileText size={24} />
          <h1>{t('quotations.quotations')}</h1>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={18} />}
          onClick={() => navigate('/quotations/create')}
        >
          {t('quotations.newQuotation')}
        </Button>
      </div>

      <StatsGrid className="compact">
        <StatCard icon={FileText} label={t('common.total')} value={quotationTotals.count} />
        <StatCard icon={FileText} label={t('quotations.draft')} value={quotationTotals.draft} />
        <StatCard icon={Send} label={t('quotations.sent')} value={quotationTotals.sent} />
        <StatCard icon={CheckCircle} label={t('quotations.converted')} value={quotationTotals.converted} />
      </StatsGrid>

      <div className="quotations-content">
        <div className="ag-theme-quartz grid-fill">
          <AgGridReact theme="legacy"
            rowData={quotations}
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
            onRowDoubleClicked={(params) => navigate(`/quotations/${params.data.id}`)}
          />
        </div>
      </div>
    </div>
  );
}
