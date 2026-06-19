import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Button from '../../components/common/Button';
import FormInput from '../../components/common/FormInput';
import { useFormValidation } from '../../hooks/useFormValidation';
import { supplierSchema } from '../../schemas';
import api from '../../utils/api';
import type { Supplier, SupplierFormData } from '../../utils/supplierTypes';
import './SuppliersPage.css';

interface SupplierFormPageProps {
  mode?: string;
}

export default function SupplierFormPage({ mode }: SupplierFormPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = mode === 'edit' && !!id;

  const [formData, setFormData] = useState<SupplierFormData>({
    supplier_code: '',
    supplier_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    payment_terms: 'Net 30',
    is_active: 1
  });

  const { errors, validate, clearErrors } = useFormValidation(supplierSchema);

  const { data: nextCode, isLoading: isLoadingCode } = useQuery<string>({
    queryKey: ['supplierNextCode'],
    queryFn: async () => {
      const response = await api.get('/suppliers/next-code');
      return response.data.data.code as string;
    },
    enabled: !isEditMode,
  });

  useEffect(() => {
    if (nextCode && !isEditMode) {
      setFormData(prev => ({ ...prev, supplier_code: nextCode }));
    }
  }, [nextCode, isEditMode]);

  const { data: supplierData, isLoading: isLoadingSupplier } = useQuery<Supplier>({
    queryKey: ['supplier', id],
    queryFn: async () => {
      const response = await api.get(`/suppliers/${id}`);
      return response.data.data as Supplier;
    },
    enabled: isEditMode,
  });

  useEffect(() => {
    if (supplierData && isEditMode) {
      setFormData({
        supplier_code: supplierData.supplier_code,
        supplier_name: supplierData.supplier_name,
        contact_person: supplierData.contact_person || '',
        email: supplierData.email || '',
        phone: supplierData.phone || '',
        address: supplierData.address || '',
        payment_terms: supplierData.payment_terms || 'Net 30',
        is_active: supplierData.is_active ?? 1
      });
    }
  }, [supplierData, isEditMode]);

  const mutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      if (isEditMode) {
        return api.put(`/suppliers/${id}`, data);
      } else {
        return api.post('/suppliers', data);
      }
    },
    onSuccess: () => {
      toast.success(isEditMode ? 'Supplier updated successfully' : 'Supplier created successfully');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      navigate('/suppliers');
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      const errorMsg = error.response?.data?.error || (isEditMode ? 'Failed to update supplier' : 'Failed to create supplier');
      toast.error(errorMsg);
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));

    if (errors[name as keyof typeof errors]) {
      clearErrors();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate(formData)) return;

    mutation.mutate(formData as unknown as Record<string, unknown>);
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
              readOnly={!isEditMode}
              autoFocus={!isEditMode}
              helpText={!isEditMode ? "Auto-generated" : "Unique identifier for the supplier"}
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
