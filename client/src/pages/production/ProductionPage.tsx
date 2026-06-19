import { useState } from "react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { AgGridReact } from "ag-grid-react";
import {
  Search,
  Factory,
  ClipboardList,
  Calendar,
} from "lucide-react";

import Button from "../../components/common/Button";
import { CompactProductionCardView } from "../../components/common/CompactProductionCard";
import Modal from "../../components/common/Modal";
import StatCard, { StatsGrid } from "../../components/common/StatCard";
import { useMobileDetection } from "../../hooks/useMobileDetection";
import { useTranslation } from "../../hooks/useTranslation";
import { useProductionPageData } from "../../hooks/useProductionData";
import { useDeleteProduction } from "../../hooks/useProductionMutations";
import { getProductionColumnDefs } from "../../components/production/ProductionColumnDefs";
import ProductionForm from "../../components/production/ProductionForm";
import ProductionDetails from "../../components/production/ProductionDetails";
import api from "../../utils/api";
import type { ProductionStub, ProductionRecord } from "../../utils/productionTypes";
import "../inventory/ItemPreview.css";
import "./ProductionPage.css";

export default function ProductionPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProduction, setEditingProduction] = useState<ProductionRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailProduction, setDetailProduction] = useState<ProductionStub | null>(null);
  const [detailData, setDetailData] = useState<ProductionRecord | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const queryClient = useQueryClient();
  const { isMobile } = useMobileDetection();
  const { t } = useTranslation();

  const { productions, isLoading, error, isError } = useProductionPageData();
  const deleteMutation = useDeleteProduction();

  const filteredProductions = productions.filter(
    (production: ProductionStub) =>
      production.production_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      production.output_item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      production.finished_goods_warehouse_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const now = new Date();
  const productionsThisMonth = productions.filter((p: ProductionStub) => {
    const d = new Date(p.production_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const productionsThisWeek = productions.filter((p: ProductionStub) => new Date(p.production_date) >= weekAgo).length;

  const handleDeleteProduction = (production: ProductionStub) => {
    if (window.confirm(`Are you sure you want to delete production: ${production.production_no}?`)) {
      deleteMutation.mutate(production.id);
    }
  };

  const handleEditProduction = async (production: ProductionStub) => {
    try {
      const response = await api.get(`/productions/${production.id}`);
      setEditingProduction(response.data);
      setIsModalOpen(true);
    } catch {
      toast.error("Failed to load production details");
    }
  };

  const handleNew = () => {
    setEditingProduction(null);
    setIsModalOpen(true);
  };

  const handleViewProduction = async (production: ProductionStub) => {
    setLoadingDetail(true);
    setIsDetailModalOpen(true);
    try {
      const response = await api.get(`/productions/${production.id}`);
      setDetailProduction(production);
      setDetailData(response.data as any);
    } catch {
      toast.error("Failed to load production details");
      setIsDetailModalOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const columnDefs = getProductionColumnDefs(handleDeleteProduction);

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['productions'] });
    queryClient.invalidateQueries({ queryKey: ['items'] });
    setIsModalOpen(false);
    setEditingProduction(null);
  };

  return (
    <div className="production-page">
      <div className="page-header">
        <div>
          <h1>{t('production.production')}</h1>
          <p className="page-subtitle">
            Record manufacturing and track production output
          </p>
        </div>
        <Button variant="primary" onClick={handleNew}>
          + Record Production
        </Button>
      </div>

      {isLoading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading production records...</p>
        </div>
      ) : isError ? (
        <div className="error-state">
          <p>Error loading production records. Please try again.</p>
          <p>{error && typeof error === 'object' && 'message' in error ? (error as { message: string }).message : 'Unknown error occurred'}</p>
        </div>
      ) : (
        <>
          <StatsGrid className="compact">
            <StatCard icon={ClipboardList} label="Total Productions" value={productions.length} subtitle="All records" />
            <StatCard icon={Factory} label="This Month" value={productionsThisMonth} subtitle="Productions" />
            <StatCard icon={Calendar} label="This Week" value={productionsThisWeek} subtitle="Productions" />
          </StatsGrid>

          <div className="production-search-container">
            <div className="search-box">
              <Search size={20} className="search-icon" />
              <input
                type="text"
                placeholder="Search by production #, item, or warehouse..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button
                  className="search-clear"
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
            <span className="search-results-count">
              {filteredProductions.length} of {productions.length} productions
            </span>
          </div>

          {isMobile ? (
            <CompactProductionCardView
              productions={filteredProductions}
              onEdit={handleEditProduction}
              onDelete={(id: number) => {
                const prod = productions.find((p: ProductionStub) => p.id === id);
                if (prod) handleDeleteProduction(prod);
              }}
            />
          ) : (
            <>
              <div className="ag-theme-quartz ag-grid-container">
                <AgGridReact
                  rowData={filteredProductions}
                  columnDefs={columnDefs as any}
                  defaultColDef={{
                    resizable: true,
                    sortable: false,
                    filter: false,
                  }}
                  pagination={true}
                  paginationPageSize={20}
                  paginationPageSizeSelector={[10, 20, 50, 100]}
                  rowSelection={{ mode: "singleRow" }}
                  onRowDoubleClicked={(params: { data: ProductionStub }) => handleViewProduction(params.data)}
                />
              </div>

              {filteredProductions.length === 0 && searchTerm && (
                <div className="no-results">
                  <p>No productions found matching "{searchTerm}"</p>
                  <Button variant="secondary" onClick={() => setSearchTerm("")}>
                    Clear Search
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Production Details Modal */}
      {isDetailModalOpen && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => { setIsDetailModalOpen(false); setDetailProduction(null); setDetailData(null); }}
          title={detailProduction ? `Production: ${detailProduction.production_no}` : 'Production Details'}
          size="large"
        >
          {loadingDetail ? (
            <div className="loading"><div className="spinner"></div><p>Loading details...</p></div>
          ) : detailData ? (
            <ProductionDetails production={detailData as any} />
          ) : (
            <p>Failed to load production details.</p>
          )}
        </Modal>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduction(null);
        }}
        title={editingProduction ? "Edit Production" : "Record Production"}
        size="large"
      >
        <ProductionForm
          production={editingProduction as any}
          onClose={() => {
            setIsModalOpen(false);
            setEditingProduction(null);
          }}
          onSuccess={handleFormSuccess}
        />
      </Modal>
    </div>
  );
}
