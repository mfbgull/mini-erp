"""Core: BOM — Bill of Materials management."""

from typing import Optional, Any
from cli_anything.minierp.utils.erp_backend import make_client, ERPError


def list_boms(page: int = 1, limit: int = 50) -> dict:
    """List all BOMs."""
    client = make_client()
    return client.get("/", params={"page": page, "limit": limit})


def get_bom(bom_id: int) -> dict:
    """Get a specific BOM by ID."""
    client = make_client()
    return client.get(f"/{bom_id}")


def get_boms_by_item(item_id: int) -> dict:
    """Get BOMs for a finished item."""
    client = make_client()
    return client.get(f"/by-item/{item_id}")


def create_bom(
    finished_item_id: int,
    quantity: float,
    items: list[dict],
    notes: str = "",
) -> dict:
    """Create a new BOM."""
    client = make_client()
    return client.post(
        "/",
        body={
            "finished_item_id": finished_item_id,
            "quantity": quantity,
            "items": items,
            "notes": notes,
        },
    )


def update_bom(
    bom_id: int,
    quantity: Optional[float] = None,
    items: Optional[list[dict]] = None,
    notes: Optional[str] = None,
) -> dict:
    """Update a BOM."""
    client = make_client()
    body: dict[str, Any] = {}
    if quantity is not None:
        body["quantity"] = quantity
    if items is not None:
        body["items"] = items
    if notes is not None:
        body["notes"] = notes
    return client.put(f"/{bom_id}", body=body)


def toggle_bom_active(bom_id: int) -> dict:
    """Toggle BOM active status."""
    client = make_client()
    return client.patch(f"/{bom_id}/toggle-active")


def delete_bom(bom_id: int) -> dict:
    """Delete a BOM."""
    client = make_client()
    return client.delete(f"/{bom_id}")
