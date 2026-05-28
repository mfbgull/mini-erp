import requests

BASE_URL = "http://localhost:3011"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
SPECIFICATIONS_URL = f"{BASE_URL}/api/specifications"

# Provide valid credentials for authentication
EMAIL = "testuser@example.com"
PASSWORD = "testpassword"

def authenticate():
    try:
        response = requests.post(
            LOGIN_URL,
            json={"email": EMAIL, "password": PASSWORD},
            timeout=30
        )
        response.raise_for_status()
        return response.json().get("token")
    except Exception as e:
        raise RuntimeError(f"Authentication failed: {e}")

def create_valid_specification(headers):
    valid_spec_payload = {
        "floor": 1,
        "rooms": [
            {
                "name": "Room A",
                "length": 5.0,
                "width": 4.0,
                "height": 3.0
            }
        ]
    }
    resp = requests.post(SPECIFICATIONS_URL, json=valid_spec_payload, headers=headers, timeout=30)
    resp.raise_for_status()
    return resp.json().get("id")

def delete_specification(spec_id, headers):
    requests.delete(f"{SPECIFICATIONS_URL}/{spec_id}", headers=headers, timeout=30)

def test_update_specification_with_unsupported_data():
    token = authenticate()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    spec_id = None
    try:
        spec_id = create_valid_specification(headers)

        # Unsupported room data payload (e.g. negative dimension or unexpected fields)
        unsupported_payload = {
            "floor": 1,
            "rooms": [
                {
                    "name": "Invalid Room",
                    "length": -5,       # unsupported negative dimension
                    "width": 4,
                    "height": 3,
                    "extraField": "unsupported"  # unsupported additional field
                }
            ]
        }

        update_resp = requests.put(f"{SPECIFICATIONS_URL}/{spec_id}", json=unsupported_payload, headers=headers, timeout=30)

        # Assert response status 422 for unsupported room data
        assert update_resp.status_code == 422, f"Expected 422 status but got {update_resp.status_code}"

        # Assert response body contains calculation or business-rule error indication
        json_resp = update_resp.json()
        error_messages = [
            "calculation error",
            "business-rule error",
            "unsupported",
            "invalid",
            "dimension"
        ]
        error_found = any(
            error_key in str(json_resp).lower() for error_key in error_messages
        )
        assert error_found, f"Expected calculation or business-rule error message in response but got: {json_resp}"

    finally:
        if spec_id:
            delete_specification(spec_id, headers)

test_update_specification_with_unsupported_data()
