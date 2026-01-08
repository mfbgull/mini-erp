import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSettings } from '../../context/SettingsContext';
import {
  Users,
  TrendingUp,
  FileText,
  DollarSign,
  Calendar,
  Download,
  Filter
} from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry } from 'ag-grid-community';
import { ClientSideRowModelModule } from 'ag-grid-community';
import api from '../../utils/api';
import Button from '../../components/common/Button';
import DateRangePicker from '../../components/common/DateRangePicker';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import './SalesReports.css';

// Register AG Grid modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

export default function SalesByCustomerReport() {
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0]
  });
  const [showFilters, setShowFilters] = useState(false);
  const { formatCurrency } = useSettings();

  // Fetch sales by customer report
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['salesByCustomer', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('fromDate', dateRange.fromDate);
      params.append('toDate', dateRange.toDate);

      const response = await api.get(`/reports/sales-by-customer?${params}`);
      return response.data.data;
    }
  });

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    refetch();
  };

  const handleExport = (format = 'pdf') => {
    if (!reportData) {
      console.error('No data to export');
      return;
    }

    // Column definitions for export (matching the grid columns)
    const exportColumns = [
      {
        headerName: 'Customer Name',
        field: 'customer_name'
      },
      {
        headerName: 'Customer Code',
        field: 'customer_code'
      },
      {
        headerName: 'Email',
        field: 'email'
      },
      {
        headerName: 'Phone',
        field: 'phone'
      },
      {
        headerName: 'Total Invoices',
        field: 'total_invoices'
      },
      {
        headerName: 'Total Sales',
        field: 'total_sales',
        valueFormatter: (params) => formatCurrency(params.value || 0)
      },
      {
        headerName: 'Total Items',
        field: 'total_items'
      },
      {
        headerName: 'Avg. Order Value',
        field: 'average_order_value',
        valueFormatter: (params) => formatCurrency(params.value || 0)
      },
      {
        headerName: 'Last Purchase',
        field: 'last_purchase_date',
        valueFormatter: (params) => {
          return params.value ? new Date(params.value).toLocaleDateString() : '';
        }
      }
    ];

    if (format === 'pdf') {
      exportToPDF(
        reportData,
        exportColumns,
        'Sales by Customer Report',
        `sales-by-customer-${new Date().toISOString().split('T')[0]}.pdf`
      );
    } else if (format === 'excel') {
      exportToExcel(
        reportData,
        exportColumns,
        'Sales by Customer Report',
        `sales-by-customer-${new Date().toISOString().split('T')[0]}.csv`
      );
    }
  };

  // Column definitions for sales by customer data
  const columnDefs = [
    {
      headerName: 'Customer Name',
      field: 'customer_name',
      filter: true,
      flex: 1
    },
    {
      headerName: 'Customer Code',
      field: 'customer_code',
      filter: true,
      width: 140
    },
    {
      headerName: 'Email',
      field: 'email',
      filter: true,
      width: 200
    },
    {
      headerName: 'Phone',
      field: 'phone',
      filter: true,
      width: 140
    },
    {
      headerName: 'Total Invoices',
      field: 'total_invoices',
      filter: 'agNumberColumnFilter',
      width: 120,
      cellClass: 'number-cell'
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
      headerName: 'Total Items',
      field: 'total_items',
      filter: 'agNumberColumnFilter',
      width: 120,
      cellClass: 'number-cell'
    },
    {
      headerName: 'Avg. Order Value',
      field: 'average_order_value',
      filter: 'agNumberColumnFilter',
      width: 150,
      valueFormatter: (params) => formatCurrency(params.value || 0),
      cellClass: 'amount-cell'
    },
    {
      headerName: 'Last Purchase',
      field: 'last_purchase_date',
      filter: 'agDateColumnFilter',
      width: 140,
      valueFormatter: (params) => {
        return params.value ? new Date(params.value).toLocaleDateString() : '';
      }
    }
  ];

  return (
    <div className="sales-by-customer-report">
      <div className="page-header">
        <div>
          <h1>Sales by Customer Report</h1>
          <p className="page-subtitle">Analyze sales performance by customer</p>
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

            <Button type="submit" variant="primary" className="apply-filters-btn">
              Apply Filters
            </Button>
          </div>
        </form>
      )}

      <div className="report-content">
        {isLoading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : reportData && reportData.length > 0 ? (
          <div className="ag-theme-quartz" style={{ height: 600, width: '100%' }}>
            <AgGridReact
              rowData={reportData}
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
            <Users size={48} />
            <h3>No sales by customer data found</h3>
            <p>Try adjusting your filters to see customer sales data.</p>
          </div>
        )}
      </div>
    </div>
  );
}