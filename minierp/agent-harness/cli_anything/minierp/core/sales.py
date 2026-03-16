"""Core: Sales — sales summaries and analytics.

Note: Direct sales recording removed - use POS or Invoices instead.
"""

from typing import Optional
from cli_anything.minierp.utils.erp_backend import make_client, ERPError


def get_sales_summary_by_item(item_id: int) -> dict:
    """Get sales summary for a specific item."""
    client = make_client()
    return client.get(f"/sales/summary/item/{item_id}")


def get_sales_summary_by_date_range(
    start: Optional[str] = None, end: Optional[str] = None
) -> dict:
    """Get sales summary for a date range."""
    client = make_client()
    params = {}
    if start:
        params["start"] = start
    if end:
        params["end"] = end
    return client.get("/sales/summary/daterange", params=params)


def get_top_customers(limit: int = 10) -> dict:
    """Get top customers by sales."""
    client = make_client()
    return client.get("/sales/top-customers", params={"limit": limit})


def get_item_customer_price_history(item_id: int) -> dict:
    """Get price history for an item across customers."""
    client = make_client()
    return client.get("/sales/item-customer-history", params={"item_id": item_id})


def get_sale(sale_id: int) -> dict:
    """Get a specific sale by ID."""
    client = make_client()
    return client.get(f"/sales/{sale_id}")


def delete_sale(sale_id: int) -> dict:
    """Delete a sale."""
    client = make_client()
    return client.delete(f"/sales/{sale_id}")


def list_sales_orders(
    page: int = 1, limit: int = 50, status: Optional[str] = None
) -> dict:
    """List sales orders.

    Note: Sales orders are not directly supported. Use POS or Invoices instead.
    """
    return {
        "success": False,
        "error": "Sales orders are not directly supported. Use POS system or Invoices instead.",
        "message": "Use 'cli-anything-minierp invoices list' or 'cli-anything-minierp pos transactions'",
    }


def get_sales_order(order_id: int) -> dict:
    """Get sales order details.

    Note: Sales orders are not directly supported. Use POS or Invoices instead.
    """
    return {
        "success": False,
        "error": "Sales orders are not directly supported. Use POS or Invoices instead.",
        "message": "Use 'cli-anything-minierp invoices list' or 'cli-anything-minierp pos transactions'",
    }


def create_sales_order(
    customer_id: int,
    order_date: str,
    items: list[dict],
    notes: str = "",
    expected_delivery: Optional[str] = None,
) -> dict:
    """Create a sales order.

    Note: Sales orders are not directly supported. Use POS or Invoices instead.
    """
    return {
        "success": False,
        "error": "Sales orders are not directly supported. Use POS or Invoices instead.",
        "message": "Use 'cli-anything-minierp invoices create' or POS system instead.",
    }


def update_sales_order(order_id: int, **fields) -> dict:
    """Update sales order.

    Note: Sales orders are not directly supported. Use POS or Invoices instead.
    """
    return {
        "success": False,
        "error": "Sales orders are not directly supported. Use POS or Invoices instead.",
    }


def delete_sales_order(order_id: int) -> dict:
    """Delete sales order.

    Note: Sales orders are not directly supported. Use POS or Invoices instead.
    """
    return {
        "success": False,
        "error": "Sales orders are not directly supported. Use POS or Invoices instead.",
    }


def get_sales_returns(
    start_date: Optional[str] = None, end_date: Optional[str] = None
) -> dict:
    """Get sales returns.

    Note: Sales returns are not directly supported.
    """
    return {
        "success": False,
        "error": "Sales returns are not directly supported.",
        "message": "Contact system administrator for sales return functionality.",
    }


def create_sales_return(
    sale_id: int,
    items: list[dict],
    reason: str,
    notes: str = "",
) -> dict:
    """Create a sales return.

    Note: Sales returns are not directly supported.
    """
    return {
        "success": False,
        "error": "Sales returns are not directly supported.",
        "message": "Contact system administrator for sales return functionality.",
    }


def get_sales_commission(
    salesperson_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> dict:
    """Get sales commission report."""
    client = make_client()
    params = {}
    if salesperson_id:
        params["salesperson_id"] = salesperson_id
    if start_date:
        params["start_date"] = start_date
    if end_date:
        params["end_date"] = end_date
    return client.get("/sales/commission", params=params)


def get_sales_forecast(months: int = 3) -> dict:
    """Get sales forecast."""
    client = make_client()
    return client.get("/sales/forecast", params={"months": months})
