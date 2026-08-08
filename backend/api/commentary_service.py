"""
Commentary Service — multi-source public-domain commentary.

Bundled sources (offline, always available):
  * Matthew Henry's Complete Commentary (CC0/Public Domain) — all books except Song of Solomon.
  * Jamieson, Fausset and Brown Commentary (Public Domain) — all 66 books.

Additional public-domain collections are available through the Open Christian
Data repository (CC0). They are fetched lazily on first access and cached on
disk so subsequent lookups are fast. Only verbatim, publicly licensed text is
ever returned; no commentary is ever fabricated. AI-generated clarifications
are produced separately and always labeled as AI study notes.
"""
import json
import logging
import os
from typing import Dict, List, Optional

logger = logging.getLogger("beliversflow.commentary")

_BASE_DIR = os.path.join(os.path.dirname(__file__), "..")
_BUNDLED_DIR = os.path.join(_BASE_DIR, "bible_commentary")
_CACHE_DIR = os.path.join(_BASE_DIR, "bible_commentary_cache")

_OCD_BASE = "https://raw.githubusercontent.com/OpenChristianData/open-christian-data/main/data/commentaries"

# Book filename convention in the datasets.
_BOOK_NAMES = {
    "genesis", "exodus", "leviticus", "numbers", "deuteronomy", "joshua", "judges", "ruth",
    "1 samuel", "2 samuel", "1 kings", "2 kings", "1 chronicles", "2 chronicles", "ezra",
    "nehemiah", "esther", "job", "psalm", "proverbs", "ecclesiastes", "song of solomon",
    "isaiah", "jeremiah", "lamentations", "ezekiel", "daniel", "hosea", "joel", "amos",
    "obadiah", "jonah", "micah", "nahum", "habakkuk", "zephaniah", "haggai", "zechariah",
    "malachi", "matthew", "mark", "luke", "john", "acts", "romans", "1 corinthians",
    "2 corinthians", "galatians", "ephesians", "philippians", "colossians", "1 thessalonians",
    "2 thessalonians", "1 timothy", "2 timothy", "titus", "philemon", "hebrews", "james",
    "1 peter", "2 peter", "1 john", "2 john", "3 john", "jude", "revelation",
}


def _book_file(book: str) -> str:
    name = book.strip().lower()
    if name == "psalm":
        return "psalms.json"
    return name.replace(" ", "-") + ".json"


COMMENTARY_SOURCES = [
    {
        "id": "matthew-henry",
        "title": "Matthew Henry's Complete Commentary on the Whole Bible",
        "author": "Matthew Henry",
        "year": "1708-1721",
        "license": "Public Domain",
        "bundled": True,
        "slug": "matthew-henry",
        "description": "A classic devotional-expository commentary known for its warmth and practical application.",
    },
    {
        "id": "jamieson-fausset-brown",
        "title": "Commentary Critical and Explanatory on the Whole Bible",
        "author": "Robert Jamieson, A. R. Fausset, David Brown",
        "year": "1871",
        "license": "Public Domain",
        "bundled": True,
        "slug": "jamieson-fausset-brown",
        "description": "A concise, scholarly commentary popular with pastors and students.",
    },
    {
        "id": "adam-clarke",
        "title": "Adam Clarke's Commentary",
        "author": "Adam Clarke",
        "year": "1831",
        "license": "Public Domain",
        "bundled": False,
        "slug": "adam-clarke",
        "description": "An extensive exegetical commentary with detailed notes on language and history.",
    },
    {
        "id": "john-gill",
        "title": "John Gill's Exposition of the Whole Bible",
        "author": "John Gill",
        "year": "1746-1763",
        "license": "Public Domain",
        "bundled": False,
        "slug": "john-gill",
        "description": "A thorough doctrinal exposition in the Calvinist tradition.",
    },
    {
        "id": "keil-delitzsch",
        "title": "Keil and Delitzsch Commentary on the Old Testament",
        "author": "C. F. Keil and F. Delitzsch",
        "year": "1866-1891",
        "license": "Public Domain",
        "bundled": False,
        "slug": "keil-delitzsch",
        "testament": "OT",
        "description": "A scholarly Old Testament commentary emphasizing Hebrew linguistics.",
    },
    {
        "id": "albert-barnes",
        "title": "Albert Barnes' Notes on the Bible",
        "author": "Albert Barnes",
        "year": "1834-1870",
        "license": "Public Domain",
        "bundled": False,
        "slug": "barnes",
        "description": "Practical verse-by-verse notes across both testaments.",
    },
    {
        "id": "wesley",
        "title": "Wesley's Explanatory Notes",
        "author": "John Wesley",
        "year": "1765",
        "license": "Public Domain",
        "bundled": False,
        "slug": "wesley",
        "description": "Concise explanatory notes from the founder of Methodism.",
    },
    {
        "id": "treasury-of-david",
        "title": "The Treasury of David",
        "author": "C. H. Spurgeon",
        "year": "1870-1885",
        "license": "Public Domain",
        "bundled": False,
        "slug": "treasury-of-david",
        "books": ["psalm"],
        "description": "Spurgeon's celebrated exposition of the Book of Psalms.",
    },
    {
        "id": "robertson-word-pictures",
        "title": "Word Pictures in the New Testament",
        "author": "A. T. Robertson",
        "year": "1930-1933",
        "license": "Public Domain",
        "bundled": False,
        "slug": "robertson-word-pictures-vol1",
        "testament": "NT",
        "description": "Greek word studies for New Testament students.",
    },
    {
        "id": "lightfoot-colossians-philemon",
        "title": "St. Paul's Epistles to the Colossians and Philemon",
        "author": "J. B. Lightfoot",
        "year": "1875",
        "license": "Public Domain",
        "bundled": False,
        "slug": "lightfoot-colossians-philemon",
        "books": ["colossians", "philemon"],
        "description": "A scholarly commentary on Colossians and Philemon.",
    },
]

_SOURCES_BY_ID = {s["id"]: s for s in COMMENTARY_SOURCES}


def get_sources() -> List[Dict]:
    return [
        {
            "id": s["id"],
            "title": s["title"],
            "author": s["author"],
            "year": s["year"],
            "license": s["license"],
            "bundled": s["bundled"],
            "description": s.get("description", ""),
        }
        for s in COMMENTARY_SOURCES
    ]


def _cache_path(source_slug: str, book: str) -> str:
    return os.path.join(_CACHE_DIR, source_slug, _book_file(book))


def _load_bundled(source_slug: str, book: str) -> Optional[List[Dict]]:
    path = os.path.join(_BUNDLED_DIR, source_slug, _book_file(book))
    if not os.path.exists(path):
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data.get("data", []) if isinstance(data, dict) else data
    except Exception as e:
        logger.error(f"Failed to load bundled commentary {source_slug}/{book}: {e}")
        return None


async def _load_remote(source_slug: str, book: str) -> Optional[List[Dict]]:
    """Fetch a public-domain commentary book from the OCD repository with disk cache."""
    import httpx
    from urllib.parse import quote

    cache = _cache_path(source_slug, book)
    if os.path.exists(cache):
        try:
            with open(cache, "r", encoding="utf-8") as f:
                data = json.load(f)
            return data.get("data", []) if isinstance(data, dict) else data
        except Exception:
            pass

    url = f"{_OCD_BASE}/{quote(source_slug)}/{_book_file(book)}"
    try:
        async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                logger.info(f"Commentary source {source_slug} has no data for {book}")
                return None
            data = resp.json()
        entries = data.get("data", []) if isinstance(data, dict) else data
        os.makedirs(os.path.dirname(cache), exist_ok=True)
        with open(cache, "w", encoding="utf-8") as f:
            json.dump({"meta": data.get("meta", {}), "data": entries}, f)
        return entries
    except Exception as e:
        logger.warning(f"Remote commentary fetch failed {source_slug}/{book}: {e}")
        return None


async def get_commentary_for_chapter(source_id: str, book: str, chapter: int) -> Optional[Dict]:
    """Return commentary entries for a chapter from the given source (or None)."""
    source = _SOURCES_BY_ID.get(source_id)
    if not source:
        return None

    book_lower = book.strip().lower()
    restricted = source.get("books")
    if restricted and book_lower not in restricted:
        return None

    if source["bundled"]:
        entries = _load_bundled(source["slug"], book_lower)
    else:
        entries = await _load_remote(source["slug"], book_lower)

    if not entries:
        return None

    chapter_entries = []
    for e in entries:
        if e.get("book", "").lower().replace(" ", "-") == book_lower.replace(" ", "-"):
            pass
        # chapter 0 entries are book introductions (verse_range == "intro")
        if isinstance(e.get("chapter"), int) and e["chapter"] == chapter and chapter >= 1:
            chapter_entries.append(e)

    if not chapter_entries:
        return None

    chapter_entries.sort(key=lambda e: _range_sort_key(e.get("verse_range", "")))
    return {
        "source": source,
        "book": book,
        "chapter": chapter,
        "entries": [
            {
                "verse_range": e.get("verse_range"),
                "reference": _entry_reference(e),
                "text": e.get("commentary_text") or "",
                "verse_text": e.get("verse_text") or "",
                "cross_references": e.get("cross_references") or [],
                "word_count": e.get("word_count") or 0,
            }
            for e in chapter_entries
        ],
    }


def _entry_reference(e: Dict) -> str:
    book = e.get("book", "")
    chapter = e.get("chapter")
    vr = e.get("verse_range")
    if vr in (None, "intro"):
        return f"{book} — Introduction"
    return f"{book} {chapter}:{vr}"


def _range_sort_key(vr: str) -> tuple:
    if vr in (None, "intro"):
        return (0, 0)
    try:
        start = int(str(vr).split("-")[0])
        return (1, start)
    except (ValueError, AttributeError):
        return (2, 0)
