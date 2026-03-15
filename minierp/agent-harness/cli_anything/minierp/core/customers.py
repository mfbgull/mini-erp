"""Core: Customer management — CRUD + ledger + balance."""

from typing import Optional, Any
from cli_anything.minierp.utils.erp_backend import make_client


def list_customers(
    search: Optional[str] = None, status: str = "all", page: int = 1, limit: int = 50
) -> Any:
    client = make_client()
    return client.get(
        "/customers",
        params={
            "search": search,
            "status": status,
            "page": page,
            "limit": limit,
        },
    )


def get_customer(customer_id: int) -> dict:
    client = make_client()
    return client.get(f"/customers/{customer_id}")


def create_customer(
    customer_code: str,
    customer_name: str,
    email: str = "",
    phone: str = "",
    address: str = "",
    credit_limit: float = 0,
) -> dict:
    client = make_client()
    return client.post(
        "/customers",
        body={
            "customer_code": customer_code,
            "customer_name": customer_name,
            "email": email,
            "phone": phone,
            "address": address,
            "credit_limit": credit_limit,
        },
    )


def update_customer(customer_id: int, **fields: Any) -> dict:
    client = make_client()
    return client.put(f"/customers/{customer_id}", body=fields)


def delete_customer(customer_id: int) -> dict:
    client = make_client()
    return client.delete(f"/customers/{customer_id}")


def get_customer_ledger(customer_id: int) -> list[dict]:
    client = make_client()
    return client.get(f"/customers/{customer_id}/ledger")


def get_customer_balance(customer_id: int) -> dict:
    client = make_client()
    return client.get(f"/customers/{customer_id}/balance")


def get_customer_statement(customer_id: int) -> dict:
    client = make_client()
    return client.get(f"/customers/{customer_id}/statement")
