import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Button from '../common/Button';
import FormInput from '../common/FormInput';
import { useFormValidation } from '../../hooks/useFormValidation';
import { customerSchema } from '../../schemas';
import api from '../../utils/api';
import type { Customer, CustomerFormData } from '../../utils/customerTypes';

interface CustomerFormProps {
  customer: Customer | null;
  onClose: () => void;
  onSuccess: () => void;
}

const defaultFormData: CustomerFormData = {
  customer_name: '',
  contact_person: '',
  email: '',
  phone: '',
  billing_address: '',
  shipping_address: '',
  payment_terms: '',
  payment_terms_days: 14,
  credit_limit: 0,
  opening_balance: 0,
};

export default function CustomerForm({ customer, onClose, onSuccess }: CustomerFormProps) {
  const [formData, setFormData] = useState<CustomerFormData>(defaultFormData);
  const { errors, validate, clearErrors } = useFormValidation(customerSchema);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      if (customer) {
        return api.put(`/customers/${customer.id}`, data);
      } else {
        return api.post('/customers', data);
      }
    },
    onSuccess: () => {
      toast.success(customer ? 'Customer updated successfully' : 'Customer created successfully');
      onSuccess();
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      const errorMsg = error.response?.data?.error || (customer ? 'Failed to update customer' : 'Failed to create customer');
      toast.error(errorMsg);
    }
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        customer_name: customer.customer_name || '',
        contact_person: customer.contact_person || '',
        email: customer.email || '',
        phone: customer.phone || '',
        billing_address: customer.billing_address || '',
        shipping_address: customer.shipping_address || '',
        payment_terms: customer.payment_terms || '',
        payment_terms_days: customer.payment_terms_days || 14,
        credit_limit: customer.credit_limit || 0,
        opening_balance: customer.opening_balance || 0,
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [customer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('_days') || name === 'credit_limit' || name === 'opening_balance'
        ? Number(value) || 0
        : value,
    }));

    if (errors[name as keyof typeof errors]) {
      clearErrors();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(formData)) return;
    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="customer-form">
      <div className="form-row">
        <FormInput
          label="Customer Name *"
          name="customer_name"
          value={formData.customer_name}
          onChange={handleChange}
          error={errors.customer_name}
          required
          autoFocus={!customer}
        />

        <FormInput
          label="Contact Person"
          name="contact_person"
          value={formData.contact_person || ''}
          onChange={handleChange}
        />
      </div>

      <div className="form-row">
        <FormInput
          label="Email"
          name="email"
          type="email"
          value={formData.email || ''}
          onChange={handleChange}
          error={errors.email}
        />

        <FormInput
          label="Phone *"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          error={errors.phone}
          required
        />
      </div>

      <div className="form-row">
        <FormInput
          label="Payment Terms (days)"
          name="payment_terms_days"
          type="number"
          value={formData.payment_terms_days}
          onChange={handleChange}
          min="0"
          step="1"
        />

        <FormInput
          label="Credit Limit ($)"
          name="credit_limit"
          type="number"
          value={formData.credit_limit}
          onChange={handleChange}
          min="0"
          step="0.01"
        />
      </div>

      <FormInput
        label="Billing Address"
        name="billing_address"
        type="textarea"
        value={formData.billing_address || ''}
        onChange={handleChange}
        rows={3}
      />

      <FormInput
        label="Shipping Address"
        name="shipping_address"
        type="textarea"
        value={formData.shipping_address || ''}
        onChange={handleChange}
        rows={3}
      />

      {customer && (
        <FormInput
          label="Opening Balance ($)"
          name="opening_balance"
          type="number"
          value={formData.opening_balance}
          onChange={handleChange}
          min="0"
          step="0.01"
          help="Only for creating a new customer. Existing customers will have their balance adjusted through transactions."
        />
      )}

      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={mutation.isPending}>
          {customer ? 'Update' : 'Create'} Customer
        </Button>
      </div>
    </form>
  );
}
