# Forecasting & Demand Planning — Specification

> **Status:** Draft  
> **Date:** 2026-06-24  
> **Author:** Buffy (AI agent), derived from user interviews  
> **Project:** MiniERP  

---

## 1. Overview

Improve the existing demand forecasting module with multi-algorithm support, seasonal detection, forecast accuracy tracking, purchase order integration, safety stock calculations, and auto-learning from past errors. The feature will be rolled out in phases, with **Phase 1** covering backend algorithm improvements and fundamental accuracy tracking.

---

## 2. Business Goals (User-Confirmed)

| Priority | Goal |
|----------|------|
| P0 | Better reorder recommendations |
| P0 | Forecast accuracy tracking |
| P0 | Purchase order generation from reorder recs |
| P0 | Multi-algorithm forecasting |
| P0 | Seasonal demand pattern detection |
| P0 | Safety stock calculation |

---

## 3. Item Scope

**All active inventory items** (not just finished goods). Every active item in the `items` table (`is_active = 1`) will get a forecast. This expands from the current scope of `is_finished_good = 1` only.

---

## 4. Forecasting Algorithms (Phase 1)

### 4.1 Supported Models
All to be implemented server-side, selectable per item category or per item:

| Algorithm | Description | Use Case |
|-----------|-------------|----------|
| **Weighted Moving Average (WMA)** ✅ (existing) | Currently implemented with weights [0.5, 0.3, 0.2] over last 3 periods | Default baseline |
| **Simple Exponential Smoothing (SES)** | α-weighted average; α controls how much weight is given to recent vs distant data | No trend, no seasonality |
| **Holt's Linear Trend** | Double exponential smoothing with trend component | Data with clear upward/downward movement |
| **Holt-Winters (Seasonal)** | Triple exponential smoothing with trend + seasonality | Monthly/quarterly seasonal patterns |
| **ARIMA / SARIMA** | Auto-Regressive Integrated Moving Average | Complex patterns; fallback for best accuracy |

### 4.2 Model Selection Strategy
- **Default model:** WMA (backward compatible)
- **Auto-select:** System suggests best model based on historical accuracy (lowest MAPE over trailing 6 months)
- **User override:** Per-item or per-category model selection via UI

### 4.3 Time Horizons
Keep the current three horizons:
- **Next Week** (monthly avg / 4)
- **Next Month** (monthly avg)
- **Next Quarter** (monthly avg × 3)

---

## 5. Seasonal Demand Patterns

### 5.1 Auto-Detection
- Algorithmically detect repeating patterns from **12+ months of data**
- Decompose time series into: trend + seasonal + residual components
- Support monthly, quarterly, and yearly seasonality

### 5.2 Manual Override
- Users can tag items/categories with seasonality profiles
- Override auto-detected patterns

### 5.3 Calendar-Based Events
- Incorporate known events (Eid, Ramadan, New Year, Back-to-School, Black Friday, etc.)
- Configurable event list with date ranges and impact multipliers
- Impact: e.g., `multiplier = 1.5` means 50% above baseline during event period
- Events taper off (impact decays before/after event window)

---

## 6. Forecast Accuracy Tracking

### 6.1 Metrics (All of the above)
| Metric | What It Measures |
|--------|-----------------|
| **MAPE** (Mean Absolute Percentage Error) | Percentage-based — most intuitive |
| **MAE** (Mean Absolute Error) | Absolute difference — easy to interpret |
| **sMAPE** (Symmetric MAPE) | Symmetric version of MAPE, avoids division-by-zero issues |

### 6.2 Historical Storage
- Store every generated prediction with a unique `forecast_run_id`
- When actual sales data becomes available (period closes), compute and store accuracy metrics
- Schema addition: `forecast_accuracy` table with columns:
  - `forecast_run_id`, `item_id`, `period_start`, `period_end`
  - `predicted_quantity`, `actual_quantity`
  - `mape`, `mae`, `smape`
  - `model_type`
  - `is_calibrated` (was this a user override?)

### 6.3 Data Retention
- **Retain indefinitely** with option to bulk-delete old records via a settings action

### 6.4 Auto-Learning / Bias Correction
- If forecasts consistently overestimate or underestimate by >X%, auto-apply correction factor
- Correction: `adjusted_forecast = raw_forecast × (1 - bias_factor)`
- Bias factor = rolling average of `(actual - predicted) / predicted` over last 3 months
- User can disable auto-learning per item

---

## 7. Safety Stock Calculation

### 7.1 Formula
```
Safety Stock = Z × √(LT_avg × σ²_demand + σ²_LT × D_avg²)
```
Where:
| Variable | Source |
|----------|--------|
| `Z` | Service level z-score (e.g., 95% → 1.65) |
| `LT_avg` | Average supplier lead time (default: 7 days; configurable) |
| `σ²_demand` | Variance of demand over lead time window |
| `σ²_LT` | Variance of lead time (default: 0 until data available) |
| `D_avg` | Average daily demand |

### 7.2 Input Factors (All user-selected)
- ✅ Demand variability
- ✅ Lead time variability (default until we add supplier lead times)
- ✅ Service level target (configurable per item class)
- ✅ Forecast error (MAPE/MAE)
- ✅ Item criticality / ABC classification

### 7.3 Service Level Targets
| ABC Class | Service Level | Z-Score |
|-----------|---------------|---------|
| A (high value) | 95% | 1.65 |
| B (medium value) | 90% | 1.28 |
| C (low value) | 85% | 1.04 |

---

## 8. Reorder Recommendations (Enhanced)

### 8.1 Current Logic (Keep as baseline)
```
ratio = currentStock / predictedDemand(nextMonth)
ratio < 0.3  → order_now
ratio < 0.5  → order_soon
ratio < 1.0  → monitor
else         → adequate
```

### 8.2 Enhanced Reorder Logic
```
reorderPoint = safetyStock + (dailyDemand × leadTime)
ratio = (currentStock - reorderPoint) / predictedDemand
```

If `currentStock <= reorderPoint` → **order_now**  
If `currentStock <= reorderPoint × 1.3` → **order_soon**  
Otherwise — same as current thresholds.

### 8.3 Recommendation Levels (Unchanged)
`order_now` | `order_soon` | `monitor` | `adequate`

---

## 9. Purchase Order Generation (Phase 2)

### 9.1 Approach: Semi-Automatic
- Show reorder recommendations with suggested order quantities
- User selects items to reorder → system auto-creates **draft purchase orders**
- Draft POs are grouped by supplier
- User reviews/adjusts PO drafts before submitting

### 9.2 Suggested Order Quantity
```
orderQty = max(reorderQty - currentStock + safetyStock, economicOrderQty)
```
Where:
- `reorderQty` = predicted next month demand
- `currentStock` = current inventory level
- `safetyStock` = calculated safety stock
- `economicOrderQty` = optional; configurable per item

---

## 10. Additional Data Sources

Currently: **invoice data only**

**Add:**
- **Purchase orders (incoming stock):** Deduct incoming PO quantities from net requirements
- **Production plans (BOM-based):** Consider planned production output as future supply

Keep it additive — invoice data stays primary; other sources are supplementary.

---

## 11. User Interface

### 11.1 New / Enhanced Pages

| Page | Description | Phase |
|------|-------------|-------|
| **Forecast Accuracy Dashboard** | Compare predicted vs actual with MAPE/MAE over time; drill-down per item | Phase 1 |
| **Bulk Forecast Override Page** | Select multiple items, apply manual forecast adjustments (with expiry) | Phase 2 |
| **Interactive Forecast Chart** | Chart with drag-to-adjust forecast lines; overrides flagged visually | Phase 2 |
| **Reorder → PO Workflow** | Check recommendations, select items, generate draft POs per supplier | Phase 2 |

### 11.2 Dashboard Enhancements
- Add accuracy metrics to forecast dashboard
- Show accuracy trend (improving/declining) over time
- Add "Model Selection" column showing which algorithm is used per item

### 11.3 Manual Override
- Users can override any forecast value (nextWeek/nextMonth/nextQuarter)
- Overrides are persisted and **flagged in the UI** (different color, "overridden" badge)
- Overrides expire or can be cleared manually
- Override reason field (optional text input)

### 11.4 Export
- **CSV export:** Forecast data, accuracy reports, reorder recommendations
- **PDF export:** Forecast reports suitable for sharing

---

## 12. Database Schema Changes

### 12.1 New: `forecast_accuracy` Table
```sql
CREATE TABLE IF NOT EXISTS forecast_accuracy (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  forecast_date DATE NOT NULL,
  item_id INTEGER NOT NULL,
  period TEXT NOT NULL CHECK(period IN ('next_week', 'next_month', 'next_quarter')),
  model_type TEXT NOT NULL DEFAULT 'weighted_moving_average',
  predicted_quantity REAL NOT NULL,
  actual_quantity REAL DEFAULT NULL,
  mape REAL DEFAULT NULL,
  mae REAL DEFAULT NULL,
  smape REAL DEFAULT NULL,
  is_override INTEGER DEFAULT 0,
  computed_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id)
);

CREATE INDEX IF NOT EXISTS idx_forecast_accuracy_item ON forecast_accuracy(item_id, forecast_date);
CREATE INDEX IF NOT EXISTS idx_forecast_accuracy_date ON forecast_accuracy(forecast_date);
```

### 12.2 Enhanced: `demand_forecasts` Table (New Columns)
```sql
ALTER TABLE demand_forecasts ADD COLUMN model_type TEXT DEFAULT 'weighted_moving_average';
ALTER TABLE demand_forecasts ADD COLUMN is_manual_override INTEGER DEFAULT 0;
ALTER TABLE demand_forecasts ADD COLUMN override_reason TEXT DEFAULT NULL;
ALTER TABLE demand_forecasts ADD COLUMN override_expires DATE DEFAULT NULL;
ALTER TABLE demand_forecasts ADD COLUMN bias_adjustment REAL DEFAULT NULL;
ALTER TABLE demand_forecasts ADD COLUMN seasonal_multiplier REAL DEFAULT NULL;
ALTER TABLE demand_forecasts ADD COLUMN run_id TEXT DEFAULT NULL;
```

### 12.3 New: `forecast_runs` Table
```sql
CREATE TABLE IF NOT EXISTS forecast_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT NOT NULL UNIQUE,
  run_type TEXT DEFAULT 'auto' CHECK(run_type IN ('auto', 'manual', 'scheduled')),
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME DEFAULT NULL,
  items_processed INTEGER DEFAULT 0,
  errors INTEGER DEFAULT 0,
  status TEXT DEFAULT 'running' CHECK(status IN ('running', 'completed', 'failed'))
);
```

### 12.4 New: `forecast_seasonal_events` Table
```sql
CREATE TABLE IF NOT EXISTS forecast_seasonal_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  multiplier REAL NOT NULL DEFAULT 1.0,
  applies_to_category TEXT DEFAULT NULL,
  applies_to_item_id INTEGER DEFAULT NULL,
  is_recurring INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (applies_to_item_id) REFERENCES items(id)
);
```

### 12.5 New: `forecast_model_config` Table
```sql
CREATE TABLE IF NOT EXISTS forecast_model_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER DEFAULT NULL,
  category TEXT DEFAULT NULL,
  model_type TEXT NOT NULL DEFAULT 'weighted_moving_average',
  ses_alpha REAL DEFAULT NULL,
  holt_alpha REAL DEFAULT NULL,
  holt_beta REAL DEFAULT NULL,
  hw_alpha REAL DEFAULT NULL,
  hw_beta REAL DEFAULT NULL,
  hw_gamma REAL DEFAULT NULL,
  seasonal_periods INTEGER DEFAULT 12,
  service_level REAL DEFAULT 0.95,
  lead_time_days INTEGER DEFAULT 7,
  bias_correction INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id),
  CHECK (item_id IS NOT NULL OR category IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_forecast_config_item ON forecast_model_config(item_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_forecast_config_category ON forecast_model_config(category);
```

---

## 13. API Endpoints

### 13.1 New Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/forecasts/accuracy` | Get forecast accuracy data (with date range filter, item filter) |
| `GET` | `/api/forecasts/accuracy/:itemId` | Accuracy history for a single item |
| `POST` | `/api/forecasts/override` | Submit manual forecast override(s) |
| `GET` | `/api/forecasts/models` | List available models and per-item config |
| `PUT` | `/api/forecasts/models/:itemId` | Set model config for an item |
| `POST` | `/api/forecasts/generate-po` | Generate draft purchase orders from recommendations |
| `GET` | `/api/forecasts/safety-stock` | Get safety stock calculations |
| `POST` | `/api/forecasts/seasonal-events` | CRUD for seasonal events |
| `GET` | `/api/forecasts/export` | Export forecast data (CSV/PDF) |

### 13.2 Enhanced Existing Endpoints
| Path | Enhancement |
|------|-------------|
| `GET /api/forecasts/demand` | Add `model_type`, `safety_stock`, `bias_adjustment` fields to response; filter by `model_type` |
| `GET /api/forecasts/dashboard` | Add accuracy summary, model distribution, safety stock stats |
| `GET /api/forecasts/trends` | Add trend confidence bands, seasonality decomposition overlay |

---

## 14. Implementation Phases

### Phase 1 (Priority)
1. **Multi-algorithm backend** — Implement SES, Holt's, Holt-Winters, ARIMA
2. **Model config table** + API for per-item/category model selection
3. **Auto-model selection** based on historical accuracy
4. **Forecast accuracy tracking** — Store predictions, backfill actuals, compute MAPE/MAE/sMAPE
5. **Bias correction / auto-learning** — Rolling correction factor
6. **Safety stock calculation** — API + DB schema
7. **Seasonal auto-detection** — Decompose time series, apply multipliers
8. **Enhanced reorder recommendations** — Incorporate safety stock + lead time
9. **Forecast Accuracy Dashboard** — New frontend page
10. **Expand item scope** — All active items, not just finished goods
11. **Integration** — Consider incoming POs and production plans in net requirements
12. **CSV export**

### Phase 2 (Future)
1. **PO generation workflow** — Draft PO creation from recommendations
2. **Bulk forecast override page**
3. **Interactive forecast chart** with drag-to-adjust
4. **Calendar-based seasonal events UI**
5. **PDF export**
6. **Scheduled forecast runs** (cron job)

---

## 15. Key Design Decisions

| Decision | Chosen Approach |
|----------|----------------|
| Override expiry | Overrides persist until cleared; flagged with "override" badge |
| Lead time data | Default 7 days; configurable per item via `forecast_model_config` |
| Auto-learning | Yes — auto-correct for bias; user can disable per item |
| Data retention | Indefinite with manual bulk-delete option |
| Model selection | Auto-best + user override per item or per category |
| Seasonality | Auto-detect + manual override + calendar events |
| PO generation | Semi-automatic: drafts that user reviews |
| Export | CSV first (Phase 1), PDF later (Phase 2) |

---

## 16. Success Criteria

- [ ] Forecast accuracy metrics (MAPE/MAE/sMAPE) visible and trendable
- [ ] Multiple algorithms selectable per item
- [ ] Auto-detected seasonal patterns match business intuition
- [ ] Reorder recommendations account for safety stock and lead time
- [ ] Bias correction visibly reduces systematic over/under-estimation
- [ ] Draft purchase orders can be generated from reorder recommendations
- [ ] CSV export produces standard-formatted data files
- [ ] API response times remain under 2s for 1000+ items
