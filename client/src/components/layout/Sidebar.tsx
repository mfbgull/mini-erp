import { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import './Sidebar.css';

interface NavItem {
  path?: string;
  label: string;
  icon?: string;
  children?: NavItem[];
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });
  const [dropdownTop, setDropdownTop] = useState<number | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isCollapsed.toString());
    window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: { collapsed: isCollapsed } }));
  }, [isCollapsed]);

  // Detect mobile screen size
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileMenuOpen(!isMobileMenuOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  const handleNavClick = () => {
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  const navItems: NavItem[] = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    {
      label: 'Inventory',
      icon: '📦',
      children: [
        { path: '/inventory/items', label: 'Items' },
        { path: '/inventory/warehouses', label: 'Warehouses' },
        { path: '/inventory/stock-movements', label: 'Stock Movements' },
        { path: '/inventory/stock-by-warehouse', label: 'Stock by Warehouse' }
      ]
    },
    {
      label: 'Sales',
      icon: '💰',
      children: [
        { path: '/pos', label: 'POS Terminal' },
        { path: '/sales', label: 'Sales' },
        { path: '/sales/invoice', label: 'Create Invoice' },
        { path: '/customers', label: 'Customers' }
      ]
    },
    {
      label: 'Reports',
      icon: '📊',
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
      label: 'Purchases',
      icon: '🛒',
      children: [
        { path: '/purchases', label: 'Purchases' },
        { path: '/purchase-orders', label: 'Purchase Orders' },
        { path: '/purchase-orders/create', label: 'Create PO' },
        { path: '/suppliers', label: 'Suppliers' }
      ]
    },
    { path: '/bom', label: 'Bill of Materials', icon: '📋' },
    { path: '/production', label: 'Production', icon: '🏭' },
    { path: '/expenses', label: 'Expenses', icon: '💸' },
    { path: '/activity-log', label: 'Activity Log', icon: '📝' },
    { path: '/integrations', label: 'Integrations', icon: '🔗' },
    { path: '/settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      {isMobile && (
        <button
          className="sidebar-toggle mobile-menu-toggle"
          onClick={toggleSidebar}
          title={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMobileMenuOpen}
          aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      {/* Desktop Collapse Toggle */}
      {!isMobile && (
        <button
          className={`sidebar-toggle ${isCollapsed ? 'collapsed' : ''}`}
          onClick={toggleSidebar}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      )}

      <div className={`sidebar ${isCollapsed && !isMobile ? 'collapsed' : ''} ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          {isCollapsed && !isMobile ? (
            <img src="/minierp-logo.webp" alt="Mini ERP" className="sidebar-logo-image collapsed" />
          ) : (
            <>
              <img src="/minierp-logo.webp" alt="Mini ERP" className="sidebar-logo-image" />
              <h3>Mini ERP</h3>
              <p className="small">Simple & Powerful</p>
            </>
          )}
        </div>

        <nav className="sidebar-menu">
          {navItems.map((item, index) => (
            item.children ? (
              <div
                key={index}
                className={`nav-section ${isCollapsed && !isMobile ? 'has-dropdown' : ''} ${activeDropdown === index ? 'dropdown-active' : ''}`}
                onMouseEnter={(e: React.MouseEvent) => {
                  if (isCollapsed && !isMobile) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setDropdownTop(rect.top);
                    setActiveDropdown(index);
                  }
                }}
                onMouseLeave={() => {
                  if (!isMobile) {
                    setActiveDropdown(null);
                  }
                }}
              >
                <div className="nav-section-title" title={isCollapsed && !isMobile ? item.label : ''}>
                  <span>{item.icon}</span>
                  {(!isCollapsed && !isMobile) || (isMobile && isMobileMenuOpen) && <span className="nav-label">{item.label}</span>}
                </div>
                <div
                  className={`nav-children ${isCollapsed && !isMobile ? 'dropdown' : ''}`}
                  style={isCollapsed && !isMobile && activeDropdown === index && dropdownTop ? { top: dropdownTop } : {}}
                >
                  {isCollapsed && !isMobile && (
                    <div className="dropdown-header">{item.label}</div>
                  )}
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
              </div>
            ) : (
              <NavLink
                key={item.path}
                to={item.path!}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                title={isCollapsed && !isMobile ? item.label : ''}
                end
                onClick={handleNavClick}
              >
                <span className="nav-icon">{item.icon}</span>
                {(!isCollapsed && !isMobile) || (isMobile && isMobileMenuOpen) && <span className="nav-label">{item.label}</span>}
              </NavLink>
            )
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.full_name?.charAt(0)}</div>
            {(!isCollapsed && !isMobile) || (isMobile && isMobileMenuOpen) && (
              <div className="user-details">
                <div className="user-name">{user?.full_name}</div>
                <div className="user-role tiny">{user?.role}</div>
              </div>
            )}
          </div>
          {(!isCollapsed && !isMobile) || (isMobile && isMobileMenuOpen) && (
            <button className="logout-btn" onClick={logout} title="Logout">
              🚪
            </button>
          )}
        </div>
      </div>
    </>
  );
}
