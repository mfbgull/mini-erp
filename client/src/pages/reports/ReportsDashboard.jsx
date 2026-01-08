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
  CheckCircle,
  Clock
} from 'lucide-react';
import './ReportsDashboard.css';

export default function ReportsDashboard() {
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
          icon: CreditCard
        },
        {
          name: 'Expenses',
          description: 'Business expenses analysis',
          path: '/reports/expenses',
          icon: DollarSign
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
          icon: TrendingUp
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