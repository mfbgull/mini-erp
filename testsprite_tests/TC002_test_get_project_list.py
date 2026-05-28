import requests

BASE_URL = "http://localhost:3011"
PROJECTS_ENDPOINT = f"{BASE_URL}/api/projects"
LOGIN_ENDPOINT = f"{BASE_URL}/api/auth/login"
TIMEOUT = 30

# Provide valid credentials for authentication
EMAIL = "testuser"
PASSWORD = "testpassword"

def get_auth_token():
    try:
        resp = requests.post(LOGIN_ENDPOINT, json={"email": EMAIL, "password": PASSWORD}, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Login failed with status {resp.status_code}"
        token = resp.json().get("token")
        assert isinstance(token, str), f"Expected token to be string, got {type(token)}"
        return token
    except requests.RequestException as e:
        assert False, f"Login request failed: {e}"

def test_get_project_list():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(PROJECTS_ENDPOINT, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), f"Expected response data type list, got {type(data)}"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"


test_get_project_list()
