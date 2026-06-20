import GenericEditableCell from '../shared/GenericEditableCell';
import type { EditableCellProps } from '../../types';

export default function InvoiceEditableCell(props: EditableCellProps) {
  return (
    <GenericEditableCell
      value={props.value}
      itemId={props.itemId}
      field={props.field}
      type={props.type}
      isLastItem={props.isLastItem}
      items={props.items}
      fieldOrder={props.fieldOrder}
      editingCell={props.editingCell}
      onEditingCell={props.onSetEditingCell}
      onUpdateItem={props.onUpdateItem}
      onAddNewItem={props.onAddNewItem}
      onSetPendingFocus={props.onSetPendingFocus}
      getNextField={props.getNextField}
      isLastField={props.isLastField}
    />
  );
}
