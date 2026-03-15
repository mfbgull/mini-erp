"""Core: Integrations — third-party integrations (admin only)."""

from typing import Any, Optional
from cli_anything.minierp.utils.erp_backend import make_client, ERPError


def get_integration_settings() -> dict:
    """Get all integration settings."""
    client = make_client()
    return client.get("/settings")


def update_integration(
    service: str,
    enabled: bool,
    api_key: Optional[str] = None,
    **extra_settings: Any,
) -> dict:
    """Update integration settings."""
    client = make_client()
    body: dict[str, Any] = {"enabled": enabled}
    if api_key:
        body["apiKey"] = api_key
    body.update(extra_settings)
    return client.put(f"/settings/{service}", body=body)


def test_email(to: str) -> dict:
    """Test email integration."""
    client = make_client()
    return client.post("/test/email", body={"to": to})


def test_notification(to: str) -> dict:
    """Test SMS/notification integration."""
    client = make_client()
    return client.post("/test/notification", body={"to": to})


def get_weather(location: str) -> dict:
    """Get weather data for a location."""
    client = make_client()
    return client.get("/weather", params={"location": location})


def validate_phone(phone: str) -> dict:
    """Validate a phone number."""
    client = make_client()
    return client.get("/validate/phone", params={"phone": phone})


def get_exchange_rates(symbols: Optional[str] = None) -> dict:
    """Get currency exchange rates."""
    client = make_client()
    params = {}
    if symbols:
        params["symbols"] = symbols
    return client.get("/currency/rates", params=params)


def convert_currency(amount: float, from_curr: str, to_curr: str) -> dict:
    """Convert currency."""
    client = make_client()
    return client.post(
        "/currency/convert",
        body={
            "amount": amount,
            "from": from_curr,
            "to": to_curr,
        },
    )


def calculate_tax(
    amount: float,
    country: str,
    zip_code: Optional[str] = None,
    state: Optional[str] = None,
    city: Optional[str] = None,
    street: Optional[str] = None,
    shipping: float = 0,
) -> dict:
    """Calculate tax for a transaction."""
    client = make_client()
    body: dict[str, Any] = {
        "toCountry": country,
        "amount": amount,
        "shipping": shipping,
    }
    if zip_code:
        body["toZip"] = zip_code
    if state:
        body["toState"] = state
    if city:
        body["toCity"] = city
    if street:
        body["toStreet"] = street
    return client.post("/tax/calculate", body=body)
