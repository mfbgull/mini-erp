"""Core: Session management — auth + undo/redo.

This module bridges the CLI commands with the ERPSession object.
"""

from typing import Optional
from cli_anything.minierp.utils.erp_backend import (
    ERPClient,
    ERPSession,
    make_client,
    get_session,
    load_session,
    login_and_get_client,
    AuthenticationError,
    DEFAULT_BASE_URL,
)


def login(username: str, password: str, base_url: str = DEFAULT_BASE_URL) -> dict:
    """Authenticate and persist session."""
    user_data, client = login_and_get_client(username, password, base_url)
    return {"username": username, "base_url": base_url}


def logout() -> dict:
    sess = load_session()
    try:
        client = make_client(require_auth=False)
        client.post("/auth/logout")
    except Exception:
        pass
    sess.clear()
    return {"status": "logged out"}


def current_user() -> dict:
    client = make_client()
    return client.get("/auth/me")


def change_password(current_password: str, new_password: str) -> dict:
    client = make_client()
    return client.post(
        "/auth/change-password",
        body={
            "currentPassword": current_password,
            "newPassword": new_password,
        },
    )


def session_status() -> dict:
    sess = load_session()
    return {
        "logged_in": sess.is_logged_in,
        "username": sess.username,
        "base_url": sess.base_url,
        "context": sess.context,
        "can_undo": sess.can_undo,
        "can_redo": sess.can_redo,
    }
