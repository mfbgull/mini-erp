import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSettings } from '../../context/SettingsContext';
import {
  TrendingUp,
  FileText,
  Users,
  Package,
  Calendar,
  Download,
  Filter,
  BarChart3,
  DollarSign
} from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry } from 'ag-grid-community';
import { ClientSideRowModelModule } from 'ag-grid-community';
import api from '../../utils/api';
import Button from '../../components/common/Button';
import SearchableSelect from '../../components/common/SearchableSelect';
import DateRangePicker from '../../components/common/DateRangePicker';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import './SalesReports.css';

// Register AG Grid modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

export default function SalesSummaryReport() {
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0]
  });
  const [customerIds, setCustomerIds] = useState([]);
  const [itemIds, setItemIds] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const { formatCurrency } = useSettings();

  // Fetch customers for filter
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await api.get('/customers');
      return response.data.data || [];
    }
  });

  // Fetch all items first, then filter for Finished Good on client side
  const { data: allItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['items-all'],
    queryFn: async () => {
      const response = await api.get('/inventory/items');
      console.log('Items API response:', response.data);
      return response.data.data || [];
    }
  });

  // Filter items for Finished Good on client side
  const items = allItems.filter(item => item.is_finished_good === 1 || item.is_finished_good === true);
  console.log('Filtered Finished Good items:', items);

  // Fetch sales summary report
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['salesSummary', dateRange, customerIds, itemIds],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('fromDate', dateRange.fromDate);
      params.append('toDate', dateRange.toDate);
      if (customerIds.length > 0) {
        customerIds.forEach(id => params.append('customerIds', String(id)));
      }
      if (itemIds.length > 0) {
        itemIds.forEach(id => params.append('itemIds', String(id)));
      }

      const response = await api.get(`/reports/sales-summary?${params}`);
      return response.data.data;
    }
  });

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    refetch();
  };

  const handleExport = (format = 'pdf') => {
    if (!reportData?.sales) {
      console.error('No data to export');
      return;
    }

    // Column definitions for export (matching the grid columns)
    const exportColumns = [
      {
        headerName: 'Invoice Date',
        field: 'invoice_date',
        valueFormatter: (params) => {
          return params.value ? new Date(params.value).toLocaleDateString() : '';
        }
      },
      {
        headerName: 'Invoice No',
        field: 'invoice_no'
      },
      {
        headerName: 'Customer',
        field: 'customer_name'
      },
      {
        headerName: 'Total Sales',
        field: 'total_sales',
        valueFormatter: (params) => formatCurrency(params.value || 0)
      },
      {
        headerName: 'Items',
        field: 'total_items'
      },
      {
        headerName: 'Paid Amount',
        field: 'paid_amount',
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
        reportData.sales,
        exportColumns,
        'Sales Summary Report',
        `sales-summary-${new Date().toISOString().split('T')[0]}.pdf`
      );
    } else if (format === 'excel') {
      exportToExcel(
        reportData.sales,
        exportColumns,
        'Sales Summary Report',
        `sales-summary-${new Date().toISOString().split('T')[0]}.csv`
      );
    }
  };

  // Column definitions for sales data
  const columnDefs = [
    {
      headerName: 'Invoice Date',
      field: 'invoice_date',
      filter: 'agDateColumnFilter',
      width: 120,
      valueFormatter: (params) => {
        return params.value ? new Date(params.value).toLocaleDateString() : '';
      }
    },
    {
      headerName: 'Invoice No',
      field: 'invoice_no',
      filter: true,
      width: 120
    },
    {
      headerName: 'Customer',
      field: 'customer_name',
      filter: true,
      flex: 1
    },
    {
      headerName: 'Total Sales',
      field: 'total_sales',
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
      headerName: 'Paid Amount',
      field: 'paid_amount',
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
        if (status === 'paid') return 'status-paid';
        if (status === 'partially paid') return 'status-partially-paid';
        if (status === 'overdue') return 'status-overdue';
        return 'status-unpaid';
      }
    }
  ];

  return (
    <div className="sales-summary-report">
      <div className="page-header">
        <div>
          <h1>Sales Summary Report</h1>
          <p className="page-subtitle">Comprehensive analysis of sales performance</p>
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

            <SearchableSelect
              label="Customer"
              name="customer"
              value={customerIds}
              onChange={(e) => setCustomerIds(e.target.value)}
              options={customers.map(c => ({ value: c.id, label: c.customer_name }))}
              placeholder="Search customers..."
              multiple={true}
              loading={customers.length === 0}
            />

            <SearchableSelect
              label="Item"
              name="item"
              value={itemIds}
              onChange={(e) => setItemIds(e.target.value)}
              options={items.map(i => ({ value: i.id, label: i.item_name }))}
              placeholder="Search items..."
              multiple={true}
              loading={itemsLoading}
            />

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
                <div className="summary-value">{reportData.summary.totalInvoices}</div>
                <div className="summary-label">Total Invoices</div>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon">
                <DollarSign size={24} />
              </div>
              <div className="summary-text">
                <div className="summary-value">{formatCurrency(reportData.summary.totalSales)}</div>
                <div className="summary-label">Total Sales</div>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon">
                <Package size={24} />
              </div>
              <div className="summary-text">
                <div className="summary-value">{reportData.summary.totalItemsSold}</div>
                <div className="summary-label">Items Sold</div>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon">
                <TrendingUp size={24} />
              </div>
              <div className="summary-text">
                <div className="summary-value">{formatCurrency(reportData.summary.averageInvoiceValue)}</div>
                <div className="summary-label">Avg. Invoice Value</div>
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
        ) : reportData?.sales && reportData.sales.length > 0 ? (
          <div className="ag-theme-quartz" style={{ height: 600, width: '100%' }}>
            <AgGridReact
              rowData={reportData.sales || []}
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
            <BarChart3 size={48} />
            <h3>No sales data found</h3>
            <p>Try adjusting your filters to see sales data.</p>
          </div>
        )}
      </div>
    </div>
  );
}