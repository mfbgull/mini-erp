import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { ThemeProvider } from './context/ThemeContext';
import SearchModal from './components/common/SearchModal';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ItemsPage from './pages/inventory/ItemsPage';
import WarehousesPage from './pages/inventory/WarehousesPage';
import StockMovementPage from './pages/inventory/StockMovementPage';
import StockByWarehousePage from './pages/inventory/StockByWarehousePage';
import PurchasesPage from './pages/purchases/PurchasesPage';
import PurchaseOrdersPage from './pages/purchase-orders/PurchaseOrdersPage';
import PurchaseOrderFormPage from './pages/purchase-orders/PurchaseOrderFormPage';
import PurchaseOrderDetailPage from './pages/purchase-orders/PurchaseOrderDetailPage';
import SuppliersPage from './pages/suppliers/SuppliersPage';
import SupplierFormPage from './pages/suppliers/SupplierFormPage';
import SupplierDetailPage from './pages/suppliers/SupplierDetailPage';
import BOMPage from './pages/bom/BOMPage';
import ProductionPage from './pages/production/ProductionPage';
import SalesPage from './pages/sales/SalesPage';
import SalesInvoicePage from './pages/sales/SalesInvoicePage';
import InvoiceViewPage from './pages/sales/InvoiceViewPage';
import POSPage from './pages/pos/POSPage';
import CustomersPage from './pages/customers/CustomersPage';
import CustomerDetailPage from './pages/customers/CustomerDetailPage';
import CustomerStatement from './pages/customers/CustomerStatement';
import ARReportsPage from './pages/reports/ARReportsPage';
import ReportsDashboard from './pages/reports/ReportsDashboard';
import SalesSummaryReport from './pages/reports/SalesSummaryReport';
import SalesByCustomerReport from './pages/reports/SalesByCustomerReport';
import SalesByItemReport from './pages/reports/SalesByItemReport';
import StockLevelReport from './pages/reports/StockLevelReport';
import StockValuationReport from './pages/reports/StockValuationReport';
import InventoryMovementReport from './pages/reports/InventoryMovementReport';
import LowStockReport from './pages/reports/LowStockReport';
import ProfitLossReport from './pages/reports/ProfitLossReport';
import CashFlowReport from './pages/reports/CashFlowReport';
import CustomerStatementsReport from './pages/reports/CustomerStatementsReport';
import TopDebtorsReport from './pages/reports/TopDebtorsReport';
import DSOReport from './pages/reports/DSOReport';
import PurchaseSummaryReport from './pages/reports/PurchaseSummaryReport';
import SupplierAnalysisReport from './pages/reports/SupplierAnalysisReport';
import ProductionSummaryReport from './pages/reports/ProductionSummaryReport';
import BOMUsageReport from './pages/reports/BOMUsageReport';
import ExpensesReport from './pages/reports/ExpensesReport';
import SettingsPage from './pages/SettingsPage';
import IntegrationsPage from './pages/IntegrationsPage';
import ExpensesPage from './pages/expenses/ExpensesPage';
import ActivityLog from './pages/ActivityLog';
import Sidebar from './components/layout/Sidebar';
import FloatingActionButton from './components/layout/FloatingActionButton';
import MobileInvoiceWizard from './pages/invoice/MobileInvoiceWizard';
import { InvoiceProvider } from './context/InvoiceContext';

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
              <Route path="/sales/invoice/:invoiceId" element={<SalesInvoicePage />} />
              <Route path="/sales/invoice/:invoiceId/view" element={<InvoiceViewPage />} />
              <Route path="/invoices/create" element={<MobileInvoiceWizard />} />
              <Route path="/pos" element={<POSPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/integrations" element={<IntegrationsPage />} />
              <Route path="/activity-log" element={<ActivityLog />} />
<Route path="*" element={<Navigate to="/" />} />
            </Routes>
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
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
