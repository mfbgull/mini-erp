export interface Expense {
  id: number;
  expense_no: string;
  expense_category: string;
  description: string;
  amount: number;
  expense_date: string;
  payment_method: string;
  reference_no: string;
  vendor_name: string;
  project: string;
  status: string;
}

export interface ExpenseFormData {
  expense_category: string;
  description: string;
  amount: string;
  expense_date: string;
  payment_method: string;
  reference_no: string;
  vendor_name: string;
  project: string;
  status: string;
}

export interface ExpenseCategory {
  category_name: string;
}

export interface StatusOption {
  value: string;
  label: string;
}

export interface PaymentMethodOption {
  value: string;
  label: string;
}
