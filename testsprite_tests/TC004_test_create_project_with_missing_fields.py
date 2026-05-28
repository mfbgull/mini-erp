import requests

BASE_URL = "http://localhost:3011"
PROJECTS_ENDPOINT = f"{BASE_URL}/api/projects"
TIMEOUT = 30

def test_create_project_with_missing_fields():
    # Missing required fields (assuming "name" is required and omitting it)
    incomplete_payload = {
        # 'name' field is missing intentionally
        "description": "Project without a name",
        # Other optional or required fields could be included, but leaving out required ones
    }
    headers = {
        "Content-Type": "application/json",
    }
    try:
        response = requests.post(PROJECTS_ENDPOINT, json=incomplete_payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"HTTP request failed: {e}"
    
    assert response.status_code == 400, f"Expected 400 Bad Request, got {response.status_code}"
    try:
        error_response = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"
    
    # Validate presence of validation error details in response
    assert "error" in error_response or "errors" in error_response, "Validation error response is missing expected keys"
    # Optionally check that message or details mention missing fields
    error_message = error_response.get("error") or error_response.get("errors") or ""
    assert any(term in str(error_message).lower() for term in ["required", "missing", "name"]), "Validation error message does not indicate missing required fields"

test_create_project_with_missing_fields()