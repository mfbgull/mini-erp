import { useState, useEffect, useRef, memo } from 'react';
import { Edit2 } from 'lucide-react';

import type { SearchableCellProps } from '../../utils/invoiceTypes';

const InvoiceSearchableCell = memo(function InvoiceSearchableCell({
  value,
  itemId,
  items,
  invoiceItems,
  isLastItem,
  editingCell,
  onSetEditingCell,
  onUpdateItem,
  onAddNewItem,
  onSetPendingFocus,
  formatCurrency,
  getNextField,
  isLastField,
}: SearchableCellProps) {
  const isEditing = editingCell === `${itemId}-description`;
  const [tempValue, setTempValue] = useState(value);
  const [filteredItems, setFilteredItems] = useState<Array<typeof items[0]>>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync tempValue with value when it changes from outside
  useEffect(() => {
    if (value !== tempValue && !isEditing) {
      setTempValue(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, isEditing]);

  // Get sellable items (exclude raw materials)
  const getSellableItems = () => {
    return items.filter(
      (item) =>
        !item.is_raw_material &&
        (item.is_finished_good === true || item.is_finished_good === 1 || item.is_purchased === true || item.is_purchased === 1),
    ).slice(0, 10);
  };

  const focusTargetCell = (targetItemId: number, targetField: string) => {
    if (targetField === 'description') {
      onSetEditingCell(`${targetItemId}-description`);
    } else {
      onSetEditingCell(`${targetItemId}-${targetField}`);
    }
  };

  const selectItem = (item: typeof items[0], moveNext = true) => {
    onUpdateItem(itemId, 'itemId', item.id);

    setTempValue(item.item_name);
    setShowDropdown(false);
    setFilteredItems([]);
    setSelectedIndex(-1);

    if (moveNext) {
      focusTargetCell(itemId, 'quantity');
    } else {
      onSetEditingCell(null);
    }
  };

  const handleSave = () => {
    if (tempValue !== value) {
      onUpdateItem(itemId, 'description', tempValue);
    }
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
    if (!items || items.length === 0) {
      setFilteredItems([]);
      setShowDropdown(false);
      setSelectedIndex(-1);
      return;
    }
    const sellableItems = getSellableItems();
    setFilteredItems(sellableItems);
    setShowDropdown(sellableItems.length > 0);
    setSelectedIndex(sellableItems.length > 0 ? 0 : -1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value;
    setTempValue(searchValue);

    const sellableItems = getSellableItems();

    if (searchValue.trim()) {
      const matches = sellableItems.filter(
        (item) =>
          item.item_name.toLowerCase().includes(searchValue.toLowerCase()) ||
          item.item_code.toLowerCase().includes(searchValue.toLowerCase()),
      );
      setFilteredItems(matches);
      setShowDropdown(matches.length > 0);
      setSelectedIndex(matches.length > 0 ? 0 : -1);
    } else {
      setFilteredItems(sellableItems);
      setShowDropdown(sellableItems.length > 0);
      setSelectedIndex(sellableItems.length > 0 ? 0 : -1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // When dropdown is open, navigate the list
    if (showDropdown && filteredItems.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (selectedIndex === 0) {
          closeDropdown();
          return;
        }
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
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

    // Navigation when dropdown is closed or no results
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      openDropdown();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const currentItemIndex = invoiceItems.findIndex((item) => item.id === itemId);
      if (currentItemIndex > 0) {
        handleSave();
        const prevItemId = invoiceItems[currentItemIndex - 1].id;
        focusTargetCell(prevItemId, 'description');
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusTargetCell(itemId, 'quantity');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showDropdown && selectedIndex >= 0 && filteredItems[selectedIndex]) {
        selectItem(filteredItems[selectedIndex], true);
      } else {
        handleSave();
        if (isLastField('description') && isLastItem) {
          const newId = onAddNewItem();
          onSetPendingFocus(newId);
        } else {
          const nextField = getNextField('description');
          if (nextField) {
            focusTargetCell(itemId, nextField);
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
          focusTargetCell(itemId, nextField);
        } else if (isLastItem) {
          const newId = onAddNewItem();
          onSetPendingFocus(newId);
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (showDropdown) {
        closeDropdown();
        inputRef.current?.focus();
      } else {
        setTempValue(value);
        onSetEditingCell(null);
      }
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (showDropdown && selectedIndex >= 0) {
        selectItem(filteredItems[selectedIndex], false);
      } else {
        setShowDropdown(false);
        setFilteredItems([]);
      }
    }, 150);
  };

  // Compute dropdown position
  const inputElement = document.querySelector(`[data-cell-id="${itemId}-description"] input`);
  const inputRect = inputElement?.getBoundingClientRect();
  const dropdownStyle: React.CSSProperties = inputRect
    ? {
        position: 'fixed',
        top: `${inputRect.bottom + 2}px`,
        left: `${inputRect.left}px`,
        minWidth: `${inputRect.width}px`,
      }
    : {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        minWidth: '300px',
        zIndex: 99999,
      };

  if (isEditing) {
    return (
      <div className="searchable-cell-container" data-cell-id={`${itemId}-description`}>
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
                      {formatCurrency(item.standard_selling_price || 0)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              tempValue.trim() && (
                <div className="item-dropdown-no-results">
                  No products found matching &quot;{tempValue}&quot;
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
        onSetEditingCell(`${itemId}-description`);
        setTimeout(() => openDropdown(), 50);
      }}
      onFocus={() => {
        setTempValue(value || '');
        onSetEditingCell(`${itemId}-description`);
        setTimeout(() => openDropdown(), 50);
      }}
      onKeyDown={(e) => {
        const currentItemIndex = invoiceItems.findIndex((item) => item.id === itemId);

        if (e.key === 'Enter') {
          e.preventDefault();
          setTempValue(value || '');
          onSetEditingCell(`${itemId}-description`);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (currentItemIndex < invoiceItems.length - 1) {
            focusTargetCell(invoiceItems[currentItemIndex + 1].id, 'description');
          }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (currentItemIndex > 0) {
            focusTargetCell(invoiceItems[currentItemIndex - 1].id, 'description');
          }
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          const nextField = getNextField('description');
          if (nextField) {
            focusTargetCell(itemId, nextField);
          } else if (currentItemIndex < invoiceItems.length - 1) {
            focusTargetCell(invoiceItems[currentItemIndex + 1].id, 'description');
          }
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          if (currentItemIndex > 0) {
            focusTargetCell(invoiceItems[currentItemIndex - 1].id, 'tax');
          }
        } else if (e.key === 'Tab') {
          e.preventDefault();
          const nextField = getNextField('description');
          if (nextField) {
            focusTargetCell(itemId, nextField);
          } else if (isLastItem) {
            const newId = onAddNewItem();
            onSetPendingFocus(newId);
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
});

export default InvoiceSearchableCell;
