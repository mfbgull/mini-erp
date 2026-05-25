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

// Helper: create empty item row
const createEmptyItemRow = (index) => ({
  id: Date.now() + index,
  item_id: '',
  description: '',
  quantity: 1,
  rate: 0,
  tax: 0,
  discount: { type: 'flat', value: 0 }
});

// Helper: pad items array to minimum 1 row
const padItemsToMinimum = (items, min = 1) => {
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
      discount: { type: 'flat', value: 0 }
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

  const [customer, setCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [status, setStatus] = useState('Draft');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('Valid for 30 days.');
  const [items, setItems] = useState(() =>
    Array.from({ length: 1 }, (_, i) => createEmptyItemRow(i))
  );

  const [currentStep, setCurrentStep] = useState(1);
  const [editingCell, setEditingCell] = useState(null);
  const [newItemId, setNewItemId] = useState(null);

  const lastFocusedCellRef = useRef(null);
  const tableContainerRef = useRef(null);
  const pendingFocusRef = useRef(null);

  // Auto-focus newly added row's description cell
  useEffect(() => {
    if (newItemId) {
      const timer = setTimeout(() => {
        const newCell = document.querySelector(`[data-cell-id="${newItemId}-description"]`);
        if (newCell) {
          setEditingCell(`${newItemId}-description`);
          newCell.focus();
          setTimeout(() => {
            const input = newCell.querySelector('input');
            if (input) {
              input.focus();
              input.select();
            }
          }, 50);
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [newItemId]);

  // Prevent focus loss when items array changes
  useEffect(() => {
    if (pendingFocusRef.current) {
      const itemId = pendingFocusRef.current;
      pendingFocusRef.current = null;

      const timer = setTimeout(() => {
        const cell = document.querySelector(`[data-cell-id="${itemId}-description"]`);
        if (cell) {
          setEditingCell(`${itemId}-description`);
          cell.focus();
          setTimeout(() => {
            const input = cell.querySelector('input');
            if (input) {
              input.focus();
              input.select();
            }
          }, 50);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [items]);

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
              discount: {
                type: item.discount_type || 'flat',
                value: item.discount_value || 0
              }
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

  useEffect(() => {
    if (!id) {
      const timer = setTimeout(() => {
        const firstCell = document.querySelector('[data-cell-id$="-description"]');
        if (firstCell) {
          firstCell.focus();
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [id]);

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
    // Auto-focus first item cell after customer is selected
    if (items.length > 0) {
      setTimeout(() => {
        const firstCell = document.querySelector(`[data-cell-id="${items[0]?.id}-description"]`);
        if (firstCell) {
          setEditingCell(`${items[0]?.id}-description`);
          firstCell.focus();
          setTimeout(() => {
            const input = firstCell.querySelector('input');
            if (input) {
              input.focus();
              input.select();
            }
          }, 50);
        }
      }, 100);
    }
  };

  const addNewItem = () => {
    const newId = Date.now();
    const newItem = {
      id: newId,
      item_id: '',
      description: '',
      quantity: 1,
      rate: 0,
      tax: 0,
      discount: { type: 'flat', value: 0 }
    };
    setItems([...items, newItem]);
    pendingFocusRef.current = newId;
    setNewItemId(newId);
    return newId;
  };

  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (itemId, field, value) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        if (field === 'itemId') {
          const selectedItem = inventoryItems.find(i => i.id === Number(value));
          return {
            ...item,
            item_id: Number(value),
            description: selectedItem?.item_name || item.description,
            rate: selectedItem?.standard_selling_price || item.rate
          };
        } else if (field === 'discountType') {
          return { ...item, discount: { ...item.discount, type: value } };
        } else if (field === 'discountValue') {
          return { ...item, discount: { ...item.discount, value: Number(value) || 0 } };
        } else {
          return { ...item, [field]: field === 'description' ? value : Number(value) || 0 };
        }
      }
      return item;
    }));
  };

  const getNextField = (currentField) => {
    const fieldOrder = ['description', 'quantity', 'rate', 'discountValue', 'tax'];
    const currentIndex = fieldOrder.indexOf(currentField);
    return fieldOrder[currentIndex + 1];
  };

  const isLastField = (field) => {
    return field === 'tax';
  };

  // ---- Calculations ----
  const calculateItemDiscount = (item) => {
    const subtotal = item.quantity * item.rate;
    if (item.discount.type === 'percentage') {
      return (subtotal * item.discount.value) / 100;
    }
    return Number(item.discount.value) || 0;
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

  // ---- Editable Cell Components ----

  // SearchableSelect Cell for Description with Stock Info
  const SearchableDescriptionCell = ({ value, itemId, isLastItem }) => {
    const isEditing = editingCell === `${itemId}-description`;
    const [tempValue, setTempValue] = useState(value);
    const [localFilteredItems, setLocalFilteredItems] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef(null);

    // Sync tempValue with value when it changes from outside
    useEffect(() => {
      if (value !== tempValue && !isEditing) {
        setTempValue(value);
      }
    }, [value, isEditing]);

    // Get sellable items
    const getSellableItems = () => {
      return inventoryItems.filter(item =>
        !item.is_raw_material &&
        (item.is_finished_good === 1 || item.is_purchased === 1)
      ).slice(0, 10);
    };

    const focusTargetCell = (targetItemId, targetField) => {
      setTimeout(() => {
        if (targetField === 'description') {
          setEditingCell(`${targetItemId}-description`);
          setTimeout(() => {
            const el = document.querySelector(`[data-cell-id="${targetItemId}-description"]`);
            if (!el) return;
            const input = el.querySelector('input');
            if (input) {
              input.focus();
              input.select();
            }
          }, 100);
        } else {
          const el = document.querySelector(`[data-cell-id="${targetItemId}-${targetField}"]`);
          if (el) el.focus();
        }
      }, 100);
    };

    const handleInputChange = (e) => {
      const searchValue = e.target.value;
      setTempValue(searchValue);

      const sellableItems = getSellableItems();

      if (searchValue.trim()) {
        const matches = sellableItems.filter(item =>
          item.item_name.toLowerCase().includes(searchValue.toLowerCase()) ||
          item.item_code.toLowerCase().includes(searchValue.toLowerCase())
        );
        setLocalFilteredItems(matches);
        setShowDropdown(matches.length > 0);
        setSelectedIndex(matches.length > 0 ? 0 : -1);
      } else {
        setLocalFilteredItems(sellableItems);
        setShowDropdown(sellableItems.length > 0);
        setSelectedIndex(sellableItems.length > 0 ? 0 : -1);
      }
    };

    const selectItem = (item, moveNext = true) => {
      updateItem(itemId, 'itemId', item.id);
      setTempValue(item.item_name);
      setShowDropdown(false);
      setLocalFilteredItems([]);
      setSelectedIndex(-1);

      if (moveNext) {
        setEditingCell(`${itemId}-quantity`);
        focusTargetCell(itemId, 'quantity');
      } else {
        setEditingCell(null);
      }
    };

    const handleSave = () => {
      if (tempValue !== value) {
        updateItem(itemId, 'description', tempValue);
      }
      setShowDropdown(false);
      setLocalFilteredItems([]);
      setEditingCell(null);
    };

    const closeDropdown = () => {
      setShowDropdown(false);
      setLocalFilteredItems([]);
      setSelectedIndex(-1);
    };

    const openDropdown = () => {
      if (!inventoryItems || inventoryItems.length === 0) {
        setLocalFilteredItems([]);
        setShowDropdown(false);
        setSelectedIndex(-1);
        return;
      }
      const sellableItems = getSellableItems();
      setLocalFilteredItems(sellableItems);
      setShowDropdown(sellableItems.length > 0);
      setSelectedIndex(sellableItems.length > 0 ? 0 : -1);
    };

    const handleKeyDown = (e) => {
      if (showDropdown && localFilteredItems.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const newIndex = selectedIndex < localFilteredItems.length - 1 ? selectedIndex + 1 : 0;
          setSelectedIndex(newIndex);
          setTimeout(() => {
            const dropdown = document.querySelector('.item-dropdown');
            const options = dropdown?.querySelectorAll('.item-dropdown-option');
            if (options && options[newIndex]) {
              options[newIndex].scrollIntoView({ block: 'nearest' });
            }
          }, 0);
          return;
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (selectedIndex === 0) {
            closeDropdown();
            return;
          }
          const newIndex = selectedIndex > 0 ? selectedIndex - 1 : localFilteredItems.length - 1;
          setSelectedIndex(newIndex);
          setTimeout(() => {
            const dropdown = document.querySelector('.item-dropdown');
            const options = dropdown?.querySelectorAll('.item-dropdown-option');
            if (options && options[newIndex]) {
              options[newIndex].scrollIntoView({ block: 'nearest' });
            }
          }, 0);
          return;
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (selectedIndex >= 0 && localFilteredItems[selectedIndex]) {
            selectItem(localFilteredItems[selectedIndex], true);
          }
          return;
        } else if (e.key === 'Escape') {
          e.preventDefault();
          closeDropdown();
          inputRef.current?.focus();
          return;
        } else if (e.key === 'Tab') {
          if (selectedIndex >= 0 && localFilteredItems[selectedIndex]) {
            e.preventDefault();
            selectItem(localFilteredItems[selectedIndex], true);
          }
          return;
        }
      }

      if (e.ctrlKey && e.key === 'ArrowDown') {
        e.preventDefault();
        handleSave();
        const currentItemIndex = items.findIndex(item => item.id === itemId);
        if (currentItemIndex < items.length - 1) {
          const nextItemId = items[currentItemIndex + 1].id;
          setEditingCell(`${nextItemId}-description`);
          focusTargetCell(nextItemId, 'description');
        } else if (currentItemIndex === items.length - 1) {
          const newItemId = addNewItem();
          setNewItemId(newItemId);
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        openDropdown();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const currentItemIndex = items.findIndex(item => item.id === itemId);
        if (currentItemIndex > 0) {
          const prevItemId = items[currentItemIndex - 1].id;
          handleSave();
          setEditingCell(`${prevItemId}-description`);
          focusTargetCell(prevItemId, 'description');
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setEditingCell(`${itemId}-quantity`);
        focusTargetCell(itemId, 'quantity');
      } else if (e.key === 'ArrowLeft') {
        if (showDropdown) {
          e.preventDefault();
          closeDropdown();
          inputRef.current?.focus();
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (showDropdown && selectedIndex >= 0 && localFilteredItems[selectedIndex]) {
          selectItem(localFilteredItems[selectedIndex], true);
        } else {
          handleSave();
          if (isLastField('description') && isLastItem) {
            addNewItem();
          } else {
            const nextField = getNextField('description');
            if (nextField) {
              setEditingCell(`${itemId}-${nextField}`);
              focusTargetCell(itemId, nextField);
            }
          }
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        if (showDropdown && selectedIndex >= 0 && localFilteredItems[selectedIndex]) {
          selectItem(localFilteredItems[selectedIndex], true);
        } else {
          handleSave();
          const nextField = getNextField('description');
          if (nextField) {
            setEditingCell(`${itemId}-${nextField}`);
            focusTargetCell(itemId, nextField);
          } else if (isLastItem) {
            addNewItem();
          }
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (showDropdown) {
          closeDropdown();
          inputRef.current?.focus();
        } else {
          setTempValue(value);
          setEditingCell(null);
        }
      }
    };

    const handleBlur = (e) => {
      const isClickingDropdown = e.relatedTarget?.closest('.item-dropdown');
      if (!isClickingDropdown) {
        setTimeout(() => {
          if (showDropdown && selectedIndex >= 0 && document.querySelector('.item-dropdown-option.selected')) {
            selectItem(localFilteredItems[selectedIndex], false);
          } else {
            setShowDropdown(false);
            setLocalFilteredItems([]);
          }
        }, 150);
      }
    };

    if (isEditing) {
      const inputElement = document.querySelector(`[data-cell-id="${itemId}-description"] input`);
      const inputRect = inputElement?.getBoundingClientRect();
      const dropdownStyle = inputRect ? {
        position: 'fixed',
        top: `${inputRect.bottom + 2}px`,
        left: `${inputRect.left}px`,
        minWidth: `${Math.max(inputRect.width, 250)}px`
      } : {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        minWidth: '300px',
        zIndex: 99999
      };

      return (
        <div
          className="searchable-cell-container"
          data-cell-id={`${itemId}-description`}
          onClick={() => {
            setEditingCell(`${itemId}-description`);
            openDropdown();
            inputRef.current?.focus();
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={tempValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onFocus={(e) => {
              e.target.select();
              lastFocusedCellRef.current = `${itemId}-description`;
              openDropdown();
            }}
            className="editable-input"
            placeholder="Type to search items..."
          />
          {showDropdown && (
            <div className="item-dropdown" style={dropdownStyle}>
              {localFilteredItems.length > 0 ? (
                localFilteredItems.map((item, index) => (
                  <div
                    key={item.id}
                    className={`item-dropdown-option ${index === selectedIndex ? 'selected' : ''}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectItem(item, true);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="item-dropdown-main">
                      <span className="item-dropdown-name">{item.item_name}</span>
                      <span className="item-dropdown-code">{item.item_code}</span>
                    </div>
                    <div className="item-dropdown-details">
                      <span className="item-dropdown-stock">
                        Stock: {item.current_stock || 0}
                      </span>
                      <span className="item-dropdown-price">
                        {formatCurrency(item.standard_selling_price || 0)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                tempValue.trim() && (
                  <div className="item-dropdown-no-results">
                    No products found matching "{tempValue}"
                  </div>
                )
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        onClick={() => {
          setTempValue(value || '');
          setEditingCell(`${itemId}-description`);
          setTimeout(() => openDropdown(), 50);
        }}
        onFocus={() => {
          lastFocusedCellRef.current = `${itemId}-description`;
          setTempValue(value || '');
          setEditingCell(`${itemId}-description`);
          setTimeout(() => openDropdown(), 50);
        }}
        onKeyDown={(e) => {
          const currentItemIndex = items.findIndex(item => item.id === itemId);
          if (e.key === 'Enter') {
            e.preventDefault();
            setTempValue(value || '');
            setEditingCell(`${itemId}-description`);
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (currentItemIndex < items.length - 1) {
              focusTargetCell(items[currentItemIndex + 1].id, 'description');
            }
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (currentItemIndex > 0) {
              focusTargetCell(items[currentItemIndex - 1].id, 'description');
            }
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            const nextField = getNextField('description');
            if (nextField) {
              focusTargetCell(itemId, nextField);
            } else if (currentItemIndex < items.length - 1) {
              focusTargetCell(items[currentItemIndex + 1].id, 'description');
            }
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (currentItemIndex > 0) {
              focusTargetCell(items[currentItemIndex - 1].id, 'tax');
            }
          } else if (e.key === 'Tab') {
            e.preventDefault();
            const nextField = getNextField('description');
            if (nextField) {
              focusTargetCell(itemId, nextField);
            } else if (isLastItem) {
              addNewItem();
            }
          }
        }}
        className="editable-cell"
        tabIndex={0}
        data-cell-id={`${itemId}-description`}
      >
        {value || <span className="cell-placeholder">Click to add item...</span>}
        <Edit2 className="edit-icon" />
      </div>
    );
  };

  // Regular Editable Cell for other fields
  const EditableCell = ({ value, itemId, field, type = 'text', isLastItem }) => {
    const isEditing = editingCell === `${itemId}-${field}`;
    const [tempValue, setTempValue] = useState(value);

    const handleSave = () => {
      updateItem(itemId, field, tempValue);
      setEditingCell(null);
    };

    const focusTargetCell = (targetItemId, targetField) => {
      setTimeout(() => {
        const el = document.querySelector(`[data-cell-id="${targetItemId}-${targetField}"]`);
        if (!el) return;
        if (targetField === 'description') {
          const input = el.querySelector('input');
          if (input) {
            input.focus();
            input.select();
          }
        } else {
          el.focus();
        }
      }, 100);
    };

    const fieldOrder = ['description', 'quantity', 'rate', 'discountValue', 'tax'];

    const moveToCell = (rowOffset, colOffset) => {
      const currentItemIndex = items.findIndex(item => item.id === itemId);
      const currentFieldIndex = fieldOrder.indexOf(field);

      if (rowOffset !== 0) {
        const newItemIndex = currentItemIndex + rowOffset;
        if (newItemIndex >= 0 && newItemIndex < items.length) {
          const newItemId = items[newItemIndex].id;
          handleSave();
          setEditingCell(`${newItemId}-${field}`);
          focusTargetCell(newItemId, field);
        } else if (rowOffset > 0 && newItemIndex >= items.length) {
          handleSave();
          addNewItem();
        }
      }

      if (colOffset !== 0) {
        const newFieldIndex = currentFieldIndex + colOffset;
        if (newFieldIndex >= 0 && newFieldIndex < fieldOrder.length) {
          handleSave();
          const newField = fieldOrder[newFieldIndex];
          setEditingCell(`${itemId}-${newField}`);
          focusTargetCell(itemId, newField);
        }
      }
    };

    const handleKeyDown = (e) => {
      // Ctrl+ArrowUp: Increment value
      if (e.ctrlKey && e.key === 'ArrowUp') {
        e.preventDefault();
        if (['quantity', 'rate', 'tax', 'discountValue'].includes(field)) {
          let newValue = (parseFloat(tempValue) || 0) + 1;
          if (field === 'tax' && newValue > 100) newValue = 100;
          if (field === 'quantity' && newValue < 0) newValue = 0;
          setTempValue(newValue);
        }
      }
      // Ctrl+ArrowDown: Decrement value
      else if (e.ctrlKey && e.key === 'ArrowDown') {
        e.preventDefault();
        if (['quantity', 'rate', 'tax', 'discountValue'].includes(field)) {
          const currentVal = parseFloat(tempValue) || 0;
          let newValue = currentVal - 1;
          if (field === 'tax' && newValue < 0) newValue = 0;
          if (field === 'quantity' && newValue < 0) newValue = 0;
          if ((field === 'rate' || field === 'discountValue') && newValue < 0) newValue = 0;
          setTempValue(newValue);
        }
      }
      else if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveToCell(-1, 0);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveToCell(1, 0);
      } else if (e.key === 'ArrowLeft') {
        const shouldNavigate = type === 'number' || e.target.selectionStart === 0;
        if (shouldNavigate) {
          e.preventDefault();
          moveToCell(0, -1);
        }
      } else if (e.key === 'ArrowRight') {
        const shouldNavigate = type === 'number' || e.target.selectionStart === e.target.value.length;
        if (shouldNavigate) {
          e.preventDefault();
          moveToCell(0, 1);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
        if (isLastField(field) && isLastItem) {
          addNewItem();
        } else {
          moveToCell(1, 0);
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        handleSave();
        const nextField = getNextField(field);
        if (nextField) {
          setEditingCell(`${itemId}-${nextField}`);
        } else if (isLastItem) {
          addNewItem();
        } else {
          moveToCell(1, 0);
        }
      } else if (e.key === 'Escape') {
        setTempValue(value);
        setEditingCell(null);
      }
    };

    if (isEditing) {
      return (
        <input
          type={type}
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          onFocus={(e) => e.target.select()}
          className="editable-input"
          data-cell-id={`${itemId}-${field}`}
        />
      );
    }

    return (
      <div
        data-cell-id={`${itemId}-${field}`}
        onClick={() => {
          setTempValue(value);
          setEditingCell(`${itemId}-${field}`);
        }}
        onFocus={() => {
          lastFocusedCellRef.current = `${itemId}-${field}`;
          setTempValue(value);
          setEditingCell(`${itemId}-${field}`);
        }}
        onKeyDown={(e) => {
          const currentFieldIndex = fieldOrder.indexOf(field);
          const currentItemIndex = items.findIndex(item => item.id === itemId);

          if (e.key === 'Enter') {
            e.preventDefault();
            setTempValue(value);
            setEditingCell(`${itemId}-${field}`);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (currentItemIndex > 0) {
              focusTargetCell(items[currentItemIndex - 1].id, field);
            }
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (currentItemIndex < items.length - 1) {
              focusTargetCell(items[currentItemIndex + 1].id, field);
            }
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (currentFieldIndex > 0) {
              focusTargetCell(itemId, fieldOrder[currentFieldIndex - 1]);
            } else if (currentItemIndex > 0) {
              focusTargetCell(items[currentItemIndex - 1].id, fieldOrder[fieldOrder.length - 1]);
            }
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            if (currentFieldIndex < fieldOrder.length - 1) {
              focusTargetCell(itemId, fieldOrder[currentFieldIndex + 1]);
            } else if (currentItemIndex < items.length - 1) {
              focusTargetCell(items[currentItemIndex + 1].id, fieldOrder[0]);
            }
          } else if (e.key === 'Tab') {
            e.preventDefault();
            if (currentFieldIndex < fieldOrder.length - 1) {
              focusTargetCell(itemId, fieldOrder[currentFieldIndex + 1]);
            } else if (currentItemIndex < items.length - 1) {
              focusTargetCell(items[currentItemIndex + 1].id, 'description');
            } else {
              addNewItem();
            }
          }
        }}
        className="editable-cell"
        tabIndex={0}
      >
        {value}
        <Edit2 className="edit-icon" />
      </div>
    );
  };

  // ---- Desktop Render ----
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
          <div className="header-grid-modern quotation-header-grid">
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

            <div className="header-section customer-section">
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
                <div className="contact-info-modern mt-2">
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
            <button onClick={addNewItem} className="add-item-btn-modern">
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
                  <th className="text-left description-col">Description</th>
                  <th className="text-right quantity-col">Qty</th>
                  <th className="text-right rate-col">Rate</th>
                  <th className="text-right discount-col">Discount</th>
                  <th className="text-right tax-col">Tax %</th>
                  <th className="text-right amount-col">Amount</th>
                  <th className="delete-col"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="text-center serial-col">{index + 1}</td>
                    <td className="invoice-item-cell">
                      <SearchableDescriptionCell
                        value={item.description}
                        itemId={item.id}
                        isLastItem={index === items.length - 1}
                      />
                    </td>
                    <td className="text-right invoice-item-cell">
                      <EditableCell
                        value={item.quantity}
                        itemId={item.id}
                        field="quantity"
                        type="number"
                        isLastItem={index === items.length - 1}
                      />
                    </td>
                    <td className="text-right rate-cell-container invoice-item-cell">
                      <EditableCell
                        value={item.rate.toFixed(2)}
                        itemId={item.id}
                        field="rate"
                        type="number"
                        isLastItem={index === items.length - 1}
                      />
                    </td>
                    <td className="text-right invoice-item-cell">
                      <div className="discount-cell-modern">
                        <select
                          value={item.discount.type}
                          onChange={(e) => updateItem(item.id, 'discountType', e.target.value)}
                          className="discount-type-select-modern"
                        >
                          <option value="percentage">%</option>
                          <option value="flat">{getCurrencySymbol()}</option>
                        </select>
                        <EditableCell
                          value={item.discount.value}
                          itemId={item.id}
                          field="discountValue"
                          type="number"
                          isLastItem={index === items.length - 1}
                        />
                      </div>
                    </td>
                    <td className="text-right invoice-item-cell">
                      <EditableCell
                        value={item.tax}
                        itemId={item.id}
                        field="tax"
                        type="number"
                        isLastItem={index === items.length - 1}
                      />
                    </td>
                    <td className="text-right amount-cell-modern">
                      {formatCurrency(calculateItemTotal(item))}
                    </td>
                    <td className="text-center invoice-item-cell">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="remove-btn-modern"
                        title="Remove item"
                      >
                        <Trash2 className="trash-icon" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals + Notes & Terms Row */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            {/* Notes & Terms - Left Side */}
            <div className="invoice-footer-modern" style={{ flex: 1, minWidth: 0 }}>
              <div>
                <label className="footer-label">NOTES</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="3"
                  className="footer-textarea"
                  placeholder="Additional notes for the customer..."
                />
              </div>
              <div>
                <label className="footer-label">TERMS & CONDITIONS</label>
                <textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  rows="3"
                  className="footer-textarea"
                  placeholder="Terms and conditions..."
                />
              </div>
            </div>

            {/* Totals Card - Right Side */}
            <div className="totals-breakdown-modern" style={{ width: '280px', flexShrink: 0 }}>
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
        </div>
      </div>
    </div>
  );

  // ---- Mobile Render (Wizard) ----
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
                  <div className="customer-icon"><User size={24} /></div>
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
                <input type="date" value={quotationDate} onChange={(e) => setQuotationDate(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Expiry Date</label>
                <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="form-section">
            <div className="flex justify-between items-center mb-4">
              <h3 style={{ fontWeight: 600 }}>Line Items</h3>
              <Button variant="secondary" size="sm" onClick={() => setCurrentStep(3)}>
                <Plus size={16} className="mr-1" /> Add Item
              </Button>
            </div>
            {items.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><Package size={32} /></div>
                <div className="empty-state-title">No items added</div>
                <div className="empty-state-message">Add items to your quotation</div>
                <Button variant="primary" onClick={() => setCurrentStep(3)}>Add First Item</Button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {items.filter(item => item.item_id || item.description).map(item => (
                  <div key={item.id} className="customer-select-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{item.description || 'Unnamed Item'}</div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                          {item.quantity} x {formatCurrency(item.rate)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600, color: '#2563eb' }}>
                          {formatCurrency(calculateItemTotal(item))}
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="totals-section mt-4" style={{ marginTop: '16px' }}>
                  <div className="totals-row"><span>Subtotal</span><span>{formatCurrency(calculateSubtotal())}</span></div>
                  <div className="totals-row"><span>Tax</span><span>{formatCurrency(calculateTax())}</span></div>
                  <div className="totals-row total"><span>Total</span><span>{formatCurrency(calculateTotal())}</span></div>
                </div>
              </div>
            )}
          </div>
        );
      case 3:
        return (
          <div className="form-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontWeight: 600 }}>Select Item</h3>
              <button onClick={() => setCurrentStep(2)} style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '60vh', overflowY: 'auto' }}>
              {inventoryItems.map(item => (
                <div
                  key={item.id}
                  className="customer-select-card"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onClick={() => {
                    const newItem = {
                      id: Date.now(),
                      item_id: item.id,
                      description: item.item_name,
                      quantity: 1,
                      rate: item.standard_selling_price || 0,
                      tax: 0,
                      discount: { type: 'flat', value: 0 }
                    };
                    setItems([...items, newItem]);
                    setCurrentStep(2);
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>{item.item_name}</div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>Stock: {item.current_stock}</div>
                  </div>
                  <div style={{ fontWeight: 600 }}>{formatCurrency(item.standard_selling_price)}</div>
                </div>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="form-section">
            <h3 style={{ fontWeight: 600, marginBottom: '16px' }}>Review Quotation</h3>
            <div className="bg-gray-50 p-4 rounded-lg mb-4" style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Customer</div>
              <div style={{ fontWeight: 500 }}>{customer?.customer_name}</div>
              <div style={{ fontSize: '14px', marginTop: '8px', color: '#6b7280', marginBottom: '4px' }}>Dates</div>
              <div style={{ fontWeight: 500, fontSize: '14px' }}>Date: {quotationDate}</div>
              <div style={{ fontWeight: 500, fontSize: '14px' }}>Expiry: {expiryDate}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg mb-4" style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Summary</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                <span>Subtotal</span><span>{formatCurrency(calculateSubtotal())}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                <span>Discount</span><span>-{formatCurrency(calculateDiscount())}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                <span>Tax</span><span>{formatCurrency(calculateTax())}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, borderTop: '1px solid #e5e7eb', paddingTop: '8px' }}>
                <span>Total</span><span style={{ color: '#2563eb' }}>{formatCurrency(calculateTotal())}</span>
              </div>
            </div>
            <div className="form-field mb-4" style={{ marginBottom: '16px' }}>
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div className="form-field mb-4" style={{ marginBottom: '16px' }}>
              <label>Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
            <div className="form-field">
              <label>Terms</label>
              <textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={2} />
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
        <button onClick={() => navigate('/quotations')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
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
            onClick={() => { if (customer) setCurrentStep(2); else toast.error('Select customer first'); }}
          >
            <div className="wizard-step-number">{currentStep > 2 ? <Check size={14} /> : '2'}</div>
            <span className="wizard-step-label">Items</span>
          </button>
          <button
            className={`wizard-step ${currentStep === 4 ? 'active' : ''}`}
            onClick={() => {
              if (!customer) toast.error('Select customer first');
              else if (!items.some(i => i.item_id || i.description)) toast.error('Add items first');
              else setCurrentStep(4);
            }}
          >
            <div className="wizard-step-number">3</div>
            <span className="wizard-step-label">Review</span>
          </button>
        </div>
      )}

      <div className="form-body">{renderStep()}</div>

      <div className="form-actions">
        {currentStep === 1 && (
          <Button variant="primary" onClick={() => { if (customer) setCurrentStep(2); else toast.error('Please select a customer'); }}>
            Next: Items
          </Button>
        )}
        {currentStep === 2 && (
          <Button variant="primary" onClick={() => { if (items.some(i => i.item_id || i.description)) setCurrentStep(4); else toast.error('Please add at least one item'); }}>
            Next: Review
          </Button>
        )}
        {currentStep === 4 && (
          <Button variant="primary" onClick={handleSubmit} loading={mutation.isPending}>
            {id ? 'Update Quotation' : 'Create Quotation'}
          </Button>
        )}
      </div>
    </div>
  );

  // ---- View Mode ----
  if (isViewMode) {
    return (
      <div className="quotation-view-page">
        <div className="quotation-view-toolbar no-print">
          <div className="toolbar-left">
            <h2 className="toolbar-title">Quotation {id ? `QTN-${id.toString().padStart(4, '0')}` : ''}</h2>
          </div>
          <div className="toolbar-right">
            <Button variant="secondary" onClick={() => navigate(`/quotations/${id}/edit`)}>
              <Edit2 size={18} /> Edit
            </Button>
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer size={18} /> Print
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
              <ArrowLeft size={18} /> Back
            </Button>
          </div>
        )}
      </div>
    );
  }

  return isDesktop ? renderDesktop() : renderMobile();

  // ---- Submit Handler ----
  function handleSubmit(e) {
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
        discount_type: item.discount.type,
        discount_value: item.discount.value
      }))
    };

    mutation.mutate(quotationData);
  }
}
