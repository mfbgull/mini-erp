import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Search, X } from 'lucide-react';

import './POLineItemsDesktop.css';

export default function POLineItemsDesktop({
  items,
  setItems,
  inventoryItems = [],
  formatCurrency,
  onItemSelect
}) {
  const [searchStates, setSearchStates] = useState({});
  const [dropdownOpen, setDropdownOpen] = useState({});
  const [highlightedItems, setHighlightedItems] = useState({});
  const dropdownRefs = useRef({});
  const searchRefs = useRef({});

  // Filter items for each search
  const getFilteredItems = (itemId, query) => {
    if (!query || query.length < 2) {
      return inventoryItems.slice(0, 10);
    }
    return inventoryItems.filter(item =>
      item.item_name?.toLowerCase().includes(query.toLowerCase()) ||
      item.item_code?.toLowerCase().includes(query.toLowerCase())
    );
  };

  const handleSearchChange = (itemId, value) => {
    setSearchStates(prev => ({ ...prev, [itemId]: value }));
    setDropdownOpen(prev => ({ ...prev, [itemId]: true }));
    setHighlightedItems(prev => ({ ...prev, [itemId]: -1 }));
  };

  const handleSelectItem = (item, rowId) => {
    setItems(items.map(row =>
      row.id === rowId
        ? {
            ...row,
            item_id: item.id,
            item_code: item.item_code,
            item_name: item.item_name,
            unit_price: item.standard_cost || item.purchase_price || 0
          }
        : row
    ));

    setSearchStates(prev => ({ ...prev, [rowId]: `${item.item_code} - ${item.item_name}` }));
    setDropdownOpen(prev => ({ ...prev, [rowId]: false }));
    setHighlightedItems(prev => ({ ...prev, [rowId]: -1 }));

    if (onItemSelect) {
      onItemSelect(item);
    }

    setTimeout(() => {
      const nextRow = items.find(r => r.id !== rowId);
      if (nextRow) {
        searchRefs.current[nextRow.id]?.focus();
      }
    }, 0);
  };

  const handleSearchKeyDown = (e, rowId) => {
    const filtered = getFilteredItems(rowId, searchStates[rowId]);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedItems(prev => ({
          ...prev,
          [rowId]: Math.min(prev[rowId] + 1, filtered.length - 1)
        }));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedItems(prev => ({
          ...prev,
          [rowId]: Math.max(prev[rowId] - 1, 0)
        }));
        break;
      case 'Enter':
        e.preventDefault();
        const highlighted = highlightedItems[rowId];
        if (highlighted >= 0 && filtered[highlighted]) {
          handleSelectItem(filtered[highlighted], rowId);
        }
        break;
      case 'Escape':
        setDropdownOpen(prev => ({ ...prev, [rowId]: false }));
        break;
      case 'Tab':
        setDropdownOpen(prev => ({ ...prev, [rowId]: false }));
        break;
    }
  };

  const handleQuantityChange = (rowId, value) => {
    const numValue = Math.max(0, parseFloat(value) || 0);
    setItems(items.map(row =>
      row.id === rowId ? { ...row, quantity: numValue } : row
    ));
  };

  const handlePriceChange = (rowId, value) => {
    const numValue = Math.max(0, parseFloat(value) || 0);
    setItems(items.map(row =>
      row.id === rowId ? { ...row, unit_price: numValue } : row
    ));
  };

  const addItem = () => {
    const newRow = {
      id: Date.now(),
      item_id: '',
      item_code: '',
      item_name: '',
      quantity: 1,
      unit_price: 0
    };
    setItems([...items, newRow]);
    setSearchStates(prev => ({ ...prev, [newRow.id]: '' }));
    
    setTimeout(() => {
      searchRefs.current[newRow.id]?.focus();
    }, 0);
  };

  const removeItem = (rowId) => {
    if (items.length > 1) {
      setItems(items.filter(row => row.id !== rowId));
      toast.success('Item removed');
    } else {
      toast.error('At least one item is required');
    }
  };

  const calculateTotal = (item) => {
    return (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
  };

  const grandTotal = items.reduce((sum, item) => sum + calculateTotal(item), 0);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      Object.keys(dropdownRefs.current).forEach(rowId => {
        if (dropdownRefs.current[rowId] && !dropdownRefs.current[rowId].contains(e.target)) {
          setDropdownOpen(prev => ({ ...prev, [rowId]: false }));
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
          <tr>
            <th width="40">#</th>
            <th width="35%">Item</th>
            <th width="15%">Qty</th>
            <th width="15%">Unit Price</th>
            <th width="15%">Total</th>
            <th width="40"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const filtered = getFilteredItems(item.id, searchStates[item.id]);
            const isDropdownOpen = dropdownOpen[item.id];
            const highlighted = highlightedItems[item.id] ?? -1;

            return (
              <tr key={item.id} className={item.item_id ? 'po-row-filled' : ''}>
                <td className="po-row-number">{index + 1}</td>
                <td className="po-item-cell">
                  <div
                    className="po-search-wrapper"
                    ref={el => dropdownRefs.current[item.id] = el}
                  >
                    <div className="po-input-wrapper">
                      <Search size={16} className="po-search-icon" />
                      <input
                        ref={el => searchRefs.current[item.id] = el}
                        type="text"
                        className="po-search-input"
                        placeholder="Search item..."
                        value={searchStates[item.id] || (item.item_id ? `${item.item_code} - ${item.item_name}` : '')}
                        onChange={(e) => handleSearchChange(item.id, e.target.value)}
                        onFocus={(e) => {
                          if (e.target.value === `${item.item_code} - ${item.item_name}`) {
                            setSearchStates(prev => ({ ...prev, [item.id]: '' }));
                          }
                          setDropdownOpen(prev => ({ ...prev, [item.id]: true }));
                        }}
                        onKeyDown={(e) => handleSearchKeyDown(e, item.id)}
                        autoComplete="off"
                      />
                      {(searchStates[item.id] || item.item_id) && (
                        <button
                          type="button"
                          className="po-clear-search"
                          onClick={() => {
                            setSearchStates(prev => ({ ...prev, [item.id]: '' }));
                            setItems(items.map(row =>
                              row.id === item.id
                                ? { ...row, item_id: '', item_code: '', item_name: '' }
                                : row
                            ));
                            searchRefs.current[item.id]?.focus();
                          }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {isDropdownOpen && filtered.length > 0 && (
                      <div className="po-search-dropdown">
                        {searchStates[item.id]?.length < 2 && (
                          <div className="po-dropdown-header">Recent Items</div>
                        )}
                        {filtered.map((invItem, i) => (
                          <div
                            key={invItem.id}
                            className={`po-dropdown-item ${i === highlighted ? 'highlighted' : ''}`}
                            onClick={() => handleSelectItem(invItem, item.id)}
                            onMouseEnter={() => setHighlightedItems(prev => ({ ...prev, [item.id]: i }))}
                          >
                            <div className="po-dropdown-item-name">
                              {invItem.item_code} - {invItem.item_name}
                            </div>
                            <div className="po-dropdown-item-details">
                              <span>Stock: {invItem.current_stock || 0}</span>
                              <span>{formatCurrency(invItem.standard_cost || invItem.purchase_price || 0)}</span>
                            </div>
                          </div>
                        ))}
                        <div className="po-dropdown-hints">
                          <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
                          <span><kbd>Enter</kbd> Select</span>
                          <span><kbd>Esc</kbd> Close</span>
                        </div>
                      </div>
                    )}

                    {isDropdownOpen && searchStates[item.id]?.length >= 2 && filtered.length === 0 && (
                      <div className="po-search-dropdown po-empty-dropdown">
                        No items found
                      </div>
                    )}
                  </div>
                </td>
                <td className="po-qty-cell">
                  <input
                    type="number"
                    className="po-qty-input"
                    value={item.quantity || ''}
                    onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                    min="0"
                    step="0.001"
                    placeholder="0"
                  />
                </td>
                <td className="po-price-cell">
                  <input
                    type="number"
                    className="po-price-input"
                    value={item.unit_price || ''}
                    onChange={(e) => handlePriceChange(item.id, e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </td>
                <td className="po-total-cell">
                  {formatCurrency(calculateTotal(item))}
                </td>
                <td className="po-actions-cell">
                  <button
                    type="button"
                    className="po-remove-row-btn"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="4" className="po-total-label">Total</td>
            <td className="po-total-amount">{formatCurrency(grandTotal)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>

      <button type="button" className="po-add-row-btn" onClick={addItem}>
        <Plus size={16} />
        Add Line Item
      </button>
    </div>
  );
}
