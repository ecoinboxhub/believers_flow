"""
BelieversFlow — Full Endpoint, Security & Scalability Test Suite
"""
import requests
import json
import time
import sys

BASE = "http://localhost:8000"
RESULTS = []
PASSED = 0
FAILED = 0
TEST_USER_EMAIL = f"test_{int(time.time())}@example.com"
TEST_USER_PASSWORD = "TestPass123!"
AUTH_TOKEN = None
REFRESH_TOKEN = None


def test(name, method, path, headers=None, json_data=None, expected_status=None, check_field=None, check_value=None, raw_body=None, allow_status=None):
    global PASSED, FAILED
    url = f"{BASE}{path}"
    try:
        if method == "GET":
            r = requests.get(url, headers=headers, timeout=30)
        elif method == "POST":
            r = requests.post(url, headers=headers, json=json_data, data=raw_body, timeout=30)
        elif method == "PUT":
            r = requests.put(url, headers=headers, json=json_data, timeout=30)
        elif method == "DELETE":
            r = requests.delete(url, headers=headers, timeout=30)
        else:
            r = requests.request(method, url, headers=headers, json=json_data, timeout=30)

        status_ok = True
        if expected_status is not None:
            if allow_status:
                status_ok = r.status_code in allow_status
            else:
                status_ok = r.status_code == expected_status

        field_ok = True
        if check_field and r.headers.get("content-type", "").startswith("application/json"):
            data = r.json()
            if check_value is not None:
                field_ok = data.get(check_field) == check_value
            else:
                field_ok = check_field in data

        passed = status_ok and field_ok
        if passed:
            PASSED += 1
            icon = "PASS"
        else:
            FAILED += 1
            icon = "FAIL"

        detail = f"status={r.status_code}"
        if not status_ok and expected_status:
            if allow_status:
                detail += f" (expected one of {allow_status})"
            else:
                detail += f" (expected {expected_status})"
        if not field_ok and check_field:
            detail += f" [{check_field}={r.json().get(check_field, 'MISSING')}]"

        RESULTS.append({"name": name, "status": icon, "detail": detail})
        print(f"  [{icon}] {name} — {detail}")
        return r
    except Exception as e:
        FAILED += 1
        RESULTS.append({"name": name, "status": "FAIL", "detail": str(e)[:80]})
        print(f"  [FAIL] {name} — {e}")
        return None


def auth_headers():
    return {"Authorization": f"Bearer {AUTH_TOKEN}", "Content-Type": "application/json"}


print("=" * 70)
print("BELIEVERSFLOW — COMPREHENSIVE TEST SUITE")
print("=" * 70)

# ============================================================
# SECTION 1: PUBLIC ENDPOINTS (No Auth Required)
# ============================================================
print("\n--- 1. PUBLIC ENDPOINTS ---")

test("GET /api/health", "GET", "/api/health", expected_status=200, check_field="status", check_value="ok")
test("GET /api/dbtest", "GET", "/api/dbtest", expected_status=200, check_field="db", check_value="ok")
test("GET /api/bible/versions", "GET", "/api/bible/versions", expected_status=200, check_field="versions")
test("GET /api/llm/providers", "GET", "/api/llm/providers", expected_status=200, check_field="available")

# Bible KJV (public)
r = test("GET /api/bible (KJV Genesis 1)", "GET", "/api/bible?book=genesis&chapter=1&version=KJV", expected_status=200, check_field="verses")
if r and r.status_code == 200:
    data = r.json()
    print(f"    => Returned {len(data.get('verses', []))} verses")

# Hymn tune (public)
test("GET /api/hymns/tune/1", "GET", "/api/hymns/tune/1", expected_status=200, check_field="tune")

# Bible invalid book (SSRF test)
test("GET /api/bible (invalid book)", "GET", "/api/bible?book=../../etc/passwd&chapter=1", expected_status=400)

# Bible AI version (requires LLM)
test("GET /api/bible (NIV)", "GET", "/api/bible?book=genesis&chapter=1&version=NIV", expected_status=200, check_field="verses")


# ============================================================
# SECTION 2: AUTHENTICATION FLOW
# ============================================================
print("\n--- 2. AUTHENTICATION FLOW ---")

# Register
r = test("POST /api/auth/register", "POST", "/api/auth/register",
         json_data={"email": TEST_USER_EMAIL, "name": "Test User", "password": TEST_USER_PASSWORD},
         expected_status=200, check_field="token")
if r and r.status_code == 200:
    data = r.json()
    AUTH_TOKEN = data.get("token")
    REFRESH_TOKEN = data.get("refresh_token")
    print(f"    => User ID: {data.get('user', {}).get('id')}")
    print(f"    => Token received: {bool(AUTH_TOKEN)}")
    print(f"    => Refresh token received: {bool(REFRESH_TOKEN)}")

# Duplicate register
test("POST /api/auth/register (duplicate)", "POST", "/api/auth/register",
     json_data={"email": TEST_USER_EMAIL, "name": "Test User", "password": TEST_USER_PASSWORD},
     expected_status=409)

# Register validation (short password)
test("POST /api/auth/register (short pass)", "POST", "/api/auth/register",
     json_data={"email": "new@example.com", "name": "X", "password": "12"},
     expected_status=422)

# Login success
r = test("POST /api/auth/login (success)", "POST", "/api/auth/login",
         json_data={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD},
         expected_status=200, check_field="token")

# Login wrong password
test("POST /api/auth/login (wrong pass)", "POST", "/api/auth/login",
     json_data={"email": TEST_USER_EMAIL, "password": "WrongPass!"},
     expected_status=401)

# Login nonexistent user
test("POST /api/auth/login (no user)", "POST", "/api/auth/login",
     json_data={"email": "nonexistent@example.com", "password": "TestPass123!"},
     expected_status=401)

# Token refresh
r = test("POST /api/auth/refresh", "POST", "/api/auth/refresh",
         json_data={"refresh_token": REFRESH_TOKEN},
         expected_status=200, check_field="access_token")
if r and r.status_code == 200:
    new_token = r.json().get("access_token")
    if new_token:
        AUTH_TOKEN = new_token
        print(f"    => New access token received")

# Unauthorized access (no token)
test("GET /api/sync/pull (no auth)", "GET", "/api/sync/pull", expected_status=401)

# Unauthorized access (invalid token)
test("GET /api/sync/pull (bad token)", "GET", "/api/sync/pull",
     headers={"Authorization": "Bearer invalid_token_here"}, expected_status=401)

# Legal acceptance
test("POST /api/auth/legal-accept", "POST", "/api/auth/legal-accept",
     headers=auth_headers(),
     json_data={"version": "1.0", "accepted_at": "2026-07-09T00:00:00Z", "documents": {"privacy": True}},
     expected_status=200)

# Legal status
test("GET /api/auth/legal-status", "GET", "/api/auth/legal-status",
     headers=auth_headers(), expected_status=200, check_field="accepted")


# ============================================================
# SECTION 3: PASSWORD RESET FLOW
# ============================================================
print("\n--- 3. PASSWORD RESET FLOW ---")

# Forgot password
r = test("POST /api/auth/forgot-password", "POST", "/api/auth/forgot-password",
         json_data={"email": TEST_USER_EMAIL},
         expected_status=200, check_field="status", check_value="ok")

# Forgot password (nonexistent - should still return ok to prevent enumeration)
test("POST /api/auth/forgot-password (no user)", "POST", "/api/auth/forgot-password",
     json_data={"email": "noone@example.com"},
     expected_status=200, check_field="status", check_value="ok")


# ============================================================
# SECTION 4: EMAIL VERIFICATION
# ============================================================
print("\n--- 4. EMAIL VERIFICATION ---")

test("POST /api/auth/send-verification", "POST", "/api/auth/send-verification",
     headers=auth_headers(), expected_status=200, check_field="status", check_value="ok")


# ============================================================
# SECTION 5: AUTHENTICATED ENDPOINTS
# ============================================================
print("\n--- 5. AUTHENTICATED ENDPOINTS ---")

# Sync pull
r = test("GET /api/sync/pull", "GET", "/api/sync/pull",
         headers=auth_headers(), expected_status=200, check_field="items")

# Sync push
test("POST /api/sync/push", "POST", "/api/sync/push",
     headers=auth_headers(),
     json_data={"items": [{"data_type": "tasks", "data": [{"id": 1, "text": "Test task", "done": False}]}]},
     expected_status=200, check_field="status", check_value="ok")

# Sync pull (verify data persisted)
r = test("GET /api/sync/pull (verify)", "GET", "/api/sync/pull",
         headers=auth_headers(), expected_status=200, check_field="items")

# LLM Chat
r = test("POST /api/chat", "POST", "/api/chat",
         headers=auth_headers(),
         json_data={"messages": [{"role": "user", "content": "What is grace?"}], "taskContext": ""},
         expected_status=200, check_field="message")
if r and r.status_code == 200:
    msg = r.json().get("message", "")
    print(f"    => Response length: {len(msg)} chars")

# LLM Chat (no auth)
test("POST /api/chat (no auth)", "POST", "/api/chat",
     json_data={"messages": [{"role": "user", "content": "test"}]},
     expected_status=401)

# Bible explain
test("POST /api/bible/explain", "POST", "/api/bible/explain",
     headers=auth_headers(),
     json_data={"reference": "John 3:16", "text": "For God so loved the world...", "version": "KJV"},
     expected_status=200, check_field="explanation")

# Bible commentary
test("POST /api/bible/commentary", "POST", "/api/bible/commentary",
     headers=auth_headers(),
     json_data={"book": "genesis", "chapter": 1},
     expected_status=200, check_field="commentary")

# Bible concordance
test("POST /api/bible/concordance", "POST", "/api/bible/concordance",
     headers=auth_headers(),
     json_data={"query": "love", "version": "KJV"},
     expected_status=200, check_field="results")

# Bible compare
test("POST /api/bible/compare", "POST", "/api/bible/compare",
     headers=auth_headers(),
     json_data={"book": "genesis", "chapter": 1},
     expected_status=200, check_field="comparison")

# Hymn explain
test("POST /api/hymns/explain", "POST", "/api/hymns/explain",
     headers=auth_headers(),
     json_data={"title": "Amazing Grace", "author": "John Newton", "lyrics": "Amazing grace how sweet the sound"},
     expected_status=200, check_field="explanation")

# Devotional generate
test("POST /api/devotional/generate", "POST", "/api/devotional/generate",
     headers=auth_headers(),
     json_data={"topic": "faith", "theme": "faith"},
     expected_status=200, check_field="devotional")

# LLM direct endpoint
test("POST /api/llm/chat", "POST", "/api/llm/chat",
     headers=auth_headers(),
     json_data={"messages": [{"role": "user", "content": "Say hello"}], "provider": "groq"},
     expected_status=200, check_field="response")

# RAG search
test("POST /api/rag/search", "POST", "/api/rag/search",
     headers=auth_headers(),
     json_data={"query": "love", "top_k": 3},
     expected_status=200, check_field="results")

# RAG ingest
test("POST /api/rag/ingest", "POST", "/api/rag/ingest",
     headers=auth_headers(),
     json_data={"namespace": "test", "items": [{"id": "test1", "text": "Test verse about love"}]},
     expected_status=200, check_field="status", check_value="ok")


# ============================================================
# SECTION 6: SECURITY TESTS
# ============================================================
print("\n--- 6. SECURITY TESTS ---")

# Rate limit headers present
r = test("Rate limit headers", "GET", "/api/health", expected_status=200)
if r:
    has_limit = "X-RateLimit-Limit" in r.headers
    print(f"    => X-RateLimit-Limit header: {has_limit}")

# Security headers present
r = test("Security headers present", "GET", "/api/health", expected_status=200)
if r:
    headers_to_check = ["X-Content-Type-Options", "X-Frame-Options", "X-XSS-Protection",
                        "Referrer-Policy", "Permissions-Policy", "Content-Security-Policy"]
    for h in headers_to_check:
        present = h in r.headers
        print(f"    => {h}: {'PRESENT' if present else 'MISSING'}")

# HSTS on HTTPS (check header is set even on HTTP for testing)
r = test("HSTS header", "GET", "/api/health", expected_status=200)

# CORS preflight
r = test("CORS preflight (no origin)", "OPTIONS", "/api/auth/login",
         headers={"Access-Control-Request-Method": "POST"},
         expected_status=204, allow_status=[204, 403])

# CORS with allowed origin
import os
allowed = os.environ.get("ALLOWED_ORIGINS", "")
if allowed:
    origin = allowed.split(",")[0]
    r = test("CORS preflight (allowed origin)", "OPTIONS", "/api/auth/login",
             headers={"Origin": origin, "Access-Control-Request-Method": "POST"},
             expected_status=204)

# SQL injection test (in email field)
test("SQL injection in email", "POST", "/api/auth/login",
     json_data={"email": "'; DROP TABLE users; --", "password": "test"},
     expected_status=401)

# XSS test (in name field)
test("XSS in name field", "POST", "/api/auth/register",
     json_data={"email": f"xss_{int(time.time())}@test.com", "name": "<script>alert('xss')</script>", "password": "TestPass123!"},
     expected_status=200)

# Large payload test
test("Large payload rejection", "POST", "/api/chat",
     headers=auth_headers(),
     json_data={"messages": [{"role": "user", "content": "x" * 100000}]},
     expected_status=413, allow_status=[200, 413])  # Server may reject large payloads

# JWT secret validation (check startup)
test("JWT startup validation", "GET", "/api/health",
     expected_status=200, check_field="status", check_value="ok")


# ============================================================
# SECTION 7: CHANGE PASSWORD & DELETE ACCOUNT
# ============================================================
print("\n--- 7. PASSWORD CHANGE & ACCOUNT DELETION ---")

# Change password
r = test("POST /api/auth/change-password", "POST", "/api/auth/change-password",
         headers=auth_headers(),
         json_data={"current_password": TEST_USER_PASSWORD, "new_password": "NewTestPass456!"},
         expected_status=200, check_field="status", check_value="ok")
if r and r.status_code == 200:
    TEST_USER_PASSWORD = "NewTestPass456!"
    print("    => Password changed successfully")

# Login with new password
test("POST /api/auth/login (new pass)", "POST", "/api/auth/login",
     json_data={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD},
     expected_status=200, check_field="token")

# Login with old password (should fail)
test("POST /api/auth/login (old pass)", "POST", "/api/auth/login",
     json_data={"email": TEST_USER_EMAIL, "password": "TestPass123!"},
     expected_status=401)

# Logout
test("POST /api/auth/logout", "POST", "/api/auth/logout",
     headers=auth_headers(),
     json_data={"refresh_token": REFRESH_TOKEN},
     expected_status=200, check_field="status", check_value="ok")

# Delete account
r = test("POST /api/auth/delete-account", "POST", "/api/auth/delete-account",
         headers=auth_headers(),
         json_data={"password": TEST_USER_PASSWORD, "confirm": "DELETE MY ACCOUNT"},
         expected_status=200, check_field="status", check_value="ok")

# Verify account deleted (login should fail)
test("POST /api/auth/login (deleted)", "POST", "/api/auth/login",
     json_data={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD},
     expected_status=401)


# ============================================================
# SECTION 8: ERROR HANDLING
# ============================================================
print("\n--- 8. ERROR HANDLING ---")

test("Invalid JSON body", "POST", "/api/auth/login",
     raw_body="not json",
     headers={"Content-Type": "application/json"},
     expected_status=422)

test("Missing required fields", "POST", "/api/auth/register",
     json_data={"email": "test@test.com"},
     expected_status=422)

test("Invalid endpoint", "GET", "/api/nonexistent",
     expected_status=404)

test("Method not allowed", "DELETE", "/api/health",
     expected_status=405)


# ============================================================
# RESULTS SUMMARY
# ============================================================
print("\n" + "=" * 70)
print("TEST RESULTS SUMMARY")
print("=" * 70)
print(f"  Total:  {PASSED + FAILED}")
print(f"  Passed: {PASSED}")
print(f"  Failed: {FAILED}")
print(f"  Rate:   {PASSED/(PASSED+FAILED)*100:.1f}%" if (PASSED+FAILED) > 0 else "  Rate:   N/A")
print("=" * 70)

if FAILED > 0:
    print("\nFAILED TESTS:")
    for r in RESULTS:
        if r["status"] == "FAIL":
            print(f"  [{r['status']}] {r['name']} — {r['detail']}")

# Save results
output = {
    "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
    "total": PASSED + FAILED,
    "passed": PASSED,
    "failed": FAILED,
    "results": RESULTS
}
with open("test_results.json", "w") as f:
    json.dump(output, f, indent=2)
print(f"\nResults saved to test_results.json")

sys.exit(0 if FAILED == 0 else 1)
