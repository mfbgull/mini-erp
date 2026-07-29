/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * SalesOrderFormPage — refactored entry point for the sales order form.
 *
 * Architecture:
 *   - Data fetching: useSalesOrderData (hooks/useSalesOrderData.ts)
 *   - Mutations:     useSaveSalesOrder (hooks/useSalesOrderMutations.ts)
 *   - Business logic: utils/salesOrderCalculations.ts
 *   - Presentation:   components/sales-order/*.tsx
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import toast from 'react-hot-toast';

import { useSettings } from '../../context/SettingsContext';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { useSOData } from '../../hooks/useSalesOrderData';
import { useSaveSalesOrder } from '../../hooks/useSalesOrderMutations';
import { salesApi } from '../../utils/salesApi';
import type {
  SOFormItem,
  SelectedCustomer,
  SOSubmitData,
  SOSubmitItem,
} from '../../types';
import {
  createEmptyItemRow,
  padItemsToMinimum,
  calculateItemTotal,
  calculateSubtotal,
  calculateDiscount,
  calculateTax,
  calculateTotal,
} from '../../utils/salesOrderCalculations';

import SOFormHeader from '../../components/sales-order/SalesOrderFormHeader';
import SOItemsTable from '../../components/sales-order/SalesOrderItemsTable';
import SOMobileWizard from '../../components/sales-order/SalesOrderMobileWizard';

import './SalesOrderFormPage.css';
import '../sales/SalesInvoicePage.css';

export default function SalesOrderFormPage({ mode = 'create' }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isMobile } = useMobileDetection();
  const isDesktop = !isMobile;

  const { customers, inventoryItems, warehouses, settings } = useSOData();
  const { formatCurrency, getCurrencySymbol } = useSettings();

  // State
  const [customer, setCustomer] = useState<SelectedCustomer | null>(null);
  const [soDate, setSoDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [status, setStatus] = useState('Draft');
  const [notes, setNotes] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [items, setItems] = useState<SOFormItem[]>(() =>
    Array.from({ length: 1 }, (_, i) => createEmptyItemRow(i))
  );
  const [currentStep, setCurrentStep] = useState(1);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [newItemId, setNewItemId] = useState<number | null>(null);
  const pendingFocusRef = useRef<number | null>(null);

  const mutation = useSaveSalesOrder(id);

  const company = {
    name: (settings as any)?.company_name?.value || 'Mini ERP',
    email: (settings as any)?.company_email?.value || 'support@minierp.com',
    phone: (settings as any)?.company_phone?.value || '+1 123 456 7890',
    address: (settings as any)?.company_address?.value || '456 Enterprise Ave, BC 12345',
  };

  // Auto-focus newly added row
  useEffect(() => {
    if (newItemId) {
      const timer = setTimeout(() => {
        const cell = document.querySelector(`[data-cell-id="${newItemId}-name"]`);
        if (cell) {
          setEditingCell(`${newItemId}-name`);
          (cell as HTMLElement).focus();
          setTimeout(() => {
            const input = cell.querySelector('input');
            if (input) { input.focus(); input.select(); }
          }, 50);
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [newItemId]);

  // Prevent focus loss when items change
  useEffect(() => {
    if (pendingFocusRef.current) {
      const focusId = pendingFocusRef.current;
      pendingFocusRef.current = null;
      const timer = setTimeout(() => {
        const cell = document.querySelector(`[data-cell-id="${focusId}-name"]`);
        if (cell) {
          setEditingCell(`${focusId}-name`);
          (cell as HTMLElement).focus();
          setTimeout(() => {
            const input = cell.querySelector('input');
            if (input) { input.focus(); input.select(); }
          }, 50);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [items]);

  // Fetch existing SO
  useEffect(() => {
    if (id) {
      (async () => {
        try {
          const response = await salesApi.getSalesOrder(Number(id));
          const data = response.data || response;
          setCustomer({
            id: data.customer_id,
            customer_name: data.customer_name,
            email: data.customer_email,
            phone: data.customer_phone,
            billing_address: data.customer_address,
          });
          setSoDate(data.so_date?.split('T')[0] || new Date().toISOString().split('T')[0]);
          setDeliveryDate(data.delivery_date?.split('T')[0] || '');
          setStatus(data.status || 'Draft');
          setNotes(data.notes || '');
          setWarehouseId(data.warehouse_id || '');
          if (data.items) {
            setItems(padItemsToMinimum(data.items.map((item: any, index: number) => ({
              id: index + 1,
              item_id: item.item_id,
              name: item.item_name || item.description || '',
              quantity: item.quantity,
              unitPrice: item.unit_price,
              taxRate: item.tax_rate || 0,
              discount: { type: item.discount_type || 'flat', value: item.discount_value || 0 },
            }))));
          }
        } catch {
          toast.error('Failed to load sales order');
          navigate('/sales-orders');
        }
      })();
    } else {
      setTimeout(() => {
        const firstCell = document.querySelector('[data-cell-id$="-name"]');
        if (firstCell) (firstCell as HTMLElement).focus();
      }, 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  // Callbacks
  const handleBack = useCallback(() => navigate('/sales-orders'), [navigate]);
  const handlePreview = useCallback(() => { if (id) navigate(`/sales-orders/${id}`); }, [id, navigate]);

  const handleSelectCustomer = useCallback((selected: SelectedCustomer) => {
    setCustomer(selected);
    if (items.length > 0) {
      setTimeout(() => {
        const firstCell = document.querySelector(`[data-cell-id="${items[0]?.id}-name"]`);
        if (firstCell) {
          setEditingCell(`${items[0]?.id}-name`);
          (firstCell as HTMLElement).focus();
          setTimeout(() => {
            const input = firstCell.querySelector('input');
            if (input) { input.focus(); input.select(); }
          }, 50);
        }
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdateItem = useCallback((itemId: number, field: string, value: unknown) => {
    setItems((prev) => prev.map((item) => {
      if (item.id !== itemId) return item;
      if (field === 'itemId') {
        const selected = inventoryItems.find((i) => i.id === Number(value));
        return { ...item, item_id: Number(value), name: selected?.item_name || item.name, unitPrice: selected?.standard_selling_price || item.unitPrice };
      }
      if (field === 'discountType') return { ...item, discount: { ...item.discount, type: value as 'flat' | 'percentage' } };
      if (field === 'discountValue') return { ...item, discount: { ...item.discount, value: Number(value) || 0 } };
      if (field === 'name') return { ...item, name: String(value) };
      return { ...item, [field]: Number(value) || 0 };
    }));
  }, [inventoryItems]);

  const handleRemoveItem = useCallback((itemId: number) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  const handleAddNewItem = useCallback(() => {
    const newId = Date.now();
    const newItem: SOFormItem = { id: newId, item_id: '', name: '', quantity: 1, unitPrice: 0, taxRate: 0, discount: { type: 'flat', value: 0 } };
    setItems((prev) => [...prev, newItem]);
    return newId;
  }, []);

  const handleMobileAddItem = useCallback((item: SOFormItem) => {
    setItems((prev) => [...prev, item]);
  }, []);

  const handleSetPendingFocus = useCallback((itemId: number) => {
    pendingFocusRef.current = itemId;
  }, []);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (!customer) { toast.error('Please select a customer'); return; }
    const filled = items.filter((i) => i.item_id || i.name);
    if (filled.length === 0) { toast.error('Please add at least one item'); return; }

    const payload: SOSubmitData = {
      customer_id: customer.id,
      customer_name: customer.customer_name,
      so_date: soDate,
      delivery_date: deliveryDate || undefined,
      status,
      notes,
      warehouse_id: warehouseId || undefined,
      total_amount: calculateTotal(items),
      items: filled.map((item): SOSubmitItem => ({
        item_id: item.item_id,
        description: item.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        tax_rate: item.taxRate,
        discount_type: item.discount.type,
        discount_value: item.discount.value,
      })),
    };

    mutation.mutate(payload as any);
  }, [customer, items, soDate, deliveryDate, status, notes, warehouseId, mutation]);

  return (
    <div className="sales-order-form-page">
      {isDesktop ? (
        <div className="sales-invoice-page-modern">
          <SOFormHeader
            customer={customer} soDate={soDate} deliveryDate={deliveryDate}
            status={status} warehouseId={warehouseId}
            customers={customers} warehouses={warehouses} company={company}
            mutationPending={mutation.isPending} id={id}
            formatCurrency={formatCurrency} calculateTotal={() => calculateTotal(items)}
            onSelectCustomer={handleSelectCustomer}
            onSetSoDate={setSoDate} onSetDeliveryDate={setDeliveryDate}
            onSetStatus={setStatus} onSetWarehouseId={setWarehouseId}
            onSubmit={handleSubmit} onBack={handleBack} onPreview={handlePreview}
          />
          <div className="invoice-document-modern" style={{ marginTop: '0.5rem' }}>
            <SOItemsTable
              items={items} editingCell={editingCell} inventoryItems={inventoryItems}
              notes={notes} onSetNotes={setNotes}
              onSetEditingCell={setEditingCell} onUpdateItem={handleUpdateItem}
              onRemoveItem={handleRemoveItem} onAddNewItem={handleAddNewItem}
              onSetPendingFocus={handleSetPendingFocus} onSetNewItemId={setNewItemId}
              formatCurrency={formatCurrency} getCurrencySymbol={getCurrencySymbol}
              calculateItemTotal={(item) => calculateItemTotal(item)}
              calculateSubtotal={() => calculateSubtotal(items)}
              calculateDiscount={() => calculateDiscount(items)}
              calculateTax={() => calculateTax(items)}
              calculateTotal={() => calculateTotal(items)}
              getNextField={(field) => { const order = ['name', 'quantity', 'unitPrice', 'discountValue', 'taxRate']; const idx = order.indexOf(field); return order[idx + 1]; }}
            />
          </div>
        </div>
      ) : (
        <SOMobileWizard
          customer={customer} soDate={soDate} deliveryDate={deliveryDate}
          status={status} warehouseId={warehouseId} notes={notes}
          items={items} currentStep={currentStep}
          customers={customers} warehouses={warehouses} inventoryItems={inventoryItems}
          mutationPending={mutation.isPending} id={id}
          formatCurrency={formatCurrency}
          calculateItemTotal={(item) => calculateItemTotal(item)}
          calculateSubtotal={() => calculateSubtotal(items)}
          calculateDiscount={() => calculateDiscount(items)}
          calculateTax={() => calculateTax(items)}
          calculateTotal={() => calculateTotal(items)}
          onSelectCustomer={handleSelectCustomer}
          onSetSoDate={setSoDate} onSetDeliveryDate={setDeliveryDate}
          onSetStatus={setStatus} onSetWarehouseId={setWarehouseId}
          onSetNotes={setNotes} onSetCurrentStep={setCurrentStep}
          onAddItem={handleMobileAddItem} onRemoveItem={handleRemoveItem}
          onSubmit={() => handleSubmit()}
        />
      )}
    </div>
  );
}
