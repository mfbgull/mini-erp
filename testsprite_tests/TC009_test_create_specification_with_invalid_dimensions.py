import requests

BASE_URL = "http://localhost:3011"
SPECIFICATIONS_ENDPOINT = f"{BASE_URL}/api/specifications"
TIMEOUT = 30

def test_create_specification_with_invalid_dimensions():
    # Examples of invalid payloads for specifications (invalid dimensions and malformed)
    invalid_payloads = [
        # Negative dimensions
        {
            "floor": "First Floor",
            "rooms": [
                {"name": "Room A", "length": -5, "width": 4, "height": 3}
            ]
        },
        # Missing required room fields (malformed)
        {
            "floor": "Second Floor",
            "rooms": [
                {"name": "Room B", "length": 5}  # Missing width and height
            ]
        },
        # Dimensions as strings instead of numbers
        {
            "floor": "Third Floor",
            "rooms": [
                {"name": "Room C", "length": "five", "width": "four", "height": "three"}
            ]
        },
        # Completely malformed payload (not a dict)
        "this is not a dict",
        # Empty payload
        {}
    ]

    headers = {"Content-Type": "application/json"}

    for payload in invalid_payloads:
        try:
            if isinstance(payload, str):
                # Send as raw string data for malformed payload test
                response = requests.post(
                    SPECIFICATIONS_ENDPOINT, data=payload, headers=headers, timeout=TIMEOUT
                )
            else:
                response = requests.post(
                    SPECIFICATIONS_ENDPOINT, json=payload, headers=headers, timeout=TIMEOUT
                )
        except requests.RequestException as e:
            assert False, f"Request failed with exception: {e}"

        assert response.status_code == 400, (
            f"Expected status code 400 for payload {payload}, "
            f"but got {response.status_code} with response: {response.text}"
        )
        try:
            resp_json = response.json()
        except ValueError:
            assert False, f"Response is not valid JSON for payload {payload}: {response.text}"

        # Expect validation errors in response body (exact field names may vary)
        assert "errors" in resp_json or "message" in resp_json or "validation" in resp_json, (
            f"Expected validation error details in response for payload {payload}, got: {resp_json}"
        )

test_create_specification_with_invalid_dimensions()
