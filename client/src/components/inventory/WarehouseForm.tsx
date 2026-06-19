import { useState } from 'react';
import toast from 'react-hot-toast';
import { useMutation } from '@tanstack/react-query';

import Button from '../common/Button';
import FormInput from '../common/FormInput';
import { useFormValidation } from '../../hooks/useFormValidation';
import { warehouseSchema } from '../../schemas';
import api from '../../utils/api';
import type { Warehouse, WarehouseFormData } from '../../utils/warehouseTypes';

interface WarehouseFormProps {
  warehouse?: Warehouse | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function WarehouseForm({ warehouse, onClose, onSuccess }: WarehouseFormProps) {
  const isEdit = !!warehouse;
  const [formData, setFormData] = useState<WarehouseFormData>({
    warehouse_code: warehouse?.warehouse_code || '',
    warehouse_name: warehouse?.warehouse_name || '',
    location: warehouse?.location || '',
    description: warehouse?.description || ''
  });

  const { errors, validate, clearErrors } = useFormValidation(warehouseSchema);

  const mutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      if (isEdit) {
        return api.put(`/inventory/warehouses/${warehouse!.id}`, data);
      } else {
        return api.post('/inventory/warehouses', data);
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Warehouse updated!' : 'Warehouse created!');
      onSuccess();
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || 'Failed to save warehouse');
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    if (errors[e.target.name as keyof typeof errors]) {
      clearErrors();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate(formData)) return;

    mutation.mutate(formData as unknown as Record<string, unknown>);
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
