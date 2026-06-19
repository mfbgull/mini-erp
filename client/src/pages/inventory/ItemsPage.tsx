import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AgGridReact } from 'ag-grid-react';
import { Search, X, ArrowLeft, Building2, Package, DollarSign, BarChart3, AlertTriangle, Ban, FolderOpen, Wrench, Factory, Download, Upload, Wallet, Plus, MoreVertical, Eye, Edit2, Trash2 } from 'lucide-react';

import ItemPreview from './ItemPreview';
import Button from '../../components/common/Button';
import CompactItemCardView from '../../components/common/CompactItemCard';
import DropdownMenu from '../../components/common/DropdownMenu';
import Modal from '../../components/common/Modal';
import StatCard, { StatsGrid } from '../../components/common/StatCard';
import ItemForm from '../../components/inventory/ItemForm';
import { useSettings } from '../../context/SettingsContext';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { useTranslation } from '../../hooks/useTranslation';
import api from '../../utils/api';
import { createActionColDef } from '../../utils/agGridIntegration';
import { getStockCellClass } from '../../utils/statusCellUtils';
import type { InventoryItem, ItemStats } from '../../utils/itemTypes';
import './ItemsPage.css';
import '../../styles/ag-grid-status-cells.css';

interface Warehouse {
  id: number;
  warehouse_name: string;
  warehouse_code: string;
}

export default function ItemsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const gridWrapperRef = useRef<HTMLDivElement>(null);
  const [gridHeight, setGridHeight] = useState(600);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [previewItem, setPreviewItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const { formatCurrency } = useSettings();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isMobile } = useMobileDetection();
  const queryClient = useQueryClient();

  useKeyboardShortcut('Alt+N', () => {
    navigate('/inventory/items?action=create');
  }, { context: 'inventory', id: 'inventory-new-item', label: 'New item' });

  useKeyboardShortcut('Alt+I', () => {
    const searchInput = document.querySelector('input[type="search"]') || document.querySelector('input[placeholder*="Search"]');
    if (searchInput) (searchInput as HTMLInputElement).focus();
  }, { context: 'inventory', id: 'inventory-focus-items', label: 'Search items' });

  useKeyboardShortcut('Alt+W', () => {
    navigate('/inventory/warehouses');
  }, { context: 'inventory', id: 'inventory-go-warehouses', label: 'Warehouses' });

  const warehouseId = searchParams.get('warehouse');

  useEffect(() => {
    const fetchWarehouse = async () => {
      if (warehouseId) {
        try {
          const response = await api.get(`/inventory/warehouses/${warehouseId}`);
          setSelectedWarehouse(response.data.data);
        } catch {
          setSelectedWarehouse(null);
        }
      } else {
        setSelectedWarehouse(null);
      }
    };
    fetchWarehouse();
  }, [warehouseId]);

  const { data: items = [], isLoading } = useQuery<InventoryItem[]>({
    queryKey: ['items'],
    queryFn: async () => {
      const response = await api.get('/inventory/items');
      return response.data.data;
    }
  });

  useEffect(() => {
    if (searchParams.get('action') === 'create' && !isLoading) {
      setEditingItem(null);
      setIsModalOpen(true);
    }
  }, [searchParams, isLoading]);

  const filteredItems = items.filter(item => {
    const matchesSearch =
      item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.item_code?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesWarehouse = warehouseId
      ? item.warehouse_id == Number(warehouseId) || item.warehouse === warehouseId
      : true;

    return matchesSearch && matchesWarehouse;
  });

  const updateGridHeight = useCallback(() => {
    if (gridWrapperRef.current) {
      const rect = gridWrapperRef.current.getBoundingClientRect();
      const available = window.innerHeight - rect.top - 16;
      setGridHeight(Math.max(200, available));
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      requestAnimationFrame(() => updateGridHeight());
    }
    window.addEventListener('resize', updateGridHeight);
    return () => window.removeEventListener('resize', updateGridHeight);
  }, [updateGridHeight, isLoading]);

  const filteredForStats = warehouseId
    ? items.filter(item => item.warehouse_id == Number(warehouseId) || item.warehouse === warehouseId)
    : items;

  const stats: ItemStats = {
    totalItems: filteredForStats.length,
    totalStockValue: filteredForStats.reduce((sum, item) =>
      sum + (parseFloat(String(item.current_stock || 0)) * parseFloat(String(item.standard_cost || 0))), 0
    ),
    totalStock: filteredForStats.reduce((sum, item) =>
      sum + parseFloat(String(item.current_stock || 0)), 0
    ),
    lowStockAlerts: filteredForStats.filter(item =>
      item.reorder_level > 0 && item.current_stock <= item.reorder_level
    ).length,
    outOfStock: filteredForStats.filter(item =>
      parseFloat(String(item.current_stock || 0)) === 0
    ).length,
    categories: new Set(filteredForStats.map(item => item.category).filter(Boolean)).size,
    rawMaterials: filteredForStats.filter(item =>
      item.is_raw_material === 1 || item.is_raw_material === true
    ).length,
    finishedGoods: filteredForStats.filter(item =>
      item.is_finished_good === 1 || item.is_finished_good === true
    ).length,
  };

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
      String(item.current_stock || 0),
      String(item.standard_cost || 0),
      String(item.standard_selling_price || 0),
      String(item.reorder_level || 0),
      item.is_raw_material ? 'Yes' : 'No',
      item.is_finished_good ? 'Yes' : 'No',
      item.is_purchased ? 'Yes' : 'No',
      item.is_manufactured ? 'Yes' : 'No',
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

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event: ProgressEvent<FileReader>) => {
        try {
          const text = event.target?.result as string;
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

            const itemData: Record<string, string> = {};
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
                is_manufactured: itemData['Manufactured'] === 'Yes' || itemData['is_manufactured'] === 'true',
              });
              successCount++;
            } catch {
              errorCount++;
            }
          }

          toast.success(`${t('inventory.importComplete')}: ${successCount} ${t('inventory.items')} imported, ${errorCount} ${t('inventory.failed')}`);
          queryClient.invalidateQueries({ queryKey: ['items'] });
        } catch {
          toast.error(t('inventory.importError'));
        }
      };

      reader.readAsText(file);
    };

    input.click();
  };

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      return api.delete(`/inventory/items/${itemId}`);
    },
    onSuccess: () => {
      toast.success(t('inventory.itemDeleted'));
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || 'Failed to delete item');
    }
  });

  const handleDeleteItem = (item: InventoryItem) => {
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
      flex: 1,
    },
    {
      headerName: t('inventory.itemName'),
      field: 'item_name',
      sortable: true,
      filter: true,
      flex: 2,
    },
    {
      headerName: t('inventory.category'),
      field: 'category',
      sortable: true,
      filter: true,
      flex: 1,
    },
    {
      headerName: t('inventory.uom'),
      field: 'unit_of_measure',
      flex: 0.7,
    },
    {
      headerName: t('inventory.stock'),
      field: 'current_stock',
      sortable: true,
      filter: 'agNumberColumnFilter',
      flex: 0.8,
      valueFormatter: (params: { value: number }) => parseFloat(String(params.value || 0)).toFixed(2),
      cellClass: (params: { value: number; data: InventoryItem }) => getStockCellClass(params.value, params.data?.reorder_level),
    },
    {
      headerName: t('inventory.cost'),
      field: 'standard_cost',
      sortable: true,
      filter: 'agNumberColumnFilter',
      flex: 0.8,
      valueFormatter: (params: { value: number }) => formatCurrency(params.value || 0),
    },
    {
      headerName: t('inventory.price'),
      field: 'standard_selling_price',
      sortable: true,
      filter: 'agNumberColumnFilter',
      flex: 0.8,
      valueFormatter: (params: { value: number }) => formatCurrency(params.value || 0),
    },
    createActionColDef({
      headerName: t('inventory.actions'),
      cellRenderer: (params: { data: InventoryItem }) => (
        <DropdownMenu
          trigger={
            <button className="action-menu-trigger" title="Actions">
              <MoreVertical size={16} />
            </button>
          }
          items={[
            { label: t('common.view'), icon: <Eye size={16} />, onClick: () => setPreviewItem(params.data) },
            { label: t('inventory.edit'), icon: <Edit2 size={16} />, onClick: () => { setEditingItem(params.data); setIsModalOpen(true); } },
            { label: t('inventory.delete'), icon: <Trash2 size={16} />, onClick: () => handleDeleteItem(params.data), destructive: true },
          ]}
          align="end"
        />
      ),
    }),
  ];

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
        <StatCard icon={BarChart3} label={t('inventory.totalStock')} value={stats.totalStock.toFixed(2)} subtitle={t('inventory.aggregateQty')} />
        <StatCard icon={AlertTriangle} label={t('inventory.lowStock')} value={stats.lowStockAlerts} subtitle={t('inventory.belowReorder')} style={stats.lowStockAlerts > 0 ? { borderColor: '#f5576c' } : undefined} />
        <StatCard icon={Ban} label={t('inventory.outOfStock')} value={stats.outOfStock} subtitle={t('inventory.zeroStock')} style={stats.outOfStock > 0 ? { borderColor: '#dc3545' } : undefined} />
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
          <p>{t('inventory.noItemsMatch')} &quot;{searchTerm}&quot;</p>
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
            items={filteredItems as any[]}
            onEdit={(item: any) => {
              setEditingItem(item as unknown as InventoryItem);
              setIsModalOpen(true);
            }}
            onDelete={(item: any) => handleDeleteItem(item as unknown as InventoryItem)}
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
            <AgGridReact
              rowData={[...filteredItems] as any[]}
              columnDefs={columnDefs as any}
              defaultColDef={{
                resizable: true,
                sortable: false,
                filter: false,
              }}
              pagination={true}
              paginationPageSize={20}
              paginationPageSizeSelector={[10, 20, 50, 100]}
              rowSelection={{ mode: 'singleRow' }}
              onRowDoubleClicked={(params: { data: InventoryItem }) => setPreviewItem(params.data)}
            />
          </div>
        </div>
      )}

      {previewItem && (
        <ItemPreview
          item={previewItem as any}
          onClose={() => setPreviewItem(null)}
        />
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
            queryClient.invalidateQueries({ queryKey: ['items'] });
            handleCloseModal();
          }}
        />
      </Modal>
    </div>
  );
}
