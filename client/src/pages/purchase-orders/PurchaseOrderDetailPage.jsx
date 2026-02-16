import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import Button from '../../components/common/Button';
import './PurchaseOrdersPage.css';

export default function PurchaseOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { formatCurrency } = useSettings();
  const { isMobile } = useMobileDetection();

  const [showReceiveForm, setShowReceiveForm] = useState(false);
  const [receiptDate, setReceiptDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [warehouseId, setWarehouseId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [receiveQuantities, setReceiveQuantities] = useState({});

  const { data: po, isLoading } = useQuery({
    queryKey: ['purchaseOrder', id],
    queryFn: async () => {
      const response = await api.get(`/purchase-orders/${id}`);
      return response.data;
    }
  });

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const response = await api.get('/inventory/warehouses');
      return response.data.data;
    },
    enabled: showReceiveForm
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      return api.post(`/purchase-orders/${id}/status`, { status });
    },
    onSuccess: () => {
      toast.success('Status updated successfully');
      queryClient.invalidateQueries(['purchaseOrder', id]);
      queryClient.invalidateQueries(['purchaseOrders']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update status');
    }
  });

  const receiptMutation = useMutation({
    mutationFn: async (receiptData) => {
      return api.post(`/purchase-orders/${id}/receipts`, receiptData);
    },
    onSuccess: () => {
      toast.success('Items received successfully');
      queryClient.invalidateQueries(['purchaseOrder', id]);
      queryClient.invalidateQueries(['purchaseOrders']);
      setShowReceiveForm(false);
      setRemarks('');
      setReceiveQuantities({});
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to receive items');
    }
  });

  const handleStatusUpdate = (newStatus) => {
    const messages = {
      'Submitted': 'Submit this purchase order? This will create an AP liability.',
      'Cancelled': 'Cancel this purchase order? This action cannot be undone.'
    };

    if (window.confirm(messages[newStatus] || `Change status to ${newStatus}?`)) {
      statusMutation.mutate({ id, status: newStatus });
    }
  };

  const handleOpenReceiveForm = () => {
    if (po?.items) {
      const defaults = {};
      po.items.forEach(item => {
        const pending = item.quantity - (item.received_quantity || 0);
        defaults[item.id] = pending;
      });
      setReceiveQuantities(defaults);
    }
    if (po?.warehouse_id) {
      setWarehouseId(po.warehouse_id);
    }
    setReceiptDate(format(new Date(), 'yyyy-MM-dd'));
    setRemarks('');
    setShowReceiveForm(true);
  };

  const handleConfirmReceipt = () => {
    const items = [];
    for (const [poItemId, qty] of Object.entries(receiveQuantities)) {
      const numQty = Number(qty);
      if (numQty > 0) {
        items.push({ po_item_id: Number(poItemId), received_quantity: numQty });
      }
    }

    if (items.length === 0) {
      toast.error('Enter at least one item quantity to receive');
      return;
    }

    receiptMutation.mutate({
      receipt_date: receiptDate,
      warehouse_id: Number(warehouseId),
      remarks: remarks || undefined,
      items
    });
  };

  const handleQtyChange = (itemId, value, maxPending) => {
    const numValue = Math.max(0, Math.min(Number(value), maxPending));
    setReceiveQuantities(prev => ({ ...prev, [itemId]: numValue }));
  };

  useEffect(() => {
    if (isMobile) {
      document.body.classList.add('has-bottom-nav');
    }
    return () => {
      document.body.classList.remove('has-bottom-nav');
    };
  }, [isMobile]);

  if (isLoading) {
    return (
      <div className="po-detail-page">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!po) {
    return (
      <div className="po-detail-page">
        <p>Purchase Order not found</p>
      </div>
    );
  }

  const statusColors = {
    'Draft': 'status-draft',
    'Submitted': 'status-submitted',
    'Partially Received': 'status-partial',
    'Completed': 'status-completed',
    'Cancelled': 'status-cancelled'
  };

  const pendingQuantity = (item) => {
    return item.quantity - (item.received_quantity || 0);
  };

  const canReceive = ['Submitted', 'Partially Received'].includes(po.status);

  return (
    <div className="po-detail-page">
      <div className="page-header">
        <Button
          variant="secondary"
          onClick={() => navigate('/purchase-orders')}
        >
          &larr; Back to POs
        </Button>
        {!isMobile && (
          <div className="header-actions">
            {po.status === 'Draft' && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/purchase-orders/${id}/edit`)}
                >
                  Edit PO
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleStatusUpdate('Submitted')}
                  disabled={statusMutation.isPending}
                >
                  {statusMutation.isPending ? 'Submitting...' : 'Submit PO'}
                </Button>
              </>
            )}
            {canReceive && (
              <Button
                variant="primary"
                onClick={handleOpenReceiveForm}
                disabled={showReceiveForm}
              >
                Receive Items
              </Button>
            )}
            {['Draft', 'Submitted', 'Partially Received'].includes(po.status) && (
              <Button
                variant="danger"
                onClick={() => handleStatusUpdate('Cancelled')}
                disabled={statusMutation.isPending}
              >
                Cancel PO
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="po-header-card">
        <div className="po-info">
          <div className="po-title">
            <h2>{po.po_no}</h2>
            <span className={`status-badge ${statusColors[po.status]}`}>
              {po.status}
            </span>
          </div>

          <div className="po-details">
            <div className="detail-row">
              <strong>Supplier:</strong>
              <span>{po.supplier_name}</span>
            </div>
            <div className="detail-row">
              <strong>PO Date:</strong>
              <span>{format(new Date(po.po_date), 'dd MMM yyyy')}</span>
            </div>
            {po.expected_delivery_date && (
              <div className="detail-row">
                <strong>Expected Delivery:</strong>
                <span>{format(new Date(po.expected_delivery_date), 'dd MMM yyyy')}</span>
              </div>
            )}
            {po.warehouse_name && (
              <div className="detail-row">
                <strong>Warehouse:</strong>
                <span>{po.warehouse_name}</span>
              </div>
            )}
            {po.created_by_username && (
              <div className="detail-row">
                <strong>Created By:</strong>
                <span>{po.created_by_username}</span>
              </div>
            )}
          </div>
        </div>

        <div className="po-totals">
          <div className="total-card">
            <div className="total-label">Total Amount</div>
            <div className="total-value">{formatCurrency(parseFloat(po.total_amount))}</div>
          </div>
        </div>
      </div>

      {po.notes && (
        <div className="notes-section">
          <h3>Notes</h3>
          <p>{po.notes}</p>
        </div>
      )}

      <div className="items-section">
        <h3>Purchase Order Items</h3>
        {isMobile ? (
          <div className="po-items-cards">
            {po.items?.map(item => {
              const pending = pendingQuantity(item);
              const total = item.quantity * item.unit_price;
              return (
                <div key={item.id} className="po-item-card">
                  <div className="po-item-card-header">
                    <span className="po-item-card-name">{item.item_code} - {item.item_name}</span>
                    <span className="po-item-card-total">{formatCurrency(total)}</span>
                  </div>
                  <div className="po-item-card-details">
                    <div className="po-item-card-row">
                      <span>Ordered</span><span>{item.quantity} {item.unit_of_measure}</span>
                    </div>
                    <div className="po-item-card-row">
                      <span>Received</span><span>{item.received_quantity} {item.unit_of_measure}</span>
                    </div>
                    <div className="po-item-card-row">
                      <span>Pending</span><span>{pending} {item.unit_of_measure}</span>
                    </div>
                    <div className="po-item-card-row">
                      <span>Unit Price</span><span>{formatCurrency(item.unit_price)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <table className="items-table">
            <thead>
              <tr>
                <th width="25%">Item</th>
                <th width="15%">Ordered</th>
                <th width="15%">Received</th>
                <th width="15%">Pending</th>
                <th width="15%">Unit Price</th>
                <th width="15%">Total</th>
              </tr>
            </thead>
            <tbody>
              {po.items?.map(item => {
                const pending = pendingQuantity(item);
                const total = item.quantity * item.unit_price;
                return (
                  <tr key={item.id}>
                    <td>{item.item_code} - {item.item_name}</td>
                    <td>{item.quantity} {item.unit_of_measure}</td>
                    <td>{item.received_quantity} {item.unit_of_measure}</td>
                    <td>{pending} {item.unit_of_measure}</td>
                    <td>{formatCurrency(item.unit_price)}</td>
                    <td className="amount-cell">{formatCurrency(total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showReceiveForm && (
        <div className="receive-form">
          <div className="receive-form-header">
            <h3>Receive Items</h3>
            <Button variant="secondary" onClick={() => setShowReceiveForm(false)}>
              Cancel
            </Button>
          </div>

          <div className="receive-form-fields">
            <div className="form-input-group">
              <label>Receipt Date</label>
              <input
                type="date"
                className="form-input"
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
              />
            </div>
            <div className="form-input-group">
              <label>Warehouse</label>
              <select
                className="form-select"
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
              >
                <option value="">Select Warehouse</option>
                {warehouses?.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div className="form-input-group">
              <label>Remarks</label>
              <textarea
                className="form-input"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional remarks..."
                rows={2}
              />
            </div>
          </div>

          {isMobile ? (
            <div className="po-items-cards">
              {po.items?.map(item => {
                const pending = pendingQuantity(item);
                const isDisabled = pending <= 0;
                return (
                  <div key={item.id} className={`po-item-card receive-item-card ${isDisabled ? 'receive-card-disabled' : ''}`}>
                    <div className="po-item-card-header">
                      <span className="po-item-card-name">{item.item_code} - {item.item_name}</span>
                    </div>
                    <div className="po-item-card-details">
                      <div className="po-item-card-row">
                        <span>Ordered</span><span>{item.quantity} {item.unit_of_measure}</span>
                      </div>
                      <div className="po-item-card-row">
                        <span>Received</span><span>{item.received_quantity || 0} {item.unit_of_measure}</span>
                      </div>
                      <div className="po-item-card-row">
                        <span>Pending</span><span>{pending} {item.unit_of_measure}</span>
                      </div>
                      <div className="po-item-card-row">
                        <span>Qty to Receive</span>
                        <input
                          type="number"
                          className="receive-qty-input"
                          value={receiveQuantities[item.id] ?? 0}
                          onChange={(e) => handleQtyChange(item.id, e.target.value, pending)}
                          min={0}
                          max={pending}
                          disabled={isDisabled}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <table className="items-table receive-items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Ordered</th>
                  <th>Already Received</th>
                  <th>Pending</th>
                  <th>Qty to Receive</th>
                </tr>
              </thead>
              <tbody>
                {po.items?.map(item => {
                  const pending = pendingQuantity(item);
                  const isDisabled = pending <= 0;
                  return (
                    <tr key={item.id} className={isDisabled ? 'receive-row-disabled' : ''}>
                      <td>{item.item_code} - {item.item_name}</td>
                      <td>{item.quantity} {item.unit_of_measure}</td>
                      <td>{item.received_quantity || 0} {item.unit_of_measure}</td>
                      <td>{pending} {item.unit_of_measure}</td>
                      <td>
                        <input
                          type="number"
                          className="receive-qty-input"
                          value={receiveQuantities[item.id] ?? 0}
                          onChange={(e) => handleQtyChange(item.id, e.target.value, pending)}
                          min={0}
                          max={pending}
                          disabled={isDisabled}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          <div className="receive-form-actions">
            <Button variant="secondary" onClick={() => setShowReceiveForm(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmReceipt}
              disabled={receiptMutation.isPending}
            >
              {receiptMutation.isPending ? 'Processing...' : 'Confirm Receipt'}
            </Button>
          </div>
        </div>
      )}

      <div className="status-info">
        <p className="info-text">
          <strong>Status Notes:</strong>
        </p>
        <ul>
          <li><strong>Draft:</strong> Can be edited. No inventory impact yet.</li>
          <li><strong>Submitted:</strong> Cannot be edited. AP liability created. Ready for receipt.</li>
          <li><strong>Partially Received:</strong> Some items received. Inventory updated for received items.</li>
          <li><strong>Completed:</strong> All items received. PO closed.</li>
          <li><strong>Cancelled:</strong> PO cancelled. No further actions allowed.</li>
        </ul>
      </div>

      {isMobile && (
        <div className="po-mobile-action-bar">
          {po.status === 'Draft' && (
            <>
              <Button
                variant="secondary"
                onClick={() => navigate(`/purchase-orders/${id}/edit`)}
              >
                Edit PO
              </Button>
              <Button
                variant="primary"
                onClick={() => handleStatusUpdate('Submitted')}
                disabled={statusMutation.isPending}
              >
                {statusMutation.isPending ? 'Submitting...' : 'Submit PO'}
              </Button>
            </>
          )}
          {canReceive && (
            <Button
              variant="primary"
              onClick={handleOpenReceiveForm}
              disabled={showReceiveForm}
            >
              Receive Items
            </Button>
          )}
          {['Draft', 'Submitted', 'Partially Received'].includes(po.status) && (
            <Button
              variant="danger"
              onClick={() => handleStatusUpdate('Cancelled')}
              disabled={statusMutation.isPending}
            >
              Cancel PO
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
