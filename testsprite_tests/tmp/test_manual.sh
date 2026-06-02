#!/bin/bash
# Manual API Test Script for Mini ERP
# Run: bash testsprite_tests/tmp/test_manual.sh

BASE_URL="http://localhost:3011"
TOKEN=""
CSRF_TOKEN=""

echo "=== Mini ERP API Tests ==="
echo ""

# Test 1: Health Check
echo "1. Health Check"
curl -s "$BASE_URL/health" | head -100
echo ""

# Test 2: Login
echo "2. Login"
LOGIN_RESPONSE=$(curl -s -c /tmp/cookies.txt -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}')
echo "$LOGIN_RESPONSE" | head -100
echo ""

# Test 3: Get CSRF Token
echo "3. Get CSRF Token"
CSRF_RESPONSE=$(curl -s -b /tmp/cookies.txt "$BASE_URL/api/inventory/items" \
  -c /tmp/cookies.txt)
CSRF_TOKEN=$(grep -o 'csrf-token=[^;]*' /tmp/cookies.txt | cut -d= -f2)
echo "CSRF Token: $CSRF_TOKEN"
echo ""

# Test 4: Get Items
echo "4. Get Items"
curl -s -b /tmp/cookies.txt "$BASE_URL/api/inventory/items" | head -200
echo ""

# Test 5: Get Customers
echo "5. Get Customers"
curl -s -b /tmp/cookies.txt "$BASE_URL/api/customers" | head -200
echo ""

# Test 6: Get Dashboard
echo "6. Get Dashboard"
curl -s -b /tmp/cookies.txt "$BASE_URL/api/dashboard/summary" | head -200
echo ""

echo "=== Tests Complete ==="
