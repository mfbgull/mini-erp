#!/bin/bash
# Script to start the Opencode MCP server for MiniERP

# Activate the virtual environment
source /home/fawad/ai/minierp/venv-mcp/bin/activate

# Start the MCP server
echo "Starting Opencode MCP server for MiniERP..."
echo "Server will be available via stdio for MCP clients like Opencode"
echo "To connect in Opencode, use:"
echo "  mcp add opencode-minierp -- $HOME/fawad/ai/minierp/venv-mcp/bin/python $HOME/fawad/ai/minierp/opencode_mcp_server.py"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Run the server
python /home/fawad/ai/minierp/opencode_mcp_server.py