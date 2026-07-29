import GenericSearchableCell from '../shared/GenericSearchableCell';
import type { SOSearchableCellProps } from '../../types';

export default function SOSearchableCell({
  value,
  itemId,
  inventoryItems,
  soItems,
  isLastItem,
  editingCell,
  onSetEditingCell,
  onUpdateItem,
  onAddNewItem,
  onSetPendingFocus,
  formatCurrency,
  getNextField,
}: SOSearchableCellProps) {
  return (
    <GenericSearchableCell
      value={value}
      itemId={itemId}
      items={inventoryItems}
      allItems={soItems}
      isLastItem={isLastItem}
      editingCell={editingCell}
      cellField="name"
      onEditingCell={onSetEditingCell}
      onUpdateItem={onUpdateItem as (itemId: number, field: string, value: unknown) => void}
      onAddNewItem={onAddNewItem}
      onSetPendingFocus={onSetPendingFocus}
      formatCurrency={formatCurrency}
      getNextField={getNextField}
      saveField="name"
    />
  );
}
