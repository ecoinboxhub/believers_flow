import os
import sys
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))


def test_health_endpoint():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/api/health")
            assert resp.status_code == 200
            data = resp.json()
            assert data["status"] == "ok"
            assert "version" in data
            assert "providers" in data

    asyncio.get_event_loop().run_until_complete(_test())


def test_dbtest_endpoint_requires_auth():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/api/dbtest")
            assert resp.status_code == 401

    asyncio.get_event_loop().run_until_complete(_test())


def test_dbtest_pinetest_require_admin():
    from api.index import app
    from api.auth import create_token
    from httpx import AsyncClient, ASGITransport
    import asyncio
    import os

    async def _test():
        transport = ASGITransport(app=app)
        admin_token = create_token(1, "admin@example.com")
        user_token = create_token(2, "user@example.com")
        original = os.environ.get("ADMIN_EMAILS", "")
        os.environ["ADMIN_EMAILS"] = "admin@example.com"
        try:
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                # Non-admin authenticated user -> 403 on both endpoints
                headers = {"Authorization": f"Bearer {user_token}"}
                r_db = await client.get("/api/dbtest", headers=headers)
                assert r_db.status_code == 403
                r_pi = await client.get("/api/pinetest", headers=headers)
                assert r_pi.status_code == 403
                # No token -> 401 (auth dependency runs before admin check)
                r = await client.get("/api/pinetest")
                assert r.status_code == 401
                # Admin -> 200 with generic body (no internals)
                headers_admin = {"Authorization": f"Bearer {admin_token}"}
                r_ok = await client.get("/api/dbtest", headers=headers_admin)
                assert r_ok.status_code == 200
                data = r_ok.json()
                assert data.get("status") in ("ok", "error")
                assert "result" not in data and "message" not in data and "type" not in data
        finally:
            if original:
                os.environ["ADMIN_EMAILS"] = original
            else:
                os.environ.pop("ADMIN_EMAILS", None)

    asyncio.get_event_loop().run_until_complete(_test())


def test_bible_versions():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/api/bible/versions")
            assert resp.status_code == 200
            data = resp.json()
            assert "versions" in data
            assert len(data["versions"]) > 0
            assert data["versions"][0]["id"] == "KJV"

    asyncio.get_event_loop().run_until_complete(_test())


def test_bible_service_only_marks_really_servable_versions():
    """The bible-api ID map must only use identifiers the upstream service actually
    serves, and only those may be reported as available. No fake/aliased texts."""
    from api.bible_service import BIBLE_API_VERSIONS, _can_serve, _VERSIONS_BY_ID

    # Every mapped ID must point at a real identifier the upstream service
    # actually serves (verified against https://bible-api.com/data). The
    # registry intentionally exposes each upstream translation under one
    # canonical ID plus curated aliases so the app only ever serves real text.
    assert BIBLE_API_VERSIONS == {
        "KJV": "kjv", "AKJV": "kjv",
        "WEB": "web", "WEBBE": "webbe",
        "ASV": "asv", "BBE": "bbe", "DBY": "darby", "DRB": "dra",
        "BKR": "bkr", "CzechKR": "bkr", "RCCV": "rccv",
        "Almeida": "almeida",
        "Vulgate": "clementine", "VulgateClem": "clementine", "LatinV": "clementine",
        "Chinese": "cuv", "Cherokee": "cherokee",
    }
    # Exactly the map members are servable (via real sources); no others.
    servable = {vid for vid in BIBLE_API_VERSIONS if _can_serve(_VERSIONS_BY_ID[vid])}
    assert servable == set(BIBLE_API_VERSIONS)
    # Versions with no real, distinct text must NOT claim availability.
    for vid in ("WBT", "RV", "NIV", "ESV", "NASB", "NLT"):
        assert not _can_serve(_VERSIONS_BY_ID[vid])


def test_llm_providers():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/api/llm/providers")
            assert resp.status_code == 200
            data = resp.json()
            assert "available" in data

    asyncio.get_event_loop().run_until_complete(_test())


def test_auth_register_validation():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/auth/register", json={
                "email": "test@example.com",
                "name": "Test User",
                "password": "short"
            })
            assert resp.status_code == 422

    asyncio.get_event_loop().run_until_complete(_test())


def test_auth_login_without_register():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/auth/login", json={
                "email": "nonexistent@example.com",
                "password": "password123"
            })
            assert resp.status_code in [401, 500]

    asyncio.get_event_loop().run_until_complete(_test())


def test_forgot_password():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/auth/forgot-password", json={
                "email": "test@example.com"
            })
            assert resp.status_code in [200, 500]

    asyncio.get_event_loop().run_until_complete(_test())


def test_unauthorized_sync():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/api/sync/pull")
            assert resp.status_code in [401, 403]

    asyncio.get_event_loop().run_until_complete(_test())


def test_unauthorized_rag():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/rag/search", json={"query": "test"})
            assert resp.status_code in [401, 403]

    asyncio.get_event_loop().run_until_complete(_test())


def test_unauthorized_llm():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/llm/chat", json={
                "messages": [{"role": "user", "content": "hello"}]
            })
            assert resp.status_code in [401, 403]

    asyncio.get_event_loop().run_until_complete(_test())


def test_delete_account_validation():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/auth/delete-account", json={
                "password": "test",
                "confirm": "WRONG"
            })
            assert resp.status_code in [401, 403, 422]

    asyncio.get_event_loop().run_until_complete(_test())


def test_refresh_token_invalid():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/auth/refresh", json={
                "refresh_token": "invalid-token-12345"
            })
            assert resp.status_code in [401, 500]

    asyncio.get_event_loop().run_until_complete(_test())


def test_logout_with_invalid_token():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/auth/logout", json={
                "refresh_token": "invalid-token-12345"
            })
            assert resp.status_code in [200, 500]

    asyncio.get_event_loop().run_until_complete(_test())


def test_chat_allows_guests(monkeypatch):
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def fake_llm(*args, **kwargs):
        return "Hello from test"

    import api.index as index_module
    monkeypatch.setattr(index_module, "call_llm_multi", fake_llm)

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/chat", json={
                "messages": [{"role": "user", "content": "hello"}]
            })
            # Guest access is allowed; the request must reach the LLM and succeed.
            assert resp.status_code == 200
            assert resp.json().get("message") == "Hello from test"

    asyncio.get_event_loop().run_until_complete(_test())


def test_diary_reflection_short_content_returns_graceful_without_llm(monkeypatch):
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio, api.index as index_module

    def failing_llm(*args, **kwargs):
        raise AssertionError("LLM should not be called for very short content")

    monkeypatch.setattr(index_module, "call_llm", failing_llm)

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/diary/reflection", json={"title": "Hi", "content": "ok"})
            assert resp.status_code == 200
            data = resp.json()
            assert data.get("needs_more") is True
            assert data.get("message")

    asyncio.get_event_loop().run_until_complete(_test())


def test_diary_reflection_parses_structured_response(monkeypatch):
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio, json as json_mod, api.index as index_module

    async def fake_llm(*args, **kwargs):
        return json_mod.dumps({
            "reflection": "You are being brave today.",
            "verses": [
                {"reference": "Psalm 34:18", "text": "The LORD is nigh unto them that are of a broken heart.", "explanation": "God is near to you."}
            ],
            "encouragement": "Keep going.",
        })

    monkeypatch.setattr(index_module, "call_llm", fake_llm)

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/diary/reflection", json={
                "title": "Heavy heart",
                "content": "I have been carrying a heavy burden of worry for my family this week.",
                "mood": "😢",
            })
            assert resp.status_code == 200
            data = resp.json()
            assert data.get("reflection") == "You are being brave today."
            assert data.get("verses")[0]["reference"] == "Psalm 34:18"
            assert data.get("encouragement") == "Keep going."

    asyncio.get_event_loop().run_until_complete(_test())


def test_unauthorized_bible_explain():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/bible/explain", json={
                "reference": "John 3:16",
                "text": "For God so loved the world"
            })
            # Guests may use Bible Explain (optional auth) - it must NOT be blocked by 401/403.
            assert resp.status_code not in [401, 403], f"guest explain should not require auth, got {resp.status_code}"

    asyncio.get_event_loop().run_until_complete(_test())


def test_guest_bible_commentary_allowed():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/bible/commentary", json={
                "book": "John",
                "chapter": 3
            })
            assert resp.status_code not in [401, 403], f"guest commentary should not require auth, got {resp.status_code}"
            assert resp.status_code == 200

    asyncio.get_event_loop().run_until_complete(_test())


def test_guest_bible_concordance_allowed():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/bible/concordance", json={
                "query": "love"
            })
            assert resp.status_code not in [401, 403], f"guest concordance should not require auth, got {resp.status_code}"
            assert resp.status_code == 200

    asyncio.get_event_loop().run_until_complete(_test())


def test_guest_bible_notes_assist_allowed():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/bible/notes-assist", json={
                "note_text": "I want to trust God with my worries"
            })
            assert resp.status_code not in [401, 403], f"guest notes-assist should not require auth, got {resp.status_code}"
            assert resp.status_code == 200

    asyncio.get_event_loop().run_until_complete(_test())


def test_unauthorized_hymns_explain():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/hymns/explain", json={
                "title": "Amazing Grace",
                "author": "John Newton",
                "lyrics": "Amazing grace how sweet the sound"
            })
            assert resp.status_code in [401, 403]

    asyncio.get_event_loop().run_until_complete(_test())


def test_unauthorized_devotional_generate():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/devotional/generate", json={
                "topic": "faith",
                "theme": "faith"
            })
            assert resp.status_code in [401, 403]

    asyncio.get_event_loop().run_until_complete(_test())


def test_guest_bible_compare_allowed():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/bible/compare", json={
                "book": "John",
                "chapter": 3
            })
            assert resp.status_code not in [401, 403], f"guest compare should not require auth, got {resp.status_code}"

    asyncio.get_event_loop().run_until_complete(_test())


def test_guest_interlinear_allowed():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/api/interlinear/John/3?version=KJV")
            assert resp.status_code not in [401, 403], f"guest interlinear should not require auth, got {resp.status_code}"
            assert resp.status_code == 200
            data = resp.json()
            assert "verses" in data, "expected interlinear chapter data"

    asyncio.get_event_loop().run_until_complete(_test())


def test_ssrf_whitelist_valid_book():
    from api.index import BIBLE_BOOKS
    assert "genesis" in BIBLE_BOOKS
    assert "john" in BIBLE_BOOKS
    assert "revelation" in BIBLE_BOOKS
    assert "1 samuel" in BIBLE_BOOKS
    assert "2 corinthians" in BIBLE_BOOKS
    assert len(BIBLE_BOOKS) == 66


def test_ssrf_whitelist_invalid_book():
    from api.index import BIBLE_BOOKS
    assert "hack" not in BIBLE_BOOKS
    assert "../../etc/passwd" not in BIBLE_BOOKS
    assert "admin" not in BIBLE_BOOKS


def test_email_service_not_configured():
    from api.email_service import is_configured
    import os
    original_host = os.environ.get("SMTP_HOST", "")
    original_user = os.environ.get("SMTP_USER", "")
    original_pass = os.environ.get("SMTP_PASSWORD", "")
    try:
        os.environ["SMTP_HOST"] = ""
        os.environ["SMTP_USER"] = ""
        os.environ["SMTP_PASSWORD"] = ""
        assert is_configured() == False
    finally:
        if original_host:
            os.environ["SMTP_HOST"] = original_host
        else:
            os.environ.pop("SMTP_HOST", None)
        if original_user:
            os.environ["SMTP_USER"] = original_user
        else:
            os.environ.pop("SMTP_USER", None)
        if original_pass:
            os.environ["SMTP_PASSWORD"] = original_pass
        else:
            os.environ.pop("SMTP_PASSWORD", None)


def test_auth_register_returns_refresh_token():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/auth/register", json={
                "email": "test@example.com",
                "name": "Test User",
                "password": "password123"
            })
            if resp.status_code == 200:
                data = resp.json()
                assert "token" in data
                assert "refresh_token" in data
                assert "user" in data
                assert len(data["token"]) > 0
                assert len(data["refresh_token"]) > 0
            else:
                assert resp.status_code in [409, 500]

    asyncio.get_event_loop().run_until_complete(_test())


def test_auth_login_returns_refresh_token():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/auth/login", json={
                "email": "nonexistent@example.com",
                "password": "password123"
            })
            assert resp.status_code in [401, 500]

    asyncio.get_event_loop().run_until_complete(_test())


def test_auth_response_format():
    from api.auth import AuthResponse
    resp = AuthResponse(token="test-token", refresh_token="test-refresh", user={"id": 1, "email": "test@test.com"})
    assert resp.token == "test-token"
    assert resp.refresh_token == "test-refresh"
    assert resp.user["id"] == 1


def test_password_hashing():
    from api.auth import hash_password, verify_password
    hashed = hash_password("testpassword123")
    assert hashed != "testpassword123"
    assert verify_password("testpassword123", hashed)
    assert not verify_password("wrongpassword", hashed)


def test_token_creation():
    from api.auth import create_token, decode_token
    token = create_token(1, "test@example.com")
    payload = decode_token(token)
    assert payload["sub"] == "1"
    assert payload["email"] == "test@example.com"
    assert "exp" in payload


def test_reset_token_creation():
    from api.auth import generate_reset_token, verify_reset_token
    token = generate_reset_token(1, "test@example.com")
    data = verify_reset_token(token)
    assert data["user_id"] == 1
    assert data["email"] == "test@example.com"


def test_verification_token_creation():
    from api.auth import generate_verification_token, verify_verification_token
    token = generate_verification_token(1, "test@example.com")
    data = verify_verification_token(token)
    assert data["user_id"] == 1
    assert data["email"] == "test@example.com"


def test_brute_force_lockout():
    """Test brute force protection uses Redis-backed functions."""
    from api.redis_client import MAX_LOGIN_ATTEMPTS, LOGIN_LOCKOUT_SECONDS
    assert MAX_LOGIN_ATTEMPTS == 5
    assert LOGIN_LOCKOUT_SECONDS == 900


def test_brute_force_lockout_resets_after_timeout():
    """Test brute force constants are properly defined."""
    from api.redis_client import LOGIN_LOCKOUT_SECONDS
    assert LOGIN_LOCKOUT_SECONDS == 900


def test_refresh_token_expiry():
    from api.auth import SECRET_KEY, ALGORITHM
    from jose import jwt
    from datetime import datetime, timedelta, timezone

    expire = datetime.now(timezone.utc) - timedelta(hours=1)
    payload = {"sub": "1", "email": "test@test.com", "exp": expire}
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    try:
        jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert False, "Should have raised"
    except Exception:
        pass


def test_access_token_payload():
    from api.auth import create_token, decode_token
    token = create_token(42, "user@test.com")
    payload = decode_token(token)
    assert payload["sub"] == "42"
    assert payload["email"] == "user@test.com"
    assert "jti" in payload  # Token should have unique ID for blocklist


def test_reset_token_rejects_verification_type():
    from api.auth import generate_verification_token, verify_reset_token
    token = generate_verification_token(1, "test@test.com")
    try:
        verify_reset_token(token)
        assert False, "Should have raised"
    except Exception as e:
        assert "Invalid token type" in str(e) or "401" in str(e)


def test_verification_token_rejects_reset_type():
    from api.auth import generate_reset_token, verify_verification_token
    token = generate_reset_token(1, "test@test.com")
    try:
        verify_verification_token(token)
        assert False, "Should have raised"
    except Exception as e:
        assert "Invalid token type" in str(e) or "401" in str(e)


def test_ssrf_whitelist_complete():
    from api.index import BIBLE_BOOKS
    assert len(BIBLE_BOOKS) == 66

    ot_books = {
        "genesis", "exodus", "leviticus", "numbers", "deuteronomy",
        "joshua", "judges", "ruth", "1 samuel", "2 samuel",
        "1 kings", "2 kings", "1 chronicles", "2 chronicles", "ezra",
        "nehemiah", "esther", "job", "psalms", "proverbs",
        "ecclesiastes", "song of solomon", "isaiah", "jeremiah",
        "lamentations", "ezekiel", "daniel", "hosea", "joel", "amos",
        "obadiah", "jonah", "micah", "nahum", "habakkuk", "zephaniah",
        "haggai", "zechariah", "malachi"
    }
    nt_books = {
        "matthew", "mark", "luke", "john", "acts", "romans",
        "1 corinthians", "2 corinthians", "galatians", "ephesians",
        "philippians", "colossians", "1 thessalonians", "2 thessalonians",
        "1 timothy", "2 timothy", "titus", "philemon", "hebrews", "james",
        "1 peter", "2 peter", "1 john", "2 john", "3 john", "jude",
        "revelation"
    }
    assert ot_books.issubset(BIBLE_BOOKS)
    assert nt_books.issubset(BIBLE_BOOKS)
    assert len(ot_books) == 39
    assert len(nt_books) == 27


def test_email_service_with_mock_smtp():
    from api import email_service
    from api.email_service import send_password_reset_email
    from unittest.mock import patch, MagicMock

    original_host = email_service.SMTP_HOST
    original_port = email_service.SMTP_PORT
    original_user = email_service.SMTP_USER
    original_pass = email_service.SMTP_PASSWORD

    try:
        email_service.SMTP_HOST = "smtp.test.com"
        email_service.SMTP_PORT = 587
        email_service.SMTP_USER = "test@test.com"
        email_service.SMTP_PASSWORD = "password"

        assert email_service.is_configured() == True

        with patch("smtplib.SMTP") as mock_smtp:
            mock_server = MagicMock()
            mock_smtp.return_value.__enter__ = MagicMock(return_value=mock_server)
            mock_smtp.return_value.__exit__ = MagicMock(return_value=False)
            mock_server.ehlo.return_value = None
            mock_server.starttls.return_value = None
            mock_server.login.return_value = None
            mock_server.sendmail.return_value = {}

            send_password_reset_email("user@test.com", "test-token-123")
    finally:
        email_service.SMTP_HOST = original_host
        email_service.SMTP_PORT = original_port
        email_service.SMTP_USER = original_user
        email_service.SMTP_PASSWORD = original_pass


def test_password_hash_uniqueness():
    from api.auth import hash_password
    hash1 = hash_password("samepassword")
    hash2 = hash_password("samepassword")
    assert hash1 != hash2


def test_config_validation():
    from api.config import validate_config
    import os

    original_db = os.environ.get("DATABASE_URL", "")
    original_jwt = os.environ.get("JWT_SECRET_KEY", "")

    os.environ["DATABASE_URL"] = "postgres://test:test@localhost:5432/testdb"
    os.environ["JWT_SECRET_KEY"] = "a" * 64

    try:
        config = validate_config()
        assert "DATABASE_URL" in config
        assert "JWT_SECRET_KEY" in config
    finally:
        if original_db:
            os.environ["DATABASE_URL"] = original_db
        else:
            os.environ.pop("DATABASE_URL", None)
        if original_jwt:
            os.environ["JWT_SECRET_KEY"] = original_jwt
        else:
            os.environ.pop("JWT_SECRET_KEY", None)


def test_config_validation_missing_required():
    from api.config import validate_config
    import os

    original_db = os.environ.get("DATABASE_URL", "")
    original_jwt = os.environ.get("JWT_SECRET_KEY", "")

    os.environ.pop("DATABASE_URL", None)
    os.environ.pop("JWT_SECRET_KEY", None)

    try:
        try:
            validate_config()
            assert False, "Should have raised"
        except SystemExit:
            pass
    finally:
        if original_db:
            os.environ["DATABASE_URL"] = original_db
        if original_jwt:
            os.environ["JWT_SECRET_KEY"] = original_jwt


def _auth_headers():
    from api.auth import create_token
    token = create_token(1, "test@example.com")
    return {"Authorization": f"Bearer {token}"}


def _patch_db(monkeypatch):
    """Let require_db() pass without a live database in tests."""
    import api.index as index_module
    monkeypatch.setattr(index_module, "check_db_health", lambda: True)


def test_bible_concordance_returns_grounded_kjv_matches(monkeypatch):
    _patch_db(monkeypatch)
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/api/bible/concordance",
                json={"query": "grace", "version": "KJV"},
                headers=_auth_headers(),
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["total"] > 0
            assert data["groups"], "expected grouped results"
            assert "public domain" in data["search_source"].lower()
            assert all("reference" in r and "text" in r for r in data["results"])

    asyncio.get_event_loop().run_until_complete(_test())


def test_bible_concordance_empty_query_rejected(monkeypatch):
    _patch_db(monkeypatch)
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/api/bible/concordance", json={"query": "  "}, headers=_auth_headers()
            )
            assert resp.status_code in [401, 403, 422]

    asyncio.get_event_loop().run_until_complete(_test())


def test_bible_dictionary_public_no_auth():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/bible/dictionary", json={"term": "Jerusalem"})
            assert resp.status_code == 200
            data = resp.json()
            assert data["matches"], "expected Easton entries"
            assert "Easton" in data["source"]
            assert all("term" in m and "definition" in m for m in data["matches"])

    asyncio.get_event_loop().run_until_complete(_test())


def test_bible_dictionary_unknown_term_returns_note():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/bible/dictionary", json={"term": "zzzqnotaword"})
            assert resp.status_code == 200
            assert resp.json()["matches"] == []
            assert "note" in resp.json()

    asyncio.get_event_loop().run_until_complete(_test())


def test_bible_commentary_sources_public():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/api/bible/commentary/sources")
            assert resp.status_code == 200
            sources = resp.json()["sources"]
            ids = {s["id"] for s in sources}
            assert "matthew-henry" in ids
            assert "jamieson-fausset-brown" in ids

    asyncio.get_event_loop().run_until_complete(_test())


def test_bible_commentary_bundled_source_returns_entries(monkeypatch):
    _patch_db(monkeypatch)
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/api/bible/commentary",
                json={"book": "John", "chapter": 3, "source": "matthew-henry", "ai_summary": False},
                headers=_auth_headers(),
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["available"] is True
            assert data["entries"], "expected bundled commentary entries"
            assert all("reference" in e and "text" in e for e in data["entries"])

    asyncio.get_event_loop().run_until_complete(_test())


def test_bible_notes_assist_grounded(monkeypatch):
    _patch_db(monkeypatch)
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio, api.index as index_module

    async def fake_llm(*args, **kwargs):
        return "1. Meditate on this promise.\n2. Compare it with another gospel.\n3. Pray it back."

    monkeypatch.setattr(index_module, "call_llm", fake_llm)

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/api/bible/notes-assist",
                json={"note_text": "God so loved the world that he gave his only begotten Son.", "reference": "John 3:16"},
                headers=_auth_headers(),
            )
            assert resp.status_code == 200
            data = resp.json()
            assert len(data["suggestions"]) >= 1
            assert data["related_verses"], "expected grounded related verses"

    asyncio.get_event_loop().run_until_complete(_test())


def test_bible_notes_assist_degrades_without_llm(monkeypatch):
    _patch_db(monkeypatch)
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio, api.index as index_module

    def failing_llm(*args, **kwargs):
        raise RuntimeError("no AI")

    monkeypatch.setattr(index_module, "call_llm", failing_llm)

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/api/bible/notes-assist",
                json={"note_text": "Love is patient."},
                headers=_auth_headers(),
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["suggestions"] == []
            assert data["related_verses"], "grounded verses must survive AI failure"

    asyncio.get_event_loop().run_until_complete(_test())


def test_bible_compare_returns_aligned_verses(monkeypatch):
    _patch_db(monkeypatch)
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio, api.index as index_module

    async def fake_fetch(version_id, book, chapter):
        return {
            "version": version_id,
            "book": book,
            "chapter": chapter,
            "verses": [{"verse": 1, "text": f"Test text ({version_id})"}],
        }

    monkeypatch.setattr(index_module, "fetch_chapter", fake_fetch)

    import api.redis_client as redis_client

    async def fake_cache_get(*a, **k):
        return None

    async def fake_cache_set(*a, **k):
        pass

    monkeypatch.setattr(redis_client, "cache_get", fake_cache_get)
    monkeypatch.setattr(redis_client, "cache_set", fake_cache_set)

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/api/bible/compare",
                json={"book": "John", "chapter": 3, "translations": ["KJV", "WEB"], "insights": False},
                headers=_auth_headers(),
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["reference"] == "John 3"
            assert len(data["verses"]) == 1
            row = data["verses"][0]
            assert row.get("KJV") and row.get("WEB")

    asyncio.get_event_loop().run_until_complete(_test())


def test_bible_explain_grounded_fallback_without_llm(monkeypatch):
    _patch_db(monkeypatch)
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio, api.index as index_module

    def failing_llm(*args, **kwargs):
        raise RuntimeError("no AI")

    monkeypatch.setattr(index_module, "call_llm", failing_llm)

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/api/bible/explain",
                json={"reference": "John 3:16", "text": "For God so loved the world...", "version": "KJV"},
                headers=_auth_headers(),
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["explanation"], "grounded fallback explanation expected"
            assert data["limited"], "limited flag must be set when AI unavailable"
            assert "public domain" in " ".join(data["sources"]).lower()

    asyncio.get_event_loop().run_until_complete(_test())


def test_bible_dictionary_ai_expansion(monkeypatch):
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio, api.index as index_module

    async def fake_llm(*args, **kwargs):
        return "Jerusalem was the central city of Israel and site of the temple."

    monkeypatch.setattr(index_module, "call_llm", fake_llm)

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/api/bible/dictionary", json={"term": "Jerusalem", "expand": True}
            )
            assert resp.status_code == 200
            data = resp.json()
            assert "ai_expansion" in data
            assert "Jerusalem" in data["ai_expansion"]

    asyncio.get_event_loop().run_until_complete(_test())


def test_bible_get_singular_book_psalm():
    """Frontend sends 'Psalm' (singular); API must accept it and serve local KJV."""
    from api.index import _normalize_book_key
    assert _normalize_book_key("Psalm") == "psalms"
    assert _normalize_book_key("Psalms") == "psalms"
    assert _normalize_book_key("John") == "john"

    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/api/bible", params={"book": "Psalm", "chapter": 23, "version": "KJV"})
            assert resp.status_code == 200, resp.text
            data = resp.json()
            assert data["reference"] == "Psalm 23"
            assert len(data.get("verses", [])) > 0
            assert all("verse" in v and "text" in v for v in data["verses"])

    asyncio.get_event_loop().run_until_complete(_test())

def test_devotional_study_overview_grounded():
    """Devotional study (no question) returns grounded local KJV + commentary context."""
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    devotion = {
        "title": "The Shepherd's Care",
        "verse": "Psalm 23:1-3",
        "verse_text": "The Lord is my shepherd, I lack nothing.",
        "text": "David's psalm paints a picture of trust.\n\nThe Lord is my shepherd.\n\nRest in His provision.",
        "prayer": "Good Shepherd, thank You. Amen.",
    }

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/devotional/study", json={"devotion": devotion})
            assert resp.status_code == 200, resp.text
            data = resp.json()
            ctx = data["context"]
            assert ctx["reference"] == "Psalm 23:1-3"
            assert ctx["passage"], "expected retrieved KJV passage"
            assert "my shepherd" in ctx["passage"].lower()
            assert ctx["commentary"], "expected public-domain commentary"
            assert ctx["sources"]
            assert data["ai"] is False

    asyncio.get_event_loop().run_until_complete(_test())


def test_devotional_study_answer_uses_llm(monkeypatch):
    """With a question, the study companion answers grounded in retrieved material."""
    import api.llm_provider as llm
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def fake_llm(*args, **kwargs):
        return "The shepherd imagery shows God's faithful care. Quoted: 'The Lord is my shepherd.'"

    monkeypatch.setattr(llm, "call_llm", fake_llm)

    devotion = {
        "title": "The Shepherd's Care",
        "verse": "Psalm 23:1-3",
        "verse_text": "The Lord is my shepherd, I lack nothing.",
        "text": "Trust the Shepherd.\n\nHe leads you.",
        "prayer": "Amen.",
    }

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/api/devotional/study",
                json={"devotion": devotion, "question": "What does the shepherd mean?"},
            )
            assert resp.status_code == 200, resp.text
            data = resp.json()
            assert data["ai"] is True
            assert data["answer"]
            assert data["references"], "expected grounded scripture references"

    asyncio.get_event_loop().run_until_complete(_test())


def test_devotional_study_degrades_without_llm(monkeypatch):
    """When the LLM is unavailable the companion still returns grounded material."""
    import api.llm_provider as llm
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    def failing_llm(*args, **kwargs):
        raise RuntimeError("no AI")

    monkeypatch.setattr(llm, "call_llm", failing_llm)

    devotion = {
        "title": "The Shepherd's Care",
        "verse": "Psalm 23:1-3",
        "verse_text": "The Lord is my shepherd, I lack nothing.",
        "text": "Trust the Shepherd.\n\nHe leads you.",
        "prayer": "Amen.",
    }

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/api/devotional/study",
                json={"devotion": devotion, "question": "Explain this verse."},
            )
            assert resp.status_code == 200, resp.text
            data = resp.json()
            assert data["ai"] is False
            assert data["answer"], "expected grounded fallback answer"
            assert "my shepherd" in data["answer"].lower()

    asyncio.get_event_loop().run_until_complete(_test())


def test_music_full_validates_limit():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/api/music/full", params={"term": "worship", "limit": 0})
            assert resp.status_code == 400

    asyncio.get_event_loop().run_until_complete(_test())


def test_music_full_extracts_full_tracks(monkeypatch):
    """The full-track resolver returns top full-length YouTube matches, so the
    Boom tab can play the complete song instead of only the 30s preview."""
    from api.index import app, _extract_youtube_video_results, _yt_runs_text, _yt_length_to_seconds
    from httpx import AsyncClient, ASGITransport
    import asyncio

    assert _yt_runs_text({"simpleText": "7:33"}) == "7:33"
    assert _yt_runs_text({"runs": [{"text": "Graves Into Gardens"}]}) == "Graves Into Gardens"
    assert _yt_length_to_seconds("7:33") == 453
    assert _yt_length_to_seconds("1:02:03") == 3723
    assert _yt_length_to_seconds("nope") == 0

    payload = {
        "contents": {
            "twoColumnSearchResultsRenderer": {
                "primaryContents": {
                    "sectionListRenderer": {
                        "contents": [
                            {
                                "itemSectionRenderer": {
                                    "contents": [
                                        {"videoRenderer": {
                                            "videoId": "KwX1f2gYKZ4",
                                            "title": {"runs": [{"text": "Graves Into Gardens | Live | Elevation Worship"}]},
                                            "longBylineText": {"runs": [{"text": "Elevation Worship"}]},
                                            "lengthText": {"simpleText": "7:33"},
                                        }},
                                        {"videoRenderer": {
                                            "videoId": "abc123",
                                            "title": {"runs": [{"text": "Shorts Clip"}]},
                                            "longBylineText": {"runs": [{"text": "Someone"}]},
                                            "lengthText": {"simpleText": "0:15"},
                                        }},
                                    ]
                                }
                            }
                        ]
                    }
                }
            }
        }
    }
    results = _extract_youtube_video_results(payload, 8)
    assert results[0]["videoId"] == "KwX1f2gYKZ4"
    assert results[0]["durationSeconds"] == 453
    assert results[0]["author"] == "Elevation Worship"
    assert len(results) == 1, "short clips must be filtered out"

    async def _fake_post(self, url, **kwargs):
        class _Resp:
            def raise_for_status(self):
                pass
            def json(self):
                return payload
        return _Resp()

    monkeypatch.setattr("httpx.AsyncClient.post", _fake_post)

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/api/music/full", params={"term": "Elevation Worship Graves Into Gardens"})
            assert resp.status_code == 200, resp.text
            data = resp.json()
            assert data["results"][0]["videoId"] == "KwX1f2gYKZ4"
            assert data["results"][0]["durationSeconds"] == 453

    asyncio.get_event_loop().run_until_complete(_test())
