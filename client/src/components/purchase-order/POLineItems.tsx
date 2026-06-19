import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { X, Search, Plus, Minus, ChevronUp, ChevronDown, MoreVertical, Edit2, Trash2 } from 'lucide-react';

import Button from '../common/Button';
import './POLineItems.css';

interface InventoryItem {
  id: number;
  item_code?: string;
  item_name?: string;
  standard_cost?: number;
  purchase_price?: number;
  current_stock?: number;
}

interface LineItem {
  id: number;
  item_id: number;
  item_name: string;
  item_code: string;
  quantity: number;
  unit_price: number;
}

interface POLineItemsProps {
  items: LineItem[];
  setItems: (items: LineItem[]) => void;
  inventoryItems?: InventoryItem[];
  formatCurrency: (amount: number | string | null | undefined) => string;
  onItemSelect?: (item: InventoryItem) => void;
}

interface ContextMenuState {
  item: LineItem;
  x: number;
  y: number;
}

export default function POLineItems({
  items,
  setItems,
  inventoryItems = [],
  formatCurrency,
  onItemSelect
}: POLineItemsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [recentItems, setRecentItems] = useState<InventoryItem[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [editingItem, setEditingItem] = useState<LineItem | null>(null);
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [isItemsExpanded, setIsItemsExpanded] = useState(true);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isFormExpanded && !editingItem) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
      const recent = inventoryItems.slice(0, 10);
      setRecentItems(recent);
      setSearchResults(recent);
      setShowDropdown(true);
    }
  }, [isFormExpanded, editingItem, inventoryItems]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) setContextMenu(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setHighlightedIndex(-1);
    if (query.trim().length < 2) { setSearchResults(recentItems); setShowDropdown(true); return; }
    setIsSearching(true);
    const filtered = inventoryItems.filter(item =>
      item.item_name?.toLowerCase().includes(query.toLowerCase()) ||
      item.item_code?.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(filtered);
    setShowDropdown(true);
    setIsSearching(false);
  };

  const handleSelectItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setSearchQuery(`${item.item_code} - ${item.item_name}`);
    setUnitPrice(item.standard_cost || item.purchase_price || 0);
    setShowDropdown(false);
    setHighlightedIndex(-1);
    if (onItemSelect) onItemSelect(item);
    setTimeout(() => searchInputRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || searchResults.length === 0) return;
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setHighlightedIndex(prev => Math.min(prev + 1, searchResults.length - 1)); break;
      case 'ArrowUp': e.preventDefault(); setHighlightedIndex(prev => Math.max(prev - 1, 0)); break;
      case 'Enter': e.preventDefault(); if (highlightedIndex >= 0 && searchResults[highlightedIndex]) handleSelectItem(searchResults[highlightedIndex]); break;
      case 'Escape': setShowDropdown(false); setHighlightedIndex(-1); break;
    }
  };

  const handleAddItem = () => {
    if (!selectedItem) { toast.error('Please select an item'); return; }
    if (quantity <= 0) { toast.error('Quantity must be greater than 0'); return; }
    const newItem: LineItem = {
      id: Date.now(), item_id: selectedItem.id, item_name: selectedItem.item_name || '', item_code: selectedItem.item_code || '', quantity, unit_price: unitPrice
    };
    setItems([...items, newItem]);
    toast.success('Item added');
    resetForm();
    setIsFormExpanded(false);
  };

  const handleUpdateItem = () => {
    if (!editingItem) return;
    setItems(items.map(item => item.id === editingItem.id ? { ...item, quantity, unit_price: unitPrice } : item));
    toast.success('Item updated');
    resetForm();
    setIsFormExpanded(false);
  };

  const handleDeleteItem = (item: LineItem) => {
    if (items.length > 1) { setItems(items.filter(i => i.id !== item.id)); toast.success('Item removed'); }
    setContextMenu(null);
  };

  const handleEditItem = (item: LineItem) => {
    const inventoryItem = inventoryItems.find(i => i.id === item.item_id);
    setEditingItem(item);
    setSelectedItem(inventoryItem || null);
    setSearchQuery(`${item.item_code} - ${item.item_name}`);
    setQuantity(item.quantity);
    setUnitPrice(item.unit_price);
    setContextMenu(null);
    setIsFormExpanded(true);
    setTimeout(() => searchInputRef.current?.focus(), 0);
  };

  const showContextMenu = (e: React.MouseEvent, item: LineItem) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setContextMenu({ item, x: rect.right, y: rect.bottom });
  };

  const resetForm = () => {
    setSelectedItem(null); setSearchQuery(''); setQuantity(1); setUnitPrice(0);
    setShowDropdown(false); setHighlightedIndex(-1); setEditingItem(null);
  };

  const calculateItemTotal = (item: LineItem) => (parseFloat(String(item.quantity)) || 0) * (parseFloat(String(item.unit_price)) || 0);
  const totalAmount = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);

  return (
    <div className="po-line-items">
      {items.length > 0 && (
        <div className="po-added-items">
          <div className="po-added-items-header" onClick={() => setIsItemsExpanded(!isItemsExpanded)}>
            <span className="po-added-items-title">Line Items ({items.length})</span>
            <span className="po-added-items-total">{formatCurrency(totalAmount)}</span>
            {isItemsExpanded ? <ChevronUp size={18} className="po-expand-icon" /> : <ChevronDown size={18} className="po-expand-icon" />}
          </div>
          <div className={`po-added-items-list ${isItemsExpanded ? 'po-expanded' : 'po-collapsed'}`}>
            {items.map((item, index) => (
              <div key={item.id} className="po-added-item" onClick={() => handleEditItem(item)} onContextMenu={(e) => showContextMenu(e, item)}>
                <div className="po-added-item-serial">{index + 1}.</div>
                <div className="po-added-item-info">
                  <div className="po-added-item-name">{item.item_name}</div>
                  <div className="po-added-item-details">
                    <span>Code: {item.item_code}</span><span>Qty: {item.quantity}</span><span>Price: {formatCurrency(item.unit_price)}</span>
                  </div>
                </div>
                <div className="po-added-item-total">{formatCurrency(calculateItemTotal(item))}</div>
                <button className="po-added-item-menu" onClick={(e) => showContextMenu(e, item)}><MoreVertical size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
      {contextMenu && (
        <div ref={contextMenuRef} className="po-context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
          <button className="po-context-menu-item" onClick={() => handleEditItem(contextMenu.item)}><Edit2 size={16} /> Edit</button>
          <button className="po-context-menu-item danger" onClick={() => handleDeleteItem(contextMenu.item)} disabled={items.length === 1}><Trash2 size={16} /> Delete</button>
        </div>
      )}
      {!isFormExpanded && (
        <Button variant="primary" className="po-add-item-btn" onClick={() => setIsFormExpanded(true)} type="button"><Plus size={18} /> Add Line Item</Button>
      )}
      {isFormExpanded && (
        <>
          <div className="po-sheet-overlay" onClick={() => { resetForm(); setIsFormExpanded(false); }} />
          <div className="po-add-item-sheet">
            <div className="po-sheet-drag-handle" onClick={() => { resetForm(); setIsFormExpanded(false); }} />
            <div className="po-add-item-header">
              <span className="po-add-item-title">{editingItem ? 'Edit Line Item' : 'Add Line Item'}</span>
              <ChevronUp size={20} className="po-expand-icon" />
            </div>
            <div className="po-add-item-content">
              <div className="po-form-section">
                <label className="po-label">Item</label>
                <div className="po-search-container">
                  <input ref={searchInputRef} type="text" className="po-input" placeholder="Search items... (type 2+ chars)"
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
                    onFocus={() => searchQuery.length >= 2 && searchResults.length > 0 && setShowDropdown(true)}
                    onKeyDown={handleKeyDown} autoComplete="off" />
                  <Search className="po-search-icon" size={18} />
                  {showDropdown && (
                    <div ref={dropdownRef} className="po-item-search-dropdown">
                      {isSearching && <div className="po-item-search-empty"><div className="po-spinner"></div>Searching...</div>}
                      {!isSearching && searchQuery.trim().length < 2 && searchResults.length > 0 && <div className="po-item-search-header">Recent Items</div>}
                      {!isSearching && searchResults.map((item, index) => (
                        <div key={item.id} className={`po-item-search-result ${index === highlightedIndex ? 'highlighted' : ''}`}
                          onClick={() => handleSelectItem(item)} onMouseEnter={() => setHighlightedIndex(index)}>
                          <div className="po-item-search-name">{item.item_code} - {item.item_name}</div>
                          <div className="po-item-search-details"><span>Stock: {item.current_stock || 0}</span><span>{formatCurrency(item.standard_cost || item.purchase_price || 0)}</span></div>
                        </div>
                      ))}
                      {!isSearching && searchResults.length === 0 && searchQuery.length >= 2 && <div className="po-item-search-empty">No items found</div>}
                      {!isSearching && searchResults.length > 0 && (
                        <div className="po-search-hints">
                          <span className="po-search-hint-key"><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
                          <span className="po-search-hint-key"><kbd>Enter</kbd> Select</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="po-inline-row">
                <div className="po-inline-item po-inline-50">
                  <label className="po-label">Quantity</label>
                  <div className="po-qty-control">
                    <button type="button" className="po-qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={18} /></button>
                    <input type="number" className="po-qty-input" value={quantity}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuantity(Math.max(1, parseFloat(e.target.value) || 1))}
                      min="1" step="0.001" />
                    <button type="button" className="po-qty-btn" onClick={() => setQuantity(quantity + 1)}><Plus size={18} /></button>
                  </div>
                </div>
                <div className="po-inline-item po-inline-50">
                  <label className="po-label">Unit Price</label>
                  <input type="number" className="po-input" placeholder="0.00" value={unitPrice || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUnitPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    min="0" step="0.01" />
                </div>
              </div>
              <div className="po-preview-row">
                <div className="po-preview-label">Line Total</div>
                <div className="po-preview-amount">{formatCurrency(quantity * unitPrice)}</div>
              </div>
              <div className="po-form-actions">
                <Button type="button" variant="secondary" className="po-btn-half" onClick={() => { resetForm(); setIsFormExpanded(false); }}>Cancel</Button>
                <Button type="button" variant="primary" className="po-btn-half" onClick={editingItem ? handleUpdateItem : handleAddItem} disabled={!selectedItem}>
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
