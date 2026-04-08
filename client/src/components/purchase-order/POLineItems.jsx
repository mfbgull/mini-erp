import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { X, Search, Plus, Minus, ChevronUp, ChevronDown, MoreVertical, Edit2, Trash2 } from 'lucide-react';

import Button from '../../components/common/Button';

import './POLineItems.css';

export default function POLineItems({
  items,
  setItems,
  inventoryItems = [],
  formatCurrency,
  onItemSelect
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [recentItems, setRecentItems] = useState([]);

  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [isItemsExpanded, setIsItemsExpanded] = useState(true);
  const [contextMenu, setContextMenu] = useState(null);

  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const contextMenuRef = useRef(null);

  // Load recent items when form opens
  useEffect(() => {
    if (isFormExpanded && !editingItem) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
      
      // Show recent items (last 10 from inventoryItems)
      const recent = inventoryItems.slice(0, 10);
      setRecentItems(recent);
      setSearchResults(recent);
      setShowDropdown(true);
    }
  }, [isFormExpanded, editingItem, inventoryItems]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search items
  const handleSearch = (query) => {
    setSearchQuery(query);
    setHighlightedIndex(-1);

    if (query.trim().length < 2) {
      setSearchResults(recentItems);
      setShowDropdown(true);
      return;
    }

    setIsSearching(true);
    const filtered = inventoryItems.filter(item => 
      item.item_name?.toLowerCase().includes(query.toLowerCase()) ||
      item.item_code?.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(filtered);
    setShowDropdown(true);
    setIsSearching(false);
  };

  // Select item from search
  const handleSelectItem = async (item) => {
    setSelectedItem(item);
    setSearchQuery(`${item.item_code} - ${item.item_name}`);
    setUnitPrice(item.standard_cost || item.purchase_price || 0);
    setShowDropdown(false);
    setHighlightedIndex(-1);
    
    // Call the callback if provided (for warehouse suggestion)
    if (onItemSelect) {
      onItemSelect(item);
    }
    
    setTimeout(() => searchInputRef.current?.focus(), 0);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showDropdown || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && searchResults[highlightedIndex]) {
          handleSelectItem(searchResults[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Add item to PO
  const handleAddItem = () => {
    if (!selectedItem) {
      toast.error('Please select an item');
      return;
    }

    if (quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    const newItem = {
      id: Date.now(),
      item_id: selectedItem.id,
      item_name: selectedItem.item_name,
      item_code: selectedItem.item_code,
      quantity,
      unit_price: unitPrice
    };

    setItems([...items, newItem]);
    toast.success('Item added');
    resetForm();
    setIsFormExpanded(false);
  };

  // Update an existing item
  const handleUpdateItem = () => {
    if (!editingItem) return;

    setItems(items.map(item =>
      item.id === editingItem.id
        ? { ...item, quantity, unit_price: unitPrice }
        : item
    ));

    toast.success('Item updated');
    resetForm();
    setIsFormExpanded(false);
  };

  // Delete an item
  const handleDeleteItem = (item) => {
    if (items.length > 1) {
      setItems(items.filter(i => i.id !== item.id));
      toast.success('Item removed');
    }
    setContextMenu(null);
  };

  // Edit an existing item
  const handleEditItem = (item) => {
    const inventoryItem = inventoryItems.find(i => i.id === item.item_id);
    setEditingItem(item);
    setSelectedItem(inventoryItem);
    setSearchQuery(`${item.item_code} - ${item.item_name}`);
    setQuantity(item.quantity);
    setUnitPrice(item.unit_price);
    setContextMenu(null);
    setIsFormExpanded(true);
    setTimeout(() => searchInputRef.current?.focus(), 0);
  };

  // Show context menu
  const showContextMenu = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.target.getBoundingClientRect();
    setContextMenu({ item, x: rect.right, y: rect.bottom });
  };

  // Reset form
  const resetForm = () => {
    setSelectedItem(null);
    setSearchQuery('');
    setQuantity(1);
    setUnitPrice(0);
    setShowDropdown(false);
    setHighlightedIndex(-1);
    setEditingItem(null);
  };

  // Calculate item total
  const calculateItemTotal = (item) => {
    return (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
  };

  // Calculate total amount
  const totalAmount = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);

  return (
    <div className="po-line-items">
      {/* Added Items List */}
      {items.length > 0 && (
        <div className="po-added-items">
          <div
            className="po-added-items-header"
            onClick={() => setIsItemsExpanded(!isItemsExpanded)}
          >
            <span className="po-added-items-title">Line Items ({items.length})</span>
            <span className="po-added-items-total">{formatCurrency(totalAmount)}</span>
            {isItemsExpanded ? (
              <ChevronUp size={18} className="po-expand-icon" />
            ) : (
              <ChevronDown size={18} className="po-expand-icon" />
            )}
          </div>
          <div className={`po-added-items-list ${isItemsExpanded ? 'po-expanded' : 'po-collapsed'}`}>
            {items.map((item, index) => (
              <div
                key={item.id}
                className="po-added-item"
                onClick={() => handleEditItem(item)}
                onContextMenu={(e) => showContextMenu(e, item)}
              >
                <div className="po-added-item-serial">{index + 1}.</div>
                <div className="po-added-item-info">
                  <div className="po-added-item-name">{item.item_name}</div>
                  <div className="po-added-item-details">
                    <span>Code: {item.item_code}</span>
                    <span>Qty: {item.quantity}</span>
                    <span>Price: {formatCurrency(item.unit_price)}</span>
                  </div>
                </div>
                <div className="po-added-item-total">{formatCurrency(calculateItemTotal(item))}</div>
                <button
                  className="po-added-item-menu"
                  onClick={(e) => showContextMenu(e, item)}
                >
                  <MoreVertical size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="po-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            className="po-context-menu-item"
            onClick={() => handleEditItem(contextMenu.item)}
          >
            <Edit2 size={16} />
            Edit
          </button>
          <button
            className="po-context-menu-item danger"
            onClick={() => handleDeleteItem(contextMenu.item)}
            disabled={items.length === 1}
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      )}

      {/* Add Item Button / Form */}
      {!isFormExpanded && (
        <Button
          variant="primary"
          className="po-add-item-btn"
          onClick={() => setIsFormExpanded(true)}
        >
          <Plus size={18} />
          Add Line Item
        </Button>
      )}

      {/* Add Item Form */}
      {isFormExpanded && (
        <>
          <div className="po-sheet-overlay" onClick={() => {
            resetForm();
            setIsFormExpanded(false);
          }} />
          <div className="po-add-item-sheet">
            <div className="po-sheet-drag-handle" onClick={() => {
              resetForm();
              setIsFormExpanded(false);
            }} />

            <div className="po-add-item-header">
              <span className="po-add-item-title">{editingItem ? 'Edit Line Item' : 'Add Line Item'}</span>
              <ChevronUp size={20} className="po-expand-icon" />
            </div>

            <div className="po-add-item-content">
              {/* Item Search */}
              <div className="po-form-section">
                <label className="po-label">Item</label>
                <div className="po-search-container">
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="po-input"
                    placeholder="Search items... (type 2+ chars)"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => searchQuery.length >= 2 && searchResults.length > 0 && setShowDropdown(true)}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                  />
                  <Search className="po-search-icon" size={18} />

                  {/* Search Results Dropdown */}
                  {showDropdown && (
                    <div ref={dropdownRef} className="po-item-search-dropdown">
                      {isSearching && (
                        <div className="po-item-search-empty">
                          <div className="po-spinner"></div>
                          Searching...
                        </div>
                      )}

                      {!isSearching && searchQuery.trim().length < 2 && searchResults.length > 0 && (
                        <div className="po-item-search-header">Recent Items</div>
                      )}

                      {!isSearching && searchResults.map((item, index) => (
                        <div
                          key={item.id}
                          className={`po-item-search-result ${index === highlightedIndex ? 'highlighted' : ''}`}
                          onClick={() => handleSelectItem(item)}
                          onMouseEnter={() => setHighlightedIndex(index)}
                        >
                          <div className="po-item-search-name">{item.item_code} - {item.item_name}</div>
                          <div className="po-item-search-details">
                            <span>Stock: {item.current_stock || 0}</span>
                            <span>{formatCurrency(item.standard_cost || item.purchase_price || 0)}</span>
                          </div>
                        </div>
                      ))}

                      {!isSearching && searchResults.length === 0 && searchQuery.length >= 2 && (
                        <div className="po-item-search-empty">No items found</div>
                      )}

                      {!isSearching && searchResults.length > 0 && (
                        <div className="po-search-hints">
                          <span className="po-search-hint-key">
                            <kbd>↑</kbd><kbd>↓</kbd> Navigate
                          </span>
                          <span className="po-search-hint-key">
                            <kbd>Enter</kbd> Select
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Quantity & Unit Price Row */}
              <div className="po-inline-row">
                <div className="po-inline-item po-inline-50">
                  <label className="po-label">Quantity</label>
                  <div className="po-qty-control">
                    <button
                      type="button"
                      className="po-qty-btn"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus size={18} />
                    </button>
                    <input
                      type="number"
                      className="po-qty-input"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseFloat(e.target.value) || 1))}
                      min="1"
                      step="0.001"
                    />
                    <button
                      type="button"
                      className="po-qty-btn"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                <div className="po-inline-item po-inline-50">
                  <label className="po-label">Unit Price</label>
                  <input
                    type="number"
                    className="po-input"
                    placeholder="0.00"
                    value={unitPrice || ''}
                    onChange={(e) => setUnitPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Preview Amount */}
              <div className="po-preview-row">
                <div className="po-preview-label">Line Total</div>
                <div className="po-preview-amount">
                  {formatCurrency(quantity * unitPrice)}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="po-form-actions">
                <Button
                  type="button"
                  variant="secondary"
                  className="po-btn-half"
                  onClick={() => {
                    resetForm();
                    setIsFormExpanded(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  className="po-btn-half"
                  onClick={editingItem ? handleUpdateItem : handleAddItem}
                  disabled={!selectedItem}
                >
                  {editingItem ? 'Update' : 'Add'}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
