import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSettings } from '../../context/SettingsContext';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AgGridReact } from 'ag-grid-react';
import api from '../../utils/api';
import CompactStockByWarehouseCardView from '../../components/common/CompactStockByWarehouseCard';
import ItemPreview from './ItemPreview';
import SearchableSelect from '../../components/common/SearchableSelect';
import './StockByWarehousePage.css';

export default function StockByWarehousePage() {
  const { formatCurrency } = useSettings();
  const { isMobile } = useMobileDetection();
  const navigate = useNavigate();
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | number>('');
  const [quantityFilter, setQuantityFilter] = useState<'all' | 'zero' | 'nonzero'>('nonzero');
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

  // Fetch warehouses for searchable select
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const response = await api.get('/inventory/warehouses');
      return response.data.data;
    }
  });

  const warehouseOptions = warehouses.map((wh: any) => ({
    value: wh.id,
    label: `${wh.warehouse_code} - ${wh.warehouse_name}`
  }));

  const { data: stockBalances = [], isLoading } = useQuery({
    queryKey: ['stock-balances'],
    queryFn: async () => {
      const response = await api.get('/inventory/stock-balances');
      // Filter out items with zero or negative quantity
      return response.data.filter(item => item.quantity > 0);
    }
  });

  // Fetch item details when a card is clicked
  const { data: selectedItem } = useQuery({
    queryKey: ['item', selectedItemId],
    queryFn: async () => {
      if (!selectedItemId) return null;
      const response = await api.get(`/inventory/items/${selectedItemId}`);
      const item = response.data;
      // Map API response to ItemPreview expected format
      return {
        id: item.id,
        item_code: item.item_code,
        item_name: item.item_name,
        description: item.description,
        category: item.category,
        unit_of_measure: item.unit_of_measure,
        current_stock: item.current_stock || item.quantity || 0,
        standard_cost: item.standard_cost || 0,
        standard_selling_price: item.standard_selling_price || 0,
        reorder_level: item.reorder_level,
        is_raw_material: item.is_raw_material,
        is_finished_good: item.is_finished_good,
        is_purchased: item.is_purchased,
        is_manufactured: item.is_manufactured,
      };
    },
    enabled: !!selectedItemId
  });

  const filteredStockBalances = useMemo(() => {
    let result = stockBalances;

    // Filter by warehouse if selected
    if (selectedWarehouseId) {
      result = result.filter(item =>
        item.warehouse_id === selectedWarehouseId
      );
    }

    // Filter by quantity
    if (quantityFilter === 'zero') {
      result = result.filter(item => item.quantity === 0);
    } else if (quantityFilter === 'nonzero') {
      result = result.filter(item => item.quantity > 0);
    }

    return result;
  }, [stockBalances, selectedWarehouseId, quantityFilter]);

  // Calculate statistics
  const stats = {
    totalStockValue: stockBalances.reduce((sum, item) =>
      sum + (parseFloat(item.quantity || 0)), 0
    ),
    totalItems: new Set(stockBalances.map(item => item.item_id)).size,
    totalWarehouses: new Set(stockBalances.map(item => item.warehouse_id)).size,
    warehouseWithMostStock: stockBalances.reduce((max, item) =>
      item.quantity > max.quantity ? item : max
    , { warehouse_name: 'None', quantity: 0 }),
    multiWarehouseItems: new Set(
      stockBalances
        .map(item => item.item_id)
        .filter((id, index, arr) => arr.indexOf(id) !== index)
    ).size,
    averageQuantity: stockBalances.length > 0
      ? stockBalances.reduce((sum, item) => sum + parseFloat(item.quantity || 0), 0) / stockBalances.length
      : 0
  };

  // Export to CSV
  const handleExport = () => {
    if (stockBalances.length === 0) {
      toast.error('No stock data to export');
      return;
    }

    const headers = [
      'Item Code', 'Item Name', 'Warehouse Code', 'Warehouse Name',
      'Quantity', 'Unit of Measure'
    ];

    const rows = stockBalances.map(item => [
      item.item_code,
      item.item_name,
      item.warehouse_code,
      item.warehouse_name,
      item.quantity,
      item.unit_of_measure
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `stock-by-warehouse-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Stock data exported successfully!');
  };

  const columnDefs = [
    {
      headerName: 'Item Code',
      field: 'item_code',
      sortable: true,
      filter: true,
      flex: 1
    },
    {
      headerName: 'Item Name',
      field: 'item_name',
      sortable: true,
      filter: true,
      flex: 2
    },
    {
      headerName: 'Warehouse Code',
      field: 'warehouse_code',
      sortable: true,
      filter: true,
      flex: 1
    },
    {
      headerName: 'Warehouse Name',
      field: 'warehouse_name',
      sortable: true,
      filter: true,
      flex: 1.5
    },
    {
      headerName: 'Quantity',
      field: 'quantity',
      sortable: true,
      filter: 'agNumberColumnFilter',
      flex: 1,
      valueFormatter: params => `${parseFloat(params.value).toFixed(2)} ${params.data.unit_of_measure}`,
      cellStyle: params => ({
        fontWeight: 'bold',
        color: params.value > 0 ? 'var(--success)' : 'var(--neutral-400)'
      })
    }
  ];

  return (
    <div className="items-page">
      <div className="page-header">
        <div>
          <h1>Stock by Warehouse</h1>
          <p className="page-subtitle">View current stock levels for each item by warehouse</p>
        </div>
      </div>

      {/* Summary Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            📦
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Items</div>
            <div className="stat-value">{stats.totalItems}</div>
            <div className="stat-subtitle">Items with stock</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            📊
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Stock</div>
            <div className="stat-value">{parseFloat(stats.totalStockValue).toFixed(2)}</div>
            <div className="stat-subtitle">Aggregate quantity</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            🏭
          </div>
          <div className="stat-content">
            <div className="stat-label">Warehouses</div>
            <div className="stat-value">{stats.totalWarehouses}</div>
            <div className="stat-subtitle">Active locations</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f5af19 0%, #12cfa9 100%)' }}>
            🔝
          </div>
          <div className="stat-content">
            <div className="stat-label">Largest Stock</div>
            <div className="stat-value" style={{ fontSize: '1.4rem' }}>
              {stats.warehouseWithMostStock.warehouse_name}
            </div>
            <div className="stat-subtitle">
              {parseFloat(stats.warehouseWithMostStock.quantity).toFixed(2)} units
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
            📁
          </div>
          <div className="stat-content">
            <div className="stat-label">Multi-Warehouse Items</div>
            <div className="stat-value">{stats.multiWarehouseItems}</div>
            <div className="stat-subtitle">In multiple locations</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #5436ff 0%, #667eea 100%)' }}>
            📈
          </div>
          <div className="stat-content">
            <div className="stat-label">Average Qty</div>
            <div className="stat-value">{parseFloat(stats.averageQuantity).toFixed(2)}</div>
            <div className="stat-subtitle">Per stock line</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button className="quick-action-btn" onClick={handleExport}>
          <span className="action-icon">📥</span>
          <span className="action-text">Export to CSV</span>
        </button>
        <button
          className="quick-action-btn"
          onClick={() => navigate('/inventory/stock-movements')}
        >
          <span className="action-icon">📋</span>
          <span className="action-text">Stock Movements</span>
        </button>
        <button
          className="quick-action-btn"
          onClick={() => navigate('/reports/stock-valuation')}
        >
          <span className="action-icon">💰</span>
          <span className="action-text">Stock Valuation</span>
        </button>
        <button
          className="quick-action-btn"
          onClick={() => navigate('/reports/inventory-movement')}
        >
          <span className="action-icon">🔄</span>
          <span className="action-text">Inventory Movement</span>
        </button>
      </div>

{isLoading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : isMobile ? (
        <>
          <div className="mobile-search-section">
            <SearchableSelect
              name="warehouse"
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              options={warehouseOptions}
              placeholder="All Warehouses"
            />
            
            <div className="quantity-filter-section">
              <label className="quantity-filter-label">Quantity:</label>
              <div className="quantity-filter-options">
                <label className="quantity-filter-option">
                  <input
                    type="radio"
                    name="quantityFilter"
                    value="all"
                    checked={quantityFilter === 'all'}
                    onChange={(e) => setQuantityFilter(e.target.value as 'all' | 'zero' | 'nonzero')}
                  />
                  <span>All</span>
                </label>
                <label className="quantity-filter-option">
                  <input
                    type="radio"
                    name="quantityFilter"
                    value="nonzero"
                    checked={quantityFilter === 'nonzero'}
                    onChange={(e) => setQuantityFilter(e.target.value as 'all' | 'zero' | 'nonzero')}
                  />
                  <span>Stock</span>
                </label>
                <label className="quantity-filter-option">
                  <input
                    type="radio"
                    name="quantityFilter"
                    value="zero"
                    checked={quantityFilter === 'zero'}
                    onChange={(e) => setQuantityFilter(e.target.value as 'all' | 'zero' | 'nonzero')}
                  />
                  <span>Zero</span>
                </label>
              </div>
            </div>
          </div>

          <CompactStockByWarehouseCardView
            stockData={filteredStockBalances}
            onRowClick={(item) => {
              setSelectedItemId(item.item_id);
            }}
          />

          {filteredStockBalances.length > 0 && (
            <div className="mobile-pagination-info">
              Showing {filteredStockBalances.length} of {stockBalances.length} stock items
            </div>
          )}
        </>
      ) : (
        <div className="ag-theme-quartz" style={{ height: 600, width: '100%' }}>
          <AgGridReact
            rowData={stockBalances}
            columnDefs={columnDefs}
            defaultColDef={{
              resizable: true,
              sortable: false,
              filter: false
            }}
            pagination={true}
              paginationPageSize={20}
              paginationPageSizeSelector={[10, 20, 50, 100]}
          />
        </div>
      )}

      {/* Item Details Overlay - Mobile Only */}
      {isMobile && selectedItem && (
        <ItemPreview
          item={selectedItem}
          onClose={() => setSelectedItemId(null)}
        />
      )}
    </div>
  );
}
