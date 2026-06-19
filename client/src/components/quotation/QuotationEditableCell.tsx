import { useState, useCallback } from 'react';
import { Edit2 } from 'lucide-react';
import type { QuotationEditableCellProps } from '../../utils/quotationTypes';
import { getFieldOrder } from '../../utils/quotationCalculations';

export default function QuotationEditableCell({
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
  getNextField,
  isLastField,
}: QuotationEditableCellProps) {
  const isEditing = editingCell === `${itemId}-${field}`;
  const [tempValue, setTempValue] = useState(value);
  const effectiveFieldOrder = fieldOrder || getFieldOrder();

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
    }, 100);
  }, [onEditingCell]);

  const moveToCell = useCallback((rowOffset: number, colOffset: number) => {
    const currentItemIndex = items.findIndex(item => item.id === itemId);
    const currentFieldIndex = effectiveFieldOrder.indexOf(field);

    if (rowOffset !== 0) {
      const newItemIndex = currentItemIndex + rowOffset;
      if (newItemIndex >= 0 && newItemIndex < items.length) {
        const newItemId = items[newItemIndex].id;
        handleSave();
        focusTargetCell(newItemId, field);
      } else if (rowOffset > 0 && newItemIndex >= items.length) {
        handleSave();
        const newId = onAddNewItem();
        setTimeout(() => focusTargetCell(newId, field), 100);
      }
    }

    if (colOffset !== 0) {
      const newFieldIndex = currentFieldIndex + colOffset;
      if (newFieldIndex >= 0 && newFieldIndex < effectiveFieldOrder.length) {
        handleSave();
        const newField = effectiveFieldOrder[newFieldIndex];
        focusTargetCell(itemId, newField);
      }
    }
  }, [items, itemId, field, effectiveFieldOrder, handleSave, onAddNewItem, focusTargetCell]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'ArrowUp') {
      e.preventDefault();
      if (['quantity', 'rate', 'tax', 'discountValue'].includes(field)) {
        let newValue = (parseFloat(String(tempValue)) || 0) + 1;
        if (field === 'tax' && newValue > 100) newValue = 100;
        if (field === 'quantity' && newValue < 0) newValue = 0;
        setTempValue(newValue);
      }
    } else if (e.ctrlKey && e.key === 'ArrowDown') {
      e.preventDefault();
      if (['quantity', 'rate', 'tax', 'discountValue'].includes(field)) {
        const currentVal = parseFloat(String(tempValue)) || 0;
        let newValue = currentVal - 1;
        if (field === 'tax' && newValue < 0) newValue = 0;
        if (field === 'quantity' && newValue < 0) newValue = 0;
        if ((field === 'rate' || field === 'discountValue') && newValue < 0) newValue = 0;
        setTempValue(newValue);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveToCell(-1, 0);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveToCell(1, 0);
    } else if (e.key === 'ArrowLeft') {
      const input = e.target as HTMLInputElement;
      const shouldNavigate = type === 'number' || input.selectionStart === 0;
      if (shouldNavigate) {
        e.preventDefault();
        moveToCell(0, -1);
      }
    } else if (e.key === 'ArrowRight') {
      const input = e.target as HTMLInputElement;
      const shouldNavigate = type === 'number' || input.selectionStart === input.value.length;
      if (shouldNavigate) {
        e.preventDefault();
        moveToCell(0, 1);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
      if (isLastField(field) && isLastItem) {
        onAddNewItem();
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
        onAddNewItem();
      } else {
        moveToCell(1, 0);
      }
    } else if (e.key === 'Escape') {
      setTempValue(value);
      onEditingCell(null);
    }
  };

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
}
