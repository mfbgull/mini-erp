import { useState } from 'react';

import { X, RotateCcw } from 'lucide-react';

import Button from '../../components/common/Button';
import { formatCurrency } from '../../utils/formatters';
import './PurchaseReturn.css';

interface Purchase {
  id: number;
  purchase_no: string;
  supplier_name: string;
  quantity: number;
  rate: number;
  amount: number;
  item_name: string;
  item_code: string;
  unit_of_measure?: string;
  purchase_date: string;
  status: string;
}

interface PurchaseReturnItem {
  quantity: number;
  reason: string;
}

interface PurchaseReturnProps {
  purchase: Purchase;
  onClose: () => void;
  onSubmit: (items: PurchaseReturnItem) => void;
  loading?: boolean;
}

export default function PurchaseReturn({ purchase, onClose, onSubmit, loading }: PurchaseReturnProps) {
  const [returnQuantity, setReturnQuantity] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const maxQuantity = purchase.quantity || 0;
  const returnAmount = returnQuantity * (purchase.rate || 0);

  const handleQuantityChange = (value: string) => {
    const qty = parseInt(value, 10);
    if (isNaN(qty) || qty < 0) {
      setReturnQuantity(0);
      return;
    }
    if (qty > maxQuantity) {
      setReturnQuantity(maxQuantity);
      return;
    }
    setReturnQuantity(qty);
    setError('');
  };

  const handleSubmit = () => {
    if (returnQuantity <= 0) {
      setError('Return quantity must be greater than 0');
      return;
    }
    if (returnQuantity > maxQuantity) {
      setError(`Return quantity cannot exceed ${maxQuantity}`);
      return;
    }
    onSubmit({ quantity: returnQuantity, reason });
  };

  return (
    <div className="purchase-return-overlay" onClick={onClose}>
      <div className="purchase-return-container" onClick={(e) => e.stopPropagation()}>
        <div className="purchase-return-header">
          <div className="purchase-return-header-left">
            <RotateCcw className="purchase-return-header-icon" />
            <div>
              <h2 className="purchase-return-title">Purchase Return</h2>
              <p className="purchase-return-subtitle">{purchase.purchase_no}</p>
            </div>
          </div>
          <button className="purchase-return-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="purchase-return-body">
          {/* Purchase Info */}
          <div className="purchase-return-info-grid">
            <div className="purchase-return-info-item">
              <span className="purchase-return-info-label">Supplier</span>
              <span className="purchase-return-info-value">{purchase.supplier_name}</span>
            </div>
            <div className="purchase-return-info-item">
              <span className="purchase-return-info-label">Date</span>
              <span className="purchase-return-info-value">{purchase.purchase_date}</span>
            </div>
            <div className="purchase-return-info-item">
              <span className="purchase-return-info-label">Status</span>
              <span className="purchase-return-info-value">{purchase.status}</span>
            </div>
            <div className="purchase-return-info-item">
              <span className="purchase-return-info-label">Total Amount</span>
              <span className="purchase-return-info-value">{formatCurrency(purchase.amount || 0)}</span>
            </div>
          </div>

          {/* Item Detail */}
          <div className="purchase-return-item-list">
            <div className="purchase-return-item-row header-row">
              <span className="purchase-return-item-field item-name-col">Item</span>
              <span className="purchase-return-item-field item-qty-col">Original Qty</span>
              <span className="purchase-return-item-field item-rate-col">Rate</span>
              <span className="purchase-return-item-field item-return-col">Return Qty</span>
              <span className="purchase-return-item-field item-amount-col">Return Value</span>
            </div>
            <div className="purchase-return-item-row">
              <div className="purchase-return-item-field item-name-col">
                <span className="item-code-label">{purchase.item_code}</span>
                <span className="item-name-label">{purchase.item_name}</span>
              </div>
              <span className="purchase-return-item-field item-qty-col">{maxQuantity}</span>
              <span className="purchase-return-item-field item-rate-col">{formatCurrency(purchase.rate || 0)}</span>
              <div className="purchase-return-item-field item-return-col">
                <input
                  type="number"
                  className="purchase-return-qty-input"
                  min={0}
                  max={maxQuantity}
                  value={returnQuantity || ''}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  placeholder="0"
                />
              </div>
              <span className="purchase-return-item-field item-amount-col purchase-return-amount">
                {formatCurrency(returnAmount)}
              </span>
            </div>
          </div>

          {/* Reason */}
          <div className="purchase-return-reason">
            <label className="purchase-return-reason-label">Reason for Return (optional)</label>
            <textarea
              className="purchase-return-reason-input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for return..."
              rows={2}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="purchase-return-error">
              <span>{error}</span>
            </div>
          )}

          {/* Summary */}
          <div className="purchase-return-summary">
            <div className="purchase-return-summary-row">
              <span>Returning</span>
              <span>{returnQuantity} of {maxQuantity} units</span>
            </div>
            <div className="purchase-return-summary-row total">
              <span>Total Return Value</span>
              <span>{formatCurrency(returnAmount)}</span>
            </div>
          </div>
        </div>

        <div className="purchase-return-footer">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={loading}
            disabled={returnQuantity <= 0}
          >
            Process Return
          </Button>
        </div>
      </div>
    </div>
  );
}
