import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Edit2 } from 'lucide-react';

export interface GenericSearchableCellItem {
  id: number;
  item_name: string;
  item_code: string;
  current_stock?: number;
  standard_selling_price?: number;
  is_raw_material?: boolean | number;
  is_finished_good?: boolean | number;
  is_purchased?: boolean | number;
  is_manufactured?: boolean | number;
}

export interface GenericSearchableCellProps {
  value: string;
  itemId: number;
  items: GenericSearchableCellItem[];
  allItems: Array<{ id: number }>;
  isLastItem: boolean;
  editingCell: string | null;
  cellField?: string;
  onEditingCell: (cellId: string | null) => void;
  onUpdateItem: (itemId: number, field: string, value: unknown) => void;
  onAddNewItem: () => number;
  onSetPendingFocus?: (itemId: number) => void;
  formatCurrency: (amount: number | string | null | undefined) => string;
  getNextField?: (field: string) => string | undefined;
  isLastField?: (field: string) => boolean;
  filterItems?: (items: GenericSearchableCellItem[]) => GenericSearchableCellItem[];
  saveField?: string;
  placeholder?: string;
}

const GenericSearchableCell = memo(function GenericSearchableCell({
  value,
  itemId,
  items,
  allItems,
  isLastItem,
  editingCell,
  cellField = 'description',
  onEditingCell,
  onUpdateItem,
  onAddNewItem,
  onSetPendingFocus,
  formatCurrency,
  getNextField,
  isLastField,
  filterItems,
  saveField,
  placeholder = 'Type to search items...',
}: GenericSearchableCellProps) {
  const isEditing = editingCell === `${itemId}-${cellField}`;
  const [tempValue, setTempValue] = useState(value);
  const [filteredItems, setFilteredItems] = useState<GenericSearchableCellItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value !== tempValue && !isEditing) {
      setTempValue(value);
    }
  }, [value, isEditing]);

  const getAvailableItems = useCallback(() => {
    const base = filterItems ? filterItems(items) : items.filter(
      (item) =>
        !item.is_raw_material &&
        (item.is_finished_good === true || item.is_finished_good === 1 ||
         item.is_purchased === true || item.is_purchased === 1),
    );
    return base.slice(0, 10);
  }, [items, filterItems]);

  const focusTargetCell = useCallback((targetItemId: number, targetField: string) => {
    setTimeout(() => {
      onEditingCell(`${targetItemId}-${targetField}`);
      setTimeout(() => {
        const el = document.querySelector(`[data-cell-id="${targetItemId}-${targetField}"]`);
        if (!el) return;
        const input = el.querySelector('input');
        if (input) {
          (input as HTMLInputElement).focus();
          (input as HTMLInputElement).select();
        } else {
          (el as HTMLElement).focus();
        }
      }, 50);
    }, 50);
  }, [onEditingCell]);

  const selectItem = useCallback((item: GenericSearchableCellItem, moveNext = true) => {
    onUpdateItem(itemId, 'itemId', item.id);
    setTempValue(item.item_name);
    setShowDropdown(false);
    setFilteredItems([]);
    setSelectedIndex(-1);
    if (moveNext) {
      focusTargetCell(itemId, 'quantity');
    } else {
      onEditingCell(null);
    }
  }, [itemId, onUpdateItem, focusTargetCell, onEditingCell]);

  const handleSave = useCallback(() => {
    const field = saveField || cellField;
    if (tempValue !== value) {
      onUpdateItem(itemId, field, tempValue);
    }
    setShowDropdown(false);
    setFilteredItems([]);
    onEditingCell(null);
  }, [tempValue, value, itemId, saveField, cellField, onUpdateItem, onEditingCell]);

  const closeDropdown = useCallback(() => {
    setShowDropdown(false);
    setFilteredItems([]);
    setSelectedIndex(-1);
  }, []);

  const openDropdown = useCallback(() => {
    const available = getAvailableItems();
    setFilteredItems(available);
    setShowDropdown(available.length > 0);
    setSelectedIndex(available.length > 0 ? 0 : -1);
  }, [getAvailableItems]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value;
    setTempValue(searchValue);
    const available = getAvailableItems();
    if (searchValue.trim()) {
      const matches = available.filter(
        (item) =>
          item.item_name.toLowerCase().includes(searchValue.toLowerCase()) ||
          item.item_code.toLowerCase().includes(searchValue.toLowerCase()),
      );
      setFilteredItems(matches);
      setShowDropdown(matches.length > 0);
      setSelectedIndex(matches.length > 0 ? 0 : -1);
    } else {
      setFilteredItems(available);
      setShowDropdown(available.length > 0);
      setSelectedIndex(available.length > 0 ? 0 : -1);
    }
  }, [getAvailableItems]);

  const handleBlur = useCallback((e: React.FocusEvent) => {
    if (!(e.relatedTarget as HTMLElement)?.closest('.item-dropdown')) {
      setTimeout(() => {
        if (showDropdown && selectedIndex >= 0 && filteredItems[selectedIndex]) {
          selectItem(filteredItems[selectedIndex], false);
        } else {
          setShowDropdown(false);
          setFilteredItems([]);
        }
      }, 150);
    }
  }, [showDropdown, selectedIndex, filteredItems, selectItem]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
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
      const idx = allItems.findIndex((i) => i.id === itemId);
      if (idx > 0) { handleSave(); onEditingCell(`${allItems[idx - 1].id}-${cellField}`); }
      return;
    }
    if (e.key === 'ArrowRight') { e.preventDefault(); onEditingCell(`${itemId}-quantity`); return; }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showDropdown && selectedIndex >= 0 && filteredItems[selectedIndex]) { selectItem(filteredItems[selectedIndex], true); return; }
      handleSave();
      if (isLastField?.(cellField) && isLastItem) { if (onSetPendingFocus) onSetPendingFocus(onAddNewItem()); else onAddNewItem(); }
      else { const nf = getNextField?.(cellField); if (nf) onEditingCell(`${itemId}-${nf}`); }
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      if (showDropdown && selectedIndex >= 0 && filteredItems[selectedIndex]) { selectItem(filteredItems[selectedIndex], true); return; }
      handleSave();
      const nf = getNextField?.(cellField);
      if (nf) onEditingCell(`${itemId}-${nf}`);
      else if (isLastItem) { if (onSetPendingFocus) onSetPendingFocus(onAddNewItem()); else onAddNewItem(); }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      if (showDropdown) { closeDropdown(); inputRef.current?.focus(); }
      else { setTempValue(value); onEditingCell(null); }
    }
  }, [showDropdown, filteredItems, selectedIndex, allItems, itemId, cellField, isLastItem, value, closeDropdown, selectItem, openDropdown, handleSave, onEditingCell, getNextField, isLastField, onAddNewItem, onSetPendingFocus]);

  if (isEditing) {
    const inputEl = document.querySelector(`[data-cell-id="${itemId}-${cellField}"] input`);
    const rect = inputEl?.getBoundingClientRect();
    const ddStyle: React.CSSProperties = rect
      ? { position: 'fixed', top: `${rect.bottom + 2}px`, left: `${rect.left}px`, minWidth: `${Math.max(rect.width, 250)}px` }
      : { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', minWidth: '300px', zIndex: 99999 };

    return (
      <div className="searchable-cell-container" data-cell-id={`${itemId}-${cellField}`}>
        <input
          ref={inputRef}
          type="text"
          value={tempValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onFocus={(e) => { e.target.select(); openDropdown(); }}
          className="editable-input"
          placeholder={placeholder}
        />
        {showDropdown && (
          <div className="item-dropdown" style={ddStyle}>
            {filteredItems.length > 0 ? filteredItems.map((item, idx) => (
              <div
                key={item.id}
                className={`item-dropdown-option ${idx === selectedIndex ? 'selected' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); selectItem(item, true); }}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
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
    <div
      onClick={() => { setTempValue(value || ''); onEditingCell(`${itemId}-${cellField}`); setTimeout(() => openDropdown(), 50); }}
      onFocus={() => { setTempValue(value || ''); onEditingCell(`${itemId}-${cellField}`); setTimeout(() => openDropdown(), 50); }}
      onKeyDown={(e) => {
        const idx = allItems.findIndex((i) => i.id === itemId);
        if (e.key === 'Enter') { e.preventDefault(); setTempValue(value || ''); onEditingCell(`${itemId}-${cellField}`); }
        else if (e.key === 'ArrowDown' && idx < allItems.length - 1) { e.preventDefault(); onEditingCell(`${allItems[idx + 1].id}-${cellField}`); }
        else if (e.key === 'ArrowUp' && idx > 0) { e.preventDefault(); onEditingCell(`${allItems[idx - 1].id}-${cellField}`); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); const nf = getNextField?.(cellField); if (nf) onEditingCell(`${itemId}-${nf}`); }
        else if (e.key === 'Tab') { e.preventDefault(); const nf = getNextField?.(cellField); if (nf) onEditingCell(`${itemId}-${nf}`); else if (isLastItem) { if (onSetPendingFocus) onSetPendingFocus(onAddNewItem()); else onAddNewItem(); } }
      }}
      className="editable-cell"
      tabIndex={0}
      data-cell-id={`${itemId}-${cellField}`}
    >
      {value || <span className="cell-placeholder">Click to add item...</span>}
      <Edit2 className="edit-icon" />
    </div>
  );
});

export default GenericSearchableCell;
