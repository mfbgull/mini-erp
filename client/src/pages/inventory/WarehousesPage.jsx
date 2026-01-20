import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import toast from 'react-hot-toast';
import { AgGridReact } from 'ag-grid-react';
import { Search, X } from 'lucide-react';
import api from '../../utils/api';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import FormInput from '../../components/common/FormInput';
import BorderAccentWarehouseCard from '../../components/common/BorderAccentWarehouseCard';
import './WarehousesPage.css';

export default function WarehousesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDetailsWarehouse, setOpenDetailsWarehouse] = useState(null);
  const { isMobile } = useMobileDetection();
  const queryClient = useQueryClient();

  const { data: warehouses = [], isLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const response = await api.get('/inventory/warehouses');
      return response.data.data;
    }
  });

  const filteredWarehouses = warehouses.filter(warehouse =>
    warehouse.warehouse_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warehouse.warehouse_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warehouse.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columnDefs = [
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
    }
  ];

  const handleRowClick = (warehouse) => {
    setEditingWarehouse(warehouse);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setEditingWarehouse(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingWarehouse(null);
  };

  const deleteMutation = useMutation({
    mutationFn: async (warehouseId) => {
      return api.delete(`/inventory/warehouses/${warehouseId}`);
    },
    onSuccess: () => {
      toast.success('Warehouse deleted successfully!');
      queryClient.invalidateQueries(['warehouses']);
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

  return (
    <div className="items-page warehouses-page">
      <div className="page-header">
        <div>
          <h1>Warehouses</h1>
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
          <div className="no-results-icon">🔍</div>
          <h3>No warehouses found</h3>
          <p>No warehouses match "{searchTerm}"</p>
          <Button variant="secondary" onClick={() => setSearchTerm('')}>Clear Search</Button>
        </div>
      ) : isMobile ? (
        <>
          <div className="mobile-warehouses-container">
            {filteredWarehouses.map((warehouse) => (
              <BorderAccentWarehouseCard
                key={warehouse.id}
                warehouse={warehouse}
                showDetails={openDetailsWarehouse?.id === warehouse.id}
                onDetailsChange={(show) => setOpenDetailsWarehouse(show ? warehouse : null)}
                onEdit={(warehouse) => {
                  setEditingWarehouse(warehouse);
                  setIsModalOpen(true);
                }}
                onDelete={handleDeleteWarehouse}
              />
            ))}
          </div>
          {openDetailsWarehouse === null && (
          <div className="mobile-action-bar">
            <Button variant="primary" onClick={handleNew}>
              + New Warehouse
            </Button>
          </div>
          )}
        </>
      ) : (
        <div className="ag-theme-quartz" style={{ height: 600, width: '100%' }}>
          <AgGridReact
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
            onRowClicked={(params) => handleRowClick(params.data)}
            rowSelection={{ mode: 'singleRow' }}
          />
        </div>
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
  };

  const handleSubmit = (e) => {
    e.preventDefault();
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
