export interface DateRangeFilter {
  fromDate: string;
  toDate: string;
}

export interface ExportColumn {
  headerName: string;
  field: string;
  width?: number;
  valueFormatter?: (params: { value: unknown; row?: Record<string, unknown> }) => string;
}

export interface ReportsSummary {
  totalItems?: number;
  totalValue?: number;
  totalInvoices?: number;
  totalSales?: number;
  totalItemsSold?: number;
  averageInvoiceValue?: number;
  lowStock?: number;
  inStock?: number;
  outOfStock?: number;
  totalInbound?: number;
  totalOutbound?: number;
  netMovement?: number;
  totalExpenses?: number;
  totalAmount?: number;
  averageAmount?: number;
  totalProductionOrders?: number;
  totalOutput?: number;
  totalCompleted?: number;
  totalScrapped?: number;
  totalCost?: number;
  totalOrders?: number;
  returnCount?: number;
  returnQuantity?: number;
  returnValue?: number;
  averageOrderValue?: number;
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}
