import { useState, useEffect, memo } from 'react';
import { NavLink } from 'react-router-dom';

import {
  Menu, X, LogOut,
  LayoutDashboard, Package, DollarSign, BarChart3, ShoppingCart,
  ClipboardList, Factory, Receipt, FileText, Link2, Settings, Moon, Sun, TrendingUp, Users, Shield, LayoutGrid, ChevronRight, CreditCard
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../hooks/useTranslation';
import LanguageToggle from '../common/LanguageToggle';
import './Sidebar.css';

interface NavItem {
  path?: string;
  labelKey: string;
  icon?: React.ReactNode;
  children?: NavItem[];
}

const getNavItems = (): NavItem[] => [
  { path: '/', labelKey: 'nav.dashboard', icon: <LayoutDashboard size={20} strokeWidth={1.5} /> },
  {
    labelKey: 'nav.inventory',
    icon: <Package size={20} strokeWidth={1.5} />,
    children: [
      { path: '/inventory/items', labelKey: 'nav.items' },
      { path: '/inventory/warehouses', labelKey: 'nav.warehouses' },
      { path: '/inventory/stock-movements', labelKey: 'nav.stockMovements' },
      { path: '/inventory/stock-by-warehouse', labelKey: 'nav.stockByWarehouse' }
    ]
  },
  {
    labelKey: 'nav.sales',
    icon: <DollarSign size={20} strokeWidth={1.5} />,
    children: [
      { path: '/pos', labelKey: 'nav.pos' },
      { path: '/sales', labelKey: 'nav.invoices' },
      { path: '/quotations', labelKey: 'nav.quotations' },
      { path: '/sales-orders', labelKey: 'nav.salesOrders' },
      { path: '/sales/invoice', labelKey: 'actions.create' },
      { path: '/customers', labelKey: 'nav.customers' }
    ]
  },
  {
    labelKey: 'nav.reports',
    icon: <BarChart3 size={20} strokeWidth={1.5} />,
    children: [
      { path: '/reports', labelKey: 'nav.reportsDashboard' },
      { path: '/reports/accounts-receivable', labelKey: 'nav.arReports' },
      { path: '/reports/sales-summary', labelKey: 'nav.salesSummary' },
      { path: '/reports/stock-level', labelKey: 'nav.stockLevel' },
      { path: '/reports/low-stock', labelKey: 'nav.lowStock' },
      { path: '/reports/profit-loss', labelKey: 'nav.profitLoss' },
      { path: '/reports/cash-flow', labelKey: 'nav.cashFlow' },
      { path: '/reports/expenses', labelKey: 'nav.expensesReport' }
    ]
  },
  {
    labelKey: 'nav.forecasts',
    icon: <TrendingUp size={20} strokeWidth={1.5} />,
    children: [
      { path: '/forecasts', labelKey: 'nav.forecastsDashboard' },
      { path: '/forecasts/demand', labelKey: 'nav.demand' },
      { path: '/forecasts/trends', labelKey: 'nav.forecastTrends' }
    ]
  },
  {
    labelKey: 'nav.purchases',
    icon: <ShoppingCart size={20} strokeWidth={1.5} />,
    children: [
      { path: '/purchases', labelKey: 'nav.purchases' },
      { path: '/purchase-orders', labelKey: 'nav.purchaseOrders' },
      { path: '/suppliers', labelKey: 'nav.suppliers' }
    ]
  },
  { path: '/bom', labelKey: 'nav.bom', icon: <ClipboardList size={20} strokeWidth={1.5} /> },
  { path: '/production', labelKey: 'nav.production', icon: <Factory size={20} strokeWidth={1.5} /> },
  {
    labelKey: 'nav.expenses',
    icon: <Receipt size={20} strokeWidth={1.5} />,
    children: [
      { path: '/expenses', labelKey: 'nav.expenses' }
    ]
  },
  {
    labelKey: 'nav.administrator',
    icon: <Shield size={20} strokeWidth={1.5} />,
    children: [
      { path: '/users', labelKey: 'nav.users' },
      { path: '/roles', labelKey: 'nav.roles' }
    ]
  },
  { path: '/payments', labelKey: 'nav.payments', icon: <CreditCard size={20} strokeWidth={1.5} /> },
  { path: '/activity-log', labelKey: 'nav.activityLog', icon: <FileText size={20} strokeWidth={1.5} /> },
  { path: '/integrations', labelKey: 'nav.integrations', icon: <Link2 size={20} strokeWidth={1.5} /> },
  { path: '/settings', labelKey: 'nav.settings', icon: <Settings size={20} strokeWidth={1.5} /> }
];

const Sidebar = memo(function Sidebar({ onToggleNav, isCompact = false }: { onToggleNav?: () => void; isCompact?: boolean }) {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { t } = useTranslation();
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const navItems = getNavItems();

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
            type="button"
            className="sidebar-toggle mobile-dark-mode-toggle"
            onClick={toggleDarkMode}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            type="button"
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
          {navItems.map((item, index) => (
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
                  <span className="nav-label">{t(item.labelKey)}</span>
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
                      {t(child.labelKey)}
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
                <span className="nav-label">{t(item.labelKey)}</span>
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
            <div className="language-switcher">
              <LanguageToggle showLabel={false} />
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