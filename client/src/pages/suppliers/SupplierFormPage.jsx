import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import Button from '../../components/common/Button';
import FormInput from '../../components/common/FormInput';
import './SuppliersPage.css';

export default function SupplierFormPage({ mode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = mode === 'edit' && id;

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

  // Fetch next supplier code for new suppliers
  const { isLoading: isLoadingCode } = useQuery({
    queryKey: ['supplierNextCode'],
    queryFn: async () => {
      const response = await api.get('/suppliers/next-code');
      return response.data.data.code;
    },
    enabled: !isEditMode,
    onSuccess: (code) => {
      setFormData(prev => ({ ...prev, supplier_code: code }));
    }
  });

  // Fetch supplier data if editing
  const { isLoading: isLoadingSupplier } = useQuery({
    queryKey: ['supplier', id],
    queryFn: async () => {
      const response = await api.get(`/suppliers/${id}`);
      return response.data.data;
    },
    enabled: isEditMode,
    onSuccess: (data) => {
      setFormData({
        supplier_code: data.supplier_code,
        supplier_name: data.supplier_name,
        contact_person: data.contact_person || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        payment_terms: data.payment_terms || 'Net 30',
        is_active: data.is_active
      });
    }
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isEditMode) {
        return api.put(`/suppliers/${id}`, data);
      } else {
        return api.post('/suppliers', data);
      }
    },
    onSuccess: () => {
      toast.success(isEditMode ? 'Supplier updated successfully' : 'Supplier created successfully');
      queryClient.invalidateQueries(['suppliers']);
      navigate('/suppliers');
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.error || (isEditMode ? 'Failed to update supplier' : 'Failed to create supplier');
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

  const handleCancel = () => {
    navigate('/suppliers');
  };

  if (isLoadingCode || isLoadingSupplier) {
    return (
      <div className="suppliers-page">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="suppliers-page">
      <div className="page-header">
        <div>
          <h1>{isEditMode ? 'Edit Supplier' : 'Create Supplier'}</h1>
          <p className="page-subtitle">
            {isEditMode ? 'Update supplier information' : 'Add a new supplier to your database'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="supplier-form-page">
        <div className="form-section">
          <h3>Basic Information</h3>

          <div className="form-row">
            <FormInput
              label="Supplier Code *"
              name="supplier_code"
              value={formData.supplier_code}
              onChange={handleChange}
              error={errors.supplier_code}
              required
              autoFocus={!isEditMode}
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
        </div>

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={mutation.isPending}>
            {isEditMode ? 'Update' : 'Create'} Supplier
          </Button>
        </div>
      </form>
    </div>
  );
}
