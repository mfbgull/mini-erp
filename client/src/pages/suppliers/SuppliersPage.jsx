import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry } from 'ag-grid-community';
import { ClientSideRowModelModule } from 'ag-grid-community';
import { Plus, Edit2, Trash2, Eye, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import FormInput from '../../components/common/FormInput';
import './SuppliersPage.css';

// Register AG Grid modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

export default function SuppliersPage() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('active');

  const queryClient = useQueryClient();

  // Fetch suppliers
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const response = await api.get('/suppliers');
      return response.data.data || [];
    }
  });

  // Filter suppliers based on search and tab
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = searchTerm === '' ||
      supplier.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.supplier_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab = activeTab === 'all' ||
      (activeTab === 'active' && supplier.is_active === 1) ||
      (activeTab === 'inactive' && supplier.is_active === 0);

    return matchesSearch && matchesTab;
  });

  // Delete supplier mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return api.delete(`/suppliers/${id}`);
    },
    onSuccess: () => {
      toast.success('Supplier deleted successfully');
      queryClient.invalidateQueries(['suppliers']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete supplier');
    }
  });

  const handleDelete = (id, supplierName) => {
    if (window.confirm(`Are you sure you want to delete supplier "${supplierName}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleView = (supplier) => {
    navigate(`/suppliers/${supplier.id}`);
  };

  const handleEdit = (supplier) => {
    setSelectedSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedSupplier(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedSupplier(null);
  };

  const columnDefs = [
    {
      headerName: 'Supplier Code',
      field: 'supplier_code',
      filter: true,
      width: 120,
      cellRenderer: (params) => (
        <span className="supplier-code">{params.value}</span>
      )
    },
    {
      headerName: 'Supplier Name',
      field: 'supplier_name',
      filter: true,
      flex: 1,
      cellRenderer: (params) => (
        <div>
          <div className="supplier-name">{params.value}</div>
          {params.data.contact_person && (
            <div className="contact-person">{params.data.contact_person}</div>
          )}
        </div>
      )
    },
    {
      headerName: 'Contact Info',
      field: 'phone',
      filter: true,
      width: 180,
      cellRenderer: (params) => (
        <div>
          {params.value && <div>{params.value}</div>}
          {params.data.email && <div className="email">{params.data.email}</div>}
        </div>
      )
    },
    {
      headerName: 'Address',
      field: 'address',
      filter: true,
      width: 200,
      cellRenderer: (params) => {
        if (!params.value) return '-';
        return (
          <div className="address">
            {params.value.split('\n').map((line, idx) => (
              <div key={idx}>{line}</div>
            ))}
          </div>
        );
      }
    },
    {
      headerName: 'Payment Terms',
      field: 'payment_terms',
      filter: true,
      width: 120,
      valueGetter: (params) => params.data.payment_terms || 'Net 30'
    },
    {
      headerName: 'Status',
      field: 'is_active',
      filter: true,
      width: 100,
      cellRenderer: (params) => (
        <span className={`status ${params.value ? 'status-active' : 'status-inactive'}`}>
          {params.value ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      headerName: 'Actions',
      field: 'actions',
      width: 150,
      cellRenderer: (params) => (
        <div className="action-buttons">
          <button
            className="action-btn view-btn"
            onClick={() => handleView(params.data)}
            title="View Details"
          >
            <Eye size={16} />
          </button>
          <button
            className="action-btn edit-btn"
            onClick={() => handleEdit(params.data)}
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button
            className="action-btn delete-btn"
            onClick={() => handleDelete(params.data.id, params.data.supplier_name)}
            title="Delete"
            disabled={deleteMutation.isPending}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
      sortable: false,
      filter: false,
      pinned: 'right'
    }
  ];

  return (
    <div className="suppliers-page">
      <div className="page-header">
        <div>
          <h1>Suppliers</h1>
          <p className="page-subtitle">Manage supplier accounts and contact information</p>
        </div>
        <div className="header-actions">
          <Button variant="primary" onClick={handleCreate}>
            <Plus size={18} />
            Add Supplier
          </Button>
        </div>
      </div>

      <div className="page-controls">
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="tab-container">
          <button
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button
            className={`tab ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active
          </button>
          <button
            className={`tab ${activeTab === 'inactive' ? 'active' : ''}`}
            onClick={() => setActiveTab('inactive')}
          >
            Inactive
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="ag-theme-quartz" style={{ height: 600, width: '100%' }}>
          <AgGridReact
            rowData={filteredSuppliers}
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
              params.api.sizeColumnsToFit({
                defaultMinWidth: 100,
                columnLimits: []
              });
            }}
          />
        </div>
      )}

      {/* Supplier Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={selectedSupplier ? 'Edit Supplier' : 'Add Supplier'}
        size="large"
      >
        <SupplierForm
          supplier={selectedSupplier}
          onClose={handleModalClose}
          onSuccess={() => {
            queryClient.invalidateQueries(['suppliers']);
            handleModalClose();
          }}
        />
      </Modal>
    </div>
  );
}

function SupplierForm({ supplier, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    supplier_code: '',
    supplier_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    payment_terms: 'Net 30',
    is_active: 1
  });

  const [errors, setErrors] = useState({});
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const queryClient = useQueryClient();

  // Fetch next supplier code for new suppliers
  useQuery({
    queryKey: ['supplierNextCode'],
    queryFn: async () => {
      const response = await api.get('/suppliers/next-code');
      return response.data.data.code;
    },
    enabled: !supplier,
    onSuccess: (code) => {
      setFormData(prev => ({ ...prev, supplier_code: code }));
    }
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (supplier) {
        return api.put(`/suppliers/${supplier.id}`, data);
      } else {
        return api.post('/suppliers', data);
      }
    },
    onSuccess: () => {
      toast.success(supplier ? 'Supplier updated successfully' : 'Supplier created successfully');
      onSuccess();
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.error || (supplier ? 'Failed to update supplier' : 'Failed to create supplier');
      toast.error(errorMsg);
    }
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    const newErrors = {};
    if (!formData.supplier_name.trim()) newErrors.supplier_name = 'Supplier name is required';
    if (!formData.supplier_code.trim()) newErrors.supplier_code = 'Supplier code is required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="supplier-form">
      <div className="form-row">
        <FormInput
          label="Supplier Code *"
          name="supplier_code"
          value={formData.supplier_code}
          onChange={handleChange}
          error={errors.supplier_code}
          required
          autoFocus={!supplier}
          help="Unique identifier for the supplier"
        />
        <FormInput
          label="Supplier Name *"
          name="supplier_name"
          value={formData.supplier_name}
          onChange={handleChange}
          error={errors.supplier_name}
          required
        />
      </div>

      <div className="form-row">
        <FormInput
          label="Contact Person"
          name="contact_person"
          value={formData.contact_person}
          onChange={handleChange}
        />
        <FormInput
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
        />
      </div>

      <div className="form-row">
        <FormInput
          label="Phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
        />
        <FormInput
          label="Payment Terms"
          name="payment_terms"
          type="select"
          value={formData.payment_terms}
          onChange={handleChange}
          options={[
            { value: 'COD', label: 'COD (Cash on Delivery)' },
            { value: 'Net 15', label: 'Net 15 Days' },
            { value: 'Net 30', label: 'Net 30 Days' },
            { value: 'Net 45', label: 'Net 45 Days' },
            { value: 'Net 60', label: 'Net 60 Days' },
            { value: 'Net 90', label: 'Net 90 Days' }
          ]}
        />
      </div>

      <FormInput
        label="Address"
        name="address"
        type="textarea"
        value={formData.address}
        onChange={handleChange}
        rows={3}
      />

      <FormInput
        label="Status"
        name="is_active"
        type="checkbox"
        value={formData.is_active}
        onChange={handleChange}
        placeholder="Active"
      />

      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={mutation.isPending}>
          {supplier ? 'Update' : 'Create'} Supplier
        </Button>
      </div>
    </form>
  );
}
