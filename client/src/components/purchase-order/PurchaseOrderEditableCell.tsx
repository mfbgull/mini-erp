import GenericEditableCell from '../shared/GenericEditableCell';
import type { POEditableCellProps } from '../../types';

const DEFAULT_FIELD_ORDER = ['name', 'quantity', 'unit_price'] as const;

export default function PurchaseOrderEditableCell(props: POEditableCellProps) {
  return (
    <GenericEditableCell
      value={props.value}
      itemId={props.itemId}
      field={props.field}
      type={props.type}
      isLastItem={props.isLastItem}
      items={props.items}
      fieldOrder={props.fieldOrder || DEFAULT_FIELD_ORDER}
      editingCell={props.editingCell}
      onEditingCell={props.onEditingCell}
      onUpdateItem={props.onUpdateItem as (itemId: number, field: string, value: unknown) => void}
      onAddNewItem={props.onAddNewItem}
      getNextField={props.getNextField}
    />
  );
}
