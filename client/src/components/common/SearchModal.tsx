import { useState, useEffect, useRef } from 'react';
import { Search, X, Command } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Page {
  name: string;
  path: string;
  category: string;
}

const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const pages: Page[] = [
    { name: 'Dashboard', path: '/', category: 'General' },
    { name: 'Inventory Items', path: '/inventory/items', category: 'Inventory' },
    { name: 'Warehouses', path: '/inventory/warehouses', category: 'Inventory' },
    { name: 'Stock Movements', path: '/inventory/stock-movements', category: 'Inventory' },
    { name: 'Stock by Warehouse', path: '/inventory/stock-by-warehouse', category: 'Inventory' },
    { name: 'Purchases', path: '/purchases', category: 'Purchasing' },
    { name: 'Bill of Materials', path: '/bom', category: 'Production' },
    { name: 'Production', path: '/production', category: 'Production' },
    { name: 'Sales', path: '/sales', category: 'Sales' },
    { name: 'Point of Sale', path: '/pos', category: 'Sales' },
    { name: 'Customers', path: '/customers', category: 'Sales' },
    { name: 'Reports Dashboard', path: '/reports', category: 'Reports' },
    { name: 'Accounts Receivable', path: '/reports/accounts-receivable', category: 'Reports' },
    { name: 'Sales Summary', path: '/reports/sales-summary', category: 'Reports' },
    { name: 'Sales by Customer', path: '/reports/sales-by-customer', category: 'Reports' },
    { name: 'Sales by Item', path: '/reports/sales-by-item', category: 'Reports' },
    { name: 'Stock Level', path: '/reports/stock-level', category: 'Reports' },
    { name: 'Stock Valuation', path: '/reports/stock-valuation', category: 'Reports' },
    { name: 'Low Stock', path: '/reports/low-stock', category: 'Reports' },
    { name: 'Inventory Movement', path: '/reports/inventory-movement', category: 'Reports' },
    { name: 'Profit & Loss', path: '/reports/profit-loss', category: 'Reports' },
    { name: 'Cash Flow', path: '/reports/cash-flow', category: 'Reports' },
    { name: 'Customer Statements', path: '/reports/customer-statements', category: 'Reports' },
    { name: 'Top Debtors', path: '/reports/top-debtors', category: 'Reports' },
    { name: 'DSO Report', path: '/reports/dso', category: 'Reports' },
    { name: 'Purchase Summary', path: '/reports/purchase-summary', category: 'Reports' },
    { name: 'Supplier Analysis', path: '/reports/supplier-analysis', category: 'Reports' },
    { name: 'Production Summary', path: '/reports/production-summary', category: 'Reports' },
    { name: 'BOM Usage', path: '/reports/bom-usage', category: 'Reports' },
    { name: 'Settings', path: '/settings', category: 'General' }
  ];

  const filteredPages = pages.filter(page =>
    page.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedPages = filteredPages.reduce((acc: Record<string, Page[]>, page) => {
    if (!acc[page.category]) {
      acc[page.category] = [];
    }
    acc[page.category].push(page);
    return acc;
  }, {});

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handlePageSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="search-modal-overlay">
      <div className="search-modal">
        <div className="search-modal-header">
          <div className="search-modal-input-container">
            <Search size={20} className="search-modal-icon" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search pages (e.g. inventory, sales, reports)..."
              className="search-modal-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            <button
              onClick={onClose}
              className="search-modal-close-btn"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="search-modal-content">
          {filteredPages.length === 0 ? (
            <div className="search-modal-no-results">
              <Search size={24} className="search-modal-no-results-icon" />
              <h3>No pages found</h3>
              <p>Try searching for something else</p>
            </div>
          ) : (
            Object.entries(groupedPages).map(([category, pages]) => (
              <div key={category} className="search-modal-category">
                <h4 className="search-modal-category-title">{category}</h4>
                <ul className="search-modal-category-list">
                  {pages.map((page) => (
                    <li
                      key={page.path}
                      className="search-modal-item"
                      onClick={() => handlePageSelect(page.path)}
                    >
                      <div className="search-modal-item-content">
                        <span className="search-modal-item-name">{page.name}</span>
                        <span className="search-modal-item-path">{page.path}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>

        <div className="search-modal-footer">
          <div className="search-modal-shortcuts">
            <span className="search-modal-shortcut">
              <Command size={14} /> K to search
            </span>
            <span className="search-modal-shortcut">
              ↑↓ to navigate
            </span>
            <span className="search-modal-shortcut">
              ↵ to select
            </span>
            <span className="search-modal-shortcut">
              ESC to close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
