#!/bin/bash
# Test authentication endpoints
# Run with: bash scripts/test-auth-endpoints.sh

BASE_URL="${NEXT_PUBLIC_BASE_URL:-http://localhost:3000}"

echo "🧪 Testing Authentication Endpoints..."
echo "Base URL: $BASE_URL"
echo ""

# Test 1: Check OAuth providers endpoint
echo "1. Testing OAuth providers endpoint..."
curl -s "$BASE_URL/api/auth/oauth/providers" | jq '.' || echo "   ⚠️  Server not running or endpoint not accessible"
echo ""

# Test 2: Check session endpoint (should return 401 if not logged in)
echo "2. Testing session endpoint (should be unauthorized)..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/session")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ]; then
    echo "   ✅ Endpoint responds correctly (HTTP $HTTP_CODE)"
else
    echo "   ⚠️  Unexpected response (HTTP $HTTP_CODE)"
fi
echo ""

# Test 3: Check login endpoint exists (should return 400 for missing credentials)
echo "3. Testing login endpoint..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/login" \
  -H "Content-Type: application/json" \
  -d '{}')
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "429" ]; then
    echo "   ✅ Login endpoint responds correctly (HTTP $HTTP_CODE)"
else
    echo "   ⚠️  Unexpected response (HTTP $HTTP_CODE)"
fi
echo ""

# Test 4: Check password reset endpoint
echo "4. Testing password reset endpoint..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/reset-password" \
  -H "Content-Type: application/json" \
  -d '{}')
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "429" ]; then
    echo "   ✅ Password reset endpoint responds correctly (HTTP $HTTP_CODE)"
else
    echo "   ⚠️  Unexpected response (HTTP $HTTP_CODE)"
fi
echo ""

echo "✅ Basic endpoint tests completed!"
echo ""
echo "Note: Start your dev server with 'npm run dev' to test fully"

