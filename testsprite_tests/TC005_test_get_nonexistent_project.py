import requests

BASE_URL = "http://localhost:3011"
TIMEOUT = 30
AUTH_TOKEN = "Bearer your_valid_token_here"

def test_get_nonexistent_project():
    non_existent_project_id = "00000000-0000-0000-0000-000000000000"
    url = f"{BASE_URL}/api/projects/{non_existent_project_id}"
    headers = {
        "Authorization": AUTH_TOKEN
    }

    try:
        response = requests.get(url, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 404, f"Expected status code 404, got {response.status_code}"
    json_response = {}
    try:
        json_response = response.json()
    except ValueError:
        # If no json returned, it might still be a valid 404 response
        pass

    # The response for not found should indicate not found by some key or message
    # Since schema is not specified, just ensure some indication of not found
    assert (("not found" in response.text.lower()) or ("error" in json_response)) , \
        "Response does not contain expected 'not found' indication."

test_get_nonexistent_project()
