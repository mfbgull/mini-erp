import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSettings } from '../../context/SettingsContext';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calculator,
  Download,
  Filter,
  BarChart3
} from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import api from '../../utils/api';
import Button from '../../components/common/Button';
import DateRangePicker from '../../components/common/DateRangePicker';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import './FinancialReports.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function ProfitLossReport() {
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0]
  });
  const [showFilters, setShowFilters] = useState(false);
  const { formatCurrency } = useSettings();

  // Fetch profit & loss report
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['profitLoss', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('fromDate', dateRange.fromDate);
      params.append('toDate', dateRange.toDate);

      const response = await api.get(`/reports/profit-loss?${params}`);
      return response.data.data;
    }
  });

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    refetch();
  };

  const handleExport = (format = 'pdf') => {
    if (!reportData) {
      console.error('No data to export');
      return;
    }

    // Prepare data for export
    const exportData = [
      { metric: 'Total Revenue', value: reportData.totalRevenue },
      { metric: 'Cost of Goods Sold (COGS)', value: reportData.totalCogs },
      { metric: 'Gross Profit', value: reportData.grossProfit },
      { metric: 'Total Expenses', value: reportData.totalExpenses },
      { metric: 'Net Profit', value: reportData.netProfit },
      { metric: 'Gross Profit Margin (%)', value: reportData.grossProfitMargin },
      { metric: 'Net Profit Margin (%)', value: reportData.netProfitMargin }
    ];

    // Column definitions for export
    const exportColumns = [
      {
        headerName: 'Metric',
        field: 'metric'
      },
      {
        headerName: 'Value',
        field: 'value',
        valueFormatter: (params) => {
          // Format as currency for monetary values, percentage for margins
          if (['Total Revenue', 'Cost of Goods Sold (COGS)', 'Gross Profit', 'Total Expenses', 'Net Profit'].includes(params.row?.metric)) {
            return formatCurrency(params.value);
          } else if (params.row?.metric?.includes('Margin')) {
            return `${params.value}%`;
          }
          return params.value;
        }
      }
    ];

    if (format === 'pdf') {
      exportToPDF(
        exportData,
        exportColumns,
        'Profit & Loss Report',
        `profit-loss-${new Date().toISOString().split('T')[0]}.pdf`
      );
    } else if (format === 'excel') {
      exportToExcel(
        exportData,
        exportColumns,
        'Profit & Loss Report',
        `profit-loss-${new Date().toISOString().split('T')[0]}.csv`
      );
    }
  };

  // Chart data for profit & loss
  const chartData = {
    labels: ['Revenue', 'COGS', 'Gross Profit', 'Expenses', 'Net Profit'],
    datasets: [
      {
        label: 'Amount',
        data: [
          reportData?.totalRevenue || 0,
          -(reportData?.totalCogs || 0), // Negative for COGS
          reportData?.grossProfit || 0,
          -(reportData?.totalExpenses || 0), // Negative for expenses
          reportData?.netProfit || 0
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)', // Revenue - Blue
          'rgba(255, 99, 132, 0.8)', // COGS - Red
          'rgba(75, 192, 192, 0.8)', // Gross Profit - Teal
          'rgba(255, 159, 64, 0.8)', // Expenses - Orange
          'rgba(75, 192, 192, 0.8)'  // Net Profit - Teal
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(75, 192, 192, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Profit & Loss Breakdown',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      }
    }
  };

  return (
    <div className="profit-loss-report">
      <div className="page-header">
        <div>
          <h1>Profit & Loss Report</h1>
          <p className="page-subtitle">Financial performance analysis for the selected period</p>
        </div>
      </div>

      <div className="report-controls">
        <Button
          variant="secondary"
          onClick={() => setShowFilters(!showFilters)}
          className="filter-toggle"
        >
          <Filter size={18} />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>

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

      {showFilters && (
        <form onSubmit={handleFilterSubmit} className="report-filters">
          <div className="filter-row">
            <DateRangePicker
              fromDate={dateRange.fromDate}
              toDate={dateRange.toDate}
              onFromDateChange={(date) => setDateRange(prev => ({ ...prev, fromDate: date }))}
              onToDateChange={(date) => setDateRange(prev => ({ ...prev, toDate: date }))}
            />

            <Button type="submit" variant="primary" className="apply-filters-btn">
              Apply Filters
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : reportData ? (
        <div className="report-content">
          <div className="financial-summary">
            <div className="summary-item revenue">
              <div className="summary-content">
                <div className="summary-icon">
                  <DollarSign size={24} />
                </div>
                <div className="summary-text">
                  <div className="summary-value">{formatCurrency(reportData.totalRevenue)}</div>
                  <div className="summary-label">Total Revenue</div>
                </div>
              </div>
            </div>

            <div className="summary-item cogs">
              <div className="summary-content">
                <div className="summary-icon">
                  <TrendingDown size={24} />
                </div>
                <div className="summary-text">
                  <div className="summary-value negative">{formatCurrency(reportData.totalCogs)}</div>
                  <div className="summary-label">Cost of Goods Sold (COGS)</div>
                </div>
              </div>
            </div>

            <div className="summary-item gross-profit">
              <div className="summary-content">
                <div className="summary-icon">
                  <TrendingUp size={24} />
                </div>
                <div className="summary-text">
                  <div className="summary-value">{formatCurrency(reportData.grossProfit)}</div>
                  <div className="summary-label">Gross Profit</div>
                </div>
              </div>
            </div>

            <div className="summary-item expenses">
              <div className="summary-content">
                <div className="summary-icon">
                  <Calculator size={24} />
                </div>
                <div className="summary-text">
                  <div className="summary-value negative">{formatCurrency(reportData.totalExpenses)}</div>
                  <div className="summary-label">Total Expenses</div>
                </div>
              </div>
            </div>

            <div className="summary-item net-profit">
              <div className="summary-content">
                <div className="summary-icon">
                  <DollarSign size={24} />
                </div>
                <div className="summary-text">
                  <div className="summary-value">{formatCurrency(reportData.netProfit)}</div>
                  <div className="summary-label">Net Profit</div>
                </div>
              </div>
            </div>
          </div>

          <div className="financial-metrics">
            <div className="metric-card">
              <div className="metric-content">
                <div className="metric-icon">
                  <TrendingUp size={24} />
                </div>
                <div className="metric-text">
                  <div className="metric-value">{reportData.grossProfitMargin}%</div>
                  <div className="metric-label">Gross Profit Margin</div>
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-content">
                <div className="metric-icon">
                  <TrendingUp size={24} />
                </div>
                <div className="metric-text">
                  <div className="metric-value">{reportData.netProfitMargin}%</div>
                  <div className="metric-label">Net Profit Margin</div>
                </div>
              </div>
            </div>
          </div>

          <div className="chart-container">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      ) : (
        <div className="no-data">
          <Calculator size={48} />
          <h3>No financial data found</h3>
          <p>Try adjusting your filters to see profit & loss data.</p>
        </div>
      )}
    </div>
  );
}