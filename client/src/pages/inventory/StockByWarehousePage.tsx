import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { useQuery } from "@tanstack/react-query";
import { AgGridReact } from "ag-grid-react";
import { Package, BarChart3, Building2, TrendingUp, FolderOpen, Activity, Search, X, Download, DollarSign, ArrowLeftRight } from "lucide-react";

import ItemPreview from "./ItemPreview";
import CompactStockByWarehouseCardView from "../../components/common/CompactStockByWarehouseCard";
import SearchableSelect from "../../components/common/SearchableSelect";
import StatCard, { StatsGrid } from "../../components/common/StatCard";
import { useMobileDetection } from "../../hooks/useMobileDetection";
import { useTranslation } from "../../hooks/useTranslation";
import api from "../../utils/api";
import "./StockByWarehousePage.css";

export default function StockByWarehousePage() {
  const { isMobile } = useMobileDetection();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<
    string | number
  >("");
  const [quantityFilter, setQuantityFilter] = useState<
    "all" | "zero" | "nonzero"
  >("nonzero");
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch warehouses for searchable select
  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const response = await api.get("/inventory/warehouses");
      return response.data.data;
    },
  });

  const warehouseOptions = warehouses.map((wh: Warehouse) => ({
    value: wh.id,
    label: `${wh.warehouse_code} - ${wh.warehouse_name}`,
  }));

  const { data: stockBalances = [], isLoading } = useQuery({
    queryKey: ["stock-balances"],
    queryFn: async () => {
      const response = await api.get("/inventory/stock-balances");
      // Filter out items with zero or negative quantity
      return response.data.filter((item) => item.quantity > 0);
    },
  });

  // Fetch item details when a card is clicked
  const { data: selectedItem } = useQuery({
    queryKey: ["item", selectedItemId],
    queryFn: async () => {
      if (!selectedItemId) return null;
      const response = await api.get(`/inventory/items/${selectedItemId}`);
      const item = response.data;
      // Map API response to ItemPreview expected format
      return {
        id: item.id,
        item_code: item.item_code,
        item_name: item.item_name,
        description: item.description,
        category: item.category,
        unit_of_measure: item.unit_of_measure,
        current_stock: item.current_stock || item.quantity || 0,
        standard_cost: item.standard_cost || 0,
        standard_selling_price: item.standard_selling_price || 0,
        reorder_level: item.reorder_level,
        is_raw_material: item.is_raw_material,
        is_finished_good: item.is_finished_good,
        is_purchased: item.is_purchased,
        is_manufactured: item.is_manufactured,
      };
    },
    enabled: !!selectedItemId,
  });

  const filteredStockBalances = useMemo(() => {
    let result = stockBalances;

    // Filter by warehouse if selected
    if (selectedWarehouseId) {
      result = result.filter(
        (item) => item.warehouse_id === selectedWarehouseId,
      );
    }

    // Filter by quantity
    if (quantityFilter === "zero") {
      result = result.filter((item) => item.quantity === 0);
    } else if (quantityFilter === "nonzero") {
      result = result.filter((item) => item.quantity > 0);
    }

    return result;
  }, [stockBalances, selectedWarehouseId, quantityFilter]);

  // Filter by search term
  const searchFilteredBalances = useMemo(() => {
    if (!searchTerm) return filteredStockBalances;
    return filteredStockBalances.filter((item) =>
      item.item_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.item_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [filteredStockBalances, searchTerm]);

  // Calculate statistics
  const stats = {
    totalStockValue: stockBalances.reduce(
      (sum, item) => sum + parseFloat(item.quantity || 0),
      0,
    ),
    totalItems: new Set(stockBalances.map((item) => item.item_id)).size,
    totalWarehouses: new Set(stockBalances.map((item) => item.warehouse_id))
      .size,
    warehouseWithMostStock: stockBalances.reduce(
      (max, item) => (item.quantity > max.quantity ? item : max),
      { warehouse_name: "None", quantity: 0 },
    ),
    multiWarehouseItems: new Set(
      stockBalances
        .map((item) => item.item_id)
        .filter((id, index, arr) => arr.indexOf(id) !== index),
    ).size,
    averageQuantity:
      stockBalances.length > 0
        ? stockBalances.reduce(
            (sum, item) => sum + parseFloat(item.quantity || 0),
            0,
          ) / stockBalances.length
        : 0,
  };

  // Export to CSV
  const handleExport = () => {
    if (stockBalances.length === 0) {
      toast.error("No stock data to export");
      return;
    }

    const headers = [
      "Item Code",
      "Item Name",
      "Warehouse Code",
      "Warehouse Name",
      "Quantity",
      "Unit of Measure",
    ];

    const rows = stockBalances.map((item) => [
      item.item_code,
      item.item_name,
      item.warehouse_code,
      item.warehouse_name,
      item.quantity,
      item.unit_of_measure,
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
      `stock-by-warehouse-${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Stock data exported successfully!");
  };

  const columnDefs = [
    {
      headerName: "Item Code",
      field: "item_code",
      sortable: true,
      filter: true,
      flex: 1,
    },
    {
      headerName: "Item Name",
      field: "item_name",
      sortable: true,
      filter: true,
      flex: 2,
    },
    {
      headerName: "Warehouse Code",
      field: "warehouse_code",
      sortable: true,
      filter: true,
      flex: 1,
    },
    {
      headerName: "Warehouse Name",
      field: "warehouse_name",
      sortable: true,
      filter: true,
      flex: 1.5,
    },
    {
      headerName: "Quantity",
      field: "quantity",
      sortable: true,
      filter: "agNumberColumnFilter",
      flex: 1,
      valueFormatter: (params) =>
        `${parseFloat(params.value).toFixed(2)} ${params.data.unit_of_measure}`,
      cellStyle: (params) => ({
        fontWeight: "bold",
        color: params.value > 0 ? "var(--success)" : "var(--neutral-400)",
      }),
    },
  ];

  const handleRowClick = (data) => {
    setSelectedItemId(data.item_id);
  };

  return (
    <div className="items-page">
      <div className="page-header">
        <div>
<h1>{t('nav.stockByWarehouse')}</h1>
            <p className="page-subtitle">
              {t('stockByWarehouse.viewByWarehouse')}
            </p>
        </div>
      </div>

      {/* Summary Statistics Cards */}
      <StatsGrid className="compact">
        <StatCard icon={Package} label={t('stockByWarehouse.totalItems')} value={stats.totalItems} subtitle={t('stockByWarehouse.itemsWithStock')} />
        <StatCard icon={BarChart3} label={t('common.total')} value={stats.totalStockValue.toFixed(2)} subtitle={t('stockByWarehouse.aggregateQty')} />
        <StatCard icon={Building2} label={t('nav.warehouses')} value={stats.totalWarehouses} subtitle={t('stockByWarehouse.activeLocations')} />
        <StatCard icon={TrendingUp} label={t('stockByWarehouse.largestStock')} value={stats.warehouseWithMostStock.warehouse_name} subtitle={`${stats.warehouseWithMostStock.quantity.toFixed(2)} ${t('common.units')}`} />
        <StatCard icon={FolderOpen} label={t('stockByWarehouse.multiWarehouseItems')} value={stats.multiWarehouseItems} subtitle={t('stockByWarehouse.multipleLocations')} />
        <StatCard icon={Activity} label={t('stockByWarehouse.averageQty')} value={stats.averageQuantity.toFixed(2)} subtitle={t('stockByWarehouse.perStockLine')} />
      </StatsGrid>

      <div className="search-quick-row">
        <div className="search-section">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              className="search-input-field"
              placeholder="Search items..."
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
            <Download className="action-icon" size={24} />
            <span className="action-text">{t('stockByWarehouse.exportCsv')}</span>
          </button>
          <button
            className="quick-action-btn"
            onClick={() => navigate("/inventory/stock-movements")}
            type="button"
          >
            <Activity className="action-icon" size={24} />
            <span className="action-text">{t('nav.stockMovements')}</span>
          </button>
          <button
            className="quick-action-btn"
            onClick={() => navigate("/reports/stock-valuation")}
            type="button"
          >
            <DollarSign className="action-icon" size={24} />
            <span className="action-text">{t('nav.stockValuation')}</span>
          </button>
          <button
            className="quick-action-btn"
            onClick={() => navigate("/reports/inventory-movement")}
            type="button"
          >
            <ArrowLeftRight className="action-icon" size={24} />
            <span className="action-text">{t('nav.inventoryMovement')}</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : isMobile ? (
        <>
          <div className="mobile-search-section">
            <SearchableSelect
              name="warehouse"
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              options={warehouseOptions}
              placeholder={t('stockByWarehouse.allWarehouses')}
            />

            <div className="quantity-filter-section">
              <label className="quantity-filter-label">{t('stockByWarehouse.quantity')}:</label>
              <div className="quantity-filter-options">
                <label className="quantity-filter-option">
                  <input
                    type="radio"
                    name="quantityFilter"
                    value="all"
                    checked={quantityFilter === "all"}
                    onChange={(e) =>
                      setQuantityFilter(
                        e.target.value as "all" | "zero" | "nonzero",
                      )
                    }
                  />
                  <span>{t('stockByWarehouse.all')}</span>
                </label>
                <label className="quantity-filter-option">
                  <input
                    type="radio"
                    name="quantityFilter"
                    value="nonzero"
                    checked={quantityFilter === "nonzero"}
                    onChange={(e) =>
                      setQuantityFilter(
                        e.target.value as "all" | "zero" | "nonzero",
                      )
                    }
                  />
                  <span>{t('stockByWarehouse.stock')}</span>
                </label>
                <label className="quantity-filter-option">
                  <input
                    type="radio"
                    name="quantityFilter"
                    value="zero"
                    checked={quantityFilter === "zero"}
                    onChange={(e) =>
                      setQuantityFilter(
                        e.target.value as "all" | "zero" | "nonzero",
                      )
                    }
                  />
                  <span>{t('stockByWarehouse.zero')}</span>
                </label>
              </div>
            </div>
          </div>

          <CompactStockByWarehouseCardView
            stockData={searchFilteredBalances}
          />

          {filteredStockBalances.length > 0 && (
            <div className="mobile-pagination-info">
              Showing {searchFilteredBalances.length} of {stockBalances.length}{" "}
              stock items
            </div>
          )}
        </>
      ) : (
        <div className="ag-theme-quartz" style={{ height: 600, width: '100%' }}>
          <AgGridReact
            theme="legacy"
            rowData={searchFilteredBalances}
            columnDefs={columnDefs}
            defaultColDef={{
              resizable: true,
              sortable: true,
              filter: true
            }}
            pagination={true}
            paginationPageSize={20}
            paginationPageSizeSelector={[10, 20, 50, 100]}
            onRowClicked={(params) => handleRowClick(params.data)}
            rowSelection={{ mode: 'singleRow' }}
          />
        </div>
      )}

      {/* Item Details Overlay - Mobile Only */}
      {isMobile && selectedItem && (
        <ItemPreview
          item={selectedItem}
          onClose={() => setSelectedItemId(null)}
        />
      )}
    </div>
  );
}
