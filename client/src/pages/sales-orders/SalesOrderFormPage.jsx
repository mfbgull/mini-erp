import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { X, User, Package, Plus, Check, Trash2, ChevronRight, ArrowLeft, Hash, Send, Eye } from 'lucide-react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Button from '../../components/common/Button';
import { useSettings } from '../../context/SettingsContext';
import { salesApi } from '../../utils/salesApi';
import api from '../../utils/api';
import './SalesOrderFormPage.css';
import '../sales/SalesInvoicePage.css';

const padItemsToMinimum = (items, min = 10) => {
  if (items.length >= min) return items;
  const padded = [...items];
  const now = Date.now();
  for (let i = items.length; i < min; i++) {
    padded.push({
      id: now + i + 1000,
      itemId: '',
      name: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 0,
      discountValue: 0,
      amount: 0
    });
  }
  return padded;
};

export default function SalesOrderFormPage({ mode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { formatCurrency } = useSettings();
  const isEditMode = mode === 'edit' && id;
  const isViewMode = mode === 'view' && id;

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [customer, setCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [soDate, setSoDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [status, setStatus] = useState('Draft');
  const [notes, setNotes] = useState('');
  const [warehouseId, setWarehouseId] = useState('');

  const [items, setItems] = useState(() =>
    Array.from({ length: 10 }, (_, i) => ({
      id: Date.now() + i,
      itemId: '',
      name: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 0,
      discountValue: 0,
      amount: 0
    }))
  );
  const lastFocusedCellRef = useRef(null);
  const tableContainerRef = useRef(null);
  const [editingCell, setEditingCell] = useState(null);

  // Focus the cell when editingCell changes
  useEffect(() => {
    if (editingCell) {
      const el = document.querySelector(`[data-cell-id="${editingCell}"]`);
      if (el) {
        el.focus();
        if (el.type === 'number' || el.type === 'select-one') {
          el.select?.();
        }
      }
    }
  }, [editingCell]);

  const fieldOrder = ['name', 'quantity', 'unitPrice', 'taxRate', 'discountValue'];

  const moveToCell = (itemId, currentField, direction) => {
    const currentFieldIndex = fieldOrder.indexOf(currentField);
    
    if (direction === 'right') {
      const nextFieldIndex = currentFieldIndex + 1;
      if (nextFieldIndex < fieldOrder.length) {
        setEditingCell(`${itemId}-${fieldOrder[nextFieldIndex]}`);
      }
    } else if (direction === 'left') {
      const prevFieldIndex = currentFieldIndex - 1;
      if (prevFieldIndex >= 0) {
        setEditingCell(`${itemId}-${fieldOrder[prevFieldIndex]}`);
      }
    } else if (direction === 'down') {
      const currentItemIndex = items.findIndex(item => item.id === itemId);
      if (currentItemIndex < items.length - 1) {
        setEditingCell(`${items[currentItemIndex + 1].id}-${currentField}`);
      }
    } else if (direction === 'up') {
      const currentItemIndex = items.findIndex(item => item.id === itemId);
      if (currentItemIndex > 0) {
        setEditingCell(`${items[currentItemIndex - 1].id}-${currentField}`);
      }
    }
  };

  const handleCellKeyDown = (e, itemId, field) => {
    const inputType = e.target.type;
    
    if (e.key === 'ArrowRight') {
      const atEnd = inputType === 'number' || e.target.selectionStart === e.target.value.length;
      if (atEnd) {
        e.preventDefault();
        moveToCell(itemId, field, 'right');
      }
    } else if (e.key === 'ArrowLeft') {
      const atStart = inputType === 'number' || e.target.selectionStart === 0;
      if (atStart) {
        e.preventDefault();
        moveToCell(itemId, field, 'left');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveToCell(itemId, field, 'down');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveToCell(itemId, field, 'up');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      moveToCell(itemId, field, 'down');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        moveToCell(itemId, field, 'left');
      } else {
        moveToCell(itemId, field, 'right');
      }
    }
  };

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await api.get('/customers');
      return response.data.data || [];
    }
  });

  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const response = await api.get('/inventory/items');
      return response.data.data || [];
    }
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const response = await api.get('/inventory/warehouses');
      return response.data.data || [];
    }
  });

    const filteredCustomers = customers.filter((c) =>
    c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.customer_code?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  useEffect(() => {
    if (isEditMode && id) {
      salesApi.getSalesOrder(Number(id)).then((response) => {
        const so = response.data || response;
        setCustomer(so.customer_id ? { id: so.customer_id, name: so.customer_name } : null);
        setSoDate(so.so_date || '');
        setDeliveryDate(so.delivery_date || '');
        setStatus(so.status || 'Draft');
        setNotes(so.notes || '');
        setWarehouseId(so.warehouse_id || '');
        if (so.items && so.items.length > 0) {
          setItems(padItemsToMinimum(so.items.map((item, idx) => ({
            id: item.id || `new-${idx}`,
            itemId: item.item_id,
            name: item.item_name || '',
            quantity: item.quantity || 1,
            unitPrice: item.unit_price || 0,
            taxRate: item.tax_rate || 0,
            discountValue: item.discount_value || 0,
            amount: item.amount || 0
          }))));
        }
      });
    }
  }, [isEditMode, id]);

  const createMutation = useMutation({
    mutationFn: async (data) => salesApi.createSalesOrder(data),
    onSuccess: (data) => {
      toast.success('Sales order created successfully');
      queryClient.invalidateQueries(['sales-orders']);
      navigate(`/sales-orders/${data.data.id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create sales order');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => salesApi.updateSalesOrder(Number(id), data),
    onSuccess: () => {
      toast.success('Sales order updated successfully');
      queryClient.invalidateQueries(['sales-orders']);
      navigate(`/sales-orders/${id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update sales order');
    }
  });

  const handleSelectCustomer = (customerData) => {
    setCustomer({ id: customerData.id, name: customerData.name });
    setCustomerSearch('');
  };

  const handleAddItem = (item) => {
    const newItem = {
      id: `new-${Date.now()}`,
      itemId: item.id,
      name: item.name,
      quantity: 1,
      unitPrice: item.selling_price || 0,
      taxRate: item.tax_rate || 0,
      discountValue: 0,
      amount: item.selling_price || 0
    };
    setItems([...items, newItem]);
  };

  const handleUpdateItem = (itemId, updates) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, ...updates };
        const subtotal = updated.quantity * updated.unitPrice;
        const afterDiscount = subtotal - (updated.discountValue || 0);
        updated.amount = afterDiscount + (afterDiscount * (updated.taxRate || 0) / 100);
        return updated;
      }
      return item;
    }));
  };

  const handleDeleteItem = (itemId) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const calculateSubtotal = () => items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const calculateDiscount = () => items.reduce((sum, item) => sum + (item.discountValue || 0), 0);
  const calculateTax = () => {
    return items.reduce((sum, item) => {
      const subtotal = item.quantity * item.unitPrice;
      const afterDiscount = subtotal - (item.discountValue || 0);
      return sum + (afterDiscount * (item.taxRate || 0) / 100);
    }, 0);
  };
  const calculateTotal = () => calculateSubtotal() - calculateDiscount() + calculateTax();

  const nextStep = () => setCurrentStep(Math.min(currentStep + 1, totalSteps));
  const prevStep = () => setCurrentStep(Math.max(currentStep - 1, 1));

  const handleSubmit = () => {
    if (!customer) {
      toast.error('Please select a customer');
      setCurrentStep(1);
      return;
    }
    const filledItems = items.filter(item => item.itemId || item.name);
    if (filledItems.length === 0) {
      toast.error('Please add at least one item');
      setCurrentStep(2);
      return;
    }

    const payload = {
      customer_id: customer.id,
      customer_name: customer.name,
      so_date: soDate,
      delivery_date: deliveryDate || undefined,
      status,
      notes,
      warehouse_id: warehouseId || undefined,
      items: filledItems.map(item => ({
        item_id: item.itemId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        tax_rate: item.taxRate,
        discount_value: item.discountValue,
        amount: item.amount
      }))
    };

    if (isEditMode) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const steps = [
    { number: 1, label: 'Customer', icon: User },
    { number: 2, label: 'Items', icon: Package },
    { number: 3, label: 'Add', icon: Plus },
    { number: 4, label: 'Review', icon: Check },
  ];

  const getStatusColor = (status) => {
    const colors = {
      'Draft': 'bg-gray-100 text-gray-700',
      'Confirmed': 'bg-blue-100 text-blue-700',
      'Invoiced': 'bg-yellow-100 text-yellow-700',
      'Completed': 'bg-green-100 text-green-700',
      'Cancelled': 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="miw-step-1">
            <div className="miw-section-title">Select Customer</div>
            
            <div className="miw-card">
              <div className="miw-customer-selector" style={{ position: 'relative' }}>
                <div className="miw-customer-icon">
                  <User size={20} />
                </div>
                <div className="miw-customer-details">
                  {customer ? (
                    <>
                      <div className="miw-customer-name">{customer.name}</div>
                      <div className="miw-customer-meta">Customer</div>
                    </>
                  ) : (
                    <>
                      <div className="miw-customer-name placeholder">Select a customer</div>
                      <div className="miw-customer-meta">Tap to search</div>
                    </>
                  )}
                </div>
              </div>

              {customerSearch !== '' || !customer ? (
                <div className="miw-customer-dropdown">
                  <div style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                    <input
                      type="text"
                      placeholder="Search customers..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      autoFocus
                      style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                    />
                  </div>
                  {filteredCustomers.slice(0, 10).map((c) => (
                    <div
                      key={c.id}
                      className="miw-customer-dropdown-item"
                      onClick={() => handleSelectCustomer(c)}
                    >
                      <div className="miw-customer-info">
                        <div className="miw-customer-name">{c.name}</div>
                        <div className="miw-customer-secondary">{c.email || c.phone || 'No contact'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="miw-section-title" style={{ marginTop: '24px' }}>Order Details</div>
            
            <div className="miw-card">
              <div className="miw-form-group">
                <label>SO Date</label>
                <input
                  type="date"
                  value={soDate}
                  onChange={(e) => setSoDate(e.target.value)}
                  className="miw-input"
                />
              </div>
              <div className="miw-form-group">
                <label>Delivery Date</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="miw-input"
                />
              </div>
              <div className="miw-form-group">
                <label>Warehouse</label>
                <select
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  className="miw-input"
                >
                  <option value="">Select Warehouse</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div className="miw-form-group">
                <label>Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="miw-input"
                >
                  <option value="Draft">Draft</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Invoiced">Invoiced</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="miw-step-2">
            <div className="miw-items-list-po">
              <div className="table-header-row" style={{ display: 'flex', gap: '8px', padding: '8px', fontWeight: '600', fontSize: '12px', color: '#6b7280' }}>
                <span style={{ width: '30px' }}>#</span>
                <span style={{ flex: 1 }}>Item</span>
                <span style={{ width: '80px' }}>Qty</span>
                <span style={{ width: '60px' }}></span>
              </div>
              {items.map((item, index) => (
                <div key={item.id} className="miw-item-row-po" style={{ display: 'flex', gap: '8px', padding: '8px', borderBottom: '1px solid #e5e7eb', alignItems: 'center' }}>
                  <span style={{ width: '30px', textAlign: 'center', color: '#9ca3af', fontSize: '12px' }}>{index + 1}</span>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })}
                    placeholder="Item name..."
                    style={{ flex: 1, padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  />
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleUpdateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                    style={{ width: '80px', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', textAlign: 'right' }}
                  />
                  <button onClick={() => handleDeleteItem(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="miw-wizard-actions miw-mt-24">
              <Button variant="primary" onClick={nextStep}>
                <Plus size={18} /> Add Item
              </Button>
            </div>

            {items.length > 0 && (
              <div className="miw-items-summary">
                <div className="miw-summary-row">
                  <span>Subtotal</span>
                  <span>{formatCurrency(calculateSubtotal())}</span>
                </div>
                <div className="miw-summary-row">
                  <span>Discount</span>
                  <span>-{formatCurrency(calculateDiscount())}</span>
                </div>
                <div className="miw-summary-row">
                  <span>Tax</span>
                  <span>{formatCurrency(calculateTax())}</span>
                </div>
                <div className="miw-summary-row total">
                  <span>Total</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="miw-step-3">
            <div className="miw-section-title">Add Item</div>
            <div className="miw-items-list-expanded">
              {inventoryItems.slice(0, 20).map((item) => (
                <div
                  key={item.id}
                  className="miw-item-select-row"
                  onClick={() => {
                    handleAddItem(item);
                    nextStep();
                  }}
                >
                  <div className="miw-item-select-info">
                    <div className="miw-item-select-name">{item.name}</div>
                    <div className="miw-item-select-meta">{item.sku || item.item_code}</div>
                  </div>
                  <div className="miw-item-select-price">
                    {formatCurrency(item.selling_price || 0)}
                  </div>
                  <ChevronRight size={18} />
                </div>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="miw-step-5">
            <div className="miw-section-title">Review Order</div>
            
            <div className="miw-card">
              <div className="miw-summary-card">
                <div className="miw-summary-label">Customer</div>
                <div className="miw-summary-value">{customer?.name || 'Not selected'}</div>
              </div>
              <div className="miw-summary-card">
                <div className="miw-summary-label">Date</div>
                <div className="miw-summary-value">{soDate}</div>
              </div>
              <div className="miw-summary-card">
                <div className="miw-summary-label">Delivery</div>
                <div className="miw-summary-value">{deliveryDate || 'Not set'}</div>
              </div>
              <div className="miw-summary-card">
                <div className="miw-summary-label">Status</div>
                <div className="miw-summary-value">{status}</div>
              </div>
            </div>

            <div className="miw-section-title">Items ({items.length})</div>
            <div className="miw-card">
              {items.map((item, idx) => (
                <div key={idx} className="miw-review-item">
                  <div>{item.name}</div>
                  <div>{item.quantity} × {formatCurrency(item.unitPrice)} = {formatCurrency(item.amount)}</div>
                </div>
              ))}
            </div>

            <div className="miw-totals-card">
              <div className="miw-totals-row">
                <span>Subtotal</span>
                <span>{formatCurrency(calculateSubtotal())}</span>
              </div>
              <div className="miw-totals-row">
                <span>Discount</span>
                <span>-{formatCurrency(calculateDiscount())}</span>
              </div>
              <div className="miw-totals-row">
                <span>Tax</span>
                <span>{formatCurrency(calculateTax())}</span>
              </div>
              <div className="miw-totals-row total">
                <span>Total</span>
                <span>{formatCurrency(calculateTotal())}</span>
              </div>
            </div>

            <div className="miw-section-title">Notes</div>
            <div className="miw-card">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes..."
                rows={3}
                className="miw-textarea"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`sales-order-form-page ${isDesktop ? 'desktop-layout' : ''}`}>
      {isDesktop ? (
        <div className="sales-invoice-page-modern">
          <div className="action-bar-modern">
            <div className="action-left">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`status-select-modern ${getStatusColor(status)}`}
              >
                <option value="Draft">Draft</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Invoiced">Invoiced</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div className="action-right">
              <Button variant="secondary" onClick={() => navigate('/sales-orders')}>
                Cancel
              </Button>
              {isEditMode && (
                <button
                  className="action-btn-secondary"
                  onClick={() => navigate(`/sales-orders/${id}/view`)}
                >
                  <Eye className="action-icon" />
                  <span>Preview</span>
                </button>
              )}
              <Button variant="primary" onClick={handleSubmit}>
                <Send className="action-icon" />
                {isEditMode ? 'Update' : 'Create'} Sales Order
              </Button>
            </div>
          </div>

          <div className="invoice-document-modern">
            <div className="invoice-header-modern">
              <div className="header-grid-modern">
                <div className="header-section">
                  <h1 className="invoice-title-modern">SALES ORDER</h1>
                  <div className="invoice-number-modern">
                    <Hash className="hash-icon" />
                    <span>{isEditMode ? `SO-${id}` : 'New'}</span>
                  </div>
                </div>

                <div className="header-section">
                  <div className="section-label-modern">FROM</div>
                  <div className="company-name-modern">Mini ERP</div>
                  <div className="contact-info-modern">
                    <div>Your Company</div>
                  </div>
                </div>

                <div className="header-section">
                  <div className="section-label-modern">ORDER TO</div>
                  <div style={{ position: 'relative' }}>
                    <div
                      className={`customer-select-card-modern ${customer ? 'selected' : ''}`}
                      onClick={() => setCustomerSearch('show')}
                      style={{ padding: '8px 12px', border: customer ? '2px solid #2563eb' : '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', minHeight: '60px' }}
                    >
                      <div className="customer-info" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="customer-icon" style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <User size={20} color="#6b7280" />
                        </div>
                        <div className="customer-details">
                          <div className={`customer-name ${!customer ? 'placeholder' : ''}`} style={{ fontWeight: customer ? '600' : '400', color: customer ? '#111827' : '#9ca3af' }}>
                            {customer ? customer.name : 'Select customer...'}
                          </div>
                          <div className="customer-meta" style={{ fontSize: '12px', color: '#6b7280' }}>
                            {customer ? customer.email || customer.phone || 'Selected' : 'Click to search'}
                          </div>
                        </div>
                      </div>
                    </div>
                    {customerSearch !== '' || !customer ? (
                      <div className="customer-dropdown" style={{ position: 'absolute', top: '100%', left: '0', right: '0', background: 'white', border: '1px solid #d1d5db', borderRadius: '12px', maxHeight: '280px', overflowY: 'auto', zIndex: '100', marginTop: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                        <div style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                          <input
                            type="text"
                            placeholder="Search customers..."
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            autoFocus
                            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                          />
                        </div>
                        {filteredCustomers.slice(0, 10).map((c) => (
                          <div
                            key={c.id}
                            className="customer-dropdown-item"
                            onClick={() => {
                              handleSelectCustomer(c);
                              setCustomerSearch('');
                            }}
                            style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                          >
                            <div style={{ fontWeight: '600', color: '#111827' }}>{c.name}</div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>{c.email || c.phone || 'No contact'}</div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="header-section text-right">
                  <div className="invoice-total-modern">{formatCurrency(calculateTotal())}</div>
                  <div className="invoice-meta-modern">
                    <div>
                      <span className="meta-label">Date: </span>
                      {soDate}
                    </div>
                    <div>
                      <span className="meta-label">Delivery: </span>
                      {deliveryDate || 'Not set'}
                    </div>
                    <div className="meta-label">{status}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="invoice-body-modern">
              <div className="items-header-modern">
                <div className="items-header-left">
                  <h3 className="items-title-modern">Line Items</h3>
                </div>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="add-item-btn-modern"
                >
                  <Plus className="action-icon" />
                  Add Item
                </button>
              </div>

              <div
                ref={tableContainerRef}
                className="items-table-container-modern"
                onMouseEnter={() => {
                  if (lastFocusedCellRef.current) {
                    const el = document.querySelector(`[data-cell-id="${lastFocusedCellRef.current}"]`);
                    if (el) el.focus();
                  }
                }}
              >
                <table className="items-table-modern">
                  <thead>
                    <tr>
                      <th className="text-center serial-col">#</th>
                      <th className="text-left">Item</th>
                      <th className="text-right">Quantity</th>
                      <th className="text-right">Rate</th>
                      <th className="text-right">Tax %</th>
                      <th className="text-right">Discount</th>
                      <th className="text-right">Amount</th>
                      <th className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item.id}>
                        <td className="text-center serial-col">{index + 1}</td>
                        <td className="invoice-item-cell">
                            <select
                              value={item.itemId}
                              onChange={(e) => handleUpdateItem(item.id, { 
                                itemId: e.target.value, 
                                name: inventoryItems.find(i => i.id === Number(e.target.value))?.name || '', 
                                unitPrice: inventoryItems.find(i => i.id === Number(e.target.value))?.selling_price || 0 
                              })}
                              className="editable-input"
                              data-cell-id={`${item.id}-name`}
                              onFocus={() => { lastFocusedCellRef.current = `${item.id}-name`; }}
                              onKeyDown={(e) => handleCellKeyDown(e, item.id, 'name')}
                            >
                              <option value="">Select Item</option>
                              {inventoryItems.map((i) => (
                                <option key={i.id} value={i.id}>{i.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="text-right invoice-item-cell">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                              className="editable-input text-right"
                              data-cell-id={`${item.id}-quantity`}
                              onFocus={() => { lastFocusedCellRef.current = `${item.id}-quantity`; }}
                              onKeyDown={(e) => handleCellKeyDown(e, item.id, 'quantity')}
                            />
                          </td>
                          <td className="text-right invoice-item-cell">
                            <input
                              type="number"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => handleUpdateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                              className="editable-input text-right"
                              data-cell-id={`${item.id}-unitPrice`}
                              onFocus={() => { lastFocusedCellRef.current = `${item.id}-unitPrice`; }}
                              onKeyDown={(e) => handleCellKeyDown(e, item.id, 'unitPrice')}
                            />
                          </td>
                          <td className="text-right invoice-item-cell">
                            <input
                              type="number"
                              step="0.01"
                              value={item.taxRate}
                              onChange={(e) => handleUpdateItem(item.id, { taxRate: parseFloat(e.target.value) || 0 })}
                              className="editable-input text-right"
                              data-cell-id={`${item.id}-taxRate`}
                              onFocus={() => { lastFocusedCellRef.current = `${item.id}-taxRate`; }}
                              onKeyDown={(e) => handleCellKeyDown(e, item.id, 'taxRate')}
                            />
                          </td>
                          <td className="text-right invoice-item-cell">
                            <input
                              type="number"
                              step="0.01"
                              value={item.discountValue}
                              onChange={(e) => handleUpdateItem(item.id, { discountValue: parseFloat(e.target.value) || 0 })}
                              className="editable-input text-right"
                              data-cell-id={`${item.id}-discountValue`}
                              onFocus={() => { lastFocusedCellRef.current = `${item.id}-discountValue`; }}
                              onKeyDown={(e) => handleCellKeyDown(e, item.id, 'discountValue')}
                            />
                          </td>
                          <td className="text-right amount-cell-modern">
                            {formatCurrency(item.amount)}
                          </td>
                          <td className="text-center invoice-item-cell">
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="remove-btn-modern"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="totals-section-modern">
                <div className="totals-breakdown-modern">
                  <div className="total-row-modern">
                    <span>Subtotal:</span>
                    <span className="total-value">{formatCurrency(calculateSubtotal())}</span>
                  </div>
                  <div className="total-row-modern">
                    <span>Discount:</span>
                    <span className="discount-amount">-{formatCurrency(calculateDiscount())}</span>
                  </div>
                  <div className="total-row-modern border-top">
                    <span>Tax:</span>
                    <span className="total-value">{formatCurrency(calculateTax())}</span>
                  </div>
                  <div className="total-row-modern total-final">
                    <span>Total:</span>
                    <span className="total-amount-final">{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              </div>

              <div className="invoice-footer-modern">
                <div>
                  <label className="footer-label">NOTES</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="3"
                    className="footer-textarea"
                    placeholder="Add any notes for the customer..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mobile-invoice-wizard">
          <div className="miw-header">
            <div className="miw-header-top">
              <button className="miw-close-btn" onClick={() => navigate('/sales-orders')}>
                <X size={20} />
              </button>
              <div className="miw-title">{isEditMode ? 'Edit Sales Order' : isViewMode ? 'View Sales Order' : 'New Sales Order'}</div>
              <div className="miw-header-right miw-header-spacer" />
            </div>

            {currentStep < 4 && (
              <div className="miw-progress-steps">
                {steps.map((step) => {
                  const Icon = step.icon;
                  const isActive = currentStep >= step.number;
                  const isCurrent = currentStep === step.number;

                  return (
                    <div key={step.number} className={`miw-progress-step ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}`}>
                      <div className="miw-step-number">{step.number}</div>
                      <span className="miw-step-label">{step.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="miw-content">
            {renderStep()}
          </div>

          {currentStep < 4 && (
            <div className="miw-wizard-actions">
              {currentStep > 1 && (
                <Button variant="secondary" onClick={prevStep}>Back</Button>
              )}
              {currentStep < 4 ? (
                <Button variant="primary" onClick={nextStep}>
                  Continue
                </Button>
              ) : (
                <Button variant="primary" onClick={handleSubmit}>
                  {isEditMode ? 'Update' : 'Create'} Sales Order
                </Button>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="miw-wizard-actions">
              <Button variant="secondary" onClick={prevStep}>Back</Button>
              <Button variant="primary" onClick={handleSubmit}>
                {isEditMode ? 'Update' : 'Create'} Sales Order
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
