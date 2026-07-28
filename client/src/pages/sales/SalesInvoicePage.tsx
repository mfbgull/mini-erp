/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * SalesInvoicePage — refactored entry point for the sales invoice form.
 *
 * Architecture:
 *   - Data fetching: useInvoiceData (hooks/useInvoiceData.ts)
 *   - Mutations:     useInvoiceMutations (hooks/useInvoiceMutations.ts)
 *   - Business logic: utils/invoiceCalculations.ts, utils/invoiceRules.ts
 *   - Presentation:   components/invoice/*.tsx
 *
 * The page orchestrates hooks and passes props to leaf components.
 * No inline data fetching, no inline business logic, no inline styles.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import toast from 'react-hot-toast';

import { useSettings } from '../../context/SettingsContext';
import { useFormValidation } from '../../hooks/useFormValidation';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import { useTranslation } from '../../hooks/useTranslation';
import { useInvoiceData } from '../../hooks/useInvoiceData';
import { useSaveInvoice, useRecordPayment } from '../../hooks/useInvoiceMutations';
import { invoiceSchema } from '../../schemas';
import api from '../../utils/api';
import type {
  InvoiceFormState,
  InvoiceFormItem,
  PriceHintState,
  ExistingPayment,
  PaymentMethodEntry,
  InvoiceSubmitData,
  InvoiceSubmitItem,
} from '../../types';
import {
  calculateItemTotal,
  calculateSubtotal,
  calculateTax,
  calculateDiscount,
  calculateTotal,
  getNextField,
  isLastField,

  padItemsToMinimum,
  generateInvoiceNo,
  createDefaultInvoice,
} from '../../utils/invoiceCalculations';
import { applyLineFieldUpdate } from '../../utils/invoiceLineCalc';
import {
  filterFilledItems,
  isValidPaymentAmount,
  doesPaymentExceedBalance,
  preparePaymentData,
  validateInvoiceSubmission,
} from '../../utils/invoiceRules';

import InvoiceFormHeader from '../../components/invoice/InvoiceFormHeader';
import InvoiceItemsTable from '../../components/invoice/InvoiceItemsTable';
import InvoicePaymentPanel from '../../components/invoice/InvoicePaymentPanel';

import '../sales/SalesInvoicePage.css';

/* ── Page Component ─────────────────────────────────────────────── */

export default function SalesInvoicePage() {
  const { id: invoiceId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { formatCurrency, getCurrencySymbol } = useSettings();
  const { t } = useTranslation();

  // ── Data ──
  const { customers, customersLoading, customersError, items, settings } = useInvoiceData();

  // ── State ──
  const [invoice, setInvoice] = useState<InvoiceFormState>(createDefaultInvoice);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [existingPayments, setExistingPayments] = useState<ExistingPayment[]>([]);
  const [deletedPayments, setDeletedPayments] = useState<number[]>([]);
  const [showNewPaymentForm, setShowNewPaymentForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<ExistingPayment | null>(null);
  const [priceHint, setPriceHint] = useState<PriceHintState | null>(null);
  const [newItemId, setNewItemId] = useState<number | null>(null);
  const pendingFocusRef = useRef<number | null>(null);

  const { errors, validate } = useFormValidation(invoiceSchema);

  // ── Mutations ──
  const mutation = useSaveInvoice(invoiceId, invoice.customer_id);
  const paymentMutation = useRecordPayment(invoiceId);

  // ── Update company info when settings are loaded ──
  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setInvoice((prev) => ({
        ...prev,
        company: {
          name: (settings as any).company_name?.value || 'Mini ERP',
          email: (settings as any).company_email?.value || 'support@minierp.com',
          phone: (settings as any).company_phone?.value || '+1 123 456 7890',
          address: (settings as any).company_address?.value || '456 Enterprise Ave, BC 12345',
          taxId: (settings as any).company_tax_id?.value || 'TAX-123456789',
        },
      }));
    }
  }, [settings]);

  // ── Auto-update payment amount when invoice total changes ──
  useEffect(() => {
    if (invoice.payment.record_payment && !invoiceId) {
      const total = calculateTotal(invoice.items, invoice.discountScope, invoice.discount);
      setInvoice((prev) => ({
        ...prev,
        payment: { ...prev.payment, payment_amount: total },
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice.items, invoice.discount, invoice.discountScope]);

  // ── Set initial payment amount for new invoices ──
  useEffect(() => {
    if (!invoiceId && invoice.payment.record_payment) {
      const total = calculateTotal(invoice.items, invoice.discountScope, invoice.discount);
      if (total > 0 && invoice.payment.payment_amount === 0) {
        setInvoice((prev) => ({
          ...prev,
          payment: { ...prev.payment, payment_amount: total },
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── If editing existing invoice, fetch it ──
  useEffect(() => {
    if (invoiceId) {
      const fetchInvoice = async () => {
        try {
          const response = await api.get(`/invoices/${invoiceId}`);
          const invoiceData = response.data;

          const formattedItems: InvoiceFormItem[] = (invoiceData.items || []).map(
            (item: any, index: number) => ({
              id: index + 1,
              item_id: item.item_id,
              description: item.item_name || item.description,
              quantity: item.quantity,
              rate: item.unit_price,
              tax: item.tax_rate || 0,
              discount: {
                type: item.discount_type || 'flat',
                value: item.discount_value || 0,
              },
            }),
          );

          let customerBalance = { currentBalance: 0 };
          let customerInfo: any = {};

          try {
            const balanceResponse = await api.get(`/customers/${invoiceData.customer_id}/balance`);
            customerBalance = balanceResponse.data.data;
            const customerResponse = await api.get(`/customers/${invoiceData.customer_id}`);
            customerInfo = customerResponse.data.data;
          } catch (error) {
            console.error('Error fetching customer info:', error);
          }

          try {
            const paymentsResponse = await api.get(`/invoices/${invoiceId}/payments`);
            setExistingPayments(paymentsResponse.data.data || []);
          } catch (error) {
            console.error('Error fetching invoice payments:', error);
            setExistingPayments([]);
          }

          setInvoice({
            ...invoiceData,
            items: padItemsToMinimum(formattedItems),
            customer_id: invoiceData.customer_id,
            customer_name: invoiceData.customer_name,
            customer_email: invoiceData.customer_email,
            customer_phone: invoiceData.customer_phone,
            customer_address: invoiceData.customer_address,
            customer_current_balance: customerBalance.currentBalance || 0,
            customer_credit_limit: customerInfo.credit_limit || 0,
            customer_credit_utilization:
              customerInfo.credit_limit && customerInfo.credit_limit > 0
                ? (customerBalance.currentBalance / customerInfo.credit_limit) * 100
                : 0,
            discountScope: invoiceData.discount_scope || 'item',
            discount: {
              type: invoiceData.discount_type || 'flat',
              value: invoiceData.discount_value || 0,
            },
            notes:
              invoiceData.notes ||
              'Thank you for your business. Payment is due within 14 days.',
            terms:
              invoiceData.terms ||
              'Net 14 days. Late payments subject to 1.5% monthly interest.',
            company: invoice.company,
            payment: {
              record_payment: false,
              payment_date: new Date().toISOString().split('T')[0],
              payment_amount: invoiceData.balance_amount || 0,
              payment_method: 'Cash',
              reference_no: '',
              payment_notes: '',
            },
            paymentMethods: [
              { id: Date.now(), method: 'Cash', amount: 0, reference_no: '' },
            ],
          } as InvoiceFormState);
        } catch (error) {
          toast.error('Failed to load invoice');
          navigate('/sales');
        }
      };

      fetchInvoice();
    } else {
      setInvoice((prev) => ({
        ...prev,
        invoice_no: generateInvoiceNo(),
        paymentMethods: prev.paymentMethods,
      }));

      // Auto-focus first cell for new invoice
      setTimeout(() => {
        const firstCell = document.querySelector('[data-cell-id$="-description"]');
        if (firstCell) (firstCell as HTMLElement).focus();
      }, 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId, navigate]);

  // ── Auto-focus newly added row ──
  useEffect(() => {
    if (newItemId) {
      const timer = setTimeout(() => {
        const newCell = document.querySelector(`[data-cell-id="${newItemId}-description"]`);
        if (newCell) {
          setEditingCell(`${newItemId}-description`);
          (newCell as HTMLElement).focus();
          setTimeout(() => {
            const input = newCell.querySelector('input');
            if (input) {
              input.focus();
              input.select();
            }
          }, 50);
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [newItemId]);

  // ── Prevent focus loss when items array changes ──
  useEffect(() => {
    if (pendingFocusRef.current) {
      const itemId = pendingFocusRef.current;
      pendingFocusRef.current = null;

      const timer = setTimeout(() => {
        const cell = document.querySelector(`[data-cell-id="${itemId}-description"]`);
        if (cell) {
          setEditingCell(`${itemId}-description`);
          (cell as HTMLElement).focus();
          setTimeout(() => {
            const input = cell.querySelector('input');
            if (input) {
              input.focus();
              input.select();
            }
          }, 50);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice.items]);

  // ── Global keyboard handler for Shift+Enter ──
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.shiftKey) {
        const activeTag = (document.activeElement as HTMLElement)?.tagName;
        if (activeTag !== 'INPUT' && activeTag !== 'TEXTAREA') {
          e.preventDefault();
          (document.querySelector('.payment-method-amount') as HTMLElement)?.focus();
        }
      }
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // ── Watch for rate cell being edited and fetch price history ──
  // This effect is kept in the page because it needs direct DOM access for the dropdown positioning
  useEffect(() => {
    if (editingCell && editingCell.endsWith('-rate')) {
      const rowIdStr = editingCell.replace('-rate', '');
      const rowId = parseInt(rowIdStr) || rowIdStr;

      const currentItem = invoice.items.find(
        (item) =>
          item.id === rowId ||
          item.id === parseInt(String(rowId)) ||
          String(item.id) === String(rowId),
      );

      if (currentItem?.item_id && invoice.customer_id) {
        fetchPriceHistory(currentItem.item_id, invoice.customer_id, currentItem.id, currentItem.rate);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingCell]);

  // ── Price History Fetch ──
  const fetchPriceHistory = async (
    productId: number | string,
    customerId: number | string,
    rowId: number,
    currentPrice: number,
  ) => {
    if (!productId || !customerId) return;

    try {
      const response = await api.get(
        `/sales/item-customer-history?item_id=${productId}&customer_id=${customerId}`,
      );

      let history = response.data.data;
      if (history && history.data && !history.lowest_price) {
        history = history.data;
      }

      if (history && history.transaction_count > 0) {
        setPriceHint({ itemId: productId, rowId, currentPrice, history });
      }
    } catch (error) {
      console.error('Error fetching price history:', error);
    }
  };

  // ── Callbacks ──

  const handleBack = useCallback(() => navigate('/sales'), [navigate]);

  const handleUpdateInvoice = useCallback((updates: Partial<InvoiceFormState>) => {
    setInvoice((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleCustomerSelect = useCallback(
    async (customer: {
      id: number;
      customer_name: string;
      email?: string;
      phone?: string;
      billing_address?: string;
      credit_limit?: number;
    }) => {
      try {
        const response = await api.get(`/customers/${customer.id}/balance`);
        const customerBalance = response.data.data;
        setInvoice((prev) => ({
          ...prev,
          customer_id: customer.id,
          customer_name: customer.customer_name,
          customer_email: customer.email || '',
          customer_phone: customer.phone || '',
          customer_address: customer.billing_address || '',
          customer_current_balance: customerBalance.currentBalance,
          customer_credit_limit: customer.credit_limit || 0,
          customer_credit_utilization:
            customer.credit_limit && customer.credit_limit > 0
              ? (customerBalance.currentBalance / customer.credit_limit) * 100
              : 0,
        }));

        // Auto-focus first item cell
        setTimeout(() => {
          const firstItem = invoice.items[0];
          if (firstItem) {
            setEditingCell(`${firstItem.id}-description`);
            setTimeout(() => {
              const el = document.querySelector(`[data-cell-id="${firstItem.id}-description"]`);
              if (el) (el as HTMLElement).focus();
              const input = el?.querySelector('input');
              if (input) {
                input.focus();
                input.select();
              }
            }, 100);
          }
        }, 100);
      } catch (error) {
        setInvoice((prev) => ({
          ...prev,
          customer_id: customer.id,
          customer_name: customer.customer_name,
          customer_email: customer.email || '',
          customer_phone: customer.phone || '',
          customer_address: customer.billing_address || '',
        }));

        setTimeout(() => {
          const firstItem = invoice.items[0];
          if (firstItem) {
            setEditingCell(`${firstItem.id}-description`);
            setTimeout(() => {
              const el = document.querySelector(`[data-cell-id="${firstItem.id}-description"]`);
              if (el) (el as HTMLElement).focus();
              const input = el?.querySelector('input');
              if (input) {
                input.focus();
                input.select();
              }
            }, 100);
          }
        }, 100);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const handleUpdateItem = useCallback(
    (id: number, field: string, value: unknown) => {
      setInvoice((prev) => ({
        ...prev,
        items: prev.items.map((item) => {
          if (item.id !== id) return item;
          if (field === 'patch') {
            // Multi-field atomic update (used by the items table for loose-item recalculation)
            return { ...item, ...(value as Partial<typeof item>) };
          } else if (field === 'itemId') {
            const selectedItem = items.find((i) => i.id === Number(value));
            return {
              ...item,
              item_id: Number(value),
              description: selectedItem?.item_name || item.description,
              rate: selectedItem?.standard_selling_price || item.rate,
              sale_type: selectedItem?.sale_type || 'packed',
              qty_decimal_precision: selectedItem?.qty_decimal_precision || 0,
              rounding_step: selectedItem?.rounding_step ?? null,
              amount: 0,
              lastEditedField: null,
            };
          } else if (field === 'discountType') {
            return { ...item, discount: { ...item.discount, type: value as 'flat' | 'percentage' } };
          } else if (field === 'discountValue') {
            return { ...item, discount: { ...item.discount, value: Number(value) || 0 } };
          } else if (field === 'description') {
            return { ...item, description: String(value) };
          } else if (field === 'quantity' || field === 'rate' || field === 'amount') {
            // Shared calc keeps packed/loose lines consistent and preserves the driver field
            return { ...item, ...applyLineFieldUpdate(item, field, Number(value) || 0) };
          } else {
            return { ...item, [field]: Number(value) || 0 };
          }
        }),
      }));
    },
    [items],
  );

  const handleRemoveItem = useCallback((id: number) => {
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  }, []);

  const handleAddNewItem = useCallback(() => {
    const newId = Date.now();
    const newItem: InvoiceFormItem = {
      id: newId,
      item_id: '',
      description: '',
      quantity: 1,
      rate: 0,
      tax: 0,
      discount: { type: 'flat', value: 0 },
    };
    setInvoice((prev) => ({ ...prev, items: [...prev.items, newItem] }));
    return newId;
  }, []);

  const handleSetPendingFocus = useCallback((itemId: number) => {
    pendingFocusRef.current = itemId;
  }, []);

  const handleSetEditingCell = useCallback(
    (cellId: string | null, options?: { focusNextField?: string; focusRowId?: number }) => {
      setEditingCell(cellId);
      if (options?.focusNextField && options?.focusRowId) {
        setTimeout(() => {
          const el = document.querySelector(
            `[data-cell-id="${options.focusRowId}-${options.focusNextField}"]`,
          ) as HTMLElement;
          if (el) el.focus();
        }, 100);
      }
    },
    [],
  );

  // ── Payment handlers ──

  const handleAddPaymentMethod = useCallback(() => {
    setInvoice((prev) => ({
      ...prev,
      paymentMethods: [
        ...prev.paymentMethods,
        { id: Date.now(), method: 'Cash', amount: 0, reference_no: '' },
      ],
    }));
  }, []);

  const handleRemovePaymentMethod = useCallback((id: number) => {
    setInvoice((prev) => ({
      ...prev,
      paymentMethods: prev.paymentMethods.filter((m) => m.id !== id),
    }));
  }, []);

  const handleUpdatePaymentMethod = useCallback(
    (id: number, field: string, value: string) => {
      setInvoice((prev) => ({
        ...prev,
        paymentMethods: prev.paymentMethods.map((m) =>
          m.id === id ? { ...m, [field]: value } : m,
        ),
      }));
    },
    [],
  );

  const handleRecordPayment = useCallback(() => {
    const totalPaymentAmount = invoice.paymentMethods.reduce(
      (sum, method) => sum + parseFloat(String(method.amount || 0)),
      0,
    );

    if (!isValidPaymentAmount(totalPaymentAmount)) {
      toast.error('Total payment amount must be greater than 0');
      return;
    }

    const remainingBalance = invoiceId
      ? invoice.balance_amount
      : calculateTotal(invoice.items, invoice.discountScope, invoice.discount);

    if (doesPaymentExceedBalance(totalPaymentAmount, remainingBalance || 0)) {
      toast.error(
        `Payment total (${formatCurrency(totalPaymentAmount)}) exceeds invoice balance (${formatCurrency(remainingBalance || 0)})`,
      );
      return;
    }

    const paymentPromises = preparePaymentData(
      invoice.paymentMethods as PaymentMethodEntry[],
      invoice.customer_id,
      invoice.payment.payment_date,
      invoice.invoice_no,
      invoiceId,
      invoice.payment.payment_notes,
    );

    if (paymentPromises.length === 1) {
      paymentMutation.mutate(paymentPromises[0] as any);
    } else if (paymentPromises.length > 1) {
      let index = 0;
      const processNextPayment = () => {
        if (index < paymentPromises.length) {
          paymentMutation.mutate(paymentPromises[index++] as any, {
            onSuccess: () => {
              processNextPayment();
            },
            onError: (error: any) => {
              toast.error(
                error.response?.data?.error || `Failed to record payment: ${error.message}`,
              );
            },
          });
        }
      };
      processNextPayment();
    } else {
      toast.error('At least one payment method with an amount is required');
    }
  }, [
    invoice.paymentMethods,
    invoice.customer_id,
    invoice.payment.payment_date,
    invoice.payment.payment_notes,
    invoice.invoice_no,
    invoice.balance_amount,
    invoice.items,
    invoice.discountScope,
    invoice.discount,
    invoiceId,
    paymentMutation,
    formatCurrency,
  ]);

  const handleEditPayment = useCallback((payment: ExistingPayment) => {
    setEditingPayment(payment);
    setInvoice((prev) => ({
      ...prev,
      payment: {
        ...prev.payment,
        payment_date: payment.payment_date.split('T')[0] || payment.payment_date,
      },
      paymentMethods: [
        {
          id: Date.now(),
          method: payment.payment_method,
          amount: payment.amount,
          reference_no: payment.reference_no || '',
        },
      ],
    }));
    document.querySelector('.payment-fields')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleDeletePayment = useCallback((paymentId: number) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      setDeletedPayments((prev) => [...prev, paymentId]);
      setExistingPayments((prev) => prev.filter((p) => p.id !== paymentId));
      toast.success('Payment marked for deletion. Click Update Invoice to save changes.');
    }
  }, []);

  // ── Submit ──

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const invoiceNo =
        invoice.invoice_no ||
        `INV-${new Date().getFullYear()}-${String(Date.now() % 1000000).padStart(6, '0')}`;

      const filledItems = filterFilledItems(invoice.items);
      const requiredFieldsError = validateInvoiceSubmission(invoice.customer_id, filledItems.length);
      if (requiredFieldsError) {
        toast.error(requiredFieldsError);
        return;
      }

      const validationData = {
        customer_id: invoice.customer_id,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        notes: invoice.notes,
        terms: invoice.terms,
        discount_type: invoice.discount.type,
        discount_value: invoice.discount.value,
        items: filledItems.map((item) => ({
          item_id: item.item_id,
          quantity: item.quantity,
          rate: item.rate,
          description: item.description,
          tax: item.tax,
          discount_type: item.discount.type,
          discount_value: item.discount.value,
        })),
      };

      if (!validate(validationData)) return;

      const submitData: InvoiceSubmitData = {
        ...(invoiceId && { status: invoice.status }),
        invoice_no: invoiceNo,
        customer_id: invoice.customer_id,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        total_amount: calculateTotal(invoice.items, invoice.discountScope, invoice.discount),
        discount_scope: invoice.discountScope,
        discount_type: invoice.discount.type,
        discount_value: invoice.discount.value,
        notes: invoice.notes,
        terms: invoice.terms,
        items: filledItems.map(
          (item: InvoiceFormItem): InvoiceSubmitItem => ({
            item_id: item.item_id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.rate,
            tax_rate: item.tax,
            discount_type: item.discount.type,
            discount_value: item.discount.value,
          }),
        ),
        ...(invoice.payment.record_payment && {
          record_payment: true,
          payment: {
            payment_date: invoice.payment.payment_date,
            amount: invoice.paymentMethods.reduce(
              (sum, method) => sum + (parseFloat(String(method.amount)) || 0),
              0,
            ),
            payment_method: invoice.paymentMethods[0]?.method || 'Cash',
            reference_no: invoice.paymentMethods[0]?.reference_no || '',
            notes: invoice.payment.payment_notes,
          },
        }),
        ...(invoiceId && deletedPayments.length > 0 && {
          deleted_payments: deletedPayments,
        }),
      };

      mutation.mutate(submitData as any);
    },
    [invoice, invoiceId, deletedPayments, mutation, validate],
  );

  // ── Keyboard shortcuts ──

  useKeyboardShortcut(
    'Alt+I',
    () => {
      const newId = handleAddNewItem();
      setNewItemId(newId);
    },
    { context: 'sales', id: 'sales-invoice-add-item', label: 'Add line item' },
  );

  useKeyboardShortcut(
    'Alt+C',
    () => {
      const customerInput = document.querySelector('[name="customer_name"] input') as HTMLElement;
      if (customerInput) {
        customerInput.focus();
        if ('select' in customerInput) (customerInput as HTMLInputElement).select();
      }
    },
    { context: 'sales', id: 'sales-invoice-focus-customer', label: 'Focus customer field' },
  );

  useKeyboardShortcut(
    'Ctrl+S',
    () => handleSubmit(new Event('submit') as unknown as React.FormEvent),
    { context: 'sales', id: 'sales-invoice-save', label: 'Save invoice' },
  );

  // ── Render ──

  return (
    <div className="sales-invoice-page-modern">
      <div className="invoice-document-modern">
        {/* Header */}
        <InvoiceFormHeader
          invoice={invoice}
          customers={customers}
          customersLoading={customersLoading}
          customersError={customersError}
          errors={errors}
          mutationPending={mutation.isPending}
          invoiceId={invoiceId}
          onCustomerSelect={handleCustomerSelect}
          onUpdateInvoice={handleUpdateInvoice}
          onSubmit={handleSubmit}
          onBack={handleBack}
          formatCurrency={formatCurrency}
          t={t}
        />

        {/* Two-Column Layout: Items + Payment */}
        <div className="invoice-main-split">
          <div className="invoice-left-column">
            <InvoiceItemsTable
              invoice={invoice}
              items={items}
              editingCell={editingCell}
              errors={errors}
              priceHint={priceHint}
              onSetEditingCell={handleSetEditingCell}
              onUpdateItem={handleUpdateItem}
              onRemoveItem={handleRemoveItem}
              onAddNewItem={handleAddNewItem}
              onSetPendingFocus={handleSetPendingFocus}
              onSetPriceHint={setPriceHint}
              onUpdateInvoice={handleUpdateInvoice}
              onSetNewItemId={setNewItemId}
              formatCurrency={formatCurrency}
              getCurrencySymbol={getCurrencySymbol}
              calculateItemTotal={(item) => calculateItemTotal(item, invoice.discountScope)}
              calculateSubtotal={() => calculateSubtotal(invoice.items)}
              calculateTax={() => calculateTax(invoice.items, invoice.discountScope)}
              calculateDiscount={() =>
                calculateDiscount(invoice.items, invoice.discountScope, invoice.discount)
              }
              calculateTotal={() =>
                calculateTotal(invoice.items, invoice.discountScope, invoice.discount)
              }
              getNextField={(field) => getNextField(field, invoice.discountScope)}
              isLastField={isLastField}
            />
          </div>

          <div className="invoice-right-column">
            <InvoicePaymentPanel
              invoice={invoice}
              invoiceId={invoiceId}
              existingPayments={existingPayments}
              deletedPayments={deletedPayments}
              showNewPaymentForm={showNewPaymentForm}
              paymentMutationPending={paymentMutation.isPending}
              editingPayment={editingPayment}
              onUpdateInvoice={handleUpdateInvoice}
              onAddPaymentMethod={handleAddPaymentMethod}
              onRemovePaymentMethod={handleRemovePaymentMethod}
              onUpdatePaymentMethod={handleUpdatePaymentMethod}
              onRecordPayment={handleRecordPayment}
              onSetShowNewPaymentForm={setShowNewPaymentForm}
              onEditPayment={handleEditPayment}
              onDeletePayment={handleDeletePayment}
              formatCurrency={formatCurrency}
              getCurrencySymbol={getCurrencySymbol}
              calculateTotal={() =>
                calculateTotal(invoice.items, invoice.discountScope, invoice.discount)
              }
              t={t}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
