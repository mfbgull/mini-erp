"""Core: Users — system user management (admin only)."""

from typing import Optional, Any
from cli_anything.minierp.utils.erp_backend import make_client


def list_users(
    role: Optional[str] = None,
    is_active: Optional[str] = None,
    search: Optional[str] = None,
) -> list[dict]:
    """List all users with optional filters."""
    client = make_client()
    params: dict[str, Any] = {}
    if role:
        params["role"] = role
    if is_active:
        params["is_active"] = is_active
    if search:
        params["search"] = search
    return client.get("/users", params=params)


def get_user(user_id: int) -> dict:
    """Get a specific user by ID."""
    client = make_client()
    return client.get(f"/users/{user_id}")


def create_user(
    username: str,
    email: str,
    password: str,
    full_name: str,
    role_id: int,
    is_active: bool = True,
) -> dict:
    """Create a new user."""
    client = make_client()
    return client.post(
        "/users",
        body={
            "username": username,
            "email": email,
            "password": password,
            "full_name": full_name,
            "role_id": role_id,
            "is_active": is_active,
        },
    )


def update_user(
    user_id: int,
    username: Optional[str] = None,
    email: Optional[str] = None,
    full_name: Optional[str] = None,
    role_id: Optional[int] = None,
    is_active: Optional[bool] = None,
) -> dict:
    """Update a user."""
    client = make_client()
    body: dict[str, Any] = {}
    if username is not None:
        body["username"] = username
    if email is not None:
        body["email"] = email
    if full_name is not None:
        body["full_name"] = full_name
    if role_id is not None:
        body["role_id"] = role_id
    if is_active is not None:
        body["is_active"] = is_active
    return client.put(f"/users/{user_id}", body=body)


def delete_user(user_id: int) -> dict:
    """Delete a user (soft delete)."""
    client = make_client()
    return client.delete(f"/users/{user_id}")


def reset_password(user_id: int, new_password: str) -> dict:
    """Reset password for a user."""
    client = make_client()
    return client.put(
        f"/users/{user_id}/reset-password",
        body={"newPassword": new_password},
    )


def toggle_user_status(user_id: int, is_active: bool) -> dict:
    """Toggle user active/inactive status."""
    client = make_client()
    return client.put(
        f"/users/{user_id}/toggle-status",
        body={"is_active": is_active},
    )
