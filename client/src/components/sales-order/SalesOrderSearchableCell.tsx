import { useState, useEffect, useRef, memo } from 'react';
import { Edit2 } from 'lucide-react';

import type { SOSearchableCellProps } from '../../utils/salesOrderTypes';

const SOSearchableCell = memo(function SOSearchableCell({
  value, itemId, inventoryItems, soItems, isLastItem,
  editingCell, onSetEditingCell, onUpdateItem, onAddNewItem, onSetPendingFocus,
  formatCurrency, getNextField, isLastField,
}: SOSearchableCellProps) {
  const isEditing = editingCell === `${itemId}-name`;
  const [tempValue, setTempValue] = useState(value);
  const [filteredItems, setFilteredItems] = useState<Array<typeof inventoryItems[0]>>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value !== tempValue && !isEditing) setTempValue(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, isEditing]);

  const getSellable = () => inventoryItems.filter(
    (i) => !i.is_raw_material && (i.is_finished_good === true || i.is_finished_good === 1 || i.is_purchased === true || i.is_purchased === 1)
  ).slice(0, 10);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setTempValue(v);
    const sellable = getSellable();
    if (v.trim()) {
      const matches = sellable.filter(
        (i) => i.item_name.toLowerCase().includes(v.toLowerCase()) || i.item_code.toLowerCase().includes(v.toLowerCase())
      );
      setFilteredItems(matches);
      setShowDropdown(matches.length > 0);
      setSelectedIndex(matches.length > 0 ? 0 : -1);
    } else {
      setFilteredItems(sellable);
      setShowDropdown(sellable.length > 0);
      setSelectedIndex(sellable.length > 0 ? 0 : -1);
    }
  };

  const selectItem = (item: typeof inventoryItems[0], moveNext = true) => {
    onUpdateItem(itemId, 'itemId', item.id);
    setTempValue(item.item_name);
    setShowDropdown(false);
    setFilteredItems([]);
    setSelectedIndex(-1);
    if (moveNext) {
      onSetEditingCell(`${itemId}-quantity`);
    } else {
      onSetEditingCell(null);
    }
  };

  const handleSave = () => {
    if (tempValue !== value) onUpdateItem(itemId, 'name', tempValue);
    setShowDropdown(false);
    setFilteredItems([]);
    onSetEditingCell(null);
  };

  const closeDropdown = () => {
    setShowDropdown(false);
    setFilteredItems([]);
    setSelectedIndex(-1);
  };

  const openDropdown = () => {
    if (!inventoryItems || inventoryItems.length === 0) {
      setFilteredItems([]);
      setShowDropdown(false);
      setSelectedIndex(-1);
      return;
    }
    const sellable = getSellable();
    setFilteredItems(sellable);
    setShowDropdown(sellable.length > 0);
    setSelectedIndex(sellable.length > 0 ? 0 : -1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showDropdown && filteredItems.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex((p) => (p < filteredItems.length - 1 ? p + 1 : 0)); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); if (selectedIndex === 0) { closeDropdown(); return; } setSelectedIndex((p) => (p > 0 ? p - 1 : filteredItems.length - 1)); return; }
      if (e.key === 'Enter') { e.preventDefault(); if (selectedIndex >= 0 && filteredItems[selectedIndex]) selectItem(filteredItems[selectedIndex], true); return; }
      if (e.key === 'Escape') { e.preventDefault(); closeDropdown(); inputRef.current?.focus(); return; }
      if (e.key === 'Tab') { if (selectedIndex >= 0 && filteredItems[selectedIndex]) { e.preventDefault(); selectItem(filteredItems[selectedIndex], true); } return; }
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); openDropdown(); return; }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const idx = soItems.findIndex((i) => i.id === itemId);
      if (idx > 0) { handleSave(); onSetEditingCell(`${soItems[idx - 1].id}-name`); }
      return;
    }
    if (e.key === 'ArrowRight') { e.preventDefault(); onSetEditingCell(`${itemId}-quantity`); return; }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showDropdown && selectedIndex >= 0 && filteredItems[selectedIndex]) { selectItem(filteredItems[selectedIndex], true); return; }
      handleSave();
      if (isLastField('name') && isLastItem) { onSetPendingFocus(onAddNewItem()); }
      else { const nf = getNextField('name'); if (nf) onSetEditingCell(`${itemId}-${nf}`); }
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      if (showDropdown && selectedIndex >= 0 && filteredItems[selectedIndex]) { selectItem(filteredItems[selectedIndex], true); return; }
      handleSave();
      const nf = getNextField('name');
      if (nf) onSetEditingCell(`${itemId}-${nf}`);
      else if (isLastItem) onSetPendingFocus(onAddNewItem());
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      if (showDropdown) { closeDropdown(); inputRef.current?.focus(); }
      else { setTempValue(value); onSetEditingCell(null); }
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (!(e.relatedTarget as HTMLElement)?.closest('.item-dropdown')) {
      setTimeout(() => {
        if (showDropdown && selectedIndex >= 0) selectItem(filteredItems[selectedIndex], false);
        else { setShowDropdown(false); setFilteredItems([]); }
      }, 150);
    }
  };

  if (isEditing) {
    const inputEl = document.querySelector(`[data-cell-id="${itemId}-name"] input`);
    const rect = inputEl?.getBoundingClientRect();
    const ddStyle: React.CSSProperties = rect ? { position: 'fixed', top: `${rect.bottom + 2}px`, left: `${rect.left}px`, minWidth: `${Math.max(rect.width, 250)}px` }
      : { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', minWidth: '300px', zIndex: 99999 };

    return (
      <div className="searchable-cell-container" data-cell-id={`${itemId}-name`}>
        <input ref={inputRef} type="text" value={tempValue} onChange={handleInputChange}
          onBlur={handleBlur} onKeyDown={handleKeyDown}
          onFocus={(e) => { e.target.select(); openDropdown(); }}
          className="editable-input" placeholder="Type to search items..." />
        {showDropdown && (
          <div className="item-dropdown" style={ddStyle}>
            {filteredItems.length > 0 ? filteredItems.map((item, idx) => (
              <div key={item.id} className={`item-dropdown-option ${idx === selectedIndex ? 'selected' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); selectItem(item, true); }}
                onMouseEnter={() => setSelectedIndex(idx)}>
                <div className="item-dropdown-main">
                  <span className="item-dropdown-name">{item.item_name}</span>
                  <span className="item-dropdown-code">{item.item_code}</span>
                </div>
                <div className="item-dropdown-details">
                  <span className="item-dropdown-stock">Stock: {item.current_stock || 0}</span>
                  <span className="item-dropdown-price">{formatCurrency(item.standard_selling_price || 0)}</span>
                </div>
              </div>
            )) : tempValue.trim() && <div className="item-dropdown-no-results">No products found</div>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div onClick={() => { setTempValue(value || ''); onSetEditingCell(`${itemId}-name`); setTimeout(() => openDropdown(), 50); }}
      onFocus={() => { setTempValue(value || ''); onSetEditingCell(`${itemId}-name`); setTimeout(() => openDropdown(), 50); }}
      onKeyDown={(e) => {
        const idx = soItems.findIndex((i) => i.id === itemId);
        if (e.key === 'Enter') { e.preventDefault(); setTempValue(value || ''); onSetEditingCell(`${itemId}-name`); }
        else if (e.key === 'ArrowDown' && idx < soItems.length - 1) { e.preventDefault(); onSetEditingCell(`${soItems[idx + 1].id}-name`); }
        else if (e.key === 'ArrowUp' && idx > 0) { e.preventDefault(); onSetEditingCell(`${soItems[idx - 1].id}-name`); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); const nf = getNextField('name'); if (nf) onSetEditingCell(`${itemId}-${nf}`); }
        else if (e.key === 'Tab') { e.preventDefault(); const nf = getNextField('name'); if (nf) onSetEditingCell(`${itemId}-${nf}`); else if (isLastItem) onSetPendingFocus(onAddNewItem()); }
      }}
      className="editable-cell" tabIndex={0} data-cell-id={`${itemId}-name`}>
      {value || <span className="cell-placeholder">Click to add item...</span>}
      <Edit2 className="edit-icon" />
    </div>
  );
});

export default SOSearchableCell;
