import GenericSearchableCell from '../shared/GenericSearchableCell';
import type { InventoryItemOption } from '../../types';

interface POSearchableCellProps {
  value: string;
  itemId: number;
  isLastItem: boolean;
  inventoryItems: InventoryItemOption[];
  onUpdateItem: (itemId: number, field: string, value: string | number) => void;
  onAddNewItem: () => number;
  formatCurrency: (amount: number | string | null | undefined) => string;
  editingCell: string | null;
  onEditingCell: (cell: string | null) => void;
}

export function POSearchableCellEditing({
  value,
  itemId,
  isLastItem,
  inventoryItems,
  onUpdateItem,
  onAddNewItem,
  formatCurrency,
  editingCell,
  onEditingCell,
}: POSearchableCellProps) {
  return (
    <GenericSearchableCell
      value={value}
      itemId={itemId}
      items={inventoryItems}
      allItems={inventoryItems}
      isLastItem={isLastItem}
      editingCell={editingCell}
      cellField="name"
      onEditingCell={onEditingCell}
      onUpdateItem={onUpdateItem}
      onAddNewItem={onAddNewItem}
      formatCurrency={formatCurrency}
      filterItems={(items) => items.filter(
        (item) => item.is_purchased === true || (!item.is_raw_material && !item.is_manufactured),
      )}
      saveField="name"
    />
  );
}
