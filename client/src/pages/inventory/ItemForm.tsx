import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import './ItemForm.css';

interface ItemFormProps {
  item?: {
    id: number;
    item_code: string;
    item_name: string;
    description?: string;
    category?: string;
    unit_of_measure: string;
    reorder_level?: number;
    standard_cost?: number;
    standard_selling_price?: number;
    is_raw_material?: boolean;
    is_finished_good?: boolean;
    is_purchased?: boolean;
    is_manufactured?: boolean;
  };
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  item_code: string;
  item_name: string;
  description: string;
  category: string;
  unit_of_measure: string;
  reorder_level: number;
  standard_cost: number;
  standard_selling_price: number;
  is_raw_material: boolean;
  is_finished_good: boolean;
  is_purchased: boolean;
  is_manufactured: boolean;
}

interface Errors {
  item_code?: string;
  item_name?: string;
  unit_of_measure?: string;
}

const UOM_LABELS: Record<string, string> = {
  'Nos': 'Nos (Pieces)',
  'Kg': 'Kg (Kilogram)',
  'Ltr': 'Ltr (Liter)',
  'Box': 'Box',
  'Pack': 'Pack',
  'Bottle': 'Bottle',
  'Meter': 'Meter (Mtr)',
  'Roll': 'Roll',
  'Set': 'Set',
  'Pcs': 'Pieces (Pcs)',
  'Dozen': 'Dozen'
};

export default function ItemForm({ item, onClose, onSuccess }: ItemFormProps) {
  const isEdit = !!item;
  const queryClient = useQueryClient();

  const { data: unitsOfMeasure = [] } = useQuery({
    queryKey: ['units-of-measure'],
    queryFn: async () => {
      const response = await api.get('/inventory/items-uom');
      return response.data as string[];
    }
  });
  
  const [formData, setFormData] = useState<FormData>({
    item_code: item?.item_code || '',
    item_name: item?.item_name || '',
    description: item?.description || '',
    category: item?.category || '',
    unit_of_measure: item?.unit_of_measure || 'Nos',
    reorder_level: item?.reorder_level || 0,
    standard_cost: item?.standard_cost || 0,
    standard_selling_price: item?.standard_selling_price || 0,
    is_raw_material: item?.is_raw_material || false,
    is_finished_good: item?.is_finished_good || false,
    is_purchased: item?.is_purchased !== undefined ? item.is_purchased : true,
    is_manufactured: item?.is_manufactured || false
  });

  const [errors, setErrors] = useState<Errors>({});

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (isEdit && item) {
        return api.put(`/inventory/items/${item.id}`, data);
      } else {
        return api.post('/inventory/items', data);
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Item updated!' : 'Item created!');
      queryClient.invalidateQueries({ queryKey: ['items'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to save item');
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
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
    if (!formData.item_code.trim()) newErrors.item_code = 'Item code is required';
    if (!formData.item_name.trim()) newErrors.item_name = 'Item name is required';
    if (!formData.unit_of_measure) newErrors.unit_of_measure = 'Unit of measure is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    mutation.mutate(formData);
  };

  return (
    <div className="item-form-overlay" onClick={onClose}>
      <div className="item-form-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="item-form-header">
          <div className="item-form-title-section">
            <h2 className="item-form-title">
              {isEdit ? 'Edit Item' : 'New Item'}
            </h2>
            {item && (
              <span className="item-form-code">{item.item_code}</span>
            )}
          </div>
          <button className="item-form-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="item-form-content">
          {/* Basic Info Section */}
          <div className="form-section-card">
            <h3 className="form-section-title">Basic Information</h3>
            
            <div className="form-grid">
              <div className={`form-field ${errors.item_code ? 'has-error' : ''}`}>
                <label className="form-label">
                  Item Code <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="item_code"
                  value={formData.item_code}
                  onChange={handleChange}
                  placeholder="e.g., ITEM-001"
                  className="form-input"
                  disabled={isEdit}
                />
                {errors.item_code && <span className="error-message">{errors.item_code}</span>}
              </div>

              <div className={`form-field ${errors.item_name ? 'has-error' : ''}`}>
                <label className="form-label">
                  Item Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="item_name"
                  value={formData.item_name}
                  onChange={handleChange}
                  placeholder="e.g., Mustard Seeds"
                  className="form-input"
                />
                {errors.item_name && <span className="error-message">{errors.item_name}</span>}
              </div>

              <div className="form-field full-width">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Item description..."
                  className="form-textarea"
                  rows={2}
                />
              </div>

              <div className="form-field">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="e.g., Raw Materials"
                  className="form-input"
                  list="category-suggestions"
                />
                <datalist id="category-suggestions">
                  <option value="Raw Materials" />
                  <option value="Packaging" />
                  <option value="Finished Goods" />
                  <option value="Office Supplies" />
                  <option value="Chemicals" />
                </datalist>
              </div>

              <div className={`form-field ${errors.unit_of_measure ? 'has-error' : ''}`}>
                <label className="form-label">
                  Unit of Measure <span className="required">*</span>
                </label>
                <select
                  name="unit_of_measure"
                  value={formData.unit_of_measure}
                  onChange={handleChange}
                  className="form-select"
                >
                  {unitsOfMeasure.map(uom => (
                    <option key={uom} value={uom}>
                      {UOM_LABELS[uom] || uom}
                    </option>
                  ))}
                </select>
                {errors.unit_of_measure && <span className="error-message">{errors.unit_of_measure}</span>}
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="form-section-card">
            <h3 className="form-section-title">Pricing & Stock</h3>
            
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label">Standard Cost</label>
                <div className="input-with-prefix">
                  <span className="input-prefix">$</span>
                  <input
                    type="number"
                    name="standard_cost"
                    value={formData.standard_cost}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="form-input has-prefix"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">Selling Price</label>
                <div className="input-with-prefix">
                  <span className="input-prefix">$</span>
                  <input
                    type="number"
                    name="standard_selling_price"
                    value={formData.standard_selling_price}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="form-input has-prefix"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">Reorder Level</label>
                <input
                  type="number"
                  name="reorder_level"
                  value={formData.reorder_level}
                  onChange={handleChange}
                  placeholder="0"
                  className="form-input"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Item Type Section */}
          <div className="form-section-card">
            <h3 className="form-section-title">Item Type</h3>
            <div className="type-checkbox-grid">
              <label className="type-checkbox-item">
                <input
                  type="checkbox"
                  name="is_raw_material"
                  checked={formData.is_raw_material}
                  onChange={handleChange}
                />
                <span className="checkbox-custom raw"></span>
                <span className="checkbox-label-text">Raw Material</span>
              </label>

              <label className="type-checkbox-item">
                <input
                  type="checkbox"
                  name="is_finished_good"
                  checked={formData.is_finished_good}
                  onChange={handleChange}
                />
                <span className="checkbox-custom finished"></span>
                <span className="checkbox-label-text">Finished Good</span>
              </label>

              <label className="type-checkbox-item">
                <input
                  type="checkbox"
                  name="is_purchased"
                  checked={formData.is_purchased}
                  onChange={handleChange}
                />
                <span className="checkbox-custom purchased"></span>
                <span className="checkbox-label-text">Purchased</span>
              </label>

              <label className="type-checkbox-item">
                <input
                  type="checkbox"
                  name="is_manufactured"
                  checked={formData.is_manufactured}
                  onChange={handleChange}
                />
                <span className="checkbox-custom manufactured"></span>
                <span className="checkbox-label-text">Manufactured</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button type="button" className="form-btn secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="form-btn primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : (isEdit ? 'Update Item' : 'Create Item')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}