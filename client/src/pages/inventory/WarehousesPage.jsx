import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AgGridReact } from 'ag-grid-react';
import { Search, X, Factory, MoreVertical, Edit2, Trash2, Eye } from 'lucide-react';

import Button from '../../components/common/Button';
import { CompactWarehouseCard } from '../../components/common/CompactWarehouseCard';
import DropdownMenu from '../../components/common/DropdownMenu';
import FormInput from '../../components/common/FormInput';
import Modal from '../../components/common/Modal';
import { useFormValidation } from '../../hooks/useFormValidation';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import WarehousePreview from './WarehousePreview';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { useTranslation } from '../../hooks/useTranslation';
import { warehouseSchema } from '../../schemas';
import api from '../../utils/api';
import './WarehousesPage.css';

export default function WarehousesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [gridReady, setGridReady] = useState(false);
  const [previewWarehouse, setPreviewWarehouse] = useState(null);
  const { isMobile } = useMobileDetection();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useKeyboardShortcut('Alt+N', () => {
    navigate('/inventory/warehouses?action=create');
  }, { context: 'warehouses', id: 'warehouses-new', label: 'New warehouse' });

  const { data: warehouses = [], isLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const response = await api.get('/inventory/warehouses');
      return response.data.data;
    }
  });

  const filteredWarehouses = useMemo(() =>
    warehouses.filter(warehouse =>
      warehouse.warehouse_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.warehouse_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.location?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [warehouses, searchTerm]);

  const deleteMutation = useMutation({
    mutationFn: async (warehouseId) => {
      return api.delete(`/inventory/warehouses/${warehouseId}`);
    },
    onSuccess: () => {
      toast.success('Warehouse deleted successfully!');
      queryClient.removeQueries(['warehouses']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete warehouse');
    }
  });

  const handleDeleteWarehouse = (warehouse) => {
    if (window.confirm(`Are you sure you want to delete warehouse: ${warehouse.warehouse_name}?`)) {
      deleteMutation.mutate(warehouse.id);
    }
  };

  const handleRowClick = (warehouse) => {
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
    {
      headerName: 'Actions',
      field: 'actions',
      width: 70,
      sortable: false,
      filter: false,
      cellRenderer: (params) => {
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
    }
  ], [deleteMutation.isPending, handleRowClick, handleDeleteWarehouse]);

  // Auto-open create modal when ?action=create is present
  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setEditingWarehouse(null);
      setIsModalOpen(true);
    }
  }, [searchParams]);

  // Defer Ag-Grid mount until after initial paint to avoid blocking interactivity
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
            onChange={(e) => setSearchTerm(e.target.value)}
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
          {filteredWarehouses.map((warehouse) => (
            <CompactWarehouseCard
              key={warehouse.id}
              warehouse={warehouse}
              onEdit={(warehouse) => {
                setEditingWarehouse(warehouse);
                setIsModalOpen(true);
              }}
              onDelete={handleDeleteWarehouse}
            />
          ))}
        </div>
      ) : gridReady ? (
        <div className="ag-theme-quartz warehouses-grid-wrapper">
          <AgGridReact theme="legacy"
            rowData={filteredWarehouses}
            columnDefs={columnDefs}
            defaultColDef={{
              resizable: true,
              sortable: false,
              filter: false
            }}
            pagination={true}
            paginationPageSize={20}
            paginationPageSizeSelector={[10, 20, 50, 100]}
            onRowDoubleClicked={(params) => setPreviewWarehouse(params.data)}
            rowSelection={{ mode: 'singleRow' }}
            suppressMaxRenderedRowRestriction={true}
          />
        </div>
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
            queryClient.invalidateQueries(['warehouses']);
            handleCloseModal();
          }}
        />
      </Modal>
    </div>
  );
}

function WarehouseForm({ warehouse, onClose, onSuccess }) {
  const isEdit = !!warehouse;
  const [formData, setFormData] = useState({
    warehouse_code: warehouse?.warehouse_code || '',
    warehouse_name: warehouse?.warehouse_name || '',
    location: warehouse?.location || '',
    description: warehouse?.description || ''
  });

  const { errors, validate, clearErrors } = useFormValidation(warehouseSchema);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isEdit) {
        return api.put(`/inventory/warehouses/${warehouse.id}`, data);
      } else {
        return api.post('/inventory/warehouses', data);
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Warehouse updated!' : 'Warehouse created!');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to save warehouse');
    }
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    // Clear error when user starts typing
    if (errors[e.target.name]) {
      clearErrors();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate(formData)) return;

    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormInput
        label="Warehouse Code"
        name="warehouse_code"
        value={formData.warehouse_code}
        onChange={handleChange}
        placeholder="e.g., WH-001"
        required
        disabled={isEdit}
      />
      <FormInput
        label="Warehouse Name"
        name="warehouse_name"
        value={formData.warehouse_name}
        onChange={handleChange}
        placeholder="e.g., Main Warehouse"
        required
      />
      <FormInput
        label="Location"
        name="location"
        value={formData.location}
        onChange={handleChange}
        placeholder="Physical location or address"
      />
      <FormInput
        label="Description"
        name="description"
        type="textarea"
        value={formData.description}
        onChange={handleChange}
        placeholder="Optional description"
        rows={3}
      />

      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={mutation.isPending}>
          {isEdit ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
