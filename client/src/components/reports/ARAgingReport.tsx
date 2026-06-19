import React from "react";
import type { ARAgingData } from "../../utils/arReportsTypes";

interface ARAgingReportProps {
  data: ARAgingData | null;
  isLoading: boolean;
  formatCurrency: (val: number | string | null | undefined) => string;
}

export function ARAgingReport({ data, isLoading, formatCurrency }: ARAgingReportProps) {
  if (isLoading) return <div className="report-loading">Loading AR Aging...</div>;
  if (!data) return <div className="report-empty">No data available</div>;

  const summary = data.summary || {};

  return (
    <div className="report-section">
      <div className="summary-cards">
        <div className="summary-card summary-card--total">
          <div className="summary-card__label">Total Receivables</div>
          <div className="summary-card__value">{formatCurrency(summary.totalReceivables || 0)}</div>
        </div>
        <div className="summary-card summary-card--info">
          <div className="summary-card__label">Current & 1-30 Days</div>
          <div className="summary-card__value">
            {formatCurrency((summary.current_amount || 0) + (summary.total_1_30 || 0))}
          </div>
        </div>
        <div className="summary-card summary-card--danger">
          <div className="summary-card__label">Over 90 Days</div>
          <div className="summary-card__value">{formatCurrency(summary.total_over_90 || 0)}</div>
        </div>
      </div>

      <table className="report-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Code</th>
            <th>Total Outstanding</th>
            <th>Current</th>
            <th>1-30 Days</th>
            <th>31-60 Days</th>
            <th>61-90 Days</th>
            <th>90+ Days</th>
          </tr>
        </thead>
        <tbody>
          {(data.agingBuckets || []).map((c, i) => (
            <tr key={c.customer_id ?? i}>
              <td>{c.customer_name}</td>
              <td>{c.customer_code || "—"}</td>
              <td className="amount-cell">{formatCurrency(c.total_outstanding || 0)}</td>
              <td className="amount-cell">{formatCurrency(c.current_amount || 0)}</td>
              <td className="amount-cell">{formatCurrency(c.days_1_30 || 0)}</td>
              <td className="amount-cell">{formatCurrency(c.days_31_60 || 0)}</td>
              <td className="amount-cell">{formatCurrency(c.days_61_90 || 0)}</td>
              <td className="amount-cell">{formatCurrency(c.days_over_90 || 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
