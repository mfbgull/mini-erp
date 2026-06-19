import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Search, X } from 'lucide-react';
import './POLineItemsDesktop.css';

interface InventoryItem {
  id: number;
  item_code?: string;
  item_name?: string;
  standard_cost?: number;
  purchase_price?: number;
  current_stock?: number;
}

interface POLineItem {
  id: number;
  item_id: number | string;
  item_code: string;
  item_name: string;
  quantity: number;
  unit_price: number;
}

interface POLineItemsDesktopProps {
  items: POLineItem[];
  setItems: (items: POLineItem[]) => void;
  inventoryItems?: InventoryItem[];
  formatCurrency: (amount: number | string | null | undefined) => string;
  onItemSelect?: (item: InventoryItem) => void;
}

export default function POLineItemsDesktop({
  items,
  setItems,
  inventoryItems = [],
  formatCurrency,
  onItemSelect
}: POLineItemsDesktopProps) {
  const [searchStates, setSearchStates] = useState<Record<number, string>>({});
  const [dropdownOpen, setDropdownOpen] = useState<Record<number, boolean>>({});
  const [highlightedItems, setHighlightedItems] = useState<Record<number, number>>({});
  const dropdownRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const searchRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const getFilteredItems = (itemId: number, query: string) => {
    if (!query || query.length < 2) return inventoryItems.slice(0, 10);
    return inventoryItems.filter(item =>
      item.item_name?.toLowerCase().includes(query.toLowerCase()) ||
      item.item_code?.toLowerCase().includes(query.toLowerCase())
    );
  };

  const handleSearchChange = (itemId: number, value: string) => {
    setSearchStates(prev => ({ ...prev, [itemId]: value }));
    setDropdownOpen(prev => ({ ...prev, [itemId]: true }));
    setHighlightedItems(prev => ({ ...prev, [itemId]: -1 }));
  };

  const handleSelectItem = (item: InventoryItem, rowId: number) => {
    setItems(items.map(row =>
      row.id === rowId
        ? { ...row, item_id: item.id, item_code: item.item_code || '', item_name: item.item_name || '', unit_price: item.standard_cost || item.purchase_price || 0 }
        : row
    ));
    setSearchStates(prev => ({ ...prev, [rowId]: `${item.item_code} - ${item.item_name}` }));
    setDropdownOpen(prev => ({ ...prev, [rowId]: false }));
    setHighlightedItems(prev => ({ ...prev, [rowId]: -1 }));
    if (onItemSelect) onItemSelect(item);
    setTimeout(() => {
      const nextRow = items.find(r => r.id !== rowId);
      if (nextRow) searchRefs.current[nextRow.id]?.focus();
    }, 0);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent, rowId: number) => {
    const filtered = getFilteredItems(rowId, searchStates[rowId] || '');
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setHighlightedItems(prev => ({ ...prev, [rowId]: Math.min((prev[rowId] ?? -1) + 1, filtered.length - 1) })); break;
      case 'ArrowUp': e.preventDefault(); setHighlightedItems(prev => ({ ...prev, [rowId]: Math.max((prev[rowId] ?? -1) - 1, 0) })); break;
      case 'Enter': e.preventDefault(); const h = highlightedItems[rowId]; if (h >= 0 && filtered[h]) handleSelectItem(filtered[h], rowId); break;
      case 'Escape': setDropdownOpen(prev => ({ ...prev, [rowId]: false })); break;
      case 'Tab': setDropdownOpen(prev => ({ ...prev, [rowId]: false })); break;
    }
  };

  const handleQuantityChange = (rowId: number, value: string) => {
    const numValue = Math.max(0, parseFloat(value) || 0);
    setItems(items.map(row => row.id === rowId ? { ...row, quantity: numValue } : row));
  };

  const handlePriceChange = (rowId: number, value: string) => {
    const numValue = Math.max(0, parseFloat(value) || 0);
    setItems(items.map(row => row.id === rowId ? { ...row, unit_price: numValue } : row));
  };

  const addItem = () => {
    const newRow: POLineItem = { id: Date.now(), item_id: '', item_code: '', item_name: '', quantity: 1, unit_price: 0 };
    setItems([...items, newRow]);
    setSearchStates(prev => ({ ...prev, [newRow.id]: '' }));
    setTimeout(() => searchRefs.current[newRow.id]?.focus(), 0);
  };

  const removeItem = (rowId: number) => {
    if (items.length > 1) { setItems(items.filter(row => row.id !== rowId)); toast.success('Item removed'); }
    else toast.error('At least one item is required');
  };

  const calculateTotal = (item: POLineItem) => (parseFloat(String(item.quantity)) || 0) * (parseFloat(String(item.unit_price)) || 0);
  const grandTotal = items.reduce((sum, item) => sum + calculateTotal(item), 0);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      Object.keys(dropdownRefs.current).forEach(rowId => {
        const id = Number(rowId);
        if (dropdownRefs.current[id] && !dropdownRefs.current[id]?.contains(e.target as Node)) {
          setDropdownOpen(prev => ({ ...prev, [id]: false }));
        }
      });
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="po-line-items-desktop">
      <table className="po-items-table">
        <thead>
          <tr><th style={{width: 40}}>#</th><th style={{width: '35%'}}>Item</th><th style={{width: '15%'}}>Qty</th><th style={{width: '15%'}}>Unit Price</th><th style={{width: '15%'}}>Total</th><th style={{width: 40}}></th></tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const filtered = getFilteredItems(item.id, searchStates[item.id] || '');
            const isDropdownOpen = dropdownOpen[item.id];
            const highlighted = highlightedItems[item.id] ?? -1;
            return (
              <tr key={item.id} className={item.item_id ? 'po-row-filled' : ''}>
                <td className="po-row-number">{index + 1}</td>
                <td className="po-item-cell">
                  <div className="po-search-wrapper" ref={el => { dropdownRefs.current[item.id] = el; }}>
                    <div className="po-input-wrapper">
                      <Search size={16} className="po-search-icon" />
                      <input ref={el => { searchRefs.current[item.id] = el; }} type="text" className="po-search-input" placeholder="Search item..."
                        value={searchStates[item.id] !== undefined ? searchStates[item.id] : (item.item_id ? `${item.item_code} - ${item.item_name}` : '')}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearchChange(item.id, e.target.value)}
                        onFocus={(e: React.FocusEvent<HTMLInputElement>) => { if (e.target.value === `${item.item_code} - ${item.item_name}`) setSearchStates(prev => ({ ...prev, [item.id]: '' })); setDropdownOpen(prev => ({ ...prev, [item.id]: true })); }}
                        onKeyDown={(e: React.KeyboardEvent) => handleSearchKeyDown(e, item.id)} autoComplete="off" />
                      {(searchStates[item.id] || item.item_id) && (
                        <button type="button" className="po-clear-search" onClick={() => {
                          setSearchStates(prev => ({ ...prev, [item.id]: '' }));
                          setItems(items.map(row => row.id === item.id ? { ...row, item_id: '', item_code: '', item_name: '' } : row));
                          searchRefs.current[item.id]?.focus();
                        }}><X size={14} /></button>
                      )}
                    </div>
                    {isDropdownOpen && filtered.length > 0 && (
                      <div className="po-search-dropdown">
                        {(searchStates[item.id]?.length ?? 0) < 2 && <div className="po-dropdown-header">Recent Items</div>}
                        {filtered.map((invItem, i) => (
                          <div key={invItem.id} className={`po-dropdown-item ${i === highlighted ? 'highlighted' : ''}`}
                            onClick={() => handleSelectItem(invItem, item.id)}
                            onMouseEnter={() => setHighlightedItems(prev => ({ ...prev, [item.id]: i }))}>
                            <div className="po-dropdown-item-name">{invItem.item_code} - {invItem.item_name}</div>
                            <div className="po-dropdown-item-details"><span>Stock: {invItem.current_stock || 0}</span><span>{formatCurrency(invItem.standard_cost || invItem.purchase_price || 0)}</span></div>
                          </div>
                        ))}
                        <div className="po-dropdown-hints"><span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span><span><kbd>Enter</kbd> Select</span><span><kbd>Esc</kbd> Close</span></div>
                      </div>
                    )}
                    {isDropdownOpen && (searchStates[item.id]?.length ?? 0) >= 2 && filtered.length === 0 && (
                      <div className="po-search-dropdown po-empty-dropdown">No items found</div>
                    )}
                  </div>
                </td>
                <td className="po-qty-cell">
                  <input type="number" className="po-qty-input" value={item.quantity || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleQuantityChange(item.id, e.target.value)}
                    min="0" step="0.001" placeholder="0" />
                </td>
                <td className="po-price-cell">
                  <input type="number" className="po-price-input" value={item.unit_price || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePriceChange(item.id, e.target.value)}
                    min="0" step="0.01" placeholder="0.00" />
                </td>
                <td className="po-total-cell">{formatCurrency(calculateTotal(item))}</td>
                <td className="po-actions-cell">
                  <button type="button" className="po-remove-row-btn" onClick={() => removeItem(item.id)} disabled={items.length === 1} title="Remove item"><Trash2 size={16} /></button>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr><td colSpan={4} className="po-total-label">Total</td><td className="po-total-amount">{formatCurrency(grandTotal)}</td><td style={{width: 40}}></td></tr>
        </tfoot>
      </table>
      <button type="button" className="po-add-row-btn" onClick={addItem}><Plus size={16} /> Add Line Item</button>
    </div>
  );
}
