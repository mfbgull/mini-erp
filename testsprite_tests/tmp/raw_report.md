
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** minierp
- **Date:** 2026-05-28
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 test_create_project_with_valid_details
- **Test Code:** [TC001_test_create_project_with_valid_details.py](./TC001_test_create_project_with_valid_details.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 33, in <module>
  File "<string>", line 22, in test_create_project_with_valid_details
AssertionError: Expected status code 201, got 403

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/9ca06320-e36c-4edd-8857-577c6682a869/5e59a84b-c367-445e-8950-2a801d8a6647
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 test_get_project_list
- **Test Code:** [TC002_test_get_project_list.py](./TC002_test_get_project_list.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 34, in <module>
  File "<string>", line 23, in test_get_project_list
  File "<string>", line 15, in get_auth_token
AssertionError: Login failed with status 400

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/9ca06320-e36c-4edd-8857-577c6682a869/eac64ab5-bde0-4496-9414-ce7934ec8c86
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 test_get_project_details_by_id
- **Test Code:** [TC003_test_get_project_details_by_id.py](./TC003_test_get_project_details_by_id.py)
- **Test Error:** Traceback (most recent call last):
  File "<string>", line 15, in get_auth_token
  File "/var/lang/lib/python3.12/site-packages/requests/models.py", line 1024, in raise_for_status
    raise HTTPError(http_error_msg, response=self)
requests.exceptions.HTTPError: 401 Client Error: Unauthorized for url: http://localhost:3011/api/auth/login

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 77, in <module>
  File "<string>", line 48, in test_get_project_details_by_id
  File "<string>", line 20, in get_auth_token
RuntimeError: Authentication failed: 401 Client Error: Unauthorized for url: http://localhost:3011/api/auth/login

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/9ca06320-e36c-4edd-8857-577c6682a869/41345e77-1ebe-4483-aa66-0f13f0f9dc43
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 test_create_project_with_missing_fields
- **Test Code:** [TC004_test_create_project_with_missing_fields.py](./TC004_test_create_project_with_missing_fields.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 34, in <module>
  File "<string>", line 22, in test_create_project_with_missing_fields
AssertionError: Expected 400 Bad Request, got 403

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/9ca06320-e36c-4edd-8857-577c6682a869/39f4ee78-7555-42e1-ab71-2f03a1735615
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 test_get_nonexistent_project
- **Test Code:** [TC005_test_get_nonexistent_project.py](./TC005_test_get_nonexistent_project.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 32, in <module>
  File "<string>", line 19, in test_get_nonexistent_project
AssertionError: Expected status code 404, got 403

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/9ca06320-e36c-4edd-8857-577c6682a869/c9b20405-d1a6-46c0-9608-b95204a0ea0b
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006 test_create_specification_with_valid_dimensions
- **Test Code:** [TC006_test_create_specification_with_valid_dimensions.py](./TC006_test_create_specification_with_valid_dimensions.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 77, in <module>
  File "<string>", line 40, in test_create_specification_with_valid_dimensions
AssertionError: Expected status 201, got 403

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/9ca06320-e36c-4edd-8857-577c6682a869/21803bc3-4779-45ba-965d-6bc4c7886db6
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 test_get_specification_by_id
- **Test Code:** [TC007_test_get_specification_by_id.py](./TC007_test_get_specification_by_id.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 77, in <module>
  File "<string>", line 34, in test_get_specification_by_id
AssertionError: Expected 201 on POST, got 403

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/9ca06320-e36c-4edd-8857-577c6682a869/e4e17193-a0a8-4b9a-b00f-c594a3ceafcd
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 test_update_specification_with_valid_data
- **Test Code:** [TC008_test_update_specification_with_valid_data.py](./TC008_test_update_specification_with_valid_data.py)
- **Test Error:** Traceback (most recent call last):
  File "<string>", line 17, in authenticate
  File "/var/lang/lib/python3.12/site-packages/requests/models.py", line 1024, in raise_for_status
    raise HTTPError(http_error_msg, response=self)
requests.exceptions.HTTPError: 401 Client Error: Unauthorized for url: http://localhost:3011/api/auth/login

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 89, in <module>
  File "<string>", line 25, in test_update_specification_with_valid_data
  File "<string>", line 22, in authenticate
RuntimeError: Authentication failed: 401 Client Error: Unauthorized for url: http://localhost:3011/api/auth/login

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/9ca06320-e36c-4edd-8857-577c6682a869/b2681077-6695-4fb4-8011-ccabc967deb5
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 test_create_specification_with_invalid_dimensions
- **Test Code:** [TC009_test_create_specification_with_invalid_dimensions.py](./TC009_test_create_specification_with_invalid_dimensions.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 67, in <module>
  File "<string>", line 53, in test_create_specification_with_invalid_dimensions
AssertionError: Expected status code 400 for payload {'floor': 'First Floor', 'rooms': [{'name': 'Room A', 'length': -5, 'width': 4, 'height': 3}]}, but got 403 with response: {"error":"Invalid CSRF token","code":"CSRF_FAILED"}

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/9ca06320-e36c-4edd-8857-577c6682a869/db44bd53-049b-431d-a560-5d93392b8921
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 test_update_specification_with_unsupported_data
- **Test Code:** [TC010_test_update_specification_with_unsupported_data.py](./TC010_test_update_specification_with_unsupported_data.py)
- **Test Error:** Traceback (most recent call last):
  File "<string>", line 18, in authenticate
  File "/var/lang/lib/python3.12/site-packages/requests/models.py", line 1024, in raise_for_status
    raise HTTPError(http_error_msg, response=self)
requests.exceptions.HTTPError: 400 Client Error: Bad Request for url: http://localhost:3011/api/auth/login

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 90, in <module>
  File "<string>", line 43, in test_update_specification_with_unsupported_data
  File "<string>", line 21, in authenticate
RuntimeError: Authentication failed: 400 Client Error: Bad Request for url: http://localhost:3011/api/auth/login

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/9ca06320-e36c-4edd-8857-577c6682a869/fc93ea57-cd3a-4d78-8479-6f7f69445cdd
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **0.00** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---