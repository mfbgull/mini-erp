import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { AgGridReact } from 'ag-grid-react';
import { format } from 'date-fns';
import {
  RotateCcw,
  Search,
  CalendarDays,
  Package,
  Filter,
} from 'lucide-react';

import Button from '../../components/common/Button';
import FormInput from '../../components/common/FormInput';
import { useSettings } from '../../context/SettingsContext';
import { useTranslation } from '../../hooks/useTranslation';
import api from '../../utils/api';
import './PurchasesPage.css';
import '../../styles/ag-grid-status-cells.css';

interface ReturnRecord {
  id: number;
  movement_no: string;
  item_id: number;
  warehouse_id: number;
  quantity: number;
  unit_cost: number;
  reference_doctype: string;
  reference_docno: string;
  remarks: string;
  return_date: string;
  created_at: string;
  created_by: number;
  item_code: string;
  item_name: string;
  unit_of_measure: string;
  warehouse_code: string;
  warehouse_name: string;
  created_by_username: string;
}

export default function PurchaseReturnHistory() {
  const { formatCurrency } = useSettings();
  const { t } = useTranslation();

  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    item_id: '',
  });

  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const response = await api.get('/inventory/items');
      return response.data.data || [];
    },
  });

  const { data: returns = [], isLoading } = useQuery({
    queryKey: ['purchase-returns', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.item_id) params.append('item_id', filters.item_id);
      const response = await api.get(`/purchases/returns?${params.toString()}`);
      return response.data || [];
    },
  });

  const columnDefs = [
    {
      headerName: 'Return Date',
      field: 'return_date',
      sortable: true,
      filter: 'agDateColumnFilter',
      flex: 1.2,
      valueFormatter: (params: any) =>
        params.value ? format(new Date(params.value), 'dd MMM yyyy') : '—',
    },
    {
      headerName: 'Type',
      field: 'reference_doctype',
      sortable: true,
      filter: true,
      flex: 1,
      cellRenderer: (params: any) => {
        const type = params.value;
        return type === 'PURCHASE_RETURN' ? 'Purchase Return' : 'PO Return';
      },
      cellClass: 'cell-status-cancelled',
    },
    {
      headerName: 'Reference',
      field: 'reference_docno',
      sortable: true,
      filter: true,
      flex: 1.5,
    },
    {
      headerName: 'Item',
      field: 'item_name',
      sortable: true,
      filter: true,
      flex: 2,
      valueFormatter: (params: any) =>
        `${params.data?.item_code || ''} - ${params.value || ''}`,
    },
    {
      headerName: 'Quantity',
      field: 'quantity',
      sortable: true,
      filter: 'agNumberColumnFilter',
      flex: 1,
      valueFormatter: (params: any) =>
        `${Math.abs(Number(params.value)).toFixed(3)} ${params.data?.unit_of_measure || ''}`,
    },
    {
      headerName: 'Unit Cost',
      field: 'unit_cost',
      sortable: true,
      filter: 'agNumberColumnFilter',
      flex: 1,
      valueFormatter: (params: any) => formatCurrency(Number(params.value) || 0),
    },
    {
      headerName: 'Total Value',
      field: 'total_value',
      sortable: false,
      flex: 1,
      valueGetter: (params: any) => Math.abs(Number(params.data?.quantity || 0)) * Number(params.data?.unit_cost || 0),
      valueFormatter: (params: any) => formatCurrency(params.value || 0),
      cellClass: 'cell-status-cancelled',
      cellStyle: { fontWeight: 600 },
    },
    {
      headerName: 'Warehouse',
      field: 'warehouse_name',
      sortable: true,
      filter: true,
      flex: 1.2,
    },
    {
      headerName: 'Created By',
      field: 'created_by_username',
      sortable: true,
      flex: 1,
    },
  ];

  return (
    <div className="purchases-page">
      <div className="page-header">
        <div>
          <h1>Purchase Returns</h1>
          <p className="page-subtitle">
            View history of all purchase return transactions
          </p>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '8px' }}>
          <span style={{
            background: '#fef3c7',
            color: '#92400e',
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px'
          }}>
            <RotateCcw size={16} />
            {returns.length} Returns
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-row" style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '16px',
        flexWrap: 'wrap',
        alignItems: 'flex-end'
      }}>
        <div style={{ minWidth: '180px', flex: 1 }}>
          <FormInput
            label="Start Date"
            name="start_date"
            type="date"
            value={filters.start_date}
            onChange={(e: any) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
          />
        </div>
        <div style={{ minWidth: '180px', flex: 1 }}>
          <FormInput
            label="End Date"
            name="end_date"
            type="date"
            value={filters.end_date}
            onChange={(e: any) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
          />
        </div>
        <div style={{ minWidth: '200px', flex: 1 }}>
          <FormInput
            label="Item"
            name="item_id"
            type="searchable-select"
            value={filters.item_id}
            onChange={(e: any) => setFilters(prev => ({ ...prev, item_id: e.target.value }))}
            options={items.map((item: any) => ({
              value: String(item.id),
              label: `${item.item_code} - ${item.item_name}`,
            }))}
            placeholder="All Items"
          />
        </div>
        <button
          className="quick-action-btn"
          onClick={() => setFilters({ start_date: '', end_date: '', item_id: '' })}
          style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e9ecef', background: 'white', cursor: 'pointer', fontSize: '13px', marginBottom: '2px' }}
        >
          Clear Filters
        </button>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading return history...</p>
        </div>
      ) : (
        <div className="ag-theme-quartz ag-grid-container">
          <AgGridReact
           
            rowData={returns}
            columnDefs={columnDefs}
            defaultColDef={{
              resizable: true,
            }}
            pagination={true}
            paginationPageSize={20}
            paginationPageSizeSelector={[10, 20, 50, 100]}
            noRowsOverlayComponent={() => (
              <div className="no-rows" style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                <RotateCcw size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <h3>No Returns Found</h3>
                <p>No purchase returns match the current filters.</p>
              </div>
            )}
          />
        </div>
      )}
    </div>
  );
}
