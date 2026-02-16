import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSettings } from '../../context/SettingsContext';
import {
  TrendingUp,
  FileText,
  Users,
  Package,
  Calendar,
  Download,
  Filter,
  BarChart3,
  DollarSign,
  X
} from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import api from '../../utils/api';
import Button from '../../components/common/Button';
import SearchableSelect from '../../components/common/SearchableSelect';
import DateRangePicker from '../../components/common/DateRangePicker';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import './SalesReports.css';

// Register AG Grid modules - AllCommunityModule required for Quartz theme
ModuleRegistry.registerModules([AllCommunityModule]);

export default function SalesSummaryReport() {
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0]
  });
  const [customerIds, setCustomerIds] = useState([]);
  const [itemIds, setItemIds] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
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

  const handleCardClick = (sale) => {
    setSelectedSale(sale);
    setShowDetailModal(true);
  };

  // Fetch customers for filter
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await api.get('/customers');
      return response.data.data || [];
    }
  });

  // Fetch all items first, then filter for Finished Good on client side
  const { data: allItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['items-all'],
    queryFn: async () => {
      const response = await api.get('/inventory/items');
      console.log('Items API response:', response.data);
      return response.data.data || [];
    }
  });

  // Filter items for Finished Good on client side
  const items = allItems.filter(item => item.is_finished_good === 1 || item.is_finished_good === true);
  console.log('Filtered Finished Good items:', items);

  // Fetch sales summary report
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['salesSummary', dateRange, customerIds, itemIds],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('fromDate', dateRange.fromDate);
      params.append('toDate', dateRange.toDate);
      if (customerIds.length > 0) {
        customerIds.forEach(id => params.append('customerIds', String(id)));
      }
      if (itemIds.length > 0) {
        itemIds.forEach(id => params.append('itemIds', String(id)));
      }

      const response = await api.get(`/reports/sales-summary?${params}`);
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
  }, [reportData?.sales]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    refetch();
  };

  const handleExport = (format = 'pdf') => {
    if (!reportData?.sales) {
      console.error('No data to export');
      return;
    }

    // Column definitions for export (matching the grid columns)
    const exportColumns = [
      {
        headerName: 'Invoice Date',
        field: 'invoice_date',
        valueFormatter: (params) => {
          return params.value ? new Date(params.value).toLocaleDateString() : '';
        }
      },
      {
        headerName: 'Invoice No',
        field: 'invoice_no'
      },
      {
        headerName: 'Customer',
        field: 'customer_name'
      },
      {
        headerName: 'Total Sales',
        field: 'total_sales',
        valueFormatter: (params) => formatCurrency(params.value || 0)
      },
      {
        headerName: 'Items',
        field: 'total_items'
      },
      {
        headerName: 'Paid Amount',
        field: 'paid_amount',
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
        reportData.sales,
        exportColumns,
        'Sales Summary Report',
        `sales-summary-${new Date().toISOString().split('T')[0]}.pdf`
      );
    } else if (format === 'excel') {
      exportToExcel(
        reportData.sales,
        exportColumns,
        'Sales Summary Report',
        `sales-summary-${new Date().toISOString().split('T')[0]}.csv`
      );
    }
  };

  // Column definitions for sales data
  const columnDefs = [
    {
      headerName: 'Invoice Date',
      field: 'invoice_date',
      filter: 'agDateColumnFilter',
      width: 120,
      valueFormatter: (params) => {
        return params.value ? new Date(params.value).toLocaleDateString() : '';
      }
    },
    {
      headerName: 'Invoice No',
      field: 'invoice_no',
      filter: true,
      width: 120
    },
    {
      headerName: 'Customer',
      field: 'customer_name',
      filter: true,
      flex: 1
    },
    {
      headerName: 'Total Sales',
      field: 'total_sales',
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
      headerName: 'Paid Amount',
      field: 'paid_amount',
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
        if (status === 'paid') return 'status-paid';
        if (status === 'partially paid') return 'status-partially-paid';
        if (status === 'overdue') return 'status-overdue';
        return 'status-unpaid';
      }
    }
  ];

  return (
    <div className="sales-summary-report">
      <div className="page-header">
        <div>
          <h1>Sales Summary Report</h1>
          <p className="page-subtitle">Comprehensive analysis of sales performance</p>
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

            <SearchableSelect
              label="Customer"
              name="customer"
              value={customerIds}
              onChange={(e) => setCustomerIds(e.target.value)}
              options={customers.map(c => ({ value: c.id, label: c.customer_name }))}
              placeholder="Search customers..."
              multiple={true}
              loading={customers.length === 0}
            />

            <SearchableSelect
              label="Item"
              name="item"
              value={itemIds}
              onChange={(e) => setItemIds(e.target.value)}
              options={items.map(i => ({ value: i.id, label: i.item_name }))}
              placeholder="Search items..."
              multiple={true}
              loading={itemsLoading}
            />

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
                <FileText size={24} />
              </div>
              <div className="summary-text">
                <div className="summary-value">{reportData.summary.totalInvoices}</div>
                <div className="summary-label">Total Invoices</div>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon">
                <DollarSign size={24} />
              </div>
              <div className="summary-text">
                <div className="summary-value">{formatCurrency(reportData.summary.totalSales)}</div>
                <div className="summary-label">Total Sales</div>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon">
                <Package size={24} />
              </div>
              <div className="summary-text">
                <div className="summary-value">{reportData.summary.totalItemsSold}</div>
                <div className="summary-label">Items Sold</div>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-content">
              <div className="summary-icon">
                <TrendingUp size={24} />
              </div>
              <div className="summary-text">
                <div className="summary-value">{formatCurrency(reportData.summary.averageInvoiceValue)}</div>
                <div className="summary-label">Avg. Invoice Value</div>
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
        ) : reportData?.sales && reportData.sales.length > 0 ? (
          <>
            <div className="ag-theme-quartz desktop-view" style={{ height: 600, width: '100%' }}>
              <AgGridReact
                rowData={reportData.sales || []}
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

            <div className="mobile-sales-list">
              {reportData.sales.map((sale, index) => (
                <div
                  key={sale.invoice_id || sale.invoice_number || `sale-${index}`}
                  className="sales-summary-card"
                  onClick={() => handleCardClick(sale)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCardClick(sale);
                    }
                  }}
                >
                  <div className="sales-summary-card-content">
                    <h3 className="sales-summary-card-title">{sale.invoice_number}</h3>
                    <span className="sales-summary-card-amount">{formatCurrency(sale.total || 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="no-data">
            <BarChart3 size={48} />
            <h3>No sales data found</h3>
            <p>Try adjusting your filters to see sales data.</p>
          </div>
        )}
      </div>

      {showDetailModal && selectedSale && (
        <div
          className="sales-modal-overlay"
          onClick={() => setShowDetailModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="sales-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sales-modal-header">
              <h2 className="sales-modal-title">{selectedSale.invoice_number}</h2>
              <button
                type="button"
                className="sales-modal-close"
                onClick={() => setShowDetailModal(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="sales-modal-content">
              <div className="sales-detail-section">
                <div className="sales-details-grid">
                  <div className="sales-detail-item">
                    <span className="sales-detail-label">Customer</span>
                    <span className="sales-detail-value">{selectedSale.customer_name || '-'}</span>
                  </div>

                  <div className="sales-detail-item">
                    <span className="sales-detail-label">Date</span>
                    <span className="sales-detail-value">{selectedSale.invoice_date ? new Date(selectedSale.invoice_date).toLocaleDateString() : '-'}</span>
                  </div>

                  <div className="sales-detail-item">
                    <span className="sales-detail-label">Status</span>
                    <span className="sales-detail-value">{selectedSale.payment_status || '-'}</span>
                  </div>

                  <div className="sales-detail-item">
                    <span className="sales-detail-label">Total</span>
                    <span className="sales-detail-value">{formatCurrency(selectedSale.total || 0)}</span>
                  </div>

                  <div className="sales-detail-item">
                    <span className="sales-detail-label">Paid</span>
                    <span className="sales-detail-value">{formatCurrency(selectedSale.paid_amount || 0)}</span>
                  </div>

                  <div className="sales-detail-item">
                    <span className="sales-detail-label">Balance</span>
                    <span className="sales-detail-value">{formatCurrency(selectedSale.balance || 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="sales-modal-actions">
              <button
                type="button"
                className="sales-action-btn sales-action-secondary"
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