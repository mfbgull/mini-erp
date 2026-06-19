import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AgGridReact } from 'ag-grid-react';
import { format } from 'date-fns';
import { FileText, Send, CheckCircle, ArrowRight, Plus, Eye, Edit2, Trash2, MoreVertical } from 'lucide-react';

import Button from '../../components/common/Button';
import DropdownMenu from '../../components/common/DropdownMenu';
import StatCard, { StatsGrid } from '../../components/common/StatCard';
import { useSettings } from '../../context/SettingsContext';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import { useTranslation } from '../../hooks/useTranslation';
import { salesApi } from '../../utils/salesApi';
import { createActionColDef } from '../../utils/agGridIntegration';
import type { Quotation, QuotationTotals } from '../../utils/quotationTypes';
import './QuotationsPage.css';
import '../../styles/ag-grid-status-cells.css';
import { getStatusCellClass } from '../../utils/statusCellUtils';

export default function QuotationsPage() {
  const queryClient = useQueryClient();
  const { formatCurrency } = useSettings();
  const { t } = useTranslation();
  const navigate = useNavigate();
  useKeyboardShortcut('Alt+N', () => {
    navigate('/quotations/create');
  }, { context: 'quotations', id: 'quotations-new', label: 'New quotation' });

  const { data: quotations = [], isLoading } = useQuery<Quotation[]>({
    queryKey: ['quotations'],
    queryFn: async () => {
      const response = await salesApi.getQuotations();
      return Array.isArray(response) ? response : (response.data || []);
    }
  });

  const quotationTotals: QuotationTotals = {
    count: quotations.length,
    total: quotations.reduce((sum, q) => sum + parseFloat(String(q.total_amount || 0)), 0),
    draft: quotations.filter(q => q.status === 'Draft').length,
    sent: quotations.filter(q => q.status === 'Sent').length,
    converted: quotations.filter(q => q.status === 'Converted').length
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return salesApi.deleteQuotation(id);
    },
    onSuccess: () => {
      toast.success(t('quotations.deleted'));
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || t('quotations.failed'));
    }
  });

  const handleDelete = (quotation: Quotation) => {
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
      cellRenderer: (params: { value: string; data: Quotation }) => (
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
      valueFormatter: (params: { value: string }) => params.value ? format(new Date(params.value), 'dd MMM yyyy') : ''
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
      valueFormatter: (params: { value: string }) => params.value ? format(new Date(params.value), 'dd MMM yyyy') : '-'
    },
    {
      headerName: t('quotations.amount'),
      field: 'total_amount',
      sortable: true,
      width: 120,
      type: 'rightAligned',
      valueFormatter: (params: { value: number | string }) => formatCurrency(parseFloat(String(params.value || 0)))
    },
    {
      headerName: t('quotations.status'),
      field: 'status',
      sortable: true,
      filter: true,
      width: 100,
      cellRenderer: (params: { value: string }) => params.value,
      cellClass: (params: { value: string }) => getStatusCellClass(params.value),
    },
    createActionColDef({
      headerName: t('quotations.actions'),
      cellRenderer: (params: { data: Quotation }) => (
        <DropdownMenu
          trigger={
            <button className="action-menu-trigger" title={t('quotations.actions')}>
              <MoreVertical size={16} />
            </button>
          }
          items={[
            { label: t('quotations.viewDetails'), icon: <Eye size={16} />, onClick: () => navigate(`/quotations/${params.data.id}`) },
            { label: t('quotations.edit'), icon: <Edit2 size={16} />, onClick: () => navigate(`/quotations/${params.data.id}/edit`) },
            ...(params.data.status !== 'Converted'
              ? [{ label: t('quotations.convertToSo'), icon: <ArrowRight size={16} />, onClick: () => navigate(`/quotations/${params.data.id}/convert`) }]
              : []),
            { label: t('quotations.delete'), icon: <Trash2 size={16} />, onClick: () => handleDelete(params.data), destructive: true },
          ]}
          align="end"
        />
      ),
    })
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
          onClick={() => navigate('/quotations/create')}
        >
          <Plus size={18} /> {t('quotations.newQuotation')}
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
          <AgGridReact
            rowData={quotations}
            columnDefs={columnDefs as any}
            defaultColDef={{
              resizable: true,
              sortable: true,
              filter: true
            }}
            pagination={true}
            paginationPageSize={15}
            paginationPageSizeSelector={[10, 15, 25, 50]}
            rowSelection={{ mode: 'singleRow' } as const}
            animateRows={true}
            loading={isLoading}
            onRowDoubleClicked={(params: { data: Quotation }) => navigate(`/quotations/${params.data.id}`)}
          />
        </div>
      </div>
    </div>
  );
}
