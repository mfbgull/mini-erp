"""Core: Purchase management — record and query purchases."""

from typing import Optional, Any
from cli_anything.minierp.utils.erp_backend import make_client


def list_purchases(search: Optional[str] = None, page: int = 1, limit: int = 50) -> Any:
    client = make_client()
    return client.get(
        "/purchases",
        params={
            "search": search,
            "page": page,
            "limit": limit,
        },
    )


def get_purchase(purchase_id: int) -> dict:
    client = make_client()
    return client.get(f"/purchases/{purchase_id}")


def create_purchase(
    item_id: int, 
    warehouse_id: int, 
    quantity: float, 
    unit_cost: float, 
    purchase_date: str, 
    supplier_name: str = "", 
    invoice_no: str = "", 
    notes: str = ""
) -> dict:
    """Record a purchase.

    Args:
        item_id: Item ID
        warehouse_id: Warehouse ID
        quantity: Quantity purchased
        unit_cost: Unit cost
        purchase_date: Date string YYYY-MM-DD
        supplier_name: Supplier name
        invoice_no: Invoice number
        notes: Optional notes
    """
    client = make_client()
    return client.post(
        "/purchases",
        body={
            "item_id": item_id,
            "warehouse_id": warehouse_id,
            "quantity": quantity,
            "unit_cost": unit_cost,
            "supplier_name": supplier_name,
            "purchase_date": purchase_date,
            "invoice_no": invoice_no,
            "remarks": notes,
        },
    )


def delete_purchase(purchase_id: int) -> dict:
    client = make_client()
    return client.delete(f"/purchases/{purchase_id}")


def get_purchase_summary(
    start_date: Optional[str] = None, end_date: Optional[str] = None
) -> Any:
    client = make_client()
    return client.get(
        "/purchases/summary/daterange",
        params={
            "start_date": start_date,
            "end_date": end_date,
        },
    )


def get_purchase_summary_by_item(item_id: int) -> dict:
    """Get purchase summary for a specific item."""
    client = make_client()
    return client.get(f"/purchases/summary/item/{item_id}")


def get_top_suppliers(limit: int = 10) -> list[dict]:
    client = make_client()
    return client.get("/purchases/top-suppliers", params={"limit": limit})
