import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSettings } from '../../context/SettingsContext';
import {
  Package,
  ArrowUp,
  ArrowDown,
  PackagePlus,
  PackageMinus,
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
import DateRangePicker from '../../components/common/DateRangePicker';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import './InventoryMovementReport.css';

// Register AG Grid modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

export default function InventoryMovementReport() {
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0]
  });
  const [itemId, setItemId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [movementType, setMovementType] = useState('all'); // all, in, out
  const [showFilters, setShowFilters] = useState(false);
  const { formatCurrency } = useSettings();
  const gridRef = useRef(null);

  // Safely size columns when grid is visible
  useEffect(() => {
    const gridElement = gridRef.current?.querySelector('.ag-theme-quartz');
    if (!gridElement) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          const gridApi = gridRef.current?.api;
          if (gridApi) {
            gridApi.sizeColumnsToFit({
              defaultMinWidth: 100,
              columnLimits: []
            });
          }
          observer.disconnect();
          break;
        }
      }
    });

    observer.observe(gridElement);
    return () => observer.disconnect();
  }, [reportData]);

  // Fetch items for filter
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const response = await api.get('/inventory/items');
      console.log('Items API response:', response.data);
      return response.data.data || [];
    }
  });

  // Fetch warehouses for filter
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const response = await api.get('/inventory/warehouses');
      return response.data.data || [];
    }
  });

  // Fetch inventory movement report
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['inventoryMovement', dateRange, itemId, warehouseId, movementType],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('fromDate', dateRange.fromDate);
      params.append('toDate', dateRange.toDate);
      if (itemId) params.append('itemId', itemId);
      if (warehouseId) params.append('warehouseId', warehouseId);
      if (movementType !== 'all') params.append('movementType', movementType);

      const response = await api.get(`/reports/inventory-movement?${params}`);
      return response.data.data;
    }
  });

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    refetch();
  };

  const handleExport = (format = 'pdf') => {
    if (!reportData?.movements) {
      console.error('No data to export');
      return;
    }

    // Column definitions for export (matching the grid columns)
    const exportColumns = [
      {
        headerName: 'Date',
        field: 'movement_date',
        valueFormatter: (params) => {
          return params.value ? new Date(params.value).toLocaleDateString() : '';
        }
      },
      {
        headerName: 'Item Name',
        field: 'item_name'
      },
      {
        headerName: 'Item Code',
        field: 'item_code'
      },
      {
        headerName: 'Warehouse',
        field: 'warehouse_name'
      },
      {
        headerName: 'Movement Type',
        field: 'movement_type'
      },
      {
        headerName: 'Reference',
        field: 'reference'
      },
      {
        headerName: 'Quantity',
        field: 'quantity'
      },
      {
        headerName: 'Unit Cost',
        field: 'unit_cost',
        valueFormatter: (params) => formatCurrency(params.value || 0)
      },
      {
        headerName: 'Total Value',
        field: 'total_value',
        valueFormatter: (params) => formatCurrency(params.value || 0)
      }
    ];

    if (format === 'pdf') {
      exportToPDF(
        reportData.movements,
        exportColumns,
        'Inventory Movement Report',
        `inventory-movement-${new Date().toISOString().split('T')[0]}.pdf`
      );
    } else if (format === 'excel') {
      exportToExcel(
        reportData.movements,
        exportColumns,
        'Inventory Movement Report',
        `inventory-movement-${new Date().toISOString().split('T')[0]}.csv`
      );
    }
  };

  // Column definitions for inventory movement data
  const columnDefs = [
    {
      headerName: 'Date',
      field: 'movement_date',
      filter: 'agDateColumnFilter',
      width: 120,
      valueFormatter: (params) => {
        return params.value ? new Date(params.value).toLocaleDateString() : '';
      }
    },
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
      width: 120
    },
    {
      headerName: 'Warehouse',
      field: 'warehouse_name',
      filter: true,
      width: 140
    },
    {
      headerName: 'Movement Type',
      field: 'movement_type',
      filter: true,
      width: 120,
      cellClass: (params) => {
        const type = params.value?.toLowerCase();
        if (type === 'in') return 'movement-in';
        if (type === 'out') return 'movement-out';
        return '';
      }
    },
    {
      headerName: 'Reference',
      field: 'reference',
      filter: true,
      width: 140
    },
    {
      headerName: 'Quantity',
      field: 'quantity',
      filter: 'agNumberColumnFilter',
      width: 100,
      cellClass: 'number-cell'
    },
    {
      headerName: 'Unit Cost',
      field: 'unit_cost',
      filter: 'agNumberColumnFilter',
      width: 120,
      valueFormatter: (params) => formatCurrency(params.value || 0),
      cellClass: 'amount-cell'
    },
    {
      headerName: 'Total Value',
      field: 'total_value',
      filter: 'agNumberColumnFilter',
      width: 140,
      valueFormatter: (params) => formatCurrency(params.value || 0),
      cellClass: 'amount-cell'
    }
  ];

  return (
    <div className="inventory-movement-report">
      <div className="page-header">
        <div>
          <h1>Inventory Movement Report</h1>
          <p className="page-subtitle">Track stock movements across all warehouses</p>
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
              <label>Item</label>
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
              <label>Movement Type</label>
              <select
                value={movementType}
                onChange={(e) => setMovementType(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Types</option>
                <option value="in">Inbound</option>
                <option value="out">Outbound</option>
              </select>
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
                <PackagePlus size={24} />
              </div>
              <div className="summary-text">
                <div className="summary-value">{reportData.summary.totalInbound}</div>
                <div className="summary-label">Total Inbound</div>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon">
                <PackageMinus size={24} />
              </div>
              <div className="summary-text">
                <div className="summary-value">{reportData.summary.totalOutbound}</div>
                <div className="summary-label">Total Outbound</div>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon">
                <Package size={24} />
              </div>
              <div className="summary-text">
                <div className="summary-value">{reportData.summary.netMovement}</div>
                <div className="summary-label">Net Movement</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="report-content" ref={gridRef}>
        {isLoading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : reportData?.movements && reportData.movements.length > 0 ? (
          <div className="ag-theme-quartz" style={{ height: 600, width: '100%' }}>
            <AgGridReact
              rowData={reportData.movements}
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
            />
          </div>
        ) : (
          <div className="no-data">
            <Package size={48} />
            <h3>No inventory movement data found</h3>
            <p>Try adjusting your filters to see inventory movement data.</p>
          </div>
        )}
      </div>
    </div>
  );
}