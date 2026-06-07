import { Plus, ChevronRight, Trash2, Minus, Package } from 'lucide-react';

import Button from '../../components/common/Button';
import { useInvoice } from '../../context/InvoiceContext';
import '../../styles/pages/invoice.css';

export default function InvoiceStep2Items() {
  const { 
    items, 
    dispatch, 
    calculateSubtotal,
    goToStep
  } = useInvoice();

  const handleQuantityChange = (id: string, delta: number) => {
    const item = items.find(i => i.id === id);
    if (item) {
      const newQuantity = Math.max(1, item.quantity + delta);
      dispatch({
        type: 'UPDATE_ITEM',
        payload: { id, updates: { quantity: newQuantity } }
      });
    }
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Delete this item?')) {
      dispatch({ type: 'DELETE_ITEM', payload: id });
    }
  };

  const handleContinue = () => {
    if (items.length === 0) {
      alert('Please add at least one item');
      return;
    }
    goToStep(4);
  };

  // Empty state
  if (items.length === 0) {
    return (
      <div className="miw-step-2">
        <div className="miw-empty">
          <div className="miw-empty-icon">
            <Package size={32} />
          </div>
          <div className="miw-empty-title">No items yet</div>
          <div className="miw-empty-message">
            Add products or services to this invoice to get started
          </div>
          <div className="miw-wizard-actions miw-mt-24">
            <Button
              variant="primary"
              onClick={() => goToStep(3)}
              className="miw-w-100"
            >
              <Plus size={18} />
              Add First Item
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate total with tax
  const subtotal = calculateSubtotal();

  return (
    <div className="miw-step-2">
      {/* Items List */}
      <div className="miw-section-title-bar">
        <Package size={16} />
        <span>Invoice Items ({items.length})</span>
      </div>

      <div className="miw-items-list-po">
        {items.map((item, index) => (
          <div key={item.id} className="miw-item-row-po miw-item-row-po-compact">
            <div className="miw-item-po-index">{index + 1}</div>
            <div className="miw-item-info-po">
              <span className="miw-item-name-po">{item.name}</span>
              <span className="miw-item-unit-price-po">
                ${item.unitPrice.toFixed(2)} × {item.quantity}
                {item.discount > 0 && <span className="miw-item-discount-badge-po">-{item.discount}%</span>}
                {item.taxRate > 0 && <span className="miw-item-tax-badge-po">{item.taxRate}%</span>}
              </span>
            </div>
            <div className="miw-item-po-right">
              <div className="miw-item-qty-po">
                <button
                  className="miw-item-qty-btn-po"
                  onClick={() => handleQuantityChange(item.id, -1)}
                  disabled={item.quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <span className="miw-item-qty-value-po">{item.quantity}</span>
                <button
                  className="miw-item-qty-btn-po"
                  onClick={() => handleQuantityChange(item.id, 1)}
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
              </div>
              <div className="miw-item-total-po">
                ${item.amount.toFixed(2)}
              </div>
              <button
                onClick={() => handleDeleteItem(item.id)}
                className="miw-delete-btn-po"
                aria-label="Delete item"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      {items.length > 0 && (
        <div className="miw-summary-card-po">
          <div className="miw-summary-row-po">
            <span className="miw-summary-label-po">Items</span>
            <span className="miw-summary-value-po">{items.length}</span>
          </div>
          <div className="miw-summary-row-po">
            <span className="miw-summary-label-po">Subtotal</span>
            <span className="miw-summary-value-po miw-summary-value-primary">
              ${subtotal.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="miw-wizard-actions">
        <Button variant="secondary" onClick={() => goToStep(3)}>
          <Plus size={18} />
          Add More
        </Button>
        <Button variant="primary" onClick={handleContinue}>
          Continue
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}
