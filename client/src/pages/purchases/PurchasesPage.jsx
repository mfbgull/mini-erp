import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSettings } from '../../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { AgGridReact } from 'ag-grid-react';
import api from '../../utils/api';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import FormInput from '../../components/common/FormInput';
import './PurchasesPage.css';

export default function PurchasesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { formatCurrency } = useSettings();
  const navigate = useNavigate();

  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ['purchases'],
    queryFn: async () => {
      const response = await api.get('/purchases');
      return response.data;
    }
  });

  // Calculate statistics
  const stats = {
    totalPurchases: purchases.length,
    totalValue: purchases.reduce((sum, p) => sum + parseFloat(p.total_cost || 0), 0),
    totalQuantity: purchases.reduce((sum, p) => sum + parseFloat(p.quantity || 0), 0),
    uniqueSuppliers: new Set(purchases.map(p => p.supplier_name).filter(Boolean)).size,
    uniqueItems: new Set(purchases.map(p => p.item_id).filter(Boolean)).size,
    averagePurchaseValue: purchases.length > 0
      ? purchases.reduce((sum, p) => sum + parseFloat(p.total_cost || 0), 0) / purchases.length
      : 0,
    largestPurchase: purchases.length > 0
      ? purchases.reduce((max, p) => parseFloat(p.total_cost || 0) > parseFloat(max.total_cost || 0) ? p : max)
      : { total_cost: 0 },
    recentPurchases: purchases.filter(p => {
      const purchaseDate = new Date(p.purchase_date);
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      return purchaseDate >= oneMonthAgo;
    }).length
  };

  // Export to CSV
  const handleExport = () => {
    if (purchases.length === 0) {
      toast.error('No purchases to export');
      return;
    }

    const headers = [
      'Purchase #', 'Date', 'Item', 'Quantity',
      'Unit Cost', 'Total Cost', 'Supplier', 'Warehouse'
    ];

    const rows = purchases.map(p => [
      p.purchase_no,
      format(new Date(p.purchase_date), 'yyyy-MM-dd'),
      p.item_name,
      p.quantity,
      p.unit_cost,
      p.total_cost,
      p.supplier_name || '',
      p.warehouse_name || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `purchases-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Purchases exported successfully!');
  };

  const columnDefs = [
    {
      headerName: 'Purchase #',
      field: 'purchase_no',
      sortable: true,
      filter: true,
      flex: 1
    },
    {
      headerName: 'Date',
      field: 'purchase_date',
      sortable: true,
      filter: 'agDateColumnFilter',
      flex: 1,
      valueFormatter: params => format(new Date(params.value), 'dd MMM yyyy')
    },
    {
      headerName: 'Item',
      field: 'item_name',
      sortable: true,
      filter: true,
      flex: 2
    },
    {
      headerName: 'Quantity',
      field: 'quantity',
      sortable: true,
      filter: 'agNumberColumnFilter',
      flex: 1,
      valueFormatter: params => `${parseFloat(params.value).toFixed(2)} ${params.data.unit_of_measure}`
    },
    {
      headerName: 'Unit Cost',
      field: 'unit_cost',
      sortable: true,
      filter: 'agNumberColumnFilter',
      flex: 1,
      valueFormatter: params => formatCurrency(parseFloat(params.value))
    },
    {
      headerName: 'Total',
      field: 'total_cost',
      sortable: true,
      filter: 'agNumberColumnFilter',
      flex: 1,
      cellRenderer: (params) => (
        <strong>{formatCurrency(parseFloat(params.value))}</strong>
      )
    },
    {
      headerName: 'Supplier',
      field: 'supplier_name',
      sortable: true,
      filter: true,
      flex: 1.5,
      valueFormatter: params => params.value || '—'
    },
    {
      headerName: 'Warehouse',
      field: 'warehouse_name',
      filter: true,
      flex: 1.5
    }
  ];

  const handleNew = () => {
    setIsModalOpen(true);
  };

  return (
    <div className="purchases-page">
      <div className="page-header">
        <div>
          <h1>Purchases</h1>
          <p className="page-subtitle">Record direct purchases and track costs</p>
        </div>
        <Button variant="primary" onClick={handleNew}>
          + Record Purchase
        </Button>
      </div>

      {/* Summary Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            🛒
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Purchases</div>
            <div className="stat-value">{stats.totalPurchases}</div>
            <div className="stat-subtitle">All transactions</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            💰
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Value</div>
            <div className="stat-value">{formatCurrency(stats.totalValue)}</div>
            <div className="stat-subtitle">Purchase cost</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            📊
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Quantity</div>
            <div className="stat-value">{parseFloat(stats.totalQuantity).toFixed(2)}</div>
            <div className="stat-subtitle">Aggregate items</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
            🏢
          </div>
          <div className="stat-content">
            <div className="stat-label">Suppliers</div>
            <div className="stat-value">{stats.uniqueSuppliers}</div>
            <div className="stat-subtitle">Unique vendors</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f5af19 0%, #12cfa9 100%)' }}>
            📦
          </div>
          <div className="stat-content">
            <div className="stat-label">Items</div>
            <div className="stat-value">{stats.uniqueItems}</div>
            <div className="stat-subtitle">Products purchased</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #5436ff 0%, #667eea 100%)' }}>
            📈
          </div>
          <div className="stat-content">
            <div className="stat-label">Average Value</div>
            <div className="stat-value">{formatCurrency(stats.averagePurchaseValue)}</div>
            <div className="stat-subtitle">Per purchase</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
            💎
          </div>
          <div className="stat-content">
            <div className="stat-label">Largest Purchase</div>
            <div className="stat-value" style={{ fontSize: '1.4rem' }}>
              {stats.largestPurchase.total_cost ? formatCurrency(stats.largestPurchase.total_cost) : 'N/A'}
            </div>
            <div className="stat-subtitle">
              {stats.largestPurchase.total_cost ? `${formatCurrency(stats.largestPurchase.total_cost)} on ${format(new Date(stats.largestPurchase.purchase_date), 'MMM dd')}` : 'No purchases'}
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ borderColor: stats.recentPurchases > 0 ? '#f5af19' : undefined }}>
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #dc3545 0%, #fd7e14 100%)' }}>
            📅
          </div>
          <div className="stat-content">
            <div className="stat-label">Recent (30 Days)</div>
            <div className="stat-value">{stats.recentPurchases}</div>
            <div className="stat-subtitle">Last month</div>
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
          onClick={() => navigate('/reports/purchase-summary')}
        >
          <span className="action-icon">📊</span>
          <span className="action-text">Purchase Summary</span>
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
          onClick={() => navigate('/inventory/stock-movements')}
        >
          <span className="action-icon">📋</span>
          <span className="action-text">Stock Movements</span>
        </button>
        <button
          className="quick-action-btn"
          onClick={() => navigate('/inventory/items')}
        >
          <span className="action-icon">📦</span>
          <span className="action-text">Items</span>
        </button>
      </div>

      {isLoading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="ag-theme-quartz" style={{ height: 600, width: '100%' }}>
          <AgGridReact
            rowData={purchases}
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
        title="Record Purchase"
        size="medium"
      >
        <PurchaseForm
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries(['purchases']);
            queryClient.invalidateQueries(['items']);
            setIsModalOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}

function PurchaseForm({ onClose, onSuccess }) {
  const { formatCurrency } = useSettings();
  const [formData, setFormData] = useState({
    item_id: '',
    warehouse_id: '',
    quantity: '',
    unit_cost: '',
    supplier_name: '',
    purchase_date: new Date().toISOString().split('T')[0],
    invoice_no: '',
    remarks: ''
  });

  // Fetch items
  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const response = await api.get('/inventory/items');
      return response.data.data;
    }
  });

  // Fetch warehouses
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const response = await api.get('/inventory/warehouses');
      return response.data.data;
    }
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      return api.post('/purchases', data);
    },
    onSuccess: () => {
      toast.success('Purchase recorded successfully!');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to record purchase');
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Convert to proper types
    const data = {
      ...formData,
      item_id: parseInt(formData.item_id),
      warehouse_id: parseInt(formData.warehouse_id),
      quantity: parseFloat(formData.quantity),
      unit_cost: parseFloat(formData.unit_cost)
    };

    mutation.mutate(data);
  };

  const totalCost = formData.quantity && formData.unit_cost
    ? (parseFloat(formData.quantity) * parseFloat(formData.unit_cost)).toFixed(2)
    : '0.00';

  return (
    <form onSubmit={handleSubmit} className="purchase-form">
      <div className="form-row">
        <FormInput
          label="Item *"
          name="item_id"
          type="searchable-select"
          value={formData.item_id}
          onChange={handleChange}
          options={items.map(item => ({
            value: item.id,
            label: `${item.item_code} - ${item.item_name}`
          }))}
          placeholder="Search items..."
          required
        />

        <FormInput
          label="Warehouse *"
          name="warehouse_id"
          type="searchable-select"
          value={formData.warehouse_id}
          onChange={handleChange}
          options={warehouses.map(wh => ({
            value: wh.id,
            label: `${wh.warehouse_code} - ${wh.warehouse_name}`
          }))}
          placeholder="Search warehouses..."
          required
        />
      </div>

      <div className="form-row">
        <FormInput
          label="Quantity *"
          name="quantity"
          type="number"
          step="0.001"
          value={formData.quantity}
          onChange={handleChange}
          placeholder="0.000"
          required
        />

        <FormInput
          label="Unit Cost *"
          name="unit_cost"
          type="number"
          step="0.01"
          value={formData.unit_cost}
          onChange={handleChange}
          placeholder="0.00"
          required
        />
      </div>

      {formData.quantity && formData.unit_cost && (
        <div className="total-cost-display">
          <span>Total Cost:</span>
          <strong>{formatCurrency(parseFloat(totalCost))}</strong>
        </div>
      )}

      <div className="form-row">
        <FormInput
          label="Purchase Date *"
          name="purchase_date"
          type="date"
          value={formData.purchase_date}
          onChange={handleChange}
          required
        />

        <FormInput
          label="Supplier Name"
          name="supplier_name"
          value={formData.supplier_name}
          onChange={handleChange}
          placeholder="e.g., ABC Suppliers"
        />
      </div>

      <FormInput
        label="Invoice Number"
        name="invoice_no"
        value={formData.invoice_no}
        onChange={handleChange}
        placeholder="e.g., INV-2025-001"
      />

      <FormInput
        label="Remarks"
        name="remarks"
        type="textarea"
        value={formData.remarks}
        onChange={handleChange}
        placeholder="Additional notes about this purchase..."
        rows={3}
      />

      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={mutation.isPending}>
          Record Purchase
        </Button>
      </div>
    </form>
  );
}
