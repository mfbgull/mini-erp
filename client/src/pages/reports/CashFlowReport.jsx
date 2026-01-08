import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSettings } from '../../context/SettingsContext';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Download,
  Filter,
  BarChart3
} from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function CashFlowReport() {
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0]
  });
  const [showFilters, setShowFilters] = useState(false);
  const { formatCurrency } = useSettings();

  // Fetch cash flow report
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['cashFlow', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('fromDate', dateRange.fromDate);
      params.append('toDate', dateRange.toDate);

      const response = await api.get(`/reports/cash-flow?${params}`);
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
      { metric: 'Total Cash Inflow', value: reportData.totalInflow },
      { metric: 'Total Cash Outflow', value: reportData.totalOutflow },
      { metric: 'Net Cash Flow', value: reportData.netCashFlow }
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
          return formatCurrency(params.value);
        }
      }
    ];

    if (format === 'pdf') {
      exportToPDF(
        exportData,
        exportColumns,
        'Cash Flow Report',
        `cash-flow-${new Date().toISOString().split('T')[0]}.pdf`
      );
    } else if (format === 'excel') {
      exportToExcel(
        exportData,
        exportColumns,
        'Cash Flow Report',
        `cash-flow-${new Date().toISOString().split('T')[0]}.csv`
      );
    }
  };

  // Chart data for cash flow
  const chartData = {
    labels: ['Cash Inflow', 'Cash Outflow', 'Net Cash Flow'],
    datasets: [
      {
        label: 'Amount',
        data: [
          reportData?.totalInflow || 0,
          -(reportData?.totalOutflow || 0), // Negative for outflow
          reportData?.netCashFlow || 0
        ],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: [
          'rgba(54, 162, 235, 0.5)', // Inflow - Blue
          'rgba(255, 99, 132, 0.5)', // Outflow - Red
          'rgba(75, 192, 192, 0.5)'  // Net - Teal
        ],
        borderWidth: 2,
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
        text: 'Cash Flow Analysis',
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
    <div className="cash-flow-report">
      <div className="page-header">
        <div>
          <h1>Cash Flow Report</h1>
          <p className="page-subtitle">Cash inflow and outflow analysis for the selected period</p>
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
            <div className="summary-row">
              <div className="summary-item inflow">
                <div className="summary-label">Total Cash Inflow</div>
                <div className="summary-value">{formatCurrency(reportData.totalInflow)}</div>
              </div>
            </div>

            <div className="summary-row">
              <div className="summary-item outflow">
                <div className="summary-label">Total Cash Outflow</div>
                <div className="summary-value negative">{formatCurrency(reportData.totalOutflow)}</div>
              </div>
            </div>

            <div className="summary-row">
              <div className="summary-item net">
                <div className="summary-label">Net Cash Flow</div>
                <div className="summary-value">{formatCurrency(reportData.netCashFlow)}</div>
              </div>
            </div>
          </div>

          <div className="chart-container">
            <Bar data={chartData} options={chartOptions} />
          </div>

          <div className="cash-flow-analysis">
            <h3>Cash Flow Analysis</h3>
            <p>
              Net cash flow represents the difference between cash inflows and outflows during the selected period.
              A positive net cash flow indicates that the business has more cash coming in than going out,
              while a negative net cash flow indicates the opposite.
            </p>
            <p>
              Outflows include payments for purchases and business expenses.
            </p>

            {reportData.netCashFlow > 0 ? (
              <p className="positive-analysis">
                <TrendingUp size={16} /> This period shows a positive cash flow, indicating good liquidity.
              </p>
            ) : (
              <p className="negative-analysis">
                <TrendingDown size={16} /> This period shows a negative cash flow, consider reviewing expenses and cash outflows.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="no-data">
          <TrendingUp size={48} />
          <h3>No cash flow data found</h3>
          <p>Try adjusting your filters to see cash flow data.</p>
        </div>
      )}
    </div>
  );
}