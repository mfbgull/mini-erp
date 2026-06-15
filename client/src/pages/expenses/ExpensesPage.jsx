import { useState, useEffect } from "react";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { ModuleRegistry , ClientSideRowModelModule } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
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
  MoreVertical,
} from "lucide-react";

import Button from "../../components/common/Button";
import DropdownMenu from "../../components/common/DropdownMenu";
import StatCard, { StatsGrid } from "../../components/common/StatCard";
import { useTranslation } from "../../hooks/useTranslation";
import { CompactExpenseCardView } from "../../components/common/CompactExpenseCard";
import DateRangePicker from "../../components/common/DateRangePicker";
import FormInput from "../../components/common/FormInput";
import Modal from "../../components/common/Modal";
import SearchableSelect from "../../components/common/SearchableSelect";
import { useSettings } from "../../context/SettingsContext";
import { useFormValidation } from "../../hooks/useFormValidation";
import { useMobileDetection } from "../../hooks/useMobileDetection";
import { expenseSchema } from "../../schemas";
import api from "../../utils/api";
import { exportToPDF, exportToExcel } from "../../utils/exportUtils";
import "../inventory/ItemPreview.css";
import "./Expenses.css";

// Register AG Grid modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

export default function ExpensesPage() {
  const { t } = useTranslation();
  const { isMobile } = useMobileDetection();
  const [showFilters, setShowFilters] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [expenseForm, setExpenseForm] = useState({
    expense_category: "",
    description: "",
    amount: "",
    expense_date: new Date().toISOString().split("T")[0],
    payment_method: "",
    reference_no: "",
    vendor_name: "",
    project: "",
    status: "Approved",
  });

  const { errors, validate, clearErrors } = useFormValidation(expenseSchema);
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(new Date().setMonth(new Date().getMonth() - 1))
      .toISOString()
      .split("T")[0],
    toDate: new Date().toISOString().split("T")[0],
  });
  const [filters, setFilters] = useState({
    category: "",
    vendor: "",
    status: "",
  });
  const [searchTerm, setSearchTerm] = useState("");

  const queryClient = useQueryClient();
  const { formatCurrency } = useSettings();

  // Fetch expenses
  const {
    data: expenses = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["expenses", dateRange, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("from_date", dateRange.fromDate);
      params.append("to_date", dateRange.toDate);
      if (filters.category) params.append("category", filters.category);
      if (filters.vendor) params.append("vendor", filters.vendor);
      if (filters.status) params.append("status", filters.status);
      params.append("page", "1");
      params.append("limit", "1000"); // Get all expenses for the date range

      const response = await api.get(`/expenses?${params}`);
      return response.data.data;
    },
  });

  // Fetch expense categories
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery({
    queryKey: ["expenseCategories"],
    queryFn: async () => {
      const response = await api.get("/expenses/categories");
      return response.data.data;
    },
  });

  // Fetch expense status options
  const {
    data: statusOptions = [],
    isLoading: statusLoading,
    error: statusError,
  } = useQuery({
    queryKey: ["expenseStatusOptions"],
    queryFn: async () => {
      const response = await api.get("/expenses/status-options");
      return response.data.data;
    },
  });

  // Fetch expense payment method options
  const {
    data: paymentMethodOptions = [],
    isLoading: paymentLoading,
    error: paymentError,
  } = useQuery({
    queryKey: ["expensePaymentMethodOptions"],
    queryFn: async () => {
      const response = await api.get("/expenses/payment-method-options");
      return response.data.data;
    },
  });

  // Create expense mutation
  const createExpenseMutation = useMutation({
    mutationFn: (expenseData) => api.post("/expenses", expenseData),
    onSuccess: () => {
      queryClient.invalidateQueries(["expenses"]);
      setShowExpenseModal(false);
      resetForm();
    },
  });

  // Update expense mutation
  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/expenses/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["expenses"]);
      setShowExpenseModal(false);
      resetForm();
    },
  });

  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: (id) => api.delete(`/expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["expenses"]);
    },
  });

  const resetForm = () => {
    setExpenseForm({
      expense_category: "",
      description: "",
      amount: "",
      expense_date: new Date().toISOString().split("T")[0],
      payment_method: "",
      reference_no: "",
      vendor_name: "",
      project: "",
      status: "Approved",
    });
    setSelectedExpense(null);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    if (!validate(expenseForm)) return;

    const expenseData = {
      ...expenseForm,
      amount: parseFloat(expenseForm.amount),
    };

    if (selectedExpense) {
      updateExpenseMutation.mutate({
        id: selectedExpense.id,
        data: expenseData,
      });
    } else {
      createExpenseMutation.mutate(expenseData);
    }
  };

  const handleEdit = (expense) => {
    setSelectedExpense(expense);
    setExpenseForm({
      expense_category: expense.expense_category || "",
      description: expense.description || "",
      amount:
        expense.amount !== null && expense.amount !== undefined
          ? expense.amount.toString()
          : "",
      expense_date:
        expense.expense_date || new Date().toISOString().split("T")[0],
      payment_method: expense.payment_method || "",
      reference_no: expense.reference_no || "",
      vendor_name: expense.vendor_name || "",
      project: expense.project || "",
      status: expense.status || "Approved",
    });
    setShowExpenseModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      deleteExpenseMutation.mutate(id);
    }
  };

  const filteredExpenses = expenses.filter((expense) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (expense.expense_no?.toLowerCase() || "").includes(search) ||
      (expense.expense_category?.toLowerCase() || "").includes(search) ||
      (expense.description?.toLowerCase() || "").includes(search) ||
      (expense.vendor_name?.toLowerCase() || "").includes(search)
    );
  });

  const handleExport = (format = "pdf") => {
    if (!expenses || expenses.length === 0) {
      console.error("No data to export");
      return;
    }

    // Column definitions for export (matching the grid columns)
    const exportColumns = [
      {
        headerName: "Expense No",
        field: "expense_no",
      },
      {
        headerName: "Category",
        field: "expense_category",
      },
      {
        headerName: "Description",
        field: "description",
      },
      {
        headerName: "Amount",
        field: "amount",
        valueFormatter: (params) => formatCurrency(params.value || 0),
      },
      {
        headerName: "Date",
        field: "expense_date",
        valueFormatter: (params) => {
          return params.value
            ? new Date(params.value).toLocaleDateString()
            : "";
        },
      },
      {
        headerName: "Payment Method",
        field: "payment_method",
      },
      {
        headerName: "Reference No",
        field: "reference_no",
      },
      {
        headerName: "Vendor",
        field: "vendor_name",
      },
      {
        headerName: "Project",
        field: "project",
      },
      {
        headerName: "Status",
        field: "status",
      },
    ];

    if (format === "pdf") {
      exportToPDF(
        expenses,
        exportColumns,
        "Expenses Report",
        `expenses-${new Date().toISOString().split("T")[0]}.pdf`,
      );
    } else if (format === "excel") {
      exportToExcel(
        expenses,
        exportColumns,
        "Expenses Report",
        `expenses-${new Date().toISOString().split("T")[0]}.csv`,
      );
    }
  };

  // Column definitions for expenses data
  const columnDefs = [
    {
      headerName: "Expense No",
      field: "expense_no",
      filter: true,
      width: 140,
    },
    {
      headerName: "Category",
      field: "expense_category",
      filter: true,
      width: 140,
    },
    {
      headerName: "Description",
      field: "description",
      filter: true,
      flex: 1,
    },
    {
      headerName: "Amount",
      field: "amount",
      filter: "agNumberColumnFilter",
      width: 120,
      valueFormatter: (params) => formatCurrency(params.value || 0),
      cellClass: "amount-cell",
    },
    {
      headerName: "Date",
      field: "expense_date",
      filter: "agDateColumnFilter",
      width: 120,
      valueFormatter: (params) => {
        return params.value ? new Date(params.value).toLocaleDateString() : "";
      },
    },
    {
      headerName: "Payment Method",
      field: "payment_method",
      filter: true,
      width: 140,
    },
    {
      headerName: "Reference No",
      field: "reference_no",
      filter: true,
      width: 120,
    },
    {
      headerName: "Vendor",
      field: "vendor_name",
      filter: true,
      width: 140,
    },
    {
      headerName: "Project",
      field: "project",
      filter: true,
      width: 120,
    },
    {
      headerName: "Status",
      field: "status",
      filter: true,
      width: 120,
      cellClass: (params) => {
        const status = params.value?.toLowerCase();
        if (status === "paid") return "status-paid";
        if (status === "approved") return "status-partially-paid";
        if (status === "pending") return "status-unpaid";
        return "status-cancelled";
      },
    },
    {
      headerName: "Actions",
      field: "actions",
      width: 70,
      cellRenderer: (params) => (
        <DropdownMenu
          trigger={
            <button className="action-menu-trigger" title="Actions">
              <MoreVertical size={16} />
            </button>
          }
          items={[
            { label: 'Edit', icon: <Edit size={16} />, onClick: () => handleEdit(params.data) },
            { label: 'Delete', icon: <Trash2 size={16} />, onClick: () => handleDelete(params.data.id), destructive: true },
          ]}
          align="end"
        />
      ),
      sortable: false,
      filter: false,
    },
  ];

  return (
    <div className="expenses-page">
      <div className="page-header">
        <div>
          <h1>{t('expenses.expenses')}</h1>
          <p className="page-subtitle">{t('expenses.expenses')}</p>
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
              onClick={() => handleExport("pdf")}
              className="export-btn"
            >
              <Download size={18} />
              Export PDF
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleExport("excel")}
              className="export-btn"
            >
              <Download size={18} />
              Export Excel
            </Button>
          </div>
        </div>

        <div className="expenses-filters">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
            className="filter-toggle"
          >
            <Filter size={18} />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="expenses-filter-section">
          <div className="filter-row">
            <DateRangePicker
              fromDate={dateRange.fromDate}
              toDate={dateRange.toDate}
              onFromDateChange={(date) =>
                setDateRange((prev) => ({ ...prev, fromDate: date }))
              }
              onToDateChange={(date) =>
                setDateRange((prev) => ({ ...prev, toDate: date }))
              }
            />

            <SearchableSelect
              label="Category"
              value={filters.category}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, category: e.target.value }))
              }
              options={[
                { value: "", label: "All Categories" },
                ...categories.map((cat) => ({
                  value: cat.category_name,
                  label: cat.category_name,
                })),
              ]}
              className="filter-select"
            />

            <FormInput
              label="Vendor"
              type="text"
              value={filters.vendor}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, vendor: e.target.value }))
              }
              placeholder="Search vendor..."
            />

            <SearchableSelect
              label="Status"
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
              options={[
                { value: "", label: "All Statuses" },
                ...statusOptions.map((option) => ({
                  value: option.value,
                  label: option.label,
                })),
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

      <StatsGrid className="compact">
        <StatCard icon={DollarSign} label="Total Expenses" value={formatCurrency(expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0))} />
        <StatCard icon={FileText} label="Total Records" value={expenses.length} />
        <StatCard icon={CheckCircle} label="Paid Expenses" value={expenses.filter((exp) => exp.status === "Paid").length} />
        <StatCard icon={AlertCircle} label="Pending Expenses" value={expenses.filter((exp) => exp.status !== "Paid").length} />
      </StatsGrid>

      <div className="expenses-content">
        {isLoading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : isMobile ? (
          <CompactExpenseCardView
            expenses={filteredExpenses}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : expenses.length > 0 ? (
          <div className="ag-theme-quartz ag-grid-container">
            <AgGridReact theme="legacy"
              rowData={filteredExpenses}
              columnDefs={columnDefs}
              defaultColDef={{
              theme:"legacy",
                resizable: true,
                sortable: true,
                filter: true,
              }}
              pagination={true}
              paginationPageSize={20}
              paginationPageSizeSelector={[10, 20, 50, 100]}
              rowSelection={{ mode: "singleRow" }}
              onGridReady={(params) => {
                setTimeout(() => {
                  if (params.api && params.columnApi) {
                    const gridElement =
                      params.api.gridCore.ctrl.main.querySelectorAll(
                        ".ag-body-viewport",
                      )[0];
                    if (gridElement && gridElement.clientWidth > 0) {
                      params.columnApi.autoSizeAllColumns();
                    }
                  }
                }, 100);
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
        title={selectedExpense ? "Edit Expense" : "Add New Expense"}
        size="medium"
      >
        <form onSubmit={handleFormSubmit} className="expense-form w-full">
          <div className="expense-form-grid">
            {/* Row 1 */}
            <FormInput
              label="Category *"
              name="expense_category"
              type="select"
              value={expenseForm.expense_category}
              onChange={(e) =>
                setExpenseForm((prev) => ({
                  ...prev,
                  expense_category: e.target.value,
                }))
              }
              options={[
                { value: "", label: "Select Category" },
                ...categories.map((cat) => ({
                  value: cat.category_name,
                  label: cat.category_name,
                })),
              ]}
              required
            />

            <FormInput
              label="Amount *"
              name="amount"
              type="number"
              step="0.01"
              value={expenseForm.amount}
              onChange={(e) => {
                const value = e.target.value;
                setExpenseForm((prev) => ({ ...prev, amount: value }));
              }}
              required
            />

            {/* Row 2 */}
            <FormInput
              label="Date *"
              name="expense_date"
              type="date"
              value={expenseForm.expense_date}
              onChange={(e) =>
                setExpenseForm((prev) => ({
                  ...prev,
                  expense_date: e.target.value,
                }))
              }
              required
            />

            <FormInput
              label="Payment Method"
              name="payment_method"
              type="select"
              value={expenseForm.payment_method}
              onChange={(e) =>
                setExpenseForm((prev) => ({
                  ...prev,
                  payment_method: e.target.value,
                }))
              }
              options={paymentMethodOptions}
            />

            {/* Row 3 */}
            <FormInput
              label="Status"
              name="status"
              type="select"
              value={expenseForm.status}
              onChange={(e) =>
                setExpenseForm((prev) => ({
                  ...prev,
                  status: e.target.value,
                }))
              }
              options={statusOptions}
            />

            <FormInput
              label="Reference No"
              name="reference_no"
              type="text"
              value={expenseForm.reference_no}
              onChange={(e) =>
                setExpenseForm((prev) => ({
                  ...prev,
                  reference_no: e.target.value,
                }))
              }
            />

            {/* Row 4 - Full Width */}
            <FormInput
              label="Vendor Name *"
              name="vendor_name"
              type="text"
              value={expenseForm.vendor_name}
              onChange={(e) =>
                setExpenseForm((prev) => ({
                  ...prev,
                  vendor_name: e.target.value,
                }))
              }
              required
              className="full-width"
            />

            {/* Row 5 - Full Width */}
            <FormInput
              label="Description"
              name="description"
              type="text"
              value={expenseForm.description}
              onChange={(e) =>
                setExpenseForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="full-width"
            />

            {/* Row 6 - Full Width */}
            <FormInput
              label="Project"
              name="project"
              type="text"
              value={expenseForm.project}
              onChange={(e) =>
                setExpenseForm((prev) => ({
                  ...prev,
                  project: e.target.value,
                }))
              }
              className="full-width"
            />
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
              disabled={
                createExpenseMutation.isLoading ||
                updateExpenseMutation.isLoading
              }
            >
              {createExpenseMutation.isLoading ||
              updateExpenseMutation.isLoading
                ? "Saving..."
                : selectedExpense
                  ? "Update Expense"
                  : "Create Expense"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
