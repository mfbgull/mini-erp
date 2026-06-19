import { useState, useEffect, useRef, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Barcode, Search, Plus, Minus, Trash2, ShoppingCart, DollarSign, Check } from 'lucide-react';

import { useSettings } from '../../context/SettingsContext';
import api from '../../utils/api';
import type { POSItem, CartItem, PaymentMethod, POSWarehouse } from '../../utils/posTypes';
import './POSPage.css';

interface SaleData {
  warehouse_id: number;
  sale_date: string;
  items: Array<{ item_id: number; quantity: number; unit_price: number }>;
  cash_received: number;
  customer_name: string;
}

export default function POSPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { formatCurrency } = useSettings();
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [warehouse, setWarehouse] = useState<POSWarehouse | null>(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { id: Date.now(), method: 'Cash', amount: '', reference_no: '' }
  ]);

  const { data: items = [] } = useQuery<POSItem[]>({
    queryKey: ['items'],
    queryFn: async () => {
      const response = await api.get('/inventory/items');
      return (response.data.data || []) as POSItem[];
    }
  });

  const { data: warehouses = [] } = useQuery<POSWarehouse[]>({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const response = await api.get('/inventory/warehouses');
      return (response.data.data || []) as POSWarehouse[];
    }
  });

  useEffect(() => {
    if (warehouses.length > 0 && !warehouse) {
      setWarehouse(warehouses[0]);
    }
  }, [warehouses, warehouse]);

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  const sellableItems = useMemo(() => {
    return items.filter(item =>
      item.is_active &&
      !item.is_raw_material &&
      (item.is_finished_good || item.is_purchased)
    );
  }, [items]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return sellableItems.filter(item =>
      item.item_name.toLowerCase().includes(query) ||
      item.item_code.toLowerCase().includes(query)
    ).slice(0, 10);
  }, [sellableItems, searchQuery]);

  const subtotal = cart.reduce((sum, item) => sum + item.line_total, 0);
  const total = subtotal;

  const totalPaymentAmount = useMemo(() => {
    return paymentMethods.reduce((sum, method) => {
      return sum + (parseFloat(method.amount) || 0);
    }, 0);
  }, [paymentMethods]);

  const change = totalPaymentAmount - total;
  const canComplete = cart.length > 0 && totalPaymentAmount >= total;

  const addToCart = (item: POSItem, quantity = 1) => {
    if (!item.standard_selling_price || item.standard_selling_price <= 0) {
      toast.error(`Item "${item.item_name}" has no selling price set. Please set a price before selling.`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(c => c.item_id === item.id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty > item.current_stock) {
          toast.error(`Only ${item.current_stock} ${item.unit_of_measure} available`);
          return prev;
        }
        return prev.map(c =>
          c.item_id === item.id
            ? { ...c, quantity: newQty, line_total: newQty * c.unit_price }
            : c
        );
      }

      if (quantity > item.current_stock) {
        toast.error(`Only ${item.current_stock} ${item.unit_of_measure} available`);
        return prev;
      }

      return [...prev, {
        id: Date.now(),
        item_id: item.id,
        item_code: item.item_code,
        item_name: item.item_name,
        unit_of_measure: item.unit_of_measure,
        quantity,
        unit_price: item.standard_selling_price,
        available_stock: item.current_stock,
        line_total: quantity * item.standard_selling_price
      }];
    });

    setSearchQuery('');
    setShowSearchResults(false);
    barcodeInputRef.current?.focus();
  };

  const updateQuantity = (cartItemId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(cartItemId);
      return;
    }

    setCart(prev => prev.map(item => {
      if (item.id === cartItemId) {
        if (newQuantity > item.available_stock) {
          toast.error(`Only ${item.available_stock} ${item.unit_of_measure} available`);
          return item;
        }
        return {
          ...item,
          quantity: newQuantity,
          line_total: newQuantity * item.unit_price
        };
      }
      return item;
    }));
  };

  const removeFromCart = (cartItemId: number) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId));
  };

  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      e.preventDefault();
      const code = barcodeInput.trim();
      const item = sellableItems.find(i => i.item_code === code);

      if (item) {
        addToCart(item);
        setBarcodeInput('');
      } else {
        toast.error(`Item not found: ${code}`);
      }
    }
  };

  const handleSelectItem = (item: POSItem) => {
    addToCart(item);
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Clear all items from cart?')) {
      setCart([]);
      barcodeInputRef.current?.focus();
    }
  };

  const saleMutation = useMutation({
    mutationFn: async (data: SaleData) => {
      return api.post('/pos/sale', data);
    },
    onSuccess: (response: { data?: { data?: { transaction_no?: string; change?: number } } }) => {
      const { transaction_no, change: changeAmt } = response.data?.data || {};
      toast.success(
        <div>
          <strong>Sale Complete!</strong>
          <div>Transaction: {transaction_no}</div>
          <div>Change: {formatCurrency(changeAmt || 0)}</div>
        </div>,
        { duration: 5000 }
      );

      setCart([]);
      queryClient.invalidateQueries({ queryKey: ['items'] });
      barcodeInputRef.current?.focus();
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || 'Failed to complete sale');
    }
  });

  const addPaymentMethod = () => {
    setPaymentMethods(prev => [
      ...prev,
      { id: Date.now(), method: 'Cash', amount: '', reference_no: '' }
    ]);
  };

  const removePaymentMethod = (id: number) => {
    if (paymentMethods.length <= 1) return;
    setPaymentMethods(prev => prev.filter(method => method.id !== id));
  };

  const updatePaymentMethod = (id: number, field: keyof PaymentMethod, value: string) => {
    setPaymentMethods(prev =>
      prev.map(method =>
        method.id === id ? { ...method, [field]: value } : method
      )
    );
  };

  const handleCompleteSale = () => {
    if (!canComplete) return;
    if (!warehouse) {
      toast.error('Please select a warehouse');
      return;
    }

    const hasValidPayments = paymentMethods.some(method =>
      method.amount && parseFloat(method.amount) > 0
    );

    if (!hasValidPayments) {
      toast.error('At least one payment method with an amount is required');
      return;
    }

    if (totalPaymentAmount < total) {
      toast.error(`Payment total (${formatCurrency(totalPaymentAmount)}) is less than order total (${formatCurrency(total)})`);
      return;
    }

    setIsProcessing(true);
    saleMutation.mutate({
      warehouse_id: warehouse.id,
      sale_date: new Date().toISOString().split('T')[0],
      items: cart.map(item => ({
        item_id: item.item_id,
        quantity: item.quantity,
        unit_price: item.unit_price
      })),
      cash_received: totalPaymentAmount,
      customer_name: 'Walk-in Customer'
    }, {
      onSettled: () => setIsProcessing(false)
    });
  };

  return (
    <div className="pos-page">
      <div className="pos-header">
        <button className="pos-back-btn" onClick={() => navigate('/sales')}>
          <ArrowLeft size={20} />
          Back to Sales
        </button>
        <h1 className="pos-title">
          <ShoppingCart size={28} />
          POS Terminal
        </h1>
        <div className="pos-warehouse-select">
          <select
            value={warehouse?.id || ''}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              const wh = warehouses.find(w => w.id === parseInt(e.target.value));
              setWarehouse(wh || null);
            }}
          >
            {warehouses.map(wh => (
              <option key={wh.id} value={wh.id}>
                {wh.warehouse_code} - {wh.warehouse_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="pos-content">
        <div className="pos-left-panel">
          <div className="pos-barcode-section">
            <div className="pos-section-header">
              <Barcode size={20} />
              <span>Scan Barcode</span>
            </div>
            <div className="pos-barcode-input-wrapper">
              <input
                ref={barcodeInputRef}
                type="text"
                className="pos-barcode-input"
                placeholder="Scan or enter item code..."
                value={barcodeInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBarcodeInput(e.target.value)}
                onKeyDown={handleBarcodeScan}
              />
              <button
                type="button"
                className="pos-barcode-add-btn"
                onClick={() => {
                  if (barcodeInput.trim()) {
                    handleBarcodeScan({ key: 'Enter', preventDefault: () => {} } as React.KeyboardEvent<HTMLInputElement>);
                  }
                }}
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          <div className="pos-search-section">
            <div className="pos-section-header">
              <Search size={20} />
              <span>Search Items</span>
            </div>
            <div className="pos-search-wrapper">
              <input
                type="text"
                className="pos-search-input"
                placeholder="Search by name or code..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
              />
              {showSearchResults && searchResults.length > 0 && (
                <div className="pos-search-results">
                  {searchResults.map(item => (
                    <div
                      key={item.id}
                      className="pos-search-result-item"
                      onClick={() => handleSelectItem(item)}
                    >
                      <div className="pos-item-info">
                        <span className="pos-item-name">{item.item_name}</span>
                        <span className="pos-item-code">{item.item_code}</span>
                      </div>
                      <div className="pos-item-details">
                        <span className="pos-item-stock">
                          Stock: {item.current_stock} {item.unit_of_measure}
                        </span>
                        <span className="pos-item-price">
                          {formatCurrency(item.standard_selling_price || 0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pos-cart-section">
            <div className="pos-section-header">
              <ShoppingCart size={20} />
              <span>Cart ({cart.length} items)</span>
            </div>
            <div className="pos-cart-list">
              {cart.length === 0 ? (
                <div className="pos-cart-empty">
                  <ShoppingCart size={48} strokeWidth={1} />
                  <p>Cart is empty</p>
                  <span>Scan or search items to add</span>
                </div>
              ) : (
                <>
                  <div className="pos-cart-header">
                    <span className="cart-col-item">Item</span>
                    <span className="cart-col-qty">Qty</span>
                    <span className="cart-col-price">Price</span>
                    <span className="cart-col-total">Total</span>
                    <span className="cart-col-action"></span>
                  </div>
                  {cart.map(item => (
                    <div key={item.id} className="pos-cart-item">
                      <div className="cart-col-item">
                        <div className="cart-item-name">{item.item_name}</div>
                        <div className="cart-item-code">{item.item_code}</div>
                      </div>
                      <div className="cart-col-qty">
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          className="qty-input"
                          value={item.quantity}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                          min="1"
                          max={item.available_stock}
                        />
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="cart-col-price">
                        {formatCurrency(item.unit_price)}
                      </div>
                      <div className="cart-col-total">
                        {formatCurrency(item.line_total)}
                      </div>
                      <div className="cart-col-action">
                        <button
                          type="button"
                          className="cart-remove-btn"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
            {cart.length > 0 && (
              <div className="pos-cart-subtotal">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="pos-right-panel">
          <div className="pos-payment-section">
            <div className="pos-section-header">
              <DollarSign size={20} />
              <span>Payment</span>
            </div>

            <div className="pos-total-display">
              <span className="pos-total-label">TOTAL</span>
              <span className="pos-total-amount">{formatCurrency(total)}</span>
            </div>

            <div className="pos-payment-methods">
              <div className="pos-payment-methods-header">
                <span>Payment Methods</span>
                <button type="button" className="pos-add-payment-btn" onClick={addPaymentMethod}>
                  + Add Payment
                </button>
              </div>

              {paymentMethods.map(method => (
                <div key={method.id} className="pos-payment-method">
                  <div className="pos-payment-row">
                    <div className="pos-payment-col">
                      <label>Method</label>
                      <select
                        value={method.method}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updatePaymentMethod(method.id, 'method' as keyof PaymentMethod, e.target.value)}
                        className="pos-payment-select"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Credit Card">Credit Card</option>
                        <option value="Debit Card">Debit Card</option>
                        <option value="Online Payment">Online Payment</option>
                        <option value="Check">Check</option>
                        <option value="Mobile Payment">Mobile Payment</option>
                      </select>
                    </div>

                    <div className="pos-payment-col">
                      <label>Amount</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={method.amount}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updatePaymentMethod(method.id, 'amount' as keyof PaymentMethod, e.target.value)}
                        step="0.01"
                        min="0"
                        className="pos-payment-amount"
                      />
                    </div>

                    <div className="pos-payment-col">
                      <label>Ref No</label>
                      <input
                        type="text"
                        placeholder="Reference"
                        value={method.reference_no}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updatePaymentMethod(method.id, 'reference_no' as keyof PaymentMethod, e.target.value)}
                        className="pos-payment-ref"
                      />
                    </div>

                    {paymentMethods.length > 1 && (
                      <div className="pos-payment-col pos-remove-col">
                        <label>&nbsp;</label>
                        <button
                          type="button"
                          className="pos-remove-payment-btn"
                          onClick={() => removePaymentMethod(method.id)}
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div className="pos-payment-totals">
                <div className="pos-total-row">
                  <span>Payment Total:</span>
                  <span className="pos-payment-total-amount">{formatCurrency(totalPaymentAmount)}</span>
                </div>
                <div className={`pos-change-row ${change >= 0 ? 'positive' : change < 0 ? 'negative' : ''}`}>
                  <span>Change Due:</span>
                  <span className="pos-change-amount">
                    {change >= 0 ? formatCurrency(change) : `-${formatCurrency(Math.abs(change))}`}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className={`pos-complete-btn ${canComplete ? 'active' : 'disabled'}`}
              onClick={handleCompleteSale}
              disabled={!canComplete || isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className="pos-spinner"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Check size={24} />
                  Complete Sale
                </>
              )}
            </button>

            <button
              type="button"
              className="pos-clear-btn"
              onClick={handleClearCart}
              disabled={cart.length === 0}
            >
              <Trash2 size={18} />
              Clear Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
