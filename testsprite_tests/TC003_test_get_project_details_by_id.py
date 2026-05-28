import requests

BASE_URL = "http://localhost:3011"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
PROJECTS_URL = f"{BASE_URL}/api/projects"

# Credentials for authentication, replace with valid ones if required
USERNAME = "testuser"
PASSWORD = "testpass"

def get_auth_token():
    payload = {"username": USERNAME, "password": PASSWORD}
    try:
        resp = requests.post(LOGIN_URL, json=payload, timeout=30)
        resp.raise_for_status()
        token = resp.json().get("token")
        assert token, "No token received in login response"
        return token
    except Exception as e:
        raise RuntimeError(f"Authentication failed: {e}")

def create_project(headers):
    project_payload = {
        "name": "Test Project for Details",
        "description": "Project created for testing GET /api/projects/:id endpoint",
        "location": "Test location",
        "startDate": "2024-01-01",
        "endDate": "2024-12-31"
    }
    try:
        resp = requests.post(PROJECTS_URL, json=project_payload, headers=headers, timeout=30)
        resp.raise_for_status()
        assert resp.status_code == 201
        project = resp.json()
        assert "id" in project, "Created project ID missing"
        return project["id"]
    except Exception as e:
        raise RuntimeError(f"Project creation failed: {e}")

def delete_project(project_id, headers):
    try:
        resp = requests.delete(f"{PROJECTS_URL}/{project_id}", headers=headers, timeout=30)
        # No assertion on deletion status, best effort cleanup
    except Exception:
        pass  # ignore errors during cleanup

def test_get_project_details_by_id():
    token = get_auth_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    project_id = None
    try:
        # Create project first to get valid project ID
        project_id = create_project(headers)

        # GET project details by ID
        resp = requests.get(f"{PROJECTS_URL}/{project_id}", headers=headers, timeout=30)
        resp.raise_for_status()

        assert resp.status_code == 200

        project_details = resp.json()
        # Validate expected fields in the returned project details
        expected_keys = ["id", "name", "description", "location", "startDate", "endDate"]
        for key in expected_keys:
            assert key in project_details, f"Missing key '{key}' in project details response"

        assert project_details["id"] == project_id

    finally:
        if project_id:
            delete_project(project_id, headers)

test_get_project_details_by_id()