import { useState } from "react";
import toast from "react-hot-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import Button from "../common/Button";
import FormInput from "../common/FormInput";
import { useFormValidation } from "../../hooks/useFormValidation";
import { purchaseSchema } from "../../schemas";
import { useSettings } from "../../context/SettingsContext";
import { useTranslation } from "../../hooks/useTranslation";
import api from "../../utils/api";
import type { PurchaseFormData } from "../../types";

interface PurchaseFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const emptyForm: PurchaseFormData = {
  item_id: "",
  warehouse_id: "",
  quantity: "",
  unit_cost: "",
  supplier_name: "",
  purchase_date: new Date().toISOString().split("T")[0],
  invoice_no: "",
  remarks: "",
};

export default function PurchaseForm({ onClose, onSuccess }: PurchaseFormProps) {
  const { formatCurrency } = useSettings();
  const { t } = useTranslation();
  const [formData, setFormData] = useState<PurchaseFormData>(emptyForm);
  const { errors, validate, clearErrors } = useFormValidation(purchaseSchema);

  const { data: items = [] } = useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      const response = await api.get("/inventory/items");
      return response.data.data as Array<{ id: number; item_code: string; item_name: string }>;
    },
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const response = await api.get("/inventory/warehouses");
      return response.data.data as Array<{ id: number; warehouse_code: string; warehouse_name: string }>;
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return api.post("/purchases", data);
    },
    onSuccess: () => {
      toast.success(t('purchases.purchaseSaved'));
      onSuccess();
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || t('errors.failed'));
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      clearErrors();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(formData)) return;

    mutation.mutate({
      item_id: Number(formData.item_id),
      warehouse_id: Number(formData.warehouse_id),
      quantity: Number(formData.quantity),
      unit_cost: Number(formData.unit_cost),
      supplier_name: formData.supplier_name,
      purchase_date: formData.purchase_date,
      invoice_no: formData.invoice_no || '',
      remarks: formData.remarks || '',
    });
  };

  const totalCost = formData.quantity && formData.unit_cost
    ? (parseFloat(formData.quantity) * parseFloat(formData.unit_cost)).toFixed(2)
    : "0.00";

  return (
    <form onSubmit={handleSubmit} className="purchase-form">
      <div className="form-row">
        <FormInput
          label={t('fields.item') + " *"}
          name="item_id"
          type="searchable-select"
          value={formData.item_id}
          onChange={handleChange}
          options={items.map((item) => ({
            value: item.id,
            label: `${item.item_code} - ${item.item_name}`,
          }))}
          placeholder={t('purchases.searchItems')}
          required
        />
        <FormInput
          label={t('fields.warehouse') + " *"}
          name="warehouse_id"
          type="searchable-select"
          value={formData.warehouse_id}
          onChange={handleChange}
          options={warehouses.map((wh) => ({
            value: wh.id,
            label: `${wh.warehouse_code} - ${wh.warehouse_name}`,
          }))}
          placeholder={t('purchases.searchWarehouses')}
          required
        />
      </div>

      <div className="form-row">
        <FormInput
          label={t('fields.quantity') + " *"}
          name="quantity"
          type="number"
          step="0.001"
          value={formData.quantity}
          onChange={handleChange}
          placeholder="0.000"
          required
        />
        <FormInput
          label={t('purchases.unitCost') + " *"}
          name="unit_cost"
          type="number"
          step="0.01"
          value={formData.unit_cost}
          onChange={handleChange}
          placeholder="0.00"
          required
        />
      </div>

      {formData.quantity && formData.unit_cost && (
        <div className="total-cost-display">
          <span>{t('purchases.totalCostLabel')}</span>
          <strong>{formatCurrency(parseFloat(totalCost))}</strong>
        </div>
      )}

      <div className="form-row">
        <FormInput
          label={t('purchases.purchaseDate') + " *"}
          name="purchase_date"
          type="date"
          value={formData.purchase_date}
          onChange={handleChange}
          required
        />
        <FormInput
          label={t('purchases.supplierName')}
          name="supplier_name"
          value={formData.supplier_name}
          onChange={handleChange}
          placeholder={t('purchases.supplierPlaceholder')}
        />
      </div>

      <FormInput
        label={t('purchases.invoiceNumber')}
        name="invoice_no"
        value={formData.invoice_no}
        onChange={handleChange}
        placeholder={t('purchases.invoicePlaceholder')}
      />

      <FormInput
        label={t('purchases.remarks')}
        name="remarks"
        type="textarea"
        value={formData.remarks}
        onChange={handleChange}
        placeholder={t('purchases.remarksPlaceholder')}
        rows={3}
      />

      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onClose}>
          {t('purchases.cancel')}
        </Button>
        <Button type="submit" variant="primary" loading={mutation.isPending}>
          {t('purchases.recordPurchase')}
        </Button>
      </div>
    </form>
  );
}
