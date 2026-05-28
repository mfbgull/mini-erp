import requests

BASE_URL = "http://localhost:3011"
TIMEOUT = 30

# Replace 'your_valid_jwt_token_here' with a real token
AUTH_TOKEN = "your_valid_jwt_token_here"

def test_create_specification_with_valid_dimensions():
    url = f"{BASE_URL}/api/specifications"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {AUTH_TOKEN}"
    }

    # Sample payload with valid room dimensions and floor data
    payload = {
        "floor": {
            "level": 1,
            "rooms": [
                {
                    "name": "Living Room",
                    "length": 5.0,
                    "width": 4.0,
                    "height": 3.0
                },
                {
                    "name": "Kitchen",
                    "length": 3.0,
                    "width": 3.5,
                    "height": 3.0
                }
            ]
        }
    }

    response = None
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 201, f"Expected status 201, got {response.status_code}"
        
        data = response.json()
        # Validate that the response contains calculated specification output
        # Checking presence of expected keys in the output - as exact schema not provided, general checks:
        assert "id" in data, "Response missing 'id'"
        assert "floor" in data, "Response missing 'floor'"
        assert "rooms" in data["floor"], "Response floor missing 'rooms'"
        assert len(data["floor"]["rooms"]) == len(payload["floor"]["rooms"]), "Number of rooms mismatch"
        
        # Check that quantities or calculations exist in each room, example keys like "quantities" or similar
        for room in data["floor"]["rooms"]:
            assert "name" in room and isinstance(room["name"], str)
            # Assume there should be some calculated quantities in room
            found_calc = False
            for key in room:
                if key not in ["name", "length", "width", "height"]:
                    found_calc = True
                    break
            assert found_calc, f"No calculated output found in room {room.get('name', '?')}"
    finally:
        # If resource created, attempt to delete to clean up (best effort, no id known except from response)
        if response is not None and response.status_code == 201:
            spec_id = None
            try:
                spec_id = response.json().get("id")
            except Exception:
                spec_id = None
            if spec_id:
                try:
                    del_url = f"{BASE_URL}/api/specifications/{spec_id}"
                    del_response = requests.delete(del_url, headers=headers, timeout=TIMEOUT)
                    # Deletion might return 204 or other success code
                    assert del_response.status_code in (200, 202, 204), f"Failed to delete specification {spec_id}"
                except Exception:
                    pass

test_create_specification_with_valid_dimensions()
