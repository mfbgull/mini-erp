"""Core: Payments — customer payments and allocations."""

from typing import Optional, Any
from cli_anything.minierp.utils.erp_backend import make_client, ERPError


def list_payments(
    page: int = 1,
    limit: int = 50,
    search: Optional[str] = None,
    customer_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> dict:
    """List payments with filtering and pagination."""
    client = make_client()
    params: dict[str, Any] = {"page": page, "limit": limit}
    if search:
        params["search"] = search
    if customer_id:
        params["customerId"] = customer_id
    if start_date:
        params["start_date"] = start_date
    if end_date:
        params["end_date"] = end_date
    return client.get("/payments", params=params)


def get_payment(payment_id: int) -> dict:
    """Get a specific payment by ID."""
    client = make_client()
    return client.get(f"/payments/{payment_id}")


def create_payment(
    customer_id: int,
    amount: float,
    payment_date: str,
    payment_method: str = "cash",
    reference: str = "",
    notes: str = "",
) -> dict:
    """Create a new payment."""
    client = make_client()
    return client.post(
        "/payments",
        body={
            "customer_id": customer_id,
            "amount": amount,
            "payment_date": payment_date,
            "payment_method": payment_method,
            "reference": reference,
            "notes": notes,
        },
    )


def update_payment(
    payment_id: int,
    amount: Optional[float] = None,
    payment_date: Optional[str] = None,
    payment_method: Optional[str] = None,
    reference: Optional[str] = None,
    notes: Optional[str] = None,
) -> dict:
    """Update a payment."""
    client = make_client()
    body: dict[str, Any] = {}
    if amount is not None:
        body["amount"] = amount
    if payment_date:
        body["payment_date"] = payment_date
    if payment_method:
        body["payment_method"] = payment_method
    if reference is not None:
        body["reference"] = reference
    if notes is not None:
        body["notes"] = notes
    return client.put(f"/payments/{payment_id}", body=body)


def delete_payment(payment_id: int) -> dict:
    """Delete a payment (admin only)."""
    client = make_client()
    return client.delete(f"/payments/{payment_id}")


def allocate_payment(payment_id: int, allocations: list[dict]) -> dict:
    """Allocate a payment to invoices."""
    client = make_client()
    return client.post(
        f"/payments/{payment_id}/allocate", body={"allocations": allocations}
    )
