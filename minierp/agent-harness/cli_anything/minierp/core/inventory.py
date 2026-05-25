"""Core: Inventory management — items, warehouses, stock movements."""

from typing import Optional, Any
from cli_anything.minierp.utils.erp_backend import make_client


def list_items(
    search: Optional[str] = None, category: Optional[str] = None
) -> list[dict]:
    client = make_client()
    return client.get(
        "/inventory/items", params={"search": search, "category": category}
    )


def get_item(item_id: int) -> dict:
    client = make_client()
    return client.get(f"/inventory/items/{item_id}")


def create_item(
    item_code: str,
    item_name: str,
    category: str = "",
    unit_of_measure: str = "PCS",
    current_stock: float = 0,
    reorder_level: float = 0,
    purchase_price: float = 0,
    selling_price: float = 0,
) -> dict:
    client = make_client()
    return client.post(
        "/inventory/items",
        body={
            "item_code": item_code,
            "item_name": item_name,
            "category": category,
            "unit_of_measure": unit_of_measure,
            "current_stock": current_stock,
            "reorder_level": reorder_level,
            "purchase_price": purchase_price,
            "selling_price": selling_price,
        },
    )


def update_item(item_id: int, **fields: Any) -> dict:
    client = make_client()
    return client.put(f"/inventory/items/{item_id}", body=fields)


def delete_item(item_id: int) -> dict:
    client = make_client()
    return client.delete(f"/inventory/items/{item_id}")


def list_warehouses() -> list[dict]:
    client = make_client()
    return client.get("/inventory/warehouses")


def get_warehouse(wh_id: int) -> dict:
    client = make_client()
    return client.get(f"/inventory/warehouses/{wh_id}")


def create_warehouse(warehouse_name: str, location: str = "") -> dict:
    client = make_client()
    return client.post(
        "/inventory/warehouses",
        body={
            "warehouse_name": warehouse_name,
            "location": location,
        },
    )


def update_warehouse(wh_id: int, **fields: Any) -> dict:
    client = make_client()
    return client.put(f"/inventory/warehouses/{wh_id}", body=fields)


def list_stock_movements(
    item_id: Optional[int] = None, warehouse_id: Optional[int] = None
) -> list[dict]:
    client = make_client()
    return client.get(
        "/inventory/stock-movements",
        params={
            "item_id": item_id,
            "warehouse_id": warehouse_id,
        },
    )


def create_stock_movement(
    item_id: int,
    warehouse_id: int,
    movement_type: str,
    quantity: float,
    reference_no: str = "",
    notes: str = "",
) -> dict:
    client = make_client()
    return client.post(
        "/inventory/stock-movements",
        body={
            "item_id": item_id,
            "warehouse_id": warehouse_id,
            "movement_type": movement_type,
            "quantity": quantity,
            "reference_no": reference_no,
            "notes": notes,
        },
    )


def get_stock_balances() -> list[dict]:
    client = make_client()
    return client.get("/inventory/stock-balances")


def get_stock_summary() -> Any:
    client = make_client()
    return client.get("/inventory/stock-summary")


def get_low_stock() -> list[dict]:
    client = make_client()
    return client.get("/inventory/items-low-stock")


def list_categories() -> list[dict]:
    client = make_client()
    return client.get("/inventory/items-categories")


def get_stock_valuation() -> Any:
    """Get total inventory valuation."""
    client = make_client()
    return client.get("/inventory/stock-valuation")


def get_item_valuation(item_id: int) -> dict:
    """Get valuation for a specific item."""
    client = make_client()
    return client.get(f"/inventory/items/{item_id}/valuation")


def get_item_movements(item_id: int, start_date: Optional[str] = None, end_date: Optional[str] = None) -> list[dict]:
    """Get movement history for an item."""
    client = make_client()
    params = {}
    if start_date:
        params["start_date"] = start_date
    if end_date:
        params["end_date"] = end_date
    return client.get(f"/inventory/items/{item_id}/movements", params=params)


def get_warehouse_stock(warehouse_id: int) -> list[dict]:
    """Get all stock in a specific warehouse."""
    client = make_client()
    return client.get(f"/inventory/warehouses/{warehouse_id}/stock")


def transfer_stock(
    item_id: int,
    from_warehouse_id: int,
    to_warehouse_id: int,
    quantity: float,
    reference: str = "",
    notes: str = "",
) -> dict:
    """Transfer stock between warehouses."""
    client = make_client()
    return client.post(
        "/inventory/stock-transfers",
        body={
            "item_id": item_id,
            "from_warehouse_id": from_warehouse_id,
            "to_warehouse_id": to_warehouse_id,
            "quantity": quantity,
            "reference": reference,
            "notes": notes,
        },
    )


def adjust_stock(
    item_id: int,
    warehouse_id: int,
    quantity: float,
    reason: str,
    reference: str = "",
) -> dict:
    """Adjust stock level (positive or negative)."""
    client = make_client()
    return client.post(
        "/inventory/stock-adjustments",
        body={
            "item_id": item_id,
            "warehouse_id": warehouse_id,
            "quantity": quantity,
            "reason": reason,
            "reference": reference,
        },
    )


def delete_warehouse(wh_id: int) -> dict:
    """Delete a warehouse."""
    client = make_client()
    return client.delete(f"/inventory/warehouses/{wh_id}")


def get_item_ledger(item_id: int) -> list[dict]:
    """Get stock ledger for an item."""
    client = make_client()
    return client.get(f"/inventory/stock-ledger/{item_id}")


def get_units_of_measure() -> list[dict]:
    """Get available units of measure."""
    client = make_client()
    return client.get("/inventory/items-uom")


def get_slow_moving_items(threshold_days: int = 90) -> list[dict]:
    """Get items with no movement in specified days."""
    client = make_client()
    return client.get("/inventory/slow-moving", params={"threshold_days": threshold_days})


def get_inventory_turnover() -> Any:
    """Get inventory turnover ratio analysis."""
    client = make_client()
    return client.get("/inventory/turnover")
