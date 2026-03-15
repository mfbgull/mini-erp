"""Core: Supplier management — CRUD."""

from typing import Optional, Any
from cli_anything.minierp.utils.erp_backend import make_client


def list_suppliers(search: Optional[str] = None) -> list[dict]:
    client = make_client()
    params = {}
    if search:
        params["search"] = search
    return client.get("/suppliers", params=params)


def get_supplier(supplier_id: int) -> dict:
    client = make_client()
    return client.get(f"/suppliers/{supplier_id}")


def create_supplier(
    supplier_code: str,
    supplier_name: str,
    email: str = "",
    phone: str = "",
    address: str = "",
) -> dict:
    client = make_client()
    return client.post(
        "/suppliers",
        body={
            "supplier_code": supplier_code,
            "supplier_name": supplier_name,
            "email": email,
            "phone": phone,
            "address": address,
        },
    )


def update_supplier(supplier_id: int, **fields: Any) -> dict:
    client = make_client()
    return client.put(f"/suppliers/{supplier_id}", body=fields)


def delete_supplier(supplier_id: int) -> dict:
    client = make_client()
    return client.delete(f"/suppliers/{supplier_id}")
