import { useState } from "react";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import MiniERPGrid from "../../components/common/MiniERPGrid";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Download,
  DollarSign,
  FileText,
  CheckCircle,
  AlertCircle,
  MoreVertical,
} from "lucide-react";

import Button from "../../components/common/Button";
import { CompactExpenseCardView } from "../../components/common/CompactExpenseCard";
import DateRangePicker from "../../components/common/DateRangePicker";
import DropdownMenu from "../../components/common/DropdownMenu";
import FormInput from "../../components/common/FormInput";
import Modal from "../../components/common/Modal";
import SearchableSelect from "../../components/common/SearchableSelect";
import StatCard, { StatsGrid } from "../../components/common/StatCard";
import { useSettings } from "../../context/SettingsContext";
import { useFormValidation } from "../../hooks/useFormValidation";
import { useMobileDetection } from "../../hooks/useMobileDetection";
import { useTranslation } from "../../hooks/useTranslation";
import { expenseSchema } from "../../schemas";
import api from "../../utils/api";
import { createActionColDef } from "../../utils/agGridIntegration";
import { exportToPDF, exportToExcel } from "../../utils/exportUtils";
import { getStatusCellClass } from "../../utils/statusCellUtils";
import type { Expense, ExpenseFormData, ExpenseCategory, StatusOption, PaymentMethodOption } from "../../utils/expenseTypes";
import "../inventory/ItemPreview.css";
import "./Expenses.css";
import "../../styles/ag-grid-status-cells.css";

const emptyForm = {
  expense_category: "",
  description: "",
  amount: "",
  expense_date: new Date().toISOString().split("T")[0],
  payment_method: "",
  reference_no: "",
  vendor_name: "",
  project: "",
  status: "Approved",
};

export default function ExpensesPage() {
  const { t } = useTranslation();
  const { isMobile } = useMobileDetection();
  const [showFilters, setShowFilters] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [expenseForm, setExpenseForm] = useState<ExpenseFormData>(emptyForm);

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

  const {
    data: expenses = [],
    isLoading,
    refetch,
  } = useQuery<Expense[]>({
    queryKey: ["expenses", dateRange, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("from_date", dateRange.fromDate);
      params.append("to_date", dateRange.toDate);
      if (filters.category) params.append("category", filters.category);
      if (filters.vendor) params.append("vendor", filters.vendor);
      if (filters.status) params.append("status", filters.status);
      params.append("page", "1");
      params.append("limit", "1000");

      const response = await api.get(`/expenses?${params}`);
      return response.data.data;
    },
  });

  const {
    data: categories = [],
  } = useQuery<ExpenseCategory[]>({
    queryKey: ["expenseCategories"],
    queryFn: async () => {
      const response = await api.get("/expenses/categories");
      return response.data.data;
    },
  });

  const {
    data: statusOptions = [],
  } = useQuery<StatusOption[]>({
    queryKey: ["expenseStatusOptions"],
    queryFn: async () => {
      const response = await api.get("/expenses/status-options");
      return response.data.data;
    },
  });

  const {
    data: paymentMethodOptions = [],
  } = useQuery<PaymentMethodOption[]>({
    queryKey: ["expensePaymentMethodOptions"],
    queryFn: async () => {
      const response = await api.get("/expenses/payment-method-options");
      return response.data.data;
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: (expenseData: ExpenseFormData) => api.post("/expenses", { ...expenseData, amount: parseFloat(expenseData.amount) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setShowExpenseModal(false);
      resetForm();
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ExpenseFormData }) =>
      api.put(`/expenses/${id}`, { ...data, amount: parseFloat(data.amount) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setShowExpenseModal(false);
      resetForm();
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });

  const resetForm = () => {
    setExpenseForm(emptyForm);
    setSelectedExpense(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate(expenseForm)) return;

    if (selectedExpense) {
      updateExpenseMutation.mutate({
        id: selectedExpense.id,
        data: expenseForm,
      });
    } else {
      createExpenseMutation.mutate(expenseForm);
    }
  };

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setExpenseForm({
      expense_category: expense.expense_category || "",
      description: expense.description || "",
      amount:
        expense.amount !== null && expense.amount !== undefined
          ? String(expense.amount)
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

  const handleDelete = (id: number) => {
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

  const handleExport = (format: "pdf" | "excel" = "pdf") => {
    if (!expenses || expenses.length === 0) return;

    const exportColumns = [
      { headerName: "Expense No", field: "expense_no" },
      { headerName: "Category", field: "expense_category" },
      { headerName: "Description", field: "description" },
      {
        headerName: "Amount",
        field: "amount",
        valueFormatter: (params: { value: number }) => formatCurrency(params.value || 0),
      },
      {
        headerName: "Date",
        field: "expense_date",
        valueFormatter: (params: { value: string }) =>
          params.value ? new Date(params.value).toLocaleDateString() : "",
      },
      { headerName: "Payment Method", field: "payment_method" },
      { headerName: "Reference No", field: "reference_no" },
      { headerName: "Vendor", field: "vendor_name" },
      { headerName: "Project", field: "project" },
      { headerName: "Status", field: "status" },
    ];

    if (format === "pdf") {
      exportToPDF(
        expenses as unknown as Record<string, unknown>[],
        exportColumns,
        "Expenses Report",
        `expenses-${new Date().toISOString().split("T")[0]}.pdf`,
      );
    } else {
      exportToExcel(
        expenses as unknown as Record<string, unknown>[],
        exportColumns,
        "Expenses Report",
        `expenses-${new Date().toISOString().split("T")[0]}.csv`,
      );
    }
  };

  const isSaving = createExpenseMutation.isPending || updateExpenseMutation.isPending;

  const columnDefs = [
    { headerName: "Expense No", field: "expense_no", filter: true, width: 140 },
    { headerName: "Category", field: "expense_category", filter: true, width: 140 },
    { headerName: "Description", field: "description", filter: true, flex: 1 },
    {
      headerName: "Amount", field: "amount", filter: "agNumberColumnFilter",
      width: 120,
      valueFormatter: (params: { value: number }) => formatCurrency(params.value || 0),
      cellClass: "amount-cell",
    },
    {
      headerName: "Date", field: "expense_date", filter: "agDateColumnFilter",
      width: 120,
      valueFormatter: (params: { value: string }) =>
        params.value ? new Date(params.value).toLocaleDateString() : "",
    },
    { headerName: "Payment Method", field: "payment_method", filter: true, width: 140 },
    { headerName: "Reference No", field: "reference_no", filter: true, width: 120 },
    { headerName: "Vendor", field: "vendor_name", filter: true, width: 140 },
    { headerName: "Project", field: "project", filter: true, width: 120 },
    {
      headerName: "Status", field: "status", filter: true, width: 120,
      cellClass: (params: { value: string }) => getStatusCellClass(params.value),
    },
    createActionColDef({
      cellRenderer: (params: { data: Expense }) => (
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
    }),
  ];

  const totalAmount = expenses.reduce((sum: number, exp: Expense) => sum + (exp.amount || 0), 0);

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
            <Button variant="secondary" onClick={() => handleExport("pdf")} className="export-btn">
              <Download size={18} /> Export PDF
            </Button>
            <Button variant="secondary" onClick={() => handleExport("excel")} className="export-btn">
              <Download size={18} /> Export Excel
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
          <Button variant="secondary" onClick={() => setShowFilters(!showFilters)} className="filter-toggle">
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
              onFromDateChange={(date: string) =>
                setDateRange((prev) => ({ ...prev, fromDate: date }))
              }
              onToDateChange={(date: string) =>
                setDateRange((prev) => ({ ...prev, toDate: date }))
              }
            />

            <SearchableSelect
              label="Category"
              name="category"
              value={filters.category}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
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
                setFilters((prev) => ({ ...prev, vendor: (e.target as HTMLInputElement).value }))
              }
              placeholder="Search vendor..."
            />

            <SearchableSelect
              label="Status"
              name="status"
              value={filters.status}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
              options={[
                { value: "", label: "All Statuses" },
                ...statusOptions.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                })),
              ]}
              className="filter-select"
            />

            <Button variant="primary" onClick={() => refetch()} className="apply-filters-btn">
              Apply Filters
            </Button>
          </div>
        </div>
      )}

      <StatsGrid className="compact">
        <StatCard icon={DollarSign} label="Total Expenses" value={formatCurrency(totalAmount)} />
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
            onDelete={(id: number) => handleDelete(id)}
          />
        ) : expenses.length > 0 ? (
          <MiniERPGrid
            wrapperClassName="ag-grid-container"
            rowData={filteredExpenses}
            columnDefs={columnDefs as any}
            paginationPageSize={20}
            paginationPageSizeSelector={[10, 20, 50, 100]}
          />
        ) : (
          <div className="no-data">
            <FileText size={48} />
            <h3>No expenses found</h3>
            <p>Try adjusting your filters or add a new expense.</p>
          </div>
        )}
      </div>

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
            <FormInput
              label="Category *"
              name="expense_category"
              type="select"
              value={expenseForm.expense_category}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setExpenseForm((prev) => ({ ...prev, expense_category: e.target.value }))
              }
              options={[
                { value: "", label: "Select Category" },
                ...categories.map((cat: ExpenseCategory) => ({
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setExpenseForm((prev) => ({ ...prev, amount: e.target.value }));
              }}
              required
            />

            <FormInput
              label="Date *"
              name="expense_date"
              type="date"
              value={expenseForm.expense_date}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setExpenseForm((prev) => ({ ...prev, expense_date: e.target.value }))
              }
              required
            />

            <FormInput
              label="Payment Method"
              name="payment_method"
              type="select"
              value={expenseForm.payment_method}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setExpenseForm((prev) => ({ ...prev, payment_method: e.target.value }))
              }
              options={paymentMethodOptions.map((opt) => ({ value: opt.value, label: opt.label }))}
            />

            <FormInput
              label="Status"
              name="status"
              type="select"
              value={expenseForm.status}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setExpenseForm((prev) => ({ ...prev, status: e.target.value }))
              }
              options={statusOptions.map((opt) => ({ value: opt.value, label: opt.label }))}
            />

            <FormInput
              label="Reference No"
              name="reference_no"
              type="text"
              value={expenseForm.reference_no}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setExpenseForm((prev) => ({ ...prev, reference_no: e.target.value }))
              }
            />

            <FormInput
              label="Vendor Name *"
              name="vendor_name"
              type="text"
              value={expenseForm.vendor_name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setExpenseForm((prev) => ({ ...prev, vendor_name: e.target.value }))
              }
              required
              className="full-width"
            />

            <FormInput
              label="Description"
              name="description"
              type="text"
              value={expenseForm.description}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setExpenseForm((prev) => ({ ...prev, description: e.target.value }))
              }
              className="full-width"
            />

            <FormInput
              label="Project"
              name="project"
              type="text"
              value={expenseForm.project}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setExpenseForm((prev) => ({ ...prev, project: e.target.value }))
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
            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? "Saving..." : selectedExpense ? "Update Expense" : "Create Expense"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
