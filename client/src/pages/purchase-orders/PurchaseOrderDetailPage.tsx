import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Printer } from 'lucide-react';
import { createRoot, Root } from 'react-dom/client';

import Button from '../../components/common/Button';
import PurchaseOrderTemplateA4 from '../../components/invoice/PurchaseOrderTemplateA4';
import poStyles from '../../components/invoice/PurchaseOrderTemplateA4.css?inline';
import { useSettings } from '../../context/SettingsContext';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { useTranslation } from '../../hooks/useTranslation';
import api from '../../utils/api';
import type {
  PurchaseOrderDetail,
  PurchaseOrderDetailItem,
  CompanyInfo,
  WarehouseOption,
  ReceiptItem,
  ReturnItem,
  ReceiptData,
  ReturnData,
  PrintPOItem
} from '../../utils/purchaseOrderDetailTypes';
import './PurchaseOrdersPage.css';

interface MutationStatusParams {
  id: string;
  status: string;
}

type StatusMessages = Record<string, string>;

export default function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { formatCurrency } = useSettings();
  const { t } = useTranslation();
  const { isMobile } = useMobileDetection();

  const [showReceiveForm, setShowReceiveForm] = useState(false);
  const [receiptDate, setReceiptDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [warehouseId, setWarehouseId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [receiveQuantities, setReceiveQuantities] = useState<Record<string, number>>({});

  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});
  const [returnReason, setReturnReason] = useState('');

  if (!id) {
    navigate('/purchase-orders');
    return null;
  }

  const { data: po, isLoading } = useQuery<PurchaseOrderDetail>({
    queryKey: ['purchaseOrder', id],
    queryFn: async () => {
      const response = await api.get(`/purchase-orders/${id}`);
      return response.data;
    }
  });

  const { data: settings = {} } = useQuery<Record<string, { value: string }>>({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data;
    }
  });

  const company: CompanyInfo = {
    name: settings.company_name?.value || 'Mini ERP',
    email: settings.company_email?.value || 'support@minierp.com',
    phone: settings.company_phone?.value || '+1 123 456 7890',
    address: settings.company_address?.value || '456 Enterprise Ave, BC 12345'
  };

  const { data: warehouses } = useQuery<WarehouseOption[]>({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const response = await api.get('/inventory/warehouses');
      return response.data.data;
    },
    enabled: showReceiveForm
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id: poId, status }: { id: string; status: string }) => {
      await api.post(`/purchase-orders/${poId}/status`, { status });
    },
    onSuccess: () => {
      toast.success('Status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['purchaseOrder', id] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Failed to update status');
    }
  });

  const receiptMutation = useMutation({
    mutationFn: async (receiptData: ReceiptData) => {
      await api.post(`/purchase-orders/${id}/receipts`, receiptData);
    },
    onSuccess: () => {
      toast.success('Items received successfully');
      queryClient.invalidateQueries({ queryKey: ['purchaseOrder', id] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      setShowReceiveForm(false);
      setRemarks('');
      setReceiveQuantities({});
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Failed to receive items');
    }
  });

  const returnMutation = useMutation({
    mutationFn: async (returnData: ReturnData) => {
      await api.post(`/purchase-orders/${id}/return-receipt`, returnData);
    },
    onSuccess: () => {
      toast.success('Items returned successfully');
      queryClient.invalidateQueries({ queryKey: ['purchaseOrder', id] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      setShowReturnForm(false);
      setReturnReason('');
      setReturnQuantities({});
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Failed to process return');
    }
  });

  const handleStatusUpdate = (newStatus: string) => {
    const messages: StatusMessages = {
      'Submitted': 'Submit this purchase order? This will create an AP liability.',
      'Cancelled': 'Cancel this purchase order? This action cannot be undone.'
    };

    if (window.confirm(messages[newStatus] || `Change status to ${newStatus}?`)) {
      statusMutation.mutate({ id, status: newStatus });
    }
  };

  const handleOpenReceiveForm = () => {
    if (po?.items) {
      const defaults: Record<string, number> = {};
      (po.items as PurchaseOrderDetailItem[]).forEach(item => {
        const pending = item.quantity - (item.received_quantity || 0);
        defaults[item.id] = pending;
      });
      setReceiveQuantities(defaults);
    }
    if ((po as PurchaseOrderDetail)?.warehouse_id) {
      setWarehouseId(String((po as PurchaseOrderDetail).warehouse_id));
    }
    setReceiptDate(format(new Date(), 'yyyy-MM-dd'));
    setRemarks('');
    setShowReceiveForm(true);
  };

  const handleConfirmReceipt = () => {
    const items: ReceiptItem[] = [];
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

  const handleOpenReturnForm = () => {
    if (po?.items) {
      const defaults: Record<string, number> = {};
      (po.items as PurchaseOrderDetailItem[]).forEach(item => {
        const returnable = (item.received_quantity || 0) - (item.returned_quantity || 0);
        if (returnable > 0) {
          defaults[item.id] = 0;
        }
      });
      setReturnQuantities(defaults);
    }
    setReturnReason('');
    setShowReturnForm(true);
  };

  const handleReturnQtyChange = (itemId: number, value: string, maxReturnable: number) => {
    const numValue = Math.max(0, Math.min(Number(value), maxReturnable));
    setReturnQuantities(prev => ({ ...prev, [itemId]: numValue }));
  };

  const handleConfirmReturn = () => {
    const items: ReturnItem[] = [];
    for (const [poItemId, qty] of Object.entries(returnQuantities)) {
      const numQty = Number(qty);
      if (numQty > 0) {
        items.push({ po_item_id: Number(poItemId), return_quantity: numQty });
      }
    }

    if (items.length === 0) {
      toast.error('Enter at least one item quantity to return');
      return;
    }

    returnMutation.mutate({
      items,
      reason: returnReason || undefined
    });
  };

  const handleQtyChange = (itemId: number, value: string, maxPending: number) => {
    const numValue = Math.max(0, Math.min(Number(value), maxPending));
    setReceiveQuantities(prev => ({ ...prev, [itemId]: numValue }));
  };

  const handlePrintPO = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      toast.error('Please allow popups to print');
      return;
    }

    const purchaseOrder = {
      po_no: po?.po_no || '',
      status: po?.status || 'Draft',
      po_date: po?.po_date || '',
      expected_delivery_date: po?.expected_delivery_date || null,
      supplier_name: po?.supplier_name || 'N/A',
      supplier_address: po?.supplier_address || null,
      supplier_phone: po?.supplier_phone || null,
      supplier_email: po?.supplier_email || null,
      warehouse_name: po?.warehouse_name || null,
      notes: po?.notes || null,            total_amount: Number(po?.total_amount || 0),
      items: ((po?.items as PurchaseOrderDetailItem[]) || []).map((item: PurchaseOrderDetailItem): PrintPOItem => ({
        item_name: item.item_name || null,
        item_code: item.item_code || null,
        description: item.description || null,
        quantity: item.quantity ?? null,
        unit_price: item.unit_price ?? null,
        amount: item.amount ?? (item.quantity * item.unit_price),
        received_quantity: item.received_quantity ?? null,
        unit_of_measure: item.unit_of_measure || null
      }))
    };

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Purchase Order - ${purchaseOrder.po_no}</title>
        <style>${poStyles}</style>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', 'Segoe UI', -apple-system, sans-serif; }
        </style>
      </head>
      <body>
        <div id="print-root"></div>
      </body>
      </html>
    `);
    printWindow.document.close();

    let root: Root;
    try {
      root = createRoot(printWindow.document.getElementById('print-root')!);
    } catch {
      toast.error('Failed to initialize print');
      return;
    }

    root.render(
      <PurchaseOrderTemplateA4
        purchaseOrder={purchaseOrder}
        company={company}
      />
    );

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        printWindow.print();
      });
    });
  };

  useKeyboardShortcut('Alt+P', handlePrintPO, {
    id: 'print-po',
    label: t('shortcuts.printPO', 'Print Purchase Order'),
    enabled: !!po
  });

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

  const statusColors: Record<string, string> = {
    'Draft': 'status-draft',
    'Submitted': 'status-submitted',
    'Partially Received': 'status-partial',
    'Completed': 'status-completed',
    'Cancelled': 'status-cancelled'
  };

  const pendingQuantity = (item: PurchaseOrderDetailItem): number => {
    return item.quantity - (item.received_quantity || 0);
  };

  const returnableQuantity = (item: PurchaseOrderDetailItem): number => {
    return (item.received_quantity || 0) - (item.returned_quantity || 0);
  };

  const items = (po.items as PurchaseOrderDetailItem[]) || [];
  const hasReturnableItems = items.some(item => returnableQuantity(item) > 0);

  const canReceive = ['Submitted', 'Partially Received'].includes(po.status);

  return (
    <div className="po-detail-page">
      <div className="page-header">
        <Button
          variant="secondary"
          onClick={() => navigate('/purchase-orders')}
          type="button"
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
                  type="button"
                >
                  Edit PO
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleStatusUpdate('Submitted')}
                  disabled={statusMutation.isPending}
                  type="button"
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
                type="button"
              >
                Receive Items
              </Button>
            )}
            {hasReturnableItems && po.status !== 'Draft' && (
              <Button
                variant="primary"
                onClick={handleOpenReturnForm}
                disabled={showReturnForm}
                style={{ background: '#f59e0b', borderColor: '#f59e0b' }}
                type="button"
              >
                Return Items
              </Button>
            )}
            {['Draft', 'Submitted', 'Partially Received'].includes(po.status) && (
              <Button
                variant="danger"
                onClick={() => handleStatusUpdate('Cancelled')}
                disabled={statusMutation.isPending}
                type="button"
              >
                Cancel PO
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={handlePrintPO}
              type="button"
            >
              <Printer size={16} /> Print
            </Button>
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
            <div className="total-value">{formatCurrency(parseFloat(String(po.total_amount)))}</div>
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
            {items.map(item => {
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
                <th style={{width:'25%'}}>Item</th>
                <th style={{width:'15%'}}>Ordered</th>
                <th style={{width:'15%'}}>Received</th>
                <th style={{width:'15%'}}>Pending</th>
                <th style={{width:'15%'}}>Unit Price</th>
                <th style={{width:'15%'}}>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
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
            <Button variant="secondary" onClick={() => setShowReceiveForm(false)} type="button">
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReceiptDate(e.target.value)}
              />
            </div>
            <div className="form-input-group">
              <label>Warehouse</label>
              <select
                className="form-select"
                value={warehouseId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setWarehouseId(e.target.value)}
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
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRemarks(e.target.value)}
                placeholder="Optional remarks..."
                rows={2}
              />
            </div>
          </div>

          {isMobile ? (
            <div className="po-items-cards">
              {items.map(item => {
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
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleQtyChange(item.id, e.target.value, pending)}
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
                {items.map(item => {
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
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleQtyChange(item.id, e.target.value, pending)}
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
            <Button variant="secondary" onClick={() => setShowReceiveForm(false)} type="button">
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmReceipt}
              disabled={receiptMutation.isPending}
              type="button"
            >
              {receiptMutation.isPending ? 'Processing...' : 'Confirm Receipt'}
            </Button>
          </div>
        </div>
      )}

      {showReturnForm && (
        <div className="receive-form">
          <div className="receive-form-header">
            <h3>Return Items</h3>
            <Button variant="secondary" onClick={() => setShowReturnForm(false)} type="button">
              Cancel
            </Button>
          </div>

          <div className="receive-form-fields">
            <div className="form-input-group" style={{ flex: '1' }}>
              <label>Reason for Return</label>
              <textarea
                className="form-input"
                value={returnReason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReturnReason(e.target.value)}
                placeholder="Optional reason..."
                rows={2}
              />
            </div>
          </div>

          <table className="items-table receive-items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Received</th>
                <th>Already Returned</th>
                <th>Returnable</th>
                <th>Qty to Return</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const retQty = returnableQuantity(item);
                const isDisabled = retQty <= 0;
                return (
                  <tr key={item.id} className={isDisabled ? 'receive-row-disabled' : ''}>
                    <td>{item.item_code} - {item.item_name}</td>
                    <td>{item.received_quantity || 0} {item.unit_of_measure}</td>
                    <td>{item.returned_quantity || 0} {item.unit_of_measure}</td>
                    <td>{retQty} {item.unit_of_measure}</td>
                    <td>
                      <input
                        type="number"
                        className="receive-qty-input"
                        value={returnQuantities[item.id] ?? 0}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleReturnQtyChange(item.id, e.target.value, retQty)}
                        min={0}
                        max={retQty}
                        disabled={isDisabled}
                        style={{ borderColor: Number(returnQuantities[item.id] || 0) > 0 ? '#f59e0b' : undefined }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="receive-form-actions">
            <Button variant="secondary" onClick={() => setShowReturnForm(false)} type="button">
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmReturn}
              disabled={returnMutation.isPending}
              style={{ background: '#f59e0b', borderColor: '#f59e0b' }}
              type="button"
            >
              {returnMutation.isPending ? 'Processing...' : 'Confirm Return'}
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
                type="button"
              >
                Edit PO
              </Button>
              <Button
                variant="primary"
                onClick={() => handleStatusUpdate('Submitted')}
                disabled={statusMutation.isPending}
                type="button"
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
              type="button"
            >
              Receive Items
            </Button>
          )}
          {hasReturnableItems && po.status !== 'Draft' && (
            <Button
              variant="primary"
              onClick={handleOpenReturnForm}
              disabled={showReturnForm}
              style={{ background: '#f59e0b', borderColor: '#f59e0b' }}
              type="button"
            >
              Return Items
            </Button>
          )}
          {['Draft', 'Submitted', 'Partially Received'].includes(po.status) && (
            <Button
              variant="danger"
              onClick={() => handleStatusUpdate('Cancelled')}
              disabled={statusMutation.isPending}
              type="button"
            >
              Cancel PO
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={handlePrintPO}
            type="button"
          >
            <Printer size={16} /> Print
          </Button>
        </div>
      )}
    </div>
  );
}
