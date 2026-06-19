import React from "react";
import type { DSOData } from "../../utils/arReportsTypes";

interface DSOReportProps {
  data: DSOData | null;
  isLoading: boolean;
  formatCurrency: (val: number | string | null | undefined) => string;
}

export function DSOReport({ data, isLoading, formatCurrency }: DSOReportProps) {
  if (isLoading) return <div className="report-loading">Loading DSO Report...</div>;
  if (!data) return <div className="report-empty">No data available</div>;

  return (
    <div className="report-section">
      <div className="summary-cards">
        <div className="summary-card summary-card--info">
          <div className="summary-card__label">Days Sales Outstanding</div>
          <div className="summary-card__value">{data.dso?.toFixed(1) ?? "0.0"} days</div>
        </div>
      </div>

      <div className="metric-details">
        <div className="detail-item">
          <span className="detail-label">Period:</span>
          <span className="detail-value">{data.period} days</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Total Sales:</span>
          <span className="detail-value">{formatCurrency(data.totalSales || 0)}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Total AR:</span>
          <span className="detail-value">{formatCurrency(data.totalAR || 0)}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Avg. Invoice Value:</span>
          <span className="detail-value">{formatCurrency(data.avgInvoiceValue || 0)}</span>
        </div>
      </div>

      {data.calculation && (
        <div className="report-subsection">
          <h3 className="report-subsection__title">About Days Sales Outstanding (DSO)</h3>
          <p>DSO = (Total Accounts Receivable ÷ Total Credit Sales) × Number of Days</p>
          <p className="dso-calculation">{data.calculation}</p>
        </div>
      )}
    </div>
  );
}
