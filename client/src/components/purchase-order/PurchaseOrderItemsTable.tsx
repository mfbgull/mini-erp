import { Plus, Trash2 } from 'lucide-react';
import PurchaseOrderEditableCell from './PurchaseOrderEditableCell';
import { POSearchableCellEditing } from './PurchaseOrderSearchableCell';
import type { POItemsTableProps } from '../../utils/purchaseOrderTypes';

const FIELD_ORDER = ['name', 'quantity', 'unit_price'] as const;

const getNextField = (currentField: string): string | undefined => {
  const fieldOrder = ['name', 'quantity', 'unit_price'];
  const currentIndex = fieldOrder.indexOf(currentField);
  return fieldOrder[currentIndex + 1];
};

const isLastField = (field: string): boolean => {
  return field === 'unit_price';
};

export default function PurchaseOrderItemsTable({
  items,
  editingCell,
  inventoryItems,
  formatCurrency,
  notes,
  calculateSubtotal,
  calculateTotal,
  calculateItemTotal,
  onUpdateItem,
  onRemoveItem,
  onAddNewItem,
  onUpdateNotes,
  onEditingCell,
  tableContainerRef,
  lastFocusedCellRef,
}: POItemsTableProps) {
  return (
    <div className="invoice-body-modern">
      <div className="items-header-modern">
        <div className="items-header-left">
          <h3 className="items-title-modern">Line Items</h3>
        </div>
        <button onClick={onAddNewItem} className="add-item-btn-modern">
          <Plus className="action-icon" />
          Add Item
        </button>
      </div>

      <div
        ref={tableContainerRef}
        className="items-table-container-modern"
        onMouseEnter={() => {
          if (lastFocusedCellRef.current) {
            const el = document.querySelector(`[data-cell-id="${lastFocusedCellRef.current}"]`);
            if (el) (el as HTMLElement).focus();
          }
        }}
      >
        <table className="items-table-modern">
          <thead>
            <tr>
              <th className="text-center serial-col">#</th>
              <th className="text-left description-col">Item</th>
              <th className="text-right quantity-col">Qty</th>
              <th className="text-right rate-col">Unit Price</th>
              <th className="text-right amount-col">Amount</th>
              <th className="delete-col"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id}>
                <td className="text-center serial-col">{index + 1}</td>
                <td className="invoice-item-cell">
                  <POSearchableCellEditing
                    value={item.name}
                    itemId={item.id}
                    isLastItem={index === items.length - 1}
                    inventoryItems={inventoryItems}
                    onUpdateItem={onUpdateItem}
                    onAddNewItem={onAddNewItem}
                    formatCurrency={formatCurrency}
                    editingCell={editingCell}
                    onEditingCell={onEditingCell}
                  />
                </td>
                <td className="text-right invoice-item-cell">
                  <PurchaseOrderEditableCell
                    value={item.quantity}
                    itemId={item.id}
                    field="quantity"
                    type="number"
                    isLastItem={index === items.length - 1}
                    items={items}
                    fieldOrder={FIELD_ORDER}
                    editingCell={editingCell}
                    onEditingCell={onEditingCell}
                    onUpdateItem={onUpdateItem}
                    onAddNewItem={onAddNewItem}
                    getNextField={getNextField}
                    isLastField={isLastField}
                  />
                </td>
                <td className="text-right rate-cell-container invoice-item-cell">
                  <PurchaseOrderEditableCell
                    value={item.unit_price.toFixed(2)}
                    itemId={item.id}
                    field="unit_price"
                    type="number"
                    isLastItem={index === items.length - 1}
                    items={items}
                    fieldOrder={FIELD_ORDER}
                    editingCell={editingCell}
                    onEditingCell={onEditingCell}
                    onUpdateItem={onUpdateItem}
                    onAddNewItem={onAddNewItem}
                    getNextField={getNextField}
                    isLastField={isLastField}
                  />
                </td>
                <td className="text-right amount-cell-modern">
                  {formatCurrency(calculateItemTotal(item))}
                </td>
                <td className="text-center invoice-item-cell">
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="remove-btn-modern"
                    title="Remove item"
                  >
                    <Trash2 className="trash-icon" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals + Notes - Side by Side */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        {/* Notes - Left Side */}
        <div className="invoice-footer-modern" style={{ flex: 1, minWidth: 0 }}>
          <div>
            <label className="footer-label">NOTES</label>
            <textarea
              value={notes}
              onChange={(e) => onUpdateNotes(e.target.value)}
              rows={3}
              className="footer-textarea"
              placeholder="Additional notes for this purchase order..."
            />
          </div>
        </div>

        {/* Totals Card - Right Side */}
        <div className="totals-breakdown-modern" style={{ width: '280px', flexShrink: 0 }}>
          <div className="total-row-modern">
            <span>Subtotal:</span>
            <span className="total-value">{formatCurrency(calculateSubtotal())}</span>
          </div>
          <div className="total-row-modern total-final">
            <span>Total:</span>
            <span className="total-amount-final">{formatCurrency(calculateTotal())}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
