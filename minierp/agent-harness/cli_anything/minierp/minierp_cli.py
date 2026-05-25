"""Mini ERP CLI — agent-native command-line interface.

Usage:
    cli-anything-minierp                    # enter REPL
    cli-anything-minierp --json auth login  # JSON output
    cli-anything-minierp inventory items list
"""

import json
import sys
import os
import click
from typing import Optional

from cli_anything.minierp.utils.erp_backend import (
    ERPError,
    AuthenticationError,
    ServerNotRunningError,
    load_session,
    get_session,
)
from cli_anything.minierp.utils.repl_skin import ReplSkin

# ── Helpers ───────────────────────────────────────────────────────────


def _out(ctx: click.Context, data: object) -> None:
    """Print data as JSON or human-readable based on --json flag."""
    if ctx.obj and ctx.obj.get("json"):
        click.echo(json.dumps(data, indent=2, default=str))
    else:
        if isinstance(data, (dict, list)):
            click.echo(json.dumps(data, indent=2, default=str))
        else:
            click.echo(str(data))


def _ok(ctx: click.Context, message: str, data: object = None) -> None:
    if ctx.obj and ctx.obj.get("json"):
        payload = {"status": "ok", "message": message}
        if data is not None:
            payload["data"] = data
        click.echo(json.dumps(payload, indent=2, default=str))
    else:
        click.echo(f"✓ {message}")


def _err(message: str, ctx: Optional[click.Context] = None) -> None:
    if ctx and ctx.obj and ctx.obj.get("json"):
        click.echo(json.dumps({"status": "error", "message": message}), err=True)
    else:
        click.echo(f"✗ {message}", err=True)


def _handle_error(exc: Exception, ctx: Optional[click.Context] = None) -> None:
    _err(str(exc), ctx)
    sys.exit(1)


# ── Root CLI group ────────────────────────────────────────────────────


@click.group(invoke_without_command=True)
@click.option(
    "--json",
    "output_json",
    is_flag=True,
    help="Output results as JSON (for agent consumption).",
)
@click.option(
    "--url",
    default=None,
    envvar="MINIERP_URL",
    help="Mini ERP server URL (default: http://localhost:3010/api).",
)
@click.version_option("1.0.0", prog_name="cli-anything-minierp")
@click.pass_context
def cli(ctx: click.Context, output_json: bool, url: Optional[str]) -> None:
    """Mini ERP CLI — agent-native control for the Mini ERP system.

    Run without arguments to enter interactive REPL mode.
    Use --json for machine-readable output in all commands.

    \b
    Quick start:
        cli-anything-minierp auth login --username admin --password admin123
        cli-anything-minierp inventory items list
        cli-anything-minierp --json customers list
    """
    ctx.ensure_object(dict)
    ctx.obj["json"] = output_json

    # Override base URL if provided
    if url:
        sess = get_session()
        sess.base_url = url

    if ctx.invoked_subcommand is None:
        ctx.invoke(repl)


# ── REPL command ──────────────────────────────────────────────────────


@cli.command(hidden=True)
@click.pass_context
def repl(ctx: click.Context) -> None:
    """Enter interactive REPL mode."""
    skin = ReplSkin("minierp", version="1.0.0")
    skin.print_banner()

    sess = load_session()
    pt_session = skin.create_prompt_session()

    commands_help = {
        # Authentication
        "auth login": "Log in to Mini ERP",
        "auth logout": "Log out",
        "auth me": "Show current user",
        "auth status": "Show session status",
        "auth change-password": "Change password",
        
        # Inventory
        "inventory items list": "List inventory items",
        "inventory items get": "Get item details",
        "inventory items create": "Create an item",
        "inventory items update": "Update an item",
        "inventory items delete": "Delete an item",
        "inventory items movements": "Get item movement history",
        "inventory items valuation": "Get item valuation",
        "inventory items categories": "List item categories",
        "inventory stock": "Show stock balances",
        "inventory stock-summary": "Show stock summary",
        "inventory low-stock": "Show low-stock items",
        "inventory valuation": "Get total inventory valuation",
        "inventory turnover": "Get inventory turnover analysis",
        "inventory slow-moving": "List slow-moving items",
        "inventory transfer": "Transfer stock between warehouses",
        "inventory adjust": "Adjust stock level",
        "inventory warehouses list": "List warehouses",
        "inventory warehouses create": "Create warehouse",
        "inventory warehouses get": "Get warehouse details",
        "inventory warehouses update": "Update a warehouse",
        "inventory warehouses delete": "Delete a warehouse",
        "inventory warehouses stock": "Get warehouse stock",
        "inventory movements list": "List stock movements",
        "inventory movements create": "Record stock movement",
        
        # Customers
        "customers list": "List customers",
        "customers get": "Get customer details",
        "customers create": "Create a customer",
        "customers update": "Update customer",
        "customers delete": "Delete customer",
        "customers ledger": "Show customer ledger",
        "customers balance": "Show customer balance",
        
        # Suppliers
        "suppliers list": "List suppliers",
        "suppliers get": "Get supplier details",
        "suppliers create": "Create a supplier",
        "suppliers update": "Update a supplier",
        "suppliers delete": "Delete supplier",
        
        # Sales
        "sales summary-by-item": "Sales summary by item",
        "sales summary-by-date": "Sales summary by date",
        "sales top-customers": "Top customers by sales",
        "sales orders list": "List sales orders",
        "sales orders get": "Get sales order",
        "sales orders create": "Create sales order",
        "sales orders delete": "Delete sales order",
        "sales returns": "Get sales returns",
        "sales create-return": "Create sales return",
        "sales commission": "Sales commission report",
        "sales forecast": "Sales forecast",
        
        # Invoices
        "invoices list": "List invoices",
        "invoices get": "Get invoice details",
        "invoices create": "Create an invoice",
        "invoices delete": "Delete invoice",
        "invoices payments": "List invoice payments",
        
        # Purchases
        "purchases list": "List purchases",
        "purchases get": "Get purchase details",
        "purchases create": "Create a purchase",
        "purchases delete": "Delete purchase",
        "purchase-orders list": "List purchase orders",
        "purchase-orders get": "Get purchase order",
        "purchase-orders create": "Create purchase order",
        "purchase-orders pending": "List pending POs",
        "purchase-orders delete": "Delete purchase order",
        
        # Expenses
        "expenses list": "List expenses",
        "expenses create": "Record expense",
        "expenses delete": "Delete expense",
        "expenses summary": "Expense summary",
        "expenses categories": "List expense categories",
        
        # Production
        "production list": "List productions",
        "production get": "Get production details",
        "production create": "Record production",
        "production delete": "Delete production",
        
        # BOM
        "bom list": "List BOMs",
        "bom get": "Get BOM details",
        "bom by-item": "Get BOMs for item",
        "bom create": "Create BOM",
        "bom delete": "Delete BOM",
        
        # Payments
        "payments list": "List payments",
        "payments get": "Get payment details",
        "payments create": "Create payment",
        "payments delete": "Delete payment",
        
        # POS
        "pos sale": "Create POS sale",
        "pos transactions": "List POS transactions",
        
        # Reports
        "reports sales": "Sales summary report",
        "reports profit-loss": "Profit & loss report",
        "reports stock-level": "Stock level report",
        "reports low-stock": "Low stock report",
        "reports ar-aging": "Accounts receivable aging",
        "reports ar-summary": "AR summary",
        "reports expenses": "Expenses report",
        "reports purchase-summary": "Purchase summary",
        "reports gross-profit": "Gross profit analysis",
        "reports daily-sales": "Daily sales report",
        "reports monthly-sales": "Monthly sales summary",
        "reports customer-outstanding": "Customer outstanding",
        "reports supplier-outstanding": "Supplier outstanding",
        "reports trial-balance": "Trial balance",
        "reports general-ledger": "General ledger",
        "reports balance-sheet": "Balance sheet",
        "reports income-statement": "Income statement",
        "reports tax-summary": "Tax summary",
        "reports cash-flow": "Cash flow report",
        "reports stock-valuation": "Stock valuation report",
        "reports inventory-movement": "Inventory movement report",
        "reports production-summary": "Production summary",
        "reports supplier-analysis": "Supplier analysis",
        "reports sales-by-customer": "Sales by customer report",
        "reports sales-by-item": "Sales by item report",
        "reports customer-statements": "Customer statements",
        "reports top-debtors": "Top debtors report",
        "reports dso": "Days sales outstanding metric",
        "reports production-efficiency": "Production efficiency",
        "reports bom-usage": "BOM usage report",
        "reports batch-traceability": "Batch traceability",
        
        # Activity
        "activity list": "List activity logs",
        "activity stats": "Activity statistics",
        "activity recent": "Recent activity",
        
        # Dashboard
        "dashboard summary": "Dashboard summary",
        
        # Settings
        "settings list": "List all settings",
        "settings get": "Get a setting",
        "settings update": "Update a setting",
        
        # Integrations
        "integrations settings": "Get integration settings",
        "integrations update": "Update integration",
        "integrations test-email": "Test email integration",
        "integrations weather": "Get weather data",
        "integrations exchange-rates": "Get exchange rates",
        
        # Utilities
        "utils export": "Export data to file",
        "utils backup": "Create database backup",
        "utils backups": "List available backups",
        "utils restore": "Restore from backup",
        "utils delete-backup": "Delete a backup",
        "utils system-info": "Get system information",
        "utils clear-cache": "Clear application cache",
        "utils optimize-db": "Optimize database",
        "utils db-stats": "Get database statistics",
        "utils import": "Import data from file",
        "utils audit-log": "Get audit log entries",
        "utils data-dictionary": "Get data dictionary",
        "utils health-check": "Run health check",
        
        # General
        "status": "Show session status",
        "help": "Show this help",
        "quit/exit": "Exit REPL",
    }

    while True:
        try:
            username = sess.username or ""
            line = skin.get_input(pt_session, project_name=username)
        except (EOFError, KeyboardInterrupt):
            skin.print_goodbye()
            break

        if not line:
            continue

        cmd = line.strip().lower()
        if cmd in ("quit", "exit", "q"):
            skin.print_goodbye()
            break
        if cmd == "help":
            skin.help(commands_help)
            continue
        if cmd == "status":
            from cli_anything.minierp.core.session import session_status

            info = session_status()
            skin.status_block(
                {k: str(v) for k, v in info.items()}, title="Session Status"
            )
            continue

        # Parse and execute as CLI subcommand
        import shlex

        try:
            args = shlex.split(line)
        except ValueError as e:
            skin.error(f"Parse error: {e}")
            continue

        try:
            standalone_ctx = cli.make_context(
                "cli", args, obj={"json": False}, resilient_parsing=False
            )
            with standalone_ctx:
                cli.invoke(standalone_ctx)
        except SystemExit:
            pass
        except click.UsageError as e:
            skin.error(str(e))
        except ERPError as e:
            skin.error(str(e))
        except Exception as e:
            skin.error(f"Unexpected error: {e}")


# ══════════════════════════════════════════════════════════════════════
# AUTH commands
# ══════════════════════════════════════════════════════════════════════


@cli.group()
def auth() -> None:
    """Authentication — login, logout, user info."""


@auth.command("login")
@click.option("--username", "-u", required=True, help="ERP username.")
@click.option("--password", "-p", required=True, help="ERP password.")
@click.option("--url", default=None, help="Server URL override.")
@click.pass_context
def auth_login(
    ctx: click.Context, username: str, password: str, url: Optional[str]
) -> None:
    """Log in and save session token."""
    from cli_anything.minierp.core.session import login
    from cli_anything.minierp.utils.erp_backend import DEFAULT_BASE_URL

    try:
        result = login(username, password, base_url=url or DEFAULT_BASE_URL)
        _ok(ctx, f"Logged in as {result['username']}", result)
    except ERPError as e:
        _handle_error(e, ctx)


@auth.command("logout")
@click.pass_context
def auth_logout(ctx: click.Context) -> None:
    """Log out and clear saved session."""
    from cli_anything.minierp.core.session import logout

    result = logout()
    _ok(ctx, "Logged out successfully", result)


@auth.command("me")
@click.pass_context
def auth_me(ctx: click.Context) -> None:
    """Show current authenticated user."""
    from cli_anything.minierp.core.session import current_user

    try:
        result = current_user()
        _out(ctx, result)
    except ERPError as e:
        _handle_error(e, ctx)


@auth.command("change-password")
@click.option("--current", required=True, help="Current password.")
@click.option("--new", "new_password", required=True, help="New password.")
@click.pass_context
def auth_change_password(ctx: click.Context, current: str, new_password: str) -> None:
    """Change your password."""
    from cli_anything.minierp.core.session import change_password

    try:
        result = change_password(current, new_password)
        _ok(ctx, "Password changed successfully", result)
    except ERPError as e:
        _handle_error(e, ctx)


@auth.command("status")
@click.pass_context
def auth_status(ctx: click.Context) -> None:
    """Show session status."""
    from cli_anything.minierp.core.session import session_status

    result = session_status()
    _out(ctx, result)


# ══════════════════════════════════════════════════════════════════════
# INVENTORY commands
# ══════════════════════════════════════════════════════════════════════


@cli.group()
def inventory() -> None:
    """Inventory — items, warehouses, stock movements."""


@inventory.group("items")
def inventory_items() -> None:
    """Item master data management."""


@inventory_items.command("list")
@click.option("--search", "-s", default=None)
@click.option("--category", "-c", default=None)
@click.pass_context
def items_list(
    ctx: click.Context, search: Optional[str], category: Optional[str]
) -> None:
    """List inventory items."""
    from cli_anything.minierp.core.inventory import list_items

    try:
        result = list_items(search=search, category=category)
        _out(ctx, result)
    except ERPError as e:
        _handle_error(e, ctx)


@inventory_items.command("get")
@click.argument("item_id", type=int)
@click.pass_context
def items_get(ctx: click.Context, item_id: int) -> None:
    """Get item details by ID."""
    from cli_anything.minierp.core.inventory import get_item

    try:
        _out(ctx, get_item(item_id))
    except ERPError as e:
        _handle_error(e, ctx)


@inventory_items.command("create")
@click.option("--code", required=True, help="Item code (unique).")
@click.option("--name", required=True, help="Item name.")
@click.option("--category", default="", help="Category.")
@click.option("--uom", default="PCS", help="Unit of measure.")
@click.option("--stock", default=0.0, type=float, help="Initial stock.")
@click.option("--reorder", default=0.0, type=float, help="Reorder level.")
@click.option("--buy-price", default=0.0, type=float, help="Purchase price.")
@click.option("--sell-price", default=0.0, type=float, help="Selling price.")
@click.pass_context
def items_create(
    ctx: click.Context,
    code: str,
    name: str,
    category: str,
    uom: str,
    stock: float,
    reorder: float,
    buy_price: float,
    sell_price: float,
) -> None:
    """Create a new inventory item."""
    from cli_anything.minierp.core.inventory import create_item

    try:
        result = create_item(
            code, name, category, uom, stock, reorder, buy_price, sell_price
        )
        _ok(ctx, f"Created item: {name}", result)
    except ERPError as e:
        _handle_error(e, ctx)


@inventory_items.command("update")
@click.argument("item_id", type=int)
@click.option("--name", default=None)
@click.option("--category", default=None)
@click.option("--sell-price", default=None, type=float)
@click.option("--buy-price", default=None, type=float)
@click.option("--reorder", default=None, type=float)
@click.pass_context
def items_update(
    ctx: click.Context,
    item_id: int,
    name: Optional[str],
    category: Optional[str],
    sell_price: Optional[float],
    buy_price: Optional[float],
    reorder: Optional[float],
) -> None:
    """Update an inventory item."""
    from cli_anything.minierp.core.inventory import update_item

    fields = {
        k: v
        for k, v in {
            "item_name": name,
            "category": category,
            "selling_price": sell_price,
            "purchase_price": buy_price,
            "reorder_level": reorder,
        }.items()
        if v is not None
    }
    try:
        result = update_item(item_id, **fields)
        _ok(ctx, f"Updated item {item_id}", result)
    except ERPError as e:
        _handle_error(e, ctx)


@inventory_items.command("delete")
@click.argument("item_id", type=int)
@click.pass_context
def items_delete(ctx: click.Context, item_id: int) -> None:
    """Delete an inventory item."""
    from cli_anything.minierp.core.inventory import delete_item

    try:
        result = delete_item(item_id)
        _ok(ctx, f"Deleted item {item_id}", result)
    except ERPError as e:
        _handle_error(e, ctx)


@inventory.command("stock")
@click.pass_context
def inventory_stock(ctx: click.Context) -> None:
    """Show current stock balances."""
    from cli_anything.minierp.core.inventory import get_stock_balances

    try:
        _out(ctx, get_stock_balances())
    except ERPError as e:
        _handle_error(e, ctx)


@inventory.command("stock-summary")
@click.pass_context
def inventory_stock_summary(ctx: click.Context) -> None:
    """Show stock summary statistics."""
    from cli_anything.minierp.core.inventory import get_stock_summary

    try:
        _out(ctx, get_stock_summary())
    except ERPError as e:
        _handle_error(e, ctx)


@inventory.command("low-stock")
@click.pass_context
def inventory_low_stock(ctx: click.Context) -> None:
    """List items below reorder level."""
    from cli_anything.minierp.core.inventory import get_low_stock

    try:
        _out(ctx, get_low_stock())
    except ERPError as e:
        _handle_error(e, ctx)


@inventory.group("warehouses")
def inventory_warehouses() -> None:
    """Warehouse management."""


@inventory_warehouses.command("list")
@click.pass_context
def warehouses_list(ctx: click.Context) -> None:
    """List all warehouses."""
    from cli_anything.minierp.core.inventory import list_warehouses

    try:
        _out(ctx, list_warehouses())
    except ERPError as e:
        _handle_error(e, ctx)


@inventory_warehouses.command("create")
@click.option("--name", required=True, help="Warehouse name.")
@click.option("--location", default="", help="Physical location.")
@click.pass_context
def warehouses_create(ctx: click.Context, name: str, location: str) -> None:
    """Create a new warehouse."""
    from cli_anything.minierp.core.inventory import create_warehouse

    try:
        result = create_warehouse(name, location)
        _ok(ctx, f"Created warehouse: {name}", result)
    except ERPError as e:
        _handle_error(e, ctx)


@inventory.group("movements")
def inventory_movements() -> None:
    """Stock movement management."""


@inventory_movements.command("list")
@click.option("--item-id", type=int, default=None)
@click.option("--warehouse-id", type=int, default=None)
@click.pass_context
def movements_list(
    ctx: click.Context, item_id: Optional[int], warehouse_id: Optional[int]
) -> None:
    """List stock movements."""
    from cli_anything.minierp.core.inventory import list_stock_movements

    try:
        _out(ctx, list_stock_movements(item_id, warehouse_id))
    except ERPError as e:
        _handle_error(e, ctx)


@inventory_movements.command("create")
@click.option("--item-id", required=True, type=int)
@click.option("--warehouse-id", required=True, type=int)
@click.option(
    "--type",
    "movement_type",
    type=click.Choice(["IN", "OUT", "TRANSFER"]),
    required=True,
)
@click.option("--qty", required=True, type=float)
@click.option("--ref", default="", help="Reference number.")
@click.option("--notes", default="")
@click.pass_context
def movements_create(
    ctx: click.Context,
    item_id: int,
    warehouse_id: int,
    movement_type: str,
    qty: float,
    ref: str,
    notes: str,
) -> None:
    """Record a stock movement."""
    from cli_anything.minierp.core.inventory import create_stock_movement

    try:
        result = create_stock_movement(
            item_id, warehouse_id, movement_type, qty, ref, notes
        )
        _ok(ctx, f"Recorded {movement_type} movement: {qty} units", result)
    except ERPError as e:
        _handle_error(e, ctx)


@inventory.command("valuation")
@click.pass_context
def inventory_valuation(ctx: click.Context) -> None:
    """Get total inventory valuation."""
    from cli_anything.minierp.core.inventory import get_stock_valuation

    try:
        _out(ctx, get_stock_valuation())
    except ERPError as e:
        _handle_error(e, ctx)


@inventory.command("turnover")
@click.pass_context
def inventory_turnover(ctx: click.Context) -> None:
    """Get inventory turnover analysis."""
    from cli_anything.minierp.core.inventory import get_inventory_turnover

    try:
        _out(ctx, get_inventory_turnover())
    except ERPError as e:
        _handle_error(e, ctx)


@inventory.command("slow-moving")
@click.option("--threshold", default=90, type=int, help="Days threshold.")
@click.pass_context
def inventory_slow_moving(ctx: click.Context, threshold: int) -> None:
    """List slow-moving items."""
    from cli_anything.minierp.core.inventory import get_slow_moving_items

    try:
        _out(ctx, get_slow_moving_items(threshold))
    except ERPError as e:
        _handle_error(e, ctx)


@inventory_items.command("movements")
@click.argument("item_id", type=int)
@click.option("--start", default=None, help="Start date YYYY-MM-DD.")
@click.option("--end", default=None, help="End date YYYY-MM-DD.")
@click.pass_context
def items_movements(
    ctx: click.Context, item_id: int, start: Optional[str], end: Optional[str]
) -> None:
    """Get movement history for an item."""
    from cli_anything.minierp.core.inventory import get_item_movements

    try:
        _out(ctx, get_item_movements(item_id, start, end))
    except ERPError as e:
        _handle_error(e, ctx)


@inventory_items.command("valuation")
@click.argument("item_id", type=int)
@click.pass_context
def items_valuation(ctx: click.Context, item_id: int) -> None:
    """Get valuation for a specific item."""
    from cli_anything.minierp.core.inventory import get_item_valuation

    try:
        _out(ctx, get_item_valuation(item_id))
    except ERPError as e:
        _handle_error(e, ctx)


@inventory_items.command("categories")
@click.pass_context
def items_categories(ctx: click.Context) -> None:
    """List item categories."""
    from cli_anything.minierp.core.inventory import list_categories

    try:
        _out(ctx, list_categories())
    except ERPError as e:
        _handle_error(e, ctx)


@inventory_warehouses.command("stock")
@click.argument("warehouse_id", type=int)
@click.pass_context
def warehouses_stock(ctx: click.Context, warehouse_id: int) -> None:
    """Get all stock in a warehouse."""
    from cli_anything.minierp.core.inventory import get_warehouse_stock

    try:
        _out(ctx, get_warehouse_stock(warehouse_id))
    except ERPError as e:
        _handle_error(e, ctx)


@inventory_warehouses.command("get")
@click.argument("warehouse_id", type=int)
@click.pass_context
def warehouses_get(ctx: click.Context, warehouse_id: int) -> None:
    """Get warehouse details by ID."""
    from cli_anything.minierp.core.inventory import get_warehouse

    try:
        _out(ctx, get_warehouse(warehouse_id))
    except ERPError as e:
        _handle_error(e, ctx)


@inventory_warehouses.command("update")
@click.argument("warehouse_id", type=int)
@click.option("--name", default=None, help="Warehouse name.")
@click.option("--location", default=None, help="Physical location.")
@click.pass_context
def warehouses_update(
    ctx: click.Context, warehouse_id: int, name: Optional[str], location: Optional[str]
) -> None:
    """Update a warehouse."""
    from cli_anything.minierp.core.inventory import update_warehouse

    fields = {
        k: v
        for k, v in {
            "warehouse_name": name,
            "location": location,
        }.items()
        if v is not None
    }
    try:
        result = update_warehouse(warehouse_id, **fields)
        _ok(ctx, f"Updated warehouse {warehouse_id}", result)
    except ERPError as e:
        _handle_error(e, ctx)


@inventory_warehouses.command("delete")
@click.argument("warehouse_id", type=int)
@click.pass_context
def warehouses_delete(ctx: click.Context, warehouse_id: int) -> None:
    """Delete a warehouse."""
    from cli_anything.minierp.core.inventory import delete_warehouse

    try:
        result = delete_warehouse(warehouse_id)
        _ok(ctx, f"Deleted warehouse {warehouse_id}", result)
    except ERPError as e:
        _handle_error(e, ctx)


@inventory.command("transfer")
@click.option("--item-id", required=True, type=int)
@click.option("--from-wh", required=True, type=int, help="Source warehouse ID.")
@click.option("--to-wh", required=True, type=int, help="Destination warehouse ID.")
@click.option("--qty", required=True, type=float)
@click.option("--ref", default="", help="Reference number.")
@click.option("--notes", default="")
@click.pass_context
def inventory_transfer(
    ctx: click.Context,
    item_id: int,
    from_wh: int,
    to_wh: int,
    qty: float,
    ref: str,
    notes: str,
) -> None:
    """Transfer stock between warehouses."""
    from cli_anything.minierp.core.inventory import transfer_stock

    try:
        result = transfer_stock(item_id, from_wh, to_wh, qty, ref, notes)
        _ok(ctx, f"Transferred {qty} units from WH {from_wh} to WH {to_wh}", result)
    except ERPError as e:
        _handle_error(e, ctx)


@inventory.command("adjust")
@click.option("--item-id", required=True, type=int)
@click.option("--warehouse-id", required=True, type=int)
@click.option("--qty", required=True, type=float, help="Positive or negative quantity.")
@click.option("--reason", required=True)
@click.option("--ref", default="", help="Reference number.")
@click.pass_context
def inventory_adjust(
    ctx: click.Context,
    item_id: int,
    warehouse_id: int,
    qty: float,
    reason: str,
    ref: str,
) -> None:
    """Adjust stock level."""
    from cli_anything.minierp.core.inventory import adjust_stock

    try:
        result = adjust_stock(item_id, warehouse_id, qty, reason, ref)
        _ok(ctx, f"Adjusted stock: {qty} units", result)
    except ERPError as e:
        _handle_error(e, ctx)


# ══════════════════════════════════════════════════════════════════════
# CUSTOMERS commands
# ══════════════════════════════════════════════════════════════════════


@cli.group()
def customers() -> None:
    """Customer management — CRUD, ledger, balance."""


@customers.command("list")
@click.option("--search", "-s", default=None)
@click.option(
    "--status", default="all", type=click.Choice(["all", "active", "inactive"])
)
@click.option("--page", default=1, type=int)
@click.option("--limit", default=50, type=int)
@click.pass_context
def customers_list(
    ctx: click.Context, search: Optional[str], status: str, page: int, limit: int
) -> None:
    """List customers."""
    from cli_anything.minierp.core.customers import list_customers

    try:
        _out(ctx, list_customers(search, status, page, limit))
    except ERPError as e:
        _handle_error(e, ctx)


@customers.command("get")
@click.argument("customer_id", type=int)
@click.pass_context
def customers_get(ctx: click.Context, customer_id: int) -> None:
    """Get customer details."""
    from cli_anything.minierp.core.customers import get_customer

    try:
        _out(ctx, get_customer(customer_id))
    except ERPError as e:
        _handle_error(e, ctx)


@customers.command("create")
@click.option("--code", required=True, help="Customer code.")
@click.option("--name", required=True, help="Customer name.")
@click.option("--email", default="")
@click.option("--phone", default="")
@click.option("--address", default="")
@click.option("--credit-limit", default=0.0, type=float)
@click.pass_context
def customers_create(
    ctx: click.Context,
    code: str,
    name: str,
    email: str,
    phone: str,
    address: str,
    credit_limit: float,
) -> None:
    """Create a new customer."""
    from cli_anything.minierp.core.customers import create_customer

    try:
        result = create_customer(code, name, email, phone, address, credit_limit)
        _ok(ctx, f"Created customer: {name}", result)
    except ERPError as e:
        _handle_error(e, ctx)


@customers.command("update")
@click.argument("customer_id", type=int)
@click.option("--name", default=None)
@click.option("--email", default=None)
@click.option("--phone", default=None)
@click.option("--address", default=None)
@click.option("--credit-limit", default=None, type=float)
@click.pass_context
def customers_update(
    ctx: click.Context,
    customer_id: int,
    name: Optional[str],
    email: Optional[str],
    phone: Optional[str],
    address: Optional[str],
    credit_limit: Optional[float],
) -> None:
    """Update customer details."""
    from cli_anything.minierp.core.customers import update_customer

    fields = {
        k: v
        for k, v in {
            "customer_name": name,
            "email": email,
            "phone": phone,
            "address": address,
            "credit_limit": credit_limit,
        }.items()
        if v is not None
    }
    try:
        result = update_customer(customer_id, **fields)
        _ok(ctx, f"Updated customer {customer_id}", result)
    except ERPError as e:
        _handle_error(e, ctx)


@customers.command("delete")
@click.argument("customer_id", type=int)
@click.pass_context
def customers_delete(ctx: click.Context, customer_id: int) -> None:
    """Delete a customer."""
    from cli_anything.minierp.core.customers import delete_customer

    try:
        result = delete_customer(customer_id)
        _ok(ctx, f"Deleted customer {customer_id}", result)
    except ERPError as e:
        _handle_error(e, ctx)


@customers.command("ledger")
@click.argument("customer_id", type=int)
@click.pass_context
def customers_ledger(ctx: click.Context, customer_id: int) -> None:
    """Show customer ledger entries."""
    from cli_anything.minierp.core.customers import get_customer_ledger

    try:
        _out(ctx, get_customer_ledger(customer_id))
    except ERPError as e:
        _handle_error(e, ctx)


@customers.command("balance")
@click.argument("customer_id", type=int)
@click.pass_context
def customers_balance(ctx: click.Context, customer_id: int) -> None:
    """Show customer balance."""
    from cli_anything.minierp.core.customers import get_customer_balance

    try:
        _out(ctx, get_customer_balance(customer_id))
    except ERPError as e:
        _handle_error(e, ctx)


# ══════════════════════════════════════════════════════════════════════
# SUPPLIERS commands
# ══════════════════════════════════════════════════════════════════════


@cli.group()
def suppliers() -> None:
    """Supplier management — CRUD."""


@suppliers.command("list")
@click.option("--search", "-s", default=None)
@click.pass_context
def suppliers_list(ctx: click.Context, search: Optional[str]) -> None:
    """List suppliers."""
    from cli_anything.minierp.core.suppliers import list_suppliers

    try:
        _out(ctx, list_suppliers(search))
    except ERPError as e:
        _handle_error(e, ctx)


@suppliers.command("get")
@click.argument("supplier_id", type=int)
@click.pass_context
def suppliers_get(ctx: click.Context, supplier_id: int) -> None:
    """Get supplier details."""
    from cli_anything.minierp.core.suppliers import get_supplier

    try:
        _out(ctx, get_supplier(supplier_id))
    except ERPError as e:
        _handle_error(e, ctx)


@suppliers.command("create")
@click.option("--code", required=True)
@click.option("--name", required=True)
@click.option("--email", default="")
@click.option("--phone", default="")
@click.option("--address", default="")
@click.pass_context
def suppliers_create(
    ctx: click.Context, code: str, name: str, email: str, phone: str, address: str
) -> None:
    """Create a new supplier."""
    from cli_anything.minierp.core.suppliers import create_supplier

    try:
        result = create_supplier(code, name, email, phone, address)
        _ok(ctx, f"Created supplier: {name}", result)
    except ERPError as e:
        _handle_error(e, ctx)


@suppliers.command("delete")
@click.argument("supplier_id", type=int)
@click.pass_context
def suppliers_delete(ctx: click.Context, supplier_id: int) -> None:
    """Delete a supplier."""
    from cli_anything.minierp.core.suppliers import delete_supplier

    try:
        result = delete_supplier(supplier_id)
        _ok(ctx, f"Deleted supplier {supplier_id}", result)
    except ERPError as e:
        _handle_error(e, ctx)


@suppliers.command("update")
@click.argument("supplier_id", type=int)
@click.option("--name", default=None, help="Supplier name.")
@click.option("--email", default=None)
@click.option("--phone", default=None)
@click.option("--address", default=None)
@click.option("--code", default=None, help="Supplier code.")
@click.pass_context
def suppliers_update(
    ctx: click.Context,
    supplier_id: int,
    name: Optional[str],
    email: Optional[str],
    phone: Optional[str],
    address: Optional[str],
    code: Optional[str],
) -> None:
    """Update supplier details."""
    from cli_anything.minierp.core.suppliers import update_supplier

    fields = {
        k: v
        for k, v in {
            "supplier_name": name,
            "email": email,
            "phone": phone,
            "address": address,
            "supplier_code": code,
        }.items()
        if v is not None
    }
    try:
        result = update_supplier(supplier_id, **fields)
        _ok(ctx, f"Updated supplier {supplier_id}", result)
    except ERPError as e:
        _handle_error(e, ctx)


# ══════════════════════════════════════════════════════════════════════
# INVOICES commands
# ══════════════════════════════════════════════════════════════════════


@cli.group()
def invoices() -> None:
    """Invoice management — create, list, view."""


@invoices.command("list")
@click.option("--search", "-s", default=None)
@click.option("--status", default=None)
@click.option("--page", default=1, type=int)
@click.option("--limit", default=50, type=int)
@click.pass_context
def invoices_list(
    ctx: click.Context,
    search: Optional[str],
    status: Optional[str],
    page: int,
    limit: int,
) -> None:
    """List invoices."""
    from cli_anything.minierp.core.invoices import list_invoices

    try:
        _out(ctx, list_invoices(search, status, page, limit))
    except ERPError as e:
        _handle_error(e, ctx)


@invoices.command("get")
@click.argument("invoice_id", type=int)
@click.pass_context
def invoices_get(ctx: click.Context, invoice_id: int) -> None:
    """Get invoice details."""
    from cli_anything.minierp.core.invoices import get_invoice

    try:
        _out(ctx, get_invoice(invoice_id))
    except ERPError as e:
        _handle_error(e, ctx)


@invoices.command("create")
@click.option("--customer-id", required=True, type=int)
@click.option("--date", "invoice_date", required=True, help="Invoice date YYYY-MM-DD.")
@click.option("--due", "due_date", required=True, help="Due date YYYY-MM-DD.")
@click.option(
    "--items",
    "items_json",
    required=True,
    help='JSON array: [{"item_id":1,"quantity":2,"unit_price":10.0}]',
)
@click.option("--notes", default="")
@click.pass_context
def invoices_create(
    ctx: click.Context,
    customer_id: int,
    invoice_date: str,
    due_date: str,
    items_json: str,
    notes: str,
) -> None:
    """Create a new invoice."""
    from cli_anything.minierp.core.invoices import create_invoice

    try:
        items = json.loads(items_json)
        result = create_invoice(customer_id, invoice_date, due_date, items, notes)
        _ok(ctx, "Created invoice", result)
    except json.JSONDecodeError as e:
        _err(f"Invalid JSON for --items: {e}", ctx)
        sys.exit(1)
    except ERPError as e:
        _handle_error(e, ctx)


@invoices.command("delete")
@click.argument("invoice_id", type=int)
@click.pass_context
def invoices_delete(ctx: click.Context, invoice_id: int) -> None:
    """Delete an invoice."""
    from cli_anything.minierp.core.invoices import delete_invoice

    try:
        result = delete_invoice(invoice_id)
        _ok(ctx, f"Deleted invoice {invoice_id}", result)
    except ERPError as e:
        _handle_error(e, ctx)


@invoices.command("payments")
@click.argument("invoice_id", type=int)
@click.pass_context
def invoices_payments(ctx: click.Context, invoice_id: int) -> None:
    """List payments for an invoice."""
    from cli_anything.minierp.core.invoices import get_invoice_payments

    try:
        _out(ctx, get_invoice_payments(invoice_id))
    except ERPError as e:
        _handle_error(e, ctx)


# ══════════════════════════════════════════════════════════════════════
# PURCHASES commands
# ══════════════════════════════════════════════════════════════════════


@cli.group()
def purchases() -> None:
    """Purchase management — record and query purchases."""


@purchases.command("list")
@click.option("--page", default=1, type=int)
@click.option("--limit", default=50, type=int)
@click.pass_context
def purchases_list(ctx: click.Context, page: int, limit: int) -> None:
    """List purchases."""
    from cli_anything.minierp.core.purchases import list_purchases

    try:
        _out(ctx, list_purchases(page=page, limit=limit))
    except ERPError as e:
        _handle_error(e, ctx)


@purchases.command("get")
@click.argument("purchase_id", type=int)
@click.pass_context
def purchases_get(ctx: click.Context, purchase_id: int) -> None:
    """Get purchase details."""
    from cli_anything.minierp.core.purchases import get_purchase

    try:
        _out(ctx, get_purchase(purchase_id))
    except ERPError as e:
        _handle_error(e, ctx)


@purchases.command("create")
@click.option("--item-id", required=True, type=int)
@click.option("--warehouse-id", required=True, type=int)
@click.option("--qty", required=True, type=float)
@click.option("--cost", required=True, type=float)
@click.option("--date", "purchase_date", required=True)
@click.option("--supplier", default="")
@click.option("--invoice", default="")
@click.option("--notes", default="")
@click.pass_context
def purchases_create(
    ctx: click.Context,
    item_id: int,
    warehouse_id: int,
    qty: float,
    cost: float,
    purchase_date: str,
    supplier: str,
    invoice: str,
    notes: str,
) -> None:
    """Record a new purchase."""
    from cli_anything.minierp.core.purchases import create_purchase

    try:
        result = create_purchase(item_id, warehouse_id, qty, cost, purchase_date, supplier, invoice, notes)
        _ok(ctx, "Recorded purchase", result)
    except ERPError as e:
        _handle_error(e, ctx)


@purchases.command("delete")
@click.argument("purchase_id", type=int)
@click.pass_context
def purchases_delete(ctx: click.Context, purchase_id: int) -> None:
    """Delete a purchase record."""
    from cli_anything.minierp.core.purchases import delete_purchase

    try:
        result = delete_purchase(purchase_id)
        _ok(ctx, f"Deleted purchase {purchase_id}", result)
    except ERPError as e:
        _handle_error(e, ctx)


# ══════════════════════════════════════════════════════════════════════
# EXPENSES commands
# ══════════════════════════════════════════════════════════════════════


@cli.group()
def expenses() -> None:
    """Expense tracking — categories and expense records."""


@expenses.command("list")
@click.option("--page", default=1, type=int)
@click.option("--limit", default=50, type=int)
@click.option("--category", default=None)
@click.pass_context
def expenses_list(
    ctx: click.Context, page: int, limit: int, category: Optional[str]
) -> None:
    """List expenses."""
    from cli_anything.minierp.core.expenses import list_expenses

    try:
        _out(ctx, list_expenses(page, limit, category))
    except ERPError as e:
        _handle_error(e, ctx)


@expenses.command("create")
@click.option("--date", "expense_date", required=True, help="Expense date YYYY-MM-DD.")
@click.option("--category", required=True)
@click.option("--amount", required=True, type=float)
@click.option("--description", default="")
@click.option(
    "--method",
    "payment_method",
    default="cash",
    type=click.Choice(["cash", "bank", "card", "other"]),
)
@click.pass_context
def expenses_create(
    ctx: click.Context,
    expense_date: str,
    category: str,
    amount: float,
    description: str,
    payment_method: str,
) -> None:
    """Record an expense."""
    from cli_anything.minierp.core.expenses import create_expense

    try:
        result = create_expense(
            expense_date, category, amount, description, payment_method
        )
        _ok(ctx, f"Recorded expense: {category} {amount}", result)
    except ERPError as e:
        _handle_error(e, ctx)


@expenses.command("delete")
@click.argument("expense_id", type=int)
@click.pass_context
def expenses_delete(ctx: click.Context, expense_id: int) -> None:
    """Delete an expense."""
    from cli_anything.minierp.core.expenses import delete_expense

    try:
        result = delete_expense(expense_id)
        _ok(ctx, f"Deleted expense {expense_id}", result)
    except ERPError as e:
        _handle_error(e, ctx)


@expenses.command("summary")
@click.option("--start", default=None, help="Start date YYYY-MM-DD.")
@click.option("--end", default=None, help="End date YYYY-MM-DD.")
@click.pass_context
def expenses_summary(
    ctx: click.Context, start: Optional[str], end: Optional[str]
) -> None:
    """Show expense summary."""
    from cli_anything.minierp.core.expenses import get_expense_summary

    try:
        _out(ctx, get_expense_summary(start, end))
    except ERPError as e:
        _handle_error(e, ctx)


@expenses.command("categories")
@click.pass_context
def expenses_categories(ctx: click.Context) -> None:
    """List expense categories."""
    from cli_anything.minierp.core.expenses import list_categories

    try:
        _out(ctx, list_categories())
    except ERPError as e:
        _handle_error(e, ctx)


# ══════════════════════════════════════════════════════════════════════
# REPORTS commands
# ══════════════════════════════════════════════════════════════════════


@cli.group()
def reports() -> None:
    """Business reports — sales, inventory, financial."""


@reports.command("sales")
@click.option("--start", default=None)
@click.option("--end", default=None)
@click.pass_context
def reports_sales(ctx: click.Context, start: Optional[str], end: Optional[str]) -> None:
    """Sales summary report."""
    from cli_anything.minierp.core.reports import sales_summary

    try:
        _out(ctx, sales_summary(start, end))
    except ERPError as e:
        _handle_error(e, ctx)


@reports.command("profit-loss")
@click.option("--start", default=None)
@click.option("--end", default=None)
@click.pass_context
def reports_pl(ctx: click.Context, start: Optional[str], end: Optional[str]) -> None:
    """Profit & loss report."""
    from cli_anything.minierp.core.reports import profit_loss

    try:
        _out(ctx, profit_loss(start, end))
    except ERPError as e:
        _handle_error(e, ctx)


@reports.command("stock-level")
@click.pass_context
def reports_stock(ctx: click.Context) -> None:
    """Stock level report."""
    from cli_anything.minierp.core.reports import stock_level

    try:
        _out(ctx, stock_level())
    except ERPError as e:
        _handle_error(e, ctx)


@reports.command("low-stock")
@click.pass_context
def reports_low_stock(ctx: click.Context) -> None:
    """Low stock alert report."""
    from cli_anything.minierp.core.reports import low_stock

    try:
        _out(ctx, low_stock())
    except ERPError as e:
        _handle_error(e, ctx)


@reports.command("ar-aging")
@click.pass_context
def reports_ar(ctx: click.Context) -> None:
    """Accounts receivable aging report."""
    from cli_anything.minierp.core.reports import ar_aging

    try:
        _out(ctx, ar_aging())
    except ERPError as e:
        _handle_error(e, ctx)


@reports.command("ar-summary")
@click.pass_context
def reports_ar_summary(ctx: click.Context) -> None:
    """Accounts receivable summary."""
    from cli_anything.minierp.core.reports import ar_summary

    try:
        _out(ctx, ar_summary())
    except ERPError as e:
        _handle_error(e, ctx)


@reports.command("expenses")
@click.option("--start", default=None)
@click.option("--end", default=None)
@click.pass_context
def reports_expenses(
    ctx: click.Context, start: Optional[str], end: Optional[str]
) -> None:
    """Expenses report."""
    from cli_anything.minierp.core.reports import expenses_report

    try:
        _out(ctx, expenses_report(start, end))
    except ERPError as e:
        _handle_error(e, ctx)


@reports.command("purchase-summary")
@click.option("--start", default=None)
@click.option("--end", default=None)
@click.pass_context
def reports_purchase(
    ctx: click.Context, start: Optional[str], end: Optional[str]
) -> None:
    """Purchase summary report."""
    from cli_anything.minierp.core.purchases import get_purchase_summary

    try:
        _out(ctx, get_purchase_summary(start, end))
    except ERPError as e:
        _handle_error(e, ctx)


@reports.command("gross-profit")
@click.option("--start", default=None)
@click.option("--end", default=None)
@click.pass_context
def reports_gross_profit(
    ctx: click.Context, start: Optional[str], end: Optional[str]
) -> None:
    """Get gross profit analysis."""
    from cli_anything.minierp.core.reports import gross_profit_analysis

    try:
        _out(ctx, gross_profit_analysis(start, end))
    except ERPError as e:
        _handle_error(e, ctx)


@reports.command("daily-sales")
@click.option("--start", default=None)
@click.option("--end", default=None)
@click.pass_context
def reports_daily_sales(
    ctx: click.Context, start: Optional[str], end: Optional[str]
) -> None:
    """Get daily sales report."""
    from cli_anything.minierp.core.reports import daily_sales

    try:
        _out(ctx, daily_sales(start, end))
    except ERPError as e:
        _handle_error(e, ctx)


@reports.command("monthly-sales")
@click.argument("year", type=int)
@click.pass_context
def reports_monthly_sales(ctx: click.Context, year: int) -> None:
    """Get monthly sales summary for a year."""
    from cli_anything.minierp.core.reports import monthly_sales

    try:
        _out(ctx, monthly_sales(year))
    except ERPError as e:
        _handle_error(e, ctx)


@reports.command("customer-outstanding")
@click.pass_context
def reports_customer_outstanding(ctx: click.Context) -> None:
    """Get customer outstanding balances."""
    from cli_anything.minierp.core.reports import customer_outstanding

    try:
        _out(ctx, customer_outstanding())
    except ERPError as e:
        _handle_error(e, ctx)


@reports.command("supplier-outstanding")
@click.pass_context
def reports_supplier_outstanding(ctx: click.Context) -> None:
    """Get supplier outstanding balances."""
    from cli_anything.minierp.core.reports import supplier_outstanding

    try:
        _out(ctx, supplier_outstanding())
    except ERPError as e:
        _handle_error(e, ctx)


@reports.command("trial-balance")
@click.option("--as-of", default=None, help="As of date YYYY-MM-DD.")
@click.pass_context
def reports_trial_balance(ctx: click.Context, as_of: Optional[str]) -> None:
    """Get trial balance report."""
    from cli_anything.minierp.core.reports import trial_balance

    try:
        _out(ctx, trial_balance(as_of))
    except ERPError as e:
        _handle_error(e, ctx)


@reports.command("general-ledger")
@click.option("--account-id", type=int, default=None)
@click.option("--start", default=None)
@click.option("--end", default=None)
@click.pass_context
def reports_general_ledger(
    ctx: click.Context,
    account_id: Optional[int],
    start: Optional[str],
    end: Optional[str],
) -> None:
    """Get general ledger entries."""
    from cli_anything.minierp.core.reports import general_ledger

    try:
        _out(ctx, general_ledger(account_id, start, end))
    except ERPError as e:
        _handle_error(e, ctx)


@reports.command("balance-sheet")
@click.option("--as-of", default=None, help="As of date YYYY-MM-DD.")
@click.pass_context
def reports_balance_sheet(ctx: click.Context, as_of: Optional[str]) -> None:
    """Get balance sheet report."""
    from cli_anything.minierp.core.reports import balance_sheet

    try:
        _out(ctx, balance_sheet(as_of))
    except ERPError as e:
        _handle_error(e, ctx)


@reports.command("income-statement")
@click.option("--start", default=None)
@click.option("--end", default=None)
@click.pass_context
def reports_income_statement(
    ctx: click.Context, start: Optional[str], end: Optional[str]
) -> None:
    """Get income statement report."""
    from cli_anything.minierp.core.reports import income_statement

    try:
        _out(ctx, income_statement(start, end))
    except ERPError as e:
        _handle_error(e, ctx)


@reports.command("tax-summary")
@click.option("--start", default=None)
@click.option("--end", default=None)
@click.pass_context
def reports_tax_summary(
    ctx: click.Context, start: Optional[str], end: Optional[str]
) -> None:
    """Get tax summary report."""
    from cli_anything.minierp.core.reports import tax_summary

    try:
        _out(ctx, tax_summary(start, end))
    except ERPError as e:
        _handle_error(e, ctx)


@reports.command("production-efficiency")
@click.option("--start", default=None)
@click.option("--end", default=None)
@click.pass_context
def reports_production_efficiency(
    ctx: click.Context, start: Optional[str], end: Optional[str]
) -> None:
    """Get production efficiency report."""
    from cli_anything.minierp.core.reports import production_efficiency

    try:
        _out(ctx, production_efficiency(start, end))
    except ERPError as e:
        _handle_error(e, ctx)


@reports.command("bom-usage")
@click.argument("bom_id", type=int)
@click.pass_context
def reports_bom_usage(ctx: click.Context, bom_id: int) -> None:
    """Get BOM usage report."""
    from cli_anything.minierp.core.reports import bom_usage

    try:
        _out(ctx, bom_usage(bom_id))
    except ERPError as e:
        _handle_error(e, ctx)


@reports.command("batch-traceability")
@click.argument("item_id", type=int)
@click.pass_context
def reports_batch_traceability(ctx: click.Context, item_id: int) -> None:
    """Get batch traceability for an item."""
    from cli_anything.minierp.core.reports import batch_traceability

    try:
        _out(ctx, batch_traceability(item_id))
    except ERPError as e:
        _handle_error(e, ctx)


@reports.command("cash-flow")
@click.option("--start", default=None)
@click.option("--end", default=None)
@click.pass_context
def reports_cash_flow(
    ctx: click.Context, start: Optional[str], end: Optional[str]
) -> None:
    """Get cash flow report."""
    from cli_anything.minierp.core.reports import cash_flow

    try:
        _out(ctx, cash_flow(start, end))
    except ERPError as e:
        _handle_error(e, ctx)


@reports.command("stock-valuation")
@click.pass_context
def reports_stock_valuation(ctx: click.Context) -> None:
    """Get stock valuation report."""
    from cli_anything.minierp.core.reports import stock_valuation

    try:
        _out(ctx, stock_valuation())
    except ERPError as e:
        _handle_error(e, ctx)


@reports.command("inventory-movement")
@click.option("--start", default=None)
@click.option("--end", default=None)
@click.pass_context
def reports_inventory_movement(
    ctx: click.Context, start: Optional[str], end: Optional[str]
) -> None:
    """Get inventory movement report."""
    from cli_anything.minierp.core.reports import inventory_movement

    try:
        _out(ctx, inventory_movement(start, end))
    except ERPError as e:
        _handle_error(e, ctx)


@reports.command("production-summary")
@click.option("--start", default=None)
@click.option("--end", default=None)
@click.pass_context
def reports_production_summary(
    ctx: click.Context, start: Optional[str], end: Optional[str]
) -> None:
    """Get production summary report."""
    from cli_anything.minierp.core.reports import production_summary

    try:
        _out(ctx, production_summary(start, end))
    except ERPError as e:
        _handle_error(e, ctx)


@reports.command("supplier-analysis")
@click.pass_context
def reports_supplier_analysis(ctx: click.Context) -> None:
    """Get supplier analysis report."""
    from cli_anything.minierp.core.reports import supplier_analysis

    try:
        _out(ctx, supplier_analysis())
    except ERPError as e:
        _handle_error(e, ctx)


@reports.command("sales-by-customer")
@click.option("--start", default=None)
@click.option("--end", default=None)
@click.pass_context
def reports_sales_by_customer(
    ctx: click.Context, start: Optional[str], end: Optional[str]
) -> None:
    """Get sales by customer report."""
    from cli_anything.minierp.core.reports import sales_by_customer

    try:
        _out(ctx, sales_by_customer(start, end))
    except ERPError as e:
        _handle_error(e, ctx)


@reports.command("sales-by-item")
@click.option("--start", default=None)
@click.option("--end", default=None)
@click.pass_context
def reports_sales_by_item(
    ctx: click.Context, start: Optional[str], end: Optional[str]
) -> None:
    """Get sales by item report."""
    from cli_anything.minierp.core.reports import sales_by_item

    try:
        _out(ctx, sales_by_item(start, end))
    except ERPError as e:
        _handle_error(e, ctx)


@reports.command("customer-statements")
@click.option("--customer-id", required=True, type=int, help="Customer ID.")
@click.pass_context
def reports_customer_statements(ctx: click.Context, customer_id: int) -> None:
    """Get customer statements."""
    from cli_anything.minierp.core.reports import customer_statements

    try:
        _out(ctx, customer_statements(customer_id))
    except ERPError as e:
        _handle_error(e, ctx)


@reports.command("top-debtors")
@click.option("--limit", default=10, type=int, help="Number of debtors.")
@click.pass_context
def reports_top_debtors(ctx: click.Context, limit: int) -> None:
    """Get top debtors report."""
    from cli_anything.minierp.core.reports import top_debtors

    try:
        _out(ctx, top_debtors(limit))
    except ERPError as e:
        _handle_error(e, ctx)


@reports.command("dso")
@click.option("--period", default=30, type=int, help="Days period for DSO calculation.")
@click.pass_context
def reports_dso(ctx: click.Context, period: int) -> None:
    """Get Days Sales Outstanding metric."""
    from cli_anything.minierp.core.reports import dso

    try:
        _out(ctx, dso(period))
    except ERPError as e:
        _handle_error(e, ctx)


# ══════════════════════════════════════════════════════════════════════
# SALES commands
# ══════════════════════════════════════════════════════════════════════


@cli.group()
def sales() -> None:
    """Sales analytics and reports."""


@sales.command("summary-by-item")
@click.argument("item_id", type=int)
@click.pass_context
def sales_summary_by_item(ctx: click.Context, item_id: int) -> None:
    """Get sales summary for a specific item."""
    from cli_anything.minierp.core.sales import get_sales_summary_by_item

    try:
        _out(ctx, get_sales_summary_by_item(item_id))
    except ERPError as e:
        _handle_error(e, ctx)


@sales.command("summary-by-date")
@click.option("--start", default=None)
@click.option("--end", default=None)
@click.pass_context
def sales_summary_by_date(
    ctx: click.Context, start: Optional[str], end: Optional[str]
) -> None:
    """Get sales summary for a date range."""
    from cli_anything.minierp.core.sales import get_sales_summary_by_date_range

    try:
        _out(ctx, get_sales_summary_by_date_range(start, end))
    except ERPError as e:
        _handle_error(e, ctx)


@sales.command("top-customers")
@click.option("--limit", default=10, type=int)
@click.pass_context
def sales_top_customers(ctx: click.Context, limit: int) -> None:
    """Get top customers by sales."""
    from cli_anything.minierp.core.sales import get_top_customers

    try:
        _out(ctx, get_top_customers(limit))
    except ERPError as e:
        _handle_error(e, ctx)


@sales.group("orders")
def sales_orders() -> None:
    """Sales order management."""


@sales_orders.command("list")
@click.option("--page", default=1, type=int)
@click.option("--limit", default=50, type=int)
@click.option("--status", default=None)
@click.pass_context
def sales_orders_list(
    ctx: click.Context, page: int, limit: int, status: Optional[str]
) -> None:
    """List sales orders."""
    from cli_anything.minierp.core.sales import list_sales_orders

    try:
        _out(ctx, list_sales_orders(page, limit, status))
    except ERPError as e:
        _handle_error(e, ctx)


@sales_orders.command("get")
@click.argument("order_id", type=int)
@click.pass_context
def sales_orders_get(ctx: click.Context, order_id: int) -> None:
    """Get sales order details."""
    from cli_anything.minierp.core.sales import get_sales_order

    try:
        _out(ctx, get_sales_order(order_id))
    except ERPError as e:
        _handle_error(e, ctx)


@sales_orders.command("create")
@click.option("--customer-id", required=True, type=int)
@click.option("--date", "order_date", required=True)
@click.option("--items", "items_json", required=True, help="JSON array")
@click.option("--notes", default="")
@click.option("--delivery", "expected_delivery", default=None)
@click.pass_context
def sales_orders_create(
    ctx: click.Context,
    customer_id: int,
    order_date: str,
    items_json: str,
    notes: str,
    expected_delivery: Optional[str],
) -> None:
    """Create a sales order."""
    from cli_anything.minierp.core.sales import create_sales_order

    try:
        items = json.loads(items_json)
        result = create_sales_order(
            customer_id, order_date, items, notes, expected_delivery
        )
        _ok(ctx, "Created sales order", result)
    except json.JSONDecodeError as e:
        _err(f"Invalid JSON for --items: {e}", ctx)
        sys.exit(1)
    except ERPError as e:
        _handle_error(e, ctx)


@sales_orders.command("delete")
@click.argument("order_id", type=int)
@click.pass_context
def sales_orders_delete(ctx: click.Context, order_id: int) -> None:
    """Delete sales order."""
    from cli_anything.minierp.core.sales import delete_sales_order

    try:
        result = delete_sales_order(order_id)
        _ok(ctx, f"Deleted sales order {order_id}", result)
    except ERPError as e:
        _handle_error(e, ctx)


@sales.command("returns")
@click.option("--start", default=None)
@click.option("--end", default=None)
@click.pass_context
def sales_returns(
    ctx: click.Context, start: Optional[str], end: Optional[str]
) -> None:
    """Get sales returns."""
    from cli_anything.minierp.core.sales import get_sales_returns

    try:
        _out(ctx, get_sales_returns(start, end))
    except ERPError as e:
        _handle_error(e, ctx)


@sales.command("create-return")
@click.option("--sale-id", required=True, type=int)
@click.option("--items", "items_json", required=True, help="JSON array")
@click.option("--reason", required=True)
@click.option("--notes", default="")
@click.pass_context
def sales_create_return(
    ctx: click.Context,
    sale_id: int,
    items_json: str,
    reason: str,
    notes: str,
) -> None:
    """Create a sales return."""
    from cli_anything.minierp.core.sales import create_sales_return

    try:
        items = json.loads(items_json)
        result = create_sales_return(sale_id, items, reason, notes)
        _ok(ctx, "Created sales return", result)
    except json.JSONDecodeError as e:
        _err(f"Invalid JSON for --items: {e}", ctx)
        sys.exit(1)
    except ERPError as e:
        _handle_error(e, ctx)


@sales.command("commission")
@click.option("--salesperson-id", type=int, default=None)
@click.option("--start", default=None)
@click.option("--end", default=None)
@click.pass_context
def sales_commission(
    ctx: click.Context,
    salesperson_id: Optional[int],
    start: Optional[str],
    end: Optional[str],
) -> None:
    """Get sales commission report."""
    from cli_anything.minierp.core.sales import get_sales_commission

    try:
        _out(ctx, get_sales_commission(salesperson_id, start, end))
    except ERPError as e:
        _handle_error(e, ctx)


@sales.command("forecast")
@click.option("--months", default=3, type=int)
@click.pass_context
def sales_forecast(ctx: click.Context, months: int) -> None:
    """Get sales forecast."""
    from cli_anything.minierp.core.sales import get_sales_forecast

    try:
        _out(ctx, get_sales_forecast(months))
    except ERPError as e:
        _handle_error(e, ctx)


# ══════════════════════════════════════════════════════════════════════
# PAYMENTS commands
# ══════════════════════════════════════════════════════════════════════


@cli.group()
def payments() -> None:
    """Payment management — CRUD, allocations."""


@payments.command("list")
@click.option("--page", default=1, type=int)
@click.option("--limit", default=50, type=int)
@click.option("--search", default=None)
@click.option("--customer-id", type=int, default=None)
@click.pass_context
def payments_list(
    ctx: click.Context,
    page: int,
    limit: int,
    search: Optional[str],
    customer_id: Optional[int],
) -> None:
    """List payments."""
    from cli_anything.minierp.core.payments import list_payments

    try:
        _out(ctx, list_payments(page, limit, search, customer_id))
    except ERPError as e:
        _handle_error(e, ctx)


@payments.command("get")
@click.argument("payment_id", type=int)
@click.pass_context
def payments_get(ctx: click.Context, payment_id: int) -> None:
    """Get payment details."""
    from cli_anything.minierp.core.payments import get_payment

    try:
        _out(ctx, get_payment(payment_id))
    except ERPError as e:
        _handle_error(e, ctx)


@payments.command("create")
@click.option("--customer-id", required=True, type=int)
@click.option("--amount", required=True, type=float)
@click.option("--date", "payment_date", required=True)
@click.option("--method", default="cash")
@click.option("--reference", default="")
@click.option("--notes", default="")
@click.pass_context
def payments_create(
    ctx: click.Context,
    customer_id: int,
    amount: float,
    payment_date: str,
    method: str,
    reference: str,
    notes: str,
) -> None:
    """Create a new payment."""
    from cli_anything.minierp.core.payments import create_payment

    try:
        result = create_payment(
            customer_id, amount, payment_date, method, reference, notes
        )
        _ok(ctx, f"Created payment: {amount}", result)
    except ERPError as e:
        _handle_error(e, ctx)


@payments.command("delete")
@click.argument("payment_id", type=int)
@click.pass_context
def payments_delete(ctx: click.Context, payment_id: int) -> None:
    """Delete a payment."""
    from cli_anything.minierp.core.payments import delete_payment

    try:
        result = delete_payment(payment_id)
        _ok(ctx, f"Deleted payment {payment_id}", result)
    except ERPError as e:
        _handle_error(e, ctx)


# ══════════════════════════════════════════════════════════════════════
# PRODUCTION commands
# ══════════════════════════════════════════════════════════════════════


@cli.group()
def production() -> None:
    """Production management — record manufacturing."""


@production.command("list")
@click.option("--page", default=1, type=int)
@click.option("--limit", default=50, type=int)
@click.pass_context
def production_list(ctx: click.Context, page: int, limit: int) -> None:
    """List productions."""
    from cli_anything.minierp.core.production import list_productions

    try:
        _out(ctx, list_productions(page, limit))
    except ERPError as e:
        _handle_error(e, ctx)


@production.command("get")
@click.argument("production_id", type=int)
@click.pass_context
def production_get(ctx: click.Context, production_id: int) -> None:
    """Get production details."""
    from cli_anything.minierp.core.production import get_production

    try:
        _out(ctx, get_production(production_id))
    except ERPError as e:
        _handle_error(e, ctx)


@production.command("create")
@click.option("--item-id", required=True, type=int)
@click.option("--quantity", required=True, type=float)
@click.option("--date", "production_date", required=True)
@click.option("--notes", default="")
@click.pass_context
def production_create(
    ctx: click.Context,
    item_id: int,
    quantity: float,
    production_date: str,
    notes: str,
) -> None:
    """Record a new production."""
    from cli_anything.minierp.core.production import create_production

    try:
        result = create_production(item_id, quantity, production_date, notes)
        _ok(ctx, f"Recorded production: {quantity} units", result)
    except ERPError as e:
        _handle_error(e, ctx)


@production.command("delete")
@click.argument("production_id", type=int)
@click.pass_context
def production_delete(ctx: click.Context, production_id: int) -> None:
    """Delete a production record."""
    from cli_anything.minierp.core.production import delete_production

    try:
        result = delete_production(production_id)
        _ok(ctx, f"Deleted production {production_id}", result)
    except ERPError as e:
        _handle_error(e, ctx)


# ══════════════════════════════════════════════════════════════════════
# BOM commands
# ══════════════════════════════════════════════════════════════════════


@cli.group()
def bom() -> None:
    """Bill of Materials management."""


@bom.command("list")
@click.option("--page", default=1, type=int)
@click.option("--limit", default=50, type=int)
@click.pass_context
def bom_list(ctx: click.Context, page: int, limit: int) -> None:
    """List BOMs."""
    from cli_anything.minierp.core.bom import list_boms

    try:
        _out(ctx, list_boms(page, limit))
    except ERPError as e:
        _handle_error(e, ctx)


@bom.command("get")
@click.argument("bom_id", type=int)
@click.pass_context
def bom_get(ctx: click.Context, bom_id: int) -> None:
    """Get BOM details."""
    from cli_anything.minierp.core.bom import get_bom

    try:
        _out(ctx, get_bom(bom_id))
    except ERPError as e:
        _handle_error(e, ctx)


@bom.command("by-item")
@click.argument("item_id", type=int)
@click.pass_context
def bom_by_item(ctx: click.Context, item_id: int) -> None:
    """Get BOMs for a finished item."""
    from cli_anything.minierp.core.bom import get_boms_by_item

    try:
        _out(ctx, get_boms_by_item(item_id))
    except ERPError as e:
        _handle_error(e, ctx)


@bom.command("create")
@click.option("--finished-item-id", required=True, type=int)
@click.option("--quantity", required=True, type=float)
@click.option("--items", "items_json", required=True, help="JSON array of components")
@click.option("--notes", default="")
@click.pass_context
def bom_create(
    ctx: click.Context,
    finished_item_id: int,
    quantity: float,
    items_json: str,
    notes: str,
) -> None:
    """Create a new BOM."""
    from cli_anything.minierp.core.bom import create_bom

    try:
        items = json.loads(items_json)
        result = create_bom(finished_item_id, quantity, items, notes)
        _ok(ctx, f"Created BOM for item {finished_item_id}", result)
    except json.JSONDecodeError as e:
        _err(f"Invalid JSON for --items: {e}", ctx)
        sys.exit(1)
    except ERPError as e:
        _handle_error(e, ctx)


@bom.command("delete")
@click.argument("bom_id", type=int)
@click.pass_context
def bom_delete(ctx: click.Context, bom_id: int) -> None:
    """Delete a BOM."""
    from cli_anything.minierp.core.bom import delete_bom

    try:
        result = delete_bom(bom_id)
        _ok(ctx, f"Deleted BOM {bom_id}", result)
    except ERPError as e:
        _handle_error(e, ctx)


# ══════════════════════════════════════════════════════════════════════
# PURCHASE ORDERS commands
# ══════════════════════════════════════════════════════════════════════


@cli.group()
def purchase_orders() -> None:
    """Purchase order management."""


@purchase_orders.command("list")
@click.option("--page", default=1, type=int)
@click.option("--limit", default=50, type=int)
@click.pass_context
def po_list(ctx: click.Context, page: int, limit: int) -> None:
    """List purchase orders."""
    from cli_anything.minierp.core.purchaseOrders import list_purchase_orders

    try:
        _out(ctx, list_purchase_orders(page, limit))
    except ERPError as e:
        _handle_error(e, ctx)


@purchase_orders.command("get")
@click.argument("po_id", type=int)
@click.pass_context
def po_get(ctx: click.Context, po_id: int) -> None:
    """Get purchase order details."""
    from cli_anything.minierp.core.purchaseOrders import get_purchase_order

    try:
        _out(ctx, get_purchase_order(po_id))
    except ERPError as e:
        _handle_error(e, ctx)


@purchase_orders.command("create")
@click.option("--supplier-id", required=True, type=int)
@click.option("--order-date", required=True)
@click.option("--expected-delivery", required=True)
@click.option("--items", "items_json", required=True, help="JSON array")
@click.option("--notes", default="")
@click.pass_context
def po_create(
    ctx: click.Context,
    supplier_id: int,
    order_date: str,
    expected_delivery: str,
    items_json: str,
    notes: str,
) -> None:
    """Create a new purchase order."""
    from cli_anything.minierp.core.purchaseOrders import create_purchase_order

    try:
        items = json.loads(items_json)
        result = create_purchase_order(
            supplier_id, order_date, expected_delivery, items, notes
        )
        _ok(ctx, f"Created purchase order", result)
    except json.JSONDecodeError as e:
        _err(f"Invalid JSON for --items: {e}", ctx)
        sys.exit(1)
    except ERPError as e:
        _handle_error(e, ctx)


@purchase_orders.command("pending")
@click.pass_context
def po_pending(ctx: click.Context) -> None:
    """Get pending purchase orders."""
    from cli_anything.minierp.core.purchaseOrders import get_pending_orders

    try:
        _out(ctx, get_pending_orders())
    except ERPError as e:
        _handle_error(e, ctx)


@purchase_orders.command("delete")
@click.argument("po_id", type=int)
@click.pass_context
def po_delete(ctx: click.Context, po_id: int) -> None:
    """Delete a purchase order."""
    from cli_anything.minierp.core.purchaseOrders import delete_purchase_order

    try:
        result = delete_purchase_order(po_id)
        _ok(ctx, f"Deleted purchase order {po_id}", result)
    except ERPError as e:
        _handle_error(e, ctx)


# ══════════════════════════════════════════════════════════════════════
# ACTIVITY LOG commands
# ══════════════════════════════════════════════════════════════════════


@cli.group()
def activity() -> None:
    """Activity log and audit trail."""


@activity.command("list")
@click.option("--page", default=1, type=int)
@click.option("--limit", default=50, type=int)
@click.option("--entity-type", default=None)
@click.option("--action", default=None)
@click.pass_context
def activity_list(
    ctx: click.Context,
    page: int,
    limit: int,
    entity_type: Optional[str],
    action: Optional[str],
) -> None:
    """List activity logs."""
    from cli_anything.minierp.core.activityLog import list_activity_logs

    try:
        _out(ctx, list_activity_logs(page, limit, entity_type, action))
    except ERPError as e:
        _handle_error(e, ctx)


@activity.command("stats")
@click.option("--start", default=None)
@click.option("--end", default=None)
@click.pass_context
def activity_stats(
    ctx: click.Context, start: Optional[str], end: Optional[str]
) -> None:
    """Get activity statistics."""
    from cli_anything.minierp.core.activityLog import get_activity_stats

    try:
        _out(ctx, get_activity_stats(start, end))
    except ERPError as e:
        _handle_error(e, ctx)


@activity.command("recent")
@click.option("--limit", default=20, type=int)
@click.pass_context
def activity_recent(ctx: click.Context, limit: int) -> None:
    """Get recent activity."""
    from cli_anything.minierp.core.activityLog import get_recent_activity

    try:
        _out(ctx, get_recent_activity(limit))
    except ERPError as e:
        _handle_error(e, ctx)


# ══════════════════════════════════════════════════════════════════════
# DASHBOARD commands
# ══════════════════════════════════════════════════════════════════════


@cli.group()
def dashboard() -> None:
    """Dashboard and overview."""


@dashboard.command("summary")
@click.pass_context
def dashboard_summary(ctx: click.Context) -> None:
    """Get dashboard summary."""
    from cli_anything.minierp.core.dashboard import get_dashboard_summary

    try:
        _out(ctx, get_dashboard_summary())
    except ERPError as e:
        _handle_error(e, ctx)


# ══════════════════════════════════════════════════════════════════════
# SETTINGS commands
# ══════════════════════════════════════════════════════════════════════


@cli.group()
def settings() -> None:
    """System settings and configuration."""


@settings.command("list")
@click.pass_context
def settings_list(ctx: click.Context) -> None:
    """List all settings."""
    from cli_anything.minierp.core.settings import get_settings

    try:
        _out(ctx, get_settings())
    except ERPError as e:
        _handle_error(e, ctx)


@settings.command("get")
@click.argument("key")
@click.pass_context
def settings_get(ctx: click.Context, key: str) -> None:
    """Get a specific setting."""
    from cli_anything.minierp.core.settings import get_setting

    try:
        _out(ctx, get_setting(key))
    except ERPError as e:
        _handle_error(e, ctx)


@settings.command("update")
@click.argument("key")
@click.argument("value")
@click.pass_context
def settings_update(ctx: click.Context, key: str, value: str) -> None:
    """Update a setting."""
    from cli_anything.minierp.core.settings import update_setting

    try:
        result = update_setting(key, value)
        _ok(ctx, f"Updated {key}", result)
    except ERPError as e:
        _handle_error(e, ctx)


# ══════════════════════════════════════════════════════════════════════
# POS commands
# ══════════════════════════════════════════════════════════════════════


@cli.group()
def pos() -> None:
    """Point of Sale transactions."""


@pos.command("sale")
@click.option("--customer-id", required=True, type=int)
@click.option(
    "--items",
    "items_json",
    required=True,
    help='JSON array: [{"item_id":1,"quantity":2}]',
)
@click.option("--method", default="cash")
@click.option("--tendered", default=0, type=float)
@click.option("--notes", default="")
@click.pass_context
def pos_sale(
    ctx: click.Context,
    customer_id: int,
    items_json: str,
    method: str,
    tendered: float,
    notes: str,
) -> None:
    """Create a POS sale."""
    from cli_anything.minierp.core.pos import create_pos_sale

    try:
        items = json.loads(items_json)
        result = create_pos_sale(customer_id, items, method, tendered, notes)
        _ok(ctx, "POS sale completed", result)
    except json.JSONDecodeError as e:
        _err(f"Invalid JSON for --items: {e}", ctx)
        sys.exit(1)
    except ERPError as e:
        _handle_error(e, ctx)


@pos.command("transactions")
@click.option("--page", default=1, type=int)
@click.option("--limit", default=50, type=int)
@click.pass_context
def pos_transactions(ctx: click.Context, page: int, limit: int) -> None:
    """List POS transactions."""
    from cli_anything.minierp.core.pos import list_pos_transactions

    try:
        _out(ctx, list_pos_transactions(page, limit))
    except ERPError as e:
        _handle_error(e, ctx)


# ══════════════════════════════════════════════════════════════════════
# INTEGRATIONS commands
# ══════════════════════════════════════════════════════════════════════


@cli.group()
def integrations() -> None:
    """Third-party integrations (admin only)."""


@integrations.command("settings")
@click.pass_context
def integrations_settings(ctx: click.Context) -> None:
    """Get integration settings."""
    from cli_anything.minierp.core.integrations import get_integration_settings

    try:
        _out(ctx, get_integration_settings())
    except ERPError as e:
        _handle_error(e, ctx)


@integrations.command("update")
@click.argument("service")
@click.option("--enabled", is_flag=True)
@click.option("--api-key", default=None)
@click.pass_context
def integrations_update(
    ctx: click.Context, service: str, enabled: bool, api_key: Optional[str]
) -> None:
    """Update integration settings."""
    from cli_anything.minierp.core.integrations import update_integration

    try:
        result = update_integration(service, enabled, api_key)
        _ok(ctx, f"Updated {service} integration", result)
    except ERPError as e:
        _handle_error(e, ctx)


@integrations.command("test-email")
@click.option("--to", required=True)
@click.pass_context
def integrations_test_email(ctx: click.Context, to: str) -> None:
    """Test email integration."""
    from cli_anything.minierp.core.integrations import test_email

    try:
        result = test_email(to)
        _ok(ctx, "Test email sent", result)
    except ERPError as e:
        _handle_error(e, ctx)


@integrations.command("weather")
@click.option("--location", required=True)
@click.pass_context
def integrations_weather(ctx: click.Context, location: str) -> None:
    """Get weather data."""
    from cli_anything.minierp.core.integrations import get_weather

    try:
        _out(ctx, get_weather(location))
    except ERPError as e:
        _handle_error(e, ctx)


@integrations.command("exchange-rates")
@click.option("--symbols", default=None)
@click.pass_context
def integrations_rates(ctx: click.Context, symbols: Optional[str]) -> None:
    """Get exchange rates."""
    from cli_anything.minierp.core.integrations import get_exchange_rates

    try:
        _out(ctx, get_exchange_rates(symbols))
    except ERPError as e:
        _handle_error(e, ctx)


# ══════════════════════════════════════════════════════════════════════
# UTILITIES commands
# ══════════════════════════════════════════════════════════════════════


@cli.group()
def utils() -> None:
    """System utilities — export, backup, maintenance."""


@utils.command("export")
@click.argument("entity_type", type=click.Choice([
    "items", "customers", "suppliers", "invoices", "sales",
    "purchases", "expenses", "stock", "movements"
]))
@click.option("--format", "fmt", default="csv", type=click.Choice(["csv", "json"]))
@click.option("--start", default=None, help="Start date YYYY-MM-DD.")
@click.option("--end", default=None, help="End date YYYY-MM-DD.")
@click.pass_context
def utils_export(
    ctx: click.Context,
    entity_type: str,
    fmt: str,
    start: Optional[str],
    end: Optional[str],
) -> None:
    """Export data to file."""
    from cli_anything.minierp.core.utilities import export_data

    try:
        result = export_data(entity_type, fmt, start, end)
        _ok(ctx, f"Exported {entity_type} to {fmt.upper()}", result)
    except ERPError as e:
        _handle_error(e, ctx)


@utils.command("backup")
@click.option("--name", default=None, help="Backup name.")
@click.pass_context
def utils_backup(ctx: click.Context, name: Optional[str]) -> None:
    """Create database backup."""
    from cli_anything.minierp.core.utilities import backup_database

    try:
        result = backup_database(name)
        _ok(ctx, "Database backup created", result)
    except ERPError as e:
        _handle_error(e, ctx)


@utils.command("backups")
@click.pass_context
def utils_list_backups(ctx: click.Context) -> None:
    """List available backups."""
    from cli_anything.minierp.core.utilities import list_backups

    try:
        _out(ctx, list_backups())
    except ERPError as e:
        _handle_error(e, ctx)


@utils.command("restore")
@click.argument("backup_id", type=int)
@click.pass_context
def utils_restore(ctx: click.Context, backup_id: int) -> None:
    """Restore from backup."""
    from cli_anything.minierp.core.utilities import restore_backup

    try:
        result = restore_backup(backup_id)
        _ok(ctx, f"Restored backup {backup_id}", result)
    except ERPError as e:
        _handle_error(e, ctx)


@utils.command("delete-backup")
@click.argument("backup_id", type=int)
@click.pass_context
def utils_delete_backup(ctx: click.Context, backup_id: int) -> None:
    """Delete a backup."""
    from cli_anything.minierp.core.utilities import delete_backup

    try:
        result = delete_backup(backup_id)
        _ok(ctx, f"Deleted backup {backup_id}", result)
    except ERPError as e:
        _handle_error(e, ctx)


@utils.command("system-info")
@click.pass_context
def utils_system_info(ctx: click.Context) -> None:
    """Get system information."""
    from cli_anything.minierp.core.utilities import get_system_info

    try:
        _out(ctx, get_system_info())
    except ERPError as e:
        _handle_error(e, ctx)


@utils.command("clear-cache")
@click.pass_context
def utils_clear_cache(ctx: click.Context) -> None:
    """Clear application cache."""
    from cli_anything.minierp.core.utilities import clear_cache

    try:
        result = clear_cache()
        _ok(ctx, "Cache cleared", result)
    except ERPError as e:
        _handle_error(e, ctx)


@utils.command("optimize-db")
@click.pass_context
def utils_optimize_db(ctx: click.Context) -> None:
    """Optimize database (VACUUM, ANALYZE)."""
    from cli_anything.minierp.core.utilities import optimize_database

    try:
        result = optimize_database()
        _ok(ctx, "Database optimized", result)
    except ERPError as e:
        _handle_error(e, ctx)


@utils.command("db-stats")
@click.pass_context
def utils_db_stats(ctx: click.Context) -> None:
    """Get database statistics."""
    from cli_anything.minierp.core.utilities import get_database_stats

    try:
        _out(ctx, get_database_stats())
    except ERPError as e:
        _handle_error(e, ctx)


@utils.command("import")
@click.argument("entity_type", type=click.Choice([
    "items", "customers", "suppliers", "invoices"
]))
@click.option("--file", "file_path", required=True, help="File path to import.")
@click.option("--format", "fmt", default="csv", type=click.Choice(["csv", "json"]))
@click.pass_context
def utils_import(
    ctx: click.Context,
    entity_type: str,
    file_path: str,
    fmt: str,
) -> None:
    """Import data from file."""
    from cli_anything.minierp.core.utilities import import_data

    try:
        result = import_data(entity_type, file_path, fmt)
        _ok(ctx, f"Imported {entity_type} from {file_path}", result)
    except ERPError as e:
        _handle_error(e, ctx)


@utils.command("audit-log")
@click.option("--entity-type", default=None)
@click.option("--entity-id", type=int, default=None)
@click.option("--start", default=None)
@click.option("--end", default=None)
@click.option("--limit", default=100, type=int)
@click.pass_context
def utils_audit_log(
    ctx: click.Context,
    entity_type: Optional[str],
    entity_id: Optional[int],
    start: Optional[str],
    end: Optional[str],
    limit: int,
) -> None:
    """Get audit log entries."""
    from cli_anything.minierp.core.utilities import get_audit_log

    try:
        _out(ctx, get_audit_log(entity_type, entity_id, start, end, limit))
    except ERPError as e:
        _handle_error(e, ctx)


@utils.command("data-dictionary")
@click.pass_context
def utils_data_dictionary(ctx: click.Context) -> None:
    """Get data dictionary (schema docs)."""
    from cli_anything.minierp.core.utilities import get_data_dictionary

    try:
        _out(ctx, get_data_dictionary())
    except ERPError as e:
        _handle_error(e, ctx)


@utils.command("health-check")
@click.pass_context
def utils_health_check(ctx: click.Context) -> None:
    """Run system health check."""
    from cli_anything.minierp.core.utilities import run_health_check

    try:
        _out(ctx, run_health_check())
    except ERPError as e:
        _handle_error(e, ctx)


# ── Entry point ───────────────────────────────────────────────────────


def main() -> None:
    cli(obj={})


if __name__ == "__main__":
    main()
