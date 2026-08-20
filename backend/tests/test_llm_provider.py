import os
import sys

import httpx
import pytest
from fastapi import HTTPException

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))


def _extract(data):
    from api.llm_provider import _extract_choice_content
    return _extract_choice_content(data)


def _valid(content):
    from api.llm_provider import _valid_content
    return _valid_content(content)


def test_extract_choice_content_returns_string():
    assert _extract({"choices": [{"message": {"content": "Hello there"}}]}) == "Hello there"


def test_extract_choice_content_handles_missing_or_null():
    assert _extract({"choices": [{"message": {"content": None}}]}) is None
    assert _extract({"choices": [{"message": {}}]}) is None
    assert _extract({"choices": []}) is None
    assert _extract({}) is None
    assert _extract(None) is None


def test_valid_content_rejects_blank():
    assert _valid("ok") is True
    assert _valid("  hello  ") is True
    assert _valid("") is False
    assert _valid("   ") is False
    assert _valid(None) is False


def _status_failover_set():
    from api.llm_provider import _FALLOVER_STATUSES
    return _FALLOVER_STATUSES


def test_failover_statuses_include_404():
    assert 404 in _status_failover_set()


def test_friendly_llm_error_404_maps_to_503():
    from fastapi import HTTPException
    from api.llm_provider import _friendly_llm_error
    err = _friendly_llm_error(404)
    assert err.status_code == 503
    assert "GROQ" not in err.detail
    assert "404" not in err.detail


def test_call_llm_multi_all_providers_404_raises_friendly(monkeypatch):
    import httpx
    import asyncio
    import pytest
    import api.llm_provider as mod

    async def fake_get_http_client():
        class FakeClient:
            async def post(self, url, headers=None, json=None):
                request = httpx.Request("POST", url)
                return httpx.Response(404, request=request, headers={"Content-Type": "application/json"})
        return FakeClient()

    monkeypatch.setattr(mod, "_get_http_client", fake_get_http_client)
    monkeypatch.setenv("GROQ_API_KEY", "test-groq-key")
    monkeypatch.setattr(mod, "_failover_order", lambda preferred: ["groq"])

    async def _run():
        with pytest.raises(mod.HTTPException) as excinfo:
            await mod.call_llm_multi([{"role": "user", "content": "hello"}], provider="groq")
        return excinfo.value

    err = asyncio.new_event_loop().run_until_complete(_run())
    assert err.status_code == 503
    assert "API error" not in err.detail
    assert "temporarily unavailable" in err.detail


def test_call_llm_multi_fails_over_404_to_next_provider(monkeypatch):
    import httpx
    import asyncio
    import api.llm_provider as mod

    calls = []

    async def fake_get_http_client():
        class FakeClient:
            async def post(self, url, headers=None, json=None):
                calls.append(url)
                if len(calls) == 1:
                    request = httpx.Request("POST", url)
                    return httpx.Response(404, request=request, headers={"Content-Type": "application/json"})
                return httpx.Response(200, request=httpx.Request("POST", url), json={
                    "choices": [{"message": {"content": "Fallback answer"}}]
                })
        return FakeClient()

    monkeypatch.setattr(mod, "_get_http_client", fake_get_http_client)
    monkeypatch.setenv("GROQ_API_KEY", "test-groq-key")
    monkeypatch.setenv("OPENAI_API_KEY", "test-openai-key")
    monkeypatch.setattr(mod, "_failover_order", lambda preferred: ["groq", "openai"])

    async def _run():
        return await mod.call_llm_multi([{"role": "user", "content": "hello"}], provider="groq")

    result = asyncio.new_event_loop().run_until_complete(_run())
    assert result == "Fallback answer"
    assert len(calls) == 2
