import requests

BASE_URL = "http://localhost:3011"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
SPECIFICATIONS_URL = f"{BASE_URL}/api/specifications"
TIMEOUT = 30

# We assume valid credentials for authentication (replace with actual valid credentials)
AUTH_CREDENTIALS = {
    "username": "testuser",
    "password": "testpassword"
}

def authenticate():
    try:
        response = requests.post(LOGIN_URL, json=AUTH_CREDENTIALS, timeout=TIMEOUT)
        response.raise_for_status()
        token = response.json().get("token")
        assert token, "No token received in login response"
        return token
    except Exception as e:
        raise RuntimeError(f"Authentication failed: {e}")

def test_update_specification_with_valid_data():
    token = authenticate()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # First create a new specification resource, then update it and finally delete it
    spec_create_payload = {
        "floor": 1,
        "rooms": [
            {
                "name": "Living Room",
                "length": 5.0,
                "width": 4.0,
                "height": 3.0
            }
        ]
    }

    spec_update_payload = {
        "floor": 1,
        "rooms": [
            {
                "name": "Living Room",
                "length": 6.0,
                "width": 5.0,
                "height": 3.0
            }
        ]
    }

    spec_id = None
    try:
        # Create specification
        create_resp = requests.post(SPECIFICATIONS_URL, headers=headers, json=spec_create_payload, timeout=TIMEOUT)
        assert create_resp.status_code == 201, f"Expected 201 on creation, got {create_resp.status_code}"
        create_data = create_resp.json()
        spec_id = create_data.get("id")
        assert spec_id, "Created specification ID not found in response"

        # Update specification with new dimensions
        update_resp = requests.put(f"{SPECIFICATIONS_URL}/{spec_id}", headers=headers, json=spec_update_payload, timeout=TIMEOUT)
        assert update_resp.status_code == 200, f"Expected 200 on update, got {update_resp.status_code}"
        update_data = update_resp.json()
        
        # Validate recalculated results exist (e.g. recalculated quantities)
        assert "rooms" in update_data, "Updated specification missing 'rooms'"
        assert isinstance(update_data["rooms"], list) and len(update_data["rooms"]) == 1, "Updated rooms count mismatch"
        updated_room = update_data["rooms"][0]
        assert updated_room.get("length") == 6.0, "Updated length not reflected"
        assert updated_room.get("width") == 5.0, "Updated width not reflected"
        
        # Assuming recalculated quantities exist under 'quantities' or similar key
        assert "quantities" in update_data or "calculated" in update_data, "Recalculated results missing in update response"

    finally:
        if spec_id:
            # Delete the created specification to clean up
            try:
                del_resp = requests.delete(f"{SPECIFICATIONS_URL}/{spec_id}", headers=headers, timeout=TIMEOUT)
                assert del_resp.status_code in (200, 204), f"Expected 200 or 204 on delete, got {del_resp.status_code}"
            except Exception:
                pass

test_update_specification_with_valid_data()