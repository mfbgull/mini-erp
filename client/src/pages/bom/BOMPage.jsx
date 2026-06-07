import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AgGridReact } from "ag-grid-react";
import {
  ClipboardList,
  CheckCircle,
  Factory,
  AlertTriangle,
  Download,
  Package,
  X,
  BarChart3,
} from "lucide-react";

import Button from "../../components/common/Button";
import { CompactBOMCardView } from "../../components/common/CompactBOMCard";
import FormInput from "../../components/common/FormInput";
import Modal from "../../components/common/Modal";
import StatCard, { StatsGrid } from "../../components/common/StatCard";
import SearchableSelect from "../../components/common/SearchableSelect";
import { useSettings } from "../../context/SettingsContext";
import { useFormValidation } from "../../hooks/useFormValidation";
import { useMobileDetection } from "../../hooks/useMobileDetection";
import { useTranslation } from "../../hooks/useTranslation";
import { bomSchema, bomItemSchema } from "../../schemas";
import api from "../../utils/api";
import "../inventory/ItemPreview.css";
import "./BOMPage.css";

export default function BOMPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBOM, setEditingBOM] = useState(null);
  const queryClient = useQueryClient();
  const { formatCurrency } = useSettings();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isMobile } = useMobileDetection();

  const deleteBomMutation = useMutation({
    mutationFn: async (bomId) => {
      return api.delete(`/boms/${bomId}`);
    },
    onSuccess: () => {
      toast.success("BOM deleted successfully!");
      queryClient.invalidateQueries(["boms"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to delete BOM");
    },
  });

  const toggleBomStatusMutation = useMutation({
    mutationFn: async (bomId) => {
      return api.patch(`/boms/${bomId}/toggle-active`);
    },
    onSuccess: (updatedBom) => {
      const message = updatedBom.is_active
        ? "BOM activated successfully!"
        : "BOM deactivated successfully!";
      toast.success(message);
      queryClient.invalidateQueries(["boms"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to update BOM status");
    },
  });

  const columnDefs = [
    {
      headerName: "BOM #",
      field: "bom_no",
      sortable: true,
      filter: true,
      flex: 1,
    },
    {
      headerName: "BOM Name",
      field: "bom_name",
      sortable: true,
      filter: true,
      flex: 2,
    },
    {
      headerName: "Finished Item",
      field: "finished_item_name",
      sortable: true,
      filter: true,
      flex: 2,
    },
    {
      headerName: "Output Qty",
      field: "quantity",
      sortable: true,
      filter: "agNumberColumnFilter",
      flex: 1,
      valueFormatter: (params) => `${params.value} ${params.data.finished_uom}`,
    },
    {
      headerName: "Raw Materials",
      field: "item_count",
      sortable: true,
      filter: "agNumberColumnFilter",
      flex: 1,
      valueFormatter: (params) => `${params.value} items`,
    },
    {
      headerName: "Material Cost",
      field: "total_material_cost",
      sortable: true,
      filter: "agNumberColumnFilter",
      flex: 1.5,
      valueFormatter: (params) => formatCurrency(params.value ?? 0),
    },
    {
      headerName: "Status",
      field: "is_active",
      sortable: true,
      filter: true,
      flex: 1,
      cellRenderer: (params) => (
        <span
          className={`status-badge ${params.value ? "active" : "inactive"}`}
        >
          {params.value ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      headerName: "Actions",
      field: "actions",
      flex: 3,
      minWidth: 280,
      cellRenderer: (params) => (
        <div className="table-actions">
          <Button
            variant={params.data.is_active ? "warning" : "secondary"}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleBomStatus(params.data);
            }}
            disabled={toggleBomStatusMutation.isPending}
          >
            {params.data.is_active ? "Deactivate" : "Activate"}
          </Button>
          <Button
            variant="primary"
            onClick={async (e) => {
              e.stopPropagation();
              try {
                // Fetch full BOM details including items
                const response = await api.get(`/boms/${params.data.id}`);
                setEditingBOM(response.data);
                setIsModalOpen(true);
              } catch (error) {
                toast.error("Failed to load BOM details");
              }
            }}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteBom(params.data);
            }}
            disabled={deleteBomMutation.isPending}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const { data: boms = [], isLoading } = useQuery({
    queryKey: ["boms"],
    queryFn: async () => {
      const response = await api.get("/boms");
      return response.data;
    },
  });

  // Calculate statistics
  const stats = {
    totalBOMs: boms.length,
    activeBOMs: boms.filter((b) => b.is_active === 1 || b.is_active === true)
      .length,
    uniqueFinishedGoods: new Set(
      boms.map((b) => b.finished_item_id).filter(Boolean),
    ).size,
  };

  // Export to CSV
  const handleExport = () => {
    if (boms.length === 0) {
      toast.error("No BOMs to export");
      return;
    }

    const headers = [
      "BOM #",
      "BOM Name",
      "Finished Item",
      "Output Quantity",
      "Raw Materials Count",
      "Status",
      "Created At",
      "Updated At",
    ];

    const rows = boms.map((b) => [
      b.bom_no,
      b.bom_name,
      b.finished_item_name,
      b.quantity,
      b.items?.length || 0,
      b.is_active ? "Active" : "Inactive",
      b.created_at ? b.created_at.split("T")[0] : "",
      b.updated_at ? b.updated_at.split("T")[0] : "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `boms-${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("BOMs exported successfully!");
  };

  const handleDeleteBom = (bom) => {
    if (
      window.confirm(`Are you sure you want to delete BOM: ${bom.bom_name}?`)
    ) {
      deleteBomMutation.mutate(bom.id);
    }
  };

  const handleToggleBomStatus = (bom) => {
    const action = bom.is_active ? "deactivate" : "activate";
    if (
      window.confirm(`Are you sure you want to ${action} BOM: ${bom.bom_name}?`)
    ) {
      toggleBomStatusMutation.mutate(bom.id);
    }
  };

  const handleNew = () => {
    setIsModalOpen(true);
  };

  return (
    <div className="bom-page">
      <div className="page-header">
        <div>
          <h1>{t('bom.billOfMaterials')}</h1>
          <p className="page-subtitle">
            Pre-configure production recipes for finished goods
          </p>
        </div>
        <Button variant="primary" onClick={handleNew}>
          + Create BOM
        </Button>
      </div>

      {/* Summary Statistics Cards */}
      <StatsGrid className="compact">
        <StatCard icon={ClipboardList} label="Total BOMs" value={stats.totalBOMs} subtitle="All recipes" />
        <StatCard icon={CheckCircle} label="Active BOMs" value={stats.activeBOMs} subtitle="In use" />
        <StatCard icon={Factory} label="Finished Goods" value={stats.uniqueFinishedGoods} subtitle="Unique products" />
        <StatCard icon={AlertTriangle} label="Inactive BOMs" value={boms.filter((b) => b.is_active === 0 || b.is_active === false).length} subtitle="Not in use" />
      </StatsGrid>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button className="quick-action-btn" onClick={handleExport}>
          <Download className="action-icon" size={24} />
          <span className="action-text">Export to CSV</span>
        </button>
        <button
          className="quick-action-btn"
          onClick={() => navigate("/reports/bom-usage")}
        >
          <BarChart3 className="action-icon" size={24} />
          <span className="action-text">BOM Usage Report</span>
        </button>
        <button
          className="quick-action-btn"
          onClick={() => navigate("/production")}
        >
          <Factory className="action-icon" size={24} />
          <span className="action-text">Production</span>
        </button>
        <button
          className="quick-action-btn"
          onClick={() => navigate("/inventory/stock-movements")}
        >
          <ClipboardList className="action-icon" size={24} />
          <span className="action-text">Stock Movements</span>
        </button>
        <button
          className="quick-action-btn"
          onClick={() => navigate("/inventory/items")}
        >
          <Package className="action-icon" size={24} />
          <span className="action-text">Items</span>
        </button>
      </div>

      {isLoading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : isMobile ? (
        <CompactBOMCardView
          boms={boms}
          onEdit={async (bom) => {
            try {
              const response = await api.get(`/boms/${bom.id}`);
              setEditingBOM(response.data);
              setIsModalOpen(true);
            } catch (error) {
              toast.error("Failed to load BOM details");
            }
          }}
          onToggleStatus={handleToggleBomStatus}
          onDelete={handleDeleteBom}
        />
      ) : (
        <div className="ag-theme-quartz ag-grid-container">
          <AgGridReact theme="legacy"
            rowData={boms}
            columnDefs={columnDefs}
            defaultColDef={{
              theme: "legacy",
              resizable: true,
              sortable: false,
              filter: false,
            }}
            pagination={true}
            paginationPageSize={20}
            paginationPageSizeSelector={[10, 20, 50, 100]}
            rowSelection={{ mode: "singleRow" }}
          />
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBOM(null);
        }}
        title={
          editingBOM ? "Edit Bill of Materials" : "Create Bill of Materials"
        }
        size="large"
      >
        <BOMForm
          key={editingBOM?.id || "new"}
          bom={editingBOM}
          onClose={() => {
            setIsModalOpen(false);
            setEditingBOM(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries(["boms"]);
            setIsModalOpen(false);
            setEditingBOM(null);
          }}
        />
      </Modal>
    </div>
  );
}

function BOMForm({ bom, onClose, onSuccess }) {
  const isEdit = !!bom;

  const [formData, setFormData] = useState({
    bom_name: bom?.bom_name || "",
    finished_item_id: bom?.finished_item_id ? String(bom.finished_item_id) : "",
    quantity: bom?.quantity || 1,
    description: bom?.description || "",
  });

  const [bomItems, setBOMItems] = useState(() => {
    if (bom?.items && bom.items.length > 0) {
      return bom.items.map((item) => ({
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
        bom.items.map((item) => ({
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
      return response.data.data;
    },
  });

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const mutation = useMutation({
    mutationFn: async (data) => {
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
    onError: (error) => {
      toast.error(
        error.response?.data?.error ||
          (isEdit ? "Failed to update BOM" : "Failed to create BOM"),
      );
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear error when user starts typing
    if (errors[name]) {
      clearErrors();
    }
  };

  const handleBOMItemChange = (index, field, value) => {
    const newBOMItems = [...bomItems];
    newBOMItems[index][field] = value;
    setBOMItems(newBOMItems);
  };

  const addBOMItem = () => {
    setBOMItems([...bomItems, { item_id: "", quantity: "" }]);
  };

  const removeBOMItem = (index) => {
    if (bomItems.length > 1) {
      setBOMItems(bomItems.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate(formData)) return;

    // Validate BOM items
    const validBOMItems = bomItems.filter((i) => i.item_id && i.quantity > 0);
    if (validBOMItems.length === 0) {
      toast.error("Please add at least one raw material");
      return;
    }

    // Convert to proper types
    const data = {
      bom_name: formData.bom_name,
      finished_item_id: parseInt(formData.finished_item_id),
      quantity: parseFloat(formData.quantity),
      description: formData.description || null,
      items: validBOMItems.map((item) => ({
        item_id: parseInt(item.item_id),
        quantity: parseFloat(item.quantity),
      })),
    };

    mutation.mutate(data);
  };

  // Get raw materials and finished goods AFTER all hooks
  const rawMaterials = items.filter(
    (i) => i.is_raw_material || i.category === "Packaging Material",
  );
  const finishedGoods = items.filter((i) => i.is_finished_good);
  // Show loading state AFTER all hooks
  if (itemsLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading items...</p>
      </div>
    );
  }
  // Show message if no items
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
            value={formData.quantity}
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
                    onChange={(e) =>
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
                    onChange={(e) =>
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

function BOMDetails({ bom }) {
  return (
    <div className="bom-details">
      <div className="detail-section">
        <h3>Output</h3>
        <div className="detail-item">
          <span className="label">Finished Item:</span>
          <span className="value">{bom.finished_item_name}</span>
        </div>
        <div className="detail-item">
          <span className="label">Quantity:</span>
          <span className="value">
            {bom.quantity} {bom.finished_uom}
          </span>
        </div>
        {bom.description && (
          <div className="detail-item">
            <span className="label">Description:</span>
            <span className="value">{bom.description}</span>
          </div>
        )}
      </div>
      <div className="detail-section">
        <h3>Raw Materials Required</h3>
        <table className="materials-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Current Stock</th>
            </tr>
          </thead>
          <tbody>
            {bom.items.map((item, index) => (
              <tr key={index}>
                <td>{item.item_name}</td>
                <td>
                  {item.quantity} {item.unit_of_measure}
                </td>
                <td
                  className={
                    item.current_stock < item.quantity ? "low-stock" : ""
                  }
                >
                  {item.current_stock} {item.unit_of_measure}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
