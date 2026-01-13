import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { useInvoice } from '../../context/InvoiceContext';
import { mobileInvoiceApi } from '../../utils/invoiceApi';
import { X, Search, Plus, Minus, ArrowDown, ArrowUp, Check, Edit2, Trash2, MoreVertical, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import './MobileInvoice.css';

export default function InvoiceStep3AddItem() {
  const { dispatch, items, goToStep, customer, invoiceDate, dueDate } = useInvoice();
  
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
  
  // For item context menu
  const [contextMenu, setContextMenu] = useState<{ item: any; x: number; y: number } | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [isItemsExpanded, setIsItemsExpanded] = useState(true);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  
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

  // Load tax rates
  useEffect(() => {
    const loadTaxRates = async () => {
      try {
        const response = await mobileInvoiceApi.getTaxRates();
        if (response.success) {
          setTaxRates(response.data);
          // Set default tax rate
          const defaultTax = response.data.find((t: any) => t.is_default);
          if (defaultTax) {
            setTaxRate(defaultTax.rate);
          }
        }
      } catch (error) {
        console.error('Error loading tax rates:', error);
        // Use default tax rates
        setTaxRates([
          { id: 1, name: 'No Tax', rate: 0 },
          { id: 2, name: 'GST 10%', rate: 10 },
          { id: 3, name: 'GST 15%', rate: 15 }
        ]);
      }
    };
    loadTaxRates();
  }, []);

  // Auto-expand form when arriving from step 2 with no items
  useEffect(() => {
    if (justArrived && items.length === 0) {
      setIsFormExpanded(true);
      setJustArrived(false);
    }
  }, [justArrived, items.length]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input and load recent items when form opens
  useEffect(() => {
    if (isFormExpanded) {
      // Focus the search input
      setTimeout(() => searchInputRef.current?.focus(), 100);
      
      // Only load recent items when adding new item (not editing)
      if (!editingItem) {
        const loadRecentItems = async () => {
          try {
            const response = await mobileInvoiceApi.searchItems('', 10);
            if (response.success) {
              setRecentItems(response.data || []);
              // Show recent items in dropdown
              setSearchResults(response.data || []);
              setShowDropdown(true);
            }
          } catch (error) {
            console.error('Error loading recent items:', error);
          }
        };
        loadRecentItems();
      }
    }
  }, [isFormExpanded, editingItem]);

  // Search items
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setHighlightedIndex(-1);
    
    // Show recent items when query is empty or short
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
    } catch (error) {
      console.error('Error searching items:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Select item from search
  const handleSelectItem = (item: any) => {
    setSelectedItem(item);
    setSearchQuery(item.item_name);
    setUnitPrice(item.price || item.standard_selling_price || 0);
    setShowDropdown(false);
    setHighlightedIndex(-1);
    
    // Refocus search input
    setTimeout(() => searchInputRef.current?.focus(), 0);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
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

  // Add item to invoice and reset form
  const handleAddItem = () => {
    if (!selectedItem) {
      toast.error('Please select an item');
      return;
    }

    if (quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

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

    toast.success('Item added');
    
    // Reset form and collapse
    resetForm();
    setIsFormExpanded(false);
    setJustArrived(false); // Don't auto-expand after adding
  };

  // Reset form
  const resetForm = () => {
    setSelectedItem(null);
    setSearchQuery('');
    setQuantity(1);
    setUnitPrice(0);
    setTaxRate(0);
    setDiscount(0);
    setShowDropdown(false);
    setHighlightedIndex(-1);
    setEditingItem(null);
    setRecentItems([]);
  };

  // Search customers for dialog
  const handleCustomerSearch = async (query: string) => {
    setCustomerSearchQuery(query);
    
    if (query.trim().length < 2) {
      setCustomerSearchResults([]);
      return;
    }

    setIsSearchingCustomers(true);
    try {
      const response = await mobileInvoiceApi.searchCustomers(query);
      if (response.success) {
        setCustomerSearchResults(response.data || []);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
      setCustomerSearchResults([]);
    } finally {
      setIsSearchingCustomers(false);
    }
  };

  // Select customer from dialog
  const handleSelectCustomer = (customerData: any) => {
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
  };

  // Open customer dialog
  const openCustomerDialog = () => {
    setShowCustomerDialog(true);
    setCustomerSearchQuery(customer?.name || '');
    // Focus input after render
    setTimeout(() => customerDialogInputRef.current?.focus(), 100);
  };

  // Edit an existing item
  const handleEditItem = (item: any) => {
    setEditingItem(item);
    setSelectedItem({ id: item.itemId, item_name: item.name, price: item.unitPrice });
    setSearchQuery(item.name);
    setQuantity(item.quantity);
    setUnitPrice(item.unitPrice);
    setTaxRate(item.taxRate);
    setDiscount(item.discount || 0);
    setContextMenu(null);
    setIsFormExpanded(true);
    
    // Scroll to form
    setTimeout(() => searchInputRef.current?.focus(), 0);
  };

  // Update an existing item
  const handleUpdateItem = () => {
    if (!editingItem) return;

    const amount = quantity * unitPrice * (1 - discount / 100) * (1 + taxRate / 100);

    dispatch({
      type: 'UPDATE_ITEM',
      payload: {
        id: editingItem.id,
        updates: {
          quantity,
          unitPrice,
          taxRate,
          discount,
          amount
        }
      }
    });

    toast.success('Item updated');
    resetForm();
    setIsFormExpanded(false);
    setJustArrived(false); // Don't auto-expand after updating
  };

  // Delete an item
  const handleDeleteItem = (item: any) => {
    if (confirm('Delete this item?')) {
      dispatch({
        type: 'DELETE_ITEM',
        payload: item.id
      });
      toast.success('Item deleted');
    }
    setContextMenu(null);
  };

  // Show context menu
  const showContextMenu = (e: React.MouseEvent, item: any) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setContextMenu({ item, x: rect.right, y: rect.bottom });
  };

  // Calculate preview amount (with discount)
  const previewAmount = quantity * unitPrice * (1 - discount / 100) * (1 + taxRate / 100);

  // Calculate total amount from all items
  const totalAmount = items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

  // Handle continue to next step
  const handleContinue = () => {
    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }
    goToStep(4);
  };

  return (
    <div className="miw-step-3">
      {/* Customer Info Card - Click to Change - At Top */}
      {customer && (
        <div className="miw-customer-info-card" onClick={openCustomerDialog}>
          <div className="miw-customer-info-content">
            <span className="miw-customer-info-label">Customer: </span>
            <span className="miw-customer-info-name">{customer.name}</span>
            {customer.email && <span className="miw-customer-info-contact"> ({customer.email})</span>}
          </div>
        </div>
      )}

      {/* Added Items List - Shows when items exist */}
      {items.length > 0 && (
        <div className="miw-added-items">
          <div 
            className="miw-added-items-header"
            onClick={() => setIsItemsExpanded(!isItemsExpanded)}
          >
            <span className="miw-added-items-title">Items ({items.length})</span>
            {isItemsExpanded ? (
              <ChevronUp size={18} className="miw-expand-icon" />
            ) : (
              <ChevronDown size={18} className="miw-expand-icon" />
            )}
          </div>
          <div 
            className={`miw-added-items-list ${isItemsExpanded ? 'expanded' : 'collapsed'}`}
            style={{ maxHeight: isItemsExpanded ? '400px' : '0' }}
          >
            {items.map((item: any, index: number) => (
              <div 
                key={item.id} 
                className="miw-added-item"
                onClick={() => handleEditItem(item)}
                onContextMenu={(e) => showContextMenu(e, item)}
              >
                <div className="miw-added-item-serial">{index + 1}.</div>
                <div className="miw-added-item-info">
                  <div className="miw-added-item-name">{item.name}</div>
                  <div className="miw-added-item-details">
                    <span>Qty: {item.quantity}</span>
                    {item.discount > 0 && <span className="miw-discount-badge">Disc: {item.discount}%</span>}
                    <span>Tax: {item.taxRate}%</span>
                  </div>
                </div>
                <div className="miw-added-item-total">${item.amount.toFixed(2)}</div>
                <button 
                  className="miw-added-item-menu"
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

      {/* Customer Change Dialog */}
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

      {/* Add Item Button - Full width when no items */}
      {!isFormExpanded && items.length === 0 && (
        <button 
          className="btn btn-primary"
          onClick={() => setIsFormExpanded(true)}
          style={{ 
            position: 'fixed',
            bottom: '80px',
            left: 'var(--space-md)',
            right: 'var(--space-md)',
            zIndex: 999,
            width: 'calc(100% - 32px)',
            height: '48px',
            fontSize: '14px',
            fontWeight: 600,
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(54, 123, 245, 0.3)'
          }}
        >
          <Plus size={18} />
          Add Item
        </button>
      )}

      {/* Add Item Form Bottom Sheet */}
      {isFormExpanded && (
        <>
          <div className="miw-sheet-overlay" onClick={() => {
            resetForm();
            setIsFormExpanded(false);
            setJustArrived(false);
          }} />
          <div className="miw-add-item-bottom-sheet">
            <div className="miw-sheet-drag-handle" onClick={() => {
              resetForm();
              setIsFormExpanded(false);
              setJustArrived(false);
            }} />
            
            <div className="miw-add-item-header" onClick={() => {
              resetForm();
              setIsFormExpanded(false);
              setJustArrived(false);
            }}>
              <span className="miw-add-item-title">{editingItem ? 'Edit Item' : 'Add Item'}</span>
              <ChevronUp size={20} className="miw-expand-icon" />
            </div>
            
            <div className="miw-add-item-content">
              {/* Item Search */}
              <div className="miw-form-section">
                <label className="miw-label">Item</label>
                <div className="miw-search-container" style={{ position: 'relative' }}>
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="miw-input"
                    placeholder="Search items... (type 2+ chars)"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => searchQuery.length >= 2 && searchResults.length > 0 && setShowDropdown(true)}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                  />
                  
                  <Search 
                    className="miw-search-icon" 
                    size={18} 
                    style={{ 
                      position: 'absolute', 
                      right: '12px', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      color: '#9ca3af',
                      pointerEvents: 'none'
                    }} 
                  />

                  {/* Search Results Dropdown */}
                  {showDropdown && (
                    <div 
                      ref={dropdownRef}
                      className="miw-item-search-dropdown"
                    >
                      {isSearching && (
                        <div className="miw-item-search-empty">
                          <div className="miw-spinner" style={{ width: 24, height: 24, margin: '0 auto 8px' }}></div>
                          Searching...
                        </div>
                      )}
                      
                      {/* Show "Recent items" header when showing recent items (empty search) */}
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
                      
                      {/* Keyboard hints */}
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

              {/* Quantity & Unit Price Row */}
              <div className="miw-inline-row">
                <div className="miw-inline-item miw-inline-50">
                  <label className="miw-label">Quantity</label>
                  <div className="miw-qty-control">
                    <button 
                      className="miw-qty-btn"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      aria-label="Decrease quantity"
                    >
                      <Minus size={18} />
                    </button>
                    <input
                      type="number"
                      className="miw-qty-input"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      aria-label="Quantity"
                    />
                    <button 
                      className="miw-qty-btn"
                      onClick={() => setQuantity(quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="miw-inline-item miw-inline-50">
                  <label className="miw-label">Unit Price</label>
                  <input
                    type="number"
                    className="miw-input"
                    placeholder="0.00"
                    value={unitPrice || ''}
                    onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Tax, Discount & Preview Amount Row */}
              <div className="miw-inline-row">
                <div className="miw-inline-item miw-inline-33">
                  <label className="miw-label">Tax (%)</label>
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
                  <label className="miw-label">Discount (%)</label>
                  <input
                    type="number"
                    className="miw-input miw-discount-input"
                    placeholder="0"
                    min="0"
                    max="100"
                    value={discount || ''}
                    onChange={(e) => setDiscount(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                  />
                </div>
                
                <div className="miw-inline-item miw-inline-33">
                  <label className="miw-label">Total</label>
                  <div className="miw-preview-amount">${previewAmount.toFixed(2)}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="miw-form-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    resetForm();
                    setIsFormExpanded(false);
                    setJustArrived(false);
                  }}
                  style={{ flex: 1, height: '44px', borderRadius: '10px' }}
                >
                  Cancel
                </button>
                
                <button 
                  className="btn btn-primary"
                  onClick={editingItem ? handleUpdateItem : handleAddItem}
                  disabled={!selectedItem}
                  style={{ flex: 1, height: '44px', borderRadius: '10px' }}
                >
                  {editingItem ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Total Amount Status Bar - Above Buttons */}
      {items.length > 0 && (
        <div 
          className="miw-total-status-bar"
          style={{ 
            position: 'fixed',
            bottom: '125px',
            left: 'var(--space-md)',
            right: 'var(--space-md)',
            zIndex: 999,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 16px',
            background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            color: 'white'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total</span>
            <span style={{ fontSize: '18px', fontWeight: 700 }}>${totalAmount.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '10px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Items</span>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>{items.length} item{items.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      {/* Button Row - Add Item (50%) + Continue (50%) */}
      {items.length > 0 && (
        <div 
          style={{ 
            position: 'fixed',
            bottom: '70px',
            left: 'var(--space-md)',
            right: 'var(--space-md)',
            zIndex: 1000,
            display: 'flex',
            gap: '10px'
          }}
        >
          <button 
            className="btn btn-primary"
            onClick={() => setIsFormExpanded(true)}
            style={{ 
              flex: 1,
              height: '48px',
              fontSize: '14px',
              fontWeight: 600,
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(54, 123, 245, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Plus size={18} />
            Add Item
          </button>
          
          <button 
            className="btn btn-success"
            onClick={handleContinue}
            style={{ 
              flex: 1,
              height: '48px',
              fontSize: '14px',
              fontWeight: 600,
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
            }}
          >
            Continue ({items.length})
          </button>
        </div>
      )}
    </div>
  );
}
