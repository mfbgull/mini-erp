"""Core: Forecasts — demand forecasting and trend analysis."""

from typing import Optional, Any
from cli_anything.minierp.utils.erp_backend import make_client


def get_forecast_dashboard() -> dict:
    """Get forecast dashboard data."""
    client = make_client()
    return client.get("/forecasts/dashboard")


def get_demand_forecasts(
    category: Optional[str] = None,
    trend: Optional[str] = None,
    recommendation: Optional[str] = None,
) -> dict:
    """Get demand forecasts with optional filters."""
    client = make_client()
    params: dict[str, Any] = {}
    if category:
        params["category"] = category
    if trend:
        params["trend"] = trend
    if recommendation:
        params["recommendation"] = recommendation
    return client.get("/forecasts/demand", params=params)


def get_trend_data(item_id: Optional[int] = None) -> dict:
    """Get trend data, optionally for a specific item."""
    client = make_client()
    params = {}
    if item_id is not None:
        params["itemId"] = item_id
    return client.get("/forecasts/trends", params=params)


def generate_forecasts() -> dict:
    """Generate new forecasts for all items."""
    client = make_client()
    return client.post("/forecasts/generate")
