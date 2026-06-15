import { useState, useEffect, memo } from 'react';
import { NavLink } from 'react-router-dom';

import { 
  LayoutDashboard, Package, DollarSign, BarChart3, ShoppingCart,
  Factory, Settings, Moon, Sun, 
  TrendingUp, ChevronDown, LogOut, PanelLeft, Briefcase,
  Shield, Users
} from 'lucide-react';

import './TopMenu.css';

import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useKeyboardShortcuts } from '../../context/KeyboardShortcutsContext';
import { useTranslation, getDir } from '../../hooks/useTranslation';
import LanguageToggle from '../common/LanguageToggle';

interface NavItem {
  path?: string;
  labelKey: string;
  icon?: React.ReactNode;
  children?: NavItem[];
}

const getNavItems = (): NavItem[] => [
  { path: '/', labelKey: 'nav.dashboard', icon: <LayoutDashboard size={18} strokeWidth={1.5} /> },
  {
    labelKey: 'nav.inventory',
    icon: <Package size={18} strokeWidth={1.5} />,
    children: [
      { path: '/inventory/items', labelKey: 'nav.items' },
      { path: '/inventory/warehouses', labelKey: 'nav.warehouses' },
      { path: '/inventory/stock-movements', labelKey: 'nav.stockMovements' },
      { path: '/inventory/stock-by-warehouse', labelKey: 'nav.stockByWarehouse' }
    ]
  },
  {
    labelKey: 'nav.purchases',
    icon: <ShoppingCart size={18} strokeWidth={1.5} />,
    children: [
      { path: '/purchases', labelKey: 'nav.purchases' },
      { path: '/purchase-orders', labelKey: 'nav.purchaseOrders' },
      { path: '/suppliers', labelKey: 'nav.suppliers' },
      { path: '/purchases/returns', labelKey: 'nav.purchaseReturns' }
    ]
  },
  {
    labelKey: 'nav.manufacturing',
    icon: <Factory size={18} strokeWidth={1.5} />,
    children: [
      { path: '/bom', labelKey: 'nav.bom' },
      { path: '/production', labelKey: 'nav.production' },
      { path: '/reports/production-summary', labelKey: 'nav.productionSummary' },
      { path: '/reports/bom-usage', labelKey: 'nav.bomUsage' }
    ]
  },
  {
    labelKey: 'nav.sales',
    icon: <DollarSign size={18} strokeWidth={1.5} />,
    children: [
      { path: '/pos', labelKey: 'nav.pos' },
      { path: '/sales', labelKey: 'nav.invoices' },
      { path: '/quotations', labelKey: 'nav.quotations' },
      { path: '/sales-orders', labelKey: 'nav.salesOrders' },
      { path: '/sales/returns', labelKey: 'nav.invoiceReturns' }
    ]
  },
  {
    labelKey: 'nav.customers',
    icon: <Users size={18} strokeWidth={1.5} />,
    children: [
      { path: '/customers', labelKey: 'nav.customers' },
      { path: '/payments', labelKey: 'nav.payments' }
    ]
  },
  {
    labelKey: 'nav.reports',
    icon: <BarChart3 size={18} strokeWidth={1.5} />,
    children: [
      { path: '/reports', labelKey: 'nav.reportsDashboard' },
      { path: '/reports/accounts-receivable', labelKey: 'nav.arReports' },
      { path: '/reports/sales-summary', labelKey: 'nav.salesSummary' },
      { path: '/reports/stock-level', labelKey: 'nav.stockLevel' },
      { path: '/reports/stock-valuation', labelKey: 'nav.stockValuation' },
      { path: '/reports/low-stock', labelKey: 'nav.lowStock' },
      { path: '/reports/inventory-movement', labelKey: 'nav.inventoryMovement' },
      { path: '/reports/profit-loss', labelKey: 'nav.profitLoss' },
      { path: '/reports/cash-flow', labelKey: 'nav.cashFlow' },
      { path: '/expenses', labelKey: 'nav.manageExpenses' }
    ]
  },
  {
    labelKey: 'nav.forecasts',
    icon: <TrendingUp size={18} strokeWidth={1.5} />,
    children: [
      { path: '/forecasts', labelKey: 'nav.forecastsDashboard' },
      { path: '/forecasts/demand', labelKey: 'nav.demand' },
      { path: '/forecasts/trends', labelKey: 'nav.forecastTrends' }
    ]
  },
  {
    labelKey: 'nav.hr',
    icon: <Briefcase size={18} strokeWidth={1.5} />,
    children: [
      { path: '/employees', labelKey: 'nav.employees' }
    ]
  },
  {
    labelKey: 'nav.administrator',
    icon: <Shield size={18} strokeWidth={1.5} />,
    children: [
      { path: '/users', labelKey: 'nav.users' },
      { path: '/roles', labelKey: 'nav.roles' },
      { path: '/activity-log', labelKey: 'nav.activityLog' },
      { path: '/integrations', labelKey: 'nav.integrations' }
    ]
  },
  { path: '/settings', labelKey: 'nav.settings', icon: <Settings size={18} strokeWidth={1.5} /> }
];

const VISIBLE_ITEMS = 8;

interface TopMenuProps {
  onToggleNav?: () => void;
}

const TopMenu = memo(function TopMenu({ onToggleNav }: TopMenuProps) {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { showHelp } = useKeyboardShortcuts();
  const { t, locale } = useTranslation();
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dir = getDir();
  }, [locale]);

  const navItems = getNavItems();
  const visibleItems = navItems.slice(0, VISIBLE_ITEMS);
  const overflowItems = navItems.slice(VISIBLE_ITEMS);

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
        </NavLink>
      </div>

      <nav className="top-menu-nav">
        {visibleItems.map((item, index) => (
          item.children ? (
            <div
              role="button"
              tabIndex={0}
              key={item.labelKey}
              className={`top-menu-dropdown ${activeDropdown === index ? 'active' : ''}`}
              onMouseEnter={() => handleDropdownHover(index)}
              onMouseLeave={handleDropdownLeave}
            >
              <button type="button" className="top-menu-dropdown-trigger">
                <span>{t(item.labelKey)}</span>
                <ChevronDown size={14} className="dropdown-arrow" />
              </button>
              <div className="top-menu-dropdown-menu">
                {item.children.map((child) => (
                  <NavLink
                    key={child.path}
                    to={child.path!}
                    className={({ isActive }) => `top-menu-dropdown-item ${isActive ? 'active' : ''}`}
                  >
                    {t(child.labelKey)}
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
              <span>{t(item.labelKey)}</span>
              {item.path === '/' && <span className="shortcut-hint">Alt+1</span>}
            </NavLink>
          )
        ))}
        {overflowItems.length > 0 && (
          <div
            role="button"
            tabIndex={0}
            className={`top-menu-dropdown ${activeDropdown === VISIBLE_ITEMS ? 'active' : ''}`}
            onMouseEnter={() => handleDropdownHover(VISIBLE_ITEMS)}
            onMouseLeave={handleDropdownLeave}
          >
            <button type="button" className="top-menu-dropdown-trigger">
              <span>More</span>
              <ChevronDown size={14} className="dropdown-arrow" />
            </button>
            <div className="top-menu-dropdown-menu">
              {overflowItems.map((item) => (
                item.children ? (
                  item.children.map((child) => (
                    <NavLink
                      key={child.path}
                      to={child.path!}
                      className={({ isActive }) => `top-menu-dropdown-item ${isActive ? 'active' : ''}`}
                    >
                      {t(child.labelKey)}
                    </NavLink>
                  ))
                ) : (
                  <NavLink
                    key={item.path}
                    to={item.path!}
                    className={({ isActive }) => `top-menu-dropdown-item ${isActive ? 'active' : ''}`}
                  >
                    {t(item.labelKey)}
                  </NavLink>
                )
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="top-menu-right">
        {onToggleNav && (
          <button
            type="button"
            className="top-menu-nav-toggle"
            onClick={onToggleNav}
            title="Switch to Sidebar"
            aria-label="Switch to Sidebar"
          >
            <PanelLeft size={18} />
          </button>
        )}
        <button
          type="button"
          className="top-menu-theme-toggle"
          onClick={toggleDarkMode}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <LanguageToggle showLabel={false} />

        <div 
          role="button"
          tabIndex={0}
          className={`top-menu-user ${isUserMenuOpen ? 'open' : ''}`}
          onMouseEnter={() => setIsUserMenuOpen(true)}
          onMouseLeave={() => setIsUserMenuOpen(false)}
        >
          <button type="button" className="top-menu-user-trigger">
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
            <button type="button" className="top-menu-help-btn" onClick={showHelp}>
              <span>Keyboard Shortcuts</span>
            </button>
            <button type="button" className="top-menu-logout-btn" onClick={logout}>
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
