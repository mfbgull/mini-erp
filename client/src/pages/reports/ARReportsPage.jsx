import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSettings } from '../../context/SettingsContext';
import {
  Calendar,
  DollarSign,
  TrendingDown,
  AlertTriangle,
  FileText,
  Download,
  BarChart3
} from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry } from 'ag-grid-community';
import { ClientSideRowModelModule } from 'ag-grid-community';
import api from '../../utils/api';
import Button from '../../components/common/Button';
import FormInput from '../../components/common/FormInput';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import './ARReportsPage.css';

// Register AG Grid modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

export default function ARReportsPage() {
  const [reportType, setReportType] = useState('aging');
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0]
  });
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const { formatCurrency } = useSettings();

  // Fetch AR Aging Report
  const { data: agingData, isLoading: agingLoading } = useQuery({
    queryKey: ['arAging', asOfDate],
    queryFn: async () => {
      const response = await api.get(`/reports/ar-aging?asOfDate=${asOfDate}`);
      return response.data.data;
    },
    enabled: reportType === 'aging'
  });

  // Fetch Top Debtors
  const { data: topDebtors, isLoading: debtorsLoading } = useQuery({
    queryKey: ['topDebtors'],
    queryFn: async () => {
      const response = await api.get('/reports/top-debtors');
      return response.data.data;
    },
    enabled: reportType === 'topDebtors'
  });

  // Fetch Receivables Summary
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['arSummary'],
    queryFn: async () => {
      const response = await api.get('/reports/ar-summary');
      return response.data.data;
    },
    enabled: reportType === 'summary'
  });

  // Fetch DSO
  const { data: dsoData, isLoading: dsoLoading } = useQuery({
    queryKey: ['dso'],
    queryFn: async () => {
      const response = await api.get('/reports/dso');
      return response.data.data;
    },
    enabled: reportType === 'dso'
  });

  const reportTypes = [
    { id: 'aging', label: 'AR Aging', icon: TrendingDown },
    { id: 'summary', label: 'Receivables Summary', icon: DollarSign },
    { id: 'topDebtors', label: 'Top Debtors', icon: AlertTriangle },
    { id: 'dso', label: 'Days Sales Outstanding', icon: Calendar }
  ];

  const handleExport = (format = 'pdf') => {
    // Export logic will depend on the current report type
    switch (reportType) {
      case 'aging':
        if (agingData?.agingBuckets) {
          const exportColumns = [
            { headerName: 'Customer', field: 'customer_name' },
            { headerName: 'Customer Code', field: 'customer_code' },
            {
              headerName: 'Total Outstanding',
              field: 'total_outstanding',
              valueFormatter: (params) => formatCurrency(params.value || 0)
            },
            {
              headerName: 'Current',
              field: 'current_amount',
              valueFormatter: (params) => formatCurrency(params.value || 0)
            },
            {
              headerName: '1-30 Days',
              field: 'days_1_30',
              valueFormatter: (params) => formatCurrency(params.value || 0)
            },
            {
              headerName: '31-60 Days',
              field: 'days_31_60',
              valueFormatter: (params) => formatCurrency(params.value || 0)
            },
            {
              headerName: '61-90 Days',
              field: 'days_61_90',
              valueFormatter: (params) => formatCurrency(params.value || 0)
            },
            {
              headerName: '90+ Days',
              field: 'days_over_90',
              valueFormatter: (params) => formatCurrency(params.value || 0)
            }
          ];

          if (format === 'pdf') {
            exportToPDF(
              agingData.agingBuckets,
              exportColumns,
              'AR Aging Report',
              `ar-aging-${new Date().toISOString().split('T')[0]}.pdf`
            );
          } else if (format === 'excel') {
            exportToExcel(
              agingData.agingBuckets,
              exportColumns,
              'AR Aging Report',
              `ar-aging-${new Date().toISOString().split('T')[0]}.csv`
            );
          }
        }
        break;
      case 'summary':
        if (summaryData) {
          // For summary report, create a single row with all summary data
          const exportData = [
            { metric: 'Total Invoices', value: summaryData.totalInvoices },
            { metric: 'Total Value', value: summaryData.totalValue },
            { metric: 'Total Paid', value: summaryData.totalPaid },
            { metric: 'Total Outstanding', value: summaryData.totalOutstanding },
            { metric: 'Overdue Count', value: summaryData.overdue?.count },
            { metric: 'Overdue Amount', value: summaryData.overdue?.amount }
          ];

          const exportColumns = [
            { headerName: 'Metric', field: 'metric' },
            {
              headerName: 'Value',
              field: 'value',
              valueFormatter: (params) => {
                // Format as currency for monetary values
                if (['Total Value', 'Total Paid', 'Total Outstanding', 'Overdue Amount'].includes(params.row?.metric)) {
                  return formatCurrency(params.value);
                }
                return params.value;
              }
            }
          ];

          if (format === 'pdf') {
            exportToPDF(
              exportData,
              exportColumns,
              'Receivables Summary Report',
              `receivables-summary-${new Date().toISOString().split('T')[0]}.pdf`
            );
          } else if (format === 'excel') {
            exportToExcel(
              exportData,
              exportColumns,
              'Receivables Summary Report',
              `receivables-summary-${new Date().toISOString().split('T')[0]}.csv`
            );
          }
        }
        break;
      case 'topDebtors':
        if (topDebtors) {
          const exportColumns = [
            { headerName: 'Customer', field: 'customer_name' },
            { headerName: 'Customer Code', field: 'customer_code' },
            {
              headerName: 'Outstanding Balance',
              field: 'outstanding_balance',
              valueFormatter: (params) => formatCurrency(params.value)
            },
            {
              headerName: 'Total Invoiced',
              field: 'total_invoiced',
              valueFormatter: (params) => formatCurrency(params.value)
            },
            { headerName: 'Invoice Count', field: 'invoice_count' }
          ];

          if (format === 'pdf') {
            exportToPDF(
              topDebtors,
              exportColumns,
              'Top Debtors Report',
              `top-debtors-${new Date().toISOString().split('T')[0]}.pdf`
            );
          } else if (format === 'excel') {
            exportToExcel(
              topDebtors,
              exportColumns,
              'Top Debtors Report',
              `top-debtors-${new Date().toISOString().split('T')[0]}.csv`
            );
          }
        }
        break;
      case 'dso':
        if (dsoData) {
          const exportData = [
            { metric: 'Days Sales Outstanding', value: dsoData.dso },
            { metric: 'Period (days)', value: dsoData.period },
            { metric: 'Total Sales', value: dsoData.totalSales },
            { metric: 'Total AR', value: dsoData.totalAR },
            { metric: 'Avg. Invoice Value', value: dsoData.avgInvoiceValue }
          ];

          const exportColumns = [
            { headerName: 'Metric', field: 'metric' },
            {
              headerName: 'Value',
              field: 'value',
              valueFormatter: (params) => {
                // Format as currency for monetary values
                if (['Total Sales', 'Total AR', 'Avg. Invoice Value'].includes(params.row?.metric)) {
                  return formatCurrency(params.value);
                } else if (params.row?.metric === 'Days Sales Outstanding' || params.row?.metric === 'Period (days)') {
                  return params.value;
                }
                return params.value;
              }
            }
          ];

          if (format === 'pdf') {
            exportToPDF(
              exportData,
              exportColumns,
              'DSO Report',
              `dso-${new Date().toISOString().split('T')[0]}.pdf`
            );
          } else if (format === 'excel') {
            exportToExcel(
              exportData,
              exportColumns,
              'DSO Report',
              `dso-${new Date().toISOString().split('T')[0]}.csv`
            );
          }
        }
        break;
      default:
        console.error('Unknown report type for export');
    }
  };

  const renderReport = () => {
    switch (reportType) {
      case 'aging':
        return <ARAgingReport data={agingData} loading={agingLoading} asOfDate={asOfDate} formatCurrency={formatCurrency} />;
      case 'summary':
        return <ReceivablesSummary data={summaryData} loading={summaryLoading} formatCurrency={formatCurrency} />;
      case 'topDebtors':
        return <TopDebtorsReport data={topDebtors} loading={debtorsLoading} formatCurrency={formatCurrency} />;
      case 'dso':
        return <DSOReport data={dsoData} loading={dsoLoading} formatCurrency={formatCurrency} />;
      default:
        return <ARAgingReport data={agingData} loading={agingLoading} asOfDate={asOfDate} formatCurrency={formatCurrency} />;
    }
  };

  return (
    <div className="ar-reports-page">
      <div className="page-header">
        <div>
          <h1>Accounts Receivable Reports</h1>
          <p className="page-subtitle">Analyze customer receivables and payment patterns</p>
        </div>
      </div>

      <div className="report-controls">
        <div className="report-selector">
          {reportTypes.map(type => {
            const IconComponent = type.icon;
            return (
              <button
                key={type.id}
                className={`report-type-btn ${reportType === type.id ? 'active' : ''}`}
                onClick={() => setReportType(type.id)}
              >
                <IconComponent size={18} />
                {type.label}
              </button>
            );
          })}
        </div>

        <div className="report-filters">
          {reportType === 'aging' && (
            <FormInput
              label="As of Date"
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="date-filter"
            />
          )}
          
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
      </div>

      <div className="report-content">
        {renderReport()}
      </div>
    </div>
  );
}

// AR Aging Report Component
function ARAgingReport({ data, loading, asOfDate, formatCurrency }) {
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!data) {
    return <div className="no-data">No data available</div>;
  }

  // Column definitions for aging report
  const columnDefs = [
    {
      headerName: 'Customer',
      field: 'customer_name',
      filter: true,
      flex: 1
    },
    {
      headerName: 'Customer Code',
      field: 'customer_code',
      filter: true,
      width: 120
    },
    {
      headerName: 'Total Outstanding',
      field: 'total_outstanding',
      filter: 'agNumberColumnFilter',
      width: 140,
      valueFormatter: (params) => formatCurrency(params.value || 0),
      cellClass: 'amount-cell'
    },
    {
      headerName: 'Current',
      field: 'current_amount',
      filter: 'agNumberColumnFilter',
      width: 120,
      valueFormatter: (params) => formatCurrency(params.value || 0),
      cellClass: 'amount-cell'
    },
    {
      headerName: '1-30 Days',
      field: 'days_1_30',
      filter: 'agNumberColumnFilter',
      width: 120,
      valueFormatter: (params) => formatCurrency(params.value || 0),
      cellClass: 'amount-cell'
    },
    {
      headerName: '31-60 Days',
      field: 'days_31_60',
      filter: 'agNumberColumnFilter',
      width: 120,
      valueFormatter: (params) => formatCurrency(params.value || 0),
      cellClass: 'amount-cell'
    },
    {
      headerName: '61-90 Days',
      field: 'days_61_90',
      filter: 'agNumberColumnFilter',
      width: 120,
      valueFormatter: (params) => formatCurrency(params.value || 0),
      cellClass: 'amount-cell'
    },
    {
      headerName: '90+ Days',
      field: 'days_over_90',
      filter: 'agNumberColumnFilter',
      width: 120,
      valueFormatter: (params) => formatCurrency(params.value || 0),
      cellClass: 'amount-cell'
    }
  ];

  // Summary cards
  const summary = data.summary || {};

  return (
    <div className="ar-aging-report">
      <div className="report-summary">
        <div className="summary-card">
          <div className="summary-content">
            <div className="summary-icon">
              <DollarSign size={24} />
            </div>
            <div className="summary-text">
              <div className="summary-value">{formatCurrency(summary.totalReceivables || 0)}</div>
              <div className="summary-label">Total Receivables</div>
            </div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-content">
            <div className="summary-icon">
              <TrendingDown size={24} />
            </div>
            <div className="summary-text">
              <div className="summary-value">{formatCurrency(summary.total_1_30 || 0)}</div>
              <div className="summary-label">Current & 1-30 Days</div>
            </div>
          </div>
        </div>

        <div className="summary-card warning">
          <div className="summary-content">
            <div className="summary-icon">
              <AlertTriangle size={24} />
            </div>
            <div className="summary-text">
              <div className="summary-value">{formatCurrency(summary.total_over_90 || 0)}</div>
              <div className="summary-label">Over 90 Days</div>
            </div>
          </div>
        </div>
      </div>

      <div className="aging-grid-container">
        <h3>AR Aging as of {new Date(asOfDate).toLocaleDateString()}</h3>
        <div className="ag-theme-quartz" style={{ height: 500, width: '100%' }}>
          <AgGridReact
            rowData={data.agingBuckets || []}
            columnDefs={columnDefs}
            defaultColDef={{
              resizable: true,
              sortable: true,
              filter: true
            }}
            pagination={true}
            paginationPageSize={15}
            paginationPageSizeSelector={[10, 15, 25, 50]}
            rowSelection={{ mode: 'singleRow' }}
            onGridReady={(params) => {
              params.api.sizeColumnsToFit({
                defaultMinWidth: 100,
                columnLimits: []
              });
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Receivables Summary Component
function ReceivablesSummary({ data, loading, formatCurrency }) {
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!data) {
    return <div className="no-data">No data available</div>;
  }

  return (
    <div className="receivables-summary">
      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-content">
            <div className="summary-icon">
              <DollarSign size={24} />
            </div>
            <div className="summary-text">
              <div className="summary-value">{formatCurrency(data.totalValue || 0)}</div>
              <div className="summary-label">Total Invoices</div>
            </div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-content">
            <div className="summary-icon">
              <DollarSign size={24} />
            </div>
            <div className="summary-text">
              <div className="summary-value">{formatCurrency(data.totalOutstanding || 0)}</div>
              <div className="summary-label">Total Outstanding</div>
            </div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-content">
            <div className="summary-icon">
              <DollarSign size={24} />
            </div>
            <div className="summary-text">
              <div className="summary-value">{formatCurrency(data.totalPaid || 0)}</div>
              <div className="summary-label">Total Paid</div>
            </div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-content">
            <div className="summary-icon">
              <AlertTriangle size={24} />
            </div>
            <div className="summary-text">
              <div className="summary-value">{data.overdue?.count || 0}</div>
              <div className="summary-label">Overdue Invoices</div>
            </div>
          </div>
        </div>
      </div>

      <div className="status-breakdown">
        <h3>Invoice Status Breakdown</h3>
        <div className="status-chart">
          <div className="status-item">
            <div className="status-label">Unpaid</div>
            <div className="status-bar">
              <div 
                className="status-fill unpaid" 
                style={{ 
                  width: `${data.statusBreakdown?.unpaid?.count ? 
                    (data.statusBreakdown.unpaid.count / 
                    (data.totalInvoices || 1)) * 100 : 0}%` 
                }}
              ></div>
            </div>
            <div className="status-count">{data.statusBreakdown?.unpaid?.count || 0}</div>
          </div>
          <div className="status-item">
            <div className="status-label">Partially Paid</div>
            <div className="status-bar">
              <div 
                className="status-fill partiallyPaid" 
                style={{ 
                  width: `${data.statusBreakdown?.partiallyPaid?.count ? 
                    (data.statusBreakdown.partiallyPaid.count / 
                    (data.totalInvoices || 1)) * 100 : 0}%` 
                }}
              ></div>
            </div>
            <div className="status-count">{data.statusBreakdown?.partiallyPaid?.count || 0}</div>
          </div>
          <div className="status-item">
            <div className="status-label">Overdue</div>
            <div className="status-bar">
              <div 
                className="status-fill overdue" 
                style={{ 
                  width: `${data.statusBreakdown?.overdue?.count ? 
                    (data.statusBreakdown.overdue.count / 
                    (data.totalInvoices || 1)) * 100 : 0}%` 
                }}
              ></div>
            </div>
            <div className="status-count">{data.statusBreakdown?.overdue?.count || 0}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Top Debtors Report
function TopDebtorsReport({ data, loading, formatCurrency }) {
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!data) {
    return <div className="no-data">No data available</div>;
  }

  const columnDefs = [
    {
      headerName: 'Customer',
      field: 'customer_name',
      filter: true,
      flex: 1
    },
    {
      headerName: 'Customer Code',
      field: 'customer_code',
      filter: true,
      width: 120
    },
    {
      headerName: 'Outstanding Balance',
      field: 'outstanding_balance',
      filter: 'agNumberColumnFilter',
      width: 160,
      valueFormatter: (params) => formatCurrency(params.value),
      cellClass: 'amount-cell'
    },
    {
      headerName: 'Total Invoiced',
      field: 'total_invoiced',
      filter: 'agNumberColumnFilter',
      width: 140,
      valueFormatter: (params) => formatCurrency(params.value),
      cellClass: 'amount-cell'
    },
    {
      headerName: 'Invoice Count',
      field: 'invoice_count',
      filter: 'agNumberColumnFilter',
      width: 120,
      cellClass: 'number-cell'
    }
  ];

  return (
    <div className="top-debtors-report">
      <div className="ag-theme-quartz" style={{ height: 500, width: '100%' }}>
        <AgGridReact
          rowData={data}
          columnDefs={columnDefs}
          defaultColDef={{
            resizable: true,
            sortable: true,
            filter: true
          }}
          pagination={true}
          paginationPageSize={20}
          paginationPageSizeSelector={[10, 20, 50, 100]}
          rowSelection="single"
          onGridReady={(params) => {
            params.api.sizeColumnsToFit({
              defaultMinWidth: 100,
              columnLimits: []
            });
          }}
        />
      </div>
    </div>
  );
}

// Days Sales Outstanding Report
function DSOReport({ data, loading, formatCurrency }) {
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!data) {
    return <div className="no-data">No data available</div>;
  }

  return (
    <div className="dso-report">
      <div className="dso-metric">
        <div className="metric-card">
          <div className="metric-content">
            <div className="metric-icon">
              <Calendar size={32} />
            </div>
            <div className="metric-text">
              <div className="metric-value">{data.dso}</div>
              <div className="metric-label">Days Sales Outstanding</div>
            </div>
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
      </div>

      <div className="dso-info">
        <h4>About Days Sales Outstanding (DSO)</h4>
        <p>
          DSO = (Total Accounts Receivable ÷ Total Credit Sales) × Number of Days<br />
          DSO measures the average number of days it takes to collect payment after a sale.
        </p>
        <p className="dso-calculation">{data.calculation}</p>
      </div>
    </div>
  );
}