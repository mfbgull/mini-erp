import { useState, useEffect, useRef, useCallback } from 'react';
import { Edit2 } from 'lucide-react';
import { getSellableItems } from '../../utils/quotationCalculations';
import type { InventoryItemOption } from '../../utils/quotationTypes';

interface QuotationSearchableCellEditingProps {
  value: string;
  itemId: number;
  isLastItem: boolean;
  inventoryItems: InventoryItemOption[];
  onUpdateItem: (itemId: number, field: string, value: string | number) => void;
  onAddNewItem: () => number;
  editingCell: string | null;
  onEditingCell: (cell: string | null) => void;
}

export function QuotationSearchableCellEditing({
  value,
  itemId,
  isLastItem,
  inventoryItems,
  onUpdateItem,
  onAddNewItem,
  editingCell,
  onEditingCell,
}: QuotationSearchableCellEditingProps) {
  const [tempValue, setTempValue] = useState(value);
  const [localFilteredItems, setLocalFilteredItems] = useState<InventoryItemOption[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const isEditing = editingCell === `${itemId}-description`;

  useEffect(() => {
    if (!isEditing) {
      setTempValue(value);
    }
  }, [value, isEditing]);

  const sellableItems = getSellableItems(inventoryItems as any) as unknown as InventoryItemOption[];

  const focusTargetCell = useCallback((targetItemId: number, targetField: string) => {
    setTimeout(() => {
      if (targetField === 'description') {
        onEditingCell(`${targetItemId}-description`);
        setTimeout(() => {
          const el = document.querySelector(`[data-cell-id="${targetItemId}-description"]`);
          if (!el) return;
          const input = el.querySelector('input');
          if (input) {
            (input as HTMLInputElement).focus();
            (input as HTMLInputElement).select();
          }
        }, 100);
      } else {
        onEditingCell(`${targetItemId}-${targetField}`);
        setTimeout(() => {
          const el = document.querySelector(`[data-cell-id="${targetItemId}-${targetField}"]`);
          if (el) (el as HTMLElement).focus();
        }, 100);
      }
    }, 100);
  }, [onEditingCell]);

  const selectItem = useCallback((item: InventoryItemOption, moveNext = true) => {
    onUpdateItem(itemId, 'itemId', item.id);
    setTempValue(item.item_name);
    setShowDropdown(false);
    setLocalFilteredItems([]);
    setSelectedIndex(-1);
    if (moveNext) {
      onEditingCell(`${itemId}-quantity`);
      focusTargetCell(itemId, 'quantity');
    } else {
      onEditingCell(null);
    }
  }, [itemId, onUpdateItem, onEditingCell, focusTargetCell]);

  const closeDropdown = useCallback(() => {
    setShowDropdown(false);
    setLocalFilteredItems([]);
    setSelectedIndex(-1);
  }, []);

  const openDropdown = useCallback(() => {
    if (!inventoryItems || inventoryItems.length === 0) {
      setLocalFilteredItems([]);
      setShowDropdown(false);
      setSelectedIndex(-1);
      return;
    }
    const sellable = getSellableItems(inventoryItems as any) as unknown as InventoryItemOption[];
    setLocalFilteredItems(sellable);
    setShowDropdown(sellable.length > 0);
    setSelectedIndex(sellable.length > 0 ? 0 : -1);
  }, [inventoryItems]);

  const handleSave = useCallback(() => {
    if (tempValue !== value) {
      onUpdateItem(itemId, 'description', tempValue);
    }
    setShowDropdown(false);
    setLocalFilteredItems([]);
    onEditingCell(null);
  }, [tempValue, value, itemId, onUpdateItem, onEditingCell]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value;
    setTempValue(searchValue);

    if (searchValue.trim()) {
      const matches = (sellableItems as InventoryItemOption[]).filter(item =>
        item.item_name.toLowerCase().includes(searchValue.toLowerCase()) ||
        item.item_code.toLowerCase().includes(searchValue.toLowerCase())
      );
      setLocalFilteredItems(matches);
      setShowDropdown(matches.length > 0);
      setSelectedIndex(matches.length > 0 ? 0 : -1);
    } else {
      setLocalFilteredItems(sellableItems);
      setShowDropdown(sellableItems.length > 0);
      setSelectedIndex(sellableItems.length > 0 ? 0 : -1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
          inputRef.current?.focus();
          return;
        }
        const newIndex = selectedIndex > 0 ? selectedIndex - 1 : localFilteredItems.length - 1;
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
      const newId = onAddNewItem();
      onEditingCell(`${newId}-description`);
      focusTargetCell(newId, 'description');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      openDropdown();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      // Navigation handled by parent
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleSave();
      onEditingCell(`${itemId}-quantity`);
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
        if (isLastItem) {
          onAddNewItem();
        } else {
          onEditingCell(`${itemId}-quantity`);
          focusTargetCell(itemId, 'quantity');
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (showDropdown && selectedIndex >= 0 && localFilteredItems[selectedIndex]) {
        selectItem(localFilteredItems[selectedIndex], true);
      } else {
        handleSave();
        if (isLastItem) {
          onAddNewItem();
        } else {
          onEditingCell(`${itemId}-quantity`);
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (showDropdown) {
        closeDropdown();
        inputRef.current?.focus();
      } else {
        setTempValue(value);
        onEditingCell(null);
      }
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    const isClickingDropdown = (e.relatedTarget as HTMLElement)?.closest('.item-dropdown');
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

  const inputRect = document.querySelector(`[data-cell-id="${itemId}-description"] input`)?.getBoundingClientRect();
  const dropdownStyle = inputRect ? {
    position: 'fixed' as const,
    top: `${inputRect.bottom + 2}px`,
    left: `${inputRect.left}px`,
    minWidth: `${Math.max(inputRect.width, 250)}px`
  } : {
    position: 'fixed' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    minWidth: '300px',
    zIndex: 99999
  };

  if (isEditing) {
    return (
      <div
        className="searchable-cell-container"
        data-cell-id={`${itemId}-description`}
        onClick={() => {
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
                      {item.standard_selling_price || 0}
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
        onEditingCell(`${itemId}-description`);
        setTimeout(() => openDropdown(), 50);
      }}
      onFocus={() => {
        setTempValue(value || '');
        onEditingCell(`${itemId}-description`);
        setTimeout(() => openDropdown(), 50);
      }}
      className="editable-cell"
      tabIndex={0}
      data-cell-id={`${itemId}-description`}
    >
      {value || <span className="cell-placeholder">Click to add item...</span>}
      <Edit2 className="edit-icon" />
    </div>
  );
}
