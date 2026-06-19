/**
 * AG Grid Status Cell Coloring — Shared Utility
 *
 * Provides mapping functions from status values to CSS class names
 * defined in styles/ag-grid-status-cells.css.
 *
 * Use these in AG Grid column definitions via the `cellClass` callback.
 */

/**
 * Returns the CSS class for a status value column.
 * Handles common statuses across Sales, Purchases, Expenses, Quotations,
 * Sales Orders, Production, etc.
 *
 * @param {string|null|undefined} status - The raw status value from the row data.
 * @returns {string} CSS class name for the cell.
 *
 * Usage:
 *   { field: 'status', cellClass: (params) => getStatusCellClass(params.value) }
 */
export function getStatusCellClass(status) {
  const s = (status || '').toLowerCase().trim();

  // --- Success/Active group (green) ---
  if (['paid', 'active', 'completed', 'accepted', 'converted', 'invoiced', 'returned'].includes(s)) {
    return 'cell-status-active';
  }

  // --- Warning/Pending group (amber) ---
  if (
    ['partial', 'partially paid', 'partially-paid', 'partially_paid',
     'partially received', 'partially_received',
     'partially returned', 'partially-returned', 'partially_returned',
     'pending', 'approved', 'sent', 'confirmed', 'in progress'].includes(s)
  ) {
    return 'cell-status-partial';
  }

  // --- Draft/Inactive/Expired group (gray) ---
  if (['draft', 'inactive', 'expired', 'custom'].includes(s)) {
    return 'cell-status-draft';
  }

  // --- Error/Cancelled group (red) ---
  if (['cancelled', 'canceled', 'rejected'].includes(s)) {
    return 'cell-status-cancelled';
  }

  // --- Info/Unpaid/Overdue group (blue) ---
  if (['unpaid', 'overdue', 'system'].includes(s)) {
    return 'cell-status-overdue';
  }

  // Default fallback — neutral
  return 'cell-status-draft';
}

/**
 * Returns the CSS class for a stock-quantity column based on stock level.
 *
 * @param {number} stock - Current stock quantity.
 * @param {number|null} reorderLevel - Reorder/alert level (optional).
 * @returns {string} CSS class name.
 *
 * Usage:
 *   { field: 'current_stock', cellClass: (params) =>
 *     getStockCellClass(params.value, params.data?.reorder_level) }
 */
export function getStockCellClass(stock, reorderLevel = null) {
  const qty = parseFloat(stock) || 0;

  if (qty <= 0) return 'cell-stock-out';
  if (reorderLevel != null && reorderLevel > 0 && qty <= reorderLevel) return 'cell-stock-low';
  return '';
}

/**
 * Returns the CSS class for a boolean Active/Inactive status (is_active field).
 *
 * @param {boolean|number} isActive - Truthy = active, falsy = inactive.
 * @returns {string} CSS class name.
 *
 * Usage:
 *   { field: 'is_active', cellClass: (params) => getIsActiveCellClass(params.value) }
 */
export function getIsActiveCellClass(isActive) {
  return isActive ? 'cell-status-active' : 'cell-status-inactive';
}

/**
 * Returns the CSS class for a role type column (is_system_role field).
 *
 * @param {boolean|number} isSystemRole - Truthy = System, falsy = Custom.
 * @returns {string} CSS class name.
 *
 * Usage:
 *   { field: 'is_system_role', cellClass: (params) => getRoleTypeCellClass(params.value) }
 */
export function getRoleTypeCellClass(isSystemRole) {
  return isSystemRole ? 'cell-type-system' : 'cell-type-custom';
}

/**
 * Returns the CSS class for a movement type column (PURCHASE/SALE/TRANSFER etc).
 *
 * @param {string} type - Movement type value.
 * @returns {string} CSS class name.
 *
 * Usage:
 *   { field: 'movement_type', cellClass: (params) => getMovementCellClass(params.value) }
 */
export function getMovementCellClass(type) {
  const t = (type || '').toLowerCase().replace(/[\s_-]+/g, '_');

  // "Inbound" movements — exact match only to avoid false positives
  const inbound = [
    'purchase', 'purchase_return',
    'in', 'inbound',
    'production', 'production_receipt',
    'adjustment_positive', 'positive_adjustment',
  ];
  if (inbound.includes(t)) return 'cell-movement-in';

  // "Outbound" movements — exact match only
  const outbound = [
    'sale', 'sales_return', 'invoice_return',
    'out', 'outbound',
    'transfer', 'stock_transfer',
    'adjustment_negative', 'negative_adjustment',
    'write_off', 'writeoff',
  ];
  if (outbound.includes(t)) return 'cell-movement-out';

  return '';
}

/**
 * Returns the CSS class for a supplier delivery rate column.
 *
 * @param {number} rate - On-time delivery rate percentage (0-100).
 * @returns {string} CSS class name.
 *
 * Usage:
 *   { field: 'on_time_delivery_rate', cellClass: (params) => getDeliveryRateCellClass(params.value) }
 */
export function getDeliveryRateCellClass(rate) {
  const r = parseFloat(rate) || 0;
  if (r >= 95) return 'cell-rate-excellent';
  if (r >= 90) return 'cell-rate-good';
  if (r >= 80) return 'cell-rate-fair';
  return 'cell-rate-poor';
}

/**
 * Returns the CSS class for a forecast recommendation column.
 *
 * @param {string} recommendation - Recommendation value.
 * @returns {string} CSS class name.
 *
 * Usage:
 *   { field: 'recommendation', cellClass: (params) => getForecastRecommendationClass(params.value) }
 */
export function getForecastRecommendationClass(recommendation) {
  const r = (recommendation || '').toLowerCase().replace(/\s+/g, '-');
  if (r === 'order_now' || r === 'order-now') return 'cell-rec-order-now';
  if (r === 'order_soon' || r === 'order-soon') return 'cell-rec-order-soon';
  if (r === 'monitor') return 'cell-rec-monitor';
  if (r === 'adequate') return 'cell-rec-adequate';
  return '';
}

/**
 * Returns the CSS class for a credit utilization column.
 *
 * @param {number} utilizationPercent - Credit utilization as percentage.
 * @param {number|null} creditLimit - Credit limit (null = no limit).
 * @returns {string} CSS class name.
 *
 * Usage:
 *   { field: 'credit_utilization_percent', cellClass: (params) =>
 *     getCreditUtilizationClass(params.value, params.data?.credit_limit) }
 */
export function getCreditUtilizationClass(utilizationPercent, creditLimit) {
  if (!creditLimit || creditLimit <= 0) return '';
  const u = parseFloat(utilizationPercent) || 0;
  if (u >= 90) return 'cell-credit-high';
  if (u >= 75) return 'cell-credit-warn';
  return '';
}

/**
 * Returns the CSS class for a balance/due column.
 *
 * @param {number} balance - Current balance amount.
 * @returns {string} CSS class name.
 *
 * Usage:
 *   { field: 'current_balance', cellClass: (params) =>
 *     getBalanceCellClass(parseFloat(params.value || 0)) }
 */
export function getBalanceCellClass(balance) {
  return (parseFloat(balance) || 0) > 0 ? 'cell-balance-due' : 'cell-balance-clear';
}
