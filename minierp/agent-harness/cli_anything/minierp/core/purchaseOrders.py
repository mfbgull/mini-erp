"""Core: Purchase Orders — supplier purchase orders."""

from typing import Optional, Any
from cli_anything.minierp.utils.erp_backend import make_client, ERPError


def list_purchase_orders(page: int = 1, limit: int = 50) -> dict:
    """List purchase orders."""
    client = make_client()
    return client.get("/purchase-orders", params={"page": page, "limit": limit})


def get_purchase_order(po_id: int) -> dict:
    """Get a specific purchase order."""
    client = make_client()
    return client.get(f"/purchase-orders/{po_id}")


def create_purchase_order(
    supplier_id: int,
    order_date: str,
    expected_delivery: str,
    items: list[dict],
    notes: str = "",
) -> dict:
    """Create a new purchase order."""
    client = make_client()
    return client.post(
        "/purchase-orders",
        body={
            "supplier_id": supplier_id,
            "order_date": order_date,
            "expected_delivery": expected_delivery,
            "items": items,
            "notes": notes,
        },
    )


def update_purchase_order(
    po_id: int,
    expected_delivery: Optional[str] = None,
    notes: Optional[str] = None,
) -> dict:
    """Update a purchase order."""
    client = make_client()
    body: dict[str, Any] = {}
    if expected_delivery:
        body["expected_delivery"] = expected_delivery
    if notes is not None:
        body["notes"] = notes
    return client.put(f"/purchase-orders/{po_id}", body=body)


def delete_purchase_order(po_id: int) -> dict:
    """Delete a purchase order."""
    client = make_client()
    return client.delete(f"/purchase-orders/{po_id}")


def add_line_item(
    po_id: int,
    item_id: int,
    quantity: float,
    unit_price: float,
) -> dict:
    """Add a line item to a purchase order."""
    client = make_client()
    return client.post(
        f"/purchase-orders/{po_id}/items",
        body={
            "item_id": item_id,
            "quantity": quantity,
            "unit_price": unit_price,
        },
    )


def update_line_item(
    po_id: int,
    item_id: int,
    quantity: Optional[float] = None,
    unit_price: Optional[float] = None,
) -> dict:
    """Update a line item."""
    client = make_client()
    body: dict[str, Any] = {}
    if quantity is not None:
        body["quantity"] = quantity
    if unit_price is not None:
        body["unit_price"] = unit_price
    return client.put(f"/purchase-orders/{po_id}/items/{item_id}", body=body)


def delete_line_item(po_id: int, item_id: int) -> dict:
    """Delete a line item."""
    client = make_client()
    return client.delete(f"/purchase-orders/{po_id}/items/{item_id}")


def update_order_status(po_id: int, status: str) -> dict:
    """Update purchase order status."""
    client = make_client()
    return client.post(f"/purchase-orders/{po_id}/status", body={"status": status})


def get_pending_orders() -> dict:
    """Get pending purchase orders."""
    client = make_client()
    return client.get("/purchase-orders/pending")


def get_goods_receipts(po_id: int) -> dict:
    """Get goods receipts for a purchase order."""
    client = make_client()
    return client.get(f"/purchase-orders/{po_id}/receipts")


def create_goods_receipt(
    po_id: int,
    receipt_date: str,
    items: list[dict],
    notes: str = "",
) -> dict:
    """Create a goods receipt."""
    client = make_client()
    return client.post(
        f"/purchase-orders/{po_id}/receipts",
        body={
            "receipt_date": receipt_date,
            "items": items,
            "notes": notes,
        },
    )


def get_summary_by_supplier(supplier_id: int) -> dict:
    """Get purchase order summary for a supplier."""
    client = make_client()
    return client.get(f"/purchase-orders/summary/supplier/{supplier_id}")


def get_supplier_balance(supplier_id: int) -> dict:
    """Get supplier account balance."""
    client = make_client()
    return client.get(f"/suppliers/{supplier_id}/balance")


def get_supplier_transactions(supplier_id: int) -> dict:
    """Get supplier transactions."""
    client = make_client()
    return client.get(f"/suppliers/{supplier_id}/transactions")
