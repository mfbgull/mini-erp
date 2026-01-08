import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSettings } from '../../context/SettingsContext';
import {
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
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
import './DSOReport.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function DSOReport() {
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0]
  });
  const [showFilters, setShowFilters] = useState(false);
  const { formatCurrency } = useSettings();

  // Fetch DSO report
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['dso', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('fromDate', dateRange.fromDate);
      params.append('toDate', dateRange.toDate);

      const response = await api.get(`/reports/dso?${params}`);
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
      { metric: 'Days Sales Outstanding', value: reportData.dso },
      { metric: 'Period (days)', value: reportData.period },
      { metric: 'Total Sales', value: reportData.totalSales },
      { metric: 'Total AR', value: reportData.totalAR },
      { metric: 'Avg. Invoice Value', value: reportData.avgInvoiceValue }
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
          // Format as currency for monetary values, regular number for DSO and period
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
  };

  // Chart data for DSO
  const chartData = {
    labels: ['Current Period DSO', 'Previous Period DSO', 'Industry Average'],
    datasets: [
      {
        label: 'Days',
        data: [
          reportData?.dso || 0,
          reportData?.previousDso || 0,
          reportData?.industryAverage || 30 // Assuming industry average of 30 days
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)', // Current - Blue
          'rgba(255, 159, 64, 0.8)', // Previous - Orange
          'rgba(75, 192, 192, 0.8)'  // Industry - Teal
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
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
        text: 'Days Sales Outstanding Comparison',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value + ' days';
          }
        }
      }
    }
  };

  return (
    <div className="dso-report">
      <div className="page-header">
        <div>
          <h1>Days Sales Outstanding (DSO) Report</h1>
          <p className="page-subtitle">Measure of the average number of days it takes to collect payment after a sale</p>
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
          <div className="dso-metrics">
            <div className="metric-card primary">
              <div className="metric-content">
                <div className="metric-icon">
                  <Calendar size={32} />
                </div>
                <div className="metric-text">
                  <div className="metric-value">{reportData.dso}</div>
                  <div className="metric-label">Days Sales Outstanding</div>
                </div>
              </div>
            </div>

            <div className="metric-card secondary">
              <div className="metric-content">
                <div className="metric-icon">
                  <TrendingUp size={32} />
                </div>
                <div className="metric-text">
                  <div className="metric-value">{reportData.previousDso}</div>
                  <div className="metric-label">Previous Period DSO</div>
                </div>
              </div>
            </div>

            <div className="metric-card tertiary">
              <div className="metric-content">
                <div className="metric-icon">
                  <TrendingDown size={32} />
                </div>
                <div className="metric-text">
                  <div className="metric-value">{reportData.industryAverage || 30}</div>
                  <div className="metric-label">Industry Average</div>
                </div>
              </div>
            </div>
          </div>

          <div className="dso-details">
            <div className="detail-card">
              <h4>Financial Data</h4>
              <div className="detail-item">
                <span className="detail-label">Period (days):</span>
                <span className="detail-value">{reportData.period}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Total Sales:</span>
                <span className="detail-value">{formatCurrency(reportData.totalSales || 0)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Total AR:</span>
                <span className="detail-value">{formatCurrency(reportData.totalAR || 0)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Avg. Invoice Value:</span>
                <span className="detail-value">{formatCurrency(reportData.avgInvoiceValue || 0)}</span>
              </div>
            </div>

            <div className="detail-card">
              <h4>DSO Calculation</h4>
              <div className="dso-formula">
                <p>DSO = (Total Accounts Receivable ÷ Total Credit Sales) × Number of Days</p>
                <p className="dso-calculation">
                  {reportData.calculation || 
                    `DSO = (${formatCurrency(reportData.totalAR || 0)} ÷ ${formatCurrency(reportData.totalSales || 0)}) × ${reportData.period} = ${reportData.dso} days`}
                </p>
              </div>
              <div className="dso-analysis">
                <h5>Analysis</h5>
                {reportData.dso < 30 ? (
                  <p className="positive-analysis">
                    <TrendingUp size={16} /> Your DSO is below 30 days, indicating efficient collection practices.
                  </p>
                ) : reportData.dso > 60 ? (
                  <p className="negative-analysis">
                    <TrendingDown size={16} /> Your DSO is above 60 days, consider reviewing your collection process.
                  </p>
                ) : (
                  <p className="neutral-analysis">
                    Your DSO is within acceptable range, but there's room for improvement.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="chart-container">
            <Bar data={chartData} options={chartOptions} />
          </div>

          <div className="dso-info">
            <h3>About Days Sales Outstanding (DSO)</h3>
            <p>
              DSO measures the average number of days it takes for a company to collect payment after a sale has been made.
              A lower DSO indicates that the company is collecting payments quickly, while a higher DSO indicates slower collections.
            </p>
            <p>
              <strong>Industry Benchmarks:</strong> 
              • Excellent: Below 30 days
              • Good: 30-45 days  
              • Needs Attention: Above 45 days
              • Poor: Above 60 days
            </p>
          </div>
        </div>
      ) : (
        <div className="no-data">
          <Calculator size={48} />
          <h3>No DSO data found</h3>
          <p>Try adjusting your filters to see DSO data.</p>
        </div>
      )}
    </div>
  );
}