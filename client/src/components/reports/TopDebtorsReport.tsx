import React from "react";
import type { TopDebtor } from "../../utils/arReportsTypes";

interface TopDebtorsReportProps {
  data: TopDebtor[] | null | undefined;
  isLoading: boolean;
  formatCurrency: (val: number | string | null | undefined) => string;
}

export function TopDebtorsReport({ data, isLoading, formatCurrency }: TopDebtorsReportProps) {
  if (isLoading) return <div className="report-loading">Loading Top Debtors...</div>;
  if (!data || data.length === 0) return <div className="report-empty">No data available</div>;

  const totalOutstanding = data.reduce((sum, d) => sum + (d.outstanding_balance || 0), 0);

  return (
    <div className="report-section">
      <div className="summary-cards">
        <div className="summary-card summary-card--total">
          <div className="summary-card__label">Total Outstanding</div>
          <div className="summary-card__value">{formatCurrency(totalOutstanding)}</div>
        </div>
        <div className="summary-card summary-card--info">
          <div className="summary-card__label">Total Debtors</div>
          <div className="summary-card__value">{data.length}</div>
        </div>
      </div>

      <table className="report-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Customer</th>
            <th>Code</th>
            <th>Outstanding Balance</th>
            <th>Total Invoiced</th>
            <th>Invoice Count</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={d.customer_id ?? i}>
              <td>{i + 1}</td>
              <td>{d.customer_name}</td>
              <td>{d.customer_code || "—"}</td>
              <td className="amount-cell">{formatCurrency(d.outstanding_balance || 0)}</td>
              <td className="amount-cell">{formatCurrency(d.total_invoiced || 0)}</td>
              <td className="number-cell">{d.invoice_count ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
