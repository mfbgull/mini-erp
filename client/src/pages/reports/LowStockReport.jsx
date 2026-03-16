import { useState, useRef, useEffect } from 'react';

import { useQuery } from '@tanstack/react-query';
import { ModuleRegistry , ClientSideRowModelModule } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import {
  AlertTriangle,
  Package,
  Download,
  Filter,
  X,
  Tag,
  Hash
} from 'lucide-react';

import Button from '../../components/common/Button';
import { useSettings } from '../../context/SettingsContext';
import api from '../../utils/api';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import './InventoryReports.css';

// Register AG Grid modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

export default function LowStockReport() {
  const [warehouseId, setWarehouseId] = useState('');
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

  // Safely size columns when grid is visible
  useEffect(() => {
    const gridElement = gridRef.current?.querySelector('.ag-theme-quartz');
    if (!gridElement) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          const gridApi = gridRef.current?.api;
          if (gridApi) {
            // Check if the grid is actually visible in the DOM
            const viewportElement = gridApi.gridCore.ctrl.main.querySelectorAll('.ag-body-viewport')[0];
            if (viewportElement && viewportElement.clientWidth > 0) {
              gridApi.sizeColumnsToFit({
                defaultMinWidth: 100,
                columnLimits: []
              });
            }
          }
          observer.disconnect();
          break;
        }
      }
    });

    observer.observe(gridElement);
    return () => observer.disconnect();
  }, [reportData]);

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

      <div className="report-content" ref={gridRef}>
        {isLoading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : reportData && reportData.length > 0 ? (
          <>
            {/* Desktop view - AG Grid */}
            <div className="ag-theme-quartz desktop-view ag-grid-container">
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
              />
            </div>

            <div className="mobile-low-stock-list">
              {reportData.map((item, index) => (
                <div
                  key={item.id || item.item_code || `item-${index}`}
                  className="low-stock-card"
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
                  <div className="low-stock-card-content">
                    <h3 className="low-stock-item-name">{item.item_name}</h3>
                    <span className="low-stock-item-qty">{item.current_stock} {item.unit_of_measure}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="no-data">
            <AlertTriangle size={48} />
            <h3>No low stock items found</h3>
            <p>All items are above their minimum stock levels.</p>
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
                      <AlertTriangle size={14} />
                      Minimum Stock
                    </span>
                    <span className="stock-detail-value">{selectedItem.minimum_stock} {selectedItem.unit_of_measure}</span>
                  </div>

                  <div className="stock-detail-item">
                    <span className="stock-detail-label">
                      <AlertTriangle size={14} />
                      Shortage
                    </span>
                    <span className="stock-detail-value shortage">{selectedItem.shortage} {selectedItem.unit_of_measure}</span>
                  </div>

                  <div className="stock-detail-item">
                    <span className="stock-detail-label">
                      <AlertTriangle size={14} />
                      Reorder Level
                    </span>
                    <span className="stock-detail-value">{selectedItem.reorder_level} {selectedItem.unit_of_measure}</span>
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