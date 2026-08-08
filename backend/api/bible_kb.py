"""
Bible Knowledge Base — offline public-domain Scripture, dictionary, and RAG retrieval.

This module provides:
  * Local KJV store (public domain) for reading + grounding.
  * Word concordance index over the KJV for fast keyword search.
  * Easton's Bible Dictionary (public domain) lookups.
  * Retrieval helpers used to ground AI Bible features (Explain, Concordance,
    Dictionary, Notes) in retrieved source material.
"""
import json
import logging
import os
import re
import threading
from typing import Dict, List, Optional, Tuple

logger = logging.getLogger("beliversflow.bible_kb")

_BASE_DIR = os.path.join(os.path.dirname(__file__), "..")
_KJV_PATH = os.path.join(_BASE_DIR, "bible_texts", "kjv.json")
_EASTON_PATH = os.path.join(_BASE_DIR, "bible_kb", "easton.json")

_lock = threading.RLock()
_kjv: Optional[Dict] = None
_word_index: Optional[Dict[str, List[Tuple[str, int, int]]]] = None
_easton: Optional[List[Dict]] = None

# Lightweight synonym map for concordance "where appropriate" support.
_SYNONYMS = {
    "savior": "saviour",
    "color": "colour",
    "honor": "honour",
    "favor": "favour",
    "neighbor": "neighbour",
    "center": "centre",
    "theater": "theatre",
}

_WORD_RE = re.compile(r"[a-z0-9]+")
_BOOK_ORDER = [
    "genesis", "exodus", "leviticus", "numbers", "deuteronomy", "joshua", "judges", "ruth",
    "1 samuel", "2 samuel", "1 kings", "2 kings", "1 chronicles", "2 chronicles", "ezra",
    "nehemiah", "esther", "job", "psalm", "proverbs", "ecclesiastes", "song of solomon",
    "isaiah", "jeremiah", "lamentations", "ezekiel", "daniel", "hosea", "joel", "amos",
    "obadiah", "jonah", "micah", "nahum", "habakkuk", "zephaniah", "haggai", "zechariah",
    "malachi", "matthew", "mark", "luke", "john", "acts", "romans", "1 corinthians",
    "2 corinthians", "galatians", "ephesians", "philippians", "colossians", "1 thessalonians",
    "2 thessalonians", "1 timothy", "2 timothy", "titus", "philemon", "hebrews", "james",
    "1 peter", "2 peter", "1 john", "2 john", "3 john", "jude", "revelation",
]
_BOOK_RANK = {name: i for i, name in enumerate(_BOOK_ORDER)}

COMMON_WORDS = {
    "a", "an", "the", "and", "or", "but", "of", "to", "in", "on", "at", "for", "with",
    "by", "from", "up", "down", "into", "unto", "upon", "it", "is", "was", "were", "be",
    "been", "being", "as", "that", "this", "these", "those", "he", "she", "they", "them",
    "his", "her", "their", "our", "your", "my", "we", "you", "him", "i", "not", "all",
    "will", "shall", "should", "would", "can", "could", "may", "might", "there", "their",
    "have", "has", "had", "do", "does", "did", "so", "then", "than", "which", "who",
    "whom", "whose", "what", "when", "where", "why", "how", "if", "because", "also",
    "even", "yet", "still", "no", "yes", "one", "two", "again", "now", "therefore",
    "after", "before", "over", "through", "under", "between", "against", "out", "about",
    "make", "made", "give", "given", "came", "come", "said", "saith", "go", "went",
    "let", "thou", "thy", "thee", "ye", "your", "mine", "me", "us", "them", "god", "lord",
}


def _normalize_word(w: str) -> str:
    w = w.strip().lower()
    return _SYNONYMS.get(w, w)


def _load_kjv() -> Dict:
    global _kjv
    if _kjv is not None:
        return _kjv
    with _lock:
        if _kjv is not None:
            return _kjv
        if not os.path.exists(_KJV_PATH):
            logger.error(f"KJV text not found at {_KJV_PATH}")
            _kjv = {}
        else:
            try:
                with open(_KJV_PATH, "r", encoding="utf-8") as f:
                    _kjv = json.load(f)
                logger.info(f"KJV loaded: {sum(len(c) for c in _kjv.values())} chapters")
            except Exception as e:
                logger.error(f"Failed to load KJV: {e}")
                _kjv = {}
        return _kjv


def _load_easton() -> List[Dict]:
    global _easton
    if _easton is not None:
        return _easton
    with _lock:
        if _easton is not None:
            return _easton
        if not os.path.exists(_EASTON_PATH):
            logger.error(f"Easton's dictionary not found at {_EASTON_PATH}")
            _easton = []
        else:
            try:
                with open(_EASTON_PATH, "r", encoding="utf-8") as f:
                    data = json.load(f)
                _easton = data.get("data", []) if isinstance(data, dict) else data
                logger.info(f"Easton's dictionary loaded: {len(_easton)} entries")
            except Exception as e:
                logger.error(f"Failed to load Easton's dictionary: {e}")
                _easton = []
        return _easton


# ---------------------------------------------------------------------------
# Verse access
# ---------------------------------------------------------------------------

def normalize_book(book: str) -> str:
    b = book.strip().lower()
    # Accept common alias "psalms" -> "psalm"
    if b == "psalms":
        return "psalm"
    return b


def get_chapter(book: str, chapter: int) -> Optional[List[Dict]]:
    """Return [{verse, text}] for a chapter, or None if unavailable."""
    kb = _load_kjv()
    book_data = kb.get(normalize_book(book))
    if not book_data:
        return None
    verses = book_data.get(str(chapter))
    if not verses:
        return None
    result = []
    for num in sorted(verses.keys(), key=int):
        result.append({"verse": int(num), "text": verses[num]})
    return result or None


def get_verse(book: str, chapter: int, verse: int) -> Optional[str]:
    kb = _load_kjv()
    book_data = kb.get(normalize_book(book))
    if not book_data:
        return None
    return book_data.get(str(chapter), {}).get(str(verse))


def chapter_text(book: str, chapter: int) -> str:
    verses = get_chapter(book, chapter)
    if not verses:
        return ""
    return "\n".join(f"{v['verse']}. {v['text']}" for v in verses)


# ---------------------------------------------------------------------------
# Concordance index
# ---------------------------------------------------------------------------

def _build_word_index() -> Dict[str, List[Tuple[str, int, int]]]:
    global _word_index
    if _word_index is not None:
        return _word_index
    with _lock:
        if _word_index is not None:
            return _word_index
        index: Dict[str, List[Tuple[str, int, int]]] = {}
        kb = _load_kjv()
        for book, book_data in kb.items():
            for ch, verses in book_data.items():
                for v, text in verses.items():
                    for token in _WORD_RE.findall(text.lower()):
                        token = _SYNONYMS.get(token, token)
                        index.setdefault(token, []).append((book, int(ch), int(v)))
        _word_index = index
        logger.info(f"Concordance index built: {len(index)} unique tokens")
        return _word_index


def search_concordance(query: str, limit: int = 40) -> List[Dict]:
    """Real keyword concordance over the bundled public-domain KJV text."""
    tokens = [_normalize_word(t) for t in _WORD_RE.findall(query.lower())]
    tokens = [t for t in tokens if t]
    if not tokens:
        return []

    index = _build_word_index()
    content_tokens = [t for t in tokens if t not in COMMON_WORDS] or tokens

    ref_sets = []
    for t in content_tokens:
        refs = index.get(t, [])
        if refs:
            ref_sets.append(set(refs))
    if not ref_sets:
        return []

    # Intersect all content-token references (AND search), ordered canonically.
    common = set.intersection(*ref_sets)
    if len(common) >= 3:
        candidates = sorted(common, key=lambda r: (_BOOK_RANK.get(r[0], 999), r[1], r[2]))
    else:
        # Too few exact matches: fall back to union (any token) for recall.
        union = set.union(*ref_sets)
        candidates = sorted(union, key=lambda r: (_BOOK_RANK.get(r[0], 999), r[1], r[2]))

    results = []
    kb = _load_kjv()
    for book, ch, v in candidates:
        text = kb.get(book, {}).get(str(ch), {}).get(str(v), "")
        if not text:
            continue
        results.append({
            "book": book.title(),
            "chapter": ch,
            "verse": v,
            "reference": f"{book.title()} {ch}:{v}",
            "text": text,
        })
        if len(results) >= limit:
            break
    return results


# ---------------------------------------------------------------------------
# Dictionary
# ---------------------------------------------------------------------------

def _entry_definition(entry: Dict) -> str:
    blocks = entry.get("definition_blocks") or []
    return "\n\n".join(b for b in blocks if b)


def _entry_refs(entry: Dict) -> List[str]:
    refs = entry.get("scripture_references") or []
    out = []
    for r in refs:
        raw = r.get("raw") if isinstance(r, dict) else str(r)
        if raw:
            out.append(raw)
    return out[:12]


def dictionary_search(term: str, limit: int = 5) -> List[Dict]:
    """Search Easton's Bible Dictionary (public domain) for a term."""
    entries = _load_easton()
    if not entries:
        return []
    q = term.strip().lower()
    if not q:
        return []

    def norm(s: str) -> str:
        return re.sub(r"[^a-z0-9 ]", "", s.lower()).strip()

    qn = norm(q)
    matches: List[Tuple[int, Dict]] = []
    for e in entries:
        t = norm(e.get("term", ""))
        alts = [norm(a) for a in (e.get("alt_terms") or [])]
        if t == qn:
            matches.append((0, e))
        elif qn in alts:
            matches.append((1, e))
    matches.sort(key=lambda x: x[0])
    matched = [e for _, e in matches]

    # Fall back to "starts with" then "contains" matching.
    if len(matched) < limit:
        seen = {id(e) for e in matched}
        for e in entries:
            if id(e) in seen:
                continue
            t = norm(e.get("term", ""))
            if t.startswith(qn):
                matched.append(e)
            if len(matched) >= limit:
                break
        seen = {id(e) for e in matched}
        if len(matched) < limit:
            for e in entries:
                if id(e) in seen:
                    continue
                t = norm(e.get("term", ""))
                if qn in t:
                    matched.append(e)
                if len(matched) >= limit:
                    break

    results = []
    for e in matched[:limit]:
        results.append({
            "term": e.get("term", ""),
            "alt_terms": e.get("alt_terms") or [],
            "definition": _entry_definition(e)[:3000],
            "scripture_references": _entry_refs(e),
            "related_terms": (e.get("related_terms") or [])[:8],
            "source": "Easton's Bible Dictionary (public domain)",
        })
    return results


# ---------------------------------------------------------------------------
# RAG retrieval helpers
# ---------------------------------------------------------------------------

def retrieve_passage_context(book: str, chapter: int, verse: Optional[int] = None, max_terms: int = 6) -> Dict:
    """Gather grounded context for a passage: verse(s), dictionary terms, commentary hook."""
    verses = get_chapter(book, chapter) or []
    passage = ""
    if verse is not None:
        passage = get_verse(book, chapter, verse) or ""
    else:
        passage = chapter_text(book, chapter)[:4000]

    # Extract distinctive content words from the passage for dictionary grounding.
    tokens = [_normalize_word(t) for t in _WORD_RE.findall(passage.lower())]
    content = [t for t in tokens if t and t not in COMMON_WORDS]
    # Rank by frequency; take the most distinctive few.
    freq: Dict[str, int] = {}
    for t in content:
        freq[t] = freq.get(t, 0) + 1
    ranked = sorted(freq.items(), key=lambda kv: (-kv[1], kv[0]))
    terms = []
    for word, _ in ranked[:max_terms]:
        hits = dictionary_search(word, limit=1)
        if hits:
            terms.append(hits[0])
            if len(terms) >= 4:
                break

    return {
        "passage_text": passage,
        "verse_count": len(verses),
        "dictionary_terms": terms,
        "source": "King James Version + Easton's Bible Dictionary (public domain)",
    }


def retrieve_term_context(query: str, max_terms: int = 4) -> Dict:
    """Gather dictionary grounding for a topical/word query."""
    tokens = [_normalize_word(t) for t in _WORD_RE.findall(query.lower())]
    content = [t for t in tokens if t and t not in COMMON_WORDS]
    terms = []
    for t in content[:max_terms]:
        hits = dictionary_search(t, limit=1)
        if hits:
            terms.append(hits[0])
    return {
        "query": query,
        "dictionary_terms": terms,
        "source": "Easton's Bible Dictionary (public domain)",
    }
