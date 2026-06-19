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

import PurchasePreview from "./PurchasePreview";
import PurchaseReturn from "./PurchaseReturn";
import Button from "../../components/common/Button";
import CompactPurchaseCardView from "../../components/common/CompactPurchaseCard";
import DropdownMenu from "../../components/common/DropdownMenu";
import Modal from "../../components/common/Modal";
import StatCard, { StatsGrid } from "../../components/common/StatCard";
import PurchaseForm from "../../components/purchases/PurchaseForm";
import { useSettings } from "../../context/SettingsContext";
import { useMobileDetection } from "../../hooks/useMobileDetection";
import { useTranslation } from "../../hooks/useTranslation";
import api from "../../utils/api";
import { createActionColDef } from "../../utils/agGridIntegration";
import type { Purchase, PurchaseStats } from "../../utils/purchaseTypes";
import "./PurchasesPage.css";

export default function PurchasesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewPurchase, setPreviewPurchase] = useState<Purchase | null>(null);
  const [returnPurchase, setReturnPurchase] = useState<Purchase | null>(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { formatCurrency } = useSettings();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isMobile } = useMobileDetection();

  const { data: purchases = [], isLoading } = useQuery<Purchase[]>({
    queryKey: ["purchases"],
    queryFn: async () => {
      const response = await api.get("/purchases");
      return response.data as Purchase[];
    },
  });

  const stats: PurchaseStats = {
    totalPurchases: purchases.length,
    totalValue: purchases.reduce((sum, p) => sum + parseFloat(String(p.total_cost || 0)), 0),
    totalQuantity: purchases.reduce((sum, p) => sum + parseFloat(String(p.quantity || 0)), 0),
    uniqueSuppliers: new Set(purchases.map((p) => p.supplier_name).filter(Boolean)).size,
    uniqueItems: new Set(purchases.map((p) => p.item_id).filter(Boolean)).size,
    averagePurchaseValue:
      purchases.length > 0
        ? purchases.reduce((sum, p) => sum + parseFloat(String(p.total_cost || 0)), 0) / purchases.length
        : 0,
    largestPurchase:
      purchases.length > 0
        ? purchases.reduce((max, p) =>
            parseFloat(String(p.total_cost || 0)) > parseFloat(String(max.total_cost || 0)) ? p : max,
          )
        : { total_cost: 0, purchase_date: "" },
    recentPurchases: purchases.filter((p) => {
      const purchaseDate = new Date(p.purchase_date);
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      return purchaseDate >= oneMonthAgo;
    }).length,
  };

  const handleExport = () => {
    if (purchases.length === 0) {
      toast.error(t('purchases.noPurchases'));
      return;
    }

    const headers = ["Purchase #", "Date", "Item", "Quantity", "Unit Cost", "Total Cost", "Supplier", "Warehouse"];
    const rows = purchases.map((p) => [
      p.purchase_no,
      format(new Date(p.purchase_date), "yyyy-MM-dd"),
      p.item_name,
      String(p.quantity),
      String(p.unit_cost),
      String(p.total_cost),
      p.supplier_name || "",
      p.warehouse_name || "",
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `purchases-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(t('purchases.exportSuccess') || 'Export completed successfully');
  };

  const returnPurchaseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { quantity: number; reason: string } }) => {
      return api.post(`/purchases/${id}/return`, data);
    },
    onSuccess: () => {
      toast.success('Return processed successfully');
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      setIsReturnModalOpen(false);
      setReturnPurchase(null);
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || 'Failed to process return');
    }
  });

  const handleOpenReturn = (purchase: Purchase) => {
    setReturnPurchase(purchase);
    setIsReturnModalOpen(true);
  };

  const handleSubmitReturn = ({ quantity, reason }: { quantity: number; reason: string }) => {
    if (!returnPurchase) return;
    returnPurchaseMutation.mutate({ id: returnPurchase.id, data: { quantity, reason } });
  };

  const columnDefs = [
    {
      headerName: t('purchases.purchaseNumber'), field: "purchase_no", sortable: true, filter: true, flex: 1,
    },
    {
      headerName: t('purchases.dateCol'), field: "purchase_date", sortable: true,
      filter: "agDateColumnFilter", flex: 1,
      valueFormatter: (params: { value: string }) => format(new Date(params.value), "dd MMM yyyy"),
    },
    { headerName: t('purchases.itemCol'), field: "item_name", sortable: true, filter: true, flex: 2 },
    {
      headerName: t('purchases.quantityCol'), field: "quantity", sortable: true,
      filter: "agNumberColumnFilter", flex: 1,
      valueFormatter: (params: { value: number; data: Purchase }) =>
        `${parseFloat(String(params.value)).toFixed(2)} ${params.data.unit_of_measure || ''}`,
    },
    {
      headerName: t('purchases.unitCost'), field: "unit_cost", sortable: true,
      filter: "agNumberColumnFilter", flex: 1,
      valueFormatter: (params: { value: number }) => formatCurrency(parseFloat(String(params.value))),
    },
    {
      headerName: t('purchases.totalCol'), field: "total_cost", sortable: true,
      filter: "agNumberColumnFilter", flex: 1,
      cellRenderer: (params: { value: number }) => (
        <strong>{formatCurrency(parseFloat(String(params.value)))}</strong>
      ),
    },
    { headerName: t('purchases.supplierCol'), field: "supplier_name", sortable: true, filter: true, flex: 1.5 },
    { headerName: t('purchases.warehouseCol'), field: "warehouse_name", filter: true, flex: 1.5 },
    createActionColDef({
      cellRenderer: (params: { data: Purchase }) => (
        <DropdownMenu
          trigger={<button className="action-menu-trigger" title="Actions"><MoreVertical size={16} /></button>}
          items={[
            { label: 'Return to Supplier', icon: <RotateCcw size={16} />, onClick: () => handleOpenReturn(params.data) },
          ]}
          align="end"
        />
      ),
    }),
  ];

  return (
    <div className="purchases-page">
      <div className="page-header">
        <div>
          <h1>{t('purchases.purchases')}</h1>
          <p className="page-subtitle">{t('purchases.subtitle')}</p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          + {t('purchases.recordPurchase')}
        </Button>
      </div>

      <StatsGrid className="compact">
        <StatCard icon={ShoppingCart} label={t('purchases.totalPurchasesCard')} value={stats.totalPurchases} subtitle={t('purchases.allTransactions')} />
        <StatCard icon={DollarSign} label={t('purchases.totalValueCard')} value={formatCurrency(stats.totalValue)} subtitle={t('purchases.purchaseCost')} />
        <StatCard icon={BarChart3} label={t('purchases.totalQuantityCard')} value={stats.totalQuantity.toFixed(2)} subtitle={t('purchases.aggregateItems')} />
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

      <div className={`quick-actions ${isMobile ? "quick-actions-mobile" : ""}`}>
        <button className="quick-action-btn" onClick={handleExport}>
          <Download className="action-icon" size={isMobile ? 18 : 24} />
          <span className="action-text">{t('purchases.export')}</span>
        </button>
        <button className="quick-action-btn" onClick={() => navigate("/reports/purchase-summary")}>
          <ClipboardList className="action-icon" size={isMobile ? 18 : 24} />
          <span className="action-text">{t('purchases.summary')}</span>
        </button>
        <button className="quick-action-btn" onClick={() => navigate("/reports/stock-valuation")}>
          <Wallet className="action-icon" size={isMobile ? 18 : 24} />
          <span className="action-text">{t('purchases.valuation')}</span>
        </button>
        <button className="quick-action-btn" onClick={() => navigate("/inventory/stock-movements")}>
          <BarChart3 className="action-icon" size={isMobile ? 18 : 24} />
          <span className="action-text">{t('purchases.movements')}</span>
        </button>
        <button className="quick-action-btn" onClick={() => navigate("/inventory/items")}>
          <Package className="action-icon" size={isMobile ? 18 : 24} />
          <span className="action-text">{t('purchases.itemsAction')}</span>
        </button>
        <button className="quick-action-btn" onClick={() => navigate("/purchases/returns")}>
          <RotateCcw className="action-icon" size={isMobile ? 18 : 24} />
          <span className="action-text">{t('purchases.returnHistory')}</span>
        </button>
      </div>

      {isLoading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>{t('purchases.loading')}</p>
        </div>
      ) : isMobile ? (        <CompactPurchaseCardView
          purchases={[...purchases] as any[]}
          onView={(purchase: any) => setPreviewPurchase(purchase)}
          onEdit={(purchase: any) => toast(t('errors.comingSoon'))}
          onReturn={(purchase: any) => handleOpenReturn(purchase)}
        />
      ) : (
        <div className="ag-theme-quartz ag-grid-container">
          <AgGridReact
            rowData={purchases as any[]}
            columnDefs={columnDefs as any}
            defaultColDef={{ resizable: true, sortable: false, filter: false }}
            pagination={true}
            paginationPageSize={20}
            paginationPageSizeSelector={[10, 20, 50, 100]}
            onRowDoubleClicked={(params: { data: Purchase }) => setPreviewPurchase(params.data)}
          />
        </div>
      )}

      {previewPurchase && (
        <PurchasePreview
          purchase={previewPurchase as any}
          onClose={() => setPreviewPurchase(null)}
          onEdit={() => toast(t('errors.comingSoon'))}
          onReturn={() => handleOpenReturn(previewPurchase)}
        />
      )}

      {isReturnModalOpen && returnPurchase && (
        <PurchaseReturn
          purchase={{
            id: returnPurchase.id,
            purchase_no: returnPurchase.purchase_no,
            supplier_name: returnPurchase.supplier_name || '',
            quantity: returnPurchase.quantity,
            rate: returnPurchase.unit_cost,
            amount: returnPurchase.total_cost,
            item_name: returnPurchase.item_name,
            item_code: returnPurchase.item_code || '',
            unit_of_measure: returnPurchase.unit_of_measure || '',
            purchase_date: returnPurchase.purchase_date,
            status: returnPurchase.status || 'Received',
          } as any}
          onClose={() => { setIsReturnModalOpen(false); setReturnPurchase(null); }}
          onSubmit={handleSubmitReturn}
          loading={returnPurchaseMutation.isPending}
        />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('purchases.recordNewPurchase')} size="medium">
        <PurchaseForm
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["purchases"] });
            queryClient.invalidateQueries({ queryKey: ["items"] });
            setIsModalOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}
