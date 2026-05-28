import requests

BASE_URL = "http://localhost:3011"
TIMEOUT = 30

def test_get_specification_by_id():
    spec_payload = {
        "floor": 1,
        "rooms": [
            {
                "name": "Living Room",
                "length": 5.0,
                "width": 4.0,
                "height": 3.0
            },
            {
                "name": "Bedroom",
                "length": 4.0,
                "width": 3.5,
                "height": 3.0
            }
        ]
    }
    headers = {'Content-Type': 'application/json'}
    spec_id = None
    try:
        # Create a new specification to test GET by ID
        post_resp = requests.post(
            f"{BASE_URL}/api/specifications",
            json=spec_payload,
            headers=headers,
            timeout=TIMEOUT
        )
        assert post_resp.status_code == 201, f"Expected 201 on POST, got {post_resp.status_code}"
        spec_data = post_resp.json()
        spec_id = spec_data.get("id")
        assert spec_id, "Specification ID not returned in POST response"

        # Retrieve the specification by ID
        get_resp = requests.get(
            f"{BASE_URL}/api/specifications/{spec_id}",
            headers=headers,
            timeout=TIMEOUT
        )
        assert get_resp.status_code == 200, f"Expected 200 on GET, got {get_resp.status_code}"
        get_data = get_resp.json()

        # Validate returned data structure and values
        assert get_data.get("id") == spec_id, "Returned specification ID mismatch"
        assert "rooms" in get_data and isinstance(get_data["rooms"], list), "Rooms list missing or invalid"
        assert len(get_data["rooms"]) == len(spec_payload["rooms"]), "Rooms count mismatch"
        for room in spec_payload["rooms"]:
            matching_rooms = [r for r in get_data["rooms"] if r.get("name") == room["name"]]
            assert matching_rooms, f"Room '{room['name']}' missing in returned data"
            returned_room = matching_rooms[0]
            for dim in ["length", "width", "height"]:
                assert abs(returned_room.get(dim, 0) - room[dim]) < 0.001, f"{dim} mismatch in room '{room['name']}'"

        # Check for presence of derived quantities (e.g., volume or area)
        assert "derivedQuantities" in get_data, "Derived quantities missing in specification data"
        derived = get_data["derivedQuantities"]
        assert isinstance(derived, dict) and len(derived) > 0, "Derived quantities structure invalid or empty"

    finally:
        if spec_id:
            # Clean up by deleting the created specification
            try:
                del_resp = requests.delete(
                    f"{BASE_URL}/api/specifications/{spec_id}",
                    headers=headers,
                    timeout=TIMEOUT
                )
                assert del_resp.status_code in (200, 204), f"Unexpected status {del_resp.status_code} on delete"
            except Exception:
                pass

test_get_specification_by_id()