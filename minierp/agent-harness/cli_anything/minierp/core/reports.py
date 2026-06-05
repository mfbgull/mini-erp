"""Core: Report generation — business analytics and summaries."""

from typing import Optional, Any
from cli_anything.minierp.utils.erp_backend import make_client


def _date_params(start_date: Optional[str] = None, end_date: Optional[str] = None) -> dict:
    """Build query params that match all server endpoint conventions."""
    params = {}
    if start_date:
        params["fromDate"] = start_date
        params["startDate"] = start_date
    if end_date:
        params["toDate"] = end_date
        params["endDate"] = end_date
    return params


def sales_summary(
    start_date: Optional[str] = None, end_date: Optional[str] = None
) -> Any:
    client = make_client()
    return client.get(
        "/reports/sales-summary",
        params=_date_params(start_date, end_date),
    )


def sales_by_customer(
    start_date: Optional[str] = None, end_date: Optional[str] = None
) -> list[dict]:
    client = make_client()
    return client.get(
        "/reports/sales-by-customer",
        params=_date_params(start_date, end_date),
    )


def sales_by_item(
    start_date: Optional[str] = None, end_date: Optional[str] = None
) -> list[dict]:
    client = make_client()
    return client.get(
        "/reports/sales-by-item",
        params=_date_params(start_date, end_date),
    )


def stock_level() -> list[dict]:
    client = make_client()
    return client.get("/reports/stock-level")


def low_stock() -> list[dict]:
    client = make_client()
    return client.get("/reports/low-stock")


def stock_valuation() -> list[dict]:
    client = make_client()
    return client.get("/reports/stock-valuation")


def inventory_movement(
    start_date: Optional[str] = None, end_date: Optional[str] = None
) -> list[dict]:
    client = make_client()
    return client.get(
        "/reports/inventory-movement",
        params=_date_params(start_date, end_date),
    )


def profit_loss(
    start_date: Optional[str] = None, end_date: Optional[str] = None
) -> Any:
    client = make_client()
    return client.get(
        "/reports/profit-loss",
        params=_date_params(start_date, end_date),
    )


def cash_flow(start_date: Optional[str] = None, end_date: Optional[str] = None) -> Any:
    client = make_client()
    return client.get(
        "/reports/cash-flow",
        params=_date_params(start_date, end_date),
    )


def ar_aging() -> list[dict]:
    client = make_client()
    return client.get("/reports/ar-aging")


def ar_summary() -> Any:
    client = make_client()
    return client.get("/reports/ar-summary")


def purchase_summary(
    start_date: Optional[str] = None, end_date: Optional[str] = None
) -> Any:
    client = make_client()
    return client.get(
        "/reports/purchase-summary",
        params=_date_params(start_date, end_date),
    )


def production_summary(
    start_date: Optional[str] = None, end_date: Optional[str] = None
) -> Any:
    client = make_client()
    return client.get(
        "/reports/production-summary",
        params=_date_params(start_date, end_date),
    )


def expenses_report(
    start_date: Optional[str] = None, end_date: Optional[str] = None
) -> list[dict]:
    client = make_client()
    return client.get(
        "/reports/expenses",
        params=_date_params(start_date, end_date),
    )


def supplier_analysis() -> list[dict]:
    client = make_client()
    return client.get("/reports/supplier-analysis")


def bom_usage(bom_id: int) -> dict:
    """Get BOM usage report."""
    client = make_client()
    return client.get(f"/reports/bom-usage/{bom_id}")


def production_efficiency(
    start_date: Optional[str] = None, end_date: Optional[str] = None
) -> Any:
    """Get production efficiency report."""
    client = make_client()
    return client.get(
        "/reports/production-efficiency",
        params=_date_params(start_date, end_date),
    )


def gross_profit_analysis(
    start_date: Optional[str] = None, end_date: Optional[str] = None
) -> Any:
    """Get gross profit analysis."""
    client = make_client()
    return client.get(
        "/reports/gross-profit",
        params=_date_params(start_date, end_date),
    )


def daily_sales(start_date: Optional[str] = None, end_date: Optional[str] = None) -> list[dict]:
    """Get daily sales report."""
    client = make_client()
    return client.get(
        "/reports/daily-sales",
        params=_date_params(start_date, end_date),
    )


def monthly_sales(year: int) -> list[dict]:
    """Get monthly sales summary for a year."""
    client = make_client()
    return client.get("/reports/monthly-sales", params={"year": year})


def customer_outstanding() -> list[dict]:
    """Get customer outstanding balances."""
    client = make_client()
    return client.get("/reports/customer-outstanding")


def supplier_outstanding() -> list[dict]:
    """Get supplier outstanding balances."""
    client = make_client()
    return client.get("/reports/supplier-outstanding")


def trial_balance(as_of_date: Optional[str] = None) -> Any:
    """Get trial balance report."""
    client = make_client()
    return client.get("/reports/trial-balance", params={"as_of_date": as_of_date})


def general_ledger(
    account_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> list[dict]:
    """Get general ledger entries."""
    client = make_client()
    params = {}
    if account_id:
        params["account_id"] = account_id
    params.update(_date_params(start_date, end_date))
    return client.get("/reports/general-ledger", params=params)


def balance_sheet(as_of_date: Optional[str] = None) -> Any:
    """Get balance sheet report."""
    client = make_client()
    return client.get("/reports/balance-sheet", params={"as_of_date": as_of_date})


def income_statement(
    start_date: Optional[str] = None, end_date: Optional[str] = None
) -> Any:
    """Get income statement report."""
    client = make_client()
    return client.get(
        "/reports/income-statement",
        params=_date_params(start_date, end_date),
    )


def tax_summary(
    start_date: Optional[str] = None, end_date: Optional[str] = None
) -> Any:
    """Get tax summary report."""
    client = make_client()
    return client.get(
        "/reports/tax-summary",
        params=_date_params(start_date, end_date),
    )


def batch_traceability(item_id: int) -> list[dict]:
    """Get batch traceability for an item."""
    client = make_client()
    return client.get(f"/reports/batch-traceability/{item_id}")


def customer_statements(customer_id: int) -> list[dict]:
    """Get customer statements."""
    client = make_client()
    return client.get("/reports/customer-statements", params={"customerId": customer_id})


def top_debtors(limit: int = 10) -> list[dict]:
    """Get top debtors."""
    client = make_client()
    return client.get("/reports/top-debtors", params={"limit": limit})


def dso(period: int = 30) -> Any:
    """Get Days Sales Outstanding metric."""
    client = make_client()
    return client.get("/reports/dso", params={"period": period})
