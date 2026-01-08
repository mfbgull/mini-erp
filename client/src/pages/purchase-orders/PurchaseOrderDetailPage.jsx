import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import Button from '../../components/common/Button';

export default function PurchaseOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { formatCurrency } = useSettings();

  const { data: po, isLoading } = useQuery({
    queryKey: ['purchaseOrder', id],
    queryFn: async () => {
      const response = await api.get(`/purchase-orders/${id}`);
      return response.data;
    }
  });

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

  return (
    <div className="po-detail-page">
      <div className="page-header">
        <Button
          variant="secondary"
          onClick={() => navigate('/purchase-orders')}
        >
          ← Back to POs
        </Button>
        {po.status === 'Draft' && (
          <Button
            variant="primary"
            onClick={() => navigate(`/purchase-orders/${id}/edit`)}
          >
            Edit PO
          </Button>
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
      </div>

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
    </div>
  );
}
