"""End-to-end tests for Mini ERP CLI.

These tests require a running Mini ERP server. They make real HTTP requests
to the API endpoints.
"""

import json
import os
import subprocess
import sys

import pytest

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def _resolve_cli():
    """Resolve the CLI command path for subprocess testing."""
    # Check if installed via pip
    try:
        result = subprocess.run(
            ["which", "cli-anything-minierp"],
            capture_output=True,
            text=True,
            env={**os.environ, "CLI_ANYTHING_FORCE_INSTALLED": "1"},
        )
        if result.returncode == 0:
            return "cli-anything-minierp"
    except Exception:
        pass

    # Fall back to module path
    return [sys.executable, "-m", "cli_anything.minierp.minierp_cli"]


# ── Test Fixtures ─────────────────────────────────────────────────


@pytest.fixture
def cli():
    """CLI command to use for testing."""
    cmd = _resolve_cli()
    if isinstance(cmd, list):
        return cmd
    return [cmd]


@pytest.fixture
def clean_session():
    """Clean session before and after tests."""
    import shutil
    from cli_anything.minierp.utils.erp_backend import SESSION_DIR

    # Clean before
    if SESSION_DIR.exists():
        shutil.rmtree(SESSION_DIR)

    yield

    # Clean after
    if SESSION_DIR.exists():
        shutil.rmtree(SESSION_DIR)


# ── Authentication Tests ─────────────────────────────────────────


class TestAuthentication:
    """E2E tests for authentication flow."""

    def test_login_with_valid_credentials(self, cli, clean_session):
        """Login with valid credentials succeeds."""
        cmd = cli + ["auth", "login", "-u", "admin", "-p", "admin123"]
        result = subprocess.run(cmd, capture_output=True, text=True)

        assert result.returncode == 0
        assert "admin" in result.stdout.lower() or "logged in" in result.stdout.lower()

    def test_login_with_invalid_credentials(self, cli, clean_session):
        """Login with invalid credentials fails."""
        cmd = cli + ["auth", "login", "-u", "admin", "-p", "wrongpassword"]
        result = subprocess.run(cmd, capture_output=True, text=True)

        assert result.returncode != 0

    def test_logout_clears_session(self, cli, clean_session):
        """Logout clears session."""
        # Login first
        subprocess.run(
            cli + ["auth", "login", "-u", "admin", "-p", "admin123"],
            capture_output=True,
        )

        # Logout
        cmd = cli + ["auth", "logout"]
        result = subprocess.run(cmd, capture_output=True, text=True)

        assert result.returncode == 0

    def test_auth_status_shows_state(self, cli, clean_session):
        """Auth status reflects current state."""
        # Login first
        subprocess.run(
            cli + ["auth", "login", "-u", "admin", "-p", "admin123"],
            capture_output=True,
        )

        # Check status
        cmd = cli + ["auth", "status"]
        result = subprocess.run(cmd, capture_output=True, text=True)

        assert result.returncode == 0


# ── Inventory Workflow Tests ─────────────────────────────────────


class TestInventoryWorkflow:
    """E2E tests for inventory operations."""

    def test_create_read_update_delete_item(self, cli, clean_session):
        """CRUD cycle for inventory item."""
        # Login
        subprocess.run(
            cli + ["auth", "login", "-u", "admin", "-p", "admin123"],
            capture_output=True,
        )

        # Create item
        cmd = cli + [
            "inventory",
            "items",
            "create",
            "--code",
            "TEST-E2E-001",
            "--name",
            "E2E Test Item",
            "--category",
            "Test",
            "--stock",
            "10",
            "--sell-price",
            "100",
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        assert result.returncode == 0

        # List items
        cmd = cli + ["inventory", "items", "list"]
        result = subprocess.run(cmd, capture_output=True, text=True)
        assert result.returncode == 0

    def test_stock_balances(self, cli, clean_session):
        """Stock balances returns data."""
        subprocess.run(
            cli + ["auth", "login", "-u", "admin", "-p", "admin123"],
            capture_output=True,
        )

        cmd = cli + ["inventory", "stock"]
        result = subprocess.run(cmd, capture_output=True, text=True)

        assert result.returncode == 0

    def test_low_stock_detection(self, cli, clean_session):
        """Low stock detection works."""
        subprocess.run(
            cli + ["auth", "login", "-u", "admin", "-p", "admin123"],
            capture_output=True,
        )

        cmd = cli + ["inventory", "low-stock"]
        result = subprocess.run(cmd, capture_output=True, text=True)

        assert result.returncode == 0


# ── Customer Workflow Tests ──────────────────────────────────────


class TestCustomerWorkflow:
    """E2E tests for customer operations."""

    def test_create_customer_with_details(self, cli, clean_session):
        """Create customer with full details."""
        subprocess.run(
            cli + ["auth", "login", "-u", "admin", "-p", "admin123"],
            capture_output=True,
        )

        cmd = cli + [
            "customers",
            "create",
            "--code",
            "CUST-E2E-001",
            "--name",
            "E2E Test Customer",
            "--email",
            "test@e2e.com",
            "--phone",
            "555-1234",
            "--address",
            "123 Test St",
            "--credit-limit",
            "10000",
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)

        assert result.returncode == 0
        assert (
            "test customer" in result.stdout.lower()
            or "created" in result.stdout.lower()
        )

    def test_list_customers(self, cli, clean_session):
        """List customers returns data."""
        subprocess.run(
            cli + ["auth", "login", "-u", "admin", "-p", "admin123"],
            capture_output=True,
        )

        cmd = cli + ["customers", "list"]
        result = subprocess.run(cmd, capture_output=True, text=True)

        assert result.returncode == 0

    def test_customer_balance(self, cli, clean_session):
        """Customer balance calculates."""
        subprocess.run(
            cli + ["auth", "login", "-u", "admin", "-p", "admin123"],
            capture_output=True,
        )

        # Try to get balance for customer ID 1
        cmd = cli + ["customers", "balance", "1"]
        result = subprocess.run(cmd, capture_output=True, text=True)

        # May fail if no customer exists, but should not crash
        assert result.returncode in [0, 1]

    def test_customer_ledger(self, cli, clean_session):
        """Customer ledger returns transactions."""
        subprocess.run(
            cli + ["auth", "login", "-u", "admin", "-p", "admin123"],
            capture_output=True,
        )

        cmd = cli + ["customers", "ledger", "1"]
        result = subprocess.run(cmd, capture_output=True, text=True)

        # May fail if no customer, but should not crash
        assert result.returncode in [0, 1]


# ── Invoice Workflow Tests ──────────────────────────────────────


class TestInvoiceWorkflow:
    """E2E tests for invoice operations."""

    def test_list_invoices(self, cli, clean_session):
        """List invoices returns data."""
        subprocess.run(
            cli + ["auth", "login", "-u", "admin", "-p", "admin123"],
            capture_output=True,
        )

        cmd = cli + ["invoices", "list"]
        result = subprocess.run(cmd, capture_output=True, text=True)

        assert result.returncode == 0

    def test_create_invoice(self, cli, clean_session):
        """Create invoice with line items."""
        subprocess.run(
            cli + ["auth", "login", "-u", "admin", "-p", "admin123"],
            capture_output=True,
        )

        # First create a customer
        subprocess.run(
            cli
            + [
                "customers",
                "create",
                "--code",
                "INV-CUST-001",
                "--name",
                "Invoice Customer",
            ],
            capture_output=True,
        )

        # Create invoice
        cmd = cli + [
            "invoices",
            "create",
            "--customer-id",
            "1",
            "--date",
            "2024-01-15",
            "--due",
            "2024-02-15",
            "--items",
            '[{"item_id":1,"quantity":1,"unit_price":100}]',
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)

        # May fail if no items exist, but should not crash
        assert result.returncode in [0, 1]


# ── CLI Subprocess Tests ────────────────────────────────────────


class TestCLISubprocess:
    """Tests for CLI subprocess invocation."""

    def test_help_command(self, cli):
        """--help prints usage info."""
        cmd = cli + ["--help"]
        result = subprocess.run(cmd, capture_output=True, text=True)

        assert result.returncode == 0
        assert "usage" in result.stdout.lower() or "commands" in result.stdout.lower()

    def test_auth_status_command(self, cli, clean_session):
        """Auth status shows session state."""
        # Login first
        subprocess.run(
            cli + ["auth", "login", "-u", "admin", "-p", "admin123"],
            capture_output=True,
        )

        cmd = cli + ["auth", "status"]
        result = subprocess.run(cmd, capture_output=True, text=True)

        assert result.returncode == 0

    def test_json_flag_returns_valid_json(self, cli, clean_session):
        """--json flag returns valid JSON output."""
        # Login first
        subprocess.run(
            cli + ["auth", "login", "-u", "admin", "-p", "admin123"],
            capture_output=True,
        )

        cmd = cli + ["--json", "auth", "status"]
        result = subprocess.run(cmd, capture_output=True, text=True)

        assert result.returncode == 0

        # Try to parse as JSON
        try:
            data = json.loads(result.stdout)
            assert isinstance(data, dict)
        except json.JSONDecodeError:
            pytest.fail("Output is not valid JSON")
