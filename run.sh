#!/bin/bash

echo "===================================="
echo "Starting Mini ERP System..."
echo "===================================="
echo ""

# ── Port check helper ─────────────────────────────────────
check_port() {
  local port=$1
  local pid_info
  pid_info=$(lsof -ti :"$port" 2>/dev/null)
  if [ -n "$pid_info" ]; then
    echo "  ⚠  Port $port is in use by:"
    while IFS= read -r pid; do
      if [ -n "$pid" ]; then
        local cmd user
        cmd=$(ps -p "$pid" -o comm= 2>/dev/null || echo "unknown")
        user=$(ps -p "$pid" -o user= 2>/dev/null || echo "unknown")
        local args
        args=$(ps -p "$pid" -o args= 2>/dev/null | head -c 200 || echo "unknown")
        echo "     PID: $pid  User: $user  Cmd: $cmd"
        echo "     Args: $args"
        echo ""
      fi
    done <<< "$pid_info"
    return 0
  fi
  return 1
}

kill_port_with_confirmation() {
  local port=$1
  if check_port "$port"; then
    read -r -p "  Kill process(es) on port $port? (y/N): " confirm
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
      echo "  → Killing process(es) on port $port..."
      fuser -k "$port/tcp" > /dev/null 2>&1 || true
      sleep 1
    else
      echo "  → Skipped. Port $port will remain in use."
    fi
  fi
}

echo "[0/2] Checking ports 3010 and 3011..."
echo ""
kill_port_with_confirmation 3010
kill_port_with_confirmation 3011
echo ""

echo "[1/2] Starting Backend Server..."
cd server
npm start &
BACKEND_PID=$!
sleep 3

echo "[2/2] Starting Frontend..."
cd ../client
npm run dev &
FRONTEND_PID=$!
sleep 2

echo ""
echo "===================================="
echo "Mini ERP Started Successfully!"
echo "===================================="
echo "Backend:  http://localhost:3011"
echo "Frontend: http://localhost:3010"
echo "===================================="
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
