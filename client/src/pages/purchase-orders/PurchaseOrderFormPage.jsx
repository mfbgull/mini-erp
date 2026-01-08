import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import Button from '../../components/common/Button';
import FormInput from '../../components/common/FormInput';

export default function PurchaseOrderFormPage({ mode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { formatCurrency } = useSettings();
  const isEditMode = mode === 'edit' && id;

  const [formData, setFormData] = useState({
    supplier_id: '',
    po_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    warehouse_id: '',
    status: 'Draft',
    notes: ''
  });

  const [items, setItems] = useState([
    { id: Date.now(), item_id: '', quantity: '', unit_price: '' }
  ]);

  // Fetch suppliers
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const response = await api.get('/suppliers');
      return response.data.data || [];
    }
  });

  // Fetch items
  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const response = await api.get('/inventory/items');
      return response.data.data || [];
    }
  });

  // Fetch warehouses
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const response = await api.get('/inventory/warehouses');
      return response.data.data || [];
    }
  });

  // Load PO data if editing
  useEffect(() => {
    if (isEditMode && id) {
      api.get(`/purchase-orders/${id}`).then(response => {
        const po = response.data;
        setFormData({
          supplier_id: po.supplier_id,
          po_date: po.po_date,
          expected_delivery_date: po.expected_delivery_date || '',
          warehouse_id: po.warehouse_id || '',
          status: po.status,
          notes: po.notes || ''
        });
        if (po.items && po.items.length > 0) {
          setItems(po.items.map(item => ({
            id: item.id,
            item_id: item.item_id,
            quantity: item.quantity,
            unit_price: item.unit_price
          })));
        }
      });
    }
  }, [isEditMode, id]);

  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleItemChange = (itemId, field, value) => {
    setItems(items.map(item =>
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  const addItem = () => {
    setItems([...items, { id: Date.now(), item_id: '', quantity: '', unit_price: '' }]);
  };

  const removeItem = (itemId) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== itemId));
    }
  };

  const calculateItemTotal = (item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unit_price) || 0;
    return qty * price;
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isEditMode) {
        return api.put(`/purchase-orders/${id}`, data);
      } else {
        return api.post('/purchase-orders', data);
      }
    },
    onSuccess: () => {
      toast.success(isEditMode ? 'Purchase order updated!' : 'Purchase order created!');
      queryClient.invalidateQueries(['purchaseOrders']);
      navigate('/purchase-orders');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to save purchase order');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate
    if (!formData.supplier_id) {
      toast.error('Please select a supplier');
      return;
    }

    const validItems = items.filter(item =>
      item.item_id && item.quantity && item.unit_price
    );

    if (validItems.length === 0) {
      toast.error('Please add at least one valid item');
      return;
    }

    const data = {
      ...formData,
      supplier_id: parseInt(formData.supplier_id),
      warehouse_id: formData.warehouse_id ? parseInt(formData.warehouse_id) : null,
      items: validItems.map(item => ({
        item_id: parseInt(item.item_id),
        quantity: parseFloat(item.quantity),
        unit_price: parseFloat(item.unit_price)
      }))
    };

    mutation.mutate(data);
  };

  const totalAmount = calculateTotal();

  return (
    <div className="po-form-page">
      <div className="page-header">
        <h1>{isEditMode ? 'Edit Purchase Order' : 'Create Purchase Order'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="po-form">
        {/* Header Section */}
        <div className="form-section">
          <h3>Purchase Order Details</h3>

          <div className="form-row">
            <FormInput
              label="PO Number"
              name="po_no"
              type="text"
              value={isEditMode ? 'Auto-generated' : 'Auto-generated'}
              disabled
              className="po-number"
            />

            <FormInput
              label="Status *"
              name="status"
              type="select"
              value={formData.status}
              onChange={handleHeaderChange}
              options={[
                { value: 'Draft', label: 'Draft' },
                { value: 'Submitted', label: 'Submitted' }
              ]}
              disabled={isEditMode}
            />
          </div>

          <div className="form-row">
            <FormInput
              label="Supplier *"
              name="supplier_id"
              type="searchable-select"
              value={formData.supplier_id}
              onChange={handleHeaderChange}
              options={suppliers.map(s => ({ value: s.id, label: s.supplier_name }))}
              placeholder="Search suppliers..."
              required
            />

            <FormInput
              label="PO Date *"
              name="po_date"
              type="date"
              value={formData.po_date}
              onChange={handleHeaderChange}
              required
            />
          </div>

          <div className="form-row">
            <FormInput
              label="Expected Delivery Date"
              name="expected_delivery_date"
              type="date"
              value={formData.expected_delivery_date}
              onChange={handleHeaderChange}
            />

            <FormInput
              label="Warehouse (for receipt)"
              name="warehouse_id"
              type="searchable-select"
              value={formData.warehouse_id}
              onChange={handleHeaderChange}
              options={warehouses.map(w => ({
                value: w.id,
                label: `${w.warehouse_code} - ${w.warehouse_name}`
              }))}
              placeholder="Select warehouse..."
            />
          </div>

          <FormInput
            label="Notes"
            name="notes"
            type="textarea"
            value={formData.notes}
            onChange={handleHeaderChange}
            placeholder="Additional notes..."
            rows={3}
          />
        </div>

        {/* Line Items Section */}
        <div className="form-section">
          <div className="section-header">
            <h3>Line Items</h3>
            <Button type="button" variant="secondary" onClick={addItem}>
              + Add Item
            </Button>
          </div>

          <table className="items-table">
            <thead>
              <tr>
                <th width="30%">Item</th>
                <th width="15%">Quantity</th>
                <th width="15%">Unit Price</th>
                <th width="20%">Amount</th>
                <th width="10%">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const selectedItem = inventoryItems.find(i => i.id === parseInt(item.item_id));
                const itemTotal = calculateItemTotal(item);
                return (
                  <tr key={item.id}>
                    <td>
                      <FormInput
                        name="item_id"
                        type="searchable-select"
                        value={item.item_id}
                        onChange={(e) => handleItemChange(item.id, 'item_id', e.target.value)}
                        options={inventoryItems.map(i => ({
                          value: i.id,
                          label: `${i.item_code} - ${i.item_name}`
                        }))}
                        placeholder="Select item..."
                        required
                      />
                    </td>
                    <td>
                      <FormInput
                        name="quantity"
                        type="number"
                        step="0.001"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                        placeholder="0.000"
                        required
                      />
                    </td>
                    <td>
                      <FormInput
                        name="unit_price"
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(item.id, 'unit_price', e.target.value)}
                        placeholder="0.00"
                        required
                      />
                    </td>
                    <td className="amount-cell">
                      {formatCurrency(itemTotal)}
                    </td>
                    <td className="actions-cell">
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="form-section totals-section">
          <div className="totals">
            <div className="total-row">
              <span>Total:</span>
              <strong>{formatCurrency(totalAmount)}</strong>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={() => navigate('/purchase-orders')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={mutation.isPending}>
            {formData.status === 'Draft' ? 'Save Draft' : 'Submit'}
          </Button>
        </div>
      </form>
    </div>
  );
}
