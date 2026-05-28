import requests

BASE_URL = "http://localhost:3011"
TIMEOUT = 30

def test_create_project_with_valid_details():
    url = f"{BASE_URL}/api/projects"
    headers = {
        "Content-Type": "application/json"
    }
    # Example valid project payload, minimally required fields guessed as "name" and "description"
    payload = {
        "name": "Test Project Alpha",
        "description": "A project created for testing purposes."
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 201, f"Expected status code 201, got {response.status_code}"
    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Validate returned project data contains at least the submitted fields plus an id
    assert "id" in data, "Created project response missing 'id'"
    assert data.get("name") == payload["name"], "Project name in response does not match input"
    assert data.get("description") == payload["description"], "Project description in response does not match input"

test_create_project_with_valid_details()