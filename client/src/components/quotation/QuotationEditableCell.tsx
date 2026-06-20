import GenericEditableCell from '../shared/GenericEditableCell';
import type { QuotationEditableCellProps } from '../../types';

export default function QuotationEditableCell(props: QuotationEditableCellProps) {
  return (
    <GenericEditableCell
      value={props.value}
      itemId={props.itemId}
      field={props.field}
      type={props.type}
      isLastItem={props.isLastItem}
      items={props.items}
      fieldOrder={props.fieldOrder || []}
      editingCell={props.editingCell}
      onEditingCell={props.onEditingCell}
      onUpdateItem={props.onUpdateItem as (itemId: number, field: string, value: unknown) => void}
      onAddNewItem={props.onAddNewItem}
      getNextField={props.getNextField}
      isLastField={props.isLastField}
    />
  );
}
