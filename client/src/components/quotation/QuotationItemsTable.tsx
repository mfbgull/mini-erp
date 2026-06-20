import { useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import QuotationEditableCell from './QuotationEditableCell';
import { QuotationSearchableCellEditing } from './QuotationSearchableCell';
import { getFieldOrder, getNextField, isLastField } from '../../utils/quotationCalculations';
import type { QuotationItemsTableProps } from '../../types';
import type { InventoryItemOption } from '../../types';
import { getSellableItems } from '../../utils/quotationCalculations';

export default function QuotationItemsTable({
  items,
  editingCell,
  inventoryItems,
  formatCurrency,
  getCurrencySymbol,
  notes,
  terms,
  calculateSubtotal,
  calculateDiscount,
  calculateTax,
  calculateTotal,
  calculateItemTotal,
  onUpdateItem,
  onRemoveItem,
  onAddNewItem,
  onUpdateNotes,
  onUpdateTerms,
  onEditingCell,
  tableContainerRef,
  lastFocusedCellRef,
}: QuotationItemsTableProps) {
  const fieldOrder = getFieldOrder();

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
              <th className="text-left description-col">Description</th>
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
                  <QuotationSearchableCellEditing
                    value={item.description}
                    itemId={item.id}
                    isLastItem={index === items.length - 1}
                    inventoryItems={inventoryItems}
                    onUpdateItem={onUpdateItem}
                    onAddNewItem={onAddNewItem}
                    editingCell={editingCell}
                    onEditingCell={onEditingCell}
                  />
                </td>
                <td className="text-right invoice-item-cell">
                  <QuotationEditableCell
                    value={item.quantity}
                    itemId={item.id}
                    field="quantity"
                    type="number"
                    isLastItem={index === items.length - 1}
                    items={items}
                    fieldOrder={fieldOrder}
                    editingCell={editingCell}
                    onEditingCell={onEditingCell}
                    onUpdateItem={onUpdateItem}
                    onAddNewItem={onAddNewItem}
                    getNextField={getNextField}
                    isLastField={isLastField}
                  />
                </td>
                <td className="text-right rate-cell-container invoice-item-cell">
                  <QuotationEditableCell
                    value={item.rate.toFixed(2)}
                    itemId={item.id}
                    field="rate"
                    type="number"
                    isLastItem={index === items.length - 1}
                    items={items}
                    fieldOrder={fieldOrder}
                    editingCell={editingCell}
                    onEditingCell={onEditingCell}
                    onUpdateItem={onUpdateItem}
                    onAddNewItem={onAddNewItem}
                    getNextField={getNextField}
                    isLastField={isLastField}
                  />
                </td>
                <td className="text-right invoice-item-cell">
                  <div className="discount-cell-modern">
                    <select
                      value={item.discount.type}
                      onChange={(e) => onUpdateItem(item.id, 'discountType', e.target.value)}
                      className="discount-type-select-modern"
                    >
                      <option value="percentage">%</option>
                      <option value="flat">{getCurrencySymbol()}</option>
                    </select>
                    <QuotationEditableCell
                      value={item.discount.value}
                      itemId={item.id}
                      field="discountValue"
                      type="number"
                      isLastItem={index === items.length - 1}
                      items={items}
                      fieldOrder={fieldOrder}
                      editingCell={editingCell}
                      onEditingCell={onEditingCell}
                      onUpdateItem={onUpdateItem}
                      onAddNewItem={onAddNewItem}
                      getNextField={getNextField}
                      isLastField={isLastField}
                    />
                  </div>
                </td>
                <td className="text-right invoice-item-cell">
                  <QuotationEditableCell
                    value={item.tax}
                    itemId={item.id}
                    field="tax"
                    type="number"
                    isLastItem={index === items.length - 1}
                    items={items}
                    fieldOrder={fieldOrder}
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

      {/* Totals + Notes & Terms Row */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        {/* Notes & Terms - Left Side */}
        <div className="invoice-footer-modern" style={{ flex: 1, minWidth: 0 }}>
          <div>
            <label className="footer-label">NOTES</label>
            <textarea
              value={notes}
              onChange={(e) => onUpdateNotes(e.target.value)}
              rows={3}
              className="footer-textarea"
              placeholder="Additional notes for the customer..."
            />
          </div>
          <div>
            <label className="footer-label">TERMS & CONDITIONS</label>
            <textarea
              value={terms}
              onChange={(e) => onUpdateTerms(e.target.value)}
              rows={3}
              className="footer-textarea"
              placeholder="Terms and conditions..."
            />
          </div>
        </div>

        {/* Totals Card - Right Side */}
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
}
