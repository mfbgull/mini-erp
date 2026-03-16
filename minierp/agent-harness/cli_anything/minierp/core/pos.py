"""Core: POS — Point of Sale transactions."""

from typing import Any
from cli_anything.minierp.utils.erp_backend import make_client, ERPError


def create_pos_sale(
    customer_id: int,
    items: list[dict],
    payment_method: str = "cash",
    amount_tendered: float = 0,
    notes: str = "",
) -> dict:
    """Create a POS sale."""
    client = make_client()
    return client.post(
        "/pos/sale",
        body={
            "customer_id": customer_id,
            "items": items,
            "payment_method": payment_method,
            "amount_tendered": amount_tendered,
            "notes": notes,
        },
    )


def list_pos_transactions(page: int = 1, limit: int = 50) -> dict:
    """List POS transactions."""
    client = make_client()
    return client.get("/pos/transactions", params={"page": page, "limit": limit})
