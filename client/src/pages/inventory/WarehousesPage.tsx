import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MiniERPGrid from '../../components/common/MiniERPGrid';
import { Search, X, Factory, MoreVertical, Edit2, Trash2, Eye } from 'lucide-react';

import WarehousePreview from './WarehousePreview';
import Button from '../../components/common/Button';
import { CompactWarehouseCard } from '../../components/common/CompactWarehouseCard';
import DropdownMenu from '../../components/common/DropdownMenu';
import Modal from '../../components/common/Modal';
import WarehouseForm from '../../components/inventory/WarehouseForm';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { useTranslation } from '../../hooks/useTranslation';
import api from '../../utils/api';
import { createActionColDef } from '../../utils/agGridIntegration';
import type { Warehouse } from '../../utils/warehouseTypes';
import './WarehousesPage.css';

export default function WarehousesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [gridReady, setGridReady] = useState(false);
  const [previewWarehouse, setPreviewWarehouse] = useState<Warehouse | null>(null);
  const { isMobile } = useMobileDetection();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useKeyboardShortcut('Alt+N', () => {
    navigate('/inventory/warehouses?action=create');
  }, { context: 'warehouses', id: 'warehouses-new', label: 'New warehouse' });

  const { data: warehouses = [], isLoading } = useQuery<Warehouse[]>({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const response = await api.get('/inventory/warehouses');
      return (response.data.data || []) as Warehouse[];
    }
  });

  const filteredWarehouses = useMemo(() =>
    warehouses.filter(warehouse =>
      warehouse.warehouse_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.warehouse_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.location?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [warehouses, searchTerm]);

  const deleteMutation = useMutation({
    mutationFn: async (warehouseId: number) => {
      return api.delete(`/inventory/warehouses/${warehouseId}`);
    },
    onSuccess: () => {
      toast.success('Warehouse deleted successfully!');
      queryClient.removeQueries({ queryKey: ['warehouses'] });
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || 'Failed to delete warehouse');
    }
  });

  const handleDeleteWarehouse = (warehouse: Warehouse) => {
    if (window.confirm(`Are you sure you want to delete warehouse: ${warehouse.warehouse_name}?`)) {
      deleteMutation.mutate(warehouse.id);
    }
  };

  const handleRowClick = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setIsModalOpen(true);
  };

  const columnDefs = useMemo(() => [
    {
      headerName: 'Code',
      field: 'warehouse_code',
      sortable: true,
      filter: true,
      flex: 1
    },
    {
      headerName: 'Name',
      field: 'warehouse_name',
      sortable: true,
      filter: true,
      flex: 2
    },
    {
      headerName: 'Location',
      field: 'location',
      filter: true,
      flex: 2
    },
    createActionColDef({
      cellRenderer: (params: { data: Warehouse }) => {
        return (
          <DropdownMenu
            trigger={
              <button className="action-menu-trigger" title="Actions">
                <MoreVertical size={16} />
              </button>
            }
            items={[
              { label: 'View', icon: <Eye size={16} />, onClick: () => setPreviewWarehouse(params.data) },
              { label: 'Edit', icon: <Edit2 size={16} />, onClick: () => handleRowClick(params.data) },
              { label: 'Delete', icon: <Trash2 size={16} />, onClick: () => handleDeleteWarehouse(params.data), destructive: true },
            ]}
            align="end"
          />
        );
      }
    }),
  ], []);

  // Auto-open create modal when ?action=create is present
  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setEditingWarehouse(null);
      setIsModalOpen(true);
    }
  }, [searchParams]);

  // Defer Ag-Grid mount until after initial paint
  useEffect(() => {
    const timer = setTimeout(() => setGridReady(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const handleNew = () => {
    setEditingWarehouse(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingWarehouse(null);
  };

  return (
    <div className="items-page warehouses-page">
      <div className="page-header">
        <div>
          <h1>{t('warehouses.warehouses')}</h1>
          <p className="page-subtitle">Manage storage locations</p>
        </div>
        {!isMobile && (
          <Button variant="primary" onClick={handleNew}>
            + New Warehouse
          </Button>
        )}
      </div>

      <div className="search-section">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            className="search-input-field"
            placeholder="Search warehouses..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="search-clear-btn"
              onClick={() => setSearchTerm('')}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : filteredWarehouses.length === 0 && searchTerm ? (
        <div className="no-results">
          <Factory className="no-results-icon" size={48} />
          <h3>No warehouses found</h3>
          <p>No warehouses match "{searchTerm}"</p>
          <Button variant="secondary" onClick={() => setSearchTerm('')}>Clear Search</Button>
        </div>
      ) : isMobile ? (
        <div className="mobile-warehouses-container">
          {filteredWarehouses.map((warehouse: Warehouse) => (
            <CompactWarehouseCard
              key={warehouse.id}
              warehouse={warehouse as import('../../types').Warehouse}
              onEdit={(wh: any) => {
                setEditingWarehouse(wh as Warehouse);
                setIsModalOpen(true);
              }}
              onDelete={(wh: any) => handleDeleteWarehouse(wh as Warehouse)}
            />
          ))}
        </div>
      ) : gridReady ? (
        <MiniERPGrid
          wrapperClassName="warehouses-grid-wrapper"
          rowData={filteredWarehouses}
          columnDefs={columnDefs as any}
          defaultColDef={{ resizable: true, sortable: false, filter: false }}
          paginationPageSize={20}
          paginationPageSizeSelector={[10, 20, 50, 100]}
          onRowDoubleClicked={(params: { data: Warehouse }) => setPreviewWarehouse(params.data)}
          suppressMaxRenderedRowRestriction={true}
        />
      ) : (
        <div className="ag-grid-placeholder">
          <div className="ag-grid-skeleton">
            <div className="skeleton-header"></div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div className="skeleton-row" key={i}>
                <div className="skeleton-cell"></div>
                <div className="skeleton-cell"></div>
                <div className="skeleton-cell"></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {previewWarehouse && (
        <WarehousePreview
          warehouse={previewWarehouse}
          onClose={() => setPreviewWarehouse(null)}
          onEdit={() => {
            setPreviewWarehouse(null);
            setEditingWarehouse(previewWarehouse);
            setIsModalOpen(true);
          }}
          onDelete={() => {
            handleDeleteWarehouse(previewWarehouse);
            setPreviewWarehouse(null);
          }}
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingWarehouse ? 'Edit Warehouse' : 'New Warehouse'}
        size="small"
      >
        <WarehouseForm
          warehouse={editingWarehouse}
          onClose={handleCloseModal}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['warehouses'] });
            handleCloseModal();
          }}
        />
      </Modal>
    </div>
  );
}
