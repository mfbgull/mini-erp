import GenericEditableCell from '../shared/GenericEditableCell';
import type { SOEditableCellProps } from '../../types';

export default function SalesOrderEditableCell(props: SOEditableCellProps) {
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
    />
  );
}
