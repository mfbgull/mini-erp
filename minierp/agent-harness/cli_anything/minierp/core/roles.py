"""Core: Roles — role-based access control management."""

from typing import Optional, Any
from cli_anything.minierp.utils.erp_backend import make_client


def list_roles() -> list[dict]:
    """List all roles."""
    client = make_client()
    return client.get("/roles")


def get_permissions() -> dict:
    """Get all permissions grouped by module."""
    client = make_client()
    return client.get("/roles/permissions")


def get_role_permissions(role_id: int) -> list[dict]:
    """Get permissions for a specific role."""
    client = make_client()
    return client.get(f"/roles/{role_id}/permissions")


def create_role(
    role_name: str,
    description: str = "",
    permissions: Optional[list[int]] = None,
) -> dict:
    """Create a new role."""
    client = make_client()
    body: dict[str, Any] = {"role_name": role_name}
    if description:
        body["description"] = description
    if permissions:
        body["permissions"] = permissions
    return client.post("/roles", body=body)


def update_role(
    role_id: int,
    role_name: Optional[str] = None,
    description: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> dict:
    """Update a role."""
    client = make_client()
    body: dict[str, Any] = {}
    if role_name is not None:
        body["role_name"] = role_name
    if description is not None:
        body["description"] = description
    if is_active is not None:
        body["is_active"] = is_active
    return client.put(f"/roles/{role_id}", body=body)


def update_role_permissions(role_id: int, permissions: list[int]) -> dict:
    """Update permissions for a role."""
    client = make_client()
    return client.put(
        f"/roles/{role_id}/permissions",
        body={"permissions": permissions},
    )


def delete_role(role_id: int) -> dict:
    """Delete a role."""
    client = make_client()
    return client.delete(f"/roles/{role_id}")
