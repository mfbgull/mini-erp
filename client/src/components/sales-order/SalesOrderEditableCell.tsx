import { useState, useRef, memo } from 'react';
import { Edit2 } from 'lucide-react';

import type { SOEditableCellProps } from '../../utils/salesOrderTypes';

const SOEditableCell = memo(function SOEditableCell({
  value, itemId, field, type = 'text', isLastItem, editingCell,
  items: soItems, fieldOrder, onSetEditingCell, onUpdateItem, onAddNewItem, onSetPendingFocus,
  getNextField, isLastField,
}: SOEditableCellProps) {
  const isEditing = editingCell === `${itemId}-${field}`;
  const [tempValue, setTempValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => { onUpdateItem(itemId, field, tempValue); onSetEditingCell(null); };

  const moveToCell = (rowOffset: number, colOffset: number) => {
    const currentIdx = soItems.findIndex((i) => i.id === itemId);
    const currentFieldIdx = fieldOrder.indexOf(field);
    if (rowOffset !== 0) {
      const newIdx = currentIdx + rowOffset;
      if (newIdx >= 0 && newIdx < soItems.length) { handleSave(); onSetEditingCell(`${soItems[newIdx].id}-${field}`); }
      else if (rowOffset > 0 && newIdx >= soItems.length) { handleSave(); onSetPendingFocus(onAddNewItem()); }
    }
    if (colOffset !== 0) {
      const newFieldIdx = currentFieldIdx + colOffset;
      if (newFieldIdx >= 0 && newFieldIdx < fieldOrder.length) { handleSave(); onSetEditingCell(`${itemId}-${fieldOrder[newFieldIdx]}`); }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'ArrowUp') {
      e.preventDefault();
      if (['quantity', 'unitPrice', 'taxRate', 'discountValue'].includes(field)) {
        let nv = (parseFloat(String(tempValue)) || 0) + 1;
        if (field === 'taxRate' && nv > 100) nv = 100;
        if (field === 'quantity' && nv < 0) nv = 0;
        setTempValue(nv);
      }
      return;
    }
    if (e.ctrlKey && e.key === 'ArrowDown') {
      e.preventDefault();
      if (['quantity', 'unitPrice', 'taxRate', 'discountValue'].includes(field)) {
        const cv = parseFloat(String(tempValue)) || 0;
        let nv = cv - 1;
        if (field === 'taxRate' && nv < 0) nv = 0;
        if (field === 'quantity' && nv < 0) nv = 0;
        if ((field === 'unitPrice' || field === 'discountValue') && nv < 0) nv = 0;
        setTempValue(nv);
      }
      return;
    }
    if (e.key === 'ArrowUp') { e.preventDefault(); moveToCell(-1, 0); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); moveToCell(1, 0); }
    else if (e.key === 'ArrowLeft') {
      const target = e.target as HTMLInputElement;
      if (type === 'number' || target.selectionStart === 0) { e.preventDefault(); moveToCell(0, -1); }
    } else if (e.key === 'ArrowRight') {
      const target = e.target as HTMLInputElement;
      if (type === 'number' || target.selectionStart === target.value.length) { e.preventDefault(); moveToCell(0, 1); }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
      if (isLastField(field) && isLastItem) { onSetPendingFocus(onAddNewItem()); }
      else moveToCell(1, 0);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleSave();
      const nf = getNextField(field);
      if (nf) onSetEditingCell(`${itemId}-${nf}`);
      else if (isLastItem) onSetPendingFocus(onAddNewItem());
      else moveToCell(1, 0);
    } else if (e.key === 'Escape') { setTempValue(value); onSetEditingCell(null); }
  };

  if (isEditing) {
    return (
      <input ref={inputRef} type={type} value={tempValue}
        onChange={(e) => setTempValue(e.target.value)} onBlur={handleSave} onKeyDown={handleKeyDown}
        onFocus={(e) => e.target.select()} className="editable-input" data-cell-id={`${itemId}-${field}`} />
    );
  }

  return (
    <div data-cell-id={`${itemId}-${field}`}
      onClick={() => { setTempValue(value); onSetEditingCell(`${itemId}-${field}`); }}
      onFocus={() => { setTempValue(value); onSetEditingCell(`${itemId}-${field}`); }}
      onKeyDown={(e) => {
        const cfIdx = fieldOrder.indexOf(field);
        const ciIdx = soItems.findIndex((i) => i.id === itemId);
        if (e.key === 'Enter') { e.preventDefault(); setTempValue(value); onSetEditingCell(`${itemId}-${field}`); }
        else if (e.key === 'ArrowUp' && ciIdx > 0) { e.preventDefault(); onSetEditingCell(`${soItems[ciIdx - 1].id}-${field}`); }
        else if (e.key === 'ArrowDown' && ciIdx < soItems.length - 1) { e.preventDefault(); onSetEditingCell(`${soItems[ciIdx + 1].id}-${field}`); }
        else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          if (cfIdx > 0) onSetEditingCell(`${itemId}-${fieldOrder[cfIdx - 1]}`);
          else if (ciIdx > 0) onSetEditingCell(`${soItems[ciIdx - 1].id}-${fieldOrder[fieldOrder.length - 1]}`);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          if (cfIdx < fieldOrder.length - 1) onSetEditingCell(`${itemId}-${fieldOrder[cfIdx + 1]}`);
          else if (ciIdx < soItems.length - 1) onSetEditingCell(`${soItems[ciIdx + 1].id}-${fieldOrder[0]}`);
        } else if (e.key === 'Tab') {
          e.preventDefault();
          if (cfIdx < fieldOrder.length - 1) onSetEditingCell(`${itemId}-${fieldOrder[cfIdx + 1]}`);
          else if (ciIdx < soItems.length - 1) onSetEditingCell(`${soItems[ciIdx + 1].id}-name`);
          else onSetPendingFocus(onAddNewItem());
        }
      }}
      className="editable-cell" tabIndex={0}>
      {value}
      <Edit2 className="edit-icon" />
    </div>
  );
});

export default SOEditableCell;
