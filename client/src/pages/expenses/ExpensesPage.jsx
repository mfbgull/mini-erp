import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useSettings } from '../../context/SettingsContext';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Download,
  Calendar,
  DollarSign,
  Package,
  User,
  Building,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreVertical
} from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry } from 'ag-grid-community';
import { ClientSideRowModelModule } from 'ag-grid-community';
import api from '../../utils/api';
import Button from '../../components/common/Button';
import FormInput from '../../components/common/FormInput';
import DateRangePicker from '../../components/common/DateRangePicker';
import Modal from '../../components/common/Modal';
import SearchableSelect from '../../components/common/SearchableSelect';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import './Expenses.css';

// Register AG Grid modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

export default function ExpensesPage() {
  const [showFilters, setShowFilters] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [expenseForm, setExpenseForm] = useState({
    expense_category: '',
    description: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    payment_method: '',
    reference_no: '',
    vendor_name: '',
    project: '',
    status: 'Approved'
  });
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0]
  });
  const [filters, setFilters] = useState({
    category: '',
    vendor: '',
    status: ''
  });
  
  const queryClient = useQueryClient();
  const { formatCurrency } = useSettings();

  // Fetch expenses
  const { data: expenses = [], isLoading, refetch } = useQuery({
    queryKey: ['expenses', dateRange, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('from_date', dateRange.fromDate);
      params.append('to_date', dateRange.toDate);
      if (filters.category) params.append('category', filters.category);
      if (filters.vendor) params.append('vendor', filters.vendor);
      if (filters.status) params.append('status', filters.status);
      params.append('page', '1');
      params.append('limit', '1000'); // Get all expenses for the date range

      const response = await api.get(`/expenses?${params}`);
      return response.data.data;
    }
  });

  // Fetch expense categories
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ['expenseCategories'],
    queryFn: async () => {
      const response = await api.get('/expenses/categories');
      return response.data.data;
    }
  });

  // Fetch expense status options
  const { data: statusOptions = [], isLoading: statusLoading, error: statusError } = useQuery({
    queryKey: ['expenseStatusOptions'],
    queryFn: async () => {
      const response = await api.get('/expenses/status-options');
      return response.data.data;
    }
  });

  // Fetch expense payment method options
  const { data: paymentMethodOptions = [], isLoading: paymentLoading, error: paymentError } = useQuery({
    queryKey: ['expensePaymentMethodOptions'],
    queryFn: async () => {
      const response = await api.get('/expenses/payment-method-options');
      return response.data.data;
    }
  });

  // Create expense mutation
  const createExpenseMutation = useMutation({
    mutationFn: (expenseData) => api.post('/expenses', expenseData),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      setShowExpenseModal(false);
      resetForm();
    }
  });

  // Update expense mutation
  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/expenses/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      setShowExpenseModal(false);
      resetForm();
    }
  });

  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: (id) => api.delete(`/expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
    }
  });

  const resetForm = () => {
    setExpenseForm({
      expense_category: '',
      description: '',
      amount: '',
      expense_date: new Date().toISOString().split('T')[0],
      payment_method: '',
      reference_no: '',
      vendor_name: '',
      project: '',
      status: 'Approved'
    });
    setSelectedExpense(null);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    // Client-side validation
    if (!expenseForm.expense_category) {
      alert('Please select an expense category');
      return;
    }

    if (!expenseForm.amount || isNaN(parseFloat(expenseForm.amount)) || parseFloat(expenseForm.amount) <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }

    if (!expenseForm.expense_date) {
      alert('Please select an expense date');
      return;
    }

    const expenseData = {
      ...expenseForm,
      amount: parseFloat(expenseForm.amount)
    };

    if (selectedExpense) {
      updateExpenseMutation.mutate({ id: selectedExpense.id, data: expenseData });
    } else {
      createExpenseMutation.mutate(expenseData);
    }
  };

  const handleEdit = (expense) => {
    setSelectedExpense(expense);
    setExpenseForm({
      expense_category: expense.expense_category,
      description: expense.description,
      amount: expense.amount,
      expense_date: expense.expense_date,
      payment_method: expense.payment_method,
      reference_no: expense.reference_no,
      vendor_name: expense.vendor_name,
      project: expense.project,
      status: expense.status
    });
    setShowExpenseModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      deleteExpenseMutation.mutate(id);
    }
  };

  const handleExport = (format = 'pdf') => {
    if (!expenses || expenses.length === 0) {
      console.error('No data to export');
      return;
    }

    // Column definitions for export (matching the grid columns)
    const exportColumns = [
      {
        headerName: 'Expense No',
        field: 'expense_no'
      },
      {
        headerName: 'Category',
        field: 'expense_category'
      },
      {
        headerName: 'Description',
        field: 'description'
      },
      {
        headerName: 'Amount',
        field: 'amount',
        valueFormatter: (params) => formatCurrency(params.value || 0)
      },
      {
        headerName: 'Date',
        field: 'expense_date',
        valueFormatter: (params) => {
          return params.value ? new Date(params.value).toLocaleDateString() : '';
        }
      },
      {
        headerName: 'Payment Method',
        field: 'payment_method'
      },
      {
        headerName: 'Reference No',
        field: 'reference_no'
      },
      {
        headerName: 'Vendor',
        field: 'vendor_name'
      },
      {
        headerName: 'Project',
        field: 'project'
      },
      {
        headerName: 'Status',
        field: 'status'
      }
    ];

    if (format === 'pdf') {
      exportToPDF(
        expenses,
        exportColumns,
        'Expenses Report',
        `expenses-${new Date().toISOString().split('T')[0]}.pdf`
      );
    } else if (format === 'excel') {
      exportToExcel(
        expenses,
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
    },
    {
      headerName: 'Actions',
      field: 'actions',
      width: 120,
      cellRenderer: (params) => (
        <div className="action-buttons">
          <button
            className="action-btn edit-btn"
            onClick={() => handleEdit(params.data)}
            title="Edit Expense"
          >
            <Edit size={16} />
          </button>
          <button
            className="action-btn delete-btn"
            onClick={() => handleDelete(params.data.id)}
            title="Delete Expense"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
      sortable: false,
      filter: false
    }
  ];

  return (
    <div className="expenses-page">
      <div className="page-header">
        <div>
          <h1>Expenses</h1>
          <p className="page-subtitle">Track and manage business expenses</p>
        </div>
      </div>

      <div className="expenses-controls">
        <div className="expenses-actions">
          <Button
            variant="primary"
            onClick={() => {
              resetForm();
              setShowExpenseModal(true);
            }}
            className="add-expense-btn"
          >
            <Plus size={18} />
            Add Expense
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

        <div className="expenses-filters">
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
            className="filter-toggle"
          >
            <Filter size={18} />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="expenses-filter-section">
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

            <FormInput
              label="Vendor"
              type="text"
              value={filters.vendor}
              onChange={(e) => setFilters(prev => ({ ...prev, vendor: e.target.value }))}
              placeholder="Search vendor..."
            />

            <SearchableSelect
              label="Status"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              options={[
                { value: '', label: 'All Statuses' },
                ...statusOptions.map(option => ({ value: option.value, label: option.label }))
              ]}
              className="filter-select"
            />

            <Button
              variant="primary"
              onClick={refetch}
              className="apply-filters-btn"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      )}

      <div className="expenses-summary">
        <div className="summary-card">
          <div className="summary-content">
            <div className="summary-icon">
              <DollarSign size={24} />
            </div>
            <div className="summary-text">
              <div className="summary-value">
                {formatCurrency(expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0))}
              </div>
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
              <div className="summary-value">{expenses.length}</div>
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
              <div className="summary-value">
                {expenses.filter(exp => exp.status === 'Paid').length}
              </div>
              <div className="summary-label">Paid Expenses</div>
            </div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-content">
            <div className="summary-icon">
              <AlertCircle size={24} />
            </div>
            <div className="summary-text">
              <div className="summary-value">
                {expenses.filter(exp => exp.status !== 'Paid').length}
              </div>
              <div className="summary-label">Pending Expenses</div>
            </div>
          </div>
        </div>
      </div>

      <div className="expenses-content">
        {isLoading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : expenses.length > 0 ? (
          <div className="ag-theme-quartz" style={{ height: 600, width: '100%' }}>
            <AgGridReact
              rowData={expenses}
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
            <h3>No expenses found</h3>
            <p>Try adjusting your filters or add a new expense.</p>
          </div>
        )}
      </div>

      {/* Expense Modal */}
      <Modal
        isOpen={showExpenseModal}
        onClose={() => {
          setShowExpenseModal(false);
          resetForm();
        }}
        title={selectedExpense ? 'Edit Expense' : 'Add New Expense'}
        size="large"
      >
        <form onSubmit={handleFormSubmit} className="expense-form" style={{ width: '100%' }}>
          <div className="expense-form-grid">
            {/* Column 1 */}
            <div className="form-field">
              <label className="form-label">
                Category *
                <span className="required">*</span>
              </label>
              <select
                value={expenseForm.expense_category}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, expense_category: e.target.value }))}
                required
                className="form-input"
                style={{ 
                  width: '100%', 
                  padding: '0.5rem', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  appearance: 'none',
                  maxHeight: 'none',
                  overflow: 'visible'
                }}
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.category_name}>
                    {cat.category_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">
                Amount *
                <span className="required">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={expenseForm.amount}
                onChange={(e) => {
                  const value = e.target.value;
                  setExpenseForm(prev => ({ ...prev, amount: value }));
                }}
                required
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-field">
              <label className="form-label">
                Date *
                <span className="required">*</span>
              </label>
              <input
                type="date"
                value={expenseForm.expense_date}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, expense_date: e.target.value }))}
                required
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>

            {/* Column 2 */}
            <div className="form-field">
              <label className="form-label">Description</label>
              <input
                type="text"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-field">
              <label className="form-label">
                Vendor Name
                <span className="required">*</span>
              </label>
              <input
                type="text"
                value={expenseForm.vendor_name}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, vendor_name: e.target.value }))}
                className="form-input"
                style={{ width: '100%' }}
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label">Project</label>
              <input
                type="text"
                value={expenseForm.project}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, project: e.target.value }))}
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>

            {/* Column 3 */}
            <div className="form-field">
              <label className="form-label">Status</label>
              <select
                value={expenseForm.status}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, status: e.target.value }))}
                className="form-input"
                style={{ 
                  width: '100%', 
                  padding: '0.5rem', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  appearance: 'none',
                  maxHeight: 'none',
                  overflow: 'visible'
                }}
              >
                <option value="">Select Status</option>
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">Payment Method</label>
              <select
                value={expenseForm.payment_method}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, payment_method: e.target.value }))}
                className="form-input"
                style={{ 
                  width: '100%', 
                  padding: '0.5rem', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  appearance: 'none',
                  maxHeight: 'none',
                  overflow: 'visible'
                }}
              >
                <option value="">Select Payment Method</option>
                {paymentMethodOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">Reference No</label>
              <input
                type="text"
                value={expenseForm.reference_no}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, reference_no: e.target.value }))}
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div className="form-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowExpenseModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createExpenseMutation.isLoading || updateExpenseMutation.isLoading}
            >
              {createExpenseMutation.isLoading || updateExpenseMutation.isLoading ? 'Saving...' : 
               selectedExpense ? 'Update Expense' : 'Create Expense'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}