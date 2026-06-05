import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import { X, Truck, Package, ClipboardList, Check, ChevronRight, ChevronLeft, Calendar, MapPin } from 'lucide-react';

import type { Supplier, Item, Warehouse } from '../../types';
import api from '../../utils/api';
import Button from '../common/Button';
import './PurchaseOrderWizard.css';

interface POItem {
  id: number;
  item_id: number;
  item_name: string;
  item_code: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface PurchaseOrderWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PurchaseOrderWizard({ isOpen, onClose }: PurchaseOrderWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form data
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [poItems, setPoItems] = useState<POItem[]>([]);
  const [createdPO, setCreatedPO] = useState<any>(null);
  
  // PO Details
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');

  // Fetch data on mount
  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers');
      setSuppliers(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await api.get('/inventory/items');
      setItems(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await api.get('/inventory/warehouses');
      setWarehouses(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch warehouses:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSuppliers();
      fetchItems();
      fetchWarehouses();
    }
  }, [isOpen]);

  const handleOpen = () => {
    setStep(1);
    setSelectedSupplier(null);
    setPoItems([]);
    setCreatedPO(null);
    setPoDate(new Date().toISOString().split('T')[0]);
    setExpectedDeliveryDate('');
    setSelectedWarehouse(null);
    setNotes('');
    setSupplierSearch('');
    setItemSearch('');
  };

  const filteredSuppliers = suppliers.filter((supplier: Supplier) =>
    supplier.supplier_name?.toLowerCase().includes(supplierSearch.toLowerCase()) ||
    supplier.supplier_code?.toLowerCase().includes(supplierSearch.toLowerCase())
  );

  const filteredItems = items.filter((item: Item) =>
    item.item_name?.toLowerCase().includes(itemSearch.toLowerCase()) ||
    item.item_code?.toLowerCase().includes(itemSearch.toLowerCase())
  );

  // Calculations
  const subtotal = poItems.reduce((sum, item) => sum + item.total, 0);
  const totalAmount = subtotal;

  // Step 1: Supplier Selection
  const renderStep1 = () => (
    <div className="wizard-step">
      <div className="step-header">
        <Truck size={24} />
        <h3>Step 1: Select Supplier</h3>
      </div>
      <div className="search-box">
        <input
          type="text"
          placeholder="Search suppliers..."
          className="search-input"
          value={supplierSearch}
          onChange={(e) => setSupplierSearch(e.target.value)}
        />
      </div>
      <div className="selection-list">
        {filteredSuppliers.map((supplier: Supplier) => (
          <div
            key={supplier.id}
            className={`selection-card ${selectedSupplier?.id === supplier.id ? 'selected' : ''}`}
            onClick={() => setSelectedSupplier(supplier)}
          >
            <div className="card-main">
              <span className="card-title">{supplier.supplier_name}</span>
              <span className="card-subtitle">{supplier.supplier_code}</span>
            </div>
            {selectedSupplier?.id === supplier.id && <Check size={20} className="check-icon" />}
          </div>
        ))}
      </div>
      <div className="wizard-actions">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button
          variant="primary"
          disabled={!selectedSupplier}
          onClick={() => setStep(2)}
        >
          Continue <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );

  // Step 2: PO Details
  const renderStep2 = () => (
    <div className="wizard-step">
      <div className="step-header">
        <ClipboardList size={24} />
        <h3>Step 2: PO Details</h3>
      </div>
      <div className="form-fields">
        <div className="form-group">
          <label><Calendar size={16} /> PO Date *</label>
          <input
            type="date"
            value={poDate}
            onChange={(e) => setPoDate(e.target.value)}
            className="form-input"
            required
          />
        </div>
        <div className="form-group">
          <label><Calendar size={16} /> Expected Delivery</label>
          <input
            type="date"
            value={expectedDeliveryDate}
            onChange={(e) => setExpectedDeliveryDate(e.target.value)}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label><MapPin size={16} /> Warehouse (for receipt)</label>
          <select
            value={selectedWarehouse?.id || ''}
            onChange={(e) => {
              const warehouse = warehouses.find(w => w.id === parseInt(e.target.value));
              setSelectedWarehouse(warehouse);
            }}
            className="form-select"
          >
            <option value="">Select warehouse...</option>
            {warehouses.map((warehouse: Warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.warehouse_code} - {warehouse.warehouse_name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="form-textarea"
            placeholder="Additional notes..."
            rows={3}
          />
        </div>
      </div>
      <div className="wizard-actions">
        <Button variant="secondary" onClick={() => setStep(1)}>
          <ChevronLeft size={16} /> Back
        </Button>
        <Button
          variant="primary"
          disabled={!poDate}
          onClick={() => setStep(3)}
        >
          Continue <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );

  // Step 3: Items Selection
  const renderStep3 = () => (
    <div className="wizard-step">
      <div className="step-header">
        <Package size={24} />
        <h3>Step 3: Add Items</h3>
      </div>
      <div className="search-box">
        <input
          type="text"
          placeholder="Search items..."
          className="search-input"
          value={itemSearch}
          onChange={(e) => setItemSearch(e.target.value)}
        />
      </div>
      <div className="items-list">
        {filteredItems.map((item: Item) => {
          const existingItem = poItems.find(pi => pi.item_id === item.id);
          return (
            <div key={item.id} className="item-row">
              <div className="item-info">
                <span className="item-name">{item.item_name}</span>
                <span className="item-code">{item.item_code}</span>
                <span className="item-price">
                  Cost: ${(item.standard_cost || item.purchase_price || 0).toFixed(2)}
                </span>
              </div>
              <div className="item-quantity">
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={existingItem?.quantity || ''}
                  onChange={(e) => {
                    const qty = parseFloat(e.target.value) || 0;
                    const unitPrice = item.standard_cost || item.purchase_price || 0;
                    if (qty === 0) {
                      setPoItems(poItems.filter(pi => pi.item_id !== item.id));
                    } else {
                      const total = qty * unitPrice;
                      if (existingItem) {
                        setPoItems(poItems.map(pi =>
                          pi.item_id === item.id ? { ...pi, quantity: qty, total } : pi
                        ));
                      } else {
                        setPoItems([...poItems, {
                          id: Date.now(),
                          item_id: item.id,
                          item_name: item.item_name,
                          item_code: item.item_code,
                          quantity: qty,
                          unit_price: unitPrice,
                          total
                        }]);
                      }
                    }
                  }}
                  className="qty-input"
                  placeholder="0"
                />
              </div>
            </div>
          );
        })}
      </div>
      {poItems.length > 0 && (
        <div className="items-summary">
          <span>{poItems.length} items added</span>
          <span>Subtotal: ${subtotal.toFixed(2)}</span>
        </div>
      )}
      <div className="wizard-actions">
        <Button variant="secondary" onClick={() => setStep(2)}>
          <ChevronLeft size={16} /> Back
        </Button>
        <Button
          variant="primary"
          disabled={poItems.length === 0}
          onClick={() => setStep(4)}
        >
          Continue <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );

  // Step 4: Review
  const renderStep4 = () => (
    <div className="wizard-step">
      <div className="step-header">
        <ClipboardList size={24} />
        <h3>Step 4: Review</h3>
      </div>
      <div className="review-section">
        <div className="review-group">
          <h4>Supplier</h4>
          <div className="review-value">{selectedSupplier?.supplier_name}</div>
        </div>
        <div className="review-group">
          <h4>PO Details</h4>
          <div className="review-row">
            <span>PO Date:</span>
            <span>{poDate}</span>
          </div>
          {expectedDeliveryDate && (
            <div className="review-row">
              <span>Expected Delivery:</span>
              <span>{expectedDeliveryDate}</span>
            </div>
          )}
          {selectedWarehouse && (
            <div className="review-row">
              <span>Warehouse:</span>
              <span>{selectedWarehouse.warehouse_name}</span>
            </div>
          )}
        </div>
        <div className="review-group">
          <h4>Items</h4>
          {poItems.map((item, idx) => (
            <div key={idx} className="review-item">
              <span>{item.item_name} x {item.quantity}</span>
              <span>${item.total.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="review-totals">
          <div className="review-row total">
            <span>Total</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>
      <div className="wizard-actions">
        <Button variant="secondary" onClick={() => setStep(3)}>
          <ChevronLeft size={16} /> Back
        </Button>
        <Button
          variant="success"
          onClick={createPurchaseOrder}
          disabled={loading}
          loading={loading}
        >
          {loading ? 'Creating...' : 'Create Purchase Order'}
        </Button>
      </div>
    </div>
  );

  // Step 5: Confirmation
  const renderStep5 = () => (
    <div className="wizard-step">
      <div className="step-header success">
        <Check size={48} />
        <h3>Purchase Order Created!</h3>
        <p>PO #{createdPO?.po_no}</p>
      </div>
      <div className="confirmation-details">
        <div className="confirm-row">
          <span>Supplier</span>
          <span>{selectedSupplier?.supplier_name}</span>
        </div>
        <div className="confirm-row">
          <span>Items</span>
          <span>{poItems.length}</span>
        </div>
        <div className="confirm-row">
          <span>Total Amount</span>
          <span>${totalAmount.toFixed(2)}</span>
        </div>
        <div className="confirm-row">
          <span>Status</span>
          <span className="status-draft">Draft</span>
        </div>
      </div>
      <div className="wizard-actions">
        <Button variant="secondary" onClick={handleOpen}>
          Create Another
        </Button>
        <Button variant="primary" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );

  const createPurchaseOrder = async () => {
    setLoading(true);
    try {
      const response = await api.post('/purchase-orders', {
        supplier_id: selectedSupplier.id,
        po_date: poDate,
        expected_delivery_date: expectedDeliveryDate || null,
        warehouse_id: selectedWarehouse?.id || null,
        notes: notes,
        status: 'Draft',
        items: poItems.map(item => ({
          item_id: item.item_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        }))
      });
      setCreatedPO(response.data);
      setStep(5);
      toast.success('Purchase order created successfully!');
    } catch (error: unknown) {
      toast.error((error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create purchase order');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="po-wizard-overlay" onClick={onClose}>
      <div className="po-wizard-modal" onClick={(e) => e.stopPropagation()}>
        {step < 5 && (
          <div className="wizard-progress">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={`progress-step ${step >= s ? 'active' : ''}`}>
                <div className="step-number">{s}</div>
                <span className="step-label">
                  {s === 1 && 'Supplier'}
                  {s === 2 && 'Details'}
                  {s === 3 && 'Items'}
                  {s === 4 && 'Review'}
                </span>
              </div>
            ))}
          </div>
        )}
        <button className="wizard-close" onClick={onClose}>
          <X size={20} />
        </button>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
      </div>
    </div>
  );
}
