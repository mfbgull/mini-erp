import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, ArrowLeft, Plus, Trash2, Edit2 } from 'lucide-react';

import Button from '../../components/common/Button';
import FormInput from '../../components/common/FormInput';
import { PurchaseOrderWizard } from '../../components/purchase-order/PurchaseOrderWizard';
import { useSettings } from '../../context/SettingsContext';
import { useFormValidation } from '../../hooks/useFormValidation';
import { purchaseOrderSchema } from '../../schemas';
import api from '../../utils/api';
import FocusTrap from '../../utils/focusTrap.jsx';

import './PurchaseOrderFormPage.css';

// Helper: generate empty purchase order item row
const createEmptyItemRow = (index) => ({
  id: Date.now() + index,
  item_id: '',
  description: '',
  quantity: 1,
  unit_price: 0
});

// Helper: pad items array to minimum 5 rows
const padItemsToMinimum = (items, min = 5) => {
  if (items.length >= min) return items;
  const padded = [...items];
  const now = Date.now();
  for (let i = items.length; i < min; i++) {
    padded.push({
      id: now + i + 1000,
      item_id: '',
      description: '',
      quantity: 0,
      unit_price: 0
    });
  }
  return padded;
};

export default function PurchaseOrderFormPage({ mode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { formatCurrency } = useSettings();
  const isEditMode = mode === 'edit' && id;
  const [showWizard, setShowWizard] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Show wizard automatically on mobile for create mode
  useEffect(() => {
    if (isMobile && !isEditMode) {
      setShowWizard(true);
    }
  }, [isMobile, isEditMode]);

  const [formData, setFormData] = useState({
    supplier_id: '',
    po_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    warehouse_id: '',
    status: 'Draft',
    notes: ''
  });

  const [items, setItems] = useState(
    padItemsToMinimum([{ id: Date.now(), item_id: '', description: '', quantity: 1, unit_price: 0 }])
  );

  const [editingCell, setEditingCell] = useState(null);

  // Focus the cell when editingCell changes
  useEffect(() => {
    if (editingCell) {
      const el = document.querySelector(`[data-cell-id="${editingCell}"]`);
      if (el) {
        el.focus();
        const input = el.tagName === 'INPUT' ? el : el.querySelector('input, textarea, select');
        if (input && typeof input.focus === 'function') {
          input.focus();
          if (typeof input.select === 'function') input.select();
        }
      }
    }
  }, [editingCell]);

  const lastFocusedCellRef = useRef(null);
  const pendingFocusRef = useRef(null);
  const [newItemId, setNewItemId] = useState(null);

  const [formErrors, setFormErrors] = useState({});
  const { errors: validationErrors, validate, clearErrors } = useFormValidation(purchaseOrderSchema);

  // Fetch suppliers
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const response = await api.get('/suppliers');
      return response.data.data || [];
    }
  });

  // Fetch items - match SalesInvoicePage approach
  const { data: inventoryItems = [], isLoading: itemsLoading } = useQuery({
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

  const getNextField = (currentField) => {
    const fieldOrder = ['description', 'quantity', 'unit_price'];
    const currentIndex = fieldOrder.indexOf(currentField);
    return fieldOrder[currentIndex + 1];
  };

  const isLastField = (field) => {
    return field === 'unit_price';
  };

  const addNewItem = () => {
    const newItemId = Date.now();
    const newItem = {
      id: newItemId,
      item_id: '',
      description: '',
      quantity: 1,
      unit_price: 0
    };
    setItems([...items, newItem]);
    pendingFocusRef.current = newItemId;
    setNewItemId(newItemId);
    return newItemId;
  };

  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        if (field === 'itemId') {
          const selectedItem = items.find(i => i.id === Number(value));
          return {
            ...item,
            item_id: Number(value),
            description: selectedItem?.item_name || item.description,
            unit_price: selectedItem?.standard_cost || selectedItem?.purchase_price || item.unit_price
          };
        } else {
          return { ...item, [field]: field === 'description' ? value : Number(value) || 0 };
        }
      }
      return item;
    }));
  };

  // Searchable Select Cell for Description with Stock Info
  const SearchableDescriptionCell = ({ value, itemId, isLastItem }) => {
    const isEditing = editingCell === `${itemId}-description`;
    const [tempValue, setTempValue] = useState(value);
    const [filteredItems, setFilteredItems] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef(null);

    useEffect(() => {
      if (value !== tempValue && !isEditing) {
        setTempValue(value);
      }
    }, [value, isEditing]);

    const focusTargetCell = (targetItemId, targetField) => {
      setTimeout(() => {
        const el = document.querySelector(`[data-cell-id="${targetItemId}-${targetField}"]`);
        if (el) el.focus();
      }, 0);
    };

    const handleInputChange = (e) => {
      const searchValue = e.target.value;
      setTempValue(searchValue);

      // Show items when typing
      if (!inventoryItems || inventoryItems.length === 0) {
        setFilteredItems([]);
        setShowDropdown(false);
        return;
      }

      if (searchValue.trim()) {
        const matches = inventoryItems.filter(item =>
          item.item_name.toLowerCase().includes(searchValue.toLowerCase()) ||
          item.item_code.toLowerCase().includes(searchValue.toLowerCase())
        );
        setFilteredItems(matches.slice(0, 10));
        setShowDropdown(matches.length > 0);
        setSelectedIndex(matches.length > 0 ? 0 : -1);
      } else {
        setFilteredItems(items.slice(0, 10));
        setShowDropdown(true);
        setSelectedIndex(0);
      }
    };

    const selectItem = (item, moveNext = true) => {
      setItems(prev => prev.map(invItem => {
        if (invItem.id === itemId) {
          return {
            ...invItem,
            item_id: item.id,
            description: item.item_name,
            unit_price: item.standard_cost || item.purchase_price || 0
          };
        }
        return invItem;
      }));

      setTempValue(item.item_name);
      setShowDropdown(false);
      setFilteredItems([]);
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
      setFilteredItems([]);
      setEditingCell(null);
    };

    const closeDropdown = () => {
      setShowDropdown(false);
      setFilteredItems([]);
      setSelectedIndex(-1);
    };

    const openDropdown = () => {
      
      if (!inventoryItems || inventoryItems.length === 0) {
        // If still loading, wait a bit and try again
        if (itemsLoading) {
          
          setTimeout(() => openDropdown(), 100);
          return;
        }
        setFilteredItems([]);
        setShowDropdown(false);
        setSelectedIndex(-1);
        return;
      }
      // Show top 10 items (matching SalesInvoicePage)
      setFilteredItems(inventoryItems.slice(0, 10));
      setShowDropdown(true);
      setSelectedIndex(0);
      
    };

    const handleKeyDown = (e) => {
      if (showDropdown && filteredItems.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const newIndex = selectedIndex < filteredItems.length - 1 ? selectedIndex + 1 : 0;
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
          const newIndex = selectedIndex > 0 ? selectedIndex - 1 : filteredItems.length - 1;
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
          if (selectedIndex >= 0 && filteredItems[selectedIndex]) {
            selectItem(filteredItems[selectedIndex], true);
          }
          return;
        } else if (e.key === 'Escape') {
          e.preventDefault();
          closeDropdown();
          inputRef.current?.focus();
          return;
        } else if (e.key === 'Tab') {
          if (selectedIndex >= 0 && filteredItems[selectedIndex]) {
            e.preventDefault();
            selectItem(filteredItems[selectedIndex], true);
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
        e.stopPropagation();
        // Always open dropdown on ArrowDown
        openDropdown();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const currentItemIndex = items.findIndex(item => item.id === itemId);
        if (currentItemIndex > 0) {
          const prevItemId = items[currentItemIndex - 1].id;
          handleSave();
          setEditingCell(`${prevItemId}-description`);
          focusTargetCell(prevItemId, 'description');
        } else if (currentItemIndex === 0) {
          handleSave();
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
        if (showDropdown && selectedIndex >= 0 && filteredItems[selectedIndex]) {
          selectItem(filteredItems[selectedIndex], true);
        } else {
          handleSave();
          if (isLastField('description') && isLastItem) {
            const newItemId = addNewItem();
            setNewItemId(newItemId);
          } else {
            const nextField = getNextField('description');
            if (nextField) {
              setTimeout(() => setEditingCell(`${itemId}-${nextField}`), 0);
            }
          }
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        if (showDropdown && selectedIndex >= 0 && filteredItems[selectedIndex]) {
          selectItem(filteredItems[selectedIndex], true);
        } else {
          handleSave();
          const nextField = getNextField('description');
          if (nextField) {
            setTimeout(() => setEditingCell(`${itemId}-${nextField}`), 0);
          } else if (isLastItem) {
            const newItemId = addNewItem();
            setNewItemId(newItemId);
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
          if (showDropdown && selectedIndex >= 0 && filteredItems[selectedIndex]) {
            selectItem(filteredItems[selectedIndex], false);
          } else {
            handleSave();
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
        minWidth: `${inputRect.width}px`
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
          onClick={(e) => {
            e.stopPropagation();
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
            autoFocus
            className="editable-input"
            placeholder="Type to search items..."
          />
          {showDropdown && (
            <div className="item-dropdown" style={dropdownStyle}>
              {filteredItems.length > 0 ? (
                filteredItems.map((item, index) => (
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
          setEditingCell(`${itemId}-description`);
          setTimeout(() => openDropdown(), 10);
        }}
        onFocus={() => {
          
          lastFocusedCellRef.current = `${itemId}-description`;
          setTempValue(value || '');
          setEditingCell(`${itemId}-description`);
          setTimeout(() => {
            openDropdown();
          }, 10);
        }}
        onKeyDown={(e) => {
          const currentItemIndex = items.findIndex(item => item.id === itemId);
          const isLastItemCurrent = currentItemIndex === items.length - 1;
          
          const focusTargetCell = (targetItemId, targetField) => {
            setTimeout(() => {
              const el = document.querySelector(`[data-cell-id="${targetItemId}-${targetField}"]`);
              if (el) el.focus();
            }, 0);
          };

          if (e.key === 'Enter') {
            e.preventDefault();
            setTempValue(value || '');
            setEditingCell(`${itemId}-description`);
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            
            // First enter edit mode and open dropdown
            setEditingCell(`${itemId}-description`);
            setTempValue(value || '');
            // Delay dropdown to allow re-render
            setTimeout(() => openDropdown(), 10);
            // Then optionally move to next row after a delay if not last item
            if (currentItemIndex < items.length - 1) {
              const nextItemId = items[currentItemIndex + 1].id;
              setTimeout(() => {
                focusTargetCell(nextItemId, 'description');
              }, 150);
            }
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (currentItemIndex > 0) {
              const prevItemId = items[currentItemIndex - 1].id;
              focusTargetCell(prevItemId, 'description');
            }
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            const nextField = getNextField('description');
            if (nextField) {
              focusTargetCell(itemId, nextField);
            } else if (currentItemIndex < items.length - 1) {
              const nextItemId = items[currentItemIndex + 1].id;
              focusTargetCell(nextItemId, 'description');
            }
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (currentItemIndex > 0) {
              const prevItemId = items[currentItemIndex - 1].id;
              focusTargetCell(prevItemId, 'unit_price');
            }
          } else if (e.key === 'Tab') {
            e.preventDefault();
            const nextField = getNextField('description');
            if (nextField) {
              focusTargetCell(itemId, nextField);
            } else if (isLastItemCurrent) {
              const newItemId = addNewItem();
              setNewItemId(newItemId);
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

    const moveToCell = (rowOffset, colOffset) => {
      const currentItemIndex = items.findIndex(item => item.id === itemId);
      const fieldOrder = ['description', 'quantity', 'unit_price'];
      const currentFieldIndex = fieldOrder.indexOf(field);

      if (rowOffset !== 0) {
        const newItemIndex = currentItemIndex + rowOffset;
        if (newItemIndex >= 0 && newItemIndex < items.length) {
          const newItemId = items[newItemIndex].id;
          handleSave();
          setTimeout(() => setEditingCell(`${newItemId}-${field}`), 0);
        } else if (rowOffset > 0 && newItemIndex >= items.length) {
          handleSave();
          const newItemId = addNewItem();
          setNewItemId(newItemId);
        }
      }

      if (colOffset !== 0) {
        const newFieldIndex = currentFieldIndex + colOffset;
        if (newFieldIndex >= 0 && newFieldIndex < fieldOrder.length) {
          handleSave();
          setTimeout(() => setEditingCell(`${itemId}-${fieldOrder[newFieldIndex]}`), 0);
        }
      }
    };

    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'ArrowUp') {
        e.preventDefault();
        if (['quantity', 'unit_price'].includes(field)) {
          let newValue = (parseFloat(tempValue) || 0) + 1;
          if (field === 'quantity' && newValue < 0) newValue = 0;
          setTempValue(newValue);
        }
      }
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
          const newItemId = addNewItem();
          setNewItemId(newItemId);
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
          const newItemId = addNewItem();
          setNewItemId(newItemId);
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
          autoFocus
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
          const fieldOrder = ['description', 'quantity', 'unit_price'];
          const currentFieldIndex = fieldOrder.indexOf(field);
          const currentItemIndex = items.findIndex(item => item.id === itemId);

          const focusTargetCell = (targetItemId, targetField) => {
            setTimeout(() => {
              const el = document.querySelector(`[data-cell-id="${targetItemId}-${targetField}"]`);
              if (el) el.focus();
            }, 0);
          };

          if (e.key === 'Enter') {
            e.preventDefault();
            setTempValue(value);
            setEditingCell(`${itemId}-${field}`);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (currentItemIndex > 0) {
              const prevItemId = items[currentItemIndex - 1].id;
              focusTargetCell(prevItemId, field);
            }
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (currentItemIndex < items.length - 1) {
              const nextItemId = items[currentItemIndex + 1].id;
              focusTargetCell(nextItemId, field);
            }
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (currentFieldIndex > 0) {
              focusTargetCell(itemId, fieldOrder[currentFieldIndex - 1]);
            } else if (currentItemIndex > 0) {
              const prevItemId = items[currentItemIndex - 1].id;
              focusTargetCell(prevItemId, 'unit_price');
            }
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            if (currentFieldIndex < fieldOrder.length - 1) {
              focusTargetCell(itemId, fieldOrder[currentFieldIndex + 1]);
            } else if (currentItemIndex < items.length - 1) {
              const nextItemId = items[currentItemIndex + 1].id;
              focusTargetCell(nextItemId, 'description');
            }
          } else if (e.key === 'Tab') {
            e.preventDefault();
            const nextField = getNextField(field);
            if (nextField) {
              focusTargetCell(itemId, nextField);
            } else if (isLastItem) {
              const newItemId = addNewItem();
              setNewItemId(newItemId);
            } else {
              const nextItemId = items[currentItemIndex + 1].id;
              focusTargetCell(nextItemId, 'description');
            }
          }
        }}
        className="editable-cell"
        tabIndex={0}
        data-cell-id={`${itemId}-${field}`}
      >
        {type === 'number' && value === 0 ? '' : value}
        <Edit2 className="edit-icon" />
      </div>
    );
  };

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

  const totalAmount = calculateTotal();

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

    // Prepare data for validation
    const validItems = items
      .filter(item => item.item_id && item.quantity && item.unit_price)
      .map(item => ({
        item_id: parseInt(item.item_id),
        quantity: parseFloat(item.quantity),
        unit_price: parseFloat(item.unit_price)
      }));

    const dataToValidate = {
      ...formData,
      supplier_id: parseInt(formData.supplier_id),
      warehouse_id: formData.warehouse_id ? parseInt(formData.warehouse_id) : null,
      items: validItems
    };

    if (!validate(dataToValidate)) return;

    const data = {
      ...formData,
      supplier_id: parseInt(formData.supplier_id),
      warehouse_id: formData.warehouse_id ? parseInt(formData.warehouse_id) : null,
      items: validItems
    };

    mutation.mutate(data);
  };

  return (
    <div className="po-form-page">
      <div className="page-header">
        <h1>{isEditMode ? 'Edit Purchase Order' : 'Create Purchase Order'}</h1>
      </div>

      <FocusTrap active={true}>
      <form onSubmit={handleSubmit} className="po-form">
        {/* Header Section */}
        <div className="form-section">
          <div className="form-section-header">
            <h3>Purchase Order Details</h3>
          </div>
          <div className="form-section-content">
            <div className="po-details-grid">
              <div className="po-detail-card">
                <label>PO Number</label>
                <FormInput
                  name="po_no"
                  type="text"
                  value={isEditMode ? 'Auto-generated' : 'Auto-generated'}
                  disabled
                />
              </div>
              
              <div className="po-detail-card">
                <label>Status *</label>
                <FormInput
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
              
              <div className="po-detail-card">
                <label>Supplier *</label>
                <FormInput
                  name="supplier_id"
                  type="searchable-select"
                  value={formData.supplier_id}
                  onChange={handleHeaderChange}
                  options={suppliers.map(s => ({ value: s.id, label: s.supplier_name }))}
                  placeholder="Search suppliers..."
                />
              </div>
              
              <div className="po-detail-card">
                <label>PO Date *</label>
                <FormInput
                  name="po_date"
                  type="date"
                  value={formData.po_date}
                  onChange={handleHeaderChange}
                />
              </div>
              
              <div className="po-detail-card">
                <label>Expected Delivery</label>
                <FormInput
                  name="expected_delivery_date"
                  type="date"
                  value={formData.expected_delivery_date}
                  onChange={handleHeaderChange}
                />
              </div>
              
              <div className="po-detail-card">
                <label>Warehouse (for receipt)</label>
                <FormInput
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
            </div>
            
            <div className="notes-row">
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
          </div>
        </div>

        {/* Line Items Section */}
        <div className="form-section">
          <div className="form-section-header">
            <h3>Line Items</h3>
          </div>
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
                  {items.map((item, index) => {
                    const itemTotal = calculateItemTotal(item);
                    return (
                      <tr key={item.id}>
                        <td className="serial-col">{index + 1}</td>
                        <td className="invoice-item-cell">
                          <SearchableDescriptionCell
                            value={item.description}
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
                          {formatCurrency(itemTotal)}
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Totals Section */}
        <div className="form-section totals-section">
          <div className="totals">
            <div className="totals-row subtotal">
              <span className="label">Subtotal:</span>
              <span className="value">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="totals-row total">
              <span className="label">Total:</span>
              <span className="value">{formatCurrency(totalAmount)}</span>
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
            {formData.status === 'Draft' ? 'Save Draft' : 'Submit'}
          </Button>
        </div>
      </form>
      </FocusTrap>

      {/* Mobile Wizard */}
      <PurchaseOrderWizard
        isOpen={showWizard}
        onClose={() => {
          setShowWizard(false);
          navigate('/purchase-orders');
        }}
      />
    </div>
  );
}
