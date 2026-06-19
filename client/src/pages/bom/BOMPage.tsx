import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MiniERPGrid from "../../components/common/MiniERPGrid";
import {
  ClipboardList,
  CheckCircle,
  Factory,
  AlertTriangle,
  Download,
  Package,
  BarChart3,
  MoreVertical,
  Eye,
  Edit2,
  Trash2,
} from "lucide-react";

import Button from "../../components/common/Button";
import { CompactBOMCardView } from "../../components/common/CompactBOMCard";
import DropdownMenu from "../../components/common/DropdownMenu";
import Modal from "../../components/common/Modal";
import StatCard, { StatsGrid } from "../../components/common/StatCard";
import BOMForm from "../../components/bom/BOMForm";
import BOMDetails from "../../components/bom/BOMDetails";
import { useSettings } from "../../context/SettingsContext";
import { useMobileDetection } from "../../hooks/useMobileDetection";
import { useTranslation } from "../../hooks/useTranslation";
import api from "../../utils/api";
import { createActionColDef } from "../../utils/agGridIntegration";
import type { BOMListItem, BOMStats, BOMDetail } from "../../utils/bomTypes";
import "../inventory/ItemPreview.css";
import "./BOMPage.css";
import "../../styles/ag-grid-status-cells.css";
import { getIsActiveCellClass } from "../../utils/statusCellUtils";

export default function BOMPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBOM, setEditingBOM] = useState<BOMListItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailBOM, setDetailBOM] = useState<BOMListItem | null>(null);
  const [detailBOMData, setDetailBOMData] = useState<BOMDetail | null>(null);
  const [loadingBOMDetail, setLoadingBOMDetail] = useState(false);
  const queryClient = useQueryClient();
  const { formatCurrency } = useSettings();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isMobile } = useMobileDetection();

  const { data: boms = [], isLoading } = useQuery<BOMListItem[]>({
    queryKey: ["boms"],
    queryFn: async () => {
      const response = await api.get("/boms");
      return response.data as BOMListItem[];
    },
  });

  const deleteBomMutation = useMutation({
    mutationFn: async (bomId: number) => {
      return api.delete(`/boms/${bomId}`);
    },
    onSuccess: () => {
      toast.success("BOM deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["boms"] });
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || "Failed to delete BOM");
    },
  });

  const toggleBomStatusMutation = useMutation<any, Error, number>({
    mutationFn: async (bomId: number) => {
      return api.patch(`/boms/${bomId}/toggle-active`);
    },
    onSuccess: (updatedBom: { is_active?: boolean | number }) => {
      const message = updatedBom?.is_active
        ? "BOM activated successfully!"
        : "BOM deactivated successfully!";
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: ["boms"] });
    },
    onError: (error: unknown) => {
      const apiError = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
        : null;
      toast.error(apiError || "Failed to update BOM status");
    },
  });

  const stats: BOMStats = {
    totalBOMs: boms.length,
    activeBOMs: boms.filter((b) => b.is_active === 1 || b.is_active === true).length,
    uniqueFinishedGoods: new Set(
      boms.map((b) => b.finished_item_id).filter(Boolean),
    ).size,
  };

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
      valueFormatter: (params: { value: number; data: BOMListItem }) => `${params.value} ${params.data.finished_uom}`,
    },
    {
      headerName: "Raw Materials",
      field: "item_count",
      sortable: true,
      filter: "agNumberColumnFilter",
      flex: 1,
      valueFormatter: (params: { value: number }) => `${params.value} items`,
    },
    {
      headerName: "Material Cost",
      field: "total_material_cost",
      sortable: true,
      filter: "agNumberColumnFilter",
      flex: 1.5,
      valueFormatter: (params: { value: number }) => formatCurrency(params.value ?? 0),
    },
    {
      headerName: "Status",
      field: "is_active",
      sortable: true,
      filter: true,
      flex: 1,
      cellClass: (params: { value: boolean | number }) => getIsActiveCellClass(params.value),
      cellRenderer: (params: { value: boolean | number }) => params.value ? "Active" : "Inactive",
    },
    createActionColDef({
      cellRenderer: (params: { data: BOMListItem }) => (
        <DropdownMenu
          trigger={
            <button className="action-menu-trigger" title="Actions">
              <MoreVertical size={16} />
            </button>
          }
          items={[
            {
              label: params.data.is_active ? 'Deactivate' : 'Activate',
              icon: <Eye size={16} />,
              onClick: () => handleToggleBomStatus(params.data),
            },
            {
              label: 'Edit',
              icon: <Edit2 size={16} />,
              onClick: async () => {
                try {
                  const response = await api.get(`/boms/${params.data.id}`);
                  setEditingBOM(response.data as BOMListItem);
                  setIsModalOpen(true);
                } catch (error) {
                  toast.error("Failed to load BOM details");
                }
              },
            },
            {
              label: 'Delete',
              icon: <Trash2 size={16} />,
              onClick: () => handleDeleteBom(params.data),
              destructive: true,
            },
          ]}
          align="end"
        />
      ),
    }),
  ];

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
      String(b.quantity),
      String(b.items?.length || b.item_count || 0),
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

  const handleDeleteBom = (bom: BOMListItem) => {
    if (
      window.confirm(`Are you sure you want to delete BOM: ${bom.bom_name}?`)
    ) {
      deleteBomMutation.mutate(bom.id);
    }
  };

  const handleToggleBomStatus = (bom: BOMListItem) => {
    const action = bom.is_active ? "deactivate" : "activate";
    if (
      window.confirm(`Are you sure you want to ${action} BOM: ${bom.bom_name}?`)
    ) {
      toggleBomStatusMutation.mutate(bom.id);
    }
  };

  const handleViewBOM = async (bom: BOMListItem) => {
    setLoadingBOMDetail(true);
    setIsDetailModalOpen(true);
    try {
      const response = await api.get(`/boms/${bom.id}`);
      setDetailBOM(bom);
      setDetailBOMData(response.data as BOMDetail);
    } catch (error) {
      toast.error("Failed to load BOM details");
      setIsDetailModalOpen(false);
    } finally {
      setLoadingBOMDetail(false);
    }
  };

  const handleNew = () => {
    setEditingBOM(null);
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

      <StatsGrid className="compact">
        <StatCard icon={ClipboardList} label="Total BOMs" value={stats.totalBOMs} subtitle="All recipes" />
        <StatCard icon={CheckCircle} label="Active BOMs" value={stats.activeBOMs} subtitle="In use" />
        <StatCard icon={Factory} label="Finished Goods" value={stats.uniqueFinishedGoods} subtitle="Unique products" />
        <StatCard icon={AlertTriangle} label="Inactive BOMs" value={boms.filter((b) => b.is_active === 0 || b.is_active === false).length} subtitle="Not in use" />
      </StatsGrid>

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
          onEdit={async (bom: BOMListItem) => {
            try {
              const response = await api.get(`/boms/${bom.id}`);
              setEditingBOM(response.data as BOMListItem);
              setIsModalOpen(true);
            } catch (error) {
              toast.error("Failed to load BOM details");
            }
          }}
          onToggleStatus={handleToggleBomStatus}
          onDelete={handleDeleteBom}
        />
      ) : (
        <MiniERPGrid
          wrapperClassName="ag-grid-container"
          rowData={boms}
          columnDefs={columnDefs as any}
          defaultColDef={{ resizable: true, sortable: false, filter: false }}
          paginationPageSize={20}
          onRowDoubleClicked={(params: { data: BOMListItem }) => handleViewBOM(params.data)}
        />
      )}

      {isDetailModalOpen && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => { setIsDetailModalOpen(false); setDetailBOM(null); setDetailBOMData(null); }}
          title={detailBOM ? `BOM: ${detailBOM.bom_name}` : 'BOM Details'}
          size="medium"
        >
          {loadingBOMDetail ? (
            <div className="loading"><div className="spinner"></div><p>Loading BOM details...</p></div>
          ) : detailBOMData ? (
            <BOMDetails bom={detailBOMData} />
          ) : (
            <p>Failed to load BOM details.</p>
          )}
        </Modal>
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
            queryClient.invalidateQueries({ queryKey: ["boms"] });
            setIsModalOpen(false);
            setEditingBOM(null);
          }}
        />
      </Modal>
    </div>
  );
}
