import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import { useSettings } from '../../context/SettingsContext';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { usePOFormData } from '../../hooks/usePurchaseOrderData';
import { useSavePurchaseOrder } from '../../hooks/usePurchaseOrderMutations';
import type { POFormItem, SupplierOption, POSubmitData } from '../../types';

import PurchaseOrderFormHeader from '../../components/purchase-order/PurchaseOrderFormHeader';
import PurchaseOrderItemsTable from '../../components/purchase-order/PurchaseOrderItemsTable';
import PurchaseOrderMobileForm from '../../components/purchase-order/PurchaseOrderMobileForm';

import './PurchaseOrderFormPage.css';
import '../sales/SalesInvoicePage.css';

// ── Helper Functions ──

const createEmptyItemRow = (index: number): POFormItem => ({
  id: Date.now() + index,
  item_id: '',
  name: '',
  quantity: 1,
  unit_price: 0
});

const padItemsToMinimum = (items: POFormItem[], min = 1): POFormItem[] => {
  if (items.length >= min) return items;
  const padded = [...items];
  const now = Date.now();
  for (let i = items.length; i < min; i++) {
    padded.push({
      id: now + i + 1000,
      item_id: '',
      name: '',
      quantity: 1,
      unit_price: 0
    });
  }
  return padded;
};

const calculateSubtotal = (items: POFormItem[]): number => {
  return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
};

const calculateTotal = (items: POFormItem[]): number => {
  return calculateSubtotal(items);
};

const calculateItemTotal = (item: POFormItem): number => {
  const qty = parseFloat(String(item.quantity)) || 0;
  const price = parseFloat(String(item.unit_price)) || 0;
  return qty * price;
};

const filterFilledItems = (items: POFormItem[]): POFormItem[] => {
  return items.filter(item => item.item_id || item.name);
};

export default function PurchaseOrderFormPage({ mode = 'create' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { formatCurrency } = useSettings();
  const { isMobile } = useMobileDetection();
  const isDesktop = !isMobile;
  const isEditMode = mode === 'edit' && !!id;

  // ── Data ──
  const { suppliers, inventoryItems, warehouses, company, poData, isLoading } = usePOFormData(id);
  const saveMutation = useSavePurchaseOrder(id);

  // ── Form State ──
  const [supplier, setSupplier] = useState<SupplierOption | null>(null);
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [status, setStatus] = useState('Draft');
  const [warehouseId, setWarehouseId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<POFormItem[]>(() =>
    Array.from({ length: 1 }, (_, i) => createEmptyItemRow(i))
  );

  // ── UI State ──
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [newItemId, setNewItemId] = useState<number | null>(null);

  const lastFocusedCellRef = useRef<string | null>(null);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const pendingFocusRef = useRef<number | null>(null);

  // ── Auto-focus newly added row ──
  useEffect(() => {
    if (newItemId) {
      const timer = setTimeout(() => {
        const newCell = document.querySelector(`[data-cell-id="${newItemId}-name"]`);
        if (newCell) {
          setEditingCell(`${newItemId}-name`);
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
        const cell = document.querySelector(`[data-cell-id="${itemId}-name"]`);
        if (cell) {
          setEditingCell(`${itemId}-name`);
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

  // ── Load existing PO data for edit mode ──
  useEffect(() => {
    if (poData && isEditMode) {
      const po = poData;
      setSupplier({
        id: po.supplier_id,
        supplier_name: po.supplier_name,
        supplier_code: po.supplier_code
      });
      setPoDate(po.po_date?.split('T')[0] || new Date().toISOString().split('T')[0]);
      setDeliveryDate(po.expected_delivery_date?.split('T')[0] || '');
      setStatus(po.status || 'Draft');
      setWarehouseId(po.warehouse_id || '');
      setNotes(po.notes || '');

      if (po.items) {
        setItems(padItemsToMinimum(po.items.map((item, index) => ({
          id: index + 1,
          item_id: item.item_id,
          name: item.item_name || '',
          quantity: item.quantity,
          unit_price: item.unit_price
        } as POFormItem))));
      }
    }
  }, [poData, isEditMode]);

  // ── Auto-focus first cell for new POs ──
  useEffect(() => {
    if (!isEditMode) {
      const timer = setTimeout(() => {
        const firstCell = document.querySelector('[data-cell-id$="-name"]');
        if (firstCell) (firstCell as HTMLElement).focus();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isEditMode]);

  // ── Handlers ──
  const handleSelectSupplier = useCallback((selectedSupplier: SupplierOption) => {
    setSupplier(selectedSupplier);
    if (items.length > 0) {
      setTimeout(() => {
        const firstCell = document.querySelector(`[data-cell-id="${items[0]?.id}-name"]`);
        if (firstCell) {
          setEditingCell(`${items[0]?.id}-name`);
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
    const newItem: POFormItem = {
      id: newId,
      item_id: '',
      name: '',
      quantity: 1,
      unit_price: 0
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
            name: selectedItem?.item_name || item.name,
            unit_price: selectedItem?.standard_cost || selectedItem?.purchase_price || item.unit_price
          } as POFormItem;
        } else {
          return { ...item, [field]: field === 'name' ? value : Number(value) || 0 };
        }
      }
      return item;
    }));
  }, [inventoryItems]);

  const handleSubmit = useCallback(() => {
    if (!supplier) {
      toast.error('Please select a supplier');
      return;
    }

    const filledItems = filterFilledItems(items);
    if (filledItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    const payload: POSubmitData = {
      supplier_id: supplier.id,
      po_date: poDate,
      expected_delivery_date: deliveryDate || undefined,
      status,
      notes,
      warehouse_id: warehouseId ? Number(warehouseId) : undefined,
      items: filledItems.map(item => ({
        item_id: Number(item.item_id),
        quantity: item.quantity,
        unit_price: item.unit_price
      }))
    };

    saveMutation.mutate(payload);
  }, [supplier, items, poDate, deliveryDate, status, notes, warehouseId, saveMutation]);

  // ── Computed values ──
  const computedSubtotal = calculateSubtotal(items);
  const computedTotal = calculateTotal(items);

  // ── Desktop Render ──
  const renderDesktop = () => (
    <div className="sales-invoice-page-modern">
      <PurchaseOrderFormHeader
        supplier={supplier}
        suppliers={suppliers}
        poDate={poDate}
        deliveryDate={deliveryDate}
        status={status}
        warehouseId={warehouseId}
        warehouses={warehouses}
        company={company}
        totalAmount={computedTotal}
        formatCurrency={formatCurrency}
        isEditMode={isEditMode}
        isSaving={saveMutation.isPending}
        id={id ? Number(id) : undefined}
        onSelectSupplier={handleSelectSupplier}
        onUpdatePoDate={setPoDate}
        onUpdateDeliveryDate={setDeliveryDate}
        onUpdateStatus={setStatus}
        onUpdateWarehouse={setWarehouseId}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/purchase-orders')}
      >
        <PurchaseOrderItemsTable
          items={items}
          editingCell={editingCell}
          inventoryItems={inventoryItems}
          formatCurrency={formatCurrency}
          notes={notes}
          calculateSubtotal={() => computedSubtotal}
          calculateTotal={() => computedTotal}
          calculateItemTotal={calculateItemTotal}
          onUpdateItem={updateItem}
          onRemoveItem={removeItem}
          onAddNewItem={addNewItem}
          onUpdateNotes={setNotes}
          onEditingCell={setEditingCell}
          tableContainerRef={tableContainerRef}
          lastFocusedCellRef={lastFocusedCellRef}
        />
      </PurchaseOrderFormHeader>
    </div>
  );

  // ── Mobile Render ──
  const renderMobile = () => (
    <PurchaseOrderMobileForm
      supplier={supplier}
      suppliers={suppliers}
      items={items}
      inventoryItems={inventoryItems}
      poDate={poDate}
      deliveryDate={deliveryDate}
      status={status}
      warehouseId={warehouseId}
      warehouses={warehouses}
      notes={notes}
      isEditMode={isEditMode}
      isSaving={saveMutation.isPending}
      formatCurrency={formatCurrency}
      calculateItemTotal={calculateItemTotal}
      calculateSubtotal={() => computedSubtotal}
      calculateTotal={() => computedTotal}
      onSelectSupplier={handleSelectSupplier}
      onUpdatePoDate={setPoDate}
      onUpdateDeliveryDate={setDeliveryDate}
      onUpdateStatus={setStatus}
      onUpdateWarehouse={setWarehouseId}
      onUpdateNotes={setNotes}
      onAddNewItem={addNewItem}
      onRemoveItem={removeItem}
      onUpdateItem={updateItem}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/purchase-orders')}
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

  return (
    <div className="po-form-page">
      {isDesktop ? renderDesktop() : renderMobile()}
    </div>
  );
}
