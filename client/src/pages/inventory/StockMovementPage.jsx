import { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AgGridReact } from "ag-grid-react";
import { format } from "date-fns";
import {
  Package,
  ArrowDown,
  ArrowUp,
  BarChart3,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Factory,
  ArrowLeftRight,
  Settings,
  Search,
  X,
  Download,
  ClipboardList,
  Wallet,
  Building2,
  Plus,
} from "lucide-react";

import Button from "../../components/common/Button";
import CompactStockMovementCardView from "../../components/common/CompactStockMovementCard";
import FormInput from "../../components/common/FormInput";
import Modal from "../../components/common/Modal";
import StatCard, { StatsGrid } from "../../components/common/StatCard";
import QuickActionsPanel from "../../components/layout/QuickActionsPanel";
import { useSettings } from "../../context/SettingsContext";
import { useFormValidation } from "../../hooks/useFormValidation";
import StockMovementPreview from "./StockMovementPreview";
import { useMobileDetection } from "../../hooks/useMobileDetection";
import { useTranslation } from "../../hooks/useTranslation";
import { stockMovementSchema } from "../../schemas";
import api from "../../utils/api";
import "./StockMovementPage.css";

export default function StockMovementPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [previewMovement, setPreviewMovement] = useState(null);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const { formatCurrency } = useSettings();
  const { isMobile } = useMobileDetection();

  // Auto-open create modal when ?action=create is present
  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  // Hide the global FAB on mobile — its Quick Actions functionality is
  // available from the mobile action bar instead.
  useEffect(() => {
    if (!isMobile) return;
    document.body.classList.add('sm-page-mobile');
    return () => {
      document.body.classList.remove('sm-page-mobile');
    };
  }, [isMobile]);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { data: movements = [], isLoading } = useQuery({
    queryKey: ["stock-movements"],
    queryFn: async () => {
      const response = await api.get("/inventory/stock-movements", {
        params: { limit: 100 },
      });
      return response.data;
    },
  });

  const stats = {
    totalMovements: movements.length,
    totalIn: movements.filter((m) => m.quantity > 0).length,
    totalOut: movements.filter((m) => m.quantity < 0).length,
    totalQuantity: movements.reduce(
      (sum, m) => sum + Math.abs(parseFloat(m.quantity || 0)),
      0,
    ),
    mostActiveType:
      movements.length > 0
        ? movements.reduce((counts, m) => {
            counts[m.movement_type] = (counts[m.movement_type] || 0) + 1;
            return counts;
          }, {})
        : {},
    movementsByType: {
      PURCHASE: movements.filter((m) => m.movement_type === "PURCHASE").length,
      SALE: movements.filter((m) => m.movement_type === "SALE").length,
      PRODUCTION: movements.filter((m) => m.movement_type === "PRODUCTION")
        .length,
      TRANSFER: movements.filter((m) => m.movement_type === "TRANSFER").length,
      ADJUSTMENT: movements.filter((m) => m.movement_type === "ADJUSTMENT")
        .length,
    },
  };

  // Filter movements by search term
  const filteredMovements = movements.filter((m) =>
    m.movement_no
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
    m.item_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.movement_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const mostActiveType = useMemo(() => {
    if (movements.length === 0) return "None";
    const typeCount = movements.reduce((counts, m) => {
      counts[m.movement_type] = (counts[m.movement_type] || 0) + 1;
      return counts;
    }, {});
    return (
      Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "None"
    );
  }, [movements]);

  // Export to CSV
  const handleExport = () => {
    if (movements.length === 0) {
      toast.error("No movements to export");
      return;
    }

    const headers = [
      "Movement No",
      "Date",
      "Item Code",
      "Item Name",
      "Warehouse",
      "Type",
      "Quantity",
      "Unit",
      "Remarks",
    ];

    const rows = movements.map((m) => [
      m.movement_no,
      format(new Date(m.movement_date), "yyyy-MM-dd"),
      m.item_code,
      m.item_name,
      m.warehouse_name,
      m.movement_type,
      Math.abs(m.quantity),
      m.unit_of_measure,
      m.remarks || "",
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
      `stock-movements-${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Movements exported successfully!");
  };

  const columnDefs = [
    {
      headerName: "Movement No",
      field: "movement_no",
      sortable: true,
      filter: true,
      flex: 1,
    },
    {
      headerName: "Date",
      field: "movement_date",
      sortable: true,
      filter: "agDateColumnFilter",
      flex: 1,
      valueFormatter: (params) => format(new Date(params.value), "dd MMM yyyy"),
    },
    {
      headerName: "Item Code",
      field: "item_code",
      filter: true,
      flex: 1,
    },
    {
      headerName: "Item Name",
      field: "item_name",
      filter: true,
      flex: 2,
    },
    {
      headerName: "Quantity",
      field: "quantity",
      sortable: true,
      filter: "agNumberColumnFilter",
      flex: 1.5,
      cellRenderer: (params) => (
        <span className={params.value >= 0 ? "qty-in" : "qty-out"}>
          {params.value >= 0 ? "+" : ""}
          {parseFloat(params.value).toFixed(2)} {params.data.unit_of_measure}
        </span>
      ),
    },
    {
      headerName: "Warehouse",
      field: "warehouse_name",
      filter: true,
      flex: 1.5,
    },
    {
      headerName: "Type",
      field: "movement_type",
      sortable: true,
      filter: true,
      flex: 1,
      cellRenderer: (params) => (
        <span className="status-tag">{params.value}</span>
      ),
    },
    {
      headerName: "Batch",
      field: "batch_no",
      sortable: true,
      filter: true,
      flex: 1,
      cellRenderer: (params) => (
        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: params.value ? '#6366f1' : '#9ca3af' }}>
          {params.value || '—'}
        </span>
      ),
    },
    {
      headerName: "Cost",
      field: "unit_cost",
      sortable: true,
      filter: 'agNumberColumnFilter',
      flex: 1,
      valueFormatter: (params) => params.value != null ? params.value.toFixed(2) : '—',
      cellStyle: { fontFamily: 'monospace' },
    },
   ];

  return (
    <div className="items-page">
      <div className="page-header">
        <div>
          <h1>{t('stockMovements.stockMovements')}</h1>
          <p className="page-subtitle">{t('stockMovements.trackTransactions')}</p>
        </div>
        {!isMobile && (
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            + {t('stockMovements.newAdjustment')}
          </Button>
        )}
      </div>

      {/* Summary Statistics Cards */}
      <StatsGrid className="compact">
        <StatCard icon={Package} label={t('stockMovements.totalMovements')} value={stats.totalMovements} subtitle={t('stockMovements.allTransactions')} />
        <StatCard icon={ArrowDown} label={t('common.totalIn')} value={stats.totalIn} subtitle={t('stockMovements.stockAdditions')} />
        <StatCard icon={ArrowUp} label={t('common.totalOut')} value={stats.totalOut} subtitle={t('stockMovements.stockReductions')} />
        <StatCard icon={BarChart3} label={t('stockMovements.totalQuantity')} value={parseFloat(stats.totalQuantity).toFixed(2)} subtitle={t('stockMovements.aggregateMoved')} />
        <StatCard icon={TrendingUp} label={t('stockMovements.mostActiveType')} value={mostActiveType} subtitle={stats.mostActiveType !== "None" ? `${t('stockMovements.count')}: ${stats.movementsByType[stats.mostActiveType]}` : t('stockMovements.noMovements')} />
        <StatCard icon={ShoppingCart} label={t('common.purchases')} value={stats.movementsByType.PURCHASE} subtitle={t('stockMovements.stockIn')} />
        <StatCard icon={DollarSign} label={t('common.sales')} value={stats.movementsByType.SALE} subtitle={t('stockMovements.stockOut')} />
        <StatCard icon={Factory} label={t('common.production')} value={stats.movementsByType.PRODUCTION} subtitle={t('stockMovements.created')} />
        <StatCard icon={ArrowLeftRight} label={t('common.transfers')} value={stats.movementsByType.TRANSFER} subtitle={t('stockMovements.movedBetween')} />
        <StatCard icon={Settings} label={t('stockMovements.adjustments')} value={stats.movementsByType.ADJUSTMENT} subtitle={t('stockMovements.manualChanges')} />
      </StatsGrid>

      <div className="search-quick-row">
        <div className="search-section">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              className="search-input-field"
              placeholder={t('stockMovements.searchPlaceholder') || "Search movements..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="search-clear-btn"
                onClick={() => setSearchTerm('')}
                type="button"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        <div className="quick-actions">
          <button className="quick-action-btn" onClick={handleExport} type="button">
            <Download className="action-icon" size={16} />
            <span className="action-text">{t('stockMovements.exportCsv')}</span>
          </button>
          <button
            className="quick-action-btn"
            onClick={() => navigate("/reports/inventory-movement")}
            type="button"
          >
            <ClipboardList className="action-icon" size={16} />
            <span className="action-text">{t('stockMovements.movementReport')}</span>
          </button>
          <button
            className="quick-action-btn"
            onClick={() => navigate("/reports/stock-valuation")}
            type="button"
          >
            <Wallet className="action-icon" size={16} />
            <span className="action-text">{t('stockMovements.stockValuation')}</span>
          </button>
          <button
            className="quick-action-btn"
            onClick={() => navigate("/inventory/stock-by-warehouse")}
            type="button"
          >
            <Building2 className="action-icon" size={16} />
            <span className="action-text">{t('stockMovements.stockByWarehouse')}</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : isMobile ? (
        <>
          <CompactStockMovementCardView movements={filteredMovements} />

          <div className="mobile-action-bar">
            <Button
              variant="primary"
              onClick={() => setIsQuickActionsOpen(true)}
              className="fab-button fab-button--quick-actions"
            >
              <Plus size={16} />
              {t('dashboard.quickActions')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsModalOpen(true)}
              className="fab-button"
            >
              + {t('stockMovements.newAdjustment')}
            </Button>
          </div>

          <QuickActionsPanel
            isOpen={isQuickActionsOpen}
            onClose={() => setIsQuickActionsOpen(false)}
          />
        </>
      ) : (
        // Desktop ag-grid view
        <div className="ag-theme-quartz">
          <AgGridReact theme="legacy"
            rowData={filteredMovements}
            columnDefs={columnDefs}
            defaultColDef={{
              resizable: true,
              sortable: false,
              filter: false
            }}
            pagination={true}
            paginationPageSize={20}
            paginationPageSizeSelector={[10, 20, 50, 100]}
            onRowDoubleClicked={(params) => setPreviewMovement(params.data)}
            rowSelection={{ mode: 'singleRow' }}
          />
        </div>
      )}

      {previewMovement && (
        <StockMovementPreview
          movement={previewMovement}
          onClose={() => setPreviewMovement(null)}
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Stock Movement"
        size="large"
      >
        <StockAdjustmentForm
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

function StockAdjustmentForm({ onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const [movementType, setMovementType] = useState("ADJUSTMENT");
  const [formData, setFormData] = useState({
    from_warehouse_id: "",
    to_warehouse_id: "",
    movement_date: new Date().toISOString().split("T")[0],
    remarks: "",
  });
  const [lineItems, setLineItems] = useState([
    { item_id: "", quantity: 0, available_stock: 0 },
  ]);

  const { errors, validate, clearErrors } =
    useFormValidation(stockMovementSchema);

  const { data: items = [] } = useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      const response = await api.get("/inventory/items");
      return response.data.data;
    },
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const response = await api.get("/inventory/warehouses");
      return response.data.data;
    },
  });

  const { data: stockBalances = [] } = useQuery({
    queryKey: ["stock-balances"],
    queryFn: async () => {
      const response = await api.get("/inventory/stock-balances");
      return response.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (movements) => {
      // Submit each line item as a separate movement
      const promises = movements.map((movement) =>
        api.post("/inventory/stock-movements", movement),
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast.success(
        `${lineItems.length} stock movement(s) recorded successfully!`,
      );
      queryClient.invalidateQueries(["stock-movements"]);
      queryClient.invalidateQueries(["items"]);
      queryClient.invalidateQueries(["stock-balances"]);
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to adjust stock");
    },
  });

  const getItemStock = (itemId, warehouseId) => {
    if (!itemId || !warehouseId || itemId === "" || warehouseId === "") {
      return 0;
    }
    const parsedItemId = parseInt(itemId);
    const parsedWarehouseId = parseInt(warehouseId);

    if (isNaN(parsedItemId) || isNaN(parsedWarehouseId)) {
      return 0;
    }

    const stock = stockBalances.find(
      (sb) =>
        sb.item_id === parsedItemId && sb.warehouse_id === parsedWarehouseId,
    );
    return stock ? parseFloat(stock.quantity) : 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    // Clear error when user starts typing
    if (errors[e.target.name]) {
      clearErrors();
    }
  };

  const handleLineItemChange = (index, field, value) => {
    const updated = [...lineItems];
    updated[index][field] = value;

    // Update available stock when item or warehouse changes
    if (field === "item_id") {
      const warehouseId =
        movementType === "TRANSFER"
          ? formData.from_warehouse_id
          : formData.to_warehouse_id;
      updated[index].available_stock = getItemStock(value, warehouseId);
    }

    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { item_id: "", quantity: 0, available_stock: 0 },
    ]);
  };

  const removeLineItem = (index) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate(formData)) return;

    // Validate line items
    const validItems = lineItems.filter((item) => {
      if (!item.item_id) return false;
      if (movementType === 'ADJUSTMENT') return item.quantity !== 0;
      return item.quantity > 0;
    });
    if (validItems.length === 0) {
      toast.error("Please add at least one item with quantity");
      return;
    }

    // Create movements based on type
    const movements = [];

    if (movementType === "TRANSFER") {
      // For transfers, create two movements per item (OUT from source, IN to destination)
      validItems.forEach((item) => {
        // Negative movement from source warehouse
        movements.push({
          item_id: item.item_id,
          warehouse_id: formData.from_warehouse_id,
          quantity: -Math.abs(item.quantity),
          movement_type: "TRANSFER",
          movement_date: formData.movement_date,
          remarks: formData.remarks || "Stock transfer",
        });

        // Positive movement to destination warehouse
        movements.push({
          item_id: item.item_id,
          warehouse_id: formData.to_warehouse_id,
          quantity: Math.abs(item.quantity),
          movement_type: "TRANSFER",
          movement_date: formData.movement_date,
          remarks: formData.remarks || "Stock transfer",
        });
      });
    } else {
      // For adjustments, create one movement per item
      validItems.forEach((item) => {
        movements.push({
          item_id: item.item_id,
          warehouse_id: formData.to_warehouse_id,
          quantity: item.quantity,
          movement_type: "ADJUSTMENT",
          movement_date: formData.movement_date,
          remarks: formData.remarks || "Stock adjustment",
        });
      });
    }

    mutation.mutate(movements);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-row">
        <FormInput
          label="Movement Type"
          name="movement_type"
          type="select"
          value={movementType}
          onChange={(e) => setMovementType(e.target.value)}
          options={[
            { value: "ADJUSTMENT", label: "Stock Adjustment" },
            { value: "TRANSFER", label: "Stock Transfer" },
          ]}
          required
        />
        <FormInput
          label="Date"
          name="movement_date"
          type="date"
          value={formData.movement_date}
          onChange={handleChange}
          required
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: movementType === "TRANSFER" ? "1fr 1fr" : "1fr",
          gap: "var(--space-md)",
        }}
      >
        {movementType === "TRANSFER" ? (
          <>
            <FormInput
              label="From Warehouse"
              name="from_warehouse_id"
              type="searchable-select"
              value={formData.from_warehouse_id}
              onChange={(e) => {
                handleChange(e);
                const updated = lineItems.map((item) => ({
                  ...item,
                  available_stock: getItemStock(item.item_id, e.target.value),
                }));
                setLineItems(updated);
              }}
              options={warehouses.map((wh) => ({
                value: wh.id,
                label: `${wh.warehouse_code} - ${wh.warehouse_name}`,
              }))}
              placeholder="Select source warehouse..."
              required
            />
            <FormInput
              label="To Warehouse"
              name="to_warehouse_id"
              type="searchable-select"
              value={formData.to_warehouse_id}
              onChange={handleChange}
              options={warehouses
                .filter((wh) => wh.id !== parseInt(formData.from_warehouse_id))
                .map((wh) => ({
                  value: wh.id,
                  label: `${wh.warehouse_code} - ${wh.warehouse_name}`,
                }))}
              placeholder="Select destination warehouse..."
              required
            />
          </>
        ) : (
          <FormInput
            label="Warehouse"
            name="to_warehouse_id"
            type="searchable-select"
            value={formData.to_warehouse_id}
            onChange={(e) => {
              handleChange(e);
              const updated = lineItems.map((item) => ({
                ...item,
                available_stock: getItemStock(item.item_id, e.target.value),
              }));
              setLineItems(updated);
            }}
            options={warehouses.map((wh) => ({
              value: wh.id,
              label: `${wh.warehouse_code} - ${wh.warehouse_name}`,
            }))}
            placeholder="Select warehouse..."
            required
          />
        )}
      </div>

      <div style={{ marginTop: "var(--space-lg)" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "var(--space-md)",
          }}
        >
          <h4 style={{ margin: 0 }}>Items</h4>
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={addLineItem}
          >
            + Add Row
          </Button>
        </div>

        <div className="line-items-list">
          {lineItems.map((lineItem, index) => {
            const warehouseId =
              movementType === "TRANSFER"
                ? formData.from_warehouse_id
                : formData.to_warehouse_id;
            const availableStock = getItemStock(lineItem.item_id, warehouseId);
            const selectedItem = items.find(
              (i) => i.id === parseInt(lineItem.item_id),
            );

            return (
              <div key={index} className="line-item-row">
                <span className="line-item-index">{index + 1}</span>
                <div className="line-item-fields">
                  <FormInput
                    label="Item"
                    name={`item_id_${index}`}
                    type="searchable-select"
                    value={lineItem.item_id}
                    onChange={(e) =>
                      handleLineItemChange(index, "item_id", e.target.value)
                    }
                    options={items.map((i) => ({
                      value: i.id,
                      label: `${i.item_code} - ${i.item_name}`,
                    }))}
                    placeholder="Search items..."
                    required
                  />
                  <div className="line-item-stock-qty">
                    <div className="available-stock-display">
                      <span className="stock-label">Available</span>
                      <span
                        className={`stock-value ${availableStock > 0 ? "stock-positive" : lineItem.item_id ? "stock-zero" : ""}`}
                      >
                        {lineItem.item_id && warehouseId
                          ? `${availableStock} ${selectedItem?.unit_of_measure || ""}`
                          : "-"}
                      </span>
                    </div>
                    <FormInput
                      label="Quantity"
                      name={`quantity_${index}`}
                      type="number"
                      step="0.01"
                      value={lineItem.quantity}
                      onChange={(e) =>
                        handleLineItemChange(
                          index,
                          "quantity",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="line-item-remove"
                  disabled={lineItems.length === 1}
                  title="Remove row"
                  onClick={() => removeLineItem(index)}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {movementType === "ADJUSTMENT" && lineItems.some(li => li.item_id && li.quantity !== 0) && (
        <div style={{ marginTop: "var(--space-lg)", padding: "var(--space-md)", background: "var(--bg-secondary, #f8f9fa)", borderRadius: "var(--radius-md, 8px)", border: "1px solid var(--border-color, #e2e8f0)" }}>
          <h4 style={{ margin: "0 0 var(--space-sm, 8px)", fontSize: "0.9rem", color: "var(--text-secondary, #64748b)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Financial Impact Preview</h4>
          {lineItems.map((li, idx) => {
            if (!li.item_id || li.quantity === 0) return null;
            const item = items.find(i => i.id === parseInt(li.item_id));
            if (!item) return null;
            const cost = parseFloat(item.standard_cost) || 0;
            const value = Math.abs(li.quantity) * cost;
            const isRemoval = li.quantity < 0;
            const typeLabel = isRemoval ? "Inventory Shrinkage (Expense)" : "Inventory Correction (Income)";
            const typeColor = isRemoval ? "#ef4444" : "#22c55e";
            return (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-xs, 4px) 0", borderBottom: "1px solid var(--border-color, #e2e8f0)", fontSize: "0.85rem" }}>
                <div>
                  <strong>{item.item_name}</strong>
                  <span style={{ color: "var(--text-secondary, #64748b)", marginLeft: "8px" }}>
                    {isRemoval ? "-" : "+"}{Math.abs(li.quantity)} {item.unit_of_measure || "units"}
                    {" × "}{cost.toFixed(2)}
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  {cost === 0 ? (
                    <span style={{ color: "#f59e0b", fontSize: "0.8rem" }}>⚠ No standard_cost set</span>
                  ) : (
                    <>
                      <span style={{ fontWeight: 600, color: typeColor }}>{value.toFixed(2)}</span>
                      <br />
                      <span style={{ fontSize: "0.75rem", color: typeColor }}>{typeLabel}</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <FormInput
        label="Remarks"
        name="remarks"
        type="textarea"
        value={formData.remarks}
        onChange={handleChange}
        placeholder="Reason for movement..."
        rows={2}
        style={{ marginTop: "var(--space-md)" }}
      />

      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={mutation.isPending}>
          Record {movementType === "TRANSFER" ? "Transfer" : "Adjustment"}
        </Button>
      </div>
    </form>
  );
}
