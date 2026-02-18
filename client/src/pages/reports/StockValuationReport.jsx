import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSettings } from '../../context/SettingsContext';
import {
  Package,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Download,
  Filter,
  X,
  Tag,
  Hash
} from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry } from 'ag-grid-community';
import { ClientSideRowModelModule } from 'ag-grid-community';
import api from '../../utils/api';
import Button from '../../components/common/Button';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import './StockValuationReport.css';

// Register AG Grid modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

export default function StockValuationReport() {
  const [warehouseId, setWarehouseId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [valuationMethod, setValuationMethod] = useState('average-cost'); // average-cost, fifo, lifo
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const { formatCurrency } = useSettings();
  const gridRef = useRef(null);

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

  // Fetch stock valuation report
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['stockValuation', warehouseId, categoryId, valuationMethod],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (warehouseId) params.append('warehouseId', warehouseId);
      if (categoryId) params.append('categoryId', categoryId);
      params.append('valuationMethod', valuationMethod);

      const response = await api.get(`/reports/stock-valuation?${params}`);
      return response.data.data;
    }
  });

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
  }, [reportData?.stockValuation]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    refetch();
  };

  const handleExport = (format = 'pdf') => {
    if (!reportData?.stockValuation) {
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
        headerName: 'Unit Cost',
        field: 'unit_cost',
        valueFormatter: (params) => formatCurrency(params.value || 0)
      },
      {
        headerName: 'Total Value',
        field: 'total_value',
        valueFormatter: (params) => formatCurrency(params.value || 0)
      },
      {
        headerName: 'Valuation Method',
        field: 'valuation_method'
      }
    ];

    if (format === 'pdf') {
      exportToPDF(
        reportData.stockValuation,
        exportColumns,
        'Stock Valuation Report',
        `stock-valuation-${new Date().toISOString().split('T')[0]}.pdf`
      );
    } else if (format === 'excel') {
      exportToExcel(
        reportData.stockValuation,
        exportColumns,
        'Stock Valuation Report',
        `stock-valuation-${new Date().toISOString().split('T')[0]}.csv`
      );
    }
  };

  // Column definitions for stock valuation data
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
      headerName: 'Unit Cost',
      field: 'unit_cost',
      filter: 'agNumberColumnFilter',
      width: 140,
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
    },
    {
      headerName: 'Valuation Method',
      field: 'valuation_method',
      filter: true,
      width: 140
    }
  ];

  return (
    <div className="stock-valuation-report">
      <div className="page-header">
        <div>
          <h1>Stock Valuation Report</h1>
          <p className="page-subtitle">Inventory value analysis using various valuation methods</p>
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

            <div className="filter-group">
              <label>Valuation Method</label>
              <select
                value={valuationMethod}
                onChange={(e) => setValuationMethod(e.target.value)}
                className="filter-select"
              >
                <option value="average-cost">Average Cost</option>
                <option value="fifo">FIFO</option>
                <option value="lifo">LIFO</option>
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
                <DollarSign size={24} />
              </div>
              <div className="summary-text">
                <div className="summary-value">{formatCurrency(reportData.summary.totalValue)}</div>
                <div className="summary-label">Total Inventory Value</div>
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
        ) : reportData?.stockValuation && reportData.stockValuation.length > 0 ? (
          <>
            {/* Desktop view - AG Grid */}
            <div className="ag-theme-quartz desktop-view" style={{ height: 600, width: '100%' }}>
              <AgGridReact
                rowData={reportData.stockValuation}
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

            <div className="mobile-stock-valuation-list">
              {reportData.stockValuation.map((item, index) => (
                <div
                  key={`${item.id || item.item_code}-${index}`}
                  className="stock-valuation-card"
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
                  <div className="stock-valuation-card-content">
                    <h3 className="valuation-item-name">{item.item_name}</h3>
                    <span className="valuation-item-value">{formatCurrency(item.total_value || 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="no-data">
            <Package size={48} />
            <h3>No stock valuation data found</h3>
            <p>Try adjusting your filters to see stock valuation data.</p>
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
                      <DollarSign size={14} />
                      Unit Cost
                    </span>
                    <span className="stock-detail-value">{formatCurrency(selectedItem.unit_cost || 0)}</span>
                  </div>

                  <div className="stock-detail-item">
                    <span className="stock-detail-label">
                      <DollarSign size={14} />
                      Total Value
                    </span>
                    <span className="stock-detail-value">{formatCurrency(selectedItem.total_value || 0)}</span>
                  </div>

                  <div className="stock-detail-item">
                    <span className="stock-detail-label">Valuation Method</span>
                    <span className="stock-detail-value">{selectedItem.valuation_method || '-'}</span>
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