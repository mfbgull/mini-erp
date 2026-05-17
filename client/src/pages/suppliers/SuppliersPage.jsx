import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';

import Button from '../../components/common/Button';
import FormInput from '../../components/common/FormInput';
import Modal from '../../components/common/Modal';
import { SupplierCard } from '../../components/common/SupplierCard';
import { useTranslation } from '../../hooks/useTranslation';
import api from '../../utils/api';
import './SuppliersPage.css';

export default function SuppliersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const { t } = useTranslation();

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

  const handleDelete = (supplier) => {
    if (window.confirm(`Are you sure you want to delete supplier "${supplier.supplier_name}"?`)) {
      deleteMutation.mutate(supplier.id);
    }
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

  return (
    <div className="suppliers-page">
      <div className="page-header">
        <div>
          <h1>{t('suppliers.suppliers')}</h1>
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
      ) : filteredSuppliers.length === 0 ? (
        <div className="no-suppliers">
          <p>No suppliers found</p>
        </div>
      ) : (
        <div className="supplier-cards-grid">
          {filteredSuppliers.map((supplier) => (
            <SupplierCard
              key={supplier.id}
              supplier={supplier}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
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
    supplier_code: supplier?.supplier_code || '',
    supplier_name: supplier?.supplier_name || '',
    contact_person: supplier?.contact_person || '',
    email: supplier?.email || '',
    phone: supplier?.phone || '',
    address: supplier?.address || '',
    payment_terms: supplier?.payment_terms || 'Net 30',
    is_active: supplier?.is_active ?? 1
  });

  const [errors, setErrors] = useState({});
  const queryClient = useQueryClient();

  // Fetch next supplier code for new suppliers
  const { data: nextSupplierCode } = useQuery({
    queryKey: ['supplierNextCode', supplier?.id],
    queryFn: async () => {
      const response = await api.get('/suppliers/next-code');
      return response.data.data.code;
    },
    enabled: !supplier,
    staleTime: 0
  });

  // Sync fetched code to form
  useEffect(() => {
    if (!supplier && nextSupplierCode && !formData.supplier_code) {
      setFormData(prev => ({ ...prev, supplier_code: nextSupplierCode }));
    }
  }, [nextSupplierCode, supplier]);

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
          readOnly={!supplier}
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
