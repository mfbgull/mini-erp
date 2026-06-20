import { useState, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';

import Button from '../common/Button';
import FormInput from '../common/FormInput';
import { useSettings } from '../../context/SettingsContext';
import { useFormValidation } from '../../hooks/useFormValidation';
import { productionSchema } from '../../schemas';
import { useProductionFormData } from '../../hooks/useProductionData';
import { useSaveProduction } from '../../hooks/useProductionMutations';
import api from '../../utils/api';
import type {
  ProductionFormData,
  CalculatedInputItem,
  CostPreview,
  InsufficientMaterial,
  ProductionSubmitPayload,
  BOMRecord,
  StockItem,
} from '../../types';

interface Props {
  production?: Record<string, unknown> | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProductionForm({ production, onClose, onSuccess }: Props) {
  const isEdit = !!production;
  const { formatCurrency } = useSettings();
  const { errors, validate, clearErrors } = useFormValidation(productionSchema);
  const saveMutation = useSaveProduction(onSuccess);

  const [selectedBOMId, setSelectedBOMId] = useState('');
  const [calculatedInputItems, setCalculatedInputItems] = useState<CalculatedInputItem[]>([]);

  const [formData, setFormData] = useState<ProductionFormData>({
    output_item_id: (production?.output_item_id as string) || '',
    output_quantity: (production?.output_quantity as string) || '',
    warehouse_id: (production?.finished_goods_warehouse_id as string) || '',
    raw_materials_warehouse_id: (production?.raw_materials_warehouse_id as string) || '',
    production_date:
      (production?.production_date as string) || new Date().toISOString().split('T')[0],
    remarks: (production?.remarks as string) || '',
    overhead_cost: (production?.overhead_cost as string) || '',
  });

  const { boms, items, finishedGoods, warehouses, bomDetail } = useProductionFormData(selectedBOMId);

  useEffect(() => {
    if (production) {
      setFormData({
        output_item_id: (production.output_item_id as string) || '',
        output_quantity: (production.output_quantity as string) || '',
        warehouse_id: (production.finished_goods_warehouse_id as string) || '',
        raw_materials_warehouse_id: (production.raw_materials_warehouse_id as string) || '',
        production_date:
          (production.production_date as string) || new Date().toISOString().split('T')[0],
        remarks: (production.remarks as string) || '',
        overhead_cost: (production.overhead_cost as string) || '',
      });
    }
  }, [production]);

  // Live cost preview
  const costPreview = useMemo<CostPreview | null>(() => {
    const qty = parseFloat(formData.output_quantity) || 0;
    const overhead = parseFloat(formData.overhead_cost) || 0;
    if (calculatedInputItems.length === 0 && overhead === 0) return null;
    let materialCost = 0;
    for (const input of calculatedInputItems) {
      const item = items?.find((i: StockItem) => i.id === parseInt(String(input.item_id)));
      if (item) {
        materialCost += (parseFloat(String(item.standard_cost)) || 0) * input.quantity;
      }
    }
    const totalCost = materialCost + overhead;
    const costPerUnit = qty > 0 ? totalCost / qty : 0;
    return { materialCost, overhead, totalCost, costPerUnit };
  }, [calculatedInputItems, formData.overhead_cost, formData.output_quantity, items]);

  // When a finished good is selected, check for existing BOMs
  useEffect(() => {
    if (formData.output_item_id) {
      const associatedBOMs = boms.filter(
        (bom: BOMRecord) => bom.finished_item_id === parseInt(formData.output_item_id),
      );

      if (associatedBOMs.length > 0) {
        setSelectedBOMId(associatedBOMs[0].id.toString());
      } else {
        const message = (
          <div>
            <strong>No BOM found for this product.</strong>
            <div>Please create a BOM first in the BOM module.</div>
            <div className="mt-xs">
              <button
                onClick={() => (window.location.href = '/bom')}
                style={{
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  marginRight: '8px',
                }}
              >
                Go to BOM
              </button>
              <small style={{ color: '#6c757d' }}>
                (You can return to complete the production after creating the BOM)
              </small>
            </div>
          </div>
        );
        toast.error(message, { duration: 10000, style: { background: '#fff3cd', color: '#856404', border: '1px solid #ffeaa7', maxWidth: '400px' } });
      }
    } else {
      setSelectedBOMId('');
      setCalculatedInputItems([]);
    }
  }, [formData.output_item_id, boms]);

  // When BOM is selected or quantity changes, calculate materials
  useEffect(() => {
    if (selectedBOMId && formData.output_quantity) {
      const quantity = parseFloat(formData.output_quantity) || 0;
      if (bomDetail?.items) {
        const calculatedItems = bomDetail.items.map((item) => ({
          item_id: item.item_id,
          quantity: item.quantity * quantity,
        }));
        setCalculatedInputItems(calculatedItems);

        if (quantity > 0) {
          toast.success(`Calculated materials for ${quantity} units of ${bomDetail.finished_item_name}`, { duration: 3000 });
        }
      }
    } else {
      setCalculatedInputItems([]);
    }
  }, [selectedBOMId, formData.output_quantity, bomDetail]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if ((errors as Record<string, string>)[name]) {
      clearErrors();
    }
  };

  // Validate stock availability before submitting
  const validateStockBeforeSubmission = async (data: ProductionSubmitPayload): Promise<InsufficientMaterial[]> => {
    const insufficientMaterials: InsufficientMaterial[] = [];

    for (const inputItem of data.input_items) {
      try {
        const response = await api.get(`/inventory/items/${inputItem.item_id}`);
        const itemDetails: StockItem = response.data;
        let availableStock = itemDetails.current_stock || 0;

        if (itemDetails.warehouse_balances) {
          const materialsWarehouseId = data.raw_materials_warehouse_id || data.warehouse_id;
          const warehouseBalance = itemDetails.warehouse_balances.find(
            (balance) => balance.warehouse_id === materialsWarehouseId,
          );
          availableStock = warehouseBalance ? warehouseBalance.quantity : 0;
        }

        if (availableStock < inputItem.quantity) {
          insufficientMaterials.push({
            name: itemDetails.item_name,
            available: availableStock,
            required: inputItem.quantity,
            uom: itemDetails.unit_of_measure,
          });
        }
      } catch {
        // Fallback validation
        const item = items.find((i: StockItem) => i.id === inputItem.item_id);
        if (item && (item.current_stock || 0) < inputItem.quantity) {
          insufficientMaterials.push({
            name: item.item_name,
            available: item.current_stock || 0,
            required: inputItem.quantity,
            uom: item.unit_of_measure,
          });
        }
      }
    }

    return insufficientMaterials;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = validate(formData);
    if (!isValid) {
      const errorKeys = Object.keys(errors);
      if (errorKeys.length > 0) {
        toast.error((errors as Record<string, string>)[errorKeys[0]]);
      } else {
        toast.error('Please fill in all required fields');
      }
      return;
    }

    if (!selectedBOMId) {
      toast.error('Please select a product with a BOM to proceed with production.');
      return;
    }

    const validInputItems = calculatedInputItems.filter((i) => i.item_id && i.quantity > 0);
    if (validInputItems.length === 0) {
      toast.error('No materials calculated from BOM. Please check the BOM configuration.');
      return;
    }

    const data: ProductionSubmitPayload = {
      output_item_id: parseInt(formData.output_item_id),
      output_quantity: parseFloat(formData.output_quantity),
      warehouse_id: parseInt(formData.warehouse_id),
      raw_materials_warehouse_id: formData.raw_materials_warehouse_id
        ? parseInt(formData.raw_materials_warehouse_id)
        : null,
      production_date: formData.production_date,
      bom_id: parseInt(selectedBOMId),
      remarks: formData.remarks || null,
      overhead_cost: parseFloat(formData.overhead_cost) || 0,
      input_items: validInputItems.map((item) => ({
        item_id: parseInt(String(item.item_id)),
        quantity: parseFloat(String(item.quantity)),
      })),
    };

    // Validate stock availability
    const insufficientMaterials = await validateStockBeforeSubmission(data);

    if (insufficientMaterials.length > 0) {
      const message = (
        <div>
          <strong>Insufficient stock for the following materials:</strong>
          <ul style={{ textAlign: 'left', marginTop: '8px' }}>
            {insufficientMaterials.map((mat, idx) => (
              <li key={idx}>
                <strong>{mat.name}</strong>: Available {mat.available}{' '}
                {mat.uom}, Required {mat.required} {mat.uom}
              </li>
            ))}
          </ul>
          <div className="mt-xs">
            Please adjust quantities or increase stock before production.
          </div>
        </div>
      );
      toast.error(message, { duration: 10000 });
      return;
    }

    saveMutation.mutate(data as unknown as Record<string, unknown>);
  };

  const selectedOutputItem = items.find((i: StockItem) => i.id === parseInt(formData.output_item_id));

  return (
    <form onSubmit={handleSubmit} className="production-form">
      <div className="form-section">
        <h3>Output (Finished Product)</h3>

        <div className="form-row">
          <FormInput
            label="Output Item (Finished Good) *"
            name="output_item_id"
            type="searchable-select"
            value={formData.output_item_id}
            onChange={handleChange}
            options={finishedGoods.map((item: StockItem) => ({
              value: item.id,
              label: `${item.item_code} - ${item.item_name}`,
            }))}
            placeholder="Search finished goods..."
            required
            tooltip="Select the finished product to be produced. Associated BOM will be automatically loaded if available."
          />

          <FormInput
            label="Quantity to Produce *"
            name="output_quantity"
            type="number"
            step="0.001"
            value={formData.output_quantity}
            onChange={handleChange}
            placeholder="0.000"
            required
            tooltip="Enter the total quantity of finished goods to be produced. Raw material quantities will be calculated automatically based on BOM."
          />
        </div>

        <div className="form-row">
          <FormInput
            label="Raw Materials Warehouse *"
            name="raw_materials_warehouse_id"
            type="searchable-select"
            value={formData.raw_materials_warehouse_id}
            onChange={handleChange}
            options={warehouses.map((wh: { id: number; warehouse_code?: string; warehouse_name?: string }) => ({
              value: wh.id,
              label: `${wh.warehouse_code} - ${wh.warehouse_name}`,
            }))}
            placeholder="Select warehouse for raw materials..."
            required
            tooltip="Select warehouse where raw materials will be consumed from."
          />

          <FormInput
            label="Finished Goods Warehouse *"
            name="warehouse_id"
            type="searchable-select"
            value={formData.warehouse_id}
            onChange={handleChange}
            options={warehouses.map((wh: { id: number; warehouse_code?: string; warehouse_name?: string }) => ({
              value: wh.id,
              label: `${wh.warehouse_code} - ${wh.warehouse_name}`,
            }))}
            placeholder="Select warehouse for finished goods..."
            required
            tooltip="Select warehouse where finished goods will be stored after production."
          />
        </div>

        <div className="form-row">
          <FormInput
            label="Production Date *"
            name="production_date"
            type="date"
            value={formData.production_date}
            onChange={handleChange}
            required
            tooltip="Date when the production will be recorded and stock levels will be updated."
          />
        </div>
      </div>

      <div className="form-section">
        <div className="section-header">
          <h3>Input (Raw Materials Consumed)</h3>
        </div>

        {selectedBOMId ? (
          <div className="calculated-materials-summary">
            <div className="materials-header">
              <p>
                Based on BOM and production quantity of{' '}
                <strong>{formData.output_quantity}</strong> units:
              </p>
              {formData.raw_materials_warehouse_id && (
                <p className="warehouse-note">
                  Stock checked from warehouse:{' '}
                  {warehouses.find(
                    (w: { id: number; warehouse_name?: string }) =>
                      w.id === parseInt(formData.raw_materials_warehouse_id),
                  )?.warehouse_name || 'N/A'}
                </p>
              )}
            </div>
            {calculatedInputItems.length > 0 ? (
              <ul className="materials-list">
                {calculatedInputItems.map((input, index) => {
                  const item = items.find(
                    (i: StockItem) => i.id === parseInt(String(input.item_id)),
                  );
                  if (!item) return null;

                  const stockAvailable = item.current_stock || 0;
                  const isSufficient = stockAvailable >= input.quantity;

                  return (
                    <li
                      key={index}
                      className={`material-item ${isSufficient ? 'sufficient' : 'insufficient'}`}
                    >
                      <div className="material-info">
                        <div className="material-name-quantity">
                          <span className="material-name">
                            {item.item_code} - {item.item_name}
                          </span>
                          <span className="material-quantity">
                            {parseFloat(String(input.quantity)).toFixed(3)}{' '}
                            {item.unit_of_measure}
                          </span>
                        </div>
                        <div className="material-stock-info">
                          <span
                            className={
                              isSufficient ? 'stock-sufficient' : 'stock-insufficient'
                            }
                          >
                            Stock: {stockAvailable} {item.unit_of_measure}
                          </span>
                          {!isSufficient && (
                            <span className="insufficient-warning">
                              <AlertTriangle
                                size={14}
                                className="icon-valign-middle"
                                style={{ marginRight: '4px' }}
                              />
                              Insufficient stock
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="no-materials">
                No materials calculated yet. Enter a production quantity.
              </p>
            )}
          </div>
        ) : (
          <p className="no-bom-message">
            Please select a finished good that has a BOM defined, or create a BOM first.
          </p>
        )}
      </div>

      <FormInput
        label="Overhead Cost"
        name="overhead_cost"
        type="number"
        step="0.01"
        value={formData.overhead_cost}
        onChange={handleChange}
        placeholder="Electricity, labour, machine costs..."
        tooltip="Optional overhead expenses for this production run."
      />

      {costPreview && (
        <div className="cost-preview-box">
          <h4 className="cost-preview-title">Cost Breakdown</h4>
          <div className="cost-preview-row">
            <span>Material Cost:</span>
            <span>{formatCurrency(costPreview.materialCost)}</span>
          </div>
          <div className="cost-preview-row">
            <span>Overhead Cost:</span>
            <span>{formatCurrency(costPreview.overhead)}</span>
          </div>
          <div className="cost-preview-row cost-preview-total">
            <span>Total Cost:</span>
            <span>{formatCurrency(costPreview.totalCost)}</span>
          </div>
          <div className="cost-preview-row cost-preview-per-unit">
            <span>Cost per Unit:</span>
            <span>{formatCurrency(costPreview.costPerUnit)}</span>
          </div>
        </div>
      )}

      <FormInput
        label="Remarks"
        name="remarks"
        type="textarea"
        value={formData.remarks}
        onChange={handleChange}
        placeholder="Notes about this production batch..."
        rows={2}
        tooltip="Optional notes about this specific production run."
      />

      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={saveMutation.isPending}>
          Record Production
        </Button>
      </div>
    </form>
  );
}
