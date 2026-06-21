/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * CustomerDetailPage — refactored entry point for the customer detail view.
 *
 * Architecture:
 *   - Data fetching: useCustomerData (hooks/useCustomerData.ts)
 *   - Mutations:     useCustomerMutations (hooks/useCustomerMutations.ts)
 *   - Business rules: utils/customerCalculations.ts, utils/invoiceRules.ts
 *   - Presentation:   components/customer/*.tsx
 *
 * The page orchestrates hooks and passes props to leaf components.
 * No inline data fetching, no inline business logic, no inline styles.
 *
 * NOTE: CompactInvoiceCardView defines its own local Invoice type
 * (without customer_id), so cross-component casts to any/unknown are
 * needed to work around contravariance without modifying the external
 * component. These are the only 'any' usages in this file.
 */

import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { useQueryClient } from '@tanstack/react-query';
import { FileText, Receipt, CreditCard, Package } from 'lucide-react';

import CompactInvoiceCardView from '../../components/common/CompactInvoiceCard';
import CompactLedgerCardView from '../../components/common/CompactLedgerCard';
import CompactPaymentCardView from '../../components/common/CompactPaymentCard';
import CustomerHeader from '../../components/customer/CustomerHeader';
import CustomerModals from '../../components/customer/CustomerModals';
import OverviewTab from '../../components/customer/OverviewTab';
import { useSettings } from '../../context/SettingsContext';
import {
  useCustomerData,
  invalidateCustomerQueries,
} from '../../hooks/useCustomerData';
import {
  useDeleteInvoice,
  useCancelInvoice,
  useDeletePayment,
} from '../../hooks/useCustomerMutations';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import {
  computeCustomerMetrics,
} from '../../utils/customerCalculations';
import type { TabId, TabConfig, Invoice, Payment } from '../../types';
import { canDeleteInvoice } from '../../utils/invoiceRules';


// Lazily import non-critical components


import './CustomerDetailPage.css';
import '../../styles/ag-grid-status-cells.css';

/* ── Tab Configuration ──────────────────────────────────────────── */

const TABS: TabConfig[] = [
  { id: 'overview', label: 'Overview', icon: FileText },
  { id: 'invoices', label: 'Invoices', icon: Receipt },
  { id: 'ledger', label: 'Ledger', icon: Package },
  { id: 'payments', label: 'Payments', icon: CreditCard },
];

const InvoicesTab = lazy(() => import('../../components/customer/InvoicesTab'));
const LedgerTab = lazy(() => import('../../components/customer/LedgerTab'));
const PaymentsTab = lazy(() => import('../../components/customer/PaymentsTab'));

/* ── Page Component ─────────────────────────────────────────────── */

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { formatCurrency } = useSettings();
  const { isMobile } = useMobileDetection();

  // Body class effect for mobile bottom nav
  useEffect(() => {
    if (isMobile) {
      document.body.classList.add('has-bottom-nav');
    }
    return () => {
      document.body.classList.remove('has-bottom-nav');
    };
  }, [isMobile]);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  // Modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  const [paymentToEdit, setPaymentToEdit] = useState<Payment | null>(null);

  // Data fetching
  const { customer, invoices, payments, ledger, isLoading, isError, error, invoicesLoading, ledgerLoading, paymentsLoading } =
    useCustomerData(id);

  // Mutations
  const deleteInvoiceMutation = useDeleteInvoice(id);
  const cancelInvoiceMutation = useCancelInvoice(id);
  const deletePaymentMutation = useDeletePayment(id);

  // Extracted returned invoice numbers for totals filtering
  const returnedInvoiceNos = useMemo(() => {
    const returned = invoices
      .filter((inv) => inv.status === 'Returned')
      .map((inv) => inv.invoice_no);
    return returned.length > 0 ? new Set(returned) : undefined;
  }, [invoices]);

  // Memoized metrics
  const metrics = computeCustomerMetrics(invoices, ledger, customer);

  // Navigation
  const handleBack = useCallback(() => navigate('/customers'), [navigate]);
  const handleViewInvoice = useCallback(
    (invoiceId: number) => navigate(`/sales/invoice/${invoiceId}?mode=view`),
    [navigate],
  );

  // Invoice actions
  const handleDeleteInvoice = useCallback(
    (invoice: Invoice) => {
      if (!canDeleteInvoice(invoice)) {
        // This guard is already in the actions dropdown, but keep as safety net
        return;
      }
      setInvoiceToDelete(invoice);
    },
    [],
  );

  const handleCancelInvoice = useCallback(
    (invoice: Invoice) => {
      if (invoice.status === 'Cancelled') return;
      if (window.confirm(`Are you sure you want to cancel invoice "${invoice.invoice_no}"? This will mark it as cancelled but keep all records.`)) {
        cancelInvoiceMutation.mutate(invoice.id);
      }
    },
    [cancelInvoiceMutation],
  );

  const confirmDeleteInvoice = useCallback(() => {
    if (invoiceToDelete) {
      deleteInvoiceMutation.mutate(invoiceToDelete.id);
      setInvoiceToDelete(null);
    }
  }, [invoiceToDelete, deleteInvoiceMutation]);

  // Payment actions
  const handleDeletePayment = useCallback((payment: Payment) => {
    setPaymentToDelete(payment);
  }, []);

  const handleEditPayment = useCallback((payment: Payment) => {
    setPaymentToEdit(payment);
  }, []);

  const confirmDeletePayment = useCallback(() => {
    if (paymentToDelete) {
      deletePaymentMutation.mutate(paymentToDelete.id);
      setPaymentToDelete(null);
    }
  }, [paymentToDelete, deletePaymentMutation]);

  // Payment modal success handler
  const handlePaymentSuccess = useCallback(() => {
    invalidateCustomerQueries(queryClient, id);
  }, [queryClient, id]);

  // Loading state
  if (isLoading) {
    return (
      <div className="customer-detail-page loading">
        <div className="spinner" />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="customer-detail-page error">
        <h2>Error loading customer</h2>
        <p>{error instanceof Error ? error.message : 'Unknown error'}</p>
        <button className="btn btn-secondary" onClick={handleBack}>
          Back to Customers
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Header + Quick Stats */}
      <CustomerHeader
        customer={customer!}
        currentBalance={metrics.currentBalance}
        creditLimit={customer?.credit_limit || 0}
        creditUtilization={metrics.creditUtilization}
        overdueInvoicesCount={metrics.overdueInvoicesCount}
        onBack={handleBack}
        onRecordPayment={() => setIsPaymentModalOpen(true)}
        formatCurrency={formatCurrency}
      />

      {/* Main Content */}
      <div className="customer-detail-page">
        {/* Navigation Tabs */}
        <div className="tabs-container">
          {TABS.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <IconComponent size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && (
            <OverviewTab
              customer={customer!}
              invoices={invoices}
              ledger={ledger}
              payments={payments}
              formatCurrency={formatCurrency}
            />
          )}

          {activeTab === 'invoices' && (
            isMobile ? (
              <div className="invoices-tab-mobile">
                <CompactInvoiceCardView
                  invoices={(invoices as any)}
                  onView={(inv) => { navigate(`/sales/invoice/${inv.id}?mode=view`); }}
                  onEdit={(inv) => { navigate(`/sales/invoice/${inv.id}?mode=edit`); }}
                  onDelete={handleDeleteInvoice as unknown as (inv: unknown) => void}
                  onCancel={handleCancelInvoice as unknown as (inv: unknown) => void}
                />
              </div>
            ) : (
              <Suspense fallback={<div className="loading"><div className="spinner" /></div>}>
                <InvoicesTab
                  invoices={invoices}
                  loading={invoicesLoading}
                  onViewInvoice={handleViewInvoice}
                  onDeleteInvoice={handleDeleteInvoice}
                  onCancelInvoice={handleCancelInvoice}
                />
              </Suspense>
            )
          )}

          {activeTab === 'ledger' && (
            isMobile ? (
              <div className="ledger-tab-mobile">
                <CompactLedgerCardView
                  ledger={ledger}
                  formatCurrency={formatCurrency}
                  returnedInvoiceNos={returnedInvoiceNos}
                  onView={(entry) => {
                    if (entry.reference_no) {
                      navigate(`/sales/invoice/${entry.reference_no}`);
                    }
                  }}
                />
              </div>
            ) : (
              <Suspense fallback={<div className="loading"><div className="spinner" /></div>}>
                <LedgerTab
                  ledger={ledger}
                  loading={ledgerLoading}
                  customerName={customer?.customer_name}
                  formatCurrency={formatCurrency}
                  invoices={invoices}
                />
              </Suspense>
            )
          )}

          {activeTab === 'payments' && (
            isMobile ? (
              <div className="payments-tab-mobile">
                <CompactPaymentCardView
                  payments={payments}
                  onEdit={handleEditPayment}
                  onDelete={handleDeletePayment}
                />
              </div>
            ) : (
              <Suspense fallback={<div className="loading"><div className="spinner" /></div>}>
                <PaymentsTab
                  payments={payments}
                  loading={paymentsLoading}
                  onEditPayment={handleEditPayment}
                  onDeletePayment={handleDeletePayment}
                />
              </Suspense>
            )
          )}
        </div>

        {/* All Modals */}
        <CustomerModals
          id={id}
          customer={customer}
          invoiceToDelete={invoiceToDelete}
          paymentToDelete={paymentToDelete}
          paymentToEdit={paymentToEdit}
          isPaymentModalOpen={isPaymentModalOpen}
          deleteInvoicePending={deleteInvoiceMutation.isPending}
          cancelInvoicePending={cancelInvoiceMutation.isPending}
          deletePaymentPending={deletePaymentMutation.isPending}
          onClosePaymentModal={() => setIsPaymentModalOpen(false)}
          onCloseInvoiceDelete={() => setInvoiceToDelete(null)}
          onClosePaymentDelete={() => setPaymentToDelete(null)}
          onClosePaymentEdit={() => setPaymentToEdit(null)}
          onPaymentSuccess={handlePaymentSuccess}
          onConfirmDeleteInvoice={confirmDeleteInvoice}
          onConfirmDeletePayment={confirmDeletePayment}
          navigate={navigate}
        />
      </div>
    </>
  );
}

/* ── Lazy-loaded mobile card imports ────────────────────────────── */

