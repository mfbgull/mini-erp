import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { Plus } from 'lucide-react';
import api from '../../utils/api';
import { PurchaseOrderCard } from '../../components/common/PurchaseOrderCard';
import './PurchaseOrdersPage.css';

export default function PurchaseOrdersPage() {
  const navigate = useNavigate();
  const { formatCurrency } = useSettings();
  const [statusFilter, setStatusFilter] = useState('');

  const { data: pos = [], isLoading } = useQuery({
    queryKey: ['purchaseOrders', statusFilter],
    queryFn: async () => {
      const response = await api.get('/purchase-orders', {
        params: statusFilter ? { status: statusFilter } : {}
      });
      return response.data;
    }
  });

  // Calculate summary stats
  const stats = {
    total: pos.length,
    draft: pos.filter(po => po.status === 'Draft').length,
    submitted: pos.filter(po => po.status === 'Submitted').length,
    partial: pos.filter(po => po.status === 'Partially Received').length,
    completed: pos.filter(po => po.status === 'Completed').length,
    totalValue: pos.reduce((sum, po) => sum + parseFloat(po.total_amount), 0)
  };

  return (
    <div className="purchase-orders-page">
      <div className="page-header">
        <div>
          <h1>Purchase Orders</h1>
          <p className="page-subtitle">Manage purchase orders and track deliveries</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => navigate('/purchase-orders/create')}
        >
          + Create Purchase Order
        </button>
      </div>

      {isLoading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          <div className="summary-cards">
            <div className="summary-card">
              <div className="summary-label">Total POs</div>
              <div className="summary-value">{stats.total}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Draft</div>
              <div className="summary-value">{stats.draft}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Submitted</div>
              <div className="summary-value">{stats.submitted}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Partially Received</div>
              <div className="summary-value">{stats.partial}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Completed</div>
              <div className="summary-value">{stats.completed}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Total Value</div>
              <div className="summary-value">{formatCurrency(stats.totalValue)}</div>
            </div>
          </div>

          <div className="filters-bar">
            <label>Status Filter:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="Draft">Draft</option>
              <option value="Submitted">Submitted</option>
              <option value="Partially Received">Partially Received</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {pos.length === 0 ? (
            <div className="no-pos">
              <p>No purchase orders found</p>
            </div>
          ) : (
            <div className="po-cards-grid">
              {pos.map((po) => (
                <PurchaseOrderCard key={po.id} po={po} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
