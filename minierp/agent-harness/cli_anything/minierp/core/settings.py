"""Core: Settings — system configuration."""

from typing import Any
from cli_anything.minierp.utils.erp_backend import make_client, ERPError


def get_settings() -> dict:
    """Get all settings."""
    client = make_client()
    return client.get("/settings")


def get_setting(key: str) -> dict:
    """Get a specific setting."""
    client = make_client()
    return client.get(f"/settings/{key}")


def update_setting(key: str, value: str) -> dict:
    """Update a specific setting."""
    client = make_client()
    return client.put(f"/settings/{key}", body={"value": value})


def update_settings(settings: dict[str, Any]) -> dict:
    """Update multiple settings at once."""
    client = make_client()
    return client.post("/settings/bulk", body=settings)
