import { useMemo } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import { Link, useNavigate } from 'react-router-dom';

import { useQuery } from '@tanstack/react-query';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Package, DollarSign, ShoppingCart, Factory, BarChart3, ClipboardList, AlertTriangle, Waves } from 'lucide-react';

import StatCard, { StatsGrid } from '../components/common/StatCard';
import FloatingActionButton from '../components/layout/FloatingActionButton';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';
import { useTranslation } from '../hooks/useTranslation';
import api from '../utils/api';
import './Dashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const getLast7Days = () => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push(date.toISOString().split('T')[0]);
  }
  return days;
};

export default function Dashboard() {
  const { user } = useAuth();
  const { formatCurrency } = useSettings();
  const { t } = useTranslation();
  const navigate = useNavigate();

  useKeyboardShortcut('Alt+N', () => {
    navigate('/inventory/items/create');
  }, { context: 'dashboard', id: 'dashboard-quick-add' });

  useKeyboardShortcut('Alt+R', () => {
    window.location.reload();
  }, { context: 'dashboard', id: 'dashboard-refresh' });

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const response = await api.get('/dashboard/summary');
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const salesPurchasesTrendData = useMemo(() => {
    const last7Days = getLast7Days();
    const salesMap = Object.fromEntries((data?.salesByDay || []).map(d => [d.date, d.total]));
    const purchasesMap = Object.fromEntries((data?.purchasesByDay || []).map(d => [d.date, d.total]));

    return {
      labels: last7Days.map(date => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [
        {
          label: 'Sales',
          data: last7Days.map(d => salesMap[d] || 0),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4
        },
        {
          label: 'Purchases',
          data: last7Days.map(d => purchasesMap[d] || 0),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.4
        }
      ]
    };
  }, [data]);

  const stockByCategoryData = useMemo(() => ({
    labels: (data?.stockByCategory || []).map(c => c.category),
    datasets: [{
      label: 'Stock Quantity',
      data: (data?.stockByCategory || []).map(c => c.total_stock),
      backgroundColor: [
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 99, 132, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)',
        'rgba(255, 159, 64, 0.6)'
      ],
      borderColor: [
        'rgba(54, 162, 235, 1)',
        'rgba(255, 99, 132, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)'
      ],
      borderWidth: 1
    }]
  }), [data]);

  if (isLoading) {
    return (
      <div className="dashboard">
        <div className="dashboard-loading">
          <div className="loading-spinner" />
          <p>{t('messages.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>{t('dashboard.welcome')}, {user?.username || t('common.user')}</h1>
          <p className="dashboard-subtitle">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <StatsGrid className="compact">
        <StatCard icon={Package} label={t('dashboard.totalItems')} value={data?.totalItems ?? 0} subtitle={`${data?.warehouseStockCount ?? 0} ${t('dashboard.warehouseStocks')}`} />
        <StatCard icon={DollarSign} label={t('dashboard.stockValue')} value={formatCurrency(data?.totalStockValue ?? 0)} subtitle={t('dashboard.currentInventoryWorth')} />
        <StatCard icon={ShoppingCart} label={t('dashboard.salesRevenue')} value={formatCurrency(data?.totalSalesRevenue ?? 0)} subtitle={t('dashboard.totalSales')} />
        <StatCard icon={Factory} label={t('nav.production')} value={data?.recentProductions ?? 0} subtitle={t('dashboard.runsLast30Days')} />
      </StatsGrid>

      {/* Charts Row */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>{t('dashboard.salesVsPurchases')}</h3>
          <div className="chart-container">
            <Line
              data={salesPurchasesTrendData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top' }
                },
                scales: {
                  y: { beginAtZero: true }
                }
              }}
            />
          </div>
        </div>

        <div className="chart-card">
          <h3>{t('dashboard.stockByCategory')}</h3>
          <div className="chart-container">
            <Doughnut
              data={stockByCategoryData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom' }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="dashboard-bottom">
        {/* Low Stock Alerts */}
        <div className="alert-card">
          <h3><AlertTriangle size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> {t('dashboard.lowStockAlerts')}</h3>
          {(data?.lowStockItems || []).length === 0 ? (
            <p className="no-alerts">{t('dashboard.wellStocked')}</p>
          ) : (
            <div className="alert-list">
              {data.lowStockItems.slice(0, 5).map(item => (
                <Link to="/inventory/items" key={item.id} className="alert-item">
                  <div>
                    <div className="alert-item-name">{item.item_name}</div>
                    <div className="alert-item-code">{item.item_code}</div>
                  </div>
                  <div className="alert-item-stock">
                    <span className="stock-low">{item.current_stock}</span>
                    <span className="stock-reorder">{t('fields.reorder')}: {item.reorder_level}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-card">
          <h3>{t('dashboard.quickActions')}</h3>
          <div className="quick-actions-grid">
            <Link to="/inventory/items" className="quick-action-btn">
              <Package className="action-icon" size={28} strokeWidth={1.5} />
              <span>{t('dashboard.newItem')}</span>
            </Link>
            <Link to="/sales" className="quick-action-btn">
              <DollarSign className="action-icon" size={28} strokeWidth={1.5} />
              <span>{t('dashboard.recordSale')}</span>
            </Link>
            <Link to="/purchases" className="quick-action-btn">
              <ShoppingCart className="action-icon" size={28} strokeWidth={1.5} />
              <span>{t('dashboard.newPurchase')}</span>
            </Link>
            <Link to="/production" className="quick-action-btn">
              <Factory className="action-icon" size={28} strokeWidth={1.5} />
              <span>{t('nav.production')}</span>
            </Link>
            <Link to="/inventory/stock-movements" className="quick-action-btn">
              <BarChart3 className="action-icon" size={28} strokeWidth={1.5} />
              <span>{t('dashboard.stockMovement')}</span>
            </Link>
            <Link to="/bom" className="quick-action-btn">
              <ClipboardList className="action-icon" size={28} strokeWidth={1.5} />
              <span>{t('nav.bom')}</span>
            </Link>
            <Link to="/ecosystem" className="quick-action-btn" style={{ background: 'linear-gradient(135deg, rgba(0,245,212,0.1), rgba(155,93,229,0.1))', border: '1px solid rgba(0,245,212,0.3)' }}>
              <Waves className="action-icon" size={28} strokeWidth={1.5} style={{ color: '#00f5d4' }} />
              <span style={{ color: '#00f5d4' }}>{t('dashboard.livingEcosystem')}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Floating Quick Actions (Mobile) */}
      <FloatingActionButton />
    </div>
  );
}
