import GenericSearchableCell from '../shared/GenericSearchableCell';
import type { InventoryItemOption } from '../../types';

interface QuotationSearchableCellProps {
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
}: QuotationSearchableCellProps) {
  return (
    <GenericSearchableCell
      value={value}
      itemId={itemId}
      items={inventoryItems}
      allItems={inventoryItems}
      isLastItem={isLastItem}
      editingCell={editingCell}
      cellField="description"
      onEditingCell={onEditingCell}
      onUpdateItem={onUpdateItem}
      onAddNewItem={onAddNewItem}
      formatCurrency={(v) => `Rs. ${Number(v || 0).toFixed(2)}`}
      saveField="description"
    />
  );
}
