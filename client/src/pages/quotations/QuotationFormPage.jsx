import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, User, Package, Plus, Check, Trash2, Hash, Send, Eye, ArrowLeft, Edit2, Printer } from 'lucide-react';
import toast from 'react-hot-toast';

import Button from '../../components/common/Button';
import FormInput from '../../components/common/FormInput';
import { useSettings } from '../../context/SettingsContext';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import api from '../../utils/api';
import { salesApi } from '../../utils/salesApi';

import './QuotationFormPage.css';
import './QuotationViewPage.css';
import '../../components/invoice/InvoiceTemplate.css';
import '../sales/SalesInvoicePage.css';

const padItemsToMinimum = (items, min = 10) => {
  if (items.length >= min) return items;
  const padded = [...items];
  const now = Date.now();
  for (let i = items.length; i < min; i++) {
    padded.push({
      id: now + i + 1000,
      item_id: '',
      description: '',
      quantity: 1,
      rate: 0,
      tax: 0,
      discount: 0,
      discountType: 'flat'
    });
  }
  return padded;
};

export default function QuotationFormPage({ mode = 'create' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { formatCurrency, getCurrencySymbol } = useSettings();
  const { isMobile } = useMobileDetection();
  const isDesktop = !isMobile;
  const isViewMode = mode === 'view' && id;
  const isEditMode = mode === 'edit' && id;

  const [customer, setCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [status, setStatus] = useState('Draft');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('Valid for 30 days.');
  const [warehouseId, setWarehouseId] = useState('');
  const [items, setItems] = useState(() =>
    Array.from({ length: 10 }, (_, i) => ({
      id: Date.now() + i,
      item_id: '',
      description: '',
      quantity: 1,
      rate: 0,
      tax: 0,
      discount: 0,
      discountType: 'flat'
    }))
  );
  
  const [currentStep, setCurrentStep] = useState(1);
  const [editingItem, setEditingItem] = useState(null);
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [activeItemId, setActiveItemId] = useState(null);
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [selectedDropdownIndex, setSelectedDropdownIndex] = useState(0);
  const [filteredItems, setFilteredItems] = useState([]);
  const [editingCell, setEditingCell] = useState(null);
  
  // Focus the cell when editingCell changes
  useEffect(() => {
    if (editingCell) {
      const el = document.querySelector(`[data-cell-id="${editingCell}"]`);
      if (el) {
        el.focus();
        if (el.type === 'number') {
          el.select();
        }
      }
    }
  }, [editingCell]);
  const lastFocusedCellRef = useRef(null);

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await api.get('/customers');
      return Array.isArray(response.data.data) ? response.data.data : [];
    }
  });

  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const response = await api.get('/inventory/items');
      return response.data.data || [];
    }
  });

  const { data: settings = {} } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data;
    }
  });

  const company = {
    name: settings.company_name?.value || 'Mini ERP',
    email: settings.company_email?.value || 'support@minierp.com',
    phone: settings.company_phone?.value || '+1 123 456 7890',
    address: settings.company_address?.value || '456 Enterprise Ave, BC 12345',
  };

  useEffect(() => {
    if (id) {
      const fetchQuotation = async () => {
        try {
          const response = await salesApi.getQuotation(id);
          const data = response.data || response;
          
          setCustomer({
            id: data.customer_id,
            customer_name: data.customer_name,
            email: data.customer_email,
            phone: data.customer_phone,
            billing_address: data.customer_address
          });
          setQuotationDate(data.quotation_date?.split('T')[0] || new Date().toISOString().split('T')[0]);
          setExpiryDate(data.expiry_date?.split('T')[0] || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
          setStatus(data.status || 'Draft');
          setNotes(data.notes || '');
          setTerms(data.terms || '');
          
          if (data.items) {
            setItems(padItemsToMinimum(data.items.map((item, index) => ({
              id: index + 1,
              item_id: item.item_id,
              description: item.description || item.item_name,
              quantity: item.quantity,
              rate: item.unit_price,
              tax: item.tax_rate || 0,
              discount: item.discount_value || 0,
              discountType: item.discount_type || 'flat'
            }))));
          }
        } catch (error) {
          toast.error('Failed to load quotation');
          navigate('/quotations');
        }
      };
      fetchQuotation();
    }
  }, [id, navigate]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (id) {
        return salesApi.updateQuotation(id, data);
      } else {
        return salesApi.createQuotation(data);
      }
    },
    onSuccess: () => {
      toast.success(`Quotation ${id ? 'updated' : 'created'} successfully`);
      queryClient.invalidateQueries(['quotations']);
      navigate('/quotations');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || `Failed to ${id ? 'update' : 'create'} quotation`);
    }
  });

  const handleSelectCustomer = (selectedCustomer) => {
    setCustomer(selectedCustomer);
    setCustomerSearch('');
  };

  const handleAddItem = (item) => {
    const newItem = {
      id: Date.now(),
      item_id: item.id,
      description: item.item_name,
      quantity: 1,
      rate: item.standard_selling_price || 0,
      tax: 0,
      discount: 0,
      discountType: 'flat'
    };
    setItems([...items, newItem]);
  };

  const handleUpdateItem = (itemId, field, value) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        if (field === 'item_id') {
          const selectedItem = inventoryItems.find(i => i.id === Number(value));
          return {
            ...item,
            item_id: Number(value),
            description: selectedItem?.item_name || item.description,
            rate: selectedItem?.standard_selling_price || item.rate
          };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleSelectInventoryItem = (itemId, invItem) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          item_id: invItem.id,
          description: invItem.item_name,
          rate: invItem.standard_selling_price || 0
        };
      }
      return item;
    }));
    setShowItemDropdown(false);
  };

  const fieldOrder = ['description', 'quantity', 'rate', 'tax'];

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
    if (showItemDropdown && field === 'description') return; // Let dropdown handle keys

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

  const handleDeleteItem = (itemId) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const calculateItemDiscount = (item) => {
    const subtotal = item.quantity * item.rate;
    if (item.discountType === 'percentage') {
      return (subtotal * item.discount) / 100;
    }
    return Number(item.discount) || 0;
  };

  const calculateItemTotal = (item) => {
    const subtotal = item.quantity * item.rate;
    const discount = calculateItemDiscount(item);
    const afterDiscount = subtotal - discount;
    const taxAmount = (afterDiscount * item.tax) / 100;
    return afterDiscount + taxAmount;
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  };

  const calculateDiscount = () => {
    return items.reduce((sum, item) => sum + calculateItemDiscount(item), 0);
  };

  const calculateTax = () => {
    return items.reduce((sum, item) => {
      const subtotal = item.quantity * item.rate;
      const discount = calculateItemDiscount(item);
      const afterDiscount = subtotal - discount;
      return sum + (afterDiscount * item.tax / 100);
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount() + calculateTax();
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    
    if (!customer) {
      toast.error('Please select a customer');
      return;
    }
    
    const filledItems = items.filter(item => item.item_id || item.description);
    if (filledItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    const quotationData = {
      customer_id: customer.id,
      quotation_date: quotationDate,
      expiry_date: expiryDate,
      status,
      notes,
      terms,
      total_amount: calculateTotal(),
      items: filledItems.map(item => ({
        item_id: item.item_id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.rate,
        tax_rate: item.tax,
        discount_type: item.discountType,
        discount_value: item.discount
      }))
    };

    mutation.mutate(quotationData);
  };

  const getStatusColor = (status) => {
    const colors = {
      'Draft': 'bg-gray-100 text-gray-700',
      'Sent': 'bg-blue-100 text-blue-700',
      'Accepted': 'bg-green-100 text-green-700',
      'Rejected': 'bg-red-100 text-red-700',
      'Converted': 'bg-purple-100 text-purple-700',
      'Expired': 'bg-orange-100 text-orange-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="form-section">
            <div className="form-field">
              <label>Select Customer</label>
              <FormInput
                name="customer_name"
                type="searchable-select"
                value={customer ? customer.customer_name : ''}
                onChange={(e) => {
                  const selected = customers.find(c => c.customer_name === e.target.value);
                  if (selected) handleSelectCustomer(selected);
                }}
                options={customers.map(c => ({
                  value: c.customer_name,
                  label: `${c.customer_name}${c.customer_code ? ` (${c.customer_code})` : ''}`
                }))}
                placeholder="Search customer..."
              />
            </div>
            {customer && (
              <div className="customer-select-card selected mt-4">
                <div className="customer-info">
                  <div className="customer-icon">
                    <User size={24} />
                  </div>
                  <div className="customer-details">
                    <div className="customer-name">{customer.customer_name}</div>
                    <div className="customer-meta">{customer.email}</div>
                    <div className="customer-meta">{customer.phone}</div>
                  </div>
                </div>
              </div>
            )}
            <div className="form-grid mt-4">
              <div className="form-field">
                <label>Quotation Date</label>
                <input 
                  type="date" 
                  value={quotationDate} 
                  onChange={(e) => setQuotationDate(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>Expiry Date</label>
                <input 
                  type="date" 
                  value={expiryDate} 
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="form-section">
            <div className="flex justify-between items-center mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="font-semibold" style={{ fontWeight: 600 }}>Line Items</h3>
              <Button variant="secondary" size="sm" onClick={() => setCurrentStep(3)}>
                <Plus size={16} className="mr-1" /> Add Item
              </Button>
            </div>
            {items.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Package size={32} />
                </div>
                <div className="empty-state-title">No items added</div>
                <div className="empty-state-message">Add items to your quotation</div>
                <Button variant="primary" onClick={() => setCurrentStep(3)}>
                  Add First Item
                </Button>
              </div>
            ) : (
              <div className="space-y-3" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {items.map(item => (
                  <div key={item.id} className="customer-select-card">
                    <div className="flex justify-between items-start" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div className="font-medium" style={{ fontWeight: 500 }}>{item.description || 'Unnamed Item'}</div>
                        <div className="text-sm text-gray-500" style={{ fontSize: '14px', color: '#6b7280' }}>
                          {item.quantity} x {formatCurrency(item.rate)}
                        </div>
                      </div>
                      <div className="text-right" style={{ textAlign: 'right' }}>
                        <div className="font-semibold text-primary-600" style={{ fontWeight: 600, color: '#2563eb' }}>
                          {formatCurrency(calculateItemTotal(item))}
                        </div>
                        <button 
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-500 text-sm mt-1"
                          style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="totals-section mt-4">
                  <div className="totals-row">
                    <span>Subtotal</span>
                    <span>{formatCurrency(calculateSubtotal())}</span>
                  </div>
                  <div className="totals-row">
                    <span>Tax</span>
                    <span>{formatCurrency(calculateTax())}</span>
                  </div>
                  <div className="totals-row total">
                    <span>Total</span>
                    <span>{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 3:
        return (
          <div className="form-section">
            <div className="flex justify-between items-center mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="font-semibold" style={{ fontWeight: 600 }}>Select Item</h3>
              <button onClick={() => setCurrentStep(2)} className="text-gray-500" style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '60vh', overflowY: 'auto' }}>
              {inventoryItems.map(item => (
                <div 
                  key={item.id} 
                  className="customer-select-card flex justify-between items-center"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onClick={() => {
                    handleAddItem(item);
                    setCurrentStep(2);
                  }}
                >
                  <div>
                    <div className="font-medium" style={{ fontWeight: 500 }}>{item.item_name}</div>
                    <div className="text-sm text-gray-500" style={{ fontSize: '14px', color: '#6b7280' }}>Stock: {item.current_stock}</div>
                  </div>
                  <div className="font-semibold" style={{ fontWeight: 600 }}>
                    {formatCurrency(item.standard_selling_price)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="form-section">
            <h3 className="font-semibold mb-4" style={{ fontWeight: 600, marginBottom: '16px' }}>Review Quotation</h3>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4" style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
              <div className="text-sm text-gray-500 mb-1" style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Customer</div>
              <div className="font-medium" style={{ fontWeight: 500 }}>{customer?.customer_name}</div>
              <div className="text-sm mt-2 text-gray-500 mb-1" style={{ fontSize: '14px', marginTop: '8px', color: '#6b7280', marginBottom: '4px' }}>Dates</div>
              <div className="font-medium text-sm" style={{ fontWeight: 500, fontSize: '14px' }}>Date: {quotationDate}</div>
              <div className="font-medium text-sm" style={{ fontWeight: 500, fontSize: '14px' }}>Expiry: {expiryDate}</div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-4" style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
              <div className="text-sm text-gray-500 mb-2" style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Summary ({items.length} items)</div>
              <div className="flex justify-between text-sm mb-1" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                <span>Subtotal</span>
                <span>{formatCurrency(calculateSubtotal())}</span>
              </div>
              <div className="flex justify-between text-sm mb-1" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                <span>Discount</span>
                <span>-{formatCurrency(calculateDiscount())}</span>
              </div>
              <div className="flex justify-between text-sm mb-2" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                <span>Tax</span>
                <span>{formatCurrency(calculateTax())}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, borderTop: '1px solid #e5e7eb', paddingTop: '8px' }}>
                <span>Total</span>
                <span className="text-primary-600" style={{ color: '#2563eb' }}>{formatCurrency(calculateTotal())}</span>
              </div>
            </div>

            <div className="form-field mb-4" style={{ marginBottom: '16px' }}>
              <label>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div className="form-field mb-4" style={{ marginBottom: '16px' }}>
              <label>Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
            <div className="form-field">
              <label>Terms</label>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderMobile = () => (
    <div className="quotation-form-page">
      <div className="form-header">
        <h2>{id ? 'Edit Quotation' : 'New Quotation'}</h2>
        <button onClick={() => navigate('/quotations')} className="text-gray-500" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
          <X size={24} />
        </button>
      </div>

      {currentStep !== 3 && (
        <div className="wizard-steps">
          <button 
            className={`wizard-step ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}
            onClick={() => setCurrentStep(1)}
          >
            <div className="wizard-step-number">{currentStep > 1 ? <Check size={14} /> : '1'}</div>
            <span className="wizard-step-label">Customer</span>
          </button>
          <button 
            className={`wizard-step ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`}
            onClick={() => {
              if (customer) setCurrentStep(2);
              else toast.error('Select customer first');
            }}
          >
            <div className="wizard-step-number">{currentStep > 2 ? <Check size={14} /> : '2'}</div>
            <span className="wizard-step-label">Items</span>
          </button>
          <button 
            className={`wizard-step ${currentStep === 4 ? 'active' : ''}`}
            onClick={() => {
              if (!customer) toast.error('Select customer first');
              else if (items.length === 0) toast.error('Add items first');
              else setCurrentStep(4);
            }}
          >
            <div className="wizard-step-number">3</div>
            <span className="wizard-step-label">Review</span>
          </button>
        </div>
      )}

      <div className="form-body">
        {renderStep()}
      </div>

      <div className="form-actions">
        {currentStep === 1 && (
          <Button 
            variant="primary" 
            onClick={() => {
              if (customer) setCurrentStep(2);
              else toast.error('Please select a customer');
            }}
          >
            Next: Items
          </Button>
        )}
        {currentStep === 2 && (
          <Button 
            variant="primary" 
            onClick={() => {
              if (items.length > 0) setCurrentStep(4);
              else toast.error('Please add at least one item');
            }}
          >
            Next: Review
          </Button>
        )}
        {currentStep === 4 && (
          <Button 
            variant="primary" 
            onClick={handleSubmit}
            loading={mutation.isPending}
          >
            {id ? 'Update Quotation' : 'Create Quotation'}
          </Button>
        )}
      </div>
    </div>
  );

  const renderDesktop = () => (
    <div className="sales-invoice-page-modern">
      <div className="action-bar-modern">
        <div className="action-left">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={`status-select-modern ${getStatusColor(status)}`}
          >
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
            <option value="Converted">Converted</option>
            <option value="Expired">Expired</option>
          </select>
        </div>

        <div className="action-right">
          <Button variant="secondary" onClick={() => navigate('/quotations')}>
            Cancel
          </Button>
          {id && (
            <button
              className="action-btn-secondary"
              onClick={() => navigate(`/quotations/${id}`)}
            >
              <Eye className="action-icon" />
              <span>Preview</span>
            </button>
          )}
          <Button variant="primary" onClick={handleSubmit} loading={mutation.isPending}>
            <Send className="action-icon" />
            {id ? 'Update' : 'Create'} Quotation
          </Button>
        </div>
      </div>

      <div className="invoice-document-modern">
        <div className="invoice-header-modern">
          <div className="header-grid-modern">
            <div className="header-section">
              <h1 className="invoice-title-modern">QUOTATION</h1>
              <div className="invoice-number-modern">
                <Hash className="hash-icon" />
                <span>{id ? `QTN-${id.toString().padStart(4, '0')}` : 'NEW'}</span>
              </div>
            </div>

            <div className="header-section">
              <div className="section-label-modern">FROM</div>
              <div className="company-name-modern">{company.name}</div>
              <div className="contact-info-modern">
                <div>{company.email}</div>
                <div>{company.phone}</div>
              </div>
            </div>

            <div className="header-section">
              <div className="section-label-modern">QUOTE TO</div>
              <FormInput
                name="customer_name"
                type="searchable-select"
                value={customer ? customer.customer_name : ''}
                onChange={(e) => {
                  const selected = customers.find(c => c.customer_name === e.target.value);
                  if (selected) handleSelectCustomer(selected);
                }}
                options={customers.map(c => ({
                  value: c.customer_name,
                  label: `${c.customer_name}${c.customer_code ? ` (${c.customer_code})` : ''}`
                }))}
                placeholder="Select customer..."
                required
                small
              />
              {customer && (
                <div className="contact-info-modern mt-2" style={{ marginTop: '8px' }}>
                  <div>{customer.email}</div>
                  <div>{customer.phone}</div>
                </div>
              )}
            </div>

            <div className="header-section text-right">
              <div className="invoice-total-modern">{formatCurrency(calculateTotal())}</div>
              <div className="invoice-meta-modern">
                <div>
                  <span className="meta-label">Date: </span>
                  <input 
                    type="date" 
                    value={quotationDate} 
                    onChange={(e) => setQuotationDate(e.target.value)}
                    className="date-input-inline"
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit' }}
                  />
                </div>
                <div>
                  <span className="meta-label">Expiry: </span>
                  <input 
                    type="date" 
                    value={expiryDate} 
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="date-input-inline"
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit' }}
                  />
                </div>
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
              onClick={() => {
                const newItem = {
                  id: Date.now(),
                  item_id: '',
                  description: '',
                  quantity: 1,
                  rate: 0,
                  tax: 0,
                  discount: 0,
                  discountType: 'flat'
                };
                setItems([...items, newItem]);
              }}
              className="add-item-btn-modern"
            >
              <Plus className="action-icon" />
              Add Item
            </button>
          </div>

          <div className="items-table-container-modern">
            <table className="items-table-modern">
              <thead>
                <tr>
                  <th className="text-center serial-col">#</th>
                  <th className="text-left">Description</th>
                  <th className="text-right">Quantity</th>
                  <th className="text-right">Rate</th>
                  <th className="text-right">Tax %</th>
                  <th className="text-right">Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="text-center serial-col">{index + 1}</td>
                    <td className="invoice-item-cell">
                      <div className="searchable-cell-container">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => {
                            const searchValue = e.target.value;
                            handleUpdateItem(item.id, 'description', searchValue);
                            setItemSearchTerm(searchValue);
                            setActiveItemId(item.id);
                            const matches = inventoryItems
                              .filter(i => 
                                i.item_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
                                i.item_code?.toLowerCase().includes(searchValue.toLowerCase())
                              )
                              .slice(0, 10);
                            setFilteredItems(matches);
                            setShowItemDropdown(matches.length > 0);
                            setSelectedDropdownIndex(0);
                          }}
                          onFocus={() => {
                            setActiveItemId(item.id);
                            setEditingCell(`${item.id}-description`);
                            setItemSearchTerm(item.description);
                            const matches = inventoryItems
                              .filter(i => 
                                i.item_name?.toLowerCase().includes((item.description || '').toLowerCase()) ||
                                i.item_code?.toLowerCase().includes((item.description || '').toLowerCase())
                              )
                              .slice(0, 10);
                            setFilteredItems(matches);
                            setShowItemDropdown(matches.length > 0);
                            setSelectedDropdownIndex(0);
                          }}
                           onKeyDown={(e) => {
                            if (showItemDropdown && filteredItems.length > 0) {
                              if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                setSelectedDropdownIndex(prev => 
                                  prev < filteredItems.length - 1 ? prev + 1 : 0
                                );
                              } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                setSelectedDropdownIndex(prev => 
                                  prev > 0 ? prev - 1 : filteredItems.length - 1
                                );
                              } else if (e.key === 'Enter') {
                                e.preventDefault();
                                if (filteredItems[selectedDropdownIndex]) {
                                  handleSelectInventoryItem(item.id, filteredItems[selectedDropdownIndex]);
                                  setTimeout(() => setEditingCell(`${item.id}-quantity`), 0);
                                  setTimeout(() => {
                                    const el = document.querySelector(`[data-cell-id="${item.id}-quantity"]`);
                                    if (el) el.focus();
                                  }, 50);
                                }
                              } else if (e.key === 'Escape') {
                                e.preventDefault();
                                setShowItemDropdown(false);
                              } else if (e.key === 'Tab') {
                                e.preventDefault();
                                if (filteredItems[selectedDropdownIndex]) {
                                  handleSelectInventoryItem(item.id, filteredItems[selectedDropdownIndex]);
                                  setTimeout(() => setEditingCell(`${item.id}-quantity`), 0);
                                  setTimeout(() => {
                                    const el = document.querySelector(`[data-cell-id="${item.id}-quantity"]`);
                                    if (el) el.focus();
                                  }, 50);
                                } else {
                                  setShowItemDropdown(false);
                                  moveToCell(item.id, 'description', e.shiftKey ? 'left' : 'right');
                                }
                              } else if (e.key === 'ArrowRight') {
                                e.preventDefault();
                                setShowItemDropdown(false);
                                moveToCell(item.id, 'description', 'right');
                              } else if (e.key === 'ArrowLeft') {
                                e.preventDefault();
                                setShowItemDropdown(false);
                                moveToCell(item.id, 'description', 'left');
                              }
                            } else {
                              handleCellKeyDown(e, item.id, 'description');
                            }
                          }}
                          onBlur={() => setTimeout(() => setShowItemDropdown(false), 200)}
                          className="editable-input"
                          placeholder="Type to search items..."
                          data-cell-id={`${item.id}-description`}
                        />
                        {showItemDropdown && activeItemId === item.id && (
                          <div className="item-dropdown">
                            {filteredItems.map((invItem, index) => (
                                <div
                                  key={invItem.id}
                                  className={`item-dropdown-option ${index === selectedDropdownIndex ? 'selected' : ''}`}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleSelectInventoryItem(item.id, invItem);
                                    setTimeout(() => setEditingCell(`${item.id}-quantity`), 0);
                                    setTimeout(() => {
                                      const el = document.querySelector(`[data-cell-id="${item.id}-quantity"]`);
                                      if (el) el.focus();
                                    }, 50);
                                  }}
                                  onMouseEnter={() => setSelectedDropdownIndex(index)}
                                >
                                  <div className="item-dropdown-main">
                                    <span className="item-dropdown-name">{invItem.item_name}</span>
                                    <span className="item-dropdown-code">{invItem.item_code}</span>
                                  </div>
                                  <div className="item-dropdown-details">
                                    <span className="item-dropdown-stock">
                                      Stock: {invItem.current_stock || 0}
                                    </span>
                                    <span className="item-dropdown-price">
                                      {formatCurrency(invItem.standard_selling_price || 0)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="text-right invoice-item-cell">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(item.id, 'quantity', Number(e.target.value))}
                        onFocus={() => { setEditingCell(`${item.id}-quantity`); lastFocusedCellRef.current = `${item.id}-quantity`; }}
                        onKeyDown={(e) => handleCellKeyDown(e, item.id, 'quantity')}
                        className="editable-input text-right"
                        min="1"
                        data-cell-id={`${item.id}-quantity`}
                      />
                    </td>
                    <td className="text-right invoice-item-cell">
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => handleUpdateItem(item.id, 'rate', Number(e.target.value))}
                        onFocus={() => { setEditingCell(`${item.id}-rate`); lastFocusedCellRef.current = `${item.id}-rate`; }}
                        onKeyDown={(e) => handleCellKeyDown(e, item.id, 'rate')}
                        className="editable-input text-right"
                        min="0"
                        step="0.01"
                        data-cell-id={`${item.id}-rate`}
                      />
                    </td>
                    <td className="text-right invoice-item-cell">
                      <input
                        type="number"
                        value={item.tax}
                        onChange={(e) => handleUpdateItem(item.id, 'tax', Number(e.target.value))}
                        onFocus={() => { setEditingCell(`${item.id}-tax`); lastFocusedCellRef.current = `${item.id}-tax`; }}
                        onKeyDown={(e) => handleCellKeyDown(e, item.id, 'tax')}
                        className="editable-input text-right"
                        min="0"
                        data-cell-id={`${item.id}-tax`}
                      />
                    </td>
                    <td className="text-right amount-cell-modern">
                      {formatCurrency(calculateItemTotal(item))}
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

          <div className="invoice-footer-modern">
            <div className="invoice-notes-modern">
              <div className="notes-section">
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#4b5563' }}>Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes for the customer..."
                  rows={3}
                  style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', resize: 'vertical' }}
                />
              </div>
              <div className="notes-section" style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#4b5563' }}>Terms & Conditions</label>
                <textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="Terms and conditions..."
                  rows={3}
                  style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', resize: 'vertical' }}
                />
              </div>
            </div>

            <div className="totals-section-modern">
              <div className="totals-breakdown-modern">
                <div className="total-row-modern">
                  <span>Subtotal</span>
                  <span>{formatCurrency(calculateSubtotal())}</span>
                </div>
                <div className="total-row-modern">
                  <span>Discount</span>
                  <span>-{formatCurrency(calculateDiscount())}</span>
                </div>
                <div className="total-row-modern">
                  <span>Tax</span>
                  <span>{formatCurrency(calculateTax())}</span>
                </div>
                <div className="total-row-modern total-final">
                  <span>Total</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isViewMode) {
    return (
      <div className="quotation-view-page">
        <div className="quotation-view-toolbar no-print">
          <div className="toolbar-left">
            <h2 className="toolbar-title">Quotation {id ? `QTN-${id.toString().padStart(4, '0')}` : ''}</h2>
          </div>
          <div className="toolbar-right">
            <Button variant="secondary" onClick={() => navigate(`/quotations/${id}/edit`)}>
              <Edit2 size={18} />
              Edit
            </Button>
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer size={18} />
              Print
            </Button>
          </div>
        </div>

        <div className="quotation-view-container">
          <div className="quotation-preview-wrapper">
            <div className="invoice-template">
              <div className="invoice-template-header">
                <div className="invoice-template-brand">
                  <div className="invoice-template-logo">
                    <div className="logo-placeholder">M</div>
                  </div>
                  <div className="invoice-template-company">
                    <h1 className="company-name">{company.name}</h1>
                    <p className="company-detail">{company.email}</p>
                    <p className="company-detail">{company.phone}</p>
                    <p className="company-detail">{company.address}</p>
                  </div>
                </div>

                <div className="invoice-template-title-section">
                  <h2 className="invoice-template-title">QUOTATION</h2>
                  <p className="invoice-template-number">{id ? `QTN-${id.toString().padStart(4, '0')}` : 'NEW'}</p>
                  <span className={`invoice-template-status status-${status?.toLowerCase()}`}>
                    {status || 'Draft'}
                  </span>
                </div>
              </div>

              <div className="invoice-template-info">
                <div className="invoice-template-bill-to">
                  <p className="info-label">QUOTE TO</p>
                  <p className="customer-name">{customer?.customer_name || customer?.name || 'No Customer'}</p>
                  {customer?.email && <p className="customer-detail">{customer.email}</p>}
                  {customer?.phone && <p className="customer-detail">{customer.phone}</p>}
                  {customer?.billing_address && <p className="customer-detail">{customer.billing_address}</p>}
                </div>

                <div className="invoice-template-details">
                  <p className="info-label">QUOTATION DETAILS</p>
                  <div className="detail-row">
                    <span className="detail-label">Date:</span>
                    <span className="detail-value">{quotationDate}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Valid Until:</span>
                    <span className="detail-value">{expiryDate}</span>
                  </div>
                </div>
              </div>

              <div className="invoice-template-items">
                <table className="invoice-template-table">
                  <thead>
                    <tr>
                      <th className="item-header">Item</th>
                      <th className="qty-header">Qty</th>
                      <th className="rate-header">Rate</th>
                      <th className="amount-header">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td className="item-cell">
                          <div className="item-name">{item.description || `Item ${index + 1}`}</div>
                        </td>
                        <td className="qty-cell">{item.quantity}</td>
                        <td className="rate-cell">{formatCurrency(item.rate || 0)}</td>
                        <td className="amount-cell">{formatCurrency((item.quantity || 0) * (item.rate || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="invoice-template-totals">
                <div className="totals-grid">
                  <div className="total-row">
                    <span>Subtotal</span>
                    <span>{formatCurrency(calculateSubtotal())}</span>
                  </div>
                  {calculateDiscount() > 0 && (
                    <div className="total-row">
                      <span>Discount</span>
                      <span>-{formatCurrency(calculateDiscount())}</span>
                    </div>
                  )}
                  {calculateTax() > 0 && (
                    <div className="total-row">
                      <span>Tax</span>
                      <span>{formatCurrency(calculateTax())}</span>
                    </div>
                  )}
                  <div className="total-row grand-total">
                    <span>Total</span>
                    <span>{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              </div>

              {(notes || terms) && (
                <div className="invoice-template-footer">
                  {notes && (
                    <div className="footer-section">
                      <p className="footer-label">NOTES</p>
                      <p className="footer-text">{notes}</p>
                    </div>
                  )}
                  {terms && (
                    <div className="footer-section">
                      <p className="footer-label">TERMS & CONDITIONS</p>
                      <p className="footer-text">{terms}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {isMobile && (
          <div className="mobile-action-bar">
            <Button variant="primary" onClick={() => navigate(-1)} className="fab-button">
              <ArrowLeft size={18} />
              Back
            </Button>
          </div>
        )}
      </div>
    );
  }

  return isDesktop ? renderDesktop() : renderMobile();
}
