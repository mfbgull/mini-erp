"""Core: Expense management — categories and expense records."""

from typing import Optional, Any
from cli_anything.minierp.utils.erp_backend import make_client


def list_categories() -> list[dict]:
    client = make_client()
    return client.get("/expenses/categories")


def create_category(name: str, description: str = "") -> dict:
    client = make_client()
    return client.post(
        "/expenses/categories", body={"name": name, "description": description}
    )


def list_expenses(
    page: int = 1, limit: int = 50, category: Optional[str] = None
) -> Any:
    client = make_client()
    return client.get(
        "/expenses", params={"page": page, "limit": limit, "category": category}
    )


def get_expense(expense_id: int) -> dict:
    client = make_client()
    return client.get(f"/expenses/{expense_id}")


def create_expense(
    expense_date: str,
    category: str,
    amount: float,
    description: str = "",
    payment_method: str = "cash",
    status: str = "approved",
) -> dict:
    client = make_client()
    return client.post(
        "/expenses",
        body={
            "expense_date": expense_date,
            "category": category,
            "amount": amount,
            "description": description,
            "payment_method": payment_method,
            "status": status,
        },
    )


def update_expense(expense_id: int, **fields: Any) -> dict:
    client = make_client()
    return client.put(f"/expenses/{expense_id}", body=fields)


def delete_expense(expense_id: int) -> dict:
    client = make_client()
    return client.delete(f"/expenses/{expense_id}")


def get_expense_summary(
    start_date: Optional[str] = None, end_date: Optional[str] = None
) -> Any:
    client = make_client()
    return client.get(
        "/expenses/summary",
        params={
            "start_date": start_date,
            "end_date": end_date,
        },
    )


def update_expense_category(category_id: int, name: str = "", description: str = "") -> dict:
    """Update an expense category."""
    client = make_client()
    body: dict[str, Any] = {}
    if name:
        body["name"] = name
    if description:
        body["description"] = description
    return client.put(f"/expenses/categories/{category_id}", body=body)


def delete_expense_category(category_id: int) -> dict:
    """Delete an expense category."""
    client = make_client()
    return client.delete(f"/expenses/categories/{category_id}")


def get_expenses_by_date_range(start_date: str, end_date: str) -> list[dict]:
    client = make_client()
    return client.get(
        "/expenses/date-range",
        params={
            "start_date": start_date,
            "end_date": end_date,
        },
    )
