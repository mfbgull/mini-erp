"""ERP Backend — HTTP client wrapper for the Mini ERP REST API.

This module handles:
- Session management (cookie-based session)
- Authenticated HTTP requests to the Express server
- Clear error messages when the server is not running
- Undo/redo state stack management
"""

import json
import os
import sys
import copy
from pathlib import Path
from typing import Any, Optional

try:
    import requests
except ImportError:
    requests = None  # type: ignore


# ── Constants ─────────────────────────────────────────────────────────

DEFAULT_BASE_URL = os.environ.get("MINIERP_URL", "http://localhost:3010/api")
SESSION_DIR = Path.home() / ".cli-anything-minierp"
SESSION_FILE = SESSION_DIR / "session.json"
UNDO_MAX = 50


# ── Session state ─────────────────────────────────────────────────────


class ERPSession:
    """Persistent session: cookie-based auth + server URL + undo/redo stack."""

    def __init__(self):
        self.base_url: str = DEFAULT_BASE_URL
        self.username: Optional[str] = None
        self.context: Optional[str] = None
        self._undo_stack: list[dict] = []
        self._redo_stack: list[dict] = []
        self._cookies: dict = {}

    # -- Serialization -------------------------------------------------

    def to_dict(self) -> dict:
        return {
            "base_url": self.base_url,
            "username": self.username,
            "context": self.context,
            "cookies": self._cookies,
        }

    def from_dict(self, data: dict) -> None:
        self.base_url = data.get("base_url", DEFAULT_BASE_URL)
        self.username = data.get("username")
        self.context = data.get("context")
        self._cookies = data.get("cookies", {})

    def save(self) -> None:
        SESSION_DIR.mkdir(parents=True, exist_ok=True)
        SESSION_FILE.write_text(json.dumps(self.to_dict(), indent=2))

    def load(self) -> bool:
        """Load session from disk. Returns True if username exists."""
        if not SESSION_FILE.exists():
            return False
        try:
            data = json.loads(SESSION_FILE.read_text())
            self.from_dict(data)
            return bool(self.username)
        except (json.JSONDecodeError, KeyError):
            return False

    def clear(self) -> None:
        self.username = None
        self.context = None
        self._cookies = {}
        if SESSION_FILE.exists():
            SESSION_FILE.unlink()

    # -- Undo/Redo -----------------------------------------------------

    def push_undo(self, snapshot: dict) -> None:
        """Push a snapshot to the undo stack (max UNDO_MAX)."""
        self._undo_stack.append(copy.deepcopy(snapshot))
        if len(self._undo_stack) > UNDO_MAX:
            self._undo_stack.pop(0)
        self._redo_stack.clear()

    def undo(self) -> Optional[dict]:
        """Pop and return the last undo snapshot."""
        if not self._undo_stack:
            return None
        snap = self._undo_stack.pop()
        self._redo_stack.append(snap)
        return snap

    def redo(self) -> Optional[dict]:
        """Pop and return the last redo snapshot."""
        if not self._redo_stack:
            return None
        snap = self._redo_stack.pop()
        self._undo_stack.append(snap)
        return snap

    @property
    def can_undo(self) -> bool:
        return len(self._undo_stack) > 0

    @property
    def can_redo(self) -> bool:
        return len(self._redo_stack) > 0

    @property
    def is_logged_in(self) -> bool:
        return bool(self.username)


# ── Singleton session ─────────────────────────────────────────────────

_session = ERPSession()


def get_session() -> ERPSession:
    return _session


def load_session() -> ERPSession:
    _session.load()
    return _session


# ── HTTP client ───────────────────────────────────────────────────────


class ERPClient:
    """Thin HTTP wrapper around the Mini ERP REST API with cookie-based auth."""

    def __init__(self, base_url: Optional[str] = None, cookies: Optional[dict] = None):
        if requests is None:
            raise RuntimeError(
                "The 'requests' library is required. Install with: pip install requests"
            )
        self.base_url = (base_url or DEFAULT_BASE_URL).rstrip("/")
        self.cookies = cookies or {}
        self.session = requests.Session()

    def _headers(self) -> dict:
        return {"Content-Type": "application/json"}

    def _url(self, path: str) -> str:
        return f"{self.base_url}/{path.lstrip('/')}"

    def _handle_response(self, resp) -> Any:
        """Parse response, raise clear errors on failure."""
        try:
            data = resp.json()
        except ValueError:
            data = {"message": resp.text}

        if resp.status_code == 401:
            raise AuthenticationError(
                "Authentication failed. Run: cli-anything-minierp auth login"
            )
        if resp.status_code == 403:
            raise PermissionError("Insufficient permissions for this operation.")
        if resp.status_code == 404:
            raise NotFoundError(f"Resource not found: {data.get('message', '')}")
        if not resp.ok:
            msg = data.get("message") or data.get("error") or str(data)
            raise APIError(f"API error {resp.status_code}: {msg}")

        return data

    def _request(
        self,
        method: str,
        path: str,
        params: Optional[dict] = None,
        body: Optional[dict] = None,
    ) -> Any:
        url = self._url(path)
        try:
            resp = self.session.request(
                method,
                url,
                headers=self._headers(),
                params={k: v for k, v in (params or {}).items() if v is not None},
                json=body,
                cookies=self.cookies,
                timeout=30,
            )
        except requests.exceptions.ConnectionError:
            raise ServerNotRunningError(
                f"Cannot connect to Mini ERP server at {self.base_url}.\n"
                "Start it with:\n"
                "  cd /home/fawad/ai/minierp/server && npm start\n"
                "Or set MINIERP_URL to your server address."
            )
        except requests.exceptions.Timeout:
            raise APIError("Request timed out. Is the server overloaded?")

        return self._handle_response(resp)

    def get(self, path: str, params: Optional[dict] = None) -> Any:
        return self._request("GET", path, params=params)

    def post(self, path: str, body: Optional[dict] = None) -> Any:
        return self._request("POST", path, body=body)

    def put(self, path: str, body: Optional[dict] = None) -> Any:
        return self._request("PUT", path, body=body)

    def delete(self, path: str) -> Any:
        return self._request("DELETE", path)


# ── Exceptions ────────────────────────────────────────────────────────


class ERPError(Exception):
    """Base exception for ERP CLI errors."""


class ServerNotRunningError(ERPError):
    """Raised when the Mini ERP server is not reachable."""


class AuthenticationError(ERPError):
    """Raised on 401 responses."""


class NotFoundError(ERPError):
    """Raised on 404 responses."""


class APIError(ERPError):
    """General API error."""


# ── Factory ───────────────────────────────────────────────────────────


def make_client(require_auth: bool = True) -> ERPClient:
    """Create an authenticated ERPClient from the current session."""
    sess = load_session()
    if require_auth and not sess.is_logged_in:
        raise AuthenticationError("Not logged in. Run: cli-anything-minierp auth login")
    return ERPClient(base_url=sess.base_url, cookies=sess._cookies)


def login_and_get_client(
    username: str, password: str, base_url: str = DEFAULT_BASE_URL
) -> tuple[dict, ERPClient]:
    """Login and return user data and authenticated client."""
    client = ERPClient(base_url=base_url)
    data = client.post("/auth/login", body={"username": username, "password": password})

    if not data.get("success"):
        raise AuthenticationError("Login failed")

    user_data = data.get("data", {}).get("user", {})
    sess = get_session()
    sess.base_url = base_url
    sess.username = user_data.get("username")
    sess._cookies = dict(client.session.cookies)
    sess.save()

    authenticated_client = ERPClient(base_url=base_url, cookies=sess._cookies)
    return user_data, authenticated_client
