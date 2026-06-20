import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import Button from '../common/Button';
import FormInput from '../common/FormInput';
import { POSearchableCellEditing } from './PurchaseOrderSearchableCell';
import PurchaseOrderEditableCell from './PurchaseOrderEditableCell';
import type { POMobileFormProps, POFormItem } from '../../types';

const FIELD_ORDER = ['name', 'quantity', 'unit_price'] as const;

const getNextField = (currentField: string): string | undefined => {
  const fieldOrder = ['name', 'quantity', 'unit_price'];
  const currentIndex = fieldOrder.indexOf(currentField);
  return fieldOrder[currentIndex + 1];
};

const isLastField = (field: string): boolean => {
  return field === 'unit_price';
};

export default function PurchaseOrderMobileForm({
  supplier,
  suppliers,
  items,
  inventoryItems,
  poDate,
  deliveryDate,
  status,
  warehouseId,
  warehouses,
  notes,
  isEditMode,
  isSaving,
  formatCurrency,
  calculateItemTotal,
  calculateSubtotal,
  calculateTotal,
  onSelectSupplier,
  onUpdateItem,
  onUpdatePoDate,
  onUpdateDeliveryDate,
  onUpdateStatus,
  onUpdateWarehouse,
  onUpdateNotes,
  onAddNewItem,
  onRemoveItem,
  onSubmit,
  onCancel,
}: POMobileFormProps) {
  const [editingCell, setEditingCell] = useState<string | null>(null);

  return (
    <div className="po-form-page">
      <div className="form-header">
        <h2>{isEditMode ? 'Edit Purchase Order' : 'New Purchase Order'}</h2>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
          <X size={24} />
        </button>
      </div>

      <form className="po-form" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
        {/* Supplier */}
        <div className="form-section">
          <div className="form-section-header"><h3>Purchase Order Details</h3></div>
          <div className="form-section-content">
            <div className="po-details-grid">
              <div className="po-detail-card">
                <label>Supplier *</label>
                <FormInput
                  name="supplier_name"
                  type="searchable-select"
                  value={supplier ? supplier.supplier_name : ''}
                  onChange={(e) => {
                    const selected = suppliers.find(s => s.supplier_name === e.target.value);
                    if (selected) onSelectSupplier(selected);
                  }}
                  options={suppliers.map(s => ({
                    value: s.supplier_name,
                    label: `${s.supplier_name}${s.supplier_code ? ` (${s.supplier_code})` : ''}`
                  }))}
                  placeholder="Search supplier..."
                />
              </div>
              <div className="po-detail-card">
                <label>PO Date *</label>
                <input
                  type="date"
                  value={poDate}
                  onChange={(e) => onUpdatePoDate(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="po-detail-card">
                <label>Expected Delivery</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => onUpdateDeliveryDate(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="po-detail-card">
                <label>Warehouse (for receipt)</label>
                <FormInput
                  name="warehouse_id"
                  type="searchable-select"
                  value={warehouseId}
                  onChange={(e) => onUpdateWarehouse(e.target.value)}
                  options={warehouses.map(w => ({
                    value: w.id,
                    label: `${w.warehouse_code} - ${w.warehouse_name}`
                  }))}
                  placeholder="Select warehouse..."
                />
              </div>
              <div className="po-detail-card">
                <label>Status</label>
                <select
                  value={status}
                  onChange={(e) => onUpdateStatus(e.target.value)}
                  className="form-select"
                  disabled={isEditMode}
                >
                  <option value="Draft">Draft</option>
                  <option value="Submitted">Submitted</option>
                </select>
              </div>
            </div>

            <div className="notes-row">
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
        </div>

        {/* Line Items */}
        <div className="form-section">
          <div className="form-section-header"><h3>Line Items</h3></div>
          <div className="form-section-content">
            <div className="items-header-modern">
              <div className="items-header-left">
                <button
                  type="button"
                  className="add-item-btn-modern"
                  onClick={() => onAddNewItem()}
                >
                  <Plus size={16} />
                  Add Item
                </button>
              </div>
            </div>

            <div className="items-table-container-modern">
              <table className="items-table-modern">
                <thead>
                  <tr>
                    <th className="serial-col">#</th>
                    <th className="description-col">Item *</th>
                    <th className="quantity-col">Qty *</th>
                    <th className="rate-col">Unit Price *</th>
                    <th className="amount-col">Amount</th>
                    <th className="delete-col"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id}>
                      <td className="serial-col">{index + 1}</td>
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
                          onEditingCell={setEditingCell}
                        />
                      </td>
                      <td className="invoice-item-cell">
                        <PurchaseOrderEditableCell
                          value={item.quantity}
                          itemId={item.id}
                          field="quantity"
                          type="number"
                          isLastItem={index === items.length - 1}
                          items={items}
                          fieldOrder={FIELD_ORDER}
                          editingCell={editingCell}
                          onEditingCell={setEditingCell}
                          onUpdateItem={onUpdateItem}
                          onAddNewItem={onAddNewItem}
                          getNextField={getNextField}
                          isLastField={isLastField}
                        />
                      </td>
                      <td className="invoice-item-cell">
                        <PurchaseOrderEditableCell
                          value={item.unit_price}
                          itemId={item.id}
                          field="unit_price"
                          type="number"
                          isLastItem={index === items.length - 1}
                          items={items}
                          fieldOrder={FIELD_ORDER}
                          editingCell={editingCell}
                          onEditingCell={setEditingCell}
                          onUpdateItem={onUpdateItem}
                          onAddNewItem={onAddNewItem}
                          getNextField={getNextField}
                          isLastField={isLastField}
                        />
                      </td>
                      <td className="amount-cell-modern">
                        {formatCurrency(calculateItemTotal(item))}
                      </td>
                      <td className="invoice-item-cell">
                        <button
                          type="button"
                          className="remove-btn-modern"
                          onClick={() => onRemoveItem(item.id)}
                        >
                          <Trash2 className="trash-icon" size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Totals */}
        <div className="form-section">
          <div className="form-section-content">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '200px', padding: '0.5rem 0' }}>
                <span style={{ fontWeight: 500, color: 'var(--text-secondary, #6b7280)' }}>Subtotal:</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(calculateSubtotal())}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '200px', padding: '0.75rem 0 0', borderTop: '2px solid #d1d5db', fontSize: '1.125rem' }}>
                <span style={{ fontWeight: 500, color: 'var(--text-secondary, #6b7280)' }}>Total:</span>
                <span style={{ fontWeight: 700, color: 'var(--info, #2563eb)', fontSize: '1.25rem' }}>{formatCurrency(calculateTotal())}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSaving}
          >
            {isEditMode ? 'Update' : 'Create'} Purchase Order
          </Button>
        </div>
      </form>
    </div>
  );
}
