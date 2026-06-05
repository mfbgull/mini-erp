import { useState, useRef, useEffect } from 'react';

import { useQuery } from '@tanstack/react-query';
import { ModuleRegistry , ClientSideRowModelModule } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import {
  ShoppingCart,
  TrendingUp,
  FileText,
  DollarSign,
  Calendar,
  Download,
  Filter,
  BarChart3,
  Package,
  X
} from 'lucide-react';

import Button from '../../components/common/Button';
import DateRangePicker from '../../components/common/DateRangePicker';
import StatCard, { StatsGrid } from '../../components/common/StatCard';
import { useSettings } from '../../context/SettingsContext';
import api from '../../utils/api';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import './PurchaseSummaryReport.css';

// Register AG Grid modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

export default function PurchaseSummaryReport() {
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0]
  });
  const [supplierId, setSupplierId] = useState('');
  const [itemId, setItemId] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
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

  const handleCardClick = (purchase) => {
    setSelectedPurchase(purchase);
    setShowDetailModal(true);
  };

  // Fetch suppliers for filter
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const response = await api.get('/suppliers');
      return response.data.data || [];
    }
  });

  // Fetch items for filter
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const response = await api.get('/inventory/items');
      return response.data.data || [];
    }
  });

  // Fetch purchase summary report
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['purchaseSummary', dateRange, supplierId, itemId],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('fromDate', dateRange.fromDate);
      params.append('toDate', dateRange.toDate);
      if (supplierId) params.append('supplierId', supplierId);
      if (itemId) params.append('itemId', itemId);

      const response = await api.get(`/reports/purchase-summary?${params}`);
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
  }, [reportData?.purchases]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    refetch();
  };

  const handleExport = (format = 'pdf') => {
    if (!reportData?.purchases) {
      console.error('No data to export');
      return;
    }

    // Column definitions for export (matching the grid columns)
    const exportColumns = [
      {
        headerName: 'PO Date',
        field: 'purchase_date',
        valueFormatter: (params) => {
          return params.value ? new Date(params.value).toLocaleDateString() : '';
        }
      },
      {
        headerName: 'PO Number',
        field: 'purchase_order_number'
      },
      {
        headerName: 'Supplier',
        field: 'supplier_name'
      },
      {
        headerName: 'Total Cost',
        field: 'total_cost',
        valueFormatter: (params) => formatCurrency(params.value || 0)
      },
      {
        headerName: 'Items',
        field: 'total_items'
      },
      {
        headerName: 'Received Amount',
        field: 'received_amount',
        valueFormatter: (params) => formatCurrency(params.value || 0)
      },
      {
        headerName: 'Balance',
        field: 'balance_amount',
        valueFormatter: (params) => formatCurrency(params.value || 0)
      },
      {
        headerName: 'Status',
        field: 'status'
      }
    ];

    if (format === 'pdf') {
      exportToPDF(
        reportData.purchases,
        exportColumns,
        'Purchase Summary Report',
        `purchase-summary-${new Date().toISOString().split('T')[0]}.pdf`
      );
    } else if (format === 'excel') {
      exportToExcel(
        reportData.purchases,
        exportColumns,
        'Purchase Summary Report',
        `purchase-summary-${new Date().toISOString().split('T')[0]}.csv`
      );
    }
  };

  // Column definitions for purchase data
  const columnDefs = [
    {
      headerName: 'PO Date',
      field: 'purchase_date',
      filter: 'agDateColumnFilter',
      width: 120,
      valueFormatter: (params) => {
        return params.value ? new Date(params.value).toLocaleDateString() : '';
      }
    },
    {
      headerName: 'PO Number',
      field: 'purchase_order_number',
      filter: true,
      width: 140
    },
    {
      headerName: 'Supplier',
      field: 'supplier_name',
      filter: true,
      flex: 1
    },
    {
      headerName: 'Total Cost',
      field: 'total_cost',
      filter: 'agNumberColumnFilter',
      width: 140,
      valueFormatter: (params) => formatCurrency(params.value || 0),
      cellClass: 'amount-cell'
    },
    {
      headerName: 'Items',
      field: 'total_items',
      filter: 'agNumberColumnFilter',
      width: 100,
      cellClass: 'number-cell'
    },
    {
      headerName: 'Received Amount',
      field: 'received_amount',
      filter: 'agNumberColumnFilter',
      width: 140,
      valueFormatter: (params) => formatCurrency(params.value || 0),
      cellClass: 'amount-cell'
    },
    {
      headerName: 'Balance',
      field: 'balance_amount',
      filter: 'agNumberColumnFilter',
      width: 140,
      valueFormatter: (params) => formatCurrency(params.value || 0),
      cellClass: 'amount-cell'
    },
    {
      headerName: 'Status',
      field: 'status',
      filter: true,
      width: 120,
      cellClass: (params) => {
        const status = params.value?.toLowerCase();
        if (status === 'completed') return 'status-paid';
        if (status === 'partially received') return 'status-partially-paid';
        if (status === 'pending') return 'status-unpaid';
        return '';
      }
    }
  ];

  return (
    <div className="purchase-summary-report">
      <div className="page-header">
        <div>
          <h1>Purchase Summary Report</h1>
          <p className="page-subtitle">Comprehensive analysis of purchase performance</p>
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
              <label>Supplier</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="filter-select"
              >
                <option value="">All Suppliers</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.supplier_name}
                  </option>
                ))}
              </select>
            </div>

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

            <Button type="submit" variant="primary" className="apply-filters-btn">
              Apply Filters
            </Button>
          </div>
        </form>
      )}

      {reportData?.summary && (
        <StatsGrid>
          <StatCard
            icon={FileText}
            label="Total Orders"
            value={reportData.summary.totalOrders}
          />
          <StatCard
            icon={DollarSign}
            label="Total Purchase Cost"
            value={formatCurrency(reportData.summary.totalCost)}
          />
          <StatCard
            icon={Package}
            label="Items Purchased"
            value={reportData.summary.totalItems}
          />
          <StatCard
            icon={TrendingUp}
            label="Avg. Order Value"
            value={formatCurrency(reportData.summary.averageOrderValue)}
          />
        </StatsGrid>
      )}

      <div className="report-content" ref={gridRef}>
        {isLoading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : reportData?.purchases && reportData.purchases.length > 0 ? (
          <>
            <div className="ag-theme-quartz desktop-view ag-grid-container">
              <AgGridReact theme="legacy"
                rowData={reportData.purchases || []}
                columnDefs={columnDefs}
                defaultColDef={{
              theme:"legacy",
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

            <div className="mobile-sales-list">
              {reportData.purchases.map((purchase, index) => (
                <div
                  key={purchase.po_id || purchase.po_number || `purchase-${index}`}
                  className="purchase-card"
                  onClick={() => handleCardClick(purchase)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCardClick(purchase);
                    }
                  }}
                >
                  <div className="purchase-card-content">
                    <h3 className="purchase-card-title">{purchase.po_number}</h3>
                    <span className="purchase-card-amount">{formatCurrency(purchase.total || 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="no-data">
            <ShoppingCart size={48} />
            <h3>No purchase data found</h3>
            <p>Try adjusting your filters to see purchase data.</p>
          </div>
        )}
      </div>

      {showDetailModal && selectedPurchase && (
        <div
          className="purchase-modal-overlay"
          onClick={() => setShowDetailModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="purchase-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="purchase-modal-header">
              <h2 className="purchase-modal-title">{selectedPurchase.po_number}</h2>
              <button
                type="button"
                className="purchase-modal-close"
                onClick={() => setShowDetailModal(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="purchase-modal-content">
              <div className="purchase-detail-section">
                <div className="purchase-details-grid">
                  <div className="purchase-detail-item">
                    <span className="purchase-detail-label">Supplier</span>
                    <span className="purchase-detail-value">{selectedPurchase.supplier_name || '-'}</span>
                  </div>

                  <div className="purchase-detail-item">
                    <span className="purchase-detail-label">Date</span>
                    <span className="purchase-detail-value">{selectedPurchase.po_date ? new Date(selectedPurchase.po_date).toLocaleDateString() : '-'}</span>
                  </div>

                  <div className="purchase-detail-item">
                    <span className="purchase-detail-label">Status</span>
                    <span className="purchase-detail-value">{selectedPurchase.status || '-'}</span>
                  </div>

                  <div className="purchase-detail-item">
                    <span className="purchase-detail-label">Total</span>
                    <span className="purchase-detail-value">{formatCurrency(selectedPurchase.total || 0)}</span>
                  </div>

                  <div className="purchase-detail-item">
                    <span className="purchase-detail-label">Items</span>
                    <span className="purchase-detail-value">{selectedPurchase.items_count || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="purchase-modal-actions">
              <button
                type="button"
                className="purchase-action-btn purchase-action-secondary"
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