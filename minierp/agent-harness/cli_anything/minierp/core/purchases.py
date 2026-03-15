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
    supplier_id: int, purchase_date: str, items: list[dict], notes: str = ""
) -> dict:
    """Record a purchase.

    Args:
        supplier_id: Supplier ID
        purchase_date: Date string YYYY-MM-DD
        items: List of {item_id, quantity, unit_price}
        notes: Optional notes
    """
    client = make_client()
    return client.post(
        "/purchases",
        body={
            "supplier_id": supplier_id,
            "purchase_date": purchase_date,
            "items": items,
            "notes": notes,
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


def get_top_suppliers(limit: int = 10) -> list[dict]:
    client = make_client()
    return client.get("/purchases/top-suppliers", params={"limit": limit})
