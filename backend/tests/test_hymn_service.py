"""Tests for Hymn Service and API endpoints."""
import pytest
from api.hymn_service import (
    search_hymns, get_hymn_suggestions, get_metadata, get_categories_with_counts,
    match_hymn, _normalize, _levenshtein_distance, _sequence_ratio,
)


# --- Fuzzy matching tests ---

def test_normalize():
    assert _normalize("Amazing Grace!") == "amazing grace"
    assert _normalize("  Hello   World  ") == "hello world"
    assert _normalize("Psalm 23:1") == "psalm 231"


def test_levenshtein_distance():
    assert _levenshtein_distance("kitten", "sitting") == 3
    assert _levenshtein_distance("hello", "hello") == 0
    assert _levenshtein_distance("", "abc") == 3


def test_sequence_ratio():
    assert _sequence_ratio("amazing grace", "amazing grace") == 1.0
    assert _sequence_ratio("amazing", "amazing grace") > 0.5
    assert _sequence_ratio("hello", "world") < 0.5


def test_match_hymn_exact_title():
    hymn = {"id": 1, "title": "Amazing Grace", "author": "John Newton", "lyrics": "Amazing grace! how sweet the sound"}
    assert match_hymn("Amazing Grace", hymn) == 1.0


def test_match_hymn_number():
    hymn = {"id": 1, "title": "Amazing Grace", "author": "John Newton", "lyrics": ""}
    assert match_hymn("1", hymn) >= 0.99


def test_match_hymn_partial_title():
    hymn = {"id": 1, "title": "Amazing Grace", "author": "John Newton", "lyrics": ""}
    score = match_hymn("amazing", hymn)
    assert score >= 0.7


def test_match_hymn_author():
    hymn = {"id": 1, "title": "Amazing Grace", "author": "John Newton", "lyrics": ""}
    score = match_hymn("Newton", hymn)
    assert score >= 0.5


def test_match_hymn_no_match():
    hymn = {"id": 1, "title": "Amazing Grace", "author": "John Newton", "lyrics": ""}
    score = match_hymn("xyz123", hymn)
    assert score < 0.2


# --- Search tests ---

SAMPLE_HYMNS = [
    {"id": 1, "title": "Amazing Grace", "author": "John Newton", "category": "Salvation", "lyrics": "Amazing grace! how sweet the sound"},
    {"id": 2, "title": "The Lord Is My Shepherd", "author": "Psalm 23", "category": "Psalms", "lyrics": "The Lord is my shepherd"},
    {"id": 3, "title": "Holy, Holy, Holy", "author": "Reginald Heber", "category": "Worship", "lyrics": "Holy, holy, holy! Lord God Almighty"},
    {"id": 4, "title": "All People That on Earth Do Dwell", "author": "Psalm 100", "category": "Psalms", "lyrics": "All people that on earth do dwell"},
    {"id": 5, "title": "Pass Me Not", "author": "Fanny Crosby", "category": "Prayer", "lyrics": "Pass me not, O gentle Savior"},
]


def test_search_exact_match():
    results = search_hymns("Amazing Grace", SAMPLE_HYMNS)
    assert len(results) > 0
    h, score = results[0]
    assert h["id"] == 1


def test_search_number():
    results = search_hymns("1", SAMPLE_HYMNS)
    assert len(results) > 0
    h, score = results[0]
    assert h["id"] == 1


def test_search_author():
    results = search_hymns("Crosby", SAMPLE_HYMNS)
    assert len(results) > 0
    assert any(h["id"] == 5 for h, s in results)


def test_search_category():
    results = search_hymns("prayer", SAMPLE_HYMNS)
    assert len(results) > 0
    assert any(h["category"] == "Prayer" for h, s in results)


def test_search_no_results():
    results = search_hymns("zzzznonexistent", SAMPLE_HYMNS)
    assert len(results) == 0


def test_search_empty_query():
    results = search_hymns("", SAMPLE_HYMNS)
    assert len(results) == len(SAMPLE_HYMNS)


# --- Suggestions tests ---

def test_suggestions_basic():
    results = get_hymn_suggestions("amaz", SAMPLE_HYMNS, limit=3)
    assert len(results) <= 3
    assert results[0]["id"] == 1


def test_suggestions_short_query():
    results = get_hymn_suggestions("a", SAMPLE_HYMNS, limit=5)
    assert results == []


def test_suggestions_include_metadata():
    results = get_hymn_suggestions("grace", SAMPLE_HYMNS, limit=1)
    assert "id" in results[0]
    assert "title" in results[0]
    assert "author" in results[0]


# --- Metadata tests ---

def test_get_metadata_known():
    meta = get_metadata(1)
    assert "meter" in meta
    assert "scripture" in meta
    assert meta["year"] == 1779


def test_get_metadata_unknown():
    meta = get_metadata(99999)
    assert meta == {}


# --- Categories tests ---

def test_get_categories():
    cats = get_categories_with_counts(SAMPLE_HYMNS)
    assert len(cats) > 0
    names = [c["name"] for c in cats]
    assert "Salvation" in names
    assert "Psalms" in names


def test_get_categories_counts():
    cats = get_categories_with_counts(SAMPLE_HYMNS)
    psalms = next(c for c in cats if c["name"] == "Psalms")
    assert psalms["count"] == 2


# --- API endpoint tests ---

@pytest.mark.asyncio
async def test_hymn_search_endpoint():
    from httpx import AsyncClient, ASGITransport
    from api.index import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/hymns/search", params={"q": "amazing"})
        assert resp.status_code == 200
        data = resp.json()
        assert "results" in data
        assert data["total"] >= 1


@pytest.mark.asyncio
async def test_hymn_suggest_endpoint():
    from httpx import AsyncClient, ASGITransport
    from api.index import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/hymns/suggest", params={"q": "grace"})
        assert resp.status_code == 200
        data = resp.json()
        assert "suggestions" in data


@pytest.mark.asyncio
async def test_hymn_categories_endpoint():
    from httpx import AsyncClient, ASGITransport
    from api.index import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/hymns/categories")
        assert resp.status_code == 200
        data = resp.json()
        assert "categories" in data


@pytest.mark.asyncio
async def test_hymn_metadata_endpoint():
    from httpx import AsyncClient, ASGITransport
    from api.index import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/hymns/1/metadata")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == 1
        assert "metadata" in data


@pytest.mark.asyncio
async def test_hymn_match_endpoint():
    from httpx import AsyncClient, ASGITransport
    from api.index import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post("/api/hymns/match", json={"query": "Amazing Grace", "hymn_id": 1})
        assert resp.status_code == 200
        data = resp.json()
        assert data["confidence"] == 1.0


@pytest.mark.asyncio
async def test_hymn_stats_endpoint():
    from httpx import AsyncClient, ASGITransport
    from api.index import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/hymns/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert "total_hymns" in data
        assert data["total_hymns"] >= 1000
