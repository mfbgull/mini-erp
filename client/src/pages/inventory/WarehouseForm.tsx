import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import './WarehouseForm.css';

interface WarehouseFormProps {
  warehouse?: {
    id: number;
    warehouse_code: string;
    warehouse_name: string;
    location?: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  warehouse_code: string;
  warehouse_name: string;
  location: string;
}

interface Errors {
  warehouse_code?: string;
  warehouse_name?: string;
}

export default function WarehouseForm({ warehouse, onClose, onSuccess }: WarehouseFormProps) {
  const isEdit = !!warehouse;
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<FormData>({
    warehouse_code: warehouse?.warehouse_code || '',
    warehouse_name: warehouse?.warehouse_name || '',
    location: warehouse?.location || ''
  });

  const [errors, setErrors] = useState<Errors>({});

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (isEdit && warehouse) {
        return api.put(`/inventory/warehouses/${warehouse.id}`, data);
      } else {
        return api.post('/inventory/warehouses', data);
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Warehouse updated!' : 'Warehouse created!');
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to save warehouse');
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when field is modified
    if (errors[name as keyof Errors]) {
      setErrors({ ...errors, [name]: undefined });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors: Errors = {};
    if (!formData.warehouse_code.trim()) newErrors.warehouse_code = 'Warehouse code is required';
    if (!formData.warehouse_name.trim()) newErrors.warehouse_name = 'Warehouse name is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    mutation.mutate(formData);
  };

  return (
    <div className="warehouse-form-overlay" onClick={onClose}>
      <div className="warehouse-form-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="warehouse-form-header">
          <div className="warehouse-form-title-section">
            <h2 className="warehouse-form-title">
              {isEdit ? 'Edit Warehouse' : 'New Warehouse'}
            </h2>
            {warehouse && (
              <span className="warehouse-form-code">{warehouse.warehouse_code}</span>
            )}
          </div>
          <button className="warehouse-form-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="warehouse-form-content">
          {/* Basic Info Section */}
          <div className="form-section-card">
            <h3 className="form-section-title">Warehouse Details</h3>
            
            <div className="form-grid">
              <div className={`form-field ${errors.warehouse_code ? 'has-error' : ''}`}>
                <label className="form-label">
                  Warehouse Code <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="warehouse_code"
                  value={formData.warehouse_code}
                  onChange={handleChange}
                  placeholder="e.g., WH-001"
                  className="form-input"
                  disabled={isEdit}
                />
                {errors.warehouse_code && <span className="error-message">{errors.warehouse_code}</span>}
              </div>

              <div className={`form-field ${errors.warehouse_name ? 'has-error' : ''}`}>
                <label className="form-label">
                  Warehouse Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="warehouse_name"
                  value={formData.warehouse_name}
                  onChange={handleChange}
                  placeholder="e.g., Main Warehouse"
                  className="form-input"
                />
                {errors.warehouse_name && <span className="error-message">{errors.warehouse_name}</span>}
              </div>

              <div className="form-field full-width">
                <label className="form-label">Location</label>
                <textarea
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Physical location or address..."
                  className="form-textarea"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button type="button" className="form-btn secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="form-btn primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : (isEdit ? 'Update Warehouse' : 'Create Warehouse')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}