import { useState, useEffect, memo } from 'react';
import { NavLink } from 'react-router-dom';

import {
  Menu, X, LogOut,
  LayoutDashboard, Package, DollarSign, BarChart3, ShoppingCart,
  ClipboardList, Factory, Receipt, FileText, Link2, Settings, Moon, Sun, TrendingUp, Users, Shield, LayoutGrid, ChevronRight
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './Sidebar.css';

interface NavItem {
  path?: string;
  label: string;
  icon?: React.ReactNode;
  children?: NavItem[];
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} strokeWidth={1.5} /> },
  {
    label: 'Inventory',
    icon: <Package size={20} strokeWidth={1.5} />,
    children: [
      { path: '/inventory/items', label: 'Items' },
      { path: '/inventory/warehouses', label: 'Warehouses' },
      { path: '/inventory/stock-movements', label: 'Stock Movements' },
      { path: '/inventory/stock-by-warehouse', label: 'Stock by Warehouse' }
    ]
  },
  {
    label: 'Sales',
    icon: <DollarSign size={20} strokeWidth={1.5} />,
    children: [
      { path: '/pos', label: 'POS Terminal' },
      { path: '/sales', label: 'Invoices' },
      { path: '/quotations', label: 'Quotations' },
      { path: '/sales-orders', label: 'Sales Orders' },
      { path: '/sales/invoice', label: 'Create Invoice' },
      { path: '/customers', label: 'Customers' }
    ]
  },
  {
    label: 'Reports',
    icon: <BarChart3 size={20} strokeWidth={1.5} />,
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
    icon: <TrendingUp size={20} strokeWidth={1.5} />,
    children: [
      { path: '/forecasts', label: 'Dashboard' },
      { path: '/forecasts/demand', label: 'Demand Forecast' },
      { path: '/forecasts/trends', label: 'Trends' }
    ]
  },
  {
    label: 'Purchases',
    icon: <ShoppingCart size={20} strokeWidth={1.5} />,
    children: [
      { path: '/purchases', label: 'Purchases' },
      { path: '/purchase-orders', label: 'Purchase Orders' },
      { path: '/purchase-orders/create', label: 'Create PO' },
      { path: '/suppliers', label: 'Suppliers' }
    ]
  },
  { path: '/bom', label: 'Bill of Materials', icon: <ClipboardList size={20} strokeWidth={1.5} /> },
  { path: '/production', label: 'Production', icon: <Factory size={20} strokeWidth={1.5} /> },
  { path: '/expenses', label: 'Expenses', icon: <Receipt size={20} strokeWidth={1.5} /> },
  {
    label: 'Administrator',
    icon: <Shield size={20} strokeWidth={1.5} />,
    children: [
      { path: '/users', label: 'Users' },
      { path: '/roles', label: 'Roles' }
    ]
  },
  { path: '/activity-log', label: 'Activity Log', icon: <FileText size={20} strokeWidth={1.5} /> },
  { path: '/integrations', label: 'Integrations', icon: <Link2 size={20} strokeWidth={1.5} /> },
  { path: '/settings', label: 'Settings', icon: <Settings size={20} strokeWidth={1.5} /> }
];

const Sidebar = memo(function Sidebar({ onToggleNav, isCompact = false }: { onToggleNav?: () => void; isCompact?: boolean }) {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  const toggleDropdown = (index: number) => {
    setActiveDropdown(activeDropdown === index ? null : index);
  };

  return (
    <>
      {isMobile && (
        <>
          <button
            className="sidebar-toggle mobile-dark-mode-toggle"
            onClick={toggleDarkMode}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            className="sidebar-toggle mobile-menu-toggle"
            onClick={toggleMobileMenu}
            title={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </>
      )}

      <div className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''} ${isCompact ? 'desktop-compact' : ''}`}>
        <div className="sidebar-header">
          {onToggleNav && isCompact && (
            <button
              type="button"
              className="sidebar-nav-toggle"
              onClick={onToggleNav}
              title="Switch to Top Menu"
              aria-label="Switch to Top Menu"
            >
              <LayoutGrid size={18} />
            </button>
          )}
          <div className="sidebar-logo">
            <img src="/minierp-logo.webp" alt="Mini ERP" className="sidebar-logo-image" />
          </div>
        </div>

        <nav className="sidebar-menu">
          {NAV_ITEMS.map((item, index) => (
            item.children ? (
              <button
                type="button"
                key={index}
                className={`nav-section ${activeDropdown === index ? 'dropdown-active' : ''}`}
                onClick={() => toggleDropdown(index)}
                onMouseEnter={() => !isMobile && setActiveDropdown(index)}
                onMouseLeave={() => !isMobile && setActiveDropdown(null)}
              >
                <div className="nav-section-title">
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                  <ChevronRight size={16} className="nav-arrow" />
                </div>
                <div className="nav-children">
                  {item.children.map((child) => (
                    <NavLink
                      key={child.path}
                      to={child.path!}
                      className={({ isActive }) => `nav-item nav-sub-item ${isActive ? 'active' : ''}`}
                      onClick={handleNavClick}
                    >
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              </button>
            ) : (
              <NavLink
                key={item.path}
                to={item.path!}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                end
                onClick={handleNavClick}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            )
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.full_name?.charAt(0)}</div>
            <div className="user-details">
              <div className="user-name">{user?.full_name}</div>
              <div className="user-role tiny">{user?.role}</div>
            </div>
            <button type="button" className="logout-btn" onClick={logout} title="Logout">
              <LogOut size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
});

export default Sidebar;
