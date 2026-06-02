"""Core: Invoice management — CRUD + payments."""

from typing import Optional, Any
from cli_anything.minierp.utils.erp_backend import make_client


def list_invoices(
    search: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
) -> Any:
    client = make_client()
    return client.get(
        "/invoices",
        params={
            "search": search,
            "status": status,
            "page": page,
            "limit": limit,
        },
    )


def get_invoice(invoice_id: int) -> dict:
    client = make_client()
    return client.get(f"/invoices/{invoice_id}")


def create_invoice(
    customer_id: int,
    invoice_date: str,
    due_date: str,
    items: list[dict],
    notes: str = "",
) -> dict:
    """Create an invoice.

    Args:
        customer_id: Customer ID
        invoice_date: Date string YYYY-MM-DD
        due_date: Due date string YYYY-MM-DD
        items: List of {item_id, quantity, unit_price}
        notes: Optional notes
    """
    client = make_client()
    return client.post(
        "/invoices",
        body={
            "customer_id": customer_id,
            "invoice_date": invoice_date,
            "due_date": due_date,
            "items": items,
            "notes": notes,
        },
    )


def update_invoice(invoice_id: int, **fields: Any) -> dict:
    client = make_client()
    return client.put(f"/invoices/{invoice_id}", body=fields)


def delete_invoice(invoice_id: int) -> dict:
    client = make_client()
    return client.delete(f"/invoices/{invoice_id}")


def get_invoice_payments(invoice_id: int) -> list[dict]:
    client = make_client()
    return client.get(f"/invoices/{invoice_id}/payments")


def return_invoice_items(invoice_id: int, items: list[dict]) -> dict:
    """Return items from an invoice.

    Args:
        invoice_id: Invoice ID
        items: List of {item_id, quantity} to return
    """
    client = make_client()
    return client.post(
        f"/invoices/{invoice_id}/return",
        body={"items": items},
    )
