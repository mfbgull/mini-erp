import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSettings } from '../../context/SettingsContext';
import {
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
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

export default function StockLevelReport() {
  const [warehouseId, setWarehouseId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [showZeroStock, setShowZeroStock] = useState(true);
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

  // Fetch items for categories
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const response = await api.get('/inventory/items');
      console.log('Items API response:', response.data);
      return response.data.data || [];
    }
  });

  // Get unique categories
  const categories = [...new Set(items.map(item => item.item_category).filter(Boolean))];

  // Fetch stock level report
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['stockLevel', warehouseId, categoryId, showZeroStock],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (warehouseId) params.append('warehouseId', warehouseId);
      if (categoryId) params.append('categoryId', categoryId);
      params.append('showZeroStock', showZeroStock);

      const response = await api.get(`/reports/stock-level?${params}`);
      return response.data.data;
    }
  });

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    refetch();
  };

  const handleExport = (format = 'pdf') => {
    if (!reportData?.stockLevels) {
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
        headerName: 'UOM',
        field: 'unit_of_measure'
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
        headerName: 'Reorder Level',
        field: 'reorder_level'
      },
      {
        headerName: 'Selling Price',
        field: 'standard_selling_price',
        valueFormatter: (params) => formatCurrency(params.value || 0)
      },
      {
        headerName: 'Status',
        field: 'stock_status'
      }
    ];

    if (format === 'pdf') {
      exportToPDF(
        reportData.stockLevels,
        exportColumns,
        'Stock Level Report',
        `stock-level-${new Date().toISOString().split('T')[0]}.pdf`
      );
    } else if (format === 'excel') {
      exportToExcel(
        reportData.stockLevels,
        exportColumns,
        'Stock Level Report',
        `stock-level-${new Date().toISOString().split('T')[0]}.csv`
      );
    }
  };

  // Column definitions for stock level data
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
      headerName: 'UOM',
      field: 'unit_of_measure',
      filter: true,
      width: 100
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
      headerName: 'Reorder Level',
      field: 'reorder_level',
      filter: 'agNumberColumnFilter',
      width: 140,
      cellClass: 'number-cell'
    },
    {
      headerName: 'Selling Price',
      field: 'standard_selling_price',
      filter: 'agNumberColumnFilter',
      width: 140,
      valueFormatter: (params) => formatCurrency(params.value || 0),
      cellClass: 'amount-cell'
    },
    {
      headerName: 'Status',
      field: 'stock_status',
      filter: true,
      width: 140,
      cellClass: (params) => {
        const status = params.value?.toLowerCase();
        if (status === 'out of stock') return 'status-out-of-stock';
        if (status === 'low stock') return 'status-low-stock';
        return 'status-in-stock';
      }
    }
  ];

  return (
    <div className="stock-level-report">
      <div className="page-header">
        <div>
          <h1>Stock Level Report</h1>
          <p className="page-subtitle">Current inventory levels across all warehouses</p>
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

            <div className="filter-group">
              <label>Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="filter-select"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={showZeroStock}
                  onChange={(e) => setShowZeroStock(e.target.checked)}
                />
                Show Zero Stock Items
              </label>
            </div>

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
                <Package size={24} />
              </div>
              <div className="summary-text">
                <div className="summary-value">{reportData.summary.totalItems}</div>
                <div className="summary-label">Total Items</div>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon">
                <CheckCircle size={24} />
              </div>
              <div className="summary-text">
                <div className="summary-value">{reportData.summary.inStock}</div>
                <div className="summary-label">In Stock</div>
              </div>
            </div>
          </div>

          <div className="summary-card warning">
            <div className="summary-content">
              <div className="summary-icon">
                <AlertTriangle size={24} />
              </div>
              <div className="summary-text">
                <div className="summary-value">{reportData.summary.lowStock}</div>
                <div className="summary-label">Low Stock</div>
              </div>
            </div>
          </div>

          <div className="summary-card danger">
            <div className="summary-content">
              <div className="summary-icon">
                <XCircle size={24} />
              </div>
              <div className="summary-text">
                <div className="summary-value">{reportData.summary.outOfStock}</div>
                <div className="summary-label">Out of Stock</div>
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
        ) : reportData?.stockLevels && reportData.stockLevels.length > 0 ? (
          <div className="ag-theme-quartz" style={{ height: 600, width: '100%' }}>
            <AgGridReact
              rowData={reportData.stockLevels}
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
            <Package size={48} />
            <h3>No stock level data found</h3>
            <p>Try adjusting your filters to see stock level data.</p>
          </div>
        )}
      </div>
    </div>
  );
}