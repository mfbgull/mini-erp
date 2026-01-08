import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSettings } from '../../context/SettingsContext';
import {
  Users,
  DollarSign,
  AlertTriangle,
  Calendar,
  Download,
  Filter,
  Eye,
  Edit,
  Plus
} from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry } from 'ag-grid-community';
import { ClientSideRowModelModule } from 'ag-grid-community';
import api from '../../utils/api';
import Button from '../../components/common/Button';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import './TopDebtorsReport.css';

// Register AG Grid modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

export default function TopDebtorsReport() {
  const [limit, setLimit] = useState(10); // Top 10 debtors by default
  const [showFilters, setShowFilters] = useState(false);
  const { formatCurrency } = useSettings();

  // Fetch top debtors report
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['topDebtors', limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('limit', limit);

      const response = await api.get(`/reports/top-debtors?${params}`);
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

    // Column definitions for export (matching the grid columns)
    const exportColumns = [
      {
        headerName: 'Customer Name',
        field: 'customer_name'
      },
      {
        headerName: 'Customer Code',
        field: 'customer_code'
      },
      {
        headerName: 'Email',
        field: 'email'
      },
      {
        headerName: 'Phone',
        field: 'phone'
      },
      {
        headerName: 'Outstanding Balance',
        field: 'outstanding_balance',
        valueFormatter: (params) => formatCurrency(params.value || 0)
      },
      {
        headerName: 'Total Invoiced',
        field: 'total_invoiced',
        valueFormatter: (params) => formatCurrency(params.value || 0)
      },
      {
        headerName: 'Invoice Count',
        field: 'invoice_count'
      },
      {
        headerName: 'Last Invoice Date',
        field: 'last_invoice_date',
        valueFormatter: (params) => {
          return params.value ? new Date(params.value).toLocaleDateString() : '';
        }
      }
    ];

    if (format === 'pdf') {
      exportToPDF(
        reportData,
        exportColumns,
        'Top Debtors Report',
        `top-debtors-${new Date().toISOString().split('T')[0]}.pdf`
      );
    } else if (format === 'excel') {
      exportToExcel(
        reportData,
        exportColumns,
        'Top Debtors Report',
        `top-debtors-${new Date().toISOString().split('T')[0]}.csv`
      );
    }
  };

  // Column definitions for top debtors data
  const columnDefs = [
    {
      headerName: 'Customer Name',
      field: 'customer_name',
      filter: true,
      flex: 1
    },
    {
      headerName: 'Customer Code',
      field: 'customer_code',
      filter: true,
      width: 140
    },
    {
      headerName: 'Email',
      field: 'email',
      filter: true,
      width: 200
    },
    {
      headerName: 'Phone',
      field: 'phone',
      filter: true,
      width: 140
    },
    {
      headerName: 'Outstanding Balance',
      field: 'outstanding_balance',
      filter: 'agNumberColumnFilter',
      width: 160,
      valueFormatter: (params) => formatCurrency(params.value || 0),
      cellClass: 'amount-cell'
    },
    {
      headerName: 'Total Invoiced',
      field: 'total_invoiced',
      filter: 'agNumberColumnFilter',
      width: 140,
      valueFormatter: (params) => formatCurrency(params.value || 0),
      cellClass: 'amount-cell'
    },
    {
      headerName: 'Invoice Count',
      field: 'invoice_count',
      filter: 'agNumberColumnFilter',
      width: 120,
      cellClass: 'number-cell'
    },
    {
      headerName: 'Last Invoice Date',
      field: 'last_invoice_date',
      filter: 'agDateColumnFilter',
      width: 140,
      valueFormatter: (params) => {
        return params.value ? new Date(params.value).toLocaleDateString() : '';
      }
    }
  ];

  return (
    <div className="top-debtors-report">
      <div className="page-header">
        <div>
          <h1>Top Debtors Report</h1>
          <p className="page-subtitle">Customers with the highest outstanding balances</p>
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
            <div className="filter-group">
              <label>Top Debtors Limit</label>
              <select
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="filter-select"
              >
                <option value={5}>Top 5</option>
                <option value={10}>Top 10</option>
                <option value={20}>Top 20</option>
                <option value={50}>Top 50</option>
              </select>
            </div>

            <Button type="submit" variant="primary" className="apply-filters-btn">
              Apply Filters
            </Button>
          </div>
        </form>
      )}

      <div className="report-content">
        {isLoading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : reportData && reportData.length > 0 ? (
          <div className="ag-theme-quartz" style={{ height: 600, width: '100%' }}>
            <AgGridReact
              rowData={reportData}
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
            <Users size={48} />
            <h3>No top debtors data found</h3>
            <p>Try adjusting your filters to see top debtors data.</p>
          </div>
        )}
      </div>
    </div>
  );
}