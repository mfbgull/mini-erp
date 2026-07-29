import { memo } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import SOSearchableCell from './SalesOrderSearchableCell';
import SOEditableCell from './SalesOrderEditableCell';
import type { SOItemsTableProps } from '../../types';
import { getFieldOrder } from '../../utils/salesOrderCalculations';

const SOItemsTable = memo(function SOItemsTable({
  items, editingCell, inventoryItems, notes,
  onSetNotes, onSetEditingCell, onUpdateItem, onRemoveItem, onAddNewItem,
  onSetPendingFocus, onSetNewItemId,
  formatCurrency, getCurrencySymbol,
  calculateItemTotal, calculateSubtotal, calculateDiscount, calculateTax, calculateTotal,
  getNextField,
}: SOItemsTableProps) {
  const fieldOrder = getFieldOrder();

  return (
    <div className="invoice-body-modern">
      <div className="items-header-modern">
        <div className="items-header-left">
          <h3 className="items-title-modern">Line Items</h3>
        </div>
        <button
          onClick={() => { const id = onAddNewItem(); onSetNewItemId(id); }}
          className="add-item-btn-modern"
        >
          <Plus className="action-icon" /> Add Item
        </button>
      </div>

      <div className="items-table-container-modern">
        <table className="items-table-modern">
          <thead>
            <tr>
              <th className="text-center serial-col">#</th>
              <th className="text-left description-col">Item</th>
              <th className="text-right quantity-col">Qty</th>
              <th className="text-right rate-col">Rate</th>
              <th className="text-right discount-col">Discount</th>
              <th className="text-right tax-col">Tax %</th>
              <th className="text-right amount-col">Amount</th>
              <th className="delete-col"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id}>
                <td className="text-center serial-col">{index + 1}</td>
                <td className="invoice-item-cell">
                  <SOSearchableCell
                    value={item.name} itemId={item.id} inventoryItems={inventoryItems}
                    soItems={items} isLastItem={index === items.length - 1}
                    editingCell={editingCell} onSetEditingCell={onSetEditingCell}
                    onUpdateItem={onUpdateItem} onAddNewItem={onAddNewItem}
                    onSetPendingFocus={onSetPendingFocus} formatCurrency={formatCurrency}
                    getNextField={(f) => getNextField(f, 'item')}
                  />
                </td>
                <td className="text-right invoice-item-cell">
                  <SOEditableCell value={item.quantity} itemId={item.id} field="quantity"
                    type="number" isLastItem={index === items.length - 1}
                    editingCell={editingCell} items={items} fieldOrder={fieldOrder}
                    onSetEditingCell={onSetEditingCell} onUpdateItem={onUpdateItem}
                    onAddNewItem={onAddNewItem} onSetPendingFocus={onSetPendingFocus}
                    getNextField={(f) => getNextField(f, 'item')} />
                </td>
                <td className="text-right rate-cell-container invoice-item-cell">
                  <SOEditableCell value={item.unitPrice.toFixed(2)} itemId={item.id} field="unitPrice"
                    type="number" isLastItem={index === items.length - 1}
                    editingCell={editingCell} items={items} fieldOrder={fieldOrder}
                    onSetEditingCell={onSetEditingCell} onUpdateItem={onUpdateItem}
                    onAddNewItem={onAddNewItem} onSetPendingFocus={onSetPendingFocus}
                    getNextField={(f) => getNextField(f, 'item')} />
                </td>
                <td className="text-right invoice-item-cell">
                  <div className="discount-cell-modern">
                    <select value={item.discount.type}
                      onChange={(e) => onUpdateItem(item.id, 'discountType', e.target.value)}
                      className="discount-type-select-modern">
                      <option value="percentage">%</option>
                      <option value="flat">{getCurrencySymbol()}</option>
                    </select>
                    <SOEditableCell value={item.discount.value} itemId={item.id} field="discountValue"
                      type="number" isLastItem={index === items.length - 1}
                      editingCell={editingCell} items={items} fieldOrder={fieldOrder}
                      onSetEditingCell={onSetEditingCell} onUpdateItem={onUpdateItem}
                      onAddNewItem={onAddNewItem} onSetPendingFocus={onSetPendingFocus}
                      getNextField={(f) => getNextField(f, 'item')} />
                  </div>
                </td>
                <td className="text-right invoice-item-cell">
                  <SOEditableCell value={item.taxRate} itemId={item.id} field="taxRate"
                    type="number" isLastItem={index === items.length - 1}
                    editingCell={editingCell} items={items} fieldOrder={fieldOrder}
                    onSetEditingCell={onSetEditingCell} onUpdateItem={onUpdateItem}
                    onAddNewItem={onAddNewItem} onSetPendingFocus={onSetPendingFocus}
                    getNextField={(f) => getNextField(f, 'item')} />
                </td>
                <td className="text-right amount-cell-modern">{formatCurrency(calculateItemTotal(item))}</td>
                <td className="text-center invoice-item-cell">
                  <button onClick={() => onRemoveItem(item.id)} className="remove-btn-modern" title="Remove item">
                    <Trash2 className="trash-icon" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Notes + Totals */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div className="invoice-footer-modern" style={{ flex: 1, minWidth: 0 }}>
          <div>
            <label className="footer-label">NOTES</label>
            <textarea value={notes} onChange={(e) => onSetNotes(e.target.value)}
              rows={3} className="footer-textarea"
              placeholder="Additional notes for this sales order..." />
          </div>
        </div>
        <div className="totals-breakdown-modern" style={{ width: '280px', flexShrink: 0 }}>
          <div className="total-row-modern">
            <span>Subtotal:</span>
            <span className="total-value">{formatCurrency(calculateSubtotal())}</span>
          </div>
          <div className="total-row-modern">
            <span>Discount:</span>
            <span className="discount-amount">-{formatCurrency(calculateDiscount())}</span>
          </div>
          <div className="total-row-modern border-top">
            <span>Tax:</span>
            <span className="total-value">{formatCurrency(calculateTax())}</span>
          </div>
          <div className="total-row-modern total-final">
            <span>Total:</span>
            <span className="total-amount-final">{formatCurrency(calculateTotal())}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default SOItemsTable;
