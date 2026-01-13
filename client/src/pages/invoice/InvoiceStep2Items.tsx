import { useInvoice } from '../../context/InvoiceContext';
import { Trash2, Plus, Camera } from 'lucide-react';
import './MobileInvoice.css';

export default function InvoiceStep2Items() {
  const { 
    items, 
    dispatch, 
    calculateSubtotal,
    calculateTax,
    calculateDiscount,
    calculateTotal,
    calculateBalance,
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
        <div className="miw-empty-state">
          <div className="miw-empty-icon">
            <Plus size={24} />
          </div>
          <div className="miw-empty-title">No items yet</div>
          <div className="miw-empty-message">Tap the button below to add items to your invoice</div>
        </div>
        <div className="miw-step-actions">
          <button 
            className="btn btn-primary"
            onClick={() => goToStep(3)}
            style={{ 
              width: '100%',
              height: '48px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 600,
              boxShadow: '0 2px 4px rgba(54, 123, 245, 0.3)'
            }}
          >
            <Plus size={18} />
            Add Item
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="miw-step-2">
      {/* Items List */}
      {items.map((item) => (
        <div key={item.id} className="miw-item-card">
          <div 
            className="miw-item-content"
            onClick={() => goToStep(3)}
          >
            <div className="miw-item-name">{item.name}</div>
            <div className="miw-item-details">
              <div className="miw-quantity-control">
                <button 
                  className="miw-qty-btn"
                  onClick={(e) => { e.stopPropagation(); handleQuantityChange(item.id, -1); }}
                >
                  -
                </button>
                <span className="miw-qty-value">{item.quantity}</span>
                <button 
                  className="miw-qty-btn"
                  onClick={(e) => { e.stopPropagation(); handleQuantityChange(item.id, 1); }}
                >
                  +
                </button>
              </div>
              <span>@ ${item.unitPrice.toFixed(2)} | Tax: {item.taxRate}%</span>
            </div>
            <div className="miw-item-amount">${item.amount.toFixed(2)}</div>
          </div>
          <div className="miw-item-actions">
            <button 
              className="miw-item-action-btn miw-item-delete"
              onClick={() => handleDeleteItem(item.id)}
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      ))}

      {/* FAB - Add Item */}
      <button 
        className="miw-fab"
        onClick={() => goToStep(3)}
      >
        <Plus size={24} />
      </button>

      {/* Continue Button */}
      <div className="miw-step-actions">
        <button 
          className="btn btn-primary"
          onClick={handleContinue}
          style={{ 
            width: '100%',
            height: '48px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: '0 2px 4px rgba(54, 123, 245, 0.3)'
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
