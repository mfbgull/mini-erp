export interface POSummary {
  total_pos: number;
  total_value: number;
  draft_pos: number;
  submitted_pos: number;
  partially_received_pos: number;
  completed_pos: number;
}

export interface BalanceData {
  balance: number;
}

export interface Transaction {
  transaction_date: string;
  transaction_type: string;
  reference_no?: string;
  description?: string;
  debit: number;
  credit: number;
  balance: number;
}
