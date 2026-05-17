import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { ModuleRegistry , ClientSideRowModelModule } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
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
  CheckCircle,
  X
} from 'lucide-react';

import Button from '../../components/common/Button';
import DateRangePicker from '../../components/common/DateRangePicker';
import SearchableSelect from '../../components/common/SearchableSelect';
import { useSettings } from '../../context/SettingsContext';
import api from '../../utils/api';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import './ExpensesReport.css';

// Register AG Grid modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

function ExpenseCard({ expense, formatCurrency }) {
  const [showDetails, setShowDetails] = useState(false);

  const statusClass = `expense-status status-${expense.status?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <>
      <div className="compact-expense-card" onClick={() => setShowDetails(true)}>
        <div className="compact-expense-info">
          <p className="compact-expense-no">{expense.expense_no}</p>
          <span className="compact-expense-category">{expense.expense_category}</span>
        </div>
        <div className="compact-expense-right">
          <span className="compact-expense-amount">{formatCurrency(expense.amount)}</span>
          <span className={statusClass}>{expense.status}</span>
        </div>
      </div>

      {showDetails && (
        <div className="item-preview-overlay" onClick={() => setShowDetails(false)}>
          <div className="item-preview-container" onClick={(e) => e.stopPropagation()}>
            <div className="swipe-indicator"></div>

            <div className="item-preview-header">
              <div className="item-preview-title-section">
                <h2 className="item-preview-title">{expense.expense_no}</h2>
                <span className="item-preview-code">{expense.expense_category}</span>
              </div>
              <button className="item-preview-close" onClick={() => setShowDetails(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="item-preview-content">
              <div className="item-preview-stats">
                <div className="preview-stat">
                  <span className="preview-stat-label">Amount</span>
                  <span className="preview-stat-value expense-amount-highlight">{formatCurrency(expense.amount)}</span>
                </div>
                <div className="preview-stat">
                  <span className="preview-stat-label">Status</span>
                  <span className={statusClass}>{expense.status}</span>
                </div>
                <div className="preview-stat">
                  <span className="preview-stat-label">Date</span>
                  <span className="preview-stat-value">{new Date(expense.expense_date).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="preview-details-grid">
                {expense.description && (
                  <div className="preview-detail-item full-width">
                    <span className="preview-detail-label">Description</span>
                    <span className="preview-detail-value">{expense.description}</span>
                  </div>
                )}
                {expense.vendor_name && (
                  <div className="preview-detail-item">
                    <span className="preview-detail-label">Vendor</span>
                    <span className="preview-detail-value">{expense.vendor_name}</span>
                  </div>
                )}
                {expense.payment_method && (
                  <div className="preview-detail-item">
                    <span className="preview-detail-label">Payment Method</span>
                    <span className="preview-detail-value">{expense.payment_method}</span>
                  </div>
                )}
                {expense.reference_no && (
                  <div className="preview-detail-item">
                    <span className="preview-detail-label">Reference No</span>
                    <span className="preview-detail-value">{expense.reference_no}</span>
                  </div>
                )}
                {expense.project && (
                  <div className="preview-detail-item">
                    <span className="preview-detail-label">Project</span>
                    <span className="preview-detail-value">{expense.project}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

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
          <>
            {/* Desktop view - AG Grid */}
            <div className="ag-theme-quartz desktop-view ag-grid-container">
              <AgGridReact
                rowData={reportData.expenses}
                columnDefs={columnDefs}
                defaultColDef={{
                  theme:"legacy",
                  resizable: true,
                  sortable: true,
                  filter: true
                }}
                pagination={true}
                paginationPageSize={20}
                paginationPageSizeSelector={[10, 20, 50, 100]}
                rowSelection={{ mode: 'singleRow' }}
                onGridReady={(params) => {
                  // Check if the grid is visible before sizing columns
                  setTimeout(() => {
                    if (params.api && params.columnApi) {
                      const gridElement = params.api.gridCore.ctrl.main.querySelectorAll('.ag-body-viewport')[0];
                      if (gridElement && gridElement.clientWidth > 0) {
                        params.columnApi.autoSizeAllColumns();
                      }
                    }
                  }, 100); // Small delay to ensure grid is rendered
                }}
              />
            </div>

            {/* Mobile view - Compact cards */}
            <div className="mobile-expenses-list">
              {reportData.expenses.map((expense) => (
                <ExpenseCard key={expense.id} expense={expense} formatCurrency={formatCurrency} />
              ))}
            </div>
          </>
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