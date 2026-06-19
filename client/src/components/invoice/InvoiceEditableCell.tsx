import { useState, useRef, memo } from 'react';
import { Edit2 } from 'lucide-react';

import type { EditableCellProps } from '../../utils/invoiceTypes';

const InvoiceEditableCell = memo(function InvoiceEditableCell({
  value,
  itemId,
  field,
  type = 'text',
  isLastItem,
  editingCell,
  items: invoiceItems,
  fieldOrder,
  onSetEditingCell,
  onUpdateItem,
  onAddNewItem,
  onSetPendingFocus,
  getNextField,
  isLastField,
}: EditableCellProps) {
  const isEditing = editingCell === `${itemId}-${field}`;
  const [tempValue, setTempValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onUpdateItem(itemId, field, tempValue);
    onSetEditingCell(null);
  };

  const focusTargetCell = (targetItemId: number, targetField: string) => {
    onSetEditingCell(`${targetItemId}-${targetField}`);
  };

  const moveToCell = (rowOffset: number, colOffset: number) => {
    const currentItemIndex = invoiceItems.findIndex((item) => item.id === itemId);
    const currentFieldIndex = fieldOrder.indexOf(field);

    if (rowOffset !== 0) {
      const newItemIndex = currentItemIndex + rowOffset;
      if (newItemIndex >= 0 && newItemIndex < invoiceItems.length) {
        handleSave();
        focusTargetCell(invoiceItems[newItemIndex].id, field);
      } else if (rowOffset > 0 && newItemIndex >= invoiceItems.length) {
        handleSave();
        const newId = onAddNewItem();
        onSetPendingFocus(newId);
      }
    }

    if (colOffset !== 0) {
      const newFieldIndex = currentFieldIndex + colOffset;
      if (newFieldIndex >= 0 && newFieldIndex < fieldOrder.length) {
        handleSave();
        focusTargetCell(itemId, fieldOrder[newFieldIndex]);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+ArrowUp/Down: Increment/Decrement value
    if (e.ctrlKey && e.key === 'ArrowUp') {
      e.preventDefault();
      if (['quantity', 'rate', 'tax', 'discountValue'].includes(field)) {
        let newValue = (parseFloat(String(tempValue)) || 0) + 1;
        if (field === 'tax' && newValue > 100) newValue = 100;
        if (field === 'quantity' && newValue < 0) newValue = 0;
        setTempValue(newValue);
      }
      return;
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
      if (e.shiftKey) {
        handleSave();
        (document.querySelector('.payment-method-amount') as HTMLElement)?.focus();
        return;
      }
      handleSave();
      if (isLastField(field) && isLastItem) {
        const newId = onAddNewItem();
        onSetPendingFocus(newId);
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
        onSetPendingFocus(newId);
      } else {
        moveToCell(1, 0);
      }
    } else if (e.key === 'Escape') {
      setTempValue(value);
      onSetEditingCell(null);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
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
        onSetEditingCell(`${itemId}-${field}`);
      }}
      onFocus={() => {
        setTempValue(value);
        onSetEditingCell(`${itemId}-${field}`);
      }}
      onKeyDown={(e) => {
        const currentFieldIndex = fieldOrder.indexOf(field);
        const currentItemIndex = invoiceItems.findIndex((item) => item.id === itemId);

        if (e.key === 'Enter') {
          e.preventDefault();
          setTempValue(value);
          onSetEditingCell(`${itemId}-${field}`);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (currentItemIndex > 0) {
            focusTargetCell(invoiceItems[currentItemIndex - 1].id, field);
          }
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (currentItemIndex < invoiceItems.length - 1) {
            focusTargetCell(invoiceItems[currentItemIndex + 1].id, field);
          }
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          if (currentFieldIndex > 0) {
            focusTargetCell(itemId, fieldOrder[currentFieldIndex - 1]);
          } else if (currentItemIndex > 0) {
            focusTargetCell(invoiceItems[currentItemIndex - 1].id, fieldOrder[fieldOrder.length - 1]);
          }
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          if (currentFieldIndex < fieldOrder.length - 1) {
            focusTargetCell(itemId, fieldOrder[currentFieldIndex + 1]);
          } else if (currentItemIndex < invoiceItems.length - 1) {
            focusTargetCell(invoiceItems[currentItemIndex + 1].id, fieldOrder[0]);
          }
        } else if (e.key === 'Tab') {
          e.preventDefault();
          if (currentFieldIndex < fieldOrder.length - 1) {
            focusTargetCell(itemId, fieldOrder[currentFieldIndex + 1]);
          } else if (currentItemIndex < invoiceItems.length - 1) {
            focusTargetCell(invoiceItems[currentItemIndex + 1].id, 'description');
          } else {
            const newId = onAddNewItem();
            onSetPendingFocus(newId);
          }
        }
      }}
      className="editable-cell"
      tabIndex={0}
    >
      {value}
      <Edit2 className="edit-icon" />
    </div>
  );
});

export default InvoiceEditableCell;
