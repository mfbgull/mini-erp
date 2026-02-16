import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSettings } from '../../context/SettingsContext';
import {
  Users,
  ShoppingCart,
  TrendingUp,
  FileText,
  DollarSign,
  Calendar,
  Download,
  Filter,
  BarChart3,
  X,
  Tag,
  Hash,
  Receipt,
  TrendingUpIcon
} from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry } from 'ag-grid-community';
import { ClientSideRowModelModule } from 'ag-grid-community';
import api from '../../utils/api';
import Button from '../../components/common/Button';
import DateRangePicker from '../../components/common/DateRangePicker';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import './SupplierAnalysisReport.css';

// Register AG Grid modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

export default function SupplierAnalysisReport() {
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0]
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
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

  const handleCardClick = (supplier) => {
    setSelectedSupplier(supplier);
    setShowDetailModal(true);
  };

  // Fetch supplier analysis report
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['supplierAnalysis', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('fromDate', dateRange.fromDate);
      params.append('toDate', dateRange.toDate);

      const response = await api.get(`/reports/supplier-analysis?${params}`);
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
        headerName: 'Supplier Name',
        field: 'supplier_name'
      },
      {
        headerName: 'Supplier Code',
        field: 'supplier_code'
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
        headerName: 'Total Orders',
        field: 'total_orders'
      },
      {
        headerName: 'Total Purchase Value',
        field: 'total_purchase_value',
        valueFormatter: (params) => formatCurrency(params.value || 0)
      },
      {
        headerName: 'Avg. Order Value',
        field: 'average_order_value',
        valueFormatter: (params) => formatCurrency(params.value || 0)
      },
      {
        headerName: 'On-time Delivery Rate',
        field: 'on_time_delivery_rate',
        valueFormatter: (params) => `${params.value || 0}%`
      },
      {
        headerName: 'Last Purchase Date',
        field: 'last_purchase_date',
        valueFormatter: (params) => {
          return params.value ? new Date(params.value).toLocaleDateString() : '';
        }
      }
    ];

    if (format === 'pdf') {
      exportToPDF(
        reportData,
        exportColumns,
        'Supplier Analysis Report',
        `supplier-analysis-${new Date().toISOString().split('T')[0]}.pdf`
      );
    } else if (format === 'excel') {
      exportToExcel(
        reportData,
        exportColumns,
        'Supplier Analysis Report',
        `supplier-analysis-${new Date().toISOString().split('T')[0]}.csv`
      );
    }
  };

  // Column definitions for supplier analysis data
  const columnDefs = [
    {
      headerName: 'Supplier Name',
      field: 'supplier_name',
      filter: true,
      flex: 1
    },
    {
      headerName: 'Supplier Code',
      field: 'supplier_code',
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
      headerName: 'Total Orders',
      field: 'total_orders',
      filter: 'agNumberColumnFilter',
      width: 120,
      cellClass: 'number-cell'
    },
    {
      headerName: 'Total Purchase Value',
      field: 'total_purchase_value',
      filter: 'agNumberColumnFilter',
      width: 150,
      valueFormatter: (params) => formatCurrency(params.value || 0),
      cellClass: 'amount-cell'
    },
    {
      headerName: 'Avg. Order Value',
      field: 'average_order_value',
      filter: 'agNumberColumnFilter',
      width: 150,
      valueFormatter: (params) => formatCurrency(params.value || 0),
      cellClass: 'amount-cell'
    },
    {
      headerName: 'On-time Delivery Rate',
      field: 'on_time_delivery_rate',
      filter: 'agNumberColumnFilter',
      width: 160,
      valueFormatter: (params) => `${params.value || 0}%`,
      cellClass: (params) => {
        const rate = params.value || 0;
        if (rate >= 95) return 'rate-excellent';
        if (rate >= 90) return 'rate-good';
        if (rate >= 80) return 'rate-fair';
        return 'rate-poor';
      }
    },
    {
      headerName: 'Last Purchase Date',
      field: 'last_purchase_date',
      filter: 'agDateColumnFilter',
      width: 140,
      valueFormatter: (params) => {
        return params.value ? new Date(params.value).toLocaleDateString() : '';
      }
    }
  ];

  return (
    <div className="supplier-analysis-report">
      <div className="page-header">
        <div>
          <h1>Supplier Analysis Report</h1>
          <p className="page-subtitle">Analyze supplier performance and purchasing patterns</p>
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

      <div className="report-content">
        {isLoading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : reportData && reportData.length > 0 ? (
          <>
            <div className="ag-theme-quartz desktop-view" style={{ height: 600, width: '100%' }}>
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
                  setTimeout(() => {
                    if (params.api && params.columnApi) {
                      const gridElement = params.api.gridCore.ctrl.main.querySelectorAll('.ag-body-viewport')[0];
                      if (gridElement && gridElement.clientWidth > 0) {
                        params.columnApi.autoSizeAllColumns();
                      }
                    }
                  }, 100);
                }}
              />
            </div>

            <div className="mobile-supplier-analysis-list">
              {reportData.map((supplier, index) => (
                <div
                  key={`${supplier.supplier_id || supplier.supplier_name}-${index}`}
                  className="supplier-analysis-card"
                  onClick={() => handleCardClick(supplier)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCardClick(supplier);
                    }
                  }}
                >
                  <div className="supplier-analysis-card-content">
                    <h3 className="supplier-analysis-name">{supplier.supplier_name}</h3>
                    <span className="supplier-analysis-amount">{formatCurrency(supplier.total_purchases || 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="no-data">
            <Users size={48} />
            <h3>No supplier analysis data found</h3>
            <p>Try adjusting your filters to see supplier analysis data.</p>
          </div>
        )}
      </div>

      {showDetailModal && selectedSupplier && (
        <div
          className="supplier-modal-overlay"
          onClick={() => setShowDetailModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="supplier-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="supplier-modal-header">
              <h2 className="supplier-modal-title">{selectedSupplier.supplier_name}</h2>
              <button
                type="button"
                className="supplier-modal-close"
                onClick={() => setShowDetailModal(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="supplier-modal-content">
              <div className="supplier-detail-section">
                <div className="supplier-details-grid">
                  <div className="supplier-detail-item">
                    <span className="supplier-detail-label">
                      <Receipt size={14} />
                      Total Orders
                    </span>
                    <span className="supplier-detail-value">{selectedSupplier.total_orders || 0}</span>
                  </div>

                  <div className="supplier-detail-item">
                    <span className="supplier-detail-label">
                      <DollarSign size={14} />
                      Total Purchases
                    </span>
                    <span className="supplier-detail-value">{formatCurrency(selectedSupplier.total_purchases || 0)}</span>
                  </div>

                  <div className="supplier-detail-item">
                    <span className="supplier-detail-label">
                      <TrendingUpIcon size={14} />
                      Average Order Value
                    </span>
                    <span className="supplier-detail-value">{formatCurrency(selectedSupplier.avg_order_value || 0)}</span>
                  </div>

                  <div className="supplier-detail-item">
                    <span className="supplier-detail-label">
                      <Hash size={14} />
                      Total Items
                    </span>
                    <span className="supplier-detail-value">{selectedSupplier.total_items || 0}</span>
                  </div>

                  <div className="supplier-detail-item">
                    <span className="supplier-detail-label">
                      <Calendar size={14} />
                      Last Purchase
                    </span>
                    <span className="supplier-detail-value">{selectedSupplier.last_purchase_date ? new Date(selectedSupplier.last_purchase_date).toLocaleDateString() : '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="supplier-modal-actions">
              <button
                type="button"
                className="supplier-action-btn supplier-action-secondary"
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