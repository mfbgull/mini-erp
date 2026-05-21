import { useState, useEffect, useRef } from 'react';

import { useQuery } from '@tanstack/react-query';
import { ModuleRegistry , ClientSideRowModelModule } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import {
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  Filter,
  X,
  Tag,
  Hash,
  DollarSign,
  AlertCircle
} from 'lucide-react';

import Button from '../../components/common/Button';
import StatCard, { StatsGrid } from '../../components/common/StatCard';
import { useSettings } from '../../context/SettingsContext';
import api from '../../utils/api';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import './InventoryReports.css';

// Register AG Grid modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

export default function StockLevelReport() {
  const [warehouseId, setWarehouseId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [showZeroStock, setShowZeroStock] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const { formatCurrency } = useSettings();

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setShowDetailModal(false);
      }
    };

    if (showDetailModal) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showDetailModal]);

  const handleCardClick = (item) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

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
        <StatsGrid>
          <StatCard
            icon={Package}
            label="Total Items"
            value={reportData.summary.totalItems}
          />
          <StatCard
            icon={CheckCircle}
            label="In Stock"
            value={reportData.summary.inStock}
          />
          <StatCard
            icon={AlertTriangle}
            label="Low Stock"
            value={reportData.summary.lowStock}
            alert={true}
          />
          <StatCard
            icon={XCircle}
            label="Out of Stock"
            value={reportData.summary.outOfStock}
            alert={true}
          />
        </StatsGrid>
      )}

      <div className="report-content">
        {isLoading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : reportData?.stockLevels && reportData.stockLevels.length > 0 ? (
          <>
            {/* Desktop view - AG Grid */}
            <div className="ag-theme-quartz desktop-view ag-grid-container">
              <AgGridReact theme="legacy"
                rowData={reportData.stockLevels}
                columnDefs={columnDefs}
                defaultColDef={{
              theme:"legacy",
                  resizable: true,
                  sortable: true,
                  filter: true
                }}
                getRowId={(params) => params.data.id || params.data.item_code || `row-${params.node.rowIndex}`}
                pagination={true}
                paginationPageSize={20}
                paginationPageSizeSelector={[10, 20, 50, 100]}
                rowSelection={{ mode: 'singleRow' }}
                onGridReady={(params) => {
                  // Check if the grid is visible before sizing columns
                  setTimeout(() => {
                    if (params.api && params.columnApi) {
                      const gridElement = params.api.gridCore.ctrl.main.querySelectorAll('.ag-body-viewport')[0];
                      if (gridElement && gridElement.clientWidth > 0) {
                        params.columnApi.autoSizeAllColumns();
                      }
                    }
                  }, 100); // Small delay to ensure grid is rendered
                }}
              />
            </div>

            <div className="mobile-stock-level-list">
              {reportData.stockLevels.map((item, index) => (
                <div
                  key={item.id || item.item_code || `stock-${index}`}
                  className="stock-level-card"
                  onClick={() => handleCardClick(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCardClick(item);
                    }
                  }}
                >
                  <div className="stock-level-card-content">
                    <h3 className="stock-item-name">{item.item_name}</h3>
                    <span className="stock-item-qty">{item.current_stock} {item.unit_of_measure}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="no-data">
            <Package size={48} />
            <h3>No stock level data found</h3>
            <p>Try adjusting your filters to see stock level data.</p>
          </div>
        )}
      </div>

      {showDetailModal && selectedItem && (
        <div
          className="stock-modal-overlay"
          onClick={() => setShowDetailModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="stock-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="stock-modal-header">
              <h2 className="stock-modal-title">{selectedItem.item_name}</h2>
              <button
                type="button"
                className="stock-modal-close"
                onClick={() => setShowDetailModal(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="stock-modal-content">
              <div className="stock-detail-section">
                <div className="stock-details-grid">
                  <div className="stock-detail-item">
                    <span className="stock-detail-label">
                      <Tag size={14} />
                      Item Code
                    </span>
                    <span className="stock-detail-value">{selectedItem.item_code || '-'}</span>
                  </div>

                  <div className="stock-detail-item">
                    <span className="stock-detail-label">
                      <Package size={14} />
                      Category
                    </span>
                    <span className="stock-detail-value">{selectedItem.item_category || '-'}</span>
                  </div>

                  <div className="stock-detail-item">
                    <span className="stock-detail-label">
                      <Hash size={14} />
                      UOM
                    </span>
                    <span className="stock-detail-value">{selectedItem.unit_of_measure || '-'}</span>
                  </div>

                  <div className="stock-detail-item">
                    <span className="stock-detail-label">
                      <Package size={14} />
                      Current Stock
                    </span>
                    <span className="stock-detail-value">{selectedItem.current_stock} {selectedItem.unit_of_measure}</span>
                  </div>

                  <div className="stock-detail-item">
                    <span className="stock-detail-label">
                      <AlertCircle size={14} />
                      Minimum Stock
                    </span>
                    <span className="stock-detail-value">{selectedItem.minimum_stock} {selectedItem.unit_of_measure}</span>
                  </div>

                  <div className="stock-detail-item">
                    <span className="stock-detail-label">
                      <AlertTriangle size={14} />
                      Reorder Level
                    </span>
                    <span className="stock-detail-value">{selectedItem.reorder_level} {selectedItem.unit_of_measure}</span>
                  </div>

                  <div className="stock-detail-item">
                    <span className="stock-detail-label">
                      <DollarSign size={14} />
                      Selling Price
                    </span>
                    <span className="stock-detail-value">{formatCurrency(selectedItem.standard_selling_price || 0)}</span>
                  </div>

                  <div className="stock-detail-item">
                    <span className="stock-detail-label">Status</span>
                    <span className={`stock-detail-value status-badge ${selectedItem.stock_status?.toLowerCase().replace(/\s+/g, '-')}`}>
                      {selectedItem.stock_status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="stock-modal-actions">
              <button
                type="button"
                className="stock-action-btn stock-action-secondary"
                onClick={() => setShowDetailModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}