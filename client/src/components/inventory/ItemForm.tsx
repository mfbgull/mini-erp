import { useState } from 'react';
import toast from 'react-hot-toast';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useFormValidation } from '../../hooks/useFormValidation';
import { itemSchema } from '../../schemas';
import type { InventoryItem, ItemFormData } from '../../types';
import api from '../../utils/api';
import Button from '../common/Button';
import FormInput from '../common/FormInput';

interface ItemFormProps {
  item: InventoryItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ItemForm({ item, onClose, onSuccess }: ItemFormProps) {
  const isEdit = !!item;
  const [formData, setFormData] = useState<ItemFormData>({
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
    is_manufactured: item?.is_manufactured || false,
    sale_type: item?.sale_type || 'packed',
    qty_decimal_precision: item?.qty_decimal_precision ?? 0,
    rounding_step: item?.rounding_step ?? null,
  });

  const { errors, validate, clearErrors } = useFormValidation(itemSchema);
  const queryClient = useQueryClient();

  // Units of measure: standard list + those already used by existing items.
  // Hardcoding them here made saved values like 'piece' unselectable.
  const { data: uomOptions = [] } = useQuery<string[]>({
    queryKey: ['items-uom'],
    queryFn: async () => {
      const response = await api.get('/inventory/items-uom');
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  const { data: categoryOptions = [] } = useQuery<string[]>({
    queryKey: ['items-categories'],
    queryFn: async () => {
      const response = await api.get('/inventory/items-categories');
      const rows = Array.isArray(response.data) ? response.data : [];
      return rows
        .map((row: { category?: string } | string) =>
          typeof row === 'string' ? row : row.category,
        )
        .filter((c): c is string => !!c);
    },
  });

  // Always include the item's saved value, even if it predates the current lists
  const uomChoices = Array.from(
    new Set([...(formData.unit_of_measure ? [formData.unit_of_measure] : []), ...uomOptions]),
  );

  const mutation = useMutation({
    mutationFn: async (data: ItemFormData) => {
      if (isEdit) {
        return api.put(`/inventory/items/${item!.id}`, data);
      } else {
        return api.post('/inventory/items', data);
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Item updated!' : 'Item created!');
      // A new category/UOM typed here should appear in the lists next time
      queryClient.invalidateQueries({ queryKey: ['items-categories'] });
      queryClient.invalidateQueries({ queryKey: ['items-uom'] });
      onSuccess();
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || 'Failed to save item');
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => {
      const next = { ...prev, [name]: type === 'checkbox' ? checked : value };
      // Switching to loose defaults to gram-level precision; packed resets to whole units
      if (name === 'sale_type') {
        return value === 'loose'
          ? { ...next, qty_decimal_precision: prev.qty_decimal_precision || 3 }
          : { ...next, qty_decimal_precision: 0, rounding_step: null };
      }
      if (name === 'rounding_step') {
        return { ...next, rounding_step: value === '' ? null : Number(value) };
      }
      return next;
    });

    if (errors[name as keyof typeof errors]) {
      clearErrors();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(formData)) return;
    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="item-form">
      <div className="form-row">
        <FormInput
          label="Item Code"
          name="item_code"
          value={formData.item_code}
          onChange={handleChange}
          placeholder="e.g., ITEM-001"
          required
          disabled={isEdit}
          error={errors.item_code}
        />
        <FormInput
          label="Item Name"
          name="item_name"
          value={formData.item_name}
          onChange={handleChange}
          placeholder="e.g., Mustard Seeds"
          required
          error={errors.item_name}
        />
      </div>

      <FormInput
        label="Description"
        name="description"
        type="textarea"
        value={formData.description}
        onChange={handleChange}
        placeholder="Item description..."
        rows={2}
      />

      <div className="form-row">
        <FormInput
          label="Category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          placeholder="e.g., Raw Materials"
          options={categoryOptions.map((c) => ({ value: c, label: c }))}
          helpText="Pick an existing category or type a new one"
        />
        <FormInput
          label="Unit of Measure"
          name="unit_of_measure"
          type="searchable-select"
          value={formData.unit_of_measure}
          onChange={handleChange}
          required
          options={uomChoices.map((u) => ({ value: u, label: u }))}
          placeholder="Search UOM..."
        />
      </div>

      <div className="form-row">
        <FormInput
          label="Standard Cost"
          name="standard_cost"
          type="number"
          value={formData.standard_cost}
          onChange={handleChange}
          placeholder="0.00"
        />
        <FormInput
          label="Selling Price"
          name="standard_selling_price"
          type="number"
          value={formData.standard_selling_price}
          onChange={handleChange}
          placeholder="0.00"
        />
        <FormInput
          label="Reorder Level"
          name="reorder_level"
          type="number"
          value={formData.reorder_level}
          onChange={handleChange}
          placeholder="0"
        />
      </div>

      <div className="form-row">
        <FormInput
          label="Sale Type"
          name="sale_type"
          type="select"
          value={formData.sale_type}
          onChange={handleChange}
          required
          options={[
            { value: 'packed', label: 'Packed (quantity × rate)' },
            { value: 'loose', label: 'Loose (billed by amount)' },
          ]}
          error={errors.sale_type}
        />
        {formData.sale_type === 'loose' && (
          <>
            <FormInput
              label="Qty Decimal Precision"
              name="qty_decimal_precision"
              type="number"
              value={formData.qty_decimal_precision}
              onChange={handleChange}
              placeholder="3"
              error={errors.qty_decimal_precision}
            />
            <FormInput
              label="Rounding Step"
              name="rounding_step"
              type="number"
              value={formData.rounding_step ?? ''}
              onChange={handleChange}
              placeholder="Auto (from precision)"
              error={errors.rounding_step}
            />
          </>
        )}
      </div>

      <div className="form-section">
        <h4>Item Type</h4>
        <div className="checkbox-group">
          <FormInput
            label=""
            name="is_raw_material"
            type="checkbox"
            checked={!!formData.is_raw_material}
            onChange={handleChange}
            placeholder="Raw Material"
          />
          <FormInput
            label=""
            name="is_finished_good"
            type="checkbox"
            checked={!!formData.is_finished_good}
            onChange={handleChange}
            placeholder="Finished Good"
          />
          <FormInput
            label=""
            name="is_purchased"
            type="checkbox"
            checked={!!formData.is_purchased}
            onChange={handleChange}
            placeholder="Purchased Item"
          />
          <FormInput
            label=""
            name="is_manufactured"
            type="checkbox"
            checked={!!formData.is_manufactured}
            onChange={handleChange}
            placeholder="Manufactured Item"
          />
        </div>
      </div>

      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={mutation.isPending}>
          {isEdit ? 'Update Item' : 'Create Item'}
        </Button>
      </div>
    </form>
  );
}
