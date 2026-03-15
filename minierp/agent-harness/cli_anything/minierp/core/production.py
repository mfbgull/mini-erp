"""Core: Production — manufacturing and production recording."""

from typing import Optional, Any
from cli_anything.minierp.utils.erp_backend import make_client, ERPError


def list_productions(page: int = 1, limit: int = 50) -> dict:
    """List productions with pagination."""
    client = make_client()
    return client.get("/productions", params={"page": page, "limit": limit})


def get_production(production_id: int) -> dict:
    """Get a specific production by ID."""
    client = make_client()
    return client.get(f"/productions/{production_id}")


def create_production(
    item_id: int,
    quantity: float,
    production_date: str,
    notes: str = "",
) -> dict:
    """Record a new production."""
    client = make_client()
    return client.post(
        "/productions",
        body={
            "item_id": item_id,
            "quantity": quantity,
            "production_date": production_date,
            "notes": notes,
        },
    )


def delete_production(production_id: int) -> dict:
    """Delete a production record."""
    client = make_client()
    return client.delete(f"/productions/{production_id}")


def get_production_summary_by_item(item_id: int) -> dict:
    """Get production summary for a specific item."""
    client = make_client()
    return client.get(f"/productions/summary/item/{item_id}")
