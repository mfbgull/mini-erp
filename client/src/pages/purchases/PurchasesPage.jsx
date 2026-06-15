import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AgGridReact } from "ag-grid-react";
import { format } from "date-fns";
import {
  Plus,
  ShoppingCart,
  DollarSign,
  BarChart3,
  Building2,
  Package,
  TrendingUp,
  Gem,
  CalendarDays,
  Download,
  ClipboardList,
  Wallet,
  RotateCcw,
  MoreVertical,
} from "lucide-react";

import DropdownMenu from "../../components/common/DropdownMenu";
import PurchasePreview from "./PurchasePreview";
import PurchaseReturn from "./PurchaseReturn";
import Button from "../../components/common/Button";
import CompactPurchaseCardView from "../../components/common/CompactPurchaseCard";
import StatCard, { StatsGrid } from "../../components/common/StatCard";
import FormInput from "../../components/common/FormInput";
import Modal from "../../components/common/Modal";
import { useSettings } from "../../context/SettingsContext";
import { useFormValidation } from "../../hooks/useFormValidation";
import { useMobileDetection } from "../../hooks/useMobileDetection";
import { useTranslation } from "../../hooks/useTranslation";
import { purchaseSchema } from "../../schemas";
import api from "../../utils/api";
import "./PurchasesPage.css";

export default function PurchasesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewPurchase, setPreviewPurchase] = useState(null);
  const [returnPurchase, setReturnPurchase] = useState(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { formatCurrency } = useSettings();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isMobile } = useMobileDetection();

  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ["purchases"],
    queryFn: async () => {
      const response = await api.get("/purchases");
      return response.data;
    },
  });

  // Calculate statistics
  const stats = {
    totalPurchases: purchases.length,
    totalValue: purchases.reduce(
      (sum, p) => sum + parseFloat(p.total_cost || 0),
      0,
    ),
    totalQuantity: purchases.reduce(
      (sum, p) => sum + parseFloat(p.quantity || 0),
      0,
    ),
    uniqueSuppliers: new Set(
      purchases.map((p) => p.supplier_name).filter(Boolean),
    ).size,
    uniqueItems: new Set(purchases.map((p) => p.item_id).filter(Boolean)).size,
    averagePurchaseValue:
      purchases.length > 0
        ? purchases.reduce((sum, p) => sum + parseFloat(p.total_cost || 0), 0) /
          purchases.length
        : 0,
    largestPurchase:
      purchases.length > 0
        ? purchases.reduce((max, p) =>
            parseFloat(p.total_cost || 0) > parseFloat(max.total_cost || 0)
              ? p
              : max,
          )
        : { total_cost: 0 },
    recentPurchases: purchases.filter((p) => {
      const purchaseDate = new Date(p.purchase_date);
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      return purchaseDate >= oneMonthAgo;
    }).length,
  };

  // Export to CSV
  const handleExport = () => {
    if (purchases.length === 0) {
      toast.error(t('purchases.noPurchases'));
      return;
    }

    const headers = [
      "Purchase #",
      "Date",
      "Item",
      "Quantity",
      "Unit Cost",
      "Total Cost",
      "Supplier",
      "Warehouse",
    ];

    const rows = purchases.map((p) => [
      p.purchase_no,
      format(new Date(p.purchase_date), "yyyy-MM-dd"),
      p.item_name,
      p.quantity,
      p.unit_cost,
      p.total_cost,
      p.supplier_name || "",
      p.warehouse_name || "",
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
      `purchases-${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(t('purchases.purchaseSaved'));
  };

  // Return purchase mutation
  const returnPurchaseMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return api.post(`/purchases/${id}/return`, data);
    },
    onSuccess: () => {
      toast.success('Return processed successfully');
      queryClient.invalidateQueries(['purchases']);
      setIsReturnModalOpen(false);
      setReturnPurchase(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to process return');
    }
  });

  const handleOpenReturn = (purchase) => {
    setReturnPurchase(purchase);
    setIsReturnModalOpen(true);
  };

  const handleSubmitReturn = ({ quantity, reason }) => {
    if (!returnPurchase) return;
    returnPurchaseMutation.mutate({
      id: returnPurchase.id,
      data: { quantity, reason }
    });
  };

  const columnDefs = [
    {
      headerName: t('purchases.purchaseNumber'),
      field: "purchase_no",
      sortable: true,
      filter: true,
      flex: 1,
    },
    {
      headerName: t('purchases.dateCol'),
      field: "purchase_date",
      sortable: true,
      filter: "agDateColumnFilter",
      flex: 1,
      valueFormatter: (params) => format(new Date(params.value), "dd MMM yyyy"),
    },
    {
      headerName: t('purchases.itemCol'),
      field: "item_name",
      sortable: true,
      filter: true,
      flex: 2,
    },
    {
      headerName: t('purchases.quantityCol'),
      field: "quantity",
      sortable: true,
      filter: "agNumberColumnFilter",
      flex: 1,
      valueFormatter: (params) =>
        `${parseFloat(params.value).toFixed(2)} ${params.data.unit_of_measure}`,
    },
    {
      headerName: t('purchases.unitCost'),
      field: "unit_cost",
      sortable: true,
      filter: "agNumberColumnFilter",
      flex: 1,
      valueFormatter: (params) => formatCurrency(parseFloat(params.value)),
    },
    {
      headerName: t('purchases.totalCol'),
      field: "total_cost",
      sortable: true,
      filter: "agNumberColumnFilter",
      flex: 1,
      cellRenderer: (params) => (
        <strong>{formatCurrency(parseFloat(params.value))}</strong>
      ),
    },
    {
      headerName: t('purchases.supplierCol'),
      field: "supplier_name",
      sortable: true,
      filter: true,
      flex: 1.5,
      valueFormatter: (params) => params.value || "—",
    },
    {
      headerName: t('purchases.warehouseCol'),
      field: "warehouse_name",
      filter: true,
      flex: 1.5,
    },
    {
      headerName: 'Actions',
      field: 'actions',
      width: 70,
      sortable: false,
      filter: false,
      cellRenderer: (params) => (
        <DropdownMenu
          trigger={
            <button className="action-menu-trigger" title="Actions">
              <MoreVertical size={16} />
            </button>
          }
          items={[
            { label: 'Return to Supplier', icon: <RotateCcw size={16} />, onClick: () => handleOpenReturn(params.data) },
          ]}
          align="end"
        />
      ),
    },
  ];

  const handleNew = () => {
    setIsModalOpen(true);
  };

  return (
    <div className="purchases-page">
      <div className="page-header">
        <div>
          <h1>{t('purchases.purchases')}</h1>
          <p className="page-subtitle">
            {t('purchases.subtitle')}
          </p>
        </div>
        <Button variant="primary" onClick={handleNew}>
          + {t('purchases.recordPurchase')}
        </Button>
      </div>

      {/* Summary Statistics Cards */}
      <StatsGrid className="compact">
        <StatCard icon={ShoppingCart} label={t('purchases.totalPurchasesCard')} value={stats.totalPurchases} subtitle={t('purchases.allTransactions')} />
        <StatCard icon={DollarSign} label={t('purchases.totalValueCard')} value={formatCurrency(stats.totalValue)} subtitle={t('purchases.purchaseCost')} />
        <StatCard icon={BarChart3} label={t('purchases.totalQuantityCard')} value={parseFloat(stats.totalQuantity).toFixed(2)} subtitle={t('purchases.aggregateItems')} />
        <StatCard icon={Building2} label={t('purchases.suppliersCard')} value={stats.uniqueSuppliers} subtitle={t('purchases.uniqueVendors')} />
        <StatCard icon={Package} label={t('purchases.itemsCard')} value={stats.uniqueItems} subtitle={t('purchases.productsPurchased')} />
        <StatCard icon={TrendingUp} label={t('purchases.averageValue')} value={formatCurrency(stats.averagePurchaseValue)} subtitle={t('purchases.perPurchase')} />
        <StatCard
          icon={Gem}
          label={t('purchases.largestPurchase')}
          value={stats.largestPurchase.total_cost ? formatCurrency(stats.largestPurchase.total_cost) : t('purchases.noPurchasesYet')}
          subtitle={stats.largestPurchase.total_cost ? `${formatCurrency(stats.largestPurchase.total_cost)} on ${format(new Date(stats.largestPurchase.purchase_date), "MMM dd")}` : t('purchases.noPurchasesYet')}
          style={!isMobile ? { fontSize: "1.4rem" } : undefined}
        />
        <StatCard
          icon={CalendarDays}
          label={t('purchases.recent30Days')}
          value={stats.recentPurchases}
          subtitle={t('purchases.lastMonth')}
          style={{ borderColor: stats.recentPurchases > 0 ? "#f5af19" : undefined }}
        />
      </StatsGrid>

      {/* Quick Actions */}
      <div
        className={`quick-actions ${isMobile ? "quick-actions-mobile" : ""}`}
      >
        <button className="quick-action-btn" onClick={handleExport}>
          <Download className="action-icon" size={isMobile ? 18 : 24} />
          <span className="action-text">{t('purchases.export')}</span>
        </button>
        <button
          className="quick-action-btn"
          onClick={() => navigate("/reports/purchase-summary")}
        >
          <ClipboardList className="action-icon" size={isMobile ? 18 : 24} />
          <span className="action-text">{t('purchases.summary')}</span>
        </button>
        <button
          className="quick-action-btn"
          onClick={() => navigate("/reports/stock-valuation")}
        >
          <Wallet className="action-icon" size={isMobile ? 18 : 24} />
          <span className="action-text">{t('purchases.valuation')}</span>
        </button>
        <button
          className="quick-action-btn"
          onClick={() => navigate("/inventory/stock-movements")}
        >
          <BarChart3 className="action-icon" size={isMobile ? 18 : 24} />
          <span className="action-text">{t('purchases.movements')}</span>
        </button>
        <button
          className="quick-action-btn"
          onClick={() => navigate("/inventory/items")}
        >
          <Package className="action-icon" size={isMobile ? 18 : 24} />
          <span className="action-text">{t('purchases.itemsAction')}</span>
        </button>
        <button
          className="quick-action-btn"
          onClick={() => navigate("/purchases/returns")}
        >
          <RotateCcw className="action-icon" size={isMobile ? 18 : 24} />
          <span className="action-text">{t('purchases.returnHistory')}</span>
        </button>
      </div>

      {isLoading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>{t('purchases.loading')}</p>
        </div>
      ) : isMobile ? (
        <CompactPurchaseCardView
          purchases={purchases}
          onView={(purchase) => setPreviewPurchase(purchase)}
          onEdit={(purchase) => {
            // For now, navigate to a hypothetical edit page or open modal
            // Could implement inline edit or navigate to edit page
            toast.info(t('errors.comingSoon'));
          }}
          onNew={handleNew}
          onReturn={handleOpenReturn}
        />
      ) : (
        <div className="ag-theme-quartz ag-grid-container">
          <AgGridReact theme="legacy"
            rowData={purchases}
            columnDefs={columnDefs}
            defaultColDef={{
              theme:"legacy",
              resizable: true,
              sortable: false,
              filter: false,
            }}
            pagination={true}
            paginationPageSize={20}
            paginationPageSizeSelector={[10, 20, 50, 100]}
            onRowDoubleClicked={(params) => setPreviewPurchase(params.data)}
          />
        </div>
      )}

      {/* Mobile Preview Modal */}
      {previewPurchase && (
        <PurchasePreview
          purchase={previewPurchase}
          onClose={() => setPreviewPurchase(null)}
          onEdit={() => {
            toast.info(t('errors.comingSoon'));
          }}
          onReturn={() => handleOpenReturn(previewPurchase)}
        />
      )}

      {/* Purchase Return Modal */}
      {isReturnModalOpen && returnPurchase && (
        <PurchaseReturn
          purchase={{
            id: returnPurchase.id,
            purchase_no: returnPurchase.purchase_no,
            supplier_name: returnPurchase.supplier_name,
            quantity: returnPurchase.quantity,
            rate: returnPurchase.unit_cost,
            amount: returnPurchase.total_cost,
            item_name: returnPurchase.item_name,
            item_code: returnPurchase.item_code || '',
            unit_of_measure: returnPurchase.unit_of_measure,
            purchase_date: returnPurchase.purchase_date,
            status: returnPurchase.status || 'Received',
          }}
          onClose={() => {
            setIsReturnModalOpen(false);
            setReturnPurchase(null);
          }}
          onSubmit={handleSubmitReturn}
          loading={returnPurchaseMutation.isPending}
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('purchases.recordNewPurchase')}
        size="medium"
      >
        <PurchaseForm
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries(["purchases"]);
            queryClient.invalidateQueries(["items"]);
            setIsModalOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}

function PurchaseForm({ onClose, onSuccess }) {
  const { formatCurrency } = useSettings();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    item_id: "",
    warehouse_id: "",
    quantity: "",
    unit_cost: "",
    supplier_name: "",
    purchase_date: new Date().toISOString().split("T")[0],
    invoice_no: "",
    remarks: "",
  });

  const { errors, validate, clearErrors } = useFormValidation(purchaseSchema);

  // Fetch items
  const { data: items = [] } = useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      const response = await api.get("/inventory/items");
      return response.data.data;
    },
  });

  // Fetch warehouses
  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const response = await api.get("/inventory/warehouses");
      return response.data.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      return api.post("/purchases", data);
    },
    onSuccess: () => {
      toast.success(t('purchases.purchaseSaved'));
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || t('errors.failed'));
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

  const handleSubmit = (e) => {
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

  const totalCost =
    formData.quantity && formData.unit_cost
      ? (
          parseFloat(formData.quantity) * parseFloat(formData.unit_cost)
        ).toFixed(2)
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
