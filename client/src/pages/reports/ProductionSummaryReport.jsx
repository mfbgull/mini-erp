import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSettings } from '../../context/SettingsContext';
import {
  Factory,
  Package,
  TrendingUp,
  FileText,
  DollarSign,
  Calendar,
  Download,
  Filter,
  BarChart3,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry } from 'ag-grid-community';
import { ClientSideRowModelModule } from 'ag-grid-community';
import api from '../../utils/api';
import Button from '../../components/common/Button';
import DateRangePicker from '../../components/common/DateRangePicker';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import './ProductionSummaryReport.css';

// Register AG Grid modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

export default function ProductionSummaryReport() {
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0]
  });
  const [showFilters, setShowFilters] = useState(false);
  const { formatCurrency } = useSettings();

  // Fetch production summary report
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['productionSummary', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('fromDate', dateRange.fromDate);
      params.append('toDate', dateRange.toDate);

      const response = await api.get(`/reports/production-summary?${params}`);
      return response.data.data;
    }
  });

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    refetch();
  };

  const handleExport = (format = 'pdf') => {
    if (!reportData?.production) {
      console.error('No data to export');
      return;
    }

    // Column definitions for export (matching the grid columns)
    const exportColumns = [
      {
        headerName: 'Production Date',
        field: 'production_date',
        valueFormatter: (params) => {
          return params.value ? new Date(params.value).toLocaleDateString() : '';
        }
      },
      {
        headerName: 'Production Order',
        field: 'production_order_number'
      },
      {
        headerName: 'Output Item',
        field: 'output_item_name'
      },
      {
        headerName: 'Output Quantity',
        field: 'output_quantity'
      },
      {
        headerName: 'Completed Quantity',
        field: 'completed_quantity'
      },
      {
        headerName: 'Scrapped Quantity',
        field: 'scrapped_quantity'
      },
      {
        headerName: 'Status',
        field: 'status'
      }
    ];

    if (format === 'pdf') {
      exportToPDF(
        reportData.production,
        exportColumns,
        'Production Summary Report',
        `production-summary-${new Date().toISOString().split('T')[0]}.pdf`
      );
    } else if (format === 'excel') {
      exportToExcel(
        reportData.production,
        exportColumns,
        'Production Summary Report',
        `production-summary-${new Date().toISOString().split('T')[0]}.csv`
      );
    }
  };

  // Column definitions for production data
  const columnDefs = [
    {
      headerName: 'Production Date',
      field: 'production_date',
      filter: 'agDateColumnFilter',
      width: 120,
      valueFormatter: (params) => {
        return params.value ? new Date(params.value).toLocaleDateString() : '';
      }
    },
    {
      headerName: 'Production Order',
      field: 'production_order_number',
      filter: true,
      width: 140
    },
    {
      headerName: 'Output Item',
      field: 'output_item_name',
      filter: true,
      flex: 1
    },
    {
      headerName: 'Output Quantity',
      field: 'output_quantity',
      filter: 'agNumberColumnFilter',
      width: 120,
      cellClass: 'number-cell'
    },
    {
      headerName: 'Completed Quantity',
      field: 'completed_quantity',
      filter: 'agNumberColumnFilter',
      width: 140,
      cellClass: 'number-cell'
    },
    {
      headerName: 'Scrapped Quantity',
      field: 'scrapped_quantity',
      filter: 'agNumberColumnFilter',
      width: 140,
      cellClass: 'number-cell'
    },
    {
      headerName: 'Status',
      field: 'status',
      filter: true,
      width: 120,
      cellClass: (params) => {
        const status = params.value?.toLowerCase();
        if (status === 'completed') return 'status-paid';
        if (status === 'in progress') return 'status-partially-paid';
        if (status === 'pending') return 'status-unpaid';
        return '';
      }
    }
  ];

  return (
    <div className="production-summary-report">
      <div className="page-header">
        <div>
          <h1>Production Summary Report</h1>
          <p className="page-subtitle">Comprehensive analysis of production performance</p>
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

      {reportData?.summary && (
        <div className="report-summary">
          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon">
                <Factory size={24} />
              </div>
              <div className="summary-text">
                <div className="summary-value">{reportData.summary.totalProductionOrders}</div>
                <div className="summary-label">Total Production Orders</div>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon">
                <Package size={24} />
              </div>
              <div className="summary-text">
                <div className="summary-value">{reportData.summary.totalOutput}</div>
                <div className="summary-label">Total Output Quantity</div>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon">
                <CheckCircle size={24} />
              </div>
              <div className="summary-text">
                <div className="summary-value">{reportData.summary.totalCompleted}</div>
                <div className="summary-label">Completed Quantity</div>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon">
                <XCircle size={24} />
              </div>
              <div className="summary-text">
                <div className="summary-value">{reportData.summary.totalScrapped}</div>
                <div className="summary-label">Scrapped Quantity</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="report-content">
        {isLoading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : reportData?.production && reportData.production.length > 0 ? (
          <div className="ag-theme-quartz" style={{ height: 600, width: '100%' }}>
            <AgGridReact
              rowData={reportData.production || []}
              columnDefs={columnDefs}
              defaultColDef={{
                resizable: true,
                sortable: true,
                filter: true
              }}
              pagination={true}
              paginationPageSize={20}
              paginationPageSizeSelector={[10, 20, 50, 100]}
              rowSelection={{ mode: 'singleRow' }}
              onGridReady={(params) => {
                params.api.sizeColumnsToFit({
                  defaultMinWidth: 100,
                  columnLimits: []
                });
              }}
            />
          </div>
        ) : (
          <div className="no-data">
            <Factory size={48} />
            <h3>No production data found</h3>
            <p>Try adjusting your filters to see production data.</p>
          </div>
        )}
      </div>
    </div>
  );
}