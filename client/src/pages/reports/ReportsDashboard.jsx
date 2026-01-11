import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Package,
  ShoppingCart,
  Users,
  FileText,
  BarChart3,
  Factory,
  CreditCard,
  DollarSign,
  AlertTriangle,
  Clock,
  PieChart,
  Wallet,
  Target,
  TrendingDown
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { useSettings } from '../../context/SettingsContext';
import './ReportsDashboard.css';

export default function ReportsDashboard() {
  const { formatCurrency } = useSettings();

  // Fetch summary statistics
  const { data: salesData } = useQuery({
    queryKey: ['reports', 'sales-summary'],
    queryFn: async () => {
      const response = await api.get('/reports/sales-summary');
      return response.data;
    }
  });

  const { data: inventoryStats } = useQuery({
    queryKey: ['reports', 'inventory-stats'],
    queryFn: async () => {
      const response = await api.get('/reports/inventory-stats');
      return response.data;
    }
  });

  const { data: arAging } = useQuery({
    queryKey: ['reports', 'ar-aging'],
    queryFn: async () => {
      const response = await api.get('/reports/accounts-receivable');
      return response.data;
    }
  });

  // Calculate summary stats
  const stats = {
    totalSales: salesData?.totalSales || 0,
    pendingPayments: arAging?.totalOutstanding || 0,
    overduePayments: arAging?.overdue || 0,
    totalItems: inventoryStats?.totalItems || 0,
    lowStockItems: inventoryStats?.lowStock || 0,
    inventoryValue: inventoryStats?.totalValue || 0
  };

  const reportCategories = [
    {
      title: 'Sales Reports',
      icon: TrendingUp,
      color: 'bg-blue-500',
      reports: [
        {
          name: 'Sales Summary',
          description: 'View sales performance and trends',
          path: '/reports/sales-summary',
          icon: TrendingUp
        },
        {
          name: 'Sales by Customer',
          description: 'Analyze sales by customer',
          path: '/reports/sales-by-customer',
          icon: Users
        },
        {
          name: 'Sales by Item',
          description: 'Track item-wise sales performance',
          path: '/reports/sales-by-item',
          icon: Package
        }
      ]
    },
    {
      title: 'Inventory Reports',
      icon: Package,
      color: 'bg-green-500',
      reports: [
        {
          name: 'Stock Levels',
          description: 'Current inventory levels',
          path: '/reports/stock-level',
          icon: Package
        },
        {
          name: 'Low Stock Alert',
          description: 'Items below minimum stock',
          path: '/reports/low-stock',
          icon: AlertTriangle
        },
        {
          name: 'Stock Valuation',
          description: 'Inventory value analysis',
          path: '/reports/stock-valuation',
          icon: DollarSign
        },
        {
          name: 'Inventory Movement',
          description: 'Track stock movements',
          path: '/reports/inventory-movement',
          icon: BarChart3
        }
      ]
    },
    {
      title: 'Financial Reports',
      icon: DollarSign,
      color: 'bg-purple-500',
      reports: [
        {
          name: 'Profit & Loss',
          description: 'Revenue and expense analysis',
          path: '/reports/profit-loss',
          icon: TrendingUp
        },
        {
          name: 'Cash Flow',
          description: 'Cash inflow and outflow',
          path: '/reports/cash-flow',
          icon: Wallet
        },
        {
          name: 'Expenses',
          description: 'Business expenses analysis',
          path: '/reports/expenses',
          icon: CreditCard
        }
      ]
    },
    {
      title: 'Accounts Receivable',
      icon: CreditCard,
      color: 'bg-indigo-500',
      reports: [
        {
          name: 'AR Aging',
          description: 'Customer payment aging',
          path: '/reports/accounts-receivable',
          icon: Clock
        },
        {
          name: 'Customer Statements',
          description: 'Detailed customer statements',
          path: '/reports/customer-statements',
          icon: FileText
        },
        {
          name: 'Top Debtors',
          description: 'Customers with highest balances',
          path: '/reports/top-debtors',
          icon: Users
        },
        {
          name: 'DSO Analysis',
          description: 'Days Sales Outstanding',
          path: '/reports/dso',
          icon: Target
        }
      ]
    },
    {
      title: 'Purchase Reports',
      icon: ShoppingCart,
      color: 'bg-orange-500',
      reports: [
        {
          name: 'Purchase Summary',
          description: 'Overall purchase analysis',
          path: '/reports/purchase-summary',
          icon: ShoppingCart
        },
        {
          name: 'Supplier Analysis',
          description: 'Supplier performance analysis',
          path: '/reports/supplier-analysis',
          icon: Users
        }
      ]
    },
    {
      title: 'Production Reports',
      icon: Factory,
      color: 'bg-red-500',
      reports: [
        {
          name: 'Production Summary',
          description: 'Production order analysis',
          path: '/reports/production-summary',
          icon: Factory
        },
        {
          name: 'BOM Usage',
          description: 'Bill of Materials usage',
          path: '/reports/bom-usage',
          icon: BarChart3
        }
      ]
    }
  ];

  return (
    <div className="reports-dashboard">
      <div className="page-header">
        <div>
          <h1>Reports Dashboard</h1>
          <p className="page-subtitle">Comprehensive business analytics and reporting</p>
        </div>
      </div>

      {/* Summary Statistics Cards - ItemsPage Style */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}>
            📈
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Sales</div>
            <div className="stat-value">{formatCurrency(stats.totalSales)}</div>
            <div className="stat-subtitle">Revenue this period</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderColor: stats.pendingPayments > 0 ? '#f97316' : undefined }}>
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}>
            💰
          </div>
          <div className="stat-content">
            <div className="stat-label">Outstanding</div>
            <div className="stat-value">{formatCurrency(stats.pendingPayments)}</div>
            <div className="stat-subtitle">Pending payments</div>
          </div>
        </div>

        <div className="stat-card alert">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
            ⚠️
          </div>
          <div className="stat-content">
            <div className="stat-label">Overdue</div>
            <div className="stat-value">{formatCurrency(stats.overduePayments)}</div>
            <div className="stat-subtitle">Past due amount</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
            📦
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Items</div>
            <div className="stat-value">{stats.totalItems}</div>
            <div className="stat-subtitle">In inventory</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderColor: stats.lowStockItems > 0 ? '#f59e0b' : undefined }}>
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
            🔔
          </div>
          <div className="stat-content">
            <div className="stat-label">Low Stock</div>
            <div className="stat-value">{stats.lowStockItems}</div>
            <div className="stat-subtitle">Need reorder</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
            💎
          </div>
          <div className="stat-content">
            <div className="stat-label">Inventory Value</div>
            <div className="stat-value">{formatCurrency(stats.inventoryValue)}</div>
            <div className="stat-subtitle">Total stock worth</div>
          </div>
        </div>
      </div>

      {/* Quick Actions - ItemsPage Style */}
      <div className="quick-actions">
        <Link to="/reports/sales-summary" className="quick-action-btn">
          <span className="action-icon">📊</span>
          <span className="action-text">Sales Summary</span>
        </Link>
        <Link to="/reports/accounts-receivable" className="quick-action-btn">
          <span className="action-icon">📋</span>
          <span className="action-text">AR Aging</span>
        </Link>
        <Link to="/reports/low-stock" className="quick-action-btn">
          <span className="action-icon">⚠️</span>
          <span className="action-text">Low Stock</span>
        </Link>
        <Link to="/reports/profit-loss" className="quick-action-btn">
          <span className="action-icon">📈</span>
          <span className="action-text">P&L Report</span>
        </Link>
        <Link to="/reports/stock-valuation" className="quick-action-btn">
          <span className="action-icon">💰</span>
          <span className="action-text">Stock Value</span>
        </Link>
        <Link to="/reports/cash-flow" className="quick-action-btn">
          <span className="action-icon">💵</span>
          <span className="action-text">Cash Flow</span>
        </Link>
      </div>

      {/* Reports Grid */}
      <div className="reports-grid">
        {reportCategories.map((category, index) => {
          const IconComponent = category.icon;
          return (
            <div key={index} className="report-category">
              <div className="category-header">
                <div className={`category-icon ${category.color}`}>
                  <IconComponent size={24} />
                </div>
                <h3 className="category-title">{category.title}</h3>
              </div>

              <div className="category-reports">
                {category.reports.map((report, reportIndex) => {
                  const ReportIcon = report.icon;
                  return (
                    <Link
                      key={reportIndex}
                      to={report.path}
                      className="report-card"
                    >
                      <div className="report-icon">
                        <ReportIcon size={20} />
                      </div>
                      <div className="report-info">
                        <h4 className="report-name">{report.name}</h4>
                        <p className="report-description">{report.description}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
