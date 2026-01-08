import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSettings } from '../../context/SettingsContext';
import {
  Package,
  FileText,
  Calendar,
  Download,
  Filter,
  BarChart3,
  List,
  Eye,
  Edit,
  Plus
} from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry } from 'ag-grid-community';
import { ClientSideRowModelModule } from 'ag-grid-community';
import api from '../../utils/api';
import Button from '../../components/common/Button';
import DateRangePicker from '../../components/common/DateRangePicker';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import './BOMUsageReport.css';

// Register AG Grid modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

export default function BOMUsageReport() {
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0]
  });
  const [itemId, setItemId] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { formatCurrency } = useSettings();

  // Fetch items for filter
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const response = await api.get('/inventory/items');
      console.log('Items API response:', response.data);
      return response.data.data || [];
    }
  });

  // Fetch BOM usage report
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['bomUsage', dateRange, itemId],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('fromDate', dateRange.fromDate);
      params.append('toDate', dateRange.toDate);
      if (itemId) params.append('itemId', itemId);

      const response = await api.get(`/reports/bom-usage?${params}`);
      return response.data.data;
    }
  });

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    refetch();
  };

  const handleExport = (format = 'pdf') => {
    if (!reportData?.usage) {
      console.error('No data to export');
      return;
    }

    // Column definitions for export (matching the grid columns)
    const exportColumns = [
      {
        headerName: 'BOM Name',
        field: 'bom_name'
      },
      {
        headerName: 'Parent Item',
        field: 'parent_item_name'
      },
      {
        headerName: 'Usage Count',
        field: 'usage_count'
      },
      {
        headerName: 'Last Used',
        field: 'last_used_date',
        valueFormatter: (params) => {
          return params.value ? new Date(params.value).toLocaleDateString() : '';
        }
      },
      {
        headerName: 'Total Components',
        field: 'total_components'
      },
      {
        headerName: 'Status',
        field: 'status'
      }
    ];

    if (format === 'pdf') {
      exportToPDF(
        reportData.usage,
        exportColumns,
        'BOM Usage Report',
        `bom-usage-${new Date().toISOString().split('T')[0]}.pdf`
      );
    } else if (format === 'excel') {
      exportToExcel(
        reportData.usage,
        exportColumns,
        'BOM Usage Report',
        `bom-usage-${new Date().toISOString().split('T')[0]}.csv`
      );
    }
  };

  // Column definitions for BOM usage data
  const columnDefs = [
    {
      headerName: 'BOM Name',
      field: 'bom_name',
      filter: true,
      flex: 1
    },
    {
      headerName: 'Parent Item',
      field: 'parent_item_name',
      filter: true,
      width: 180
    },
    {
      headerName: 'Usage Count',
      field: 'usage_count',
      filter: 'agNumberColumnFilter',
      width: 120,
      cellClass: 'number-cell'
    },
    {
      headerName: 'Last Used',
      field: 'last_used_date',
      filter: 'agDateColumnFilter',
      width: 140,
      valueFormatter: (params) => {
        return params.value ? new Date(params.value).toLocaleDateString() : '';
      }
    },
    {
      headerName: 'Total Components',
      field: 'total_components',
      filter: 'agNumberColumnFilter',
      width: 140,
      cellClass: 'number-cell'
    },
    {
      headerName: 'Status',
      field: 'status',
      filter: true,
      width: 120
    }
  ];

  return (
    <div className="bom-usage-report">
      <div className="page-header">
        <div>
          <h1>BOM Usage Report</h1>
          <p className="page-subtitle">Track usage of Bill of Materials in production</p>
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

            <div className="filter-group">
              <label>Parent Item</label>
              <select
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                className="filter-select"
              >
                <option value="">All Items</option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.item_name}
                  </option>
                ))}
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
        ) : reportData?.usage && reportData.usage.length > 0 ? (
          <div className="ag-theme-quartz" style={{ height: 600, width: '100%' }}>
            <AgGridReact
              rowData={reportData.usage || []}
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
            <List size={48} />
            <h3>No BOM usage data found</h3>
            <p>Try adjusting your filters to see BOM usage data.</p>
          </div>
        )}
      </div>
    </div>
  );
}