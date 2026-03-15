"""Core: Activity Log — system activity tracking."""

from typing import Optional, Any
from cli_anything.minierp.utils.erp_backend import make_client, ERPError


def list_activity_logs(
    page: int = 1,
    limit: int = 50,
    entity_type: Optional[str] = None,
    action: Optional[str] = None,
    user_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> dict:
    """List activity logs with filtering."""
    client = make_client()
    params: dict[str, Any] = {"page": page, "limit": limit}
    if entity_type:
        params["entity_type"] = entity_type
    if action:
        params["action"] = action
    if user_id:
        params["user_id"] = user_id
    if start_date:
        params["start_date"] = start_date
    if end_date:
        params["end_date"] = end_date
    return client.get("/", params=params)


def get_activity_stats(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> dict:
    """Get activity statistics."""
    client = make_client()
    params = {}
    if start_date:
        params["start_date"] = start_date
    if end_date:
        params["end_date"] = end_date
    return client.get("/stats", params=params)


def get_recent_activity(limit: int = 20) -> dict:
    """Get recent activity for dashboard."""
    client = make_client()
    return client.get("/recent", params={"limit": limit})


def get_entity_types() -> dict:
    """Get available entity types for filtering."""
    client = make_client()
    return client.get("/entity-types")


def get_actions() -> dict:
    """Get available actions for filtering."""
    client = make_client()
    return client.get("/actions")


def get_users() -> dict:
    """Get all users for filtering."""
    client = make_client()
    return client.get("/users")


def get_user_activity(user_id: int, page: int = 1, limit: int = 50) -> dict:
    """Get activity logs for a specific user."""
    client = make_client()
    return client.get(f"/user/{user_id}", params={"page": page, "limit": limit})


def get_entity_activity(
    entity_type: str, entity_id: int, page: int = 1, limit: int = 50
) -> dict:
    """Get activity logs for a specific entity."""
    client = make_client()
    return client.get(
        f"/entity/{entity_type}/{entity_id}", params={"page": page, "limit": limit}
    )


def export_logs(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    entity_type: Optional[str] = None,
    action: Optional[str] = None,
) -> dict:
    """Export activity logs to CSV."""
    client = make_client()
    params = {}
    if start_date:
        params["start_date"] = start_date
    if end_date:
        params["end_date"] = end_date
    if entity_type:
        params["entity_type"] = entity_type
    if action:
        params["action"] = action
    return client.get("/export", params=params)
