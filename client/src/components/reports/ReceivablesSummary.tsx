import React from "react";
import type { ReceivablesSummaryData } from "../../utils/arReportsTypes";

interface ReceivablesSummaryProps {
  data: ReceivablesSummaryData | null;
  isLoading: boolean;
  formatCurrency: (val: number | string | null | undefined) => string;
}

export function ReceivablesSummary({ data, isLoading, formatCurrency }: ReceivablesSummaryProps) {
  if (isLoading) return <div className="report-loading">Loading Receivables Summary...</div>;
  if (!data) return <div className="report-empty">No data available</div>;

  return (
    <div className="report-section">
      <div className="summary-cards">
        <div className="summary-card summary-card--info">
          <div className="summary-card__label">Total Invoices</div>
          <div className="summary-card__value">{data.total_invoices ?? 0}</div>
        </div>
        <div className="summary-card summary-card--warning">
          <div className="summary-card__label">Total Outstanding</div>
          <div className="summary-card__value">{formatCurrency(data.total_outstanding || 0)}</div>
        </div>
        <div className="summary-card summary-card--success">
          <div className="summary-card__label">Total Paid</div>
          <div className="summary-card__value">{formatCurrency(data.total_paid || 0)}</div>
        </div>
        <div className="summary-card summary-card--danger">
          <div className="summary-card__label">Overdue Invoices</div>
          <div className="summary-card__value">{data.overdue_count ?? 0}</div>
        </div>
        <div className="summary-card summary-card--danger">
          <div className="summary-card__label">Overdue Amount</div>
          <div className="summary-card__value">{formatCurrency(data.overdue_amount || 0)}</div>
        </div>
      </div>

      {data.statusBreakdown && (
        <div className="report-subsection">
          <h3 className="report-subsection__title">Invoice Status Breakdown</h3>
          <div className="status-chart">
            <div className="status-item">
              <span className="status-label">Unpaid</span>
              <div className="status-bar">
                <div
                  className="status-fill status-fill--warning"
                  style={{
                    width: `${data.total_invoices > 0
                      ? ((data.statusBreakdown.unpaid.count || 0) / data.total_invoices) * 100
                      : 0}%`,
                  }}
                />
              </div>
              <span className="status-count">{data.statusBreakdown.unpaid.count || 0}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Partially Paid</span>
              <div className="status-bar">
                <div
                  className="status-fill status-fill--info"
                  style={{
                    width: `${data.total_invoices > 0
                      ? ((data.statusBreakdown.partiallyPaid.count || 0) / data.total_invoices) * 100
                      : 0}%`,
                  }}
                />
              </div>
              <span className="status-count">{data.statusBreakdown.partiallyPaid.count || 0}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Overdue</span>
              <div className="status-bar">
                <div
                  className="status-fill status-fill--danger"
                  style={{
                    width: `${data.total_invoices > 0
                      ? ((data.statusBreakdown.overdue.count || 0) / data.total_invoices) * 100
                      : 0}%`,
                  }}
                />
              </div>
              <span className="status-count">{data.statusBreakdown.overdue.count || 0}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
