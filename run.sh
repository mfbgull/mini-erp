#!/bin/bash

echo "===================================="
echo "Starting Mini ERP System..."
echo "===================================="
echo ""

echo "[0/2] Cleaning up ports 3010 and 3011..."
fuser -k 3010/tcp 3011/tcp > /dev/null 2>&1 || true
sleep 1

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
