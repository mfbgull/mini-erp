import { useState, useCallback, memo } from 'react';
import { Edit2 } from 'lucide-react';

export interface GenericEditableCellProps {
  value: string | number;
  itemId: number;
  field: string;
  type?: string;
  isLastItem: boolean;
  items: Array<{ id: number }>;
  fieldOrder: readonly string[];
  editingCell: string | null;
  onEditingCell: (cellId: string | null) => void;
  onUpdateItem: (itemId: number, field: string, value: unknown) => void;
  onAddNewItem: () => number;
  onSetPendingFocus?: (itemId: number) => void;
  getNextField: (field: string) => string | undefined;
  isLastField: (field: string) => boolean;
}

const GenericEditableCell = memo(function GenericEditableCell({
  value,
  itemId,
  field,
  type = 'text',
  isLastItem,
  items,
  fieldOrder,
  editingCell,
  onEditingCell,
  onUpdateItem,
  onAddNewItem,
  onSetPendingFocus,
  getNextField,
  isLastField,
}: GenericEditableCellProps) {
  const isEditing = editingCell === `${itemId}-${field}`;
  const [tempValue, setTempValue] = useState(value);

  const handleSave = useCallback(() => {
    onUpdateItem(itemId, field, tempValue);
    onEditingCell(null);
  }, [itemId, field, tempValue, onUpdateItem, onEditingCell]);

  const focusTargetCell = useCallback((targetItemId: number, targetField: string) => {
    setTimeout(() => {
      onEditingCell(`${targetItemId}-${targetField}`);
      const el = document.querySelector(`[data-cell-id="${targetItemId}-${targetField}"]`);
      if (!el) return;
      if (targetField === 'description') {
        const input = el.querySelector('input');
        if (input) {
          (input as HTMLInputElement).focus();
          (input as HTMLInputElement).select();
        }
      } else {
        (el as HTMLElement).focus();
      }
    }, 50);
  }, [onEditingCell]);

  const moveToCell = useCallback((rowOffset: number, colOffset: number) => {
    const currentItemIndex = items.findIndex((item) => item.id === itemId);
    const currentFieldIndex = fieldOrder.indexOf(field);

    if (rowOffset !== 0) {
      const newItemIndex = currentItemIndex + rowOffset;
      if (newItemIndex >= 0 && newItemIndex < items.length) {
        handleSave();
        focusTargetCell(items[newItemIndex].id, field);
      } else if (rowOffset > 0 && newItemIndex >= items.length) {
        handleSave();
        const newId = onAddNewItem();
        if (onSetPendingFocus) {
          onSetPendingFocus(newId);
        } else {
          setTimeout(() => focusTargetCell(newId, field), 100);
        }
      }
    }

    if (colOffset !== 0) {
      const newFieldIndex = currentFieldIndex + colOffset;
      if (newFieldIndex >= 0 && newFieldIndex < fieldOrder.length) {
        handleSave();
        focusTargetCell(itemId, fieldOrder[newFieldIndex]);
      }
    }
  }, [items, itemId, field, fieldOrder, handleSave, onAddNewItem, onSetPendingFocus, focusTargetCell]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'ArrowUp') {
      e.preventDefault();
      if (['quantity', 'rate', 'tax', 'discountValue', 'unit_price'].includes(field)) {
        let newValue = (parseFloat(String(tempValue)) || 0) + 1;
        if (field === 'tax' && newValue > 100) newValue = 100;
        if (field === 'quantity' && newValue < 0) newValue = 0;
        setTempValue(newValue);
      }
      return;
    } else if (e.ctrlKey && e.key === 'ArrowDown') {
      e.preventDefault();
      if (['quantity', 'rate', 'tax', 'discountValue', 'unit_price'].includes(field)) {
        const currentVal = parseFloat(String(tempValue)) || 0;
        let newValue = currentVal - 1;
        if (newValue < 0) newValue = 0;
        setTempValue(newValue);
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveToCell(-1, 0);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveToCell(1, 0);
    } else if (e.key === 'ArrowLeft') {
      const target = e.target as HTMLInputElement;
      const shouldNavigate = type === 'number' || target.selectionStart === 0;
      if (shouldNavigate) {
        e.preventDefault();
        moveToCell(0, -1);
      }
    } else if (e.key === 'ArrowRight') {
      const target = e.target as HTMLInputElement;
      const shouldNavigate = type === 'number' || target.selectionStart === target.value.length;
      if (shouldNavigate) {
        e.preventDefault();
        moveToCell(0, 1);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
      if (isLastField(field) && isLastItem) {
        const newId = onAddNewItem();
        if (onSetPendingFocus) {
          onSetPendingFocus(newId);
        }
      } else {
        moveToCell(1, 0);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleSave();
      const nextField = getNextField(field);
      if (nextField) {
        focusTargetCell(itemId, nextField);
      } else if (isLastItem) {
        const newId = onAddNewItem();
        if (onSetPendingFocus) {
          onSetPendingFocus(newId);
        }
      } else {
        moveToCell(1, 0);
      }
    } else if (e.key === 'Escape') {
      setTempValue(value);
      onEditingCell(null);
    }
  }, [tempValue, field, type, itemId, isLastItem, items, fieldOrder, moveToCell, handleSave, focusTargetCell, getNextField, isLastField, onAddNewItem, onSetPendingFocus, onEditingCell, value]);

  if (isEditing) {
    return (
      <input
        type={type}
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        onFocus={(e) => e.target.select()}
        className="editable-input"
        data-cell-id={`${itemId}-${field}`}
      />
    );
  }

  return (
    <div
      data-cell-id={`${itemId}-${field}`}
      onClick={() => {
        setTempValue(value);
        onEditingCell(`${itemId}-${field}`);
      }}
      onFocus={() => {
        setTempValue(value);
        onEditingCell(`${itemId}-${field}`);
      }}
      className="editable-cell"
      tabIndex={0}
    >
      {value}
      <Edit2 className="edit-icon" />
    </div>
  );
});

export default GenericEditableCell;
