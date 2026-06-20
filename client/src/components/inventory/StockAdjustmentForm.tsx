import { useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Button from '../common/Button';
import FormInput from '../common/FormInput';
import { useFormValidation } from '../../hooks/useFormValidation';
import { stockMovementSchema } from '../../schemas';
import api from '../../utils/api';
import type { LineItem, Warehouse, InventoryItem, StockBalance } from '../../types';

interface StockAdjustmentFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function StockAdjustmentForm({ onClose, onSuccess }: StockAdjustmentFormProps) {
  const queryClient = useQueryClient();
  const [movementType, setMovementType] = useState('ADJUSTMENT');
  const [formData, setFormData] = useState({
    from_warehouse_id: '',
    to_warehouse_id: '',
    movement_date: new Date().toISOString().split('T')[0],
    remarks: '',
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { item_id: '', quantity: 0, available_stock: 0 },
  ]);

  const { errors, validate, clearErrors } = useFormValidation(stockMovementSchema);

  const { data: items = [] } = useQuery<InventoryItem[]>({
    queryKey: ['items'],
    queryFn: async () => {
      const response = await api.get('/inventory/items');
      return response.data.data;
    },
  });

  const { data: warehouses = [] } = useQuery<Warehouse[]>({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const response = await api.get('/inventory/warehouses');
      return response.data.data;
    },
  });

  const { data: stockBalances = [] } = useQuery<StockBalance[]>({
    queryKey: ['stock-balances'],
    queryFn: async () => {
      const response = await api.get('/inventory/stock-balances');
      return response.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (movements: Array<Record<string, unknown>>) => {
      const promises = movements.map((movement) =>
        api.post('/inventory/stock-movements', movement),
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast.success(`${lineItems.length} stock movement(s) recorded successfully!`);
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['stock-balances'] });
      onSuccess();
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || 'Failed to adjust stock');
    },
  });

  const getItemStock = (itemId: string, warehouseId: string): number => {
    if (!itemId || !warehouseId || itemId === '' || warehouseId === '') return 0;
    const parsedItemId = parseInt(itemId);
    const parsedWarehouseId = parseInt(warehouseId);
    if (isNaN(parsedItemId) || isNaN(parsedWarehouseId)) return 0;
    const stock = stockBalances.find(
      (sb) => sb.item_id === parsedItemId && sb.warehouse_id === parsedWarehouseId,
    );
    return stock?.quantity ?? 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name as keyof typeof errors]) {
      clearErrors();
    }
  };

  const handleLineItemChange = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems];
    (updated[index] as unknown as Record<string, unknown>)[field] = value;

    if (field === 'item_id') {
      const warehouseId = movementType === 'TRANSFER' ? formData.from_warehouse_id : formData.to_warehouse_id;
      updated[index].available_stock = getItemStock(String(value), warehouseId);
    }

    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { item_id: '', quantity: 0, available_stock: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate(formData)) return;

    const validItems = lineItems.filter((item) => {
      if (!item.item_id) return false;
      if (movementType === 'ADJUSTMENT') return item.quantity !== 0;
      return item.quantity > 0;
    });
    if (validItems.length === 0) {
      toast.error('Please add at least one item with quantity');
      return;
    }

    const movements: Array<Record<string, unknown>> = [];

    if (movementType === 'TRANSFER') {
      validItems.forEach((item) => {
        movements.push({
          item_id: item.item_id,
          warehouse_id: formData.from_warehouse_id,
          quantity: -Math.abs(item.quantity),
          movement_type: 'TRANSFER',
          movement_date: formData.movement_date,
          remarks: formData.remarks || 'Stock transfer',
        });
        movements.push({
          item_id: item.item_id,
          warehouse_id: formData.to_warehouse_id,
          quantity: Math.abs(item.quantity),
          movement_type: 'TRANSFER',
          movement_date: formData.movement_date,
          remarks: formData.remarks || 'Stock transfer',
        });
      });
    } else {
      validItems.forEach((item) => {
        movements.push({
          item_id: item.item_id,
          warehouse_id: formData.to_warehouse_id,
          quantity: item.quantity,
          movement_type: 'ADJUSTMENT',
          movement_date: formData.movement_date,
          remarks: formData.remarks || 'Stock adjustment',
        });
      });
    }

    mutation.mutate(movements);
  };

  const availableStockForItem = (itemId: string): number => {
    const warehouseId = movementType === 'TRANSFER' ? formData.from_warehouse_id : formData.to_warehouse_id;
    return getItemStock(itemId, warehouseId);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-row">
        <FormInput
          label="Movement Type"
          name="movement_type"
          type="select"
          value={movementType}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMovementType(e.target.value)}
          options={[
            { value: 'ADJUSTMENT', label: 'Stock Adjustment' },
            { value: 'TRANSFER', label: 'Stock Transfer' },
          ]}
          required
        />
        <FormInput
          label="Date"
          name="movement_date"
          type="date"
          value={formData.movement_date}
          onChange={handleChange}
          required
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: movementType === 'TRANSFER' ? '1fr 1fr' : '1fr',
          gap: 'var(--space-md)',
        }}
      >
        {movementType === 'TRANSFER' ? (
          <>
            <FormInput
              label="From Warehouse"
              name="from_warehouse_id"
              type="searchable-select"
              value={formData.from_warehouse_id}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                handleChange(e);
                const updated = lineItems.map((item) => ({
                  ...item,
                  available_stock: getItemStock(item.item_id, e.target.value),
                }));
                setLineItems(updated);
              }}
              options={warehouses.map((wh) => ({
                value: wh.id,
                label: `${wh.warehouse_code} - ${wh.warehouse_name}`,
              }))}
              placeholder="Select source warehouse..."
              required
            />
            <FormInput
              label="To Warehouse"
              name="to_warehouse_id"
              type="searchable-select"
              value={formData.to_warehouse_id}
              onChange={handleChange}
              options={warehouses
                .filter((wh) => wh.id !== parseInt(formData.from_warehouse_id))
                .map((wh) => ({
                  value: wh.id,
                  label: `${wh.warehouse_code} - ${wh.warehouse_name}`,
                }))}
              placeholder="Select destination warehouse..."
              required
            />
          </>
        ) : (
          <FormInput
            label="Warehouse"
            name="to_warehouse_id"
            type="searchable-select"
            value={formData.to_warehouse_id}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              handleChange(e);
              const updated = lineItems.map((item) => ({
                ...item,
                available_stock: getItemStock(item.item_id, e.target.value),
              }));
              setLineItems(updated);
            }}
            options={warehouses.map((wh) => ({
              value: wh.id,
              label: `${wh.warehouse_code} - ${wh.warehouse_name}`,
            }))}
            placeholder="Select warehouse..."
            required
          />
        )}
      </div>

      <div style={{ marginTop: 'var(--space-lg)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-md)',
          }}
        >
          <h4 style={{ margin: 0 }}>Items</h4>
          <Button type="button" variant="secondary" onClick={addLineItem}>
            + Add Row
          </Button>
        </div>

        <div className="line-items-list">
          {lineItems.map((lineItem, index) => {
            const availStock = availableStockForItem(lineItem.item_id);
            const selectedItem = items.find((i) => i.id === parseInt(lineItem.item_id));

            return (
              <div key={index} className="line-item-row">
                <span className="line-item-index">{index + 1}</span>
                <div className="line-item-fields">
                  <FormInput
                    label="Item"
                    name={`item_id_${index}`}
                    type="searchable-select"
                    value={lineItem.item_id}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      handleLineItemChange(index, 'item_id', e.target.value)
                    }
                    options={items.map((i) => ({
                      value: i.id,
                      label: `${i.item_code} - ${i.item_name}`,
                    }))}
                    placeholder="Search items..."
                    required
                  />
                  <div className="line-item-stock-qty">
                    <div className="available-stock-display">
                      <span className="stock-label">Available</span>
                      <span
                        className={`stock-value ${availStock > 0 ? 'stock-positive' : lineItem.item_id ? 'stock-zero' : ''}`}
                      >
                        {lineItem.item_id && (movementType === 'TRANSFER' ? formData.from_warehouse_id : formData.to_warehouse_id)
                          ? `${availStock} ${selectedItem?.unit_of_measure || ''}`
                          : '-'}
                      </span>
                    </div>
                    <FormInput
                      label="Quantity"
                      name={`quantity_${index}`}
                      type="number"
                      step="0.01"
                      value={lineItem.quantity}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleLineItemChange(index, 'quantity', parseFloat(e.target.value) || 0)
                      }
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="line-item-remove"
                  disabled={lineItems.length === 1}
                  title="Remove row"
                  onClick={() => removeLineItem(index)}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {movementType === 'ADJUSTMENT' && lineItems.some(li => li.item_id && li.quantity !== 0) && (
        <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-md)', background: 'var(--bg-secondary, #f8f9fa)', borderRadius: 'var(--radius-md, 8px)', border: '1px solid var(--border-color, #e2e8f0)' }}>
          <h4 style={{ margin: '0 0 var(--space-sm, 8px)', fontSize: '0.9rem', color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Financial Impact Preview</h4>
          {lineItems.map((li, idx) => {
            if (!li.item_id || li.quantity === 0) return null;
            const item = items.find(i => i.id === parseInt(li.item_id));
            if (!item) return null;
            const cost = parseFloat(String(item.standard_cost || 0));
            const value = Math.abs(li.quantity) * cost;
            const isRemoval = li.quantity < 0;
            const typeLabel = isRemoval ? 'Inventory Shrinkage (Expense)' : 'Inventory Correction (Income)';
            const typeColor = isRemoval ? '#ef4444' : '#22c55e';
            return (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-xs, 4px) 0', borderBottom: '1px solid var(--border-color, #e2e8f0)', fontSize: '0.85rem' }}>
                <div>
                  <strong>{item.item_name}</strong>
                  <span style={{ color: 'var(--text-secondary, #64748b)', marginLeft: '8px' }}>
                    {isRemoval ? '-' : '+'}{Math.abs(li.quantity)} {item.unit_of_measure || 'units'}
                    {' × '}{cost.toFixed(2)}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {cost === 0 ? (
                    <span style={{ color: '#f59e0b', fontSize: '0.8rem' }}>⚠ No standard_cost set</span>
                  ) : (
                    <>
                      <span style={{ fontWeight: 600, color: typeColor }}>{value.toFixed(2)}</span>
                      <br />
                      <span style={{ fontSize: '0.75rem', color: typeColor }}>{typeLabel}</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <FormInput
        label="Remarks"
        name="remarks"
        type="textarea"
        value={formData.remarks}
        onChange={handleChange}
        placeholder="Reason for movement..."
        rows={2}
        style={{ marginTop: 'var(--space-md)' }}
      />

      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={mutation.isPending}>
          Record {movementType === 'TRANSFER' ? 'Transfer' : 'Adjustment'}
        </Button>
      </div>
    </form>
  );
}
