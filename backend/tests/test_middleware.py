import os
import sys
import asyncio

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))


async def _options_origin(client, origin, path="/api/chat"):
    import httpx
    try:
        resp = await client.options(
            path,
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        )
    except httpx.HTTPError:
        return None
    return resp.status_code


def test_cors_preflight_allows_app_webview_origins():
    from api.index import app
    from httpx import AsyncClient, ASGITransport

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            for origin in ("https://localhost", "http://localhost", "capacitor://localhost", "ionic://localhost"):
                assert await _options_origin(client, origin) == 204, f"expected 204 for {origin}"

    asyncio.get_event_loop().run_until_complete(_test())


def test_cors_preflight_allows_production_web_origin():
    from api.index import app
    from httpx import AsyncClient, ASGITransport

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            assert await _options_origin(client, "https://believers-flow-frontend.vercel.app") == 204

    asyncio.get_event_loop().run_until_complete(_test())


def test_cors_preflight_rejects_unknown_origin():
    from api.index import app
    from httpx import AsyncClient, ASGITransport

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            assert await _options_origin(client, "https://evil.example.com") == 403
            assert await _options_origin(client, "https://localhost.evil.com") == 403

    asyncio.get_event_loop().run_until_complete(_test())


def test_cors_header_present_on_actual_response_for_app_origin():
    from api.index import app
    from httpx import AsyncClient, ASGITransport

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get(
                "/api/health",
                headers={"Origin": "https://localhost"},
            )
            assert resp.headers.get("access-control-allow-origin") == "https://localhost"

    asyncio.get_event_loop().run_until_complete(_test())
