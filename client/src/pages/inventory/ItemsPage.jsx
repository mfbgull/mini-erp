import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AgGridReact } from 'ag-grid-react';
import { Search, X, ArrowLeft, Building2, Package, DollarSign, BarChart3, AlertTriangle, Ban, FolderOpen, Wrench, Factory, Download, Upload, Wallet, Plus } from 'lucide-react';

import Button from '../../components/common/Button';
import CompactItemCardView from '../../components/common/CompactItemCard';
import FormInput from '../../components/common/FormInput';
import Modal from '../../components/common/Modal';
import StatCard, { StatsGrid } from '../../components/common/StatCard';
import { useSettings } from '../../context/SettingsContext';
import { useFormValidation } from '../../hooks/useFormValidation';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { useTranslation } from '../../hooks/useTranslation';
import { itemSchema } from '../../schemas';
import api from '../../utils/api';
import './ItemsPage.css';

export default function ItemsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const gridWrapperRef = useRef(null);
  const [gridHeight, setGridHeight] = useState(600);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const { formatCurrency } = useSettings();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isMobile } = useMobileDetection();
  const queryClient = useQueryClient();

  useKeyboardShortcut('Alt+N', () => {
    navigate('/inventory/items/create');
  }, { context: 'inventory', id: 'inventory-new-item' });

  useKeyboardShortcut('Alt+I', () => {
    const searchInput = document.querySelector('input[type="search"]') || document.querySelector('input[placeholder*="Search"]');
    if (searchInput) searchInput.focus();
  }, { context: 'inventory', id: 'inventory-focus-items' });

  useKeyboardShortcut('Alt+W', () => {
    navigate('/inventory/warehouses');
  }, { context: 'inventory', id: 'inventory-go-warehouses' });

  // Get warehouse filter from URL
  const warehouseId = searchParams.get('warehouse');

  // Fetch selected warehouse details if filtering by warehouse
  useEffect(() => {
    const fetchWarehouse = async () => {
      if (warehouseId) {
        try {
          const response = await api.get(`/inventory/warehouses/${warehouseId}`);
          setSelectedWarehouse(response.data.data);
        } catch (error) {
          console.error('Failed to fetch warehouse:', error);
          setSelectedWarehouse(null);
        }
      } else {
        setSelectedWarehouse(null);
      }
    };
    fetchWarehouse();
  }, [warehouseId]);

  // Fetch items
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const response = await api.get('/inventory/items');
      return response.data.data;
    }
  });

  // Filter items by warehouse if specified
  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.item_code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesWarehouse = warehouseId 
      ? item.warehouse_id == warehouseId || item.warehouse === warehouseId
      : true;
    
    return matchesSearch && matchesWarehouse;
  });

  // Dynamically resize grid to fill available vertical space
  const updateGridHeight = useCallback(() => {
    if (gridWrapperRef.current) {
      const rect = gridWrapperRef.current.getBoundingClientRect();
      const available = window.innerHeight - rect.top - 16;
      setGridHeight(Math.max(200, available));
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      // Small delay to ensure DOM is laid out
      requestAnimationFrame(() => updateGridHeight());
    }
    window.addEventListener('resize', updateGridHeight);
    return () => window.removeEventListener('resize', updateGridHeight);
  }, [updateGridHeight, isLoading]);

  // Calculate statistics (filtered by warehouse if applicable)
  const filteredForStats = warehouseId 
    ? items.filter(item => item.warehouse_id == warehouseId || item.warehouse === warehouseId)
    : items;

  const stats = {
    totalItems: filteredForStats.length,
    totalStockValue: filteredForStats.reduce((sum, item) =>
      sum + (parseFloat(item.current_stock || 0) * parseFloat(item.standard_cost || 0)), 0
    ),
    totalStock: filteredForStats.reduce((sum, item) =>
      sum + parseFloat(item.current_stock || 0), 0
    ),
    lowStockAlerts: filteredForStats.filter(item =>
      item.reorder_level > 0 && item.current_stock <= item.reorder_level
    ).length,
    outOfStock: filteredForStats.filter(item =>
      parseFloat(item.current_stock || 0) === 0
    ).length,
    categories: new Set(filteredForStats.map(item => item.category).filter(Boolean)).size,
    rawMaterials: filteredForStats.filter(item =>
      item.is_raw_material === 1 || item.is_raw_material === true
    ).length,
    finishedGoods: filteredForStats.filter(item =>
      item.is_finished_good === 1 || item.is_finished_good === true
    ).length
  };

  // Export to CSV
  const handleExport = () => {
    if (filteredItems.length === 0) {
      toast.error(t('inventory.noItemsExport'));
      return;
    }

    const headers = [
      'Item Code', 'Item Name', 'Category', 'UOM',
      'Stock', 'Cost', 'Price', 'Reorder Level',
      'Raw Material', 'Finished Good', 'Purchased', 'Manufactured'
    ];

    const rows = filteredItems.map(item => [
      item.item_code,
      item.item_name,
      item.category || '',
      item.unit_of_measure,
      item.current_stock || 0,
      item.standard_cost || 0,
      item.standard_selling_price || 0,
      item.reorder_level || 0,
      item.is_raw_material ? 'Yes' : 'No',
      item.is_finished_good ? 'Yes' : 'No',
      item.is_purchased ? 'Yes' : 'No',
      item.is_manufactured ? 'Yes' : 'No'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `items-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(t('inventory.itemsExported'));
  };

  // Import items
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const text = event.target.result;
          const rows = text.split('\n');
          if (rows.length < 2) {
            toast.error(t('inventory.csvEmpty'));
            return;
          }

          const headers = rows[0].split(',');
          let successCount = 0;
          let errorCount = 0;

          for (let i = 1; i < rows.length; i++) {
            const values = rows[i].split(',');
            if (values.length < 2) continue;

            const itemData = {};
            headers.forEach((header, index) => {
              itemData[header.trim()] = values[index]?.trim();
            });

            try {
              await api.post('/inventory/items', {
                item_code: itemData['Item Code'] || itemData['item_code'],
                item_name: itemData['Item Name'] || itemData['item_name'],
                category: itemData['Category'] || itemData['category'] || '',
                unit_of_measure: itemData['UOM'] || itemData['unit_of_measure'] || 'Nos',
                standard_cost: parseFloat(itemData['Cost'] || itemData['standard_cost']) || 0,
                standard_selling_price: parseFloat(itemData['Price'] || itemData['standard_selling_price']) || 0,
                reorder_level: parseFloat(itemData['Reorder Level'] || itemData['reorder_level']) || 0,
                is_raw_material: itemData['Raw Material'] === 'Yes' || itemData['is_raw_material'] === 'true',
                is_finished_good: itemData['Finished Good'] === 'Yes' || itemData['is_finished_good'] === 'true',
                is_purchased: itemData['Purchased'] !== 'No' && itemData['is_purchased'] !== 'false',
                is_manufactured: itemData['Manufactured'] === 'Yes' || itemData['is_manufactured'] === 'true'
              });
              successCount++;
            } catch (error) {
              console.error('Import error:', error);
              errorCount++;
            }
          }

          toast.success(`${t('inventory.importComplete')}: ${successCount} ${t('inventory.items')} ${t('actions.import').toLowerCase()}, ${errorCount} ${t('inventory.failed')}`);
          queryClient.invalidateQueries(['items']);
        } catch (error) {
          console.error('Import error:', error);
          toast.error(t('inventory.importError'));
        }
      };

      reader.readAsText(file);
    };

    input.click();
  };

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId) => {
      return api.delete(`/inventory/items/${itemId}`);
    },
    onSuccess: () => {
      toast.success(t('inventory.itemDeleted'));
      queryClient.invalidateQueries(['items']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete item');
    }
  });

  const handleDeleteItem = (item) => {
    if (window.confirm(`${t('inventory.confirmDelete')}: ${item.item_name}?`)) {
      deleteItemMutation.mutate(item.id);
    }
  };

  const columnDefs = [
    {
      headerName: t('inventory.itemCode'),
      field: 'item_code',
      sortable: true,
      filter: true,
      flex: 1
    },
    {
      headerName: t('inventory.itemName'),
      field: 'item_name',
      sortable: true,
      filter: true,
      flex: 2
    },
    {
      headerName: t('inventory.category'),
      field: 'category',
      sortable: true,
      filter: true,
      flex: 1
    },
    {
      headerName: t('inventory.uom'),
      field: 'unit_of_measure',
      flex: 0.7
    },
    {
      headerName: t('inventory.stock'),
      field: 'current_stock',
      sortable: true,
      filter: 'agNumberColumnFilter',
      flex: 0.8,
      valueFormatter: params => parseFloat(params.value || 0).toFixed(2),
      cellStyle: params => {
        if (params.data.reorder_level > 0 && params.value <= params.data.reorder_level) {
          return { backgroundColor: '#fff3cd', color: '#856404' };
        }
        return null;
      }
    },
    {
      headerName: t('inventory.cost'),
      field: 'standard_cost',
      sortable: true,
      filter: 'agNumberColumnFilter',
      flex: 0.8,
      valueFormatter: params => formatCurrency(params.value || 0)
    },
    {
      headerName: t('inventory.price'),
      field: 'standard_selling_price',
      sortable: true,
      filter: 'agNumberColumnFilter',
      flex: 0.8,
      valueFormatter: params => formatCurrency(params.value || 0)
    },
    {
      headerName: t('inventory.actions'),
      field: 'actions',
      flex: 1,
      minWidth: 120,
      cellRenderer: (params) => {
        return (
          <div className="table-actions">
            <Button
              variant="primary"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setEditingItem(params.data);
                setIsModalOpen(true);
              }}
            >
              {t('inventory.edit')}
            </Button>
            <Button
              variant="danger"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteItem(params.data);
              }}
              disabled={deleteItemMutation.isPending}
            >
              {deleteItemMutation.isPending ? t('inventory.deleting') : t('inventory.delete')}
            </Button>
          </div>
        );
      }
    }
  ];

  const handleRowClick = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleNewItem = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleClearWarehouseFilter = () => {
    setSearchParams({});
    setSelectedWarehouse(null);
  };

  return (
    <div className="items-page">
      <div className="page-header">
        <div>
          {selectedWarehouse ? (
            <>
              <button 
                className="back-to-warehouses-btn"
                onClick={handleClearWarehouseFilter}
                type="button"
              >
                <ArrowLeft size={20} />
                {t('inventory.backToWarehouses')}
              </button>
              <div className="warehouse-filter-info">
                <Building2 size={20} />
                <span>{t('inventory.itemsIn')}: <strong>{selectedWarehouse.warehouse_name}</strong></span>
              </div>
            </>
          ) : (
            <h1>{t('inventory.items')}</h1>
          )}
        </div>
        <Button variant="primary" onClick={handleNewItem}>
          <Plus size={18} /> {t('inventory.newItem')}
        </Button>
      </div>

      <StatsGrid className="compact">
        <StatCard icon={Package} label={t('dashboard.totalItems')} value={stats.totalItems} subtitle={warehouseId ? `${t('inventory.itemsIn')} ${selectedWarehouse?.warehouse_name || ''}` : t('inventory.activeItems')} />
        <StatCard icon={DollarSign} label={t('inventory.stockValue')} value={formatCurrency(stats.totalStockValue)} subtitle={t('inventory.currentInventoryWorth')} />
        <StatCard icon={BarChart3} label={t('inventory.totalStock')} value={parseFloat(stats.totalStock).toFixed(2)} subtitle={t('inventory.aggregateQty')} />
        <StatCard icon={AlertTriangle} label={t('inventory.lowStock')} value={stats.lowStockAlerts} subtitle={t('inventory.belowReorder')} style={{ borderColor: stats.lowStockAlerts > 0 ? '#f5576c' : undefined }} />
        <StatCard icon={Ban} label={t('inventory.outOfStock')} value={stats.outOfStock} subtitle={t('inventory.zeroStock')} style={{ borderColor: stats.outOfStock > 0 ? '#dc3545' : undefined }} />
        <StatCard icon={FolderOpen} label={t('inventory.categories')} value={stats.categories} subtitle={t('inventory.uniqueCats')} />
        <StatCard icon={Wrench} label={t('inventory.rawMaterials')} value={stats.rawMaterials} subtitle={t('inventory.materialItems')} />
        <StatCard icon={Factory} label={t('inventory.finishedGoods')} value={stats.finishedGoods} subtitle={t('inventory.manufacturedProducts')} />
      </StatsGrid>

      <div className="search-quick-row">
        <div className="search-section">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              className="search-input-field"
              placeholder={t('inventory.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="search-clear-btn"
                onClick={() => setSearchTerm('')}
                type="button"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        <div className="quick-actions">
          <button className="quick-action-btn" onClick={handleExport} type="button">
            <Download className="action-icon" size={24} />
            <span className="action-text">{t('inventory.exportCSV')}</span>
          </button>
          <button className="quick-action-btn" onClick={handleImport} type="button">
            <Upload className="action-icon" size={24} />
            <span className="action-text">{t('inventory.importItems')}</span>
          </button>
          <button
            className="quick-action-btn"
            onClick={() => navigate('/reports/low-stock')}
            type="button"
          >
            <AlertTriangle className="action-icon" size={24} />
            <span className="action-text">{t('inventory.lowStockReport')}</span>
          </button>
          <button
            className="quick-action-btn"
            onClick={() => navigate('/reports/stock-valuation')}
            type="button"
          >
            <Wallet className="action-icon" size={24} />
            <span className="action-text">{t('inventory.stockValuation')}</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : filteredItems.length === 0 && searchTerm ? (
        <div className="no-results">
          <Search className="no-results-icon" size={48} />
          <h3>{t('inventory.noItemsFound')}</h3>
          <p>{t('inventory.noItemsMatch')} "{searchTerm}"</p>
          <Button variant="secondary" onClick={() => setSearchTerm('')}>{t('inventory.clearSearch')}</Button>
        </div>
      ) : filteredItems.length === 0 && warehouseId ? (
        <div className="no-results">
          <Package className="no-results-icon" size={48} />
          <h3>{t('inventory.noItemsWarehouse')}</h3>
          <p>{t('inventory.noItemsWarehouseYet')}</p>
          <Button variant="secondary" onClick={handleClearWarehouseFilter}>{t('inventory.viewAllItems')}</Button>
        </div>
      ) : isMobile ? (
        <>
          <CompactItemCardView
            items={filteredItems}
            onEdit={(item) => {
              setEditingItem(item);
              setIsModalOpen(true);
            }}
            onDelete={handleDeleteItem}
          />
          <div className="mobile-action-bar">
            <Button variant="primary" onClick={handleNewItem}>
              + {t('inventory.newItem')}
            </Button>
          </div>
        </>
      ) : (
        <div className="ag-grid-wrapper" ref={gridWrapperRef}>
          <div className="ag-theme-quartz" style={{ height: gridHeight }}>
          <AgGridReact theme="legacy"
            rowData={filteredItems}
            columnDefs={columnDefs}
            defaultColDef={{
              resizable: true,
              sortable: false,
              filter: false
            }}
            pagination={true}
            paginationPageSize={20}
            paginationPageSizeSelector={[10, 20, 50, 100]}
            onRowClicked={(params) => handleRowClick(params.data)}
            rowSelection={{ mode: 'singleRow' }}
          />
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingItem ? 'Edit Item' : 'New Item'}
        size="medium"
      >
        <ItemForm
          item={editingItem}
          onClose={handleCloseModal}
          onSuccess={() => {
            queryClient.invalidateQueries(['items']);
            handleCloseModal();
          }}
        />
      </Modal>
    </div>
  );
}

// Item Form Component
function ItemForm({ item, onClose, onSuccess }) {
  const isEdit = !!item;
  const [formData, setFormData] = useState({
    item_code: item?.item_code || '',
    item_name: item?.item_name || '',
    description: item?.description || '',
    category: item?.category || '',
    unit_of_measure: item?.unit_of_measure || 'Nos',
    reorder_level: item?.reorder_level || 0,
    standard_cost: item?.standard_cost || 0,
    standard_selling_price: item?.standard_selling_price || 0,
    is_raw_material: item?.is_raw_material || false,
    is_finished_good: item?.is_finished_good || false,
    is_purchased: item?.is_purchased !== undefined ? item.is_purchased : true,
    is_manufactured: item?.is_manufactured || false
  });

  const { errors, validate, clearErrors } = useFormValidation(itemSchema);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isEdit) {
        return api.put(`/inventory/items/${item.id}`, data);
      } else {
        return api.post('/inventory/items', data);
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Item updated!' : 'Item created!');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to save item');
    }
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });

    // Clear error when user starts typing
    if (errors[name]) {
      clearErrors();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate(formData)) return;

    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="item-form">
      <div className="form-row">
        <FormInput
          label="Item Code"
          name="item_code"
          value={formData.item_code}
          onChange={handleChange}
          placeholder="e.g., ITEM-001"
          required
          disabled={isEdit}
        />
        <FormInput
          label="Item Name"
          name="item_name"
          value={formData.item_name}
          onChange={handleChange}
          placeholder="e.g., Mustard Seeds"
          required
        />
      </div>

      <FormInput
        label="Description"
        name="description"
        type="textarea"
        value={formData.description}
        onChange={handleChange}
        placeholder="Item description..."
        rows={2}
      />

      <div className="form-row">
        <FormInput
          label="Category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          placeholder="e.g., Raw Materials"
        />
        <FormInput
          label="Unit of Measure"
          name="unit_of_measure"
          type="searchable-select"
          value={formData.unit_of_measure}
          onChange={handleChange}
          required
          options={[
            { value: 'Nos', label: 'Nos (Pieces)' },
            { value: 'Kg', label: 'Kg (Kilogram)' },
            { value: 'Ltr', label: 'Ltr (Liter)' },
            { value: 'Box', label: 'Box' },
            { value: 'Pack', label: 'Pack' },
            { value: 'Bottle', label: 'Bottle' }
          ]}
          placeholder="Search UOM..."
        />
      </div>

      <div className="form-row">
        <FormInput
          label="Standard Cost"
          name="standard_cost"
          type="number"
          value={formData.standard_cost}
          onChange={handleChange}
          placeholder="0.00"
        />
        <FormInput
          label="Selling Price"
          name="standard_selling_price"
          type="number"
          value={formData.standard_selling_price}
          onChange={handleChange}
          placeholder="0.00"
        />
        <FormInput
          label="Reorder Level"
          name="reorder_level"
          type="number"
          value={formData.reorder_level}
          onChange={handleChange}
          placeholder="0"
        />
      </div>

      <div className="form-section">
        <h4>Item Type</h4>
        <div className="checkbox-group">
          <FormInput
            label=""
            name="is_raw_material"
            type="checkbox"
            value={formData.is_raw_material}
            onChange={handleChange}
            placeholder="Raw Material"
          />
          <FormInput
            label=""
            name="is_finished_good"
            type="checkbox"
            value={formData.is_finished_good}
            onChange={handleChange}
            placeholder="Finished Good"
          />
          <FormInput
            label=""
            name="is_purchased"
            type="checkbox"
            value={formData.is_purchased}
            onChange={handleChange}
            placeholder="Purchased Item"
          />
          <FormInput
            label=""
            name="is_manufactured"
            type="checkbox"
            value={formData.is_manufactured}
            onChange={handleChange}
            placeholder="Manufactured Item"
          />
        </div>
      </div>

      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={mutation.isPending}>
          {isEdit ? 'Update Item' : 'Create Item'}
        </Button>
      </div>
    </form>
  );
}
