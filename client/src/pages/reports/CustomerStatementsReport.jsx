import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSettings } from '../../context/SettingsContext';
import {
  Users,
  FileText,
  DollarSign,
  Calendar,
  Download,
  Filter,
  Eye,
  Edit,
  Plus
} from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry } from 'ag-grid-community';
import { ClientSideRowModelModule } from 'ag-grid-community';
import api from '../../utils/api';
import Button from '../../components/common/Button';
import DateRangePicker from '../../components/common/DateRangePicker';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import './CustomerStatementsReport.css';

// Register AG Grid modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

export default function CustomerStatementsReport() {
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0]
  });
  const [customerId, setCustomerId] = useState('');
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

  // Fetch customer statements report
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['customerStatements', dateRange, customerId],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('fromDate', dateRange.fromDate);
      params.append('toDate', dateRange.toDate);
      if (customerId) params.append('customerId', customerId);

      const response = await api.get(`/reports/customer-statements?${params}`);
      return response.data.data;
    }
  });

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    refetch();
  };

  const handleExport = (format = 'pdf') => {
    if (!reportData?.statements) {
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
        headerName: 'Opening Balance',
        field: 'opening_balance',
        valueFormatter: (params) => formatCurrency(params.value || 0)
      },
      {
        headerName: 'Total Debits',
        field: 'total_debits',
        valueFormatter: (params) => formatCurrency(params.value || 0)
      },
      {
        headerName: 'Total Credits',
        field: 'total_credits',
        valueFormatter: (params) => formatCurrency(params.value || 0)
      },
      {
        headerName: 'Closing Balance',
        field: 'closing_balance',
        valueFormatter: (params) => formatCurrency(params.value || 0)
      }
    ];

    if (format === 'pdf') {
      exportToPDF(
        reportData.statements,
        exportColumns,
        'Customer Statements Report',
        `customer-statements-${new Date().toISOString().split('T')[0]}.pdf`
      );
    } else if (format === 'excel') {
      exportToExcel(
        reportData.statements,
        exportColumns,
        'Customer Statements Report',
        `customer-statements-${new Date().toISOString().split('T')[0]}.csv`
      );
    }
  };

  // Column definitions for customer statements data
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
      headerName: 'Opening Balance',
      field: 'opening_balance',
      filter: 'agNumberColumnFilter',
      width: 150,
      valueFormatter: (params) => formatCurrency(params.value || 0),
      cellClass: 'amount-cell'
    },
    {
      headerName: 'Total Debits',
      field: 'total_debits',
      filter: 'agNumberColumnFilter',
      width: 140,
      valueFormatter: (params) => formatCurrency(params.value || 0),
      cellClass: 'amount-cell'
    },
    {
      headerName: 'Total Credits',
      field: 'total_credits',
      filter: 'agNumberColumnFilter',
      width: 140,
      valueFormatter: (params) => formatCurrency(params.value || 0),
      cellClass: 'amount-cell'
    },
    {
      headerName: 'Closing Balance',
      field: 'closing_balance',
      filter: 'agNumberColumnFilter',
      width: 150,
      valueFormatter: (params) => formatCurrency(params.value || 0),
      cellClass: 'amount-cell'
    }
  ];

  return (
    <div className="customer-statements-report">
      <div className="page-header">
        <div>
          <h1>Customer Statements Report</h1>
          <p className="page-subtitle">Detailed account statements for customers</p>
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
              <label>Customer</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="filter-select"
              >
                <option value="">All Customers</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.customer_name}
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

      <div className="report-content">
        {isLoading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : reportData?.statements && reportData.statements.length > 0 ? (
          <div className="ag-theme-quartz" style={{ height: 600, width: '100%' }}>
            <AgGridReact
              rowData={reportData.statements}
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
            <h3>No customer statement data found</h3>
            <p>Try adjusting your filters to see customer statement data.</p>
          </div>
        )}
      </div>
    </div>
  );
}