import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSettings } from '../../context/SettingsContext';
import {
  ShoppingCart,
  TrendingUp,
  FileText,
  DollarSign,
  Calendar,
  Download,
  Filter,
  BarChart3,
  Package
} from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry } from 'ag-grid-community';
import { ClientSideRowModelModule } from 'ag-grid-community';
import api from '../../utils/api';
import Button from '../../components/common/Button';
import DateRangePicker from '../../components/common/DateRangePicker';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import './PurchaseSummaryReport.css';

// Register AG Grid modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

export default function PurchaseSummaryReport() {
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0]
  });
  const [supplierId, setSupplierId] = useState('');
  const [itemId, setItemId] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { formatCurrency } = useSettings();

  // Fetch suppliers for filter
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const response = await api.get('/suppliers');
      return response.data.data || [];
    }
  });

  // Fetch items for filter
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const response = await api.get('/inventory/items');
      console.log('Items API response:', response.data);
      return response.data.data || [];
    }
  });

  // Fetch purchase summary report
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['purchaseSummary', dateRange, supplierId, itemId],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('fromDate', dateRange.fromDate);
      params.append('toDate', dateRange.toDate);
      if (supplierId) params.append('supplierId', supplierId);
      if (itemId) params.append('itemId', itemId);

      const response = await api.get(`/reports/purchase-summary?${params}`);
      return response.data.data;
    }
  });

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    refetch();
  };

  const handleExport = (format = 'pdf') => {
    if (!reportData?.purchases) {
      console.error('No data to export');
      return;
    }

    // Column definitions for export (matching the grid columns)
    const exportColumns = [
      {
        headerName: 'PO Date',
        field: 'purchase_date',
        valueFormatter: (params) => {
          return params.value ? new Date(params.value).toLocaleDateString() : '';
        }
      },
      {
        headerName: 'PO Number',
        field: 'purchase_order_number'
      },
      {
        headerName: 'Supplier',
        field: 'supplier_name'
      },
      {
        headerName: 'Total Cost',
        field: 'total_cost',
        valueFormatter: (params) => formatCurrency(params.value || 0)
      },
      {
        headerName: 'Items',
        field: 'total_items'
      },
      {
        headerName: 'Received Amount',
        field: 'received_amount',
        valueFormatter: (params) => formatCurrency(params.value || 0)
      },
      {
        headerName: 'Balance',
        field: 'balance_amount',
        valueFormatter: (params) => formatCurrency(params.value || 0)
      },
      {
        headerName: 'Status',
        field: 'status'
      }
    ];

    if (format === 'pdf') {
      exportToPDF(
        reportData.purchases,
        exportColumns,
        'Purchase Summary Report',
        `purchase-summary-${new Date().toISOString().split('T')[0]}.pdf`
      );
    } else if (format === 'excel') {
      exportToExcel(
        reportData.purchases,
        exportColumns,
        'Purchase Summary Report',
        `purchase-summary-${new Date().toISOString().split('T')[0]}.csv`
      );
    }
  };

  // Column definitions for purchase data
  const columnDefs = [
    {
      headerName: 'PO Date',
      field: 'purchase_date',
      filter: 'agDateColumnFilter',
      width: 120,
      valueFormatter: (params) => {
        return params.value ? new Date(params.value).toLocaleDateString() : '';
      }
    },
    {
      headerName: 'PO Number',
      field: 'purchase_order_number',
      filter: true,
      width: 140
    },
    {
      headerName: 'Supplier',
      field: 'supplier_name',
      filter: true,
      flex: 1
    },
    {
      headerName: 'Total Cost',
      field: 'total_cost',
      filter: 'agNumberColumnFilter',
      width: 140,
      valueFormatter: (params) => formatCurrency(params.value || 0),
      cellClass: 'amount-cell'
    },
    {
      headerName: 'Items',
      field: 'total_items',
      filter: 'agNumberColumnFilter',
      width: 100,
      cellClass: 'number-cell'
    },
    {
      headerName: 'Received Amount',
      field: 'received_amount',
      filter: 'agNumberColumnFilter',
      width: 140,
      valueFormatter: (params) => formatCurrency(params.value || 0),
      cellClass: 'amount-cell'
    },
    {
      headerName: 'Balance',
      field: 'balance_amount',
      filter: 'agNumberColumnFilter',
      width: 140,
      valueFormatter: (params) => formatCurrency(params.value || 0),
      cellClass: 'amount-cell'
    },
    {
      headerName: 'Status',
      field: 'status',
      filter: true,
      width: 120,
      cellClass: (params) => {
        const status = params.value?.toLowerCase();
        if (status === 'completed') return 'status-paid';
        if (status === 'partially received') return 'status-partially-paid';
        if (status === 'pending') return 'status-unpaid';
        return '';
      }
    }
  ];

  return (
    <div className="purchase-summary-report">
      <div className="page-header">
        <div>
          <h1>Purchase Summary Report</h1>
          <p className="page-subtitle">Comprehensive analysis of purchase performance</p>
        </div>
      </div>

      <div className="report-controls">
        <Button
          variant="secondary"
          onClick={() => setShowFilters(!showFilters)}
          className="filter-toggle"
        >
          <Filter size={18} />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>

        <div className="export-buttons">
          <Button
            variant="secondary"
            onClick={() => handleExport('pdf')}
            className="export-btn"
          >
            <Download size={18} />
            Export PDF
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleExport('excel')}
            className="export-btn"
          >
            <Download size={18} />
            Export Excel
          </Button>
        </div>
      </div>

      {showFilters && (
        <form onSubmit={handleFilterSubmit} className="report-filters">
          <div className="filter-row">
            <DateRangePicker
              fromDate={dateRange.fromDate}
              toDate={dateRange.toDate}
              onFromDateChange={(date) => setDateRange(prev => ({ ...prev, fromDate: date }))}
              onToDateChange={(date) => setDateRange(prev => ({ ...prev, toDate: date }))}
            />

            <div className="filter-group">
              <label>Supplier</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="filter-select"
              >
                <option value="">All Suppliers</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.supplier_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Item</label>
              <select
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                className="filter-select"
              >
                <option value="">All Items</option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.item_name}
                  </option>
                ))}
              </select>
            </div>

            <Button type="submit" variant="primary" className="apply-filters-btn">
              Apply Filters
            </Button>
          </div>
        </form>
      )}

      {reportData?.summary && (
        <div className="report-summary">
          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon">
                <FileText size={24} />
              </div>
              <div className="summary-text">
                <div className="summary-value">{reportData.summary.totalOrders}</div>
                <div className="summary-label">Total Orders</div>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon">
                <DollarSign size={24} />
              </div>
              <div className="summary-text">
                <div className="summary-value">{formatCurrency(reportData.summary.totalCost)}</div>
                <div className="summary-label">Total Purchase Cost</div>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon">
                <Package size={24} />
              </div>
              <div className="summary-text">
                <div className="summary-value">{reportData.summary.totalItems}</div>
                <div className="summary-label">Items Purchased</div>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon">
                <TrendingUp size={24} />
              </div>
              <div className="summary-text">
                <div className="summary-value">{formatCurrency(reportData.summary.averageOrderValue)}</div>
                <div className="summary-label">Avg. Order Value</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="report-content">
        {isLoading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : reportData?.purchases && reportData.purchases.length > 0 ? (
          <div className="ag-theme-quartz" style={{ height: 600, width: '100%' }}>
            <AgGridReact
              rowData={reportData.purchases || []}
              columnDefs={columnDefs}
              defaultColDef={{
                resizable: true,
                sortable: true,
                filter: true
              }}
              pagination={true}
              paginationPageSize={20}
              paginationPageSizeSelector={[10, 20, 50, 100]}
              rowSelection={{ mode: 'singleRow' }}
              onGridReady={(params) => {
                params.api.sizeColumnsToFit({
                  defaultMinWidth: 100,
                  columnLimits: []
                });
              }}
            />
          </div>
        ) : (
          <div className="no-data">
            <ShoppingCart size={48} />
            <h3>No purchase data found</h3>
            <p>Try adjusting your filters to see purchase data.</p>
          </div>
        )}
      </div>
    </div>
  );
}