#!/usr/bin/env python3
"""
MCP Server for Opencode - Provides MiniERP project context and tools
"""

import asyncio
import json
import os
from typing import Any, Dict, List
from mcp.server import Server, NotificationOptions
from mcp.server.models import InitializationOptions
import mcp.server.stdio
import mcp.types as types

# Initialize the MCP server
server = Server("opencode-minierp")

# Project root
PROJECT_ROOT = "/home/fawad/ai/minierp"

@server.list_resources()
async def handle_list_resources() -> List[types.Resource]:
    """List available resources (project files, docs, etc.)"""
    return [
        types.Resource(
            uri="mini erp://agents-md",
            name="AGENTS.md - MiniERP Specification",
            description="The MiniERP AI Agent Specification document",
            mimeType="text/markdown",
        ),
        types.Resource(
            uri="mini erp://project-structure",
            name="Project Structure Overview",
            description="Overview of MiniERP project structure",
            mimeType="text/plain",
        ),
    ]

@server.read_resource()
async def handle_read_resource(uri: str) -> str:
    """Read a specific resource"""
    if uri == "mini erp://agents-md":
        agents_path = os.path.join(PROJECT_ROOT, "AGENTS.md")
        if os.path.exists(agents_path):
            with open(agents_path, 'r') as f:
                return f.read()
        return "AGENTS.md not found"
    
    elif uri == "mini erp://project-structure":
        # Generate a brief project structure overview
        structure = []
        for root, dirs, files in os.walk(PROJECT_ROOT):
            # Skip hidden directories and common noise
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['node_modules', '__pycache__', 'dist', 'build']]
            level = root.replace(PROJECT_ROOT, '').count(os.sep)
            indent = ' ' * 2 * level
            structure.append(f"{indent}{os.path.basename(root)}/")
            subindent = ' ' * 2 * (level + 1)
            for file in files[:5]:  # Limit files shown
                if not file.startswith('.'):
                    structure.append(f"{subindent}{file}")
            if len(files) > 5:
                structure.append(f"{subindent}... and {len(files) - 5} more files")
        return "\n".join(structure)
    
    raise ValueError(f"Unknown resource: {uri}")

@server.list_tools()
async def handle_list_tools() -> List[types.Tool]:
    """List available tools"""
    return [
        types.Tool(
            name="search-minierp-code",
            description="Search for code patterns in MiniERP backend/frontend",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query (supports basic regex)"
                    },
                    "room": {
                        "type": "string",
                        "enum": ["frontend", "backend", "electron", "docs", "all"],
                        "description": "Project room to search in",
                        "default": "all"
                    }
                },
                "required": ["query"]
            }
        ),
        types.Tool(
            name="get-minierp-context",
            description="Get relevant MiniERP context for development tasks",
            inputSchema={
                "type": "object",
                "properties": {
                    "topic": {
                        "type": "string",
                        "description": "Topic to get context for (e.g., 'inventory', 'sales', 'authentication')"
                    }
                }
            }
        ),
        types.Tool(
            name="check-agents-md-compliance",
            description="Check if code follows AGENTS.md rules",
            inputSchema={
                "type": "object",
                "properties": {
                    "filePath": {
                        "type": "string",
                        "description": "Path to file to check (relative to project root)"
                    },
                    "ruleType": {
                        "type": "string",
                        "enum": ["type-safety", "error-handling", "database", "security", "all"],
                        "description": "Type of rule to check",
                        "default": "all"
                    }
                },
                "required": ["filePath"]
            }
        )
    ]

@server.call_tool()
async def handle_call_tool(name: str, arguments: Dict[str, Any]) -> List[types.TextContent]:
    """Handle tool calls"""
    
    if name == "search-minierp-code":
        query = arguments.get("query", "")
        room = arguments.get("room", "all")
        
        # Map room to actual directories
        room_map = {
            "frontend": "client",
            "backend": "server", 
            "electron": "electron",
            "docs": "docs",
            "all": ""
        }
        
        search_dir = PROJECT_ROOT
        if room_map[room]:
            search_dir = os.path.join(PROJECT_ROOT, room_map[room])
        
        # Use grep-like search (simplified)
        import subprocess
        try:
            # Search for the query in files
            cmd = ["grep", "-r", "-n", "-i", query, search_dir]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                matches = result.stdout.strip().split('\n')
                # Limit results
                matches = matches[:10] if matches != [''] else []
                return [types.TextContent(
                    type="text",
                    text=f"Found {len(matches)} matches for '{query}' in {room}:\n\n" + 
                         "\n".join(matches) if matches else "No matches found"
                )]
            else:
                return [types.TextContent(
                    type="text",
                    text=f"No matches found for '{query}' in {room}"
                )]
        except Exception as e:
            return [types.TextContent(
                type="text",
                text=f"Search error: {str(e)}"
            )]
    
    elif name == "get-minierp-context":
        topic = arguments.get("topic", "").lower()
        
        # Load relevant context based on topic
        context_parts = []
        
        # Always include AGENTS.md highlights
        agents_path = os.path.join(PROJECT_ROOT, "AGENTS.md")
        if os.path.exists(agents_path):
            with open(agents_path, 'r') as f:
                content = f.read()
                # Extract sections relevant to topic
                if topic:
                    # Simple topic matching - in reality you'd use better NLP
                    lines = content.split('\n')
                    relevant_lines = []
                    capture = False
                    for line in lines:
                        if topic in line.lower() or any(keyword in line.lower() for keyword in [topic, 'mode', 'rule']):
                            capture = True
                        if capture:
                            relevant_lines.append(line)
                            if line.strip() == '' and len(relevant_lines) > 5:
                                # Stop after a blank line following some content
                                if len([l for l in relevant_lines[-3:] if l.strip()]) == 0:
                                    break
                    context_parts.extend(relevant_lines[:20])  # Limit
                else:
                    # General context - first 500 chars
                    context_parts.append(content[:500] + "...")
        
        # Add project-specific info
        if topic in ['inventory', 'stock']:
            context_parts.append("\nInventory Module: Handles stock levels, movements, valuations, low-stock alerts")
        elif topic in ['sales', 'orders']:
            context_parts.append("\nSales Module: Manages customer orders, invoices, payments, returns")
        elif topic in ['authentication', 'auth']:
            context_parts.append("\nAuthentication: Uses cli-anything-minierp auth commands with admin/admin123 default")
        elif topic in ['production', 'bom']:
            context_parts.append("\nProduction/BOM: Handles manufacturing processes, bill of materials, work orders")
        
        return [types.TextContent(
            type="text",
            text="\n".join(context_parts) if context_parts else f"No specific context found for '{topic}'"
        )]
    
    elif name == "check-agents-md-compliance":
        file_path = arguments.get("filePath", "")
        rule_type = arguments.get("ruleType", "all")
        
        full_path = os.path.join(PROJECT_ROOT, file_path)
        if not os.path.exists(full_path):
            return [types.TextContent(
                type="text",
                text=f"File not found: {file_path}"
            )]
        
        try:
            with open(full_path, 'r') as f:
                content = f.read()
            
            issues = []
            
            if rule_type in ["type-safety", "all"]:
                if "any" in content or "as any" in content:
                    issues.append("❌ Type Safety: Found 'any' or 'as any' usage")
                if "@ts-ignore" in content:
                    issues.append("❌ Type Safety: Found @ts-ignore suppression")
            
            if rule_type in ["error-handling", "all"]:
                if "try/catch" not in content.lower() and ".ts" in file_path:
                    issues.append("⚠️ Error Handling: May be missing try/catch (check if async function)")
                if "catch" in content and "{}" in content:
                    issues.append("❌ Error Handling: Empty catch block found")
            
            if rule_type in ["database", "all"]:
                if ".sql" in content.lower() or "sqlite" in content.lower():
                    if "+" in content and "'" in content:  # Simple string concat check
                        issues.append("❌ Database: Potential string-interpolated SQL (use prepared statements)")
            
            if rule_type in ["security", "all"]:
                if "password" in content.lower() or "secret" in content.lower():
                    if "console.log" in content or "log" in content.lower():
                        issues.append("⚠️ Security: Potential logging of secrets/passwords")
            
            if not issues:
                issues.append("✅ No compliance issues found for checked rules")
            
            return [types.TextContent(
                type="text",
                text=f"AGENTS.md Compliance Check for {file_path}:\n\n" + "\n".join(issues)
            )]
            
        except Exception as e:
            return [types.TextContent(
                type="text",
                text=f"Error checking file: {str(e)}"
            )]
    
    else:
        raise ValueError(f"Unknown tool: {name}")

async def main():
    # Run the server using stdin/stdout
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="opencode-minierp",
                server_version="0.1.0",
                capabilities=server.get_capabilities(
                    notification_options=mcp.server.NotificationOptions(),
                    experimental_capabilities={},
                ),
            ),
        )

if __name__ == "__main__":
    asyncio.run(main())