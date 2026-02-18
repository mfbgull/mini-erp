import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { ThemeProvider } from './context/ThemeContext';
import { InvoiceProvider } from './context/InvoiceContext';
import SearchModal from './components/common/SearchModal';
import PageLoader from './components/common/PageLoader';

// Eager loaded - Critical path components
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sidebar from './components/layout/Sidebar';
import FloatingActionButton from './components/layout/FloatingActionButton';

// Lazy loaded - Inventory module
const ItemsPage = lazy(() => import('./pages/inventory/ItemsPage'));
const WarehousesPage = lazy(() => import('./pages/inventory/WarehousesPage'));
const StockMovementPage = lazy(() => import('./pages/inventory/StockMovementPage'));
const StockByWarehousePage = lazy(() => import('./pages/inventory/StockByWarehousePage'));

// Lazy loaded - Purchase module
const PurchasesPage = lazy(() => import('./pages/purchases/PurchasesPage'));
const PurchaseOrdersPage = lazy(() => import('./pages/purchase-orders/PurchaseOrdersPage'));
const PurchaseOrderFormPage = lazy(() => import('./pages/purchase-orders/PurchaseOrderFormPage'));
const PurchaseOrderDetailPage = lazy(() => import('./pages/purchase-orders/PurchaseOrderDetailPage'));

// Lazy loaded - Suppliers module
const SuppliersPage = lazy(() => import('./pages/suppliers/SuppliersPage'));
const SupplierFormPage = lazy(() => import('./pages/suppliers/SupplierFormPage'));
const SupplierDetailPage = lazy(() => import('./pages/suppliers/SupplierDetailPage'));

// Lazy loaded - BOM & Production
const BOMPage = lazy(() => import('./pages/bom/BOMPage'));
const ProductionPage = lazy(() => import('./pages/production/ProductionPage'));

// Lazy loaded - Sales module
const SalesPage = lazy(() => import('./pages/sales/SalesPage'));
const SalesInvoicePage = lazy(() => import('./pages/sales/SalesInvoicePage'));
const InvoiceViewPage = lazy(() => import('./pages/sales/InvoiceViewPage'));
const InvoiceRouter = lazy(() => import('./components/invoice/InvoiceRouter'));
const MobileInvoiceWizard = lazy(() => import('./pages/invoice/MobileInvoiceWizard'));

// Lazy loaded - Customers module
const CustomersPage = lazy(() => import('./pages/customers/CustomersPage'));
const CustomerDetailPage = lazy(() => import('./pages/customers/CustomerDetailPage'));
const CustomerStatement = lazy(() => import('./pages/customers/CustomerStatement'));

// Lazy loaded - POS
const POSPage = lazy(() => import('./pages/pos/POSPage'));

// Lazy loaded - Reports module (heavy)
const ReportsDashboard = lazy(() => import('./pages/reports/ReportsDashboard'));
const ARReportsPage = lazy(() => import('./pages/reports/ARReportsPage'));
const SalesSummaryReport = lazy(() => import('./pages/reports/SalesSummaryReport'));
const SalesByCustomerReport = lazy(() => import('./pages/reports/SalesByCustomerReport'));
const SalesByItemReport = lazy(() => import('./pages/reports/SalesByItemReport'));
const StockLevelReport = lazy(() => import('./pages/reports/StockLevelReport'));
const StockValuationReport = lazy(() => import('./pages/reports/StockValuationReport'));
const InventoryMovementReport = lazy(() => import('./pages/reports/InventoryMovementReport'));
const LowStockReport = lazy(() => import('./pages/reports/LowStockReport'));
const ProfitLossReport = lazy(() => import('./pages/reports/ProfitLossReport'));
const CashFlowReport = lazy(() => import('./pages/reports/CashFlowReport'));
const CustomerStatementsReport = lazy(() => import('./pages/reports/CustomerStatementsReport'));
const TopDebtorsReport = lazy(() => import('./pages/reports/TopDebtorsReport'));
const DSOReport = lazy(() => import('./pages/reports/DSOReport'));
const PurchaseSummaryReport = lazy(() => import('./pages/reports/PurchaseSummaryReport'));
const SupplierAnalysisReport = lazy(() => import('./pages/reports/SupplierAnalysisReport'));
const ProductionSummaryReport = lazy(() => import('./pages/reports/ProductionSummaryReport'));
const BOMUsageReport = lazy(() => import('./pages/reports/BOMUsageReport'));
const ExpensesReport = lazy(() => import('./pages/reports/ExpensesReport'));

// Lazy loaded - Other pages
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const IntegrationsPage = lazy(() => import('./pages/IntegrationsPage'));
const ExpensesPage = lazy(() => import('./pages/expenses/ExpensesPage'));
const ActivityLog = lazy(() => import('./pages/ActivityLog'));

import './assets/styles/variables.css';
import './assets/styles/global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleSidebarToggle = (event: Event) => {
      const customEvent = event as CustomEvent<{ collapsed: boolean }>;
      setSidebarCollapsed(customEvent.detail.collapsed);
    };

    window.addEventListener('sidebarToggle', handleSidebarToggle);
    return () => window.removeEventListener('sidebarToggle', handleSidebarToggle);
  }, []);

  return (
    <SettingsProvider>
      <div className="app-container">
        <Sidebar />
        <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <div className="content">
            <Suspense fallback={<PageLoader />}>
              <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/inventory/items" element={<ItemsPage />} />
              <Route path="/inventory/warehouses" element={<WarehousesPage />} />
              <Route path="/inventory/stock-movements" element={<StockMovementPage />} />
              <Route path="/inventory/stock-by-warehouse" element={<StockByWarehousePage />} />
              <Route path="/purchases" element={<PurchasesPage />} />
              <Route path="/suppliers" element={<SuppliersPage />} />
              <Route path="/suppliers/create" element={<SupplierFormPage mode="create" />} />
              <Route path="/suppliers/:id" element={<SupplierDetailPage />} />
              <Route path="/suppliers/:id/edit" element={<SupplierFormPage mode="edit" />} />
              <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
              <Route path="/purchase-orders/create" element={<PurchaseOrderFormPage mode="create" />} />
              <Route path="/purchase-orders/:id" element={<PurchaseOrderDetailPage />} />
              <Route path="/purchase-orders/:id/edit" element={<PurchaseOrderFormPage mode="edit" />} />
              <Route path="/bom" element={<BOMPage />} />
              <Route path="/production" element={<ProductionPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/customers/:id" element={<CustomerDetailPage />} />
              <Route path="/customers/:id/statement" element={<CustomerStatement />} />
              <Route path="/reports" element={<ReportsDashboard />} />
              <Route path="/reports/accounts-receivable" element={<ARReportsPage />} />
              <Route path="/reports/sales-summary" element={<SalesSummaryReport />} />
              <Route path="/reports/sales-by-customer" element={<SalesByCustomerReport />} />
              <Route path="/reports/sales-by-item" element={<SalesByItemReport />} />
              <Route path="/reports/stock-level" element={<StockLevelReport />} />
              <Route path="/reports/stock-valuation" element={<StockValuationReport />} />
              <Route path="/reports/inventory-movement" element={<InventoryMovementReport />} />
              <Route path="/reports/profit-loss" element={<ProfitLossReport />} />
              <Route path="/reports/cash-flow" element={<CashFlowReport />} />
              <Route path="/reports/low-stock" element={<LowStockReport />} />
              <Route path="/reports/customer-statements" element={<CustomerStatementsReport />} />
              <Route path="/reports/top-debtors" element={<TopDebtorsReport />} />
              <Route path="/reports/dso" element={<DSOReport />} />
              <Route path="/reports/purchase-summary" element={<PurchaseSummaryReport />} />
              <Route path="/reports/supplier-analysis" element={<SupplierAnalysisReport />} />
              <Route path="/reports/production-summary" element={<ProductionSummaryReport />} />
              <Route path="/reports/bom-usage" element={<BOMUsageReport />} />
              <Route path="/reports/expenses" element={<ExpensesReport />} />
              <Route path="/expenses" element={<ExpensesPage />} />
<Route path="/sales" element={<SalesPage />} />
              <Route path="/sales/invoice" element={<SalesInvoicePage />} />
              <Route path="/sales/invoice/:id" element={<InvoiceRouter />} />
              <Route path="/sales/invoice/:id/view" element={<InvoiceViewPage />} />
              <Route path="/sales/invoice/:id/edit" element={<InvoiceRouter defaultMode="edit" />} />
              <Route path="/invoices/create" element={<MobileInvoiceWizard />} />
              <Route path="/pos" element={<POSPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/integrations" element={<IntegrationsPage />} />
              <Route path="/activity-log" element={<ActivityLog />} />
              <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Suspense>
            <FloatingActionButton />
          </div>
        </div>
        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      </div>
    </SettingsProvider>
  );
}

function AppRoutesOuter() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" /> : <Login />}
      />

      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
<AuthProvider>
          <ThemeProvider>
            <InvoiceProvider>
              <AppRoutesOuter />
            </InvoiceProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#363636',
                  color: '#fff'
                },
                success: {
                  iconTheme: {
                    primary: 'var(--success)',
                    secondary: '#fff'
                  }
                },
                error: {
                  iconTheme: {
                    primary: 'var(--error)',
                    secondary: '#fff'
                  }
                }
              }}
            />
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
