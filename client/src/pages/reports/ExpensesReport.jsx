import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSettings } from '../../context/SettingsContext';
import {
  FileText,
  DollarSign,
  Calendar,
  Download,
  Filter,
  BarChart3,
  Package,
  Building,
  User,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry } from 'ag-grid-community';
import { ClientSideRowModelModule } from 'ag-grid-community';
import api from '../../utils/api';
import Button from '../../components/common/Button';
import DateRangePicker from '../../components/common/DateRangePicker';
import SearchableSelect from '../../components/common/SearchableSelect';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import './ExpensesReport.css';

// Register AG Grid modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

export default function ExpensesReport() {
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0]
  });
  const [filters, setFilters] = useState({
    category: '',
    vendor: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const { formatCurrency } = useSettings();

  // Fetch expense categories for filter
  const { data: categories = [] } = useQuery({
    queryKey: ['expenseCategories'],
    queryFn: async () => {
      const response = await api.get('/expenses/categories');
      return response.data.data;
    }
  });

  // Fetch expenses report
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['expensesReport', dateRange, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('from_date', dateRange.fromDate);
      params.append('to_date', dateRange.toDate);
      if (filters.category) params.append('category', filters.category);
      if (filters.vendor) params.append('vendor', filters.vendor);

      const response = await api.get(`/reports/expenses?${params}`);
      return response.data.data;
    }
  });

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    refetch();
  };

  const handleExport = (format = 'pdf') => {
    if (!reportData?.expenses) {
      console.error('No data to export');
      return;
    }

    // Column definitions for export (only essential fields)
    const exportColumns = [
      {
        headerName: 'Date',
        field: 'expense_date',
        width: 20,
        valueFormatter: (params) => {
          return params.value ? new Date(params.value).toLocaleDateString() : '';
        }
      },
      {
        headerName: 'Expense No',
        field: 'expense_no',
        width: 25
      },
      {
        headerName: 'Category',
        field: 'expense_category',
        width: 25
      },
      {
        headerName: 'Description',
        field: 'description',
        width: 50
      },
      {
        headerName: 'Vendor',
        field: 'vendor_name',
        width: 30
      },
      {
        headerName: 'Amount',
        field: 'amount',
        width: 25,
        valueFormatter: (params) => formatCurrency(params.value || 0)
      },
      {
        headerName: 'Status',
        field: 'status',
        width: 20
      }
    ];

    const exportOptions = {
      summary: reportData.summary ? {
        totalAmount: reportData.summary.totalAmount,
        totalRecords: reportData.summary.totalExpenses,
        averageAmount: reportData.summary.averageAmount
      } : null,
      metadata: {
        dateRange: `${dateRange.fromDate} to ${dateRange.toDate}`,
        filters: {
          Category: filters.category || 'All',
          Vendor: filters.vendor || 'All'
        }
      }
    };

    if (format === 'pdf') {
      exportToPDF(
        reportData.expenses,
        exportColumns,
        'Expenses Report',
        `expenses-${new Date().toISOString().split('T')[0]}.pdf`,
        exportOptions
      );
    } else if (format === 'excel') {
      exportToExcel(
        reportData.expenses,
        exportColumns,
        'Expenses Report',
        `expenses-${new Date().toISOString().split('T')[0]}.csv`
      );
    }
  };

  // Column definitions for expenses data
  const columnDefs = [
    {
      headerName: 'Expense No',
      field: 'expense_no',
      filter: true,
      width: 140
    },
    {
      headerName: 'Category',
      field: 'expense_category',
      filter: true,
      width: 140
    },
    {
      headerName: 'Description',
      field: 'description',
      filter: true,
      flex: 1
    },
    {
      headerName: 'Amount',
      field: 'amount',
      filter: 'agNumberColumnFilter',
      width: 120,
      valueFormatter: (params) => formatCurrency(params.value || 0),
      cellClass: 'amount-cell'
    },
    {
      headerName: 'Date',
      field: 'expense_date',
      filter: 'agDateColumnFilter',
      width: 120,
      valueFormatter: (params) => {
        return params.value ? new Date(params.value).toLocaleDateString() : '';
      }
    },
    {
      headerName: 'Payment Method',
      field: 'payment_method',
      filter: true,
      width: 140
    },
    {
      headerName: 'Reference No',
      field: 'reference_no',
      filter: true,
      width: 120
    },
    {
      headerName: 'Vendor',
      field: 'vendor_name',
      filter: true,
      width: 140
    },
    {
      headerName: 'Project',
      field: 'project',
      filter: true,
      width: 120
    },
    {
      headerName: 'Status',
      field: 'status',
      filter: true,
      width: 120,
      cellClass: (params) => {
        const status = params.value?.toLowerCase();
        if (status === 'paid') return 'status-paid';
        if (status === 'approved') return 'status-partially-paid';
        if (status === 'pending') return 'status-unpaid';
        return 'status-cancelled';
      }
    }
  ];

  return (
    <div className="expenses-report">
      <div className="page-header">
        <div>
          <h1>Expenses Report</h1>
          <p className="page-subtitle">Detailed analysis of business expenses</p>
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
              label="Category"
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              options={[
                { value: '', label: 'All Categories' },
                ...categories.map(cat => ({ value: cat.category_name, label: cat.category_name }))
              ]}
              className="filter-select"
            />

            <div className="filter-group">
              <label>Vendor</label>
              <input
                type="text"
                value={filters.vendor}
                onChange={(e) => setFilters(prev => ({ ...prev, vendor: e.target.value }))}
                className="filter-select"
                placeholder="Search vendor..."
              />
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
                <DollarSign size={24} />
              </div>
              <div className="summary-text">
                <div className="summary-value">{formatCurrency(reportData.summary.totalAmount)}</div>
                <div className="summary-label">Total Expenses</div>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon">
                <FileText size={24} />
              </div>
              <div className="summary-text">
                <div className="summary-value">{reportData.summary.totalExpenses}</div>
                <div className="summary-label">Total Records</div>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon">
                <CheckCircle size={24} />
              </div>
              <div className="summary-text">
                <div className="summary-value">{formatCurrency(reportData.summary.averageAmount)}</div>
                <div className="summary-label">Average Expense</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {reportData?.categoryBreakdown && reportData.categoryBreakdown.length > 0 && (
        <div className="report-section">
          <h3>Category Breakdown</h3>
          <div className="category-breakdown">
            {reportData.categoryBreakdown.map((category, index) => (
              <div key={index} className="category-item">
                <div className="category-name">{category.expense_category}</div>
                <div className="category-amount">{formatCurrency(category.total_amount)}</div>
                <div className="category-count">({category.count} expenses)</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="report-content">
        {isLoading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : reportData?.expenses && reportData.expenses.length > 0 ? (
          <div className="ag-theme-quartz" style={{ height: 600, width: '100%' }}>
            <AgGridReact
              rowData={reportData.expenses}
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
            <FileText size={48} />
            <h3>No expenses data found</h3>
            <p>Try adjusting your filters to see expenses data.</p>
          </div>
        )}
      </div>
    </div>
  );
}