import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, User, Package, CreditCard, Calendar, Mail, Phone, MapPin, Hash, DollarSign, Percent, Search, Plus, Minus, Trash2 } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import api from '../../utils/api';
import Button from '../../components/common/Button';
import FormInput from '../../components/common/FormInput';
import toast from 'react-hot-toast';
import './MobileInvoiceEditForm.css';
import './MobileInvoice.css';

interface InvoiceItem {
  id: number;
  item_id: number;
  description: string;
  quantity: number;
  rate: number;
  tax: number;
  discount: {
    type: 'percentage' | 'flat';
    value: number;
  };
  amount?: number;
}

interface InvoiceCustomer {
  id: number;
  customer_name: string;
  email: string;
  phone: string;
  billing_address: string;
}

interface PaymentDetails {
  record_payment: boolean;
  payment_date: string;
  payment_amount: number;
  payment_method: string;
  reference_no: string;
  payment_notes: string;
}

interface InvoiceData {
  id?: number;
  invoice_no: string;
  status: string;
  invoice_date: string;
  due_date: string;
  customer_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  discount_scope: string;
  discount: {
    type: 'percentage' | 'flat';
    value: number;
  };
  items: InvoiceItem[];
  notes: string;
  terms: string;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  payment: PaymentDetails;
}

const MobileInvoiceEditForm: React.FC = () => {
  const { id: invoiceId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { formatCurrency, getCurrencySymbol } = useSettings();

  // State for sections collapse/expand
  const [sections, setSections] = useState({
    customer: false, // Collapsed by default
    items: false,    // Collapsed by default
    payment: false   // Collapsed by default
  });

  // State for item search
  const [itemSearch, setItemSearch] = useState<{[key: number]: string}>({});
  const [itemSearchResults, setItemSearchResults] = useState<any[]>([]);
  const [showItemSearchDropdown, setShowItemSearchDropdown] = useState<number | null>(null);
  const [isSearchingItems, setIsSearchingItems] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(-1);

  // State for add item sheet
  const [showAddItemSheet, setShowAddItemSheet] = useState(false);
  const [currentlyEditingItemIndex, setCurrentlyEditingItemIndex] = useState<number | null>(null);

  // State for invoice data
  const [invoice, setInvoice] = useState<Partial<InvoiceData>>({
    invoice_no: '',
    status: 'Unpaid',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    customer_id: 0,
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',
    discount_scope: 'invoice',
    discount: { type: 'flat', value: 0 },
    items: [
      {
        id: Date.now(),
        item_id: 0,
        description: '',
        quantity: 1,
        rate: 0,
        tax: 0,
        discount: { type: 'flat', value: 0 }
      }
    ],
    notes: 'Thank you for your business. Payment is due within 14 days.',
    terms: 'Net 14 days. Late payments subject to 1.5% monthly interest.',
    payment: {
      record_payment: false,
      payment_date: new Date().toISOString().split('T')[0],
      payment_amount: 0,
      payment_method: 'Cash',
      reference_no: '',
      payment_notes: ''
    }
  });

  // State for UI
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch customers
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await api.get('/customers');
      return Array.isArray(response.data.data) ? response.data.data : [];
    }
  });

  // Fetch items
  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const response = await api.get('/inventory/items');
      return response.data.data;
    }
  });

  // Fetch invoice if editing existing
  useEffect(() => {
    if (invoiceId) {
      const fetchInvoice = async () => {
        try {
          const response = await api.get(`/invoices/${invoiceId}`);
          const invoiceData = response.data;

          // Convert item data to match form structure
          const formattedItems: InvoiceItem[] = invoiceData.items?.map((item: any, index: number) => ({
            id: index + 1,
            item_id: item.item_id,
            description: item.item_name || item.description,
            quantity: item.quantity,
            rate: item.unit_price,
            tax: item.tax_rate || 0,
            discount: {
              type: item.discount_type || 'flat',
              value: item.discount_value || 0
            }
          })) || [];

          setInvoice({
            ...invoiceData,
            items: formattedItems,
            customer_id: invoiceData.customer_id,
            customer_name: invoiceData.customer_name,
            customer_email: invoiceData.customer_email,
            customer_phone: invoiceData.customer_phone,
            customer_address: invoiceData.customer_address,
            discount_scope: invoiceData.discount_scope || 'item',
            discount: {
              type: invoiceData.discount_type || 'flat',
              value: invoiceData.discount_value || 0
            },
            notes: invoiceData.notes || 'Thank you for your business. Payment is due within 14 days.',
            terms: invoiceData.terms || 'Net 14 days. Late payments subject to 1.5% monthly interest.',
            payment: {
              record_payment: false,
              payment_date: new Date().toISOString().split('T')[0],
              payment_amount: invoiceData.balance_amount || 0,
              payment_method: 'Cash',
              reference_no: '',
              payment_notes: ''
            }
          });
        } catch (error) {
          toast.error('Failed to load invoice');
          navigate('/sales');
        } finally {
          setLoading(false);
        }
      };

      fetchInvoice();
    } else {
      // Generate new invoice number
      const newInvoiceNo = `INV-${new Date().getFullYear()}-${String(Date.now() % 1000000).padStart(6, '0')}`;
      setInvoice(prev => ({
        ...prev,
        invoice_no: newInvoiceNo
      }));
      setLoading(false);
    }
  }, [invoiceId, navigate]);

  // Initialize item search state when items change
  useEffect(() => {
    if (invoice.items) {
      const initialSearchState: {[key: number]: string} = {};
      invoice.items.forEach((item, index) => {
        initialSearchState[index] = item.description;
      });
      setItemSearch(initialSearchState);
    }
  }, [invoice.items]);

  // Toggle section visibility
  const toggleSection = (section: keyof typeof sections) => {
    setSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Calculate totals
  const calculateItemDiscount = (item: InvoiceItem) => {
    const subtotal = item.quantity * item.rate;
    if (item.discount.type === 'percentage') {
      return (subtotal * item.discount.value) / 100;
    } else {
      return item.discount.value;
    }
  };

  const calculateItemTotal = (item: InvoiceItem) => {
    const subtotal = item.quantity * item.rate;
    const discount = invoice.discount_scope === 'item' ? calculateItemDiscount(item) : 0;
    const afterDiscount = subtotal - discount;
    const taxAmount = (afterDiscount * item.tax) / 100;
    return afterDiscount + taxAmount;
  };

  const calculateSubtotal = () => {
    return invoice.items?.reduce((sum, item) => sum + (item.quantity * item.rate), 0) || 0;
  };

  const calculateTax = () => {
    return invoice.items?.reduce((sum, item) => {
      const subtotal = item.quantity * item.rate;
      const discount = invoice.discount_scope === 'item' ? calculateItemDiscount(item) : 0;
      const afterDiscount = subtotal - discount;
      return sum + (afterDiscount * item.tax / 100);
    }, 0) || 0;
  };

  const calculateDiscount = () => {
    if (invoice.discount_scope === 'item') {
      return invoice.items?.reduce((sum, item) => sum + calculateItemDiscount(item), 0) || 0;
    } else {
      const subtotal = calculateSubtotal();
      if (invoice.discount?.type === 'percentage') {
        return (subtotal * (invoice.discount.value || 0)) / 100;
      } else {
        return invoice.discount?.value || 0;
      }
    }
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() - calculateDiscount();
  };

  // Update invoice data
  const updateInvoice = (field: keyof InvoiceData, value: any) => {
    setInvoice(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Update customer information
  const updateCustomer = (field: string, value: any) => {
    setInvoice(prev => ({
      ...prev,
      [`customer_${field}`]: value
    }));
  };

  // Update payment information
  const updatePayment = (field: string, value: any) => {
    setInvoice(prev => ({
      ...prev,
      payment: {
        ...(prev.payment as PaymentDetails),
        [field]: value
      }
    }));
  };

  // Add new item (this function is now just for programmatic addition)
  const addItem = () => {
    const newItemId = Date.now();
    const newItem: InvoiceItem = {
      id: newItemId,
      item_id: 0,
      description: '',
      quantity: 1,
      rate: 0,
      tax: 0,
      discount: { type: 'flat', value: 0 }
    };

    setInvoice(prev => {
      const newItems = [...(prev.items || []), newItem];
      // Initialize search state for the new item
      setItemSearch(prevSearch => ({
        ...prevSearch,
        [newItems.length - 1]: ''  // Use length - 1 to get the index of the newly added item
      }));

      return {
        ...prev,
        items: newItems
      };
    });
  };

  // Update item
  const updateItem = (id: number, field: string, value: any) => {
    setInvoice(prev => ({
      ...prev,
      items: (prev.items || []).map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  // Remove item
  const removeItem = (id: number) => {
    setInvoice(prev => {
      const updatedItems = (prev.items || []).filter(item => item.id !== id);

      // Update item search state to remove the corresponding entry and reindex
      setItemSearch(prevSearch => {
        const updatedSearch: {[key: number]: string} = {};
        updatedItems.forEach((item, index) => {
          // Find the original index of this item in the previous items array
          const originalIndex = (prev.items || []).findIndex(prevItem => prevItem.id === item.id);
          // Use the original index if it exists in prevSearch, otherwise use the new index
          updatedSearch[index] = prevSearch[originalIndex] !== undefined ?
            prevSearch[originalIndex] : item.description;
        });
        return updatedSearch;
      });

      // If we're removing the currently edited item, close the sheet
      if (showAddItemSheet && currentlyEditingItemIndex !== null) {
        const itemToRemoveIndex = (prev.items || []).findIndex(item => item.id === id);
        if (itemToRemoveIndex === currentlyEditingItemIndex) {
          setShowAddItemSheet(false);
          setCurrentlyEditingItemIndex(null);
        }
      }

      return {
        ...prev,
        items: updatedItems
      };
    });
  };

  // Search items
  const handleItemSearch = async (query: string, itemIndex: number) => {
    setItemSearch(prev => ({ ...prev, [itemIndex]: query }));

    if (query.trim().length < 2) {
      setItemSearchResults([]);
      setShowItemSearchDropdown(null);
      return;
    }

    setIsSearchingItems(true);
    try {
      // Filter items based on search query
      const filteredItems = items.filter(item =>
        item.item_name.toLowerCase().includes(query.toLowerCase()) ||
        item.item_code.toLowerCase().includes(query.toLowerCase())
      );

      setItemSearchResults(filteredItems);
      setShowItemSearchDropdown(itemIndex);
      setSelectedItemIndex(-1); // Reset selected index
    } catch (error) {
      console.error('Error searching items:', error);
    } finally {
      setIsSearchingItems(false);
    }
  };

  // Select item from search
  const handleSelectItem = (item: any, itemIndex: number) => {
    // Update the specific item in the items array
    setInvoice(prev => ({
      ...prev,
      items: (prev.items || []).map((invItem, idx) =>
        idx === itemIndex
          ? {
              ...invItem,
              item_id: item.id,
              description: item.item_name,
              rate: item.standard_selling_price || 0
            }
          : invItem
      )
    }));

    // Clear search for this item
    setItemSearch(prev => ({ ...prev, [itemIndex]: '' }));
    setItemSearchResults([]);
    setShowItemSearchDropdown(null);
  };

  // Handle keyboard navigation for item search
  const handleItemSearchKeyDown = (e: React.KeyboardEvent, itemIndex: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (itemSearchResults.length > 0) {
        setSelectedItemIndex(prev =>
          prev < itemSearchResults.length - 1 ? prev + 1 : 0
        );
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (itemSearchResults.length > 0) {
        setSelectedItemIndex(prev =>
          prev > 0 ? prev - 1 : itemSearchResults.length - 1
        );
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedItemIndex >= 0 && itemSearchResults[selectedItemIndex]) {
        handleSelectItem(itemSearchResults[selectedItemIndex], itemIndex);
        // Clear search after selection
        setItemSearch(prev => ({ ...prev, [itemIndex]: '' }));
      }
    }
  };

  // Handle customer selection
  const handleCustomerSelect = (customer: InvoiceCustomer) => {
    updateCustomer('id', customer.id);
    updateCustomer('name', customer.customer_name);
    updateCustomer('email', customer.email);
    updateCustomer('phone', customer.phone);
    updateCustomer('address', customer.billing_address);
  };

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!invoice.customer_id) {
      newErrors.customer = 'Please select a customer';
    }
    
    if (!(invoice.items && invoice.items.length > 0)) {
      newErrors.items = 'Please add at least one item';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Prepare invoice data for submission
    const invoiceData = {
      ...(invoiceId && { status: invoice.status }),
      invoice_no: invoice.invoice_no,
      customer_id: invoice.customer_id,
      invoice_date: invoice.invoice_date,
      due_date: invoice.due_date,
      total_amount: calculateTotal(),
      discount_scope: invoice.discount_scope,
      discount_type: invoice.discount?.type,
      discount_value: invoice.discount?.value,
      notes: invoice.notes,
      terms: invoice.terms,
      items: invoice.items?.map(item => ({
        item_id: item.item_id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.rate,
        tax_rate: item.tax,
        discount_type: item.discount.type,
        discount_value: item.discount.value
      })),
      ...(invoice.payment?.record_payment && {
        record_payment: true,
        payment: {
          payment_date: invoice.payment.payment_date,
          amount: invoice.payment.payment_amount,
          payment_method: invoice.payment.payment_method,
          reference_no: invoice.payment.reference_no,
          notes: invoice.payment.payment_notes
        }
      })
    };

    // Submit the form
    if (invoiceId) {
      // Update existing invoice
      api.put(`/invoices/${invoiceId}`, invoiceData)
        .then(() => {
          toast.success('Invoice updated successfully!');
          queryClient.invalidateQueries(['invoices']);
          navigate(`/customers/${invoice.customer_id}`);
        })
        .catch(error => {
          toast.error(error.response?.data?.error || 'Failed to update invoice');
        });
    } else {
      // Create new invoice
      api.post('/invoices', invoiceData)
        .then(() => {
          toast.success('Invoice created successfully!');
          queryClient.invalidateQueries(['invoices']);
          navigate(`/customers/${invoice.customer_id}`);
        })
        .catch(error => {
          toast.error(error.response?.data?.error || 'Failed to create invoice');
        });
    }
  };

  if (loading) {
    return (
      <div className="miw-loading-overlay">
        <div className="miw-loading-spinner" />
      </div>
    );
  }

  return (
    <div className="mobile-invoice-edit-form">
      <div className="miw-header">
        <button className="miw-back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 className="miw-title">{invoiceId ? 'Edit Invoice' : 'Create Invoice'}</h1>
        <div className="miw-header-right"></div>
      </div>

      <form onSubmit={handleSubmit} className="miw-form">
        {/* Customer Information Section */}
        <div className="miw-section">
          <div 
            className="miw-section-header" 
            onClick={() => toggleSection('customer')}
          >
            <div className="miw-section-title">
              <User size={20} className="miw-section-icon" />
              <span>Customer Information</span>
            </div>
            {sections.customer ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          
          {sections.customer && (
            <div className="miw-section-content">
              <div className="miw-form-row">
                <FormInput
                  label="Customer"
                  name="customer_name"
                  type="searchable-select"
                  value={invoice.customer_name}
                  onChange={(e) => {
                    const customer = customers.find((c: any) => c.customer_name === e.target.value);
                    if (customer) {
                      handleCustomerSelect(customer);
                    }
                  }}
                  options={customers.map((c: any) => ({
                    value: c.customer_name,
                    label: `${c.customer_name}${c.customer_code ? ` (${c.customer_code})` : ''}`
                  }))}
                  placeholder="Select customer..."
                  required
                />
              </div>
              
              {errors.customer && <div className="miw-error">{errors.customer}</div>}
              
              <div className="miw-form-row">
                <div className="miw-form-col">
                  <label>Email</label>
                  <div className="miw-input-group">
                    <Mail size={16} className="miw-input-icon" />
                    <input
                      type="email"
                      value={invoice.customer_email || ''}
                      onChange={(e) => updateCustomer('email', e.target.value)}
                      className="miw-input"
                      placeholder="Email"
                    />
                  </div>
                </div>
                
                <div className="miw-form-col">
                  <label>Phone</label>
                  <div className="miw-input-group">
                    <Phone size={16} className="miw-input-icon" />
                    <input
                      type="tel"
                      value={invoice.customer_phone || ''}
                      onChange={(e) => updateCustomer('phone', e.target.value)}
                      className="miw-input"
                      placeholder="Phone"
                    />
                  </div>
                </div>
              </div>
              
              <div className="miw-form-row">
                <label>Address</label>
                <div className="miw-input-group">
                  <MapPin size={16} className="miw-input-icon" />
                  <textarea
                    value={invoice.customer_address || ''}
                    onChange={(e) => updateCustomer('address', e.target.value)}
                    className="miw-input miw-textarea"
                    placeholder="Address"
                  />
                </div>
              </div>
              
              <div className="miw-form-row">
                <div className="miw-form-col">
                  <label>Invoice Date</label>
                  <div className="miw-input-group">
                    <Calendar size={16} className="miw-input-icon" />
                    <input
                      type="date"
                      value={invoice.invoice_date || ''}
                      onChange={(e) => updateInvoice('invoice_date', e.target.value)}
                      className="miw-input"
                    />
                  </div>
                </div>
                
                <div className="miw-form-col">
                  <label>Due Date</label>
                  <div className="miw-input-group">
                    <Calendar size={16} className="miw-input-icon" />
                    <input
                      type="date"
                      value={invoice.due_date || ''}
                      onChange={(e) => updateInvoice('due_date', e.target.value)}
                      className="miw-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Items/Products Section */}
        <div className="miw-section">
          <div
            className="miw-section-header"
            onClick={() => toggleSection('items')}
          >
            <div className="miw-section-title">
              <Package size={20} className="miw-section-icon" />
              <span>Items/Products</span>
            </div>
            {sections.items ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>

          {sections.items && (
            <div className="miw-section-content">
              {errors.items && <div className="miw-error">{errors.items}</div>}

              <div className="miw-items-list">
                {invoice.items?.map((item, index) => (
                  <div key={item.id} className="miw-item-row" onClick={() => {
                    // Open the add item sheet for editing this item
                    setCurrentlyEditingItemIndex(index);
                    setShowAddItemSheet(true);
                  }}>
                    <div className="miw-item-header">
                      <span>Item {index + 1}</span>
                      <button
                        type="button"
                        className="miw-remove-btn"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent opening the edit sheet when clicking remove
                          removeItem(item.id);
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="miw-item-info">
                      <div className="miw-item-name">{item.description || <span className="miw-item-placeholder">Select item...</span>}</div>
                      <div className="miw-item-meta">
                        <div className="miw-item-meta-item">
                          <span>Qty: {item.quantity}</span>
                        </div>
                        <div className="miw-item-meta-item">
                          <span>@ {formatCurrency(item.rate)}</span>
                        </div>
                        <div className="miw-item-meta-item">
                          <span>Tax: {item.tax}%</span>
                        </div>
                        {item.discount.value > 0 && (
                          <div className="miw-item-meta-item">
                            <span>Disc: {item.discount.value}{item.discount.type === 'percentage' ? '%' : ''}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="miw-item-price">
                      {formatCurrency(calculateItemTotal(item))}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="miw-add-btn"
                onClick={() => {
                  const newItemId = Date.now();
                  const newItem: InvoiceItem = {
                    id: newItemId,
                    item_id: 0,
                    description: '',
                    quantity: 1,
                    rate: 0,
                    tax: 0,
                    discount: { type: 'flat', value: 0 }
                  };

                  setInvoice(prev => ({
                    ...prev,
                    items: [...(prev.items || []), newItem]
                  }));

                  // Initialize search state for the new item
                  setItemSearch(prev => ({
                    ...prev,
                    [(prev.items || []).length]: ''
                  }));

                  // Open the add item bottom sheet for the new item
                  setCurrentlyEditingItemIndex((prevItems => prevItems || []).length - 1);
                  setShowAddItemSheet(true);
                }}
              >
                <Plus size={18} />
                <span>Add Item</span>
              </button>

              {/* Invoice-level discount if scope is invoice */}
              {invoice.discount_scope === 'invoice' && (
                <div className="miw-discount-section">
                  <div className="miw-form-row">
                    <div className="miw-form-col">
                      <label>Discount Type</label>
                      <select
                        value={invoice.discount?.type || 'flat'}
                        onChange={(e) => updateInvoice('discount', {
                          ...invoice.discount,
                          type: e.target.value as 'percentage' | 'flat'
                        })}
                        className="miw-input miw-select"
                      >
                        <option value="flat">Flat Amount</option>
                        <option value="percentage">Percentage</option>
                      </select>
                    </div>

                    <div className="miw-form-col">
                      <label>Discount Value</label>
                      <div className="miw-input-group">
                        {invoice.discount?.type === 'percentage' ? (
                          <>
                            <Percent size={16} className="miw-input-icon" />
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={invoice.discount?.value || 0}
                              onChange={(e) => updateInvoice('discount', {
                                ...invoice.discount,
                                value: Number(e.target.value)
                              })}
                              className="miw-input miw-discount-input"
                            />
                          </>
                        ) : (
                          <>
                            <DollarSign size={16} className="miw-input-icon" />
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={invoice.discount?.value || 0}
                              onChange={(e) => updateInvoice('discount', {
                                ...invoice.discount,
                                value: Number(e.target.value)
                              })}
                              className="miw-input miw-discount-input"
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Totals Summary */}
              <div className="miw-totals-summary">
                <div className="miw-total-row">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(calculateSubtotal())}</span>
                </div>

                <div className="miw-total-row">
                  <span>Discount:</span>
                  <span>-{formatCurrency(calculateDiscount())}</span>
                </div>

                <div className="miw-total-row">
                  <span>Tax:</span>
                  <span>{formatCurrency(calculateTax())}</span>
                </div>

                <div className="miw-total-row miw-total-final">
                  <span>Total:</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment Information Section */}
        <div className="miw-section">
          <div 
            className="miw-section-header" 
            onClick={() => toggleSection('payment')}
          >
            <div className="miw-section-title">
              <CreditCard size={20} className="miw-section-icon" />
              <span>Payment Information</span>
            </div>
            {sections.payment ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          
          {sections.payment && (
            <div className="miw-section-content">
              <div className="miw-form-row">
                <label>
                  <input
                    type="checkbox"
                    checked={invoice.payment?.record_payment || false}
                    onChange={(e) => updatePayment('record_payment', e.target.checked)}
                    className="miw-checkbox"
                  />
                  Record payment for this invoice
                </label>
              </div>
              
              {(invoice.payment?.record_payment) && (
                <>
                  <div className="miw-form-row">
                    <div className="miw-form-col">
                      <label>Payment Date</label>
                      <input
                        type="date"
                        value={invoice.payment?.payment_date || ''}
                        onChange={(e) => updatePayment('payment_date', e.target.value)}
                        className="miw-input"
                      />
                    </div>
                    
                    <div className="miw-form-col">
                      <label>Payment Method</label>
                      <select
                        value={invoice.payment?.payment_method || 'Cash'}
                        onChange={(e) => updatePayment('payment_method', e.target.value)}
                        className="miw-input"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Check">Check</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Credit Card">Credit Card</option>
                        <option value="Online Payment">Online Payment</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="miw-form-row">
                    <div className="miw-form-col">
                      <label>Amount</label>
                      <div className="miw-input-group">
                        <DollarSign size={16} className="miw-input-icon" />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={invoice.payment?.payment_amount || 0}
                          onChange={(e) => updatePayment('payment_amount', Number(e.target.value))}
                          className="miw-input"
                        />
                      </div>
                    </div>
                    
                    <div className="miw-form-col">
                      <label>Reference No</label>
                      <input
                        type="text"
                        value={invoice.payment?.reference_no || ''}
                        onChange={(e) => updatePayment('reference_no', e.target.value)}
                        className="miw-input"
                        placeholder="Check #, Transaction ID"
                      />
                    </div>
                  </div>
                  
                  <div className="miw-form-row">
                    <label>Payment Notes</label>
                    <textarea
                      value={invoice.payment?.payment_notes || ''}
                      onChange={(e) => updatePayment('payment_notes', e.target.value)}
                      className="miw-input miw-textarea"
                      placeholder="Payment notes..."
                      rows={3}
                    />
                  </div>
                </>
              )}
              
              {/* Payment Summary */}
              <div className="miw-payment-summary">
                <div className="miw-total-row">
                  <span>Invoice Total:</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
                
                <div className="miw-total-row">
                  <span>Amount Paid:</span>
                  <span>{formatCurrency(invoice.payment?.payment_amount || 0)}</span>
                </div>
                
                <div className="miw-total-row miw-total-final">
                  <span>Balance Remaining:</span>
                  <span>{formatCurrency(
                    calculateTotal() - (invoice.payment?.payment_amount || 0)
                  )}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notes and Terms */}
        <div className="miw-section">
          <div className="miw-section-content">
            <div className="miw-form-row">
              <div className="miw-form-col-full">
                <label>Notes</label>
                <textarea
                  value={invoice.notes || ''}
                  onChange={(e) => updateInvoice('notes', e.target.value)}
                  className="miw-input miw-textarea"
                  placeholder="Notes..."
                  rows={3}
                />
              </div>
            </div>
            
            <div className="miw-form-row">
              <div className="miw-form-col-full">
                <label>Terms & Conditions</label>
                <textarea
                  value={invoice.terms || ''}
                  onChange={(e) => updateInvoice('terms', e.target.value)}
                  className="miw-input miw-textarea"
                  placeholder="Terms & conditions..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="miw-actions">
          <Button
            variant="secondary"
            type="button"
            onClick={() => navigate(-1)}
            className="miw-cancel-btn"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            className="miw-submit-btn"
          >
            {invoiceId ? 'Update Invoice' : 'Create Invoice'}
          </Button>
        </div>
      </form>

      {/* Add Item Bottom Sheet */}
      {showAddItemSheet && currentlyEditingItemIndex !== null && (
        <div className="miw-sheet-overlay" onClick={() => setShowAddItemSheet(false)}>
          <div
            className="miw-add-item-bottom-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="miw-sheet-drag-handle"></div>
            <div className="miw-add-item-header" onClick={() => setShowAddItemSheet(false)}>
              <span className="miw-add-item-title">Add Item</span>
              <ChevronUp size={20} className="miw-expand-icon" />
            </div>
            <div className="miw-add-item-content">
              <div className="miw-form-section">
                <label className="miw-label">Item</label>
                <div className="miw-search-container">
                  <input
                    type="text"
                    value={itemSearch[currentlyEditingItemIndex] || ''}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setItemSearch(prev => ({ ...prev, [currentlyEditingItemIndex]: newValue }));

                      if (newValue.length >= 2) {
                        handleItemSearch(newValue, currentlyEditingItemIndex);
                      } else {
                        setItemSearchResults([]);
                        setShowItemSearchDropdown(null);
                      }
                    }}
                    onKeyDown={(e) => handleItemSearchKeyDown(e, currentlyEditingItemIndex)}
                    onFocus={() => {
                      const currentValue = itemSearch[currentlyEditingItemIndex] || '';
                      if (currentValue.length >= 2) {
                        handleItemSearch(currentValue, currentlyEditingItemIndex);
                      }
                    }}
                    onBlur={() => {
                      // Delay hiding the dropdown to allow click on results
                      setTimeout(() => {
                        if (showItemSearchDropdown === currentlyEditingItemIndex) {
                          setShowItemSearchDropdown(null);
                        }
                      }, 150);
                    }}
                    className="miw-input"
                    placeholder="Search items... (type 2+ chars)"
                  />
                  <Search size={18} className="miw-search-icon" />

                  {showItemSearchDropdown === currentlyEditingItemIndex && (
                    <div className="miw-item-search-dropdown">
                      <div className="miw-item-search-header">Recent Items</div>
                      {itemSearchResults.map((result, resultIdx) => (
                        <div
                          key={result.id}
                          className={`miw-item-search-result ${selectedItemIndex === resultIdx ? 'highlighted' : ''}`}
                          onMouseDown={() => {
                            // Update the specific item in the items array
                            setInvoice(prev => ({
                              ...prev,
                              items: (prev.items || []).map((invItem, idx) =>
                                idx === currentlyEditingItemIndex
                                  ? {
                                      ...invItem,
                                      item_id: result.id,
                                      description: result.item_name,
                                      rate: result.standard_selling_price || 0
                                    }
                                  : invItem
                              )
                            }));

                            // Clear search for this item
                            setItemSearch(prev => ({ ...prev, [currentlyEditingItemIndex]: '' }));
                            setItemSearchResults([]);
                            setShowItemSearchDropdown(null);
                          }}
                        >
                          <div className="miw-item-search-name">{result.item_name}</div>
                          <div className="miw-item-search-details">
                            <span>Stock: {result.current_stock || 0}</span>
                            <span>{formatCurrency(result.standard_selling_price || 0)}</span>
                          </div>
                        </div>
                      ))}
                      {itemSearchResults.length === 0 && !isSearchingItems && (
                        <div className="miw-item-search-empty">
                          No items found
                        </div>
                      )}
                      <div className="miw-search-hints">
                        <span className="miw-search-hint-key"><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
                        <span className="miw-search-hint-key"><kbd>Enter</kbd> Select</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="miw-inline-row">
                <div className="miw-inline-item miw-inline-50">
                  <label className="miw-label">Quantity</label>
                  <div className="miw-qty-control">
                    <button
                      className="miw-qty-btn"
                      type="button"
                      onClick={() => {
                        const currentItem = invoice.items?.[currentlyEditingItemIndex];
                        if (currentItem) {
                          updateItem(currentItem.id, 'quantity', Math.max(1, currentItem.quantity - 1));
                        }
                      }}
                    >
                      <Minus size={18} />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={invoice.items?.[currentlyEditingItemIndex]?.quantity || 1}
                      onChange={(e) => {
                        const currentItem = invoice.items?.[currentlyEditingItemIndex];
                        if (currentItem) {
                          updateItem(currentItem.id, 'quantity', Number(e.target.value));
                        }
                      }}
                      className="miw-qty-input"
                    />
                    <button
                      className="miw-qty-btn"
                      type="button"
                      onClick={() => {
                        const currentItem = invoice.items?.[currentlyEditingItemIndex];
                        if (currentItem) {
                          updateItem(currentItem.id, 'quantity', currentItem.quantity + 1);
                        }
                      }}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
                <div className="miw-inline-item miw-inline-50">
                  <label className="miw-label">Unit Price</label>
                  <div className="miw-input-group">
                    <DollarSign size={16} className="miw-input-icon" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={invoice.items?.[currentlyEditingItemIndex]?.rate || 0}
                      onChange={(e) => {
                        const currentItem = invoice.items?.[currentlyEditingItemIndex];
                        if (currentItem) {
                          updateItem(currentItem.id, 'rate', Number(e.target.value));
                        }
                      }}
                      className="miw-input"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="miw-inline-row">
                <div className="miw-inline-item miw-inline-33">
                  <label className="miw-label">Tax (%)</label>
                  <select
                    value={invoice.items?.[currentlyEditingItemIndex]?.tax || 0}
                    onChange={(e) => {
                      const currentItem = invoice.items?.[currentlyEditingItemIndex];
                      if (currentItem) {
                        updateItem(currentItem.id, 'tax', Number(e.target.value));
                      }
                    }}
                    className="miw-input miw-select"
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="10">10%</option>
                    <option value="15">15%</option>
                    <option value="20">20%</option>
                  </select>
                </div>
                <div className="miw-inline-item miw-inline-33">
                  <label className="miw-label">Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={invoice.items?.[currentlyEditingItemIndex]?.discount.value || 0}
                    onChange={(e) => {
                      const currentItem = invoice.items?.[currentlyEditingItemIndex];
                      if (currentItem) {
                        updateItem(currentItem.id, 'discount', {
                          ...currentItem.discount,
                          value: Number(e.target.value)
                        });
                      }
                    }}
                    className="miw-input miw-discount-input"
                    placeholder="0"
                  />
                </div>
                <div className="miw-inline-item miw-inline-33">
                  <label className="miw-label">Total</label>
                  <div className="miw-preview-amount">
                    {invoice.items && currentlyEditingItemIndex < invoice.items.length
                      ? formatCurrency(calculateItemTotal(invoice.items[currentlyEditingItemIndex]))
                      : formatCurrency(0)}
                  </div>
                </div>
              </div>

              <div className="miw-form-actions" style={{position: 'fixed', bottom: '20px', left: 'var(--space-md)', right: 'var(--space-md)', background: 'white', padding: 'var(--space-md)', zIndex: 2002}}>
                <div className="miw-inline-row" style={{gap: 'var(--space-sm)'}}>
                  <button
                    className="btn btn-secondary"
                    style={{flex: '1 1 0%', height: '44px', borderRadius: '10px'}}
                    onClick={() => {
                      // If we're adding a new item and cancel, remove it
                      if (invoice.items && currentlyEditingItemIndex === invoice.items.length - 1 &&
                          !invoice.items[currentlyEditingItemIndex]?.description) {
                        setInvoice(prev => ({
                          ...prev,
                          items: prev.items?.slice(0, -1) || []
                        }));
                      }
                      setShowAddItemSheet(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{flex: '1 1 0%', height: '44px', borderRadius: '10px'}}
                    onClick={() => setShowAddItemSheet(false)}
                    disabled={!invoice.items?.[currentlyEditingItemIndex]?.description}
                  >
                    {invoice.items && currentlyEditingItemIndex < invoice.items.length ? 'Update' : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileInvoiceEditForm;