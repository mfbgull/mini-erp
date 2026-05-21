# Using the Opencode MCP Server for MiniERP

## Overview
This MCP (Model Context Protocol) server provides Opencode with access to MiniERP-specific context, tools, and compliance checking capabilities.

## Installation & Setup

### 1. Install Dependencies
```bash
cd /home/fawad/ai/minierp
python3 -m venv venv-mcp
source venv-mcp/bin/activate
pip install mcp
```

### 2. Start the MCP Server
```bash
# Method 1: Direct execution
source venv-mcp/bin/activate
python opencode_mcp_server.py

# Method 2: Using the startup script
./start_opencode_mcp.sh
```

### 3. Connect Opencode to the MCP Server
In your Opencode configuration or command line:
```bash
# Add the MCP server to Opencode
opencode mcp add opencode-minierp -- /home/fawad/ai/minierp/venv-mcp/bin/python /home/fawad/ai/minierp/opencode_mcp_server.py

# Or if using the script:
opencode mcp add opencode-minierp -- /home/fawad/ai/minierp/start_opencode_mcp.sh
```

## Available Capabilities

### Resources
These are data sources that Opencode can read:

1. **`mini erp://agents-md`** - The full AGENTS.md specification document
2. **`mini erp://project-structure`** - Overview of the MiniERP project structure

### Tools
These are executable functions that Opencode can call:

#### 1. `search-minierp-code`
Search for code patterns in the MiniERP codebase.

**Parameters:**
- `query` (string, required): The search term or pattern
- `room` (string, optional): Where to search (`frontend`, `backend`, `electron`, `docs`, `all`)

**Example usage:**
```python
# Search for inventory-related code in the backend
await opencode.call_tool(
    "search-minierp-code",
    {"query": "inventory items movements", "room": "backend"}
)
```

#### 2. `get-minierp-context`
Get relevant contextual information for development tasks.

**Parameters:**
- `topic` (string, optional): Topic to get context for (e.g., 'inventory', 'sales', 'authentication')

**Example usage:**
```python
# Get context for working on authentication features
await opencode.call_tool(
    "get-minierp-context",
    {"topic": "authentication"}
)
```

#### 3. `check-agents-md-compliance`
Check if a file follows AGENTS.md rules and best practices.

**Parameters:**
- `filePath` (string, required): Path to file to check (relative to project root)
- `ruleType` (string, optional): Type of rules to check (`type-safety`, `error-handling`, `database`, `security`, `all`)

**Example usage:**
```python
# Check a new controller for compliance
await opencode.call_tool(
    "check-agents-md-compliance",
    {
        "filePath": "server/controllers/inventory.controller.ts",
        "ruleType": "all"
    }
)
```

## Example Workflows

### Workflow 1: Starting a New Feature
1. Get context for the feature area:
   ```python
   context = await opencode.call_tool("get-minierp-context", {"topic": "inventory"})
   ```
2. Search for existing similar implementations:
   ```python
   matches = await opencode.call_tool("search-minierp-code", {"query": "create inventory item", "room": "backend"})
   ```
3. Check AGENTS.md for relevant rules:
   ```python
   agents_content = await opencode.read_resource("mini erp://agents-md")
   ```

### Workflow 2: Implementing and Validating Code
1. Write your code in the appropriate location
2. Run compliance check:
   ```python
   compliance = await opencode.call_tool("check-agents-md-compliance", {
       "filePath": "server/services/new-feature.service.ts",
       "ruleType": "all"
   })
   ```
3. If issues found, fix them and re-check until compliant

### Workflow 3: Answering Questions About the Project
When Opencode has questions about MiniERP:
1. Check project structure: `await opencode.read_resource("mini erp://project-structure")`
2. Search for relevant code: `await opencode.call_tool("search-minierp-code", {...})`
3. Get topic-specific context: `await opencode.call_tool("get-minierp-context", {...})`

## Benefits for Opencode Users

### 1. **Project-Specific Awareness**
Opencode understands MiniERP's architecture, rules, and patterns without needing to reread documentation constantly.

### 2. **Consistency Enforcement**
Automated checks help ensure new code follows established patterns and AGENTS.md rules.

### 3. **Faster Development**
Quick access to context and existing implementations reduces time spent searching and researching.

### 4. **Reduced Errors**
Compliance checking catches common violations before they become issues.

### 5. **Better AI Assistance**
With project context, Opencode can provide more relevant, accurate suggestions and implementations.

## Example Commands in Opencode

Once connected, you can use natural language like:
- "Show me the AGENTS.md specification for MiniERP"
- "Search for inventory items movements in the backend code"
- "What does the authentication system look like in MiniERP?"
- "Check if my new controller follows MiniERP's type safety rules"
- "Get the project structure overview"

The MCP server makes all of these possible through programmatic access to MiniERP's knowledge base.