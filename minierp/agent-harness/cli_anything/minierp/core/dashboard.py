"""Core: Dashboard — summary statistics."""

from cli_anything.minierp.utils.erp_backend import make_client, ERPError


def get_dashboard_summary() -> dict:
    """Get dashboard summary with key metrics."""
    client = make_client()
    return client.get("/dashboard/summary")
