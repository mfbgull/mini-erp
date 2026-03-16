import { Trash2, Plus, ChevronRight } from 'lucide-react';

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
      const newQuantity = Math.max(0, item.quantity + delta);
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
    goToStep(4); // Go to payment step (skipping add item as it opens in bottom sheet)
  };

  if (items.length === 0) {
    return (
      <div className="miw-step-2">
        <div className="miw-empty">
          <div className="miw-empty-icon">
            <Plus size={32} />
          </div>
          <div className="miw-empty-title">No items yet</div>
          <div className="miw-empty-message">Add items to your invoice</div>
        </div>
        <div className="miw-wizard-actions miw-mt-24">
          <Button
            variant="primary"
            onClick={() => goToStep(3)}
          >
            <Plus size={18} />
            Add Item
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="miw-step-2">
      <div className="miw-items-list-po">
        {items.map((item) => (
          <div key={item.id} className="miw-item-row-po">
            <div className="miw-item-info-po">
              <span className="miw-item-name-po">{item.name}</span>
              <span className="miw-item-code-po">Qty: {item.quantity} @ ${item.unitPrice.toFixed(2)}</span>
              <span className="miw-item-price-po">${item.amount.toFixed(2)}</span>
            </div>
            <div className="miw-item-quantity-po">
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => {
                  const qty = parseInt(e.target.value) || 0;
                  if (qty > 0) {
                    dispatch({
                      type: 'UPDATE_ITEM',
                      payload: { id: item.id, updates: { quantity: qty } }
                    });
                  }
                }}
                className="miw-qty-input-po"
              />
              <button
                onClick={() => handleDeleteItem(item.id)}
                className="miw-delete-btn"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {items.length > 0 && (
        <div className="miw-items-summary">
          <span>{items.length} item{items.length !== 1 ? 's' : ''}</span>
          <span>Subtotal: ${calculateSubtotal().toFixed(2)}</span>
        </div>
      )}

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
