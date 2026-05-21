import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useQuery } from '@tanstack/react-query';
import { Plus, Search, FileText, Clock, CheckCircle, Package, Truck, DollarSign } from 'lucide-react';

import { PurchaseOrderCard } from '../../components/common/PurchaseOrderCard';
import StatCard, { StatsGrid } from '../../components/common/StatCard';
import { useSettings } from '../../context/SettingsContext';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import api from '../../utils/api';
import './PurchaseOrdersPage.css';

export default function PurchaseOrdersPage() {
  const navigate = useNavigate();
  const { formatCurrency } = useSettings();
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { isMobile } = useMobileDetection();

  const { data: pos = [], isLoading } = useQuery({
    queryKey: ['purchaseOrders', statusFilter],
    queryFn: async () => {
      const response = await api.get('/purchase-orders', {
        params: statusFilter ? { status: statusFilter } : {}
      });
      return response.data;
    }
  });

  // Filter POs based on search term
  const filteredPos = pos.filter(po => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      po.po_no?.toLowerCase().includes(search) ||
      po.supplier_name?.toLowerCase().includes(search) ||
      po.warehouse_name?.toLowerCase().includes(search) ||
      po.status?.toLowerCase().includes(search)
    );
  });

  // Calculate summary stats from filtered results
  const stats = {
    total: filteredPos.length,
    draft: filteredPos.filter(po => po.status === 'Draft').length,
    submitted: filteredPos.filter(po => po.status === 'Submitted').length,
    partial: filteredPos.filter(po => po.status === 'Partially Received').length,
    completed: filteredPos.filter(po => po.status === 'Completed').length,
    totalValue: filteredPos.reduce((sum, po) => sum + parseFloat(po.total_amount || 0), 0)
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
          <StatsGrid>
            <StatCard icon={FileText} label="Total POs" value={stats.total} />
            <StatCard icon={FileText} label="Draft" value={stats.draft} />
            <StatCard icon={Send} label="Submitted" value={stats.submitted} />
            <StatCard icon={Package} label="Partially Received" value={stats.partial} />
            <StatCard icon={CheckCircle} label="Completed" value={stats.completed} />
            <StatCard icon={DollarSign} label="Total Value" value={formatCurrency(stats.totalValue)} />
          </StatsGrid>

          <div className="filters-bar">
            <div className="search-box">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search PO..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <label>Status:</label>
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

          {filteredPos.length === 0 ? (
            <div className="no-pos">
              <p>{searchTerm || statusFilter ? 'No purchase orders match your search' : 'No purchase orders found'}</p>
            </div>
          ) : (
            <div className="po-cards-grid">
              {filteredPos.map((po) => (
                <PurchaseOrderCard key={po.id} po={po} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
