import { memo } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import InvoiceSearchableCell from './InvoiceSearchableCell';
import InvoiceEditableCell from './InvoiceEditableCell';
import PriceHistoryHint from './PriceHistoryHint';
import type { ItemsTableProps } from '../../utils/invoiceTypes';
import { getFieldOrder } from '../../utils/invoiceCalculations';

const InvoiceItemsTable = memo(function InvoiceItemsTable({
  invoice,
  items,
  editingCell,
  errors,
  priceHint,
  onSetEditingCell,
  onUpdateItem,
  onRemoveItem,
  onAddNewItem,
  onSetPendingFocus,
  onSetPriceHint,
  onUpdateInvoice,
  onSetNewItemId,
  formatCurrency,
  getCurrencySymbol,
  calculateItemTotal,
  calculateSubtotal,
  calculateTax,
  calculateDiscount,
  calculateTotal,
  getNextField,
  isLastField,
}: ItemsTableProps) {
  const fieldOrder = getFieldOrder(invoice.discountScope);

  return (
    <>
      {/* Items Header */}
      <div className="items-header-modern">
        <div className="items-header-left">
          <h3 className="items-title-modern">Line Items</h3>
          <div className="discount-scope-controls-modern">
            <span className="discount-label-modern">Discount:</span>
            <label className="discount-scope-option-modern">
              <input
                type="radio"
                name="discountScope"
                value="invoice"
                checked={invoice.discountScope === 'invoice'}
                onChange={(e) => onUpdateInvoice({ discountScope: e.target.value as 'item' | 'invoice' })}
              />
              <span>Invoice Level</span>
            </label>
            <label className="discount-scope-option-modern">
              <input
                type="radio"
                name="discountScope"
                value="item"
                checked={invoice.discountScope === 'item'}
                onChange={(e) => onUpdateInvoice({ discountScope: e.target.value as 'item' | 'invoice' })}
              />
              <span>Per Item</span>
            </label>
          </div>
        </div>
        <button
          onClick={() => {
            const newId = onAddNewItem();
            onSetNewItemId(newId);
          }}
          className="add-item-btn-modern"
        >
          <Plus className="action-icon" />
          Add Item
        </button>
      </div>
      {errors.items && (
        <div className="field-error items-error">{errors.items}</div>
      )}

      {/* Items Table */}
      <div className="items-table-container-modern">
        <table className="items-table-modern">
          <thead>
            <tr>
              <th className="text-center serial-col">#</th>
              <th className="text-left description-col">Description</th>
              <th className="text-right quantity-col">Qty</th>
              <th className="text-right rate-col">Rate</th>
              {invoice.discountScope === 'item' && (
                <th className="text-right discount-col">Discount</th>
              )}
              <th className="text-right tax-col">Tax %</th>
              <th className="text-right amount-col">Amount</th>
              <th className="delete-col"></th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={item.id}>
                <td className="text-center serial-col">{index + 1}</td>
                <td className="invoice-item-cell">
                  <InvoiceSearchableCell
                    value={item.description}
                    itemId={item.id}
                    items={items}
                    invoiceItems={invoice.items}
                    isLastItem={index === invoice.items.length - 1}
                    editingCell={editingCell}
                    onSetEditingCell={onSetEditingCell}
                    onUpdateItem={onUpdateItem}
                    onAddNewItem={onAddNewItem}
                    onSetPendingFocus={onSetPendingFocus}
                    formatCurrency={formatCurrency}
                    getNextField={(f) => getNextField(f, invoice.discountScope)}
                    isLastField={isLastField}
                  />
                </td>
                <td className="text-right invoice-item-cell">
                  <InvoiceEditableCell
                    value={item.quantity}
                    itemId={item.id}
                    field="quantity"
                    type="number"
                    isLastItem={index === invoice.items.length - 1}
                    editingCell={editingCell}
                    items={invoice.items}
                    fieldOrder={fieldOrder}
                    onSetEditingCell={(cellId) => onSetEditingCell(cellId)}
                    onUpdateItem={onUpdateItem}
                    onAddNewItem={onAddNewItem}
                    onSetPendingFocus={onSetPendingFocus}
                    getNextField={(f) => getNextField(f, invoice.discountScope)}
                    isLastField={isLastField}
                  />
                </td>
                <td className="text-right rate-cell-container invoice-item-cell" data-rate-cell={item.id}>
                  <InvoiceEditableCell
                    value={item.rate.toFixed(2)}
                    itemId={item.id}
                    field="rate"
                    type="number"
                    isLastItem={index === invoice.items.length - 1}
                    editingCell={editingCell}
                    items={invoice.items}
                    fieldOrder={fieldOrder}
                    onSetEditingCell={(cellId) => onSetEditingCell(cellId)}
                    onUpdateItem={onUpdateItem}
                    onAddNewItem={onAddNewItem}
                    onSetPendingFocus={onSetPendingFocus}
                    getNextField={(f) => getNextField(f, invoice.discountScope)}
                    isLastField={isLastField}
                  />
                </td>
                {invoice.discountScope === 'item' && (
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
                      <InvoiceEditableCell
                        value={item.discount.value}
                        itemId={item.id}
                        field="discountValue"
                        type="number"
                        isLastItem={index === invoice.items.length - 1}
                        editingCell={editingCell}
                        items={invoice.items}
                        fieldOrder={fieldOrder}
                        onSetEditingCell={(cellId) => onSetEditingCell(cellId)}
                        onUpdateItem={onUpdateItem}
                        onAddNewItem={onAddNewItem}
                        onSetPendingFocus={onSetPendingFocus}
                        getNextField={(f) => getNextField(f, invoice.discountScope)}
                        isLastField={isLastField}
                      />
                    </div>
                  </td>
                )}
                <td className="text-right invoice-item-cell">
                  <InvoiceEditableCell
                    value={item.tax}
                    itemId={item.id}
                    field="tax"
                    type="number"
                    isLastItem={index === invoice.items.length - 1}
                    editingCell={editingCell}
                    items={invoice.items}
                    fieldOrder={fieldOrder}
                    onSetEditingCell={(cellId) => onSetEditingCell(cellId)}
                    onUpdateItem={onUpdateItem}
                    onAddNewItem={onAddNewItem}
                    onSetPendingFocus={onSetPendingFocus}
                    getNextField={(f) => getNextField(f, invoice.discountScope)}
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

      {/* Price History Tooltip */}
      {priceHint && priceHint.history && (
        <div
          className="price-hint-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onSetPriceHint(null);
            }
          }}
        >
          <div
            className="price-hint-container"
            onMouseDown={(e) => {
              e.preventDefault();
            }}
          >
            <PriceHistoryHint
              history={priceHint.history}
              currentPrice={priceHint.currentPrice}
              onClose={() => onSetPriceHint(null)}
            />
          </div>
        </div>
      )}

      {/* Totals + Notes & Terms Row */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        {/* Notes & Terms */}
        <div className="invoice-footer-modern" style={{ flex: 1, minWidth: 0 }}>
          <div>
            <label className="footer-label">NOTES</label>
            <textarea
              value={invoice.notes}
              onChange={(e) => onUpdateInvoice({ notes: e.target.value })}
              rows={3}
              className="footer-textarea"
              placeholder="Thank you for your business..."
            />
          </div>
          <div>
            <label className="footer-label">TERMS & CONDITIONS</label>
            <textarea
              value={invoice.terms}
              onChange={(e) => onUpdateInvoice({ terms: e.target.value })}
              rows={3}
              className="footer-textarea"
              placeholder="Payment terms..."
            />
          </div>
        </div>

        {/* Totals */}
        <div className="totals-breakdown-modern" style={{ width: '280px', flexShrink: 0 }}>
          <div className="total-row-modern">
            <span>Subtotal:</span>
            <span className="total-value">{formatCurrency(calculateSubtotal())}</span>
          </div>

          {invoice.discountScope === 'invoice' ? (
            <div className="total-row-modern">
              <div className="discount-input-modern">
                <span>Discount:</span>
                <div className="discount-controls">
                  <select
                    value={invoice.discount.type}
                    onChange={(e) => onUpdateInvoice({
                      discount: { ...invoice.discount, type: e.target.value as 'flat' | 'percentage' }
                    })}
                    className="discount-type-select-modern"
                  >
                    <option value="percentage">%</option>
                    <option value="flat">{getCurrencySymbol()}</option>
                  </select>
                  <input
                    type="number"
                    value={invoice.discount.value}
                    onChange={(e) => onUpdateInvoice({
                      discount: { ...invoice.discount, value: Number(e.target.value) || 0 }
                    })}
                    className="discount-value-input"
                    placeholder="0"
                  />
                </div>
              </div>
              <span className="discount-amount">
                -{formatCurrency(calculateDiscount())}
              </span>
            </div>
          ) : (
            <div className="total-row-modern">
              <span>Discount (Per Item):</span>
              <span className="discount-amount">
                -{formatCurrency(calculateDiscount())}
              </span>
            </div>
          )}

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
    </>
  );
});

export default InvoiceItemsTable;
