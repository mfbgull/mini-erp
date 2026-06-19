import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import { useSettings } from '../../context/SettingsContext';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { useQuotationFormData } from '../../hooks/useQuotationData';
import { useSaveQuotation } from '../../hooks/useQuotationMutations';
import {
  createEmptyItemRow,
  padItemsToMinimum,
  calculateItemTotal,
  calculateSubtotal,
  calculateDiscount,
  calculateTax,
  calculateTotal,
  filterFilledItems,
} from '../../utils/quotationCalculations';
import type { QuotationFormItem, CustomerOption, QuotationSubmitData } from '../../utils/quotationTypes';

import QuotationFormHeader from '../../components/quotation/QuotationFormHeader';
import QuotationItemsTable from '../../components/quotation/QuotationItemsTable';
import QuotationMobileWizard from '../../components/quotation/QuotationMobileWizard';

import './QuotationFormPage.css';

export default function QuotationFormPage({ mode = 'create' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { formatCurrency, getCurrencySymbol } = useSettings();
  const { isMobile } = useMobileDetection();
  const isDesktop = !isMobile;
  const isEditMode = mode === 'edit' && !!id;

  // ── Data ──
  const { customers, inventoryItems, company, quotationData, isLoading } = useQuotationFormData(id);
  const saveMutation = useSaveQuotation(id);

  // ── Form State ──
  const [customer, setCustomer] = useState<CustomerOption | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [status, setStatus] = useState('Draft');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('Valid for 30 days.');
  const [items, setItems] = useState<QuotationFormItem[]>(() =>
    Array.from({ length: 1 }, (_, i) => createEmptyItemRow(i))
  );

  // ── UI State ──
  const [currentStep, setCurrentStep] = useState(1);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [newItemId, setNewItemId] = useState<number | null>(null);

  const lastFocusedCellRef = useRef<string | null>(null);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const pendingFocusRef = useRef<number | null>(null);

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
              (input as HTMLInputElement).focus();
              (input as HTMLInputElement).select();
            }
          }, 50);
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [newItemId]);

  // ── Prevent focus loss when items array changes ──
  useEffect(() => {
    if (pendingFocusRef.current !== null) {
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
              (input as HTMLInputElement).focus();
              (input as HTMLInputElement).select();
            }
          }, 50);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [items]);

  // ── Load existing quotation data ──
  useEffect(() => {
    if (quotationData && id) {
      const data = quotationData;
      setCustomer({
        id: data.customer_id,
        customer_name: data.customer_name,
        email: data.customer_email,
        phone: data.customer_phone,
      } as CustomerOption);
      setQuotationDate(data.quotation_date?.split('T')[0] || new Date().toISOString().split('T')[0]);
      setExpiryDate(data.expiry_date?.split('T')[0] || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setStatus(data.status || 'Draft');
      setNotes(data.notes || '');
      setTerms(data.terms || '');

      if (data.items) {
        setItems(padItemsToMinimum(data.items.map((item, index) => ({
          id: index + 1,
          item_id: item.item_id,
          description: item.description || item.item_name,
          quantity: item.quantity,
          rate: item.unit_price,
          tax: item.tax_rate || 0,
          discount: {
            type: item.discount_type || 'flat',
            value: item.discount_value || 0
          }
        } as QuotationFormItem))));
      }
    }
  }, [quotationData, id]);

  // ── Auto-focus first cell for new quotation ──
  useEffect(() => {
    if (!id) {
      const timer = setTimeout(() => {
        const firstCell = document.querySelector('[data-cell-id$="-description"]');
        if (firstCell) (firstCell as HTMLElement).focus();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [id]);

  // ── Handlers ──
  const handleSelectCustomer = useCallback((selectedCustomer: CustomerOption) => {
    setCustomer(selectedCustomer);
    setCustomerSearch('');
    if (items.length > 0) {
      setTimeout(() => {
        const firstCell = document.querySelector(`[data-cell-id="${items[0]?.id}-description"]`);
        if (firstCell) {
          setEditingCell(`${items[0]?.id}-description`);
          (firstCell as HTMLElement).focus();
          setTimeout(() => {
            const input = firstCell.querySelector('input');
            if (input) {
              (input as HTMLInputElement).focus();
              (input as HTMLInputElement).select();
            }
          }, 50);
        }
      }, 100);
    }
  }, [items]);

  const addNewItem = useCallback((): number => {
    const newId = Date.now();
    const newItem: QuotationFormItem = {
      id: newId,
      item_id: 0,
      description: '',
      quantity: 1,
      rate: 0,
      tax: 0,
      discount: { type: 'flat', value: 0 }
    };
    setItems(prev => [...prev, newItem]);
    pendingFocusRef.current = newId;
    setNewItemId(newId);
    return newId;
  }, []);

  const removeItem = useCallback((itemId: number) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const updateItem = useCallback((itemId: number, field: string, value: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        if (field === 'itemId') {
          const selectedItem = inventoryItems.find(i => i.id === Number(value));
          return {
            ...item,
            item_id: Number(value),
            description: selectedItem?.item_name || item.description,
            rate: selectedItem?.standard_selling_price || item.rate
          } as QuotationFormItem;
        } else if (field === 'discountType') {
          return { ...item, discount: { ...item.discount, type: value as 'percentage' | 'flat' } };
        } else if (field === 'discountValue') {
          return { ...item, discount: { ...item.discount, value: Number(value) || 0 } };
        } else {
          return { ...item, [field]: field === 'description' ? value : Number(value) || 0 };
        }
      }
      return item;
    }));
  }, [inventoryItems]);

  const handleSubmit = useCallback(() => {
    if (!customer) {
      toast.error('Please select a customer');
      return;
    }

    const filledItems = filterFilledItems(items);
    if (filledItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    const quotationData: QuotationSubmitData = {
      customer_id: customer.id,
      quotation_date: quotationDate,
      expiry_date: expiryDate,
      status,
      notes,
      terms,
      items: filledItems.map(item => ({
        item_id: Number(item.item_id),
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        tax: item.tax,
        discount_type: item.discount.type,
        discount_value: item.discount.value
      }))
    };

    saveMutation.mutate(quotationData);
  }, [customer, items, quotationDate, expiryDate, status, notes, terms, saveMutation]);

  // ── Computed values ──
  const computedSubtotal = calculateSubtotal(items);
  const computedDiscount = calculateDiscount(items);
  const computedTax = calculateTax(items);
  const computedTotal = calculateTotal(items);

  // ── Desktop Render — single invoice-document-modern wraps header + items ──
  const renderDesktop = () => (
    <div className="sales-invoice-page-modern">
      <QuotationFormHeader
        customer={customer}
        customers={customers}
        quotationDate={quotationDate}
        expiryDate={expiryDate}
        status={status}
        company={company}
        totalAmount={computedTotal}
        formatCurrency={formatCurrency}
        isEditMode={isEditMode}
        isSaving={saveMutation.isPending}
        id={id ? Number(id) : undefined}
        onSelectCustomer={handleSelectCustomer}
        onUpdateQuotationDate={setQuotationDate}
        onUpdateExpiryDate={setExpiryDate}
        onUpdateStatus={setStatus}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/quotations')}
      >
        <QuotationItemsTable
          items={items}
          editingCell={editingCell}
          inventoryItems={inventoryItems}
          formatCurrency={formatCurrency}
          getCurrencySymbol={getCurrencySymbol}
          notes={notes}
          terms={terms}
          calculateSubtotal={() => computedSubtotal}
          calculateDiscount={() => computedDiscount}
          calculateTax={() => computedTax}
          calculateTotal={() => computedTotal}
          calculateItemTotal={calculateItemTotal}
          onUpdateItem={updateItem}
          onRemoveItem={removeItem}
          onAddNewItem={addNewItem}
          onUpdateNotes={setNotes}
          onUpdateTerms={setTerms}
          onEditingCell={setEditingCell}
          tableContainerRef={tableContainerRef}
          lastFocusedCellRef={lastFocusedCellRef}
        />
      </QuotationFormHeader>
    </div>
  );

  // ── Mobile Render ──
  const handleMobileAddItem = useCallback((newItem: QuotationFormItem) => {
    setItems(prev => [...prev, newItem]);
  }, []);

  const renderMobile = () => (
    <QuotationMobileWizard
      customer={customer}
      customers={customers}
      items={items}
      inventoryItems={inventoryItems}
      quotationDate={quotationDate}
      expiryDate={expiryDate}
      status={status}
      notes={notes}
      terms={terms}
      currentStep={currentStep}
      isEditMode={isEditMode}
      isSaving={saveMutation.isPending}
      formatCurrency={formatCurrency}
      calculateItemTotal={calculateItemTotal}
      calculateSubtotal={() => computedSubtotal}
      calculateDiscount={() => computedDiscount}
      calculateTax={() => computedTax}
      calculateTotal={() => computedTotal}
      onSelectCustomer={handleSelectCustomer}
      onUpdateQuotationDate={setQuotationDate}
      onUpdateExpiryDate={setExpiryDate}
      onUpdateStatus={setStatus}
      onUpdateNotes={setNotes}
      onUpdateTerms={setTerms}
      onAddItem={handleMobileAddItem}
      onRemoveItem={removeItem}
      onStepChange={setCurrentStep}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/quotations')}
    />
  );

  if (isLoading && id) {
    return (
      <div className="sales-invoice-page-modern">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return isDesktop ? renderDesktop() : renderMobile();
}
