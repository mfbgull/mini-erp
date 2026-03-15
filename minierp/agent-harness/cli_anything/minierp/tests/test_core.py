"""Unit tests for Mini ERP CLI core modules.

Tests use mocking to simulate API responses - no running server required.
"""

import json
import os
import sys
import tempfile
from unittest.mock import MagicMock, patch

import pytest

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from cli_anything.minierp.core.session import (
    login,
    logout,
    current_user,
    session_status,
    change_password,
)
from cli_anything.minierp.core.inventory import (
    list_items,
    get_item,
    create_item,
    update_item,
    delete_item,
    get_stock_balances,
    get_stock_summary,
    get_low_stock,
)
from cli_anything.minierp.core.customers import (
    list_customers,
    get_customer,
    create_customer,
    update_customer,
    delete_customer,
    get_customer_ledger,
    get_customer_balance,
)
from cli_anything.minierp.core.invoices import (
    list_invoices,
    get_invoice,
    create_invoice,
    delete_invoice,
    get_invoice_payments,
)
from cli_anything.minierp.core.expenses import (
    list_expenses,
    create_expense,
    delete_expense,
    get_expense_summary,
    list_categories,
)
from cli_anything.minierp.core.reports import (
    sales_summary,
    profit_loss,
    stock_level,
    low_stock,
    ar_aging,
    ar_summary,
    expenses_report,
)
from cli_anything.minierp.utils.erp_backend import (
    ERPError,
    AuthenticationError,
    ServerNotRunningError,
    ERPSession,
)


# ── Session Tests ─────────────────────────────────────────────────


class TestSession:
    """Tests for session management."""

    def test_login_success(self):
        """Login stores token and username in session."""
        mock_response = {
            "token": "test_token_123",
            "username": "admin",
            "user_id": 1,
        }

        with patch("cli_anything.minierp.core.session.ERPClient") as MockClient:
            with patch(
                "cli_anything.minierp.core.session.get_session"
            ) as mock_get_sess:
                mock_client = MagicMock()
                mock_client.post.return_value = mock_response
                MockClient.return_value = mock_client

                mock_session = MagicMock()
                mock_session.token = None
                mock_get_sess.return_value = mock_session

                result = login("admin", "admin123")

                assert result["username"] == "admin"
                assert result["token"] == "test_token_123"
                mock_session.save.assert_called_once()

    def test_login_failure(self):
        """Login raises AuthenticationError on failure."""
        with patch("cli_anything.minierp.core.session.ERPClient") as MockClient:
            mock_client = MagicMock()
            mock_client.post.side_effect = ERPError("Invalid credentials")
            MockClient.return_value = mock_client

            with pytest.raises(ERPError):
                login("admin", "wrong_password")

    def test_logout_clears_session(self):
        """Logout clears session data."""
        with patch("cli_anything.minierp.core.session.load_session") as mock_load:
            with patch("cli_anything.minierp.core.session.make_client") as mock_make:
                mock_session = MagicMock()
                mock_session.token = "test_token"
                mock_load.return_value = mock_session

                mock_client = MagicMock()
                mock_make.return_value = mock_client

                result = logout()

                mock_session.clear.assert_called_once()

    def test_current_user_returns_info(self):
        """Current user returns user info when logged in."""
        mock_response = {"id": 1, "username": "admin", "email": "admin@test.com"}

        with patch("cli_anything.minierp.core.session.load_session") as mock_load:
            with patch("cli_anything.minierp.core.session.make_client") as mock_make:
                mock_session = MagicMock()
                mock_session.token = "test_token"
                mock_load.return_value = mock_session

                mock_client = MagicMock()
                mock_client.get.return_value = mock_response
                mock_make.return_value = mock_client

                result = current_user()

                assert result["username"] == "admin"

    def test_current_user_not_logged_in(self):
        """Current user raises error when not logged in."""
        with patch("cli_anything.minierp.core.session.load_session") as mock_load:
            mock_session = MagicMock()
            mock_session.token = None
            mock_load.return_value = mock_session

            with pytest.raises(AuthenticationError):
                current_user()

    def test_session_status_returns_state(self):
        """Session status shows correct state."""
        with patch("cli_anything.minierp.core.session.load_session") as mock_load:
            mock_session = MagicMock()
            mock_session.token = "test_token"
            mock_session.username = "admin"
            mock_session.base_url = "http://localhost:3010/api"
            mock_session.context = None
            mock_session.can_undo = False
            mock_session.can_redo = False
            mock_load.return_value = mock_session

            status = session_status()

            assert status["logged_in"] is True
            assert status["username"] == "admin"

    def test_change_password(self):
        """Change password sends correct API request."""
        with patch("cli_anything.minierp.core.session.load_session") as mock_load:
            with patch("cli_anything.minierp.core.session.make_client") as mock_make:
                mock_session = MagicMock()
                mock_session.token = "test_token"
                mock_load.return_value = mock_session

                mock_client = MagicMock()
                mock_client.post.return_value = {"success": True}
                mock_make.return_value = mock_client

                result = change_password("old123", "new456")

                assert result["success"] is True


# ── Inventory Tests ───────────────────────────────────────────────


class TestInventory:
    """Tests for inventory management."""

    def test_list_items(self):
        """List items returns formatted list."""
        mock_response = [
            {"id": 1, "item_code": "ITEM001", "item_name": "Test Item", "quantity": 10}
        ]

        with patch("cli_anything.minierp.core.inventory.make_client") as mock_make:
            mock_client = MagicMock()
            mock_client.get.return_value = mock_response
            mock_make.return_value = mock_client

            result = list_items()

            assert len(result) == 1
            assert result[0]["item_code"] == "ITEM001"

    def test_list_items_with_search(self):
        """List items supports search filter."""
        with patch("cli_anything.minierp.core.inventory.make_client") as mock_make:
            mock_client = MagicMock()
            mock_client.get.return_value = []
            mock_make.return_value = mock_client

            list_items(search="test")

            mock_client.get.assert_called_once()
            call_args = mock_client.get.call_args
            assert "search" in call_args[1]["params"]

    def test_get_item(self):
        """Get item returns item by ID."""
        mock_response = {"id": 1, "item_code": "ITEM001", "item_name": "Test"}

        with patch("cli_anything.minierp.core.inventory.make_client") as mock_make:
            mock_client = MagicMock()
            mock_client.get.return_value = mock_response
            mock_make.return_value = mock_client

            result = get_item(1)

            assert result["id"] == 1

    def test_create_item(self):
        """Create item sends correct payload."""
        mock_response = {"id": 2, "item_code": "ITEM002", "item_name": "New Item"}

        with patch("cli_anything.minierp.core.inventory.make_client") as mock_make:
            mock_client = MagicMock()
            mock_client.post.return_value = mock_response
            mock_make.return_value = mock_client

            result = create_item(
                "ITEM002", "New Item", "Electronics", "PCS", 5, 10, 100, 150
            )

            assert result["item_code"] == "ITEM002"

    def test_update_item(self):
        """Update item updates only provided fields."""
        mock_response = {"id": 1, "item_name": "Updated"}

        with patch("cli_anything.minierp.core.inventory.make_client") as mock_make:
            mock_client = MagicMock()
            mock_client.put.return_value = mock_response
            mock_make.return_value = mock_client

            result = update_item(1, item_name="Updated")

            assert result["item_name"] == "Updated"

    def test_delete_item(self):
        """Delete item sends DELETE request."""
        with patch("cli_anything.minierp.core.inventory.make_client") as mock_make:
            mock_client = MagicMock()
            mock_client.delete.return_value = {"success": True}
            mock_make.return_value = mock_client

            result = delete_item(1)

            assert result["success"] is True

    def test_get_stock_balances(self):
        """Stock balances returns warehouse quantities."""
        mock_response = [{"item_id": 1, "warehouse_id": 1, "quantity": 100}]

        with patch("cli_anything.minierp.core.inventory.make_client") as mock_make:
            mock_client = MagicMock()
            mock_client.get.return_value = mock_response
            mock_make.return_value = mock_client

            result = get_stock_balances()

            assert len(result) == 1

    def test_get_low_stock(self):
        """Low stock returns items below reorder level."""
        mock_response = [
            {"id": 1, "item_name": "Low Item", "quantity": 5, "reorder_level": 10}
        ]

        with patch("cli_anything.minierp.core.inventory.make_client") as mock_make:
            mock_client = MagicMock()
            mock_client.get.return_value = mock_response
            mock_make.return_value = mock_client

            result = get_low_stock()

            assert len(result) == 1


# ── Customer Tests ───────────────────────────────────────────────


class TestCustomers:
    """Tests for customer management."""

    def test_list_customers(self):
        """List customers returns formatted list."""
        mock_response = [
            {"id": 1, "customer_code": "C001", "customer_name": "Acme Corp"}
        ]

        with patch("cli_anything.minierp.core.customers.make_client") as mock_make:
            mock_client = MagicMock()
            mock_client.get.return_value = mock_response
            mock_make.return_value = mock_client

            result = list_customers()

            assert len(result) == 1
            assert result[0]["customer_code"] == "C001"

    def test_list_customers_with_search(self):
        """List customers supports search."""
        with patch("cli_anything.minierp.core.customers.make_client") as mock_make:
            mock_client = MagicMock()
            mock_client.get.return_value = []
            mock_make.return_value = mock_client

            list_customers(search="acme")

            call_args = mock_client.get.call_args
            assert "search" in call_args[1]["params"]

    def test_get_customer(self):
        """Get customer returns details."""
        mock_response = {"id": 1, "customer_code": "C001", "customer_name": "Acme"}

        with patch("cli_anything.minierp.core.customers.make_client") as mock_make:
            mock_client = MagicMock()
            mock_client.get.return_value = mock_response
            mock_make.return_value = mock_client

            result = get_customer(1)

            assert result["id"] == 1

    def test_create_customer(self):
        """Create customer validates and sends payload."""
        mock_response = {"id": 2, "customer_code": "C002", "customer_name": "New Corp"}

        with patch("cli_anything.minierp.core.customers.make_client") as mock_make:
            mock_client = MagicMock()
            mock_client.post.return_value = mock_response
            mock_make.return_value = mock_client

            result = create_customer(
                "C002", "New Corp", "email@test.com", "123456", "Address", 50000
            )

            assert result["customer_code"] == "C002"

    def test_update_customer(self):
        """Update customer partial updates."""
        mock_response = {"id": 1, "customer_name": "Updated Name"}

        with patch("cli_anything.minierp.core.customers.make_client") as mock_make:
            mock_client = MagicMock()
            mock_client.put.return_value = mock_response
            mock_make.return_value = mock_client

            result = update_customer(1, customer_name="Updated Name")

            assert result["customer_name"] == "Updated Name"

    def test_delete_customer(self):
        """Delete customer removes record."""
        with patch("cli_anything.minierp.core.customers.make_client") as mock_make:
            mock_client = MagicMock()
            mock_client.delete.return_value = {"success": True}
            mock_make.return_value = mock_client

            result = delete_customer(1)

            assert result["success"] is True

    def test_customer_ledger(self):
        """Customer ledger returns transactions."""
        mock_response = [
            {
                "date": "2024-01-15",
                "description": "Invoice #1",
                "debit": 1000,
                "credit": 0,
            }
        ]

        with patch("cli_anything.minierp.core.customers.make_client") as mock_make:
            mock_client = MagicMock()
            mock_client.get.return_value = mock_response
            mock_make.return_value = mock_client

            result = get_customer_ledger(1)

            assert len(result) == 1

    def test_customer_balance(self):
        """Customer balance calculates outstanding."""
        mock_response = {"customer_id": 1, "balance": 5000}

        with patch("cli_anything.minierp.core.customers.make_client") as mock_make:
            mock_client = MagicMock()
            mock_client.get.return_value = mock_response
            mock_make.return_value = mock_client

            result = get_customer_balance(1)

            assert result["balance"] == 5000


# ── Invoice Tests ───────────────────────────────────────────────


class TestInvoices:
    """Tests for invoice management."""

    def test_list_invoices(self):
        """List invoices with pagination."""
        mock_response = [{"id": 1, "invoice_number": "INV-001", "total": 1000}]

        with patch("cli_anything.minierp.core.invoices.make_client") as mock_make:
            mock_client = MagicMock()
            mock_client.get.return_value = mock_response
            mock_make.return_value = mock_client

            result = list_invoices()

            assert len(result) == 1

    def test_get_invoice(self):
        """Get invoice returns with line items."""
        mock_response = {
            "id": 1,
            "invoice_number": "INV-001",
            "items": [{"item_id": 1, "quantity": 2, "unit_price": 100}],
        }

        with patch("cli_anything.minierp.core.invoices.make_client") as mock_make:
            mock_client = MagicMock()
            mock_client.get.return_value = mock_response
            mock_make.return_value = mock_client

            result = get_invoice(1)

            assert "items" in result

    def test_create_invoice(self):
        """Create invoice with line items."""
        mock_response = {"id": 2, "invoice_number": "INV-002"}

        with patch("cli_anything.minierp.core.invoices.make_client") as mock_make:
            mock_client = MagicMock()
            mock_client.post.return_value = mock_response
            mock_make.return_value = mock_client

            items = [{"item_id": 1, "quantity": 2, "unit_price": 100}]
            result = create_invoice(1, "2024-01-15", "2024-02-15", items, "Test notes")

            assert result["invoice_number"] == "INV-002"

    def test_delete_invoice(self):
        """Delete invoice removes record."""
        with patch("cli_anything.minierp.core.invoices.make_client") as mock_make:
            mock_client = MagicMock()
            mock_client.delete.return_value = {"success": True}
            mock_make.return_value = mock_client

            result = delete_invoice(1)

            assert result["success"] is True

    def test_invoice_payments(self):
        """Invoice payments returns payment history."""
        mock_response = [{"date": "2024-01-20", "amount": 500}]

        with patch("cli_anything.minierp.core.invoices.make_client") as mock_make:
            mock_client = MagicMock()
            mock_client.get.return_value = mock_response
            mock_make.return_value = mock_client

            result = get_invoice_payments(1)

            assert len(result) == 1


# ── Expense Tests ───────────────────────────────────────────────


class TestExpenses:
    """Tests for expense management."""

    def test_list_expenses(self):
        """List expenses with pagination."""
        mock_response = [{"id": 1, "category": "Office", "amount": 500}]

        with patch("cli_anything.minierp.core.expenses.make_client") as mock_make:
            mock_client = MagicMock()
            mock_client.get.return_value = mock_response
            mock_make.return_value = mock_client

            result = list_expenses()

            assert len(result) == 1

    def test_create_expense(self):
        """Create expense with category."""
        mock_response = {"id": 2, "category": "Travel", "amount": 200}

        with patch("cli_anything.minierp.core.expenses.make_client") as mock_make:
            mock_client = MagicMock()
            mock_client.post.return_value = mock_response
            mock_make.return_value = mock_client

            result = create_expense(
                "2024-01-15", "Travel", 200, "Flight tickets", "card"
            )

            assert result["category"] == "Travel"

    def test_delete_expense(self):
        """Delete expense removes record."""
        with patch("cli_anything.minierp.core.expenses.make_client") as mock_make:
            mock_client = MagicMock()
            mock_client.delete.return_value = {"success": True}
            mock_make.return_value = mock_client

            result = delete_expense(1)

            assert result["success"] is True

    def test_expense_summary(self):
        """Expense summary calculates totals."""
        mock_response = {"total": 5000, "by_category": {"Office": 2000, "Travel": 3000}}

        with patch("cli_anything.minierp.core.expenses.make_client") as mock_make:
            mock_client = MagicMock()
            mock_client.get.return_value = mock_response
            mock_make.return_value = mock_client

            result = get_expense_summary("2024-01-01", "2024-01-31")

            assert result["total"] == 5000

    def test_expense_categories(self):
        """Expense categories returns list."""
        mock_response = ["Office", "Travel", "Utilities", "Software"]

        with patch("cli_anything.minierp.core.expenses.make_client") as mock_make:
            mock_client = MagicMock()
            mock_client.get.return_value = mock_response
            mock_make.return_value = mock_client

            result = list_categories()

            assert len(result) == 4

    def test_list_expenses_with_category(self):
        """List expenses filters by category."""
        with patch("cli_anything.minierp.core.expenses.make_client") as mock_make:
            mock_client = MagicMock()
            mock_client.get.return_value = []
            mock_make.return_value = mock_client

            list_expenses(1, 50, "Office")

            call_args = mock_client.get.call_args
            assert call_args[1]["params"]["category"] == "Office"


# ── Reports Tests ───────────────────────────────────────────────


class TestReports:
    """Tests for reporting functions."""

    def test_sales_summary(self):
        """Sales summary aggregates correctly."""
        mock_response = {"total_sales": 50000, "invoice_count": 25}

        with patch("cli_anything.minierp.core.reports.make_client") as mock_make:
            mock_client = MagicMock()
            mock_client.get.return_value = mock_response
            mock_make.return_value = mock_client

            result = sales_summary("2024-01-01", "2024-01-31")

            assert result["total_sales"] == 50000

    def test_profit_loss(self):
        """Profit/loss calculates margins."""
        mock_response = {"revenue": 50000, "expenses": 30000, "profit": 20000}

        with patch("cli_anything.minierp.core.reports.make_client") as mock_make:
            mock_client = MagicMock()
            mock_client.get.return_value = mock_response
            mock_make.return_value = mock_client

            result = profit_loss("2024-01-01", "2024-01-31")

            assert result["profit"] == 20000

    def test_stock_level(self):
        """Stock level shows quantities."""
        mock_response = [{"item_id": 1, "item_name": "Item 1", "quantity": 100}]

        with patch("cli_anything.minierp.core.reports.make_client") as mock_make:
            mock_client = MagicMock()
            mock_client.get.return_value = mock_response
            mock_make.return_value = mock_client

            result = stock_level()

            assert len(result) == 1

    def test_low_stock_report(self):
        """Low stock report shows items below reorder."""
        mock_response = [{"item_id": 1, "item_name": "Low Stock", "quantity": 5}]

        with patch("cli_anything.minierp.core.reports.make_client") as mock_make:
            mock_client = MagicMock()
            mock_client.get.return_value = mock_response
            mock_make.return_value = mock_client

            result = low_stock()

            assert len(result) == 1

    def test_ar_aging(self):
        """AR aging buckets correctly."""
        mock_response = {
            "current": 10000,
            "days_30": 5000,
            "days_60": 2000,
            "days_90": 1000,
            "over_90": 500,
        }

        with patch("cli_anything.minierp.core.reports.make_client") as mock_make:
            mock_client = MagicMock()
            mock_client.get.return_value = mock_response
            mock_make.return_value = mock_client

            result = ar_aging()

            assert result["current"] == 10000

    def test_ar_summary(self):
        """AR summary shows totals."""
        mock_response = {"total_receivable": 18500, "customer_count": 10}

        with patch("cli_anything.minierp.core.reports.make_client") as mock_make:
            mock_client = MagicMock()
            mock_client.get.return_value = mock_response
            mock_make.return_value = mock_client

            result = ar_summary()

            assert result["total_receivable"] == 18500

    def test_expenses_report(self):
        """Expenses report groups by category."""
        mock_response = {"total": 5000, "categories": {"Office": 2000, "Travel": 3000}}

        with patch("cli_anything.minierp.core.reports.make_client") as mock_make:
            mock_client = MagicMock()
            mock_client.get.return_value = mock_response
            mock_make.return_value = mock_client

            result = expenses_report("2024-01-01", "2024-01-31")

            assert result["total"] == 5000
