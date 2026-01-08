import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSettings } from '../../context/SettingsContext';
import {
  AlertTriangle,
  Package,
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
import './InventoryReports.css';

// Register AG Grid modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

export default function LowStockReport() {
  const [warehouseId, setWarehouseId] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { formatCurrency } = useSettings();

  // Fetch warehouses for filter
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const response = await api.get('/inventory/warehouses');
      return response.data.data || [];
    }
  });

  // Fetch low stock report
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['lowStock', warehouseId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (warehouseId) params.append('warehouseId', warehouseId);

      const response = await api.get(`/reports/low-stock?${params}`);
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
        headerName: 'Item Name',
        field: 'item_name'
      },
      {
        headerName: 'Item Code',
        field: 'item_code'
      },
      {
        headerName: 'Category',
        field: 'item_category'
      },
      {
        headerName: 'Current Stock',
        field: 'current_stock'
      },
      {
        headerName: 'Minimum Stock',
        field: 'minimum_stock'
      },
      {
        headerName: 'Shortage',
        field: 'shortage'
      },
      {
        headerName: 'Reorder Level',
        field: 'reorder_level'
      }
    ];

    if (format === 'pdf') {
      exportToPDF(
        reportData,
        exportColumns,
        'Low Stock Alert Report',
        `low-stock-${new Date().toISOString().split('T')[0]}.pdf`
      );
    } else if (format === 'excel') {
      exportToExcel(
        reportData,
        exportColumns,
        'Low Stock Alert Report',
        `low-stock-${new Date().toISOString().split('T')[0]}.csv`
      );
    }
  };

  // Column definitions for low stock data
  const columnDefs = [
    {
      headerName: 'Item Name',
      field: 'item_name',
      filter: true,
      flex: 1
    },
    {
      headerName: 'Item Code',
      field: 'item_code',
      filter: true,
      width: 140
    },
    {
      headerName: 'Category',
      field: 'item_category',
      filter: true,
      width: 140
    },
    {
      headerName: 'Current Stock',
      field: 'current_stock',
      filter: 'agNumberColumnFilter',
      width: 120,
      cellClass: 'number-cell'
    },
    {
      headerName: 'Minimum Stock',
      field: 'minimum_stock',
      filter: 'agNumberColumnFilter',
      width: 140,
      cellClass: 'number-cell'
    },
    {
      headerName: 'Shortage',
      field: 'shortage',
      filter: 'agNumberColumnFilter',
      width: 120,
      cellClass: 'number-cell'
    },
    {
      headerName: 'Reorder Level',
      field: 'reorder_level',
      filter: 'agNumberColumnFilter',
      width: 140,
      cellClass: 'number-cell'
    }
  ];

  return (
    <div className="low-stock-report">
      <div className="page-header">
        <div>
          <h1>Low Stock Alert Report</h1>
          <p className="page-subtitle">Items that are below minimum stock levels</p>
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
              <label>Warehouse</label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="filter-select"
              >
                <option value="">All Warehouses</option>
                {warehouses.map(warehouse => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.warehouse_name}
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
            <AlertTriangle size={48} />
            <h3>No low stock items found</h3>
            <p>All items are above their minimum stock levels.</p>
          </div>
        )}
      </div>
    </div>
  );
}