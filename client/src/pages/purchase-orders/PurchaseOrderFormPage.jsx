import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit2, Hash, Eye, Send, X } from 'lucide-react';
import toast from 'react-hot-toast';

import Button from '../../components/common/Button';
import FormInput from '../../components/common/FormInput';
import { useSettings } from '../../context/SettingsContext';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { useFormValidation } from '../../hooks/useFormValidation';
import { purchaseOrderSchema } from '../../schemas';
import api from '../../utils/api';

import './PurchaseOrderFormPage.css';
import '../sales/SalesInvoicePage.css';

// Helper: create empty item row
const createEmptyItemRow = (index) => ({
  id: Date.now() + index,
  item_id: '',
  name: '',
  quantity: 1,
  unit_price: 0
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
      name: '',
      quantity: 1,
      unit_price: 0
    });
  }
  return padded;
};

export default function PurchaseOrderFormPage({ mode = 'create' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { formatCurrency } = useSettings();
  const { isMobile } = useMobileDetection();
  const isDesktop = !isMobile;
  const isEditMode = mode === 'edit' && id;

  const [supplier, setSupplier] = useState(null);
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [status, setStatus] = useState('Draft');
  const [warehouseId, setWarehouseId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState(() =>
    Array.from({ length: 1 }, (_, i) => createEmptyItemRow(i))
  );

  const [editingCell, setEditingCell] = useState(null);
  const [newItemId, setNewItemId] = useState(null);

  const lastFocusedCellRef = useRef(null);
  const tableContainerRef = useRef(null);
  const pendingFocusRef = useRef(null);

  const { validate } = useFormValidation(purchaseOrderSchema);

  // Auto-focus newly added row's description cell
  useEffect(() => {
    if (newItemId) {
      const timer = setTimeout(() => {
        const newCell = document.querySelector(`[data-cell-id="${newItemId}-name"]`);
        if (newCell) {
          setEditingCell(`${newItemId}-name`);
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
        const cell = document.querySelector(`[data-cell-id="${itemId}-name"]`);
        if (cell) {
          setEditingCell(`${itemId}-name`);
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

  // Fetch company settings
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

  // Load PO data if editing
  useEffect(() => {
    if (isEditMode && id) {
      const fetchPO = async () => {
        try {
          const response = await api.get(`/purchase-orders/${id}`);
          const po = response.data;

          setSupplier({
            id: po.supplier_id,
            supplier_name: po.supplier_name,
            supplier_code: po.supplier_code
          });
          setPoDate(po.po_date?.split('T')[0] || new Date().toISOString().split('T')[0]);
          setDeliveryDate(po.expected_delivery_date?.split('T')[0] || '');
          setStatus(po.status || 'Draft');
          setWarehouseId(po.warehouse_id || '');
          setNotes(po.notes || '');

          if (po.items) {
            setItems(padItemsToMinimum(po.items.map((item, index) => ({
              id: index + 1,
              item_id: item.item_id,
              name: item.item_name || '',
              quantity: item.quantity,
              unit_price: item.unit_price
            }))));
          }
        } catch (error) {
          toast.error('Failed to load purchase order');
          navigate('/purchase-orders');
        }
      };
      fetchPO();
    }
  }, [isEditMode, id, navigate]);

  // Auto-focus first cell for new POs
  useEffect(() => {
    if (!isEditMode) {
      const timer = setTimeout(() => {
        const firstCell = document.querySelector('[data-cell-id$="-name"]');
        if (firstCell) {
          firstCell.focus();
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isEditMode]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isEditMode) {
        return api.put(`/purchase-orders/${id}`, data);
      } else {
        return api.post('/purchase-orders', data);
      }
    },
    onSuccess: () => {
      toast.success(`Purchase order ${isEditMode ? 'updated' : 'created'} successfully`);
      queryClient.invalidateQueries(['purchaseOrders']);
      navigate('/purchase-orders');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || `Failed to ${isEditMode ? 'update' : 'create'} purchase order`);
    }
  });

  const handleSelectSupplier = (selectedSupplier) => {
    setSupplier(selectedSupplier);
    // Auto-focus first item cell after supplier is selected
    if (items.length > 0) {
      setTimeout(() => {
        const firstCell = document.querySelector(`[data-cell-id="${items[0]?.id}-name"]`);
        if (firstCell) {
          setEditingCell(`${items[0]?.id}-name`);
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
      name: '',
      quantity: 1,
      unit_price: 0
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
            name: selectedItem?.item_name || item.name,
            unit_price: selectedItem?.standard_cost || selectedItem?.purchase_price || item.unit_price
          };
        } else {
          return { ...item, [field]: field === 'name' ? value : Number(value) || 0 };
        }
      }
      return item;
    }));
  };

  const getNextField = (currentField) => {
    const fieldOrder = ['name', 'quantity', 'unit_price'];
    const currentIndex = fieldOrder.indexOf(currentField);
    return fieldOrder[currentIndex + 1];
  };

  const isLastField = (field) => {
    return field === 'unit_price';
  };

  // ---- Calculations ----
  const calculateItemTotal = (item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unit_price) || 0;
    return qty * price;
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal();
  };

  const getStatusColor = (status) => {
    const colors = {
      'Draft': 'bg-gray-100 text-gray-700',
      'Submitted': 'bg-blue-100 text-blue-700',
      'Partially Received': 'bg-yellow-100 text-yellow-700',
      'Completed': 'bg-green-100 text-green-700',
      'Cancelled': 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  // ---- Editable Cell Components ----

  // SearchableSelect Cell for Item Name with Stock Info
  const SearchableDescriptionCell = ({ value, itemId, isLastItem }) => {
    const isEditing = editingCell === `${itemId}-name`;
    const [tempValue, setTempValue] = useState(value);
    const [localFilteredItems, setLocalFilteredItems] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef(null);

    // Get purchasable items (items that are purchased, not raw materials only)
    const getPurchasableItems = () => {
      return inventoryItems.filter(item =>
        item.is_purchased === 1 || (!item.is_raw_material && !item.is_manufactured)
      ).slice(0, 10);
    };

    // Sync tempValue with value when it changes from outside
    useEffect(() => {
      if (value !== tempValue && !isEditing) {
        setTempValue(value);
      }
    }, [value, isEditing]);

    const focusTargetCell = (targetItemId, targetField) => {
      setTimeout(() => {
        if (targetField === 'name') {
          setEditingCell(`${targetItemId}-name`);
          setTimeout(() => {
            const el = document.querySelector(`[data-cell-id="${targetItemId}-name"]`);
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

      const purchasableItems = getPurchasableItems();

      if (searchValue.trim()) {
        const matches = purchasableItems.filter(item =>
          item.item_name.toLowerCase().includes(searchValue.toLowerCase()) ||
          item.item_code.toLowerCase().includes(searchValue.toLowerCase())
        );
        setLocalFilteredItems(matches);
        setShowDropdown(matches.length > 0);
        setSelectedIndex(matches.length > 0 ? 0 : -1);
      } else {
        setLocalFilteredItems(purchasableItems);
        setShowDropdown(purchasableItems.length > 0);
        setSelectedIndex(purchasableItems.length > 0 ? 0 : -1);
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
        updateItem(itemId, 'name', tempValue);
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
      const purchasableItems = getPurchasableItems();
      setLocalFilteredItems(purchasableItems);
      setShowDropdown(purchasableItems.length > 0);
      setSelectedIndex(purchasableItems.length > 0 ? 0 : -1);
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
          setEditingCell(`${nextItemId}-name`);
          focusTargetCell(nextItemId, 'name');
        } else if (currentItemIndex === items.length - 1) {
          addNewItem();
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
          setEditingCell(`${prevItemId}-name`);
          focusTargetCell(prevItemId, 'name');
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
          if (isLastField('name') && isLastItem) {
            addNewItem();
          } else {
            const nextField = getNextField('name');
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
          const nextField = getNextField('name');
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
      const inputElement = document.querySelector(`[data-cell-id="${itemId}-name"] input`);
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
          data-cell-id={`${itemId}-name`}
          onClick={() => {
            setEditingCell(`${itemId}-name`);
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
              lastFocusedCellRef.current = `${itemId}-name`;
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
                        {formatCurrency(item.standard_cost || item.purchase_price || 0)}
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
          setEditingCell(`${itemId}-name`);
          setTimeout(() => openDropdown(), 50);
        }}
        onFocus={() => {
          lastFocusedCellRef.current = `${itemId}-name`;
          setTempValue(value || '');
          setEditingCell(`${itemId}-name`);
          setTimeout(() => openDropdown(), 50);
        }}
        onKeyDown={(e) => {
          const currentItemIndex = items.findIndex(item => item.id === itemId);
          if (e.key === 'Enter') {
            e.preventDefault();
            setTempValue(value || '');
            setEditingCell(`${itemId}-name`);
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (currentItemIndex < items.length - 1) {
              focusTargetCell(items[currentItemIndex + 1].id, 'name');
            }
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (currentItemIndex > 0) {
              focusTargetCell(items[currentItemIndex - 1].id, 'name');
            }
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            const nextField = getNextField('name');
            if (nextField) {
              focusTargetCell(itemId, nextField);
            } else if (currentItemIndex < items.length - 1) {
              focusTargetCell(items[currentItemIndex + 1].id, 'name');
            }
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (currentItemIndex > 0) {
              focusTargetCell(items[currentItemIndex - 1].id, 'unit_price');
            }
          } else if (e.key === 'Tab') {
            e.preventDefault();
            const nextField = getNextField('name');
            if (nextField) {
              focusTargetCell(itemId, nextField);
            } else if (isLastItem) {
              addNewItem();
            }
          }
        }}
        className="editable-cell"
        tabIndex={0}
        data-cell-id={`${itemId}-name`}
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
        if (targetField === 'name') {
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

    const fieldOrder = ['name', 'quantity', 'unit_price'];

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
        if (['quantity', 'unit_price'].includes(field)) {
          let newValue = (parseFloat(tempValue) || 0) + 1;
          if (field === 'quantity' && newValue < 0) newValue = 0;
          if (field === 'unit_price' && newValue < 0) newValue = 0;
          setTempValue(newValue);
        }
      }
      // Ctrl+ArrowDown: Decrement value
      else if (e.ctrlKey && e.key === 'ArrowDown') {
        e.preventDefault();
        if (['quantity', 'unit_price'].includes(field)) {
          const currentVal = parseFloat(tempValue) || 0;
          let newValue = currentVal - 1;
          if (field === 'quantity' && newValue < 0) newValue = 0;
          if (field === 'unit_price' && newValue < 0) newValue = 0;
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
              focusTargetCell(items[currentItemIndex + 1].id, 'name');
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
            <option value="Submitted">Submitted</option>
            <option value="Partially Received">Partially Received</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div className="action-right">
          <Button variant="secondary" onClick={() => navigate('/purchase-orders')}>
            Cancel
          </Button>
          {isEditMode && (
            <button
              className="action-btn-secondary"
              onClick={() => navigate(`/purchase-orders/${id}`)}
            >
              <Eye className="action-icon" />
              <span>Preview</span>
            </button>
          )}
          <Button variant="primary" onClick={handleSubmit} loading={mutation.isPending}>
            <Send className="action-icon" />
            {isEditMode ? 'Update' : 'Create'} Purchase Order
          </Button>
        </div>
      </div>

      <div className="invoice-document-modern">
        <div className="invoice-header-modern">
          <div className="header-grid-modern">
            <div className="header-section">
              <h1 className="invoice-title-modern">PURCHASE ORDER</h1>
              <div className="invoice-number-modern">
                <Hash className="hash-icon" />
                <span>{isEditMode ? `PO-${String(id).padStart(4, '0')}` : 'NEW'}</span>
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
              <div className="section-label-modern">SUPPLIER</div>
              <FormInput
                name="supplier_name"
                type="searchable-select"
                value={supplier ? supplier.supplier_name : ''}
                onChange={(e) => {
                  const selected = suppliers.find(s => s.supplier_name === e.target.value);
                  if (selected) handleSelectSupplier(selected);
                }}
                options={suppliers.map(s => ({
                  value: s.supplier_name,
                  label: `${s.supplier_name}${s.supplier_code ? ` (${s.supplier_code})` : ''}`
                }))}
                placeholder="Select supplier..."
                required
                small
              />
            </div>

            <div className="header-section text-right">
              <div className="invoice-total-modern">{formatCurrency(calculateTotal())}</div>
              <div className="invoice-meta-modern">
                <div>
                  <span className="meta-label">PO Date: </span>
                  <input
                    type="date"
                    value={poDate}
                    onChange={(e) => setPoDate(e.target.value)}
                    className="date-input-inline"
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit' }}
                  />
                </div>
                <div>
                  <span className="meta-label">Delivery: </span>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="date-input-inline"
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit' }}
                  />
                </div>
                <div>
                  <span className="meta-label">Warehouse: </span>
                  <select
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    className="date-input-inline"
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit', cursor: 'pointer' }}
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.warehouse_name || w.name}</option>
                    ))}
                  </select>
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
                  <th className="text-left description-col">Item</th>
                  <th className="text-right quantity-col">Qty</th>
                  <th className="text-right rate-col">Unit Price</th>
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
                        value={item.name}
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
                        value={item.unit_price.toFixed(2)}
                        itemId={item.id}
                        field="unit_price"
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

          {/* Totals + Notes - Side by Side */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            {/* Notes - Left Side */}
            <div className="invoice-footer-modern" style={{ flex: 1, minWidth: 0 }}>
              <div>
                <label className="footer-label">NOTES</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="3"
                  className="footer-textarea"
                  placeholder="Additional notes for this purchase order..."
                />
              </div>
            </div>

            {/* Totals Card - Right Side */}
            <div className="totals-breakdown-modern" style={{ width: '280px', flexShrink: 0 }}>
              <div className="total-row-modern">
                <span>Subtotal:</span>
                <span className="total-value">{formatCurrency(calculateSubtotal())}</span>
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

  // ---- Mobile Render (Simple Form) ----
  const renderMobile = () => (
    <div className="po-form-page">
      <div className="form-header">
        <h2>{isEditMode ? 'Edit Purchase Order' : 'New Purchase Order'}</h2>
        <button onClick={() => navigate('/purchase-orders')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
          <X size={24} />
        </button>
      </div>

      <form className="po-form">
        {/* Supplier */}
        <div className="form-section">
          <div className="form-section-header"><h3>Purchase Order Details</h3></div>
          <div className="form-section-content">
            <div className="po-details-grid">
              <div className="po-detail-card">
                <label>Supplier *</label>
                <FormInput
                  name="supplier_name"
                  type="searchable-select"
                  value={supplier ? supplier.supplier_name : ''}
                  onChange={(e) => {
                    const selected = suppliers.find(s => s.supplier_name === e.target.value);
                    if (selected) handleSelectSupplier(selected);
                  }}
                  options={suppliers.map(s => ({
                    value: s.supplier_name,
                    label: `${s.supplier_name}${s.supplier_code ? ` (${s.supplier_code})` : ''}`
                  }))}
                  placeholder="Search supplier..."
                />
              </div>
              <div className="po-detail-card">
                <label>PO Date *</label>
                <FormInput
                  name="po_date"
                  type="date"
                  value={poDate}
                  onChange={(e) => setPoDate(e.target.value)}
                />
              </div>
              <div className="po-detail-card">
                <label>Expected Delivery</label>
                <FormInput
                  name="expected_delivery_date"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </div>
              <div className="po-detail-card">
                <label>Warehouse (for receipt)</label>
                <FormInput
                  name="warehouse_id"
                  type="searchable-select"
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  options={warehouses.map(w => ({
                    value: w.id,
                    label: `${w.warehouse_code} - ${w.warehouse_name}`
                  }))}
                  placeholder="Select warehouse..."
                />
              </div>
              <div className="po-detail-card">
                <label>Status</label>
                <FormInput
                  name="status"
                  type="select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  options={[
                    { value: 'Draft', label: 'Draft' },
                    { value: 'Submitted', label: 'Submitted' }
                  ]}
                  disabled={isEditMode}
                />
              </div>
            </div>

            <div className="notes-row">
              <FormInput
                label="Notes"
                name="notes"
                type="textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="form-section">
          <div className="form-section-header"><h3>Line Items</h3></div>
          <div className="form-section-content">
            <div className="items-header-modern">
              <div className="items-header-left">
                <button
                  type="button"
                  className="add-item-btn-modern"
                  onClick={() => addNewItem()}
                >
                  <Plus size={16} />
                  Add Item
                </button>
              </div>
            </div>

            <div className="items-table-container-modern">
              <table className="items-table-modern">
                <thead>
                  <tr>
                    <th className="serial-col">#</th>
                    <th className="description-col">Item *</th>
                    <th className="quantity-col">Qty *</th>
                    <th className="rate-col">Unit Price *</th>
                    <th className="amount-col">Amount</th>
                    <th className="delete-col"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id}>
                      <td className="serial-col">{index + 1}</td>
                      <td className="invoice-item-cell">
                        <SearchableDescriptionCell
                          value={item.name}
                          itemId={item.id}
                          isLastItem={index === items.length - 1}
                        />
                      </td>
                      <td className="invoice-item-cell">
                        <EditableCell
                          value={item.quantity}
                          itemId={item.id}
                          field="quantity"
                          type="number"
                          isLastItem={index === items.length - 1}
                        />
                      </td>
                      <td className="invoice-item-cell">
                        <EditableCell
                          value={item.unit_price}
                          itemId={item.id}
                          field="unit_price"
                          type="number"
                          isLastItem={index === items.length - 1}
                        />
                      </td>
                      <td className="amount-cell-modern">
                        {formatCurrency(calculateItemTotal(item))}
                      </td>
                      <td className="invoice-item-cell">
                        <button
                          type="button"
                          className="remove-btn-modern"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="trash-icon" size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Totals */}
        <div className="form-section totals-section">
          <div className="totals">
            <div className="totals-row subtotal">
              <span className="label">Subtotal:</span>
              <span className="value">{formatCurrency(calculateTotal())}</span>
            </div>
            <div className="totals-row total">
              <span className="label">Total:</span>
              <span className="value">{formatCurrency(calculateTotal())}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={() => navigate('/purchase-orders')}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            loading={mutation.isPending}
            onClick={() => handleSubmit({ preventDefault: () => {} })}
          >
            {isEditMode ? 'Update' : 'Create'} Purchase Order
          </Button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="po-form-page">
      {isDesktop ? renderDesktop() : renderMobile()}
    </div>
  );

  // ---- Submit Handler ----
  function handleSubmit(e) {
    if (e) e.preventDefault();

    if (!supplier) {
      toast.error('Please select a supplier');
      return;
    }

    const filledItems = items.filter(item => item.item_id || item.name);
    if (filledItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    const payload = {
      supplier_id: supplier.id,
      po_date: poDate,
      expected_delivery_date: deliveryDate || undefined,
      status,
      notes,
      warehouse_id: warehouseId || undefined,
      items: filledItems.map(item => ({
        item_id: item.item_id,
        quantity: item.quantity,
        unit_price: item.unit_price
      }))
    };

    // Validate with schema
    if (!validate(payload)) return;

    mutation.mutate(payload);
  }
}
