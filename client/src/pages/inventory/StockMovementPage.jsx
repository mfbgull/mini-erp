import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useSettings } from '../../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AgGridReact } from 'ag-grid-react';
import api from '../../utils/api';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import FormInput from '../../components/common/FormInput';
import './StockMovementPage.css';

export default function StockMovementPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { formatCurrency } = useSettings();
  const navigate = useNavigate();

  const { data: movements = [], isLoading } = useQuery({
    queryKey: ['stock-movements'],
    queryFn: async () => {
      const response = await api.get('/inventory/stock-movements', {
        params: { limit: 100 }
      });
      return response.data;
    }
  });

  // Calculate statistics
  const stats = {
    totalMovements: movements.length,
    totalIn: movements.filter(m => m.quantity > 0).length,
    totalOut: movements.filter(m => m.quantity < 0).length,
    totalQuantity: movements.reduce((sum, m) => sum + Math.abs(parseFloat(m.quantity || 0)), 0),
    mostActiveType: movements.length > 0
      ? movements.reduce((counts, m) => {
          counts[m.movement_type] = (counts[m.movement_type] || 0) + 1;
          return counts;
        }, {})
      : {},
    movementsByType: {
      PURCHASE: movements.filter(m => m.movement_type === 'PURCHASE').length,
      SALE: movements.filter(m => m.movement_type === 'SALE').length,
      PRODUCTION: movements.filter(m => m.movement_type === 'PRODUCTION').length,
      TRANSFER: movements.filter(m => m.movement_type === 'TRANSFER').length,
      ADJUSTMENT: movements.filter(m => m.movement_type === 'ADJUSTMENT').length
    }
  };

  // Get most active movement type
  const mostActiveType = useMemo(() => {
    if (movements.length === 0) return 'None';
    const typeCount = movements.reduce((counts, m) => {
      counts[m.movement_type] = (counts[m.movement_type] || 0) + 1;
      return counts;
    }, {});
    return Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
  }, [movements]);

  // Export to CSV
  const handleExport = () => {
    if (movements.length === 0) {
      toast.error('No movements to export');
      return;
    }

    const headers = [
      'Movement No', 'Date', 'Item Code', 'Item Name',
      'Warehouse', 'Type', 'Quantity', 'Unit', 'Remarks'
    ];

    const rows = movements.map(m => [
      m.movement_no,
      format(new Date(m.movement_date), 'yyyy-MM-dd'),
      m.item_code,
      m.item_name,
      m.warehouse_name,
      m.movement_type,
      Math.abs(m.quantity),
      m.unit_of_measure,
      m.remarks || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `stock-movements-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Movements exported successfully!');
  };

  const columnDefs = [
    {
      headerName: 'Movement No',
      field: 'movement_no',
      sortable: true,
      filter: true,
      flex: 1
    },
    {
      headerName: 'Date',
      field: 'movement_date',
      sortable: true,
      filter: 'agDateColumnFilter',
      flex: 1,
      valueFormatter: params => format(new Date(params.value), 'dd MMM yyyy')
    },
    {
      headerName: 'Item Code',
      field: 'item_code',
      filter: true,
      flex: 1
    },
    {
      headerName: 'Item Name',
      field: 'item_name',
      filter: true,
      flex: 2
    },
    {
      headerName: 'Quantity',
      field: 'quantity',
      sortable: true,
      filter: 'agNumberColumnFilter',
      flex: 1.5,
      cellRenderer: (params) => (
        <span className={params.value >= 0 ? 'qty-in' : 'qty-out'}>
          {params.value >= 0 ? '+' : ''}{parseFloat(params.value).toFixed(2)} {params.data.unit_of_measure}
        </span>
      )
    },
    {
      headerName: 'Warehouse',
      field: 'warehouse_name',
      filter: true,
      flex: 1.5
    },
    {
      headerName: 'Type',
      field: 'movement_type',
      sortable: true,
      filter: true,
      flex: 1,
      cellRenderer: (params) => (
        <span className="status-tag">{params.value}</span>
      )
    }
  ];

  return (
    <div className="items-page">
      <div className="page-header">
        <div>
          <h1>Stock Movements</h1>
          <p className="page-subtitle">Track all stock transactions</p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          + New Adjustment
        </Button>
      </div>

      {/* Summary Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            📋
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Movements</div>
            <div className="stat-value">{stats.totalMovements}</div>
            <div className="stat-subtitle">All transactions</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            📥
          </div>
          <div className="stat-content">
            <div className="stat-label">Total In</div>
            <div className="stat-value">{stats.totalIn}</div>
            <div className="stat-subtitle">Stock additions</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #dc3545 0%, #fd7e14 100%)' }}>
            📤
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Out</div>
            <div className="stat-value">{stats.totalOut}</div>
            <div className="stat-subtitle">Stock reductions</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            📊
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Quantity</div>
            <div className="stat-value">{parseFloat(stats.totalQuantity).toFixed(2)}</div>
            <div className="stat-subtitle">Aggregate moved</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f5af19 0%, #12cfa9 100%)' }}>
            🔝
          </div>
          <div className="stat-content">
            <div className="stat-label">Most Active Type</div>
            <div className="stat-value" style={{ fontSize: '1.4rem' }}>
              {mostActiveType}
            </div>
            <div className="stat-subtitle">
              {stats.mostActiveType !== 'None' ? `Count: ${stats.movementsByType[stats.mostActiveType]}` : 'No movements'}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
            📁
          </div>
          <div className="stat-content">
            <div className="stat-label">Purchases</div>
            <div className="stat-value">{stats.movementsByType.PURCHASE}</div>
            <div className="stat-subtitle">Stock in</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #5436ff 0%, #667eea 100%)' }}>
            💰
          </div>
          <div className="stat-content">
            <div className="stat-label">Sales</div>
            <div className="stat-value">{stats.movementsByType.SALE}</div>
            <div className="stat-subtitle">Stock out</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f5af19 0%, #12cfa9 100%)' }}>
            🏭
          </div>
          <div className="stat-content">
            <div className="stat-label">Production</div>
            <div className="stat-value">{stats.movementsByType.PRODUCTION}</div>
            <div className="stat-subtitle">Created</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #5436ff 0%, #667eea 100%)' }}>
            🔄
          </div>
          <div className="stat-content">
            <div className="stat-label">Transfers</div>
            <div className="stat-value">{stats.movementsByType.TRANSFER}</div>
            <div className="stat-subtitle">Moved between warehouses</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
            ⚙️
          </div>
          <div className="stat-content">
            <div className="stat-label">Adjustments</div>
            <div className="stat-value">{stats.movementsByType.ADJUSTMENT}</div>
            <div className="stat-subtitle">Manual changes</div>
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
          onClick={() => navigate('/reports/inventory-movement')}
        >
          <span className="action-icon">📋</span>
          <span className="action-text">Movement Report</span>
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
          onClick={() => navigate('/inventory/stock-by-warehouse')}
        >
          <span className="action-icon">🏭</span>
          <span className="action-text">Stock by Warehouse</span>
        </button>
      </div>

      {isLoading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="ag-theme-quartz" style={{ height: 600, width: '100%' }}>
          <AgGridReact
            rowData={movements}
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Stock Movement"
        size="large"
      >
        <StockAdjustmentForm
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

function StockAdjustmentForm({ onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const [movementType, setMovementType] = useState('ADJUSTMENT');
  const [formData, setFormData] = useState({
    from_warehouse_id: '',
    to_warehouse_id: '',
    movement_date: new Date().toISOString().split('T')[0],
    remarks: ''
  });
  const [lineItems, setLineItems] = useState([
    { item_id: '', quantity: 0, available_stock: 0 }
  ]);

  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const response = await api.get('/inventory/items');
      return response.data.data;
    }
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const response = await api.get('/inventory/warehouses');
      return response.data.data;
    }
  });

  const { data: stockBalances = [] } = useQuery({
    queryKey: ['stock-balances'],
    queryFn: async () => {
      const response = await api.get('/inventory/stock-balances');
      return response.data;
    }
  });

  const mutation = useMutation({
    mutationFn: async (movements) => {
      // Submit each line item as a separate movement
      const promises = movements.map(movement =>
        api.post('/inventory/stock-movements', movement)
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast.success(`${lineItems.length} stock movement(s) recorded successfully!`);
      queryClient.invalidateQueries(['stock-movements']);
      queryClient.invalidateQueries(['items']);
      queryClient.invalidateQueries(['stock-balances']);
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to adjust stock');
    }
  });

  const getItemStock = (itemId, warehouseId) => {
    if (!itemId || !warehouseId || itemId === '' || warehouseId === '') {
      return 0;
    }
    const parsedItemId = parseInt(itemId);
    const parsedWarehouseId = parseInt(warehouseId);

    if (isNaN(parsedItemId) || isNaN(parsedWarehouseId)) {
      return 0;
    }

    const stock = stockBalances.find(
      sb => sb.item_id === parsedItemId && sb.warehouse_id === parsedWarehouseId
    );
    return stock ? parseFloat(stock.quantity) : 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLineItemChange = (index, field, value) => {
    const updated = [...lineItems];
    updated[index][field] = value;

    // Update available stock when item or warehouse changes
    if (field === 'item_id') {
      const warehouseId = movementType === 'TRANSFER'
        ? formData.from_warehouse_id
        : formData.to_warehouse_id;
      updated[index].available_stock = getItemStock(value, warehouseId);
    }

    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { item_id: '', quantity: 0, available_stock: 0 }]);
  };

  const removeLineItem = (index) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate line items
    const validItems = lineItems.filter(item => item.item_id && item.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Please add at least one item with quantity');
      return;
    }

    // Create movements based on type
    const movements = [];

    if (movementType === 'TRANSFER') {
      // For transfers, create two movements per item (OUT from source, IN to destination)
      validItems.forEach(item => {
        // Negative movement from source warehouse
        movements.push({
          item_id: item.item_id,
          warehouse_id: formData.from_warehouse_id,
          quantity: -Math.abs(item.quantity),
          movement_type: 'TRANSFER',
          movement_date: formData.movement_date,
          remarks: formData.remarks || 'Stock transfer'
        });

        // Positive movement to destination warehouse
        movements.push({
          item_id: item.item_id,
          warehouse_id: formData.to_warehouse_id,
          quantity: Math.abs(item.quantity),
          movement_type: 'TRANSFER',
          movement_date: formData.movement_date,
          remarks: formData.remarks || 'Stock transfer'
        });
      });
    } else {
      // For adjustments, create one movement per item
      validItems.forEach(item => {
        movements.push({
          item_id: item.item_id,
          warehouse_id: formData.to_warehouse_id,
          quantity: item.quantity,
          movement_type: 'ADJUSTMENT',
          movement_date: formData.movement_date,
          remarks: formData.remarks || 'Stock adjustment'
        });
      });
    }

    mutation.mutate(movements);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-row">
        <FormInput
          label="Movement Type"
          name="movement_type"
          type="select"
          value={movementType}
          onChange={(e) => setMovementType(e.target.value)}
          options={[
            { value: 'ADJUSTMENT', label: 'Stock Adjustment' },
            { value: 'TRANSFER', label: 'Stock Transfer' }
          ]}
          required
        />
        <FormInput
          label="Date"
          name="movement_date"
          type="date"
          value={formData.movement_date}
          onChange={handleChange}
          required
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: movementType === 'TRANSFER' ? '1fr 1fr' : '1fr', gap: 'var(--space-md)' }}>
        {movementType === 'TRANSFER' ? (
          <>
            <FormInput
              label="From Warehouse"
              name="from_warehouse_id"
              type="searchable-select"
              value={formData.from_warehouse_id}
              onChange={(e) => {
                handleChange(e);
                const updated = lineItems.map(item => ({
                  ...item,
                  available_stock: getItemStock(item.item_id, e.target.value)
                }));
                setLineItems(updated);
              }}
              options={warehouses.map(wh => ({
                value: wh.id,
                label: `${wh.warehouse_code} - ${wh.warehouse_name}`
              }))}
              placeholder="Select source warehouse..."
              required
            />
            <FormInput
              label="To Warehouse"
              name="to_warehouse_id"
              type="searchable-select"
              value={formData.to_warehouse_id}
              onChange={handleChange}
              options={warehouses.filter(wh => wh.id !== parseInt(formData.from_warehouse_id)).map(wh => ({
                value: wh.id,
                label: `${wh.warehouse_code} - ${wh.warehouse_name}`
              }))}
              placeholder="Select destination warehouse..."
              required
            />
          </>
        ) : (
          <FormInput
            label="Warehouse"
            name="to_warehouse_id"
            type="searchable-select"
            value={formData.to_warehouse_id}
            onChange={(e) => {
              handleChange(e);
              const updated = lineItems.map(item => ({
                ...item,
                available_stock: getItemStock(item.item_id, e.target.value)
              }));
              setLineItems(updated);
            }}
            options={warehouses.map(wh => ({
              value: wh.id,
              label: `${wh.warehouse_code} - ${wh.warehouse_name}`
            }))}
            placeholder="Select warehouse..."
            required
          />
        )}
      </div>

      <div style={{ marginTop: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <h4 style={{ margin: 0 }}>Items</h4>
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={addLineItem}
          >
            + Add Row
          </Button>
        </div>

        <div className="ag-theme-quartz" style={{ height: 300, width: '100%' }}>
          <AgGridReact
            rowData={lineItems}
            columnDefs={[
              {
                headerName: '#',
                valueGetter: 'node.rowIndex + 1',
                width: 60,
                cellStyle: { color: 'var(--neutral-500)' }
              },
              {
                headerName: 'Item',
                field: 'item_id',
                flex: 2,
                editable: true,
                cellEditor: 'agSelectCellEditor',
                cellEditorParams: {
                  values: items.map(i => String(i.id))
                },
                valueFormatter: params => {
                  if (!params.value) return '';
                  const item = items.find(i => i.id === parseInt(params.value));
                  return item ? `${item.item_code} - ${item.item_name}` : '';
                },
                valueParser: params => params.newValue ? String(params.newValue) : '',
                onCellValueChanged: params => {
                  const warehouseId = movementType === 'TRANSFER'
                    ? formData.from_warehouse_id
                    : formData.to_warehouse_id;
                  params.data.available_stock = getItemStock(params.value, warehouseId);
                  params.api.refreshCells({ rowNodes: [params.node], force: true });
                }
              },
              {
                headerName: 'Available Stock',
                field: 'available_stock',
                flex: 1,
                valueGetter: params => {
                  if (!params.data.item_id) return null;
                  const warehouseId = movementType === 'TRANSFER'
                    ? formData.from_warehouse_id
                    : formData.to_warehouse_id;
                  if (!warehouseId) return null;
                  return getItemStock(params.data.item_id, warehouseId);
                },
                valueFormatter: params => {
                  if (!params.data.item_id || !(formData.from_warehouse_id || formData.to_warehouse_id)) return '-';
                  const item = items.find(i => i.id === parseInt(params.data.item_id));
                  const stockValue = params.value !== null ? params.value : 0;
                  return `${stockValue} ${item?.unit_of_measure || ''}`;
                },
                cellStyle: params => {
                  const stockValue = params.value !== null ? params.value : 0;
                  return {
                    color: stockValue > 0 ? 'var(--success)' : params.data.item_id ? 'var(--error)' : 'var(--neutral-400)'
                  };
                }
              },
              {
                headerName: 'Quantity',
                field: 'quantity',
                flex: 1,
                editable: true,
                cellEditor: 'agNumberCellEditor',
                cellEditorParams: {
                  precision: 2
                }
              },
              {
                headerName: '',
                width: 60,
                cellRenderer: (params) => (
                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      color: lineItems.length === 1 ? 'var(--neutral-300)' : 'var(--error)',
                      cursor: lineItems.length === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '18px',
                      padding: '4px 8px'
                    }}
                    disabled={lineItems.length === 1}
                    title="Remove row"
                    onClick={() => removeLineItem(params.node.rowIndex)}
                  >
                    ×
                  </button>
                )
              }
            ]}
            defaultColDef={{
              sortable: false,
              resizable: true
            }}
            domLayout="autoHeight"
            suppressCellFocus={false}
            singleClickEdit={true}
            stopEditingWhenCellsLoseFocus={true}
            onCellValueChanged={params => {
              const updatedItems = [...lineItems];
              updatedItems[params.node.rowIndex] = params.data;
              setLineItems(updatedItems);
            }}
          />
        </div>
      </div>

      <FormInput
        label="Remarks"
        name="remarks"
        type="textarea"
        value={formData.remarks}
        onChange={handleChange}
        placeholder="Reason for movement..."
        rows={2}
        style={{ marginTop: 'var(--space-md)' }}
      />

      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={mutation.isPending}>
          Record {movementType === 'TRANSFER' ? 'Transfer' : 'Adjustment'}
        </Button>
      </div>
    </form>
  );
}
