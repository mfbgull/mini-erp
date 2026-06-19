import { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useQuery } from "@tanstack/react-query";
import MiniERPGrid from "../../components/common/MiniERPGrid";
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

import StockMovementPreview from "./StockMovementPreview";
import Button from "../../components/common/Button";
import CompactStockMovementCardView from "../../components/common/CompactStockMovementCard";
import Modal from "../../components/common/Modal";
import StatCard, { StatsGrid } from "../../components/common/StatCard";
import QuickActionsPanel from "../../components/layout/QuickActionsPanel";
import StockAdjustmentForm from "../../components/inventory/StockAdjustmentForm";
import { useSettings } from "../../context/SettingsContext";
import { useMobileDetection } from "../../hooks/useMobileDetection";
import { useTranslation } from "../../hooks/useTranslation";
import api from "../../utils/api";
import type { StockMovement } from "../../utils/stockMovementTypes";
import "./StockMovementPage.css";

interface MovementStats {
  totalMovements: number;
  totalIn: number;
  totalOut: number;
  totalQuantity: number;
  mostActiveType: Record<string, number>;
  movementsByType: {
    PURCHASE: number;
    SALE: number;
    PRODUCTION: number;
    TRANSFER: number;
    ADJUSTMENT: number;
  };
}

export default function StockMovementPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [previewMovement, setPreviewMovement] = useState<StockMovement | null>(null);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const { formatCurrency } = useSettings();
  const { isMobile } = useMobileDetection();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isMobile) return;
    document.body.classList.add('sm-page-mobile');
    return () => {
      document.body.classList.remove('sm-page-mobile');
    };
  }, [isMobile]);

  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: movements = [], isLoading } = useQuery<StockMovement[]>({
    queryKey: ["stock-movements"],
    queryFn: async () => {
      const response = await api.get("/inventory/stock-movements", {
        params: { limit: 100 },
      });
      return response.data as StockMovement[];
    },
  });

  const stats: MovementStats = {
    totalMovements: movements.length,
    totalIn: movements.filter((m) => m.quantity > 0).length,
    totalOut: movements.filter((m) => m.quantity < 0).length,
    totalQuantity: movements.reduce(
      (sum, m) => sum + Math.abs(parseFloat(String(m.quantity || 0))),
      0,
    ),
    mostActiveType: movements.reduce<Record<string, number>>((counts, m) => {
      counts[m.movement_type] = (counts[m.movement_type] || 0) + 1;
      return counts;
    }, {}),
    movementsByType: {
      PURCHASE: movements.filter((m) => m.movement_type === "PURCHASE").length,
      SALE: movements.filter((m) => m.movement_type === "SALE").length,
      PRODUCTION: movements.filter((m) => m.movement_type === "PRODUCTION").length,
      TRANSFER: movements.filter((m) => m.movement_type === "TRANSFER").length,
      ADJUSTMENT: movements.filter((m) => m.movement_type === "ADJUSTMENT").length,
    },
  };

  const filteredMovements = movements.filter((m) =>
    m.movement_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.item_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.movement_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const mostActiveType = useMemo(() => {
    if (movements.length === 0) return "None";
    const typeCount = movements.reduce<Record<string, number>>((counts, m) => {
      counts[m.movement_type] = (counts[m.movement_type] || 0) + 1;
      return counts;
    }, {});
    return (
      Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "None"
    );
  }, [movements]);

  const handleExport = () => {
    if (movements.length === 0) {
      toast.error("No movements to export");
      return;
    }

    const headers = [
      "Movement No", "Date", "Item Code", "Item Name",
      "Warehouse", "Type", "Quantity", "Unit", "Remarks",
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
    link.setAttribute("download", `stock-movements-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Movements exported successfully!");
  };

  const columnDefs = [
    {
      headerName: "Movement No", field: "movement_no", sortable: true, filter: true, flex: 1,
    },
    {
      headerName: "Date", field: "movement_date", sortable: true,
      filter: "agDateColumnFilter", flex: 1,
      valueFormatter: (params: { value: string }) => format(new Date(params.value), "dd MMM yyyy"),
    },
    { headerName: "Item Code", field: "item_code", filter: true, flex: 1 },
    { headerName: "Item Name", field: "item_name", filter: true, flex: 2 },
    {
      headerName: "Quantity", field: "quantity", sortable: true,
      filter: "agNumberColumnFilter", flex: 1.5,
      cellRenderer: (params: { value: number; data: StockMovement }) => (
        <span className={params.value >= 0 ? "qty-in" : "qty-out"}>
          {params.value >= 0 ? "+" : ""}
          {parseFloat(String(params.value)).toFixed(2)} {params.data.unit_of_measure}
        </span>
      ),
    },
    { headerName: "Warehouse", field: "warehouse_name", filter: true, flex: 1.5 },
    {
      headerName: "Type", field: "movement_type", sortable: true, filter: true, flex: 1,
      cellRenderer: (params: { value: string }) => (
        <span className="status-tag">{params.value}</span>
      ),
    },
    {
      headerName: "Batch", field: "batch_no", sortable: true, filter: true, flex: 1,
      cellRenderer: (params: { value: string }) => (
        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: params.value ? '#6366f1' : '#9ca3af' }}>
          {params.value || '—'}
        </span>
      ),
    },
    {
      headerName: "Cost", field: "unit_cost", sortable: true,
      filter: 'agNumberColumnFilter', flex: 1,
      valueFormatter: (params: { value: number }) => params.value != null ? params.value.toFixed(2) : '—',
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

      <StatsGrid className="compact">
        <StatCard icon={Package} label={t('stockMovements.totalMovements')} value={stats.totalMovements} subtitle={t('stockMovements.allTransactions')} />
        <StatCard icon={ArrowDown} label={t('common.totalIn')} value={stats.totalIn} subtitle={t('stockMovements.stockAdditions')} />
        <StatCard icon={ArrowUp} label={t('common.totalOut')} value={stats.totalOut} subtitle={t('stockMovements.stockReductions')} />
        <StatCard icon={BarChart3} label={t('stockMovements.totalQuantity')} value={stats.totalQuantity.toFixed(2)} subtitle={t('stockMovements.aggregateMoved')} />
        <StatCard icon={TrendingUp} label={t('stockMovements.mostActiveType')} value={mostActiveType}              subtitle={mostActiveType !== "None" ? `${t('stockMovements.count')}: ${stats.movementsByType[mostActiveType as keyof typeof stats.movementsByType]}` : t('stockMovements.noMovements')} />
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
          <button className="quick-action-btn" onClick={() => navigate("/reports/inventory-movement")} type="button">
            <ClipboardList className="action-icon" size={16} />
            <span className="action-text">{t('stockMovements.movementReport')}</span>
          </button>
          <button className="quick-action-btn" onClick={() => navigate("/reports/stock-valuation")} type="button">
            <Wallet className="action-icon" size={16} />
            <span className="action-text">{t('stockMovements.stockValuation')}</span>
          </button>
          <button className="quick-action-btn" onClick={() => navigate("/inventory/stock-by-warehouse")} type="button">
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
          <CompactStockMovementCardView movements={filteredMovements as any[]} />
          <div className="mobile-action-bar">
            <Button variant="primary" onClick={() => setIsQuickActionsOpen(true)} className="fab-button fab-button--quick-actions">
              <Plus size={16} />
              {t('dashboard.quickActions')}
            </Button>
            <Button variant="secondary" onClick={() => setIsModalOpen(true)} className="fab-button">
              + {t('stockMovements.newAdjustment')}
            </Button>
          </div>
          <QuickActionsPanel isOpen={isQuickActionsOpen} onClose={() => setIsQuickActionsOpen(false)} />
        </>
      ) : (
        <MiniERPGrid
          rowData={[...filteredMovements] as any[]}
          columnDefs={columnDefs as any}
          defaultColDef={{ resizable: true, sortable: false, filter: false }}
          paginationPageSize={20}
          paginationPageSizeSelector={[10, 20, 50, 100]}
          onRowDoubleClicked={(params: { data: StockMovement }) => setPreviewMovement(params.data)}
        />
      )}

      {previewMovement && (
        <StockMovementPreview
          movement={previewMovement as any}
          onClose={() => setPreviewMovement(null)}
        />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Stock Movement" size="large">
        <StockAdjustmentForm
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
