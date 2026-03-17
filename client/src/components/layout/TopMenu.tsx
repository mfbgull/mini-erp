import { useState, useEffect, memo } from 'react';
import { NavLink } from 'react-router-dom';

import { 
  LayoutDashboard, Package, DollarSign, BarChart3, ShoppingCart,
  ClipboardList, Factory, Receipt, FileText, Link2, Settings, Moon, Sun, 
  TrendingUp, ChevronDown, LogOut
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './TopMenu.css';

interface NavItem {
  path?: string;
  label: string;
  icon?: React.ReactNode;
  children?: NavItem[];
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={18} strokeWidth={1.5} /> },
  {
    label: 'Inventory',
    icon: <Package size={18} strokeWidth={1.5} />,
    children: [
      { path: '/inventory/items', label: 'Items' },
      { path: '/inventory/warehouses', label: 'Warehouses' },
      { path: '/inventory/stock-movements', label: 'Stock Movements' },
      { path: '/inventory/stock-by-warehouse', label: 'Stock by Warehouse' }
    ]
  },
  {
    label: 'Sales',
    icon: <DollarSign size={18} strokeWidth={1.5} />,
    children: [
      { path: '/pos', label: 'POS Terminal' },
      { path: '/sales', label: 'Sales' },
      { path: '/sales/invoice', label: 'Create Invoice' },
      { path: '/customers', label: 'Customers' }
    ]
  },
  {
    label: 'Reports',
    icon: <BarChart3 size={18} strokeWidth={1.5} />,
    children: [
      { path: '/reports', label: 'Dashboard' },
      { path: '/reports/accounts-receivable', label: 'A/R Reports' },
      { path: '/reports/sales-summary', label: 'Sales Summary' },
      { path: '/reports/stock-level', label: 'Stock Levels' },
      { path: '/reports/low-stock', label: 'Low Stock Alert' },
      { path: '/reports/profit-loss', label: 'Profit & Loss' },
      { path: '/reports/cash-flow', label: 'Cash Flow' },
      { path: '/reports/expenses', label: 'Expenses Report' }
    ]
  },
  {
    label: 'Forecasts',
    icon: <TrendingUp size={18} strokeWidth={1.5} />,
    children: [
      { path: '/forecasts', label: 'Dashboard' },
      { path: '/forecasts/demand', label: 'Demand Forecast' },
      { path: '/forecasts/trends', label: 'Trends' }
    ]
  },
  {
    label: 'Purchases',
    icon: <ShoppingCart size={18} strokeWidth={1.5} />,
    children: [
      { path: '/purchases', label: 'Purchases' },
      { path: '/purchase-orders', label: 'Purchase Orders' },
      { path: '/purchase-orders/create', label: 'Create PO' },
      { path: '/suppliers', label: 'Suppliers' }
    ]
  },
  { path: '/bom', label: 'BOM', icon: <ClipboardList size={18} strokeWidth={1.5} /> },
  { path: '/production', label: 'Production', icon: <Factory size={18} strokeWidth={1.5} /> },
  { path: '/expenses', label: 'Expenses', icon: <Receipt size={18} strokeWidth={1.5} /> },
  { path: '/activity-log', label: 'Activity', icon: <FileText size={18} strokeWidth={1.5} /> },
  { path: '/integrations', label: 'Integrations', icon: <Link2 size={18} strokeWidth={1.5} /> },
  { path: '/settings', label: 'Settings', icon: <Settings size={18} strokeWidth={1.5} /> }
];

const TopMenu = memo(function TopMenu() {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleDropdownHover = (index: number) => {
    setActiveDropdown(index);
  };

  const handleDropdownLeave = () => {
    setActiveDropdown(null);
  };

  return (
    <header className="top-menu">
      <div className="top-menu-left">
        <NavLink to="/" className="top-menu-logo">
          <img src="/minierp-logo.webp" alt="Mini ERP" className="top-menu-logo-image" />
          <span className="top-menu-logo-text">Mini ERP</span>
        </NavLink>
      </div>

      <nav className="top-menu-nav">
        {NAV_ITEMS.map((item, index) => (
          item.children ? (
            <div
              key={index}
              className={`top-menu-dropdown ${activeDropdown === index ? 'active' : ''}`}
              onMouseEnter={() => handleDropdownHover(index)}
              onMouseLeave={handleDropdownLeave}
            >
              <button className="top-menu-dropdown-trigger">
                <span>{item.label}</span>
                <ChevronDown size={14} className="dropdown-arrow" />
              </button>
              <div className="top-menu-dropdown-menu">
                {item.children.map((child) => (
                  <NavLink
                    key={child.path}
                    to={child.path!}
                    className={({ isActive }) => `top-menu-dropdown-item ${isActive ? 'active' : ''}`}
                  >
                    {child.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ) : (
            <NavLink
              key={item.path}
              to={item.path!}
              className={({ isActive }) => `top-menu-item ${isActive ? 'active' : ''}`}
            >
              <span>{item.label}</span>
            </NavLink>
          )
        ))}
      </nav>

      <div className="top-menu-right">
        <button
          className="top-menu-theme-toggle"
          onClick={toggleDarkMode}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div 
          className={`top-menu-user ${isUserMenuOpen ? 'open' : ''}`}
          onMouseEnter={() => setIsUserMenuOpen(true)}
          onMouseLeave={() => setIsUserMenuOpen(false)}
        >
          <button className="top-menu-user-trigger">
            <div className="top-menu-user-avatar">
              {user?.full_name?.charAt(0)}
            </div>
            <span className="top-menu-user-name">{user?.full_name}</span>
            <ChevronDown size={14} className="user-arrow" />
          </button>
          <div className="top-menu-user-menu">
            <div className="top-menu-user-info">
              <div className="top-menu-user-role">{user?.role}</div>
            </div>
            <button className="top-menu-logout-btn" onClick={logout}>
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
});

export default TopMenu;
