import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";

import Button from "../common/Button";
import FormInput from "../common/FormInput";
import SearchableSelect from "../common/SearchableSelect";
import { useFormValidation } from "../../hooks/useFormValidation";
import { bomSchema } from "../../schemas";
import api from "../../utils/api";
import type { BOMListItem, BOMFormData, BOMItemFormEntry, BOMItemData } from "../../types";

interface BOMFormProps {
  bom?: BOMListItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BOMForm({ bom, onClose, onSuccess }: BOMFormProps) {
  const isEdit = !!bom;

  const [formData, setFormData] = useState<BOMFormData>({
    bom_name: bom?.bom_name || "",
    finished_item_id: bom?.finished_item_id ? String(bom.finished_item_id) : "",
    quantity: bom?.quantity || 1,
    description: bom?.description || "",
  });

  const [bomItems, setBOMItems] = useState<BOMItemFormEntry[]>(() => {
    if (bom?.items && bom.items.length > 0) {
      return bom.items.map((item: BOMItemData) => ({
        item_id: item.item_id?.toString() || "",
        quantity: item.quantity?.toString() || "",
      }));
    }
    return [{ item_id: "", quantity: "" }];
  });

  const { errors, validate, clearErrors } = useFormValidation(bomSchema);

  useEffect(() => {
    if (bom?.items && bom.items.length > 0) {
      setBOMItems(
        bom.items.map((item: BOMItemData) => ({
          item_id: item.item_id?.toString() || "",
          quantity: item.quantity?.toString() || "",
        })),
      );
    } else {
      setBOMItems([{ item_id: "", quantity: "" }]);
    }
  }, [bom?.id]);

  useEffect(() => {
    if (bom) {
      setFormData({
        bom_name: bom.bom_name || "",
        finished_item_id: bom.finished_item_id
          ? String(bom.finished_item_id)
          : "",
        quantity: bom.quantity || 1,
        description: bom.description || "",
      });
    }
  }, [bom?.id]);

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      const response = await api.get("/inventory/items");
      return response.data.data as Array<{
        id: number;
        item_code: string;
        item_name: string;
        is_raw_material: boolean | number;
        is_finished_good: boolean | number;
        category?: string;
        current_stock: number;
        unit_of_measure: string;
      }>;
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      if (isEdit && bom?.id) {
        return api.put(`/boms/${bom.id}`, data);
      } else {
        return api.post("/boms", data);
      }
    },
    onSuccess: () => {
      toast.success(
        isEdit ? "BOM updated successfully!" : "BOM created successfully!",
      );
      onSuccess();
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(
        error.response?.data?.error ||
          (isEdit ? "Failed to update BOM" : "Failed to create BOM"),
      );
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof typeof errors]) {
      clearErrors();
    }
  };

  const handleBOMItemChange = (index: number, field: string, value: string) => {
    const newBOMItems = [...bomItems];
    (newBOMItems[index] as unknown as Record<string, string>)[field] = value;
    setBOMItems(newBOMItems);
  };

  const addBOMItem = () => {
    setBOMItems([...bomItems, { item_id: "", quantity: "" }]);
  };

  const removeBOMItem = (index: number) => {
    if (bomItems.length > 1) {
      setBOMItems(bomItems.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate(formData)) return;

    const validBOMItems = bomItems.filter((i) => i.item_id && parseFloat(i.quantity) > 0);
    if (validBOMItems.length === 0) {
      toast.error("Please add at least one raw material");
      return;
    }

    const data = {
      bom_name: formData.bom_name,
      finished_item_id: parseInt(formData.finished_item_id),
      quantity: parseFloat(String(formData.quantity)),
      description: formData.description || null,
      items: validBOMItems.map((item) => ({
        item_id: parseInt(item.item_id),
        quantity: parseFloat(item.quantity),
      })),
    };

    mutation.mutate(data);
  };

  const rawMaterials = items.filter(
    (i) => i.is_raw_material || i.category === "Packaging Material",
  );
  const finishedGoods = items.filter((i) => i.is_finished_good);

  if (itemsLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading items...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="loading">
        <p>No items found. Please create items first.</p>
        <Button type="button" variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bom-form">
      <div className="form-section">
        <h3>Output (Finished Product)</h3>
        <FormInput
          label="BOM Name *"
          name="bom_name"
          type="text"
          value={formData.bom_name}
          onChange={handleChange}
          placeholder="e.g., Bottled Mustard Oil (1 Ltr) - Standard Recipe"
          required
        />

        <div className="form-row">
          <SearchableSelect
            label="Finished Item *"
            name="finished_item_id"
            value={formData.finished_item_id}
            onChange={handleChange}
            placeholder="Select Finished Good"
            required
            options={finishedGoods.map((item) => ({
              value: item.id,
              label: `${item.item_code} - ${item.item_name}`,
              subtitle: `Stock: ${item.current_stock} ${item.unit_of_measure}`,
            }))}
          />

          <FormInput
            label="Output Quantity *"
            name="quantity"
            type="number"
            step="0.001"
            value={String(formData.quantity)}
            onChange={handleChange}
            placeholder="1.000"
            required
          />
        </div>

        <FormInput
          label="Description"
          name="description"
          type="textarea"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe the production process..."
          rows={2}
        />
      </div>

      <div className="form-section">
        <div className="section-header">
          <h3>Input (Raw Materials Required)</h3>
          <Button
            type="button"
            variant="secondary"
            onClick={addBOMItem}
            className="btn-small"
          >
            + Add Raw Material
          </Button>
        </div>
        <div className="bom-items-list">
          {bomItems.map((bomItem, index) => {
            const selectedItem = items.find(
              (i) => i.id === parseInt(bomItem.item_id),
            );
            return (
              <div key={index} className="bom-item-row">
                <div className="bom-item-fields">
                  <SearchableSelect
                    label={`Raw Material ${index + 1} *`}
                    name={`bom_item_${index}`}
                    value={bomItem.item_id}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
                      handleBOMItemChange(index, "item_id", e.target.value)
                    }
                    placeholder="Select Raw Material"
                    required
                    options={rawMaterials.map((item) => ({
                      value: item.id,
                      label: `${item.item_code} - ${item.item_name}`,
                      subtitle: `Stock: ${item.current_stock} ${item.unit_of_measure}`,
                    }))}
                  />

                  <FormInput
                    label="Quantity Required *"
                    name={`bom_quantity_${index}`}
                    type="number"
                    step="0.001"
                    value={bomItem.quantity}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleBOMItemChange(index, "quantity", e.target.value)
                    }
                    placeholder="0.000"
                    required
                  />

                  {bomItems.length > 1 && (
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => removeBOMItem(index)}
                      title="Remove"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
                {selectedItem && (
                  <div className="stock-info-inline">
                    {selectedItem.item_name} - {selectedItem.unit_of_measure}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={mutation.isPending}>
          {isEdit ? "Update BOM" : "Create BOM"}
        </Button>
      </div>
    </form>
  );
}
