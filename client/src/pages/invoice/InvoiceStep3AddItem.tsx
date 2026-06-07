import { useState, useEffect, useRef, KeyboardEvent, useCallback } from 'react';
import toast from 'react-hot-toast';

import { Search, Plus, Minus, Check, Edit2, Trash2, MoreVertical, ChevronDown, ChevronUp, List, PackagePlus, ArrowRight } from 'lucide-react';

import { useInvoice, InvoiceItem } from '../../context/InvoiceContext';
import { mobileInvoiceApi } from '../../utils/invoiceApi';
import '../../styles/pages/invoice.css';

export default function InvoiceStep3AddItem() {
  const { dispatch, items, goToStep, customer } = useInvoice();
  
  // ── Form state ──
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [recentItems, setRecentItems] = useState<any[]>([]);
  
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [taxRates, setTaxRates] = useState<any[]>([]);
  
  // Item context menu
  const [contextMenu, setContextMenu] = useState<{ item: InvoiceItem; x: number; y: number } | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // ── UI view state ──
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [isItemsExpanded, setIsItemsExpanded] = useState(true);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  
  // Track the most recently added item id for flash highlight
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  
  // Track if we just arrived from step 2 to auto-expand form
  const [justArrived, setJustArrived] = useState(true);
  
  // Customer search in dialog
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState<any[]>([]);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const customerDialogInputRef = useRef<HTMLInputElement>(null);

  // ── Load tax rates ──
  useEffect(() => {
    const loadTaxRates = async () => {
      try {
        const response = await mobileInvoiceApi.getTaxRates();
        if (response.success) {
          setTaxRates(response.data);
          const defaultTax = response.data.find((t: any) => t.is_default);
          if (defaultTax) setTaxRate(defaultTax.rate);
        }
      } catch (_error) {
        setTaxRates([
          { id: 1, name: 'No Tax', rate: 0 },
          { id: 2, name: 'GST 10%', rate: 10 },
          { id: 3, name: 'GST 15%', rate: 15 }
        ]);
      }
    };
    loadTaxRates();
  }, []);

  // ── Auto-expand form when arriving from step 2 with no items ──
  useEffect(() => {
    if (justArrived && items.length === 0) {
      setIsFormExpanded(true);
      setJustArrived(false);
    }
  }, [justArrived, items.length]);

  // ── Close context menu on click outside ──
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Focus search input + load recent items when form opens ──
  useEffect(() => {
    if (isFormExpanded && !editingItem) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
      const loadRecentItems = async () => {
        try {
          const response = await mobileInvoiceApi.searchItems('', 10);
          if (response.success) {
            setRecentItems(response.data || []);
            setSearchResults(response.data || []);
            setShowDropdown(true);
          }
        } catch (_error) {
          // silent
        }
      };
      loadRecentItems();
    }
  }, [isFormExpanded, editingItem]);

  // ── Search items ──
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    setHighlightedIndex(-1);
    
    if (query.trim().length < 2) {
      setSearchResults(recentItems);
      setShowDropdown(true);
      return;
    }

    setIsSearching(true);
    try {
      const response = await mobileInvoiceApi.searchItems(query);
      if (response.success) {
        setSearchResults(response.data || []);
        setShowDropdown(true);
      }
    } catch (_error) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [recentItems]);

  // ── Select item from search ──
  const handleSelectItem = useCallback((item: any) => {
    setSelectedItem(item);
    setSearchQuery(item.item_name);
    setUnitPrice(item.price || item.standard_selling_price || 0);
    setShowDropdown(false);
    setHighlightedIndex(-1);
    setTimeout(() => searchInputRef.current?.focus(), 0);
  }, []);

  // ── Keyboard navigation ──
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => prev < searchResults.length - 1 ? prev + 1 : 0);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : searchResults.length - 1);
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

  // ── Reset form fields (but do NOT collapse the form) ──
  const resetFormFields = useCallback(() => {
    setSelectedItem(null);
    setSearchQuery('');
    setQuantity(1);
    setUnitPrice(0);
    setTaxRate(taxRates.find((t: any) => t.is_default)?.rate || 0);
    setDiscount(0);
    setShowDropdown(false);
    setHighlightedIndex(-1);
    setEditingItem(null);
    // Keep recentItems for next search
  }, [taxRates]);

  // ── Full reset (clear + collapse) ──
  const cancelForm = useCallback(() => {
    resetFormFields();
    setIsFormExpanded(false);
    setJustArrived(false);
    setRecentItems([]);
  }, [resetFormFields]);

  // ── Add item to invoice and KEEP form open for next item ──
  const handleAddItem = useCallback(() => {
    if (!selectedItem) {
      toast.error('Please select an item');
      return;
    }

    if (quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    const amount = quantity * unitPrice * (1 - discount / 100) * (1 + taxRate / 100);
    const newId = Date.now().toString();

    dispatch({
      type: 'ADD_ITEM',
      payload: {
        id: newId,
        itemId: selectedItem.id,
        name: selectedItem.item_name,
        quantity,
        unitPrice,
        taxRate,
        discount,
        amount
      }
    });

    // Flash highlight on the newly added item
    setLastAddedId(newId);
    setTimeout(() => setLastAddedId(null), 1200);

    toast.success(`${selectedItem.item_name} added`);
    
    // Reset form fields but KEEP form expanded for quick next addition
    resetFormFields();
    
    // Refocus the search input so user can type the next item
    setTimeout(() => searchInputRef.current?.focus(), 100);
  }, [selectedItem, quantity, unitPrice, taxRate, discount, dispatch, resetFormFields]);

  // ── Add item AND go to step 4 (Add & Continue) ──
  const handleAddAndContinue = useCallback(() => {
    if (!selectedItem && items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    // If there's a partially filled item, add it first
    if (selectedItem && quantity > 0) {
      const amount = quantity * unitPrice * (1 - discount / 100) * (1 + taxRate / 100);
      dispatch({
        type: 'ADD_ITEM',
        payload: {
          id: Date.now().toString(),
          itemId: selectedItem.id,
          name: selectedItem.item_name,
          quantity,
          unitPrice,
          taxRate,
          discount,
          amount
        }
      });
    }

    if (items.length === 0 && !selectedItem) {
      toast.error('Please add at least one item');
      return;
    }

    goToStep(4);
  }, [selectedItem, quantity, unitPrice, taxRate, discount, items.length, dispatch, goToStep]);

  // ── Edit an existing item ──
  const handleEditItem = useCallback((item: InvoiceItem) => {
    setEditingItem(item);
    setSelectedItem({ id: item.itemId, item_name: item.name, price: item.unitPrice });
    setSearchQuery(item.name);
    setQuantity(item.quantity);
    setUnitPrice(item.unitPrice);
    setTaxRate(item.taxRate);
    setDiscount(item.discount || 0);
    setContextMenu(null);
    setIsFormExpanded(true);
    
    setTimeout(() => searchInputRef.current?.focus(), 0);
  }, []);

  // ── Update an existing item ──
  const handleUpdateItem = useCallback(() => {
    if (!editingItem) return;

    const amount = quantity * unitPrice * (1 - discount / 100) * (1 + taxRate / 100);

    dispatch({
      type: 'UPDATE_ITEM',
      payload: {
        id: editingItem.id,
        updates: { quantity, unitPrice, taxRate, discount, amount }
      }
    });

    toast.success('Item updated');
    resetFormFields();
    setIsFormExpanded(false);
    setJustArrived(false);
  }, [editingItem, quantity, unitPrice, taxRate, discount, dispatch, resetFormFields]);

  // ── Delete an item ──
  const handleDeleteItem = useCallback((item: InvoiceItem) => {
    if (confirm('Delete this item?')) {
      dispatch({ type: 'DELETE_ITEM', payload: item.id });
      toast.success('Item deleted');
    }
    setContextMenu(null);
  }, [dispatch]);

  // ── Context menu ──
  const showContextMenu = (e: React.MouseEvent, item: InvoiceItem) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setContextMenu({ item, x: Math.min(rect.right, window.innerWidth - 150), y: rect.bottom });
  };

  // ── Customer search for dialog ──
  const handleCustomerSearch = useCallback(async (query: string) => {
    setCustomerSearchQuery(query);
    if (query.trim().length < 2) {
      setCustomerSearchResults([]);
      return;
    }
    setIsSearchingCustomers(true);
    try {
      const response = await mobileInvoiceApi.searchCustomers(query);
      if (response.success) setCustomerSearchResults(response.data || []);
    } catch (_error) {
      setCustomerSearchResults([]);
    } finally {
      setIsSearchingCustomers(false);
    }
  }, []);

  const handleSelectCustomer = useCallback((customerData: any) => {
    dispatch({
      type: 'SET_CUSTOMER',
      payload: {
        id: customerData.id,
        name: customerData.customer_name,
        email: customerData.email || '',
        phone: customerData.phone || '',
        balance: 0
      }
    });
    setShowCustomerDialog(false);
    setCustomerSearchQuery('');
    setCustomerSearchResults([]);
    toast.success('Customer updated');
  }, [dispatch]);

  const openCustomerDialog = useCallback(() => {
    setShowCustomerDialog(true);
    setCustomerSearchQuery(customer?.name || '');
    setTimeout(() => customerDialogInputRef.current?.focus(), 100);
  }, [customer]);

  // ── Computed values ──
  const previewAmount = quantity * unitPrice * (1 - discount / 100) * (1 + taxRate / 100);
  const totalAmount = items.reduce((sum: number, item: InvoiceItem) => sum + (item.amount || 0), 0);
  const hasFormChanges = selectedItem && quantity > 0;

  // ── Continue to next step ──
  const handleContinue = () => {
    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }
    goToStep(4);
  };

  return (
    <div className="miw-step-3">
      {/* ── Customer Info Card ── */}
      {customer && (
        <div className="miw-customer-info-card" onClick={openCustomerDialog}>
          <div className="miw-customer-info-content">
            <span className="miw-customer-info-label">Customer: </span>
            <span className="miw-customer-info-name">{customer.name}</span>
            {customer.email && <span className="miw-customer-info-contact"> ({customer.email})</span>}
          </div>
        </div>
      )}

      {/* ── Added Items List ── */}
      {items.length > 0 && (
        <div className="miw-added-items">
          <div 
            className="miw-added-items-header"
            onClick={() => setIsItemsExpanded(!isItemsExpanded)}
          >
            <div className="miw-added-items-title-row">
              <List size={16} className="miw-icon-gray" />
              <span className="miw-added-items-title">Items ({items.length})</span>
            </div>
            <div className="miw-added-items-header-right">
              <span className="miw-added-items-total">${totalAmount.toFixed(2)}</span>
              {isItemsExpanded ? (
                <ChevronUp size={18} className="miw-expand-icon" />
              ) : (
                <ChevronDown size={18} className="miw-expand-icon" />
              )}
            </div>
          </div>
          <div
            className={`miw-added-items-list ${isItemsExpanded ? 'miw-items-list-expanded' : 'miw-items-list-collapsed'}`}
          >
            {items.map((item: InvoiceItem, index: number) => (
              <div 
                key={item.id} 
                className={`miw-added-item ${lastAddedId === item.id ? 'miw-added-item-flash' : ''}`}
                onClick={() => handleEditItem(item)}
                onContextMenu={(e) => showContextMenu(e, item)}
              >
                <div className="miw-added-item-serial">{index + 1}.</div>
                <div className="miw-added-item-info">
                  <div className="miw-added-item-name">{item.name}</div>
                  <div className="miw-added-item-details">
                    <span>Qty: {item.quantity}</span>
                    {item.discount > 0 && <span className="miw-discount-badge">-{item.discount}%</span>}
                    <span>Tax: {item.taxRate}%</span>
                  </div>
                </div>
                <div className="miw-added-item-total">${item.amount.toFixed(2)}</div>
                <button 
                  className="miw-added-item-menu"
                  onClick={(e) => showContextMenu(e, item)}
                  aria-label="Item options"
                >
                  <MoreVertical size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Context Menu ── */}
      {contextMenu && (
        <div 
          ref={contextMenuRef}
          className="miw-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button 
            className="miw-context-menu-item"
            onClick={() => handleEditItem(contextMenu.item)}
          >
            <Edit2 size={16} />
            Edit
          </button>
          <button 
            className="miw-context-menu-item danger"
            onClick={() => handleDeleteItem(contextMenu.item)}
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      )}

      {/* ── Customer Change Dialog ── */}
      {showCustomerDialog && (
        <>
          <div className="miw-sheet-overlay" onClick={() => setShowCustomerDialog(false)} />
          <div className="miw-customer-dialog">
            <div className="miw-sheet-drag-handle" onClick={() => setShowCustomerDialog(false)} />
            <div className="miw-customer-dialog-header">
              <span className="miw-customer-dialog-title">Change Customer</span>
              <button className="miw-sheet-close" onClick={() => setShowCustomerDialog(false)}>×</button>
            </div>
            <div className="miw-customer-dialog-content">
              <input
                ref={customerDialogInputRef}
                type="text"
                className="miw-input"
                placeholder="Search customers... (type 2+ chars)"
                value={customerSearchQuery}
                onChange={(e) => handleCustomerSearch(e.target.value)}
                autoComplete="off"
              />
              
              {customerSearchResults.length > 0 && (
                <div className="miw-customer-dialog-results">
                  {customerSearchResults.map((c: any) => (
                    <div
                      key={c.id}
                      className="miw-customer-dialog-item"
                      onClick={() => handleSelectCustomer(c)}
                    >
                      <div className="miw-customer-dialog-name">{c.customer_name}</div>
                      <div className="miw-customer-dialog-code">{c.customer_code}</div>
                    </div>
                  ))}
                </div>
              )}
              
              {!isSearchingCustomers && customerSearchQuery.length >= 2 && customerSearchResults.length === 0 && (
                <div className="miw-customer-dialog-empty">No customers found</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Add Item Button (when form is collapsed) ── */}
      {!isFormExpanded && items.length > 0 && (
        <div className="miw-fab-container">
          <button
            className="miw-btn miw-btn-primary miw-btn-add-item"
            onClick={() => {
              resetFormFields();
              setIsFormExpanded(true);
              setJustArrived(false);
            }}
          >
            <Plus size={18} />
            Add Another Item
          </button>
        </div>
      )}

      {/* ── Add Item Form Bottom Sheet ── */}
      {isFormExpanded && (
        <>
          <div className="miw-sheet-overlay" onClick={cancelForm} />
          <div className="miw-add-item-bottom-sheet">
            <div className="miw-sheet-drag-handle" onClick={cancelForm} />
            
            <div className="miw-add-item-header" onClick={cancelForm}>
              <div className="miw-add-item-header-left">
                <PackagePlus size={18} className="miw-icon-primary" />
                <span className="miw-add-item-title">
                  {editingItem ? 'Edit Item' : items.length > 0 ? `Add Item #${items.length + 1}` : 'Add Item'}
                </span>
              </div>
              <ChevronUp size={20} className="miw-expand-icon" />
            </div>

            <div className="miw-add-item-form-content">
              {/* Mini counter when items exist */}
              {items.length > 0 && (
                <div className="miw-mini-cart-badge">
                  <Check size={14} />
                  <span>{items.length} item{items.length !== 1 ? 's' : ''} in invoice</span>
                  <span className="miw-mini-cart-total">${totalAmount.toFixed(2)}</span>
                </div>
              )}
            
              {/* ── Item Search ── */}
              <div className="miw-form-section">
                <label className="miw-label">Item</label>
                <div className="miw-search-container miw-relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="miw-input"
                    placeholder={editingItem ? "Search items..." : "Search items... (type 2+ chars)"}
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => searchQuery.length >= 2 && searchResults.length > 0 && setShowDropdown(true)}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                  />
                  
                  {!searchQuery && !selectedItem && (
                    <Search className="miw-search-icon-wrapper" size={18} />
                  )}
                  
                  {selectedItem && (
                    <div className="miw-search-selected-badge">
                      <Check size={14} />
                    </div>
                  )}

                  {/* Search Results Dropdown */}
                  {showDropdown && (
                    <div 
                      ref={dropdownRef}
                      className="miw-item-search-dropdown"
                    >
                      {isSearching && (
                        <div className="miw-item-search-empty">
                          <div className="miw-spinner miw-spinner-sm"></div>
                          Searching...
                        </div>
                      )}
                      
                      {!isSearching && searchQuery.trim().length < 2 && searchResults.length > 0 && (
                        <div className="miw-item-search-header">Recent Items</div>
                      )}
                      
                      {!isSearching && searchResults.map((item: any, index: number) => (
                        <div
                          key={item.id}
                          className={`miw-item-search-result ${index === highlightedIndex ? 'highlighted' : ''}`}
                          onClick={() => handleSelectItem(item)}
                          onMouseEnter={() => setHighlightedIndex(index)}
                        >
                          <div className="miw-item-search-name">{item.item_name}</div>
                          <div className="miw-item-search-details">
                            <span>Stock: {item.current_stock || 0}</span>
                            <span>${(item.price || item.standard_selling_price || 0).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                      
                      {!isSearching && searchResults.length === 0 && searchQuery.length >= 2 && (
                        <div className="miw-item-search-empty">No items found</div>
                      )}
                      
                      {!isSearching && searchResults.length > 0 && (
                        <div className="miw-search-hints">
                          <span className="miw-search-hint-key">
                            <kbd>↑</kbd><kbd>↓</kbd> Navigate
                          </span>
                          <span className="miw-search-hint-key">
                            <kbd>Enter</kbd> Select
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Quantity & Unit Price ── */}
              <div className="miw-inline-row">
                <div className="miw-inline-item miw-inline-50">
                  <label className="miw-label">Quantity</label>
                  <div className="miw-qty-control-inline">
                    <button 
                      className="miw-qty-btn-sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      aria-label="Decrease quantity"
                      disabled={quantity <= 1}
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      className="miw-qty-input-inline"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      aria-label="Quantity"
                    />
                    <button 
                      className="miw-qty-btn-sm"
                      onClick={() => setQuantity(quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="miw-inline-item miw-inline-50">
                  <label className="miw-label">Unit Price ($)</label>
                  <input
                    type="number"
                    className="miw-input miw-input-price"
                    placeholder="0.00"
                    value={unitPrice || ''}
                    onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* ── Tax, Discount & Preview ── */}
              <div className="miw-inline-row">
                <div className="miw-inline-item miw-inline-33">
                  <label className="miw-label">Tax</label>
                  <select
                    className="miw-input miw-select"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                  >
                    {taxRates.map((rate: any) => (
                      <option key={rate.id} value={rate.rate}>
                        {rate.rate}%
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="miw-inline-item miw-inline-33">
                  <label className="miw-label">Disc. %</label>
                  <input
                    type="number"
                    className="miw-input"
                    placeholder="0"
                    min="0"
                    max="100"
                    value={discount || ''}
                    onChange={(e) => setDiscount(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                  />
                </div>
                
                <div className="miw-inline-item miw-inline-33">
                  <label className="miw-label">Amount</label>
                  <div className={`miw-preview-amount ${selectedItem ? 'miw-preview-amount-active' : ''}`}>
                    ${previewAmount.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* ── Action Buttons ── */}
              <div className="miw-form-actions">
                <button
                  className="miw-action-btn miw-action-btn-secondary"
                  onClick={cancelForm}
                >
                  Cancel
                </button>

                {editingItem ? (
                  <button
                    className="miw-action-btn miw-action-btn-primary"
                    onClick={handleUpdateItem}
                    disabled={!selectedItem}
                  >
                    <Check size={16} />
                    Update
                  </button>
                ) : (
                  <>
                    <button
                      className="miw-action-btn miw-action-btn-accent"
                      onClick={handleAddItem}
                      disabled={!selectedItem || quantity <= 0}
                    >
                      <Plus size={16} />
                      Add
                    </button>
                    <button
                      className="miw-action-btn miw-action-btn-primary"
                      onClick={handleAddAndContinue}
                      disabled={!hasFormChanges && items.length === 0}
                    >
                      <ArrowRight size={16} />
                      Add &amp; Continue
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Bottom Action Bar (when form is NOT expanded) ── */}
      {!isFormExpanded && (
        <>
          {items.length === 0 && (
            <div className="miw-empty-state-add">
              <div className="miw-empty-icon-large">
                <PackagePlus size={40} />
              </div>
              <div className="miw-empty-title">No items yet</div>
              <div className="miw-empty-message">Add items to your invoice to continue</div>
              <button
                className="miw-btn miw-btn-primary miw-btn-add-first"
                onClick={() => {
                  resetFormFields();
                  setIsFormExpanded(true);
                }}
              >
                <Plus size={18} />
                Add Item
              </button>
            </div>
          )}

          {items.length > 0 && (
            <div className="miw-bottom-actions">
              {/* Total bar */}
              <div className="miw-total-status-bar">
                <div className="miw-flex-col">
                  <span className="miw-text-2xs miw-opacity-80 miw-uppercase miw-tracking-wide">Total</span>
                  <span className="miw-font-bold miw-text-lg">${totalAmount.toFixed(2)}</span>
                </div>
                <div className="miw-flex-col miw-items-end">
                  <span className="miw-text-2xs miw-opacity-80 miw-uppercase miw-tracking-wide">Items</span>
                  <span className="miw-font-semibold miw-text-sm">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="miw-action-row">
                <button
                  className="miw-action-btn miw-action-btn-accent miw-action-btn-half"
                  onClick={() => {
                    resetFormFields();
                    setIsFormExpanded(true);
                  }}
                >
                  <Plus size={16} />
                  Add More
                </button>
                <button
                  className="miw-action-btn miw-action-btn-primary miw-action-btn-half"
                  onClick={handleContinue}
                >
                  Continue
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
