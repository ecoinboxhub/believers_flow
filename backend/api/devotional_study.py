"""
Devotional Study Companion — grounded Bible RAG for the Daily devotional.

The companion is NOT a general chatbot. It answers only about the devotional
currently being viewed, and every answer is grounded in retrieved source
material from trusted, legally reusable resources:

  * King James Version (public domain) — the passage for the devotional.
  * Matthew Henry's Complete Commentary (public domain) — verse commentary.
  * Easton's Bible Dictionary (public domain) — definitions of key terms.
  * The devotional text itself (the reflection and prayer being read).

Retrieval always runs locally and offline. The language model (when available)
summarises the retrieved material; if the LLM is unavailable, a fully grounded
fallback answer is assembled from the retrieved passages so the feature never
depends on an external model being reachable.
"""
import json
import logging
import re
from typing import Dict, List, Optional

from . import bible_kb
from .commentary_service import get_commentary_for_chapter

logger = logging.getLogger("beliversflow.devotional_study")

# Book names may be one word ("John"), an ordinal prefix ("1 Thessalonians"),
# or multi-word ("Song of Solomon").
_VERSE_RE = re.compile(
    r"^\s*(?:([1-3])\s+)?"
    r"([A-Za-z]+(?:\s+[A-Za-z]+){0,2})\s+"
    r"(\d+)\s*[:.]\s*(\d+)"
    r"(?:\s*(?:-|\u2013|\u2014)\s*(\d+))?\s*$"
)

_WORD_RE = re.compile(r"[a-z0-9]+")

_MAX_COMMENTARY_ENTRIES = 3
_MAX_RELATED_VERSE_REFS = 4
_MAX_DICTIONARY_TERMS = 4


def parse_verse_ref(ref: Optional[str]) -> Optional[Dict]:
    """Parse a reference like 'Lamentations 3:22-23' into book/chapter/verses."""
    m = _VERSE_RE.match(ref or "")
    if not m:
        return None
    ordinal, name, chapter, verse_start, verse_end = m.groups()
    book = f"{ordinal} {name}".strip().lower() if ordinal else name.strip().lower()
    start = int(verse_start)
    return {
        "book": book,
        "chapter": int(chapter),
        "verse_start": start,
        "verse_end": int(verse_end) if verse_end else start,
    }


def _salient_terms(text: str, limit: int = 8) -> List[str]:
    """Rank the most distinctive content words in a text."""
    tokens = [t for t in _WORD_RE.findall((text or "").lower()) if t]
    content = [t for t in tokens if t not in bible_kb.COMMON_WORDS]
    freq: Dict[str, int] = {}
    for t in content:
        freq[t] = freq.get(t, 0) + 1
    ranked = sorted(freq.items(), key=lambda kv: (-kv[1], kv[0]))
    return [w for w, _ in ranked[:limit]]


def _passage_text(ref: Dict, verse_text: Optional[str]) -> str:
    """Retrieve the grounded KJV text for the devotional's scripture reference."""
    verses = bible_kb.get_chapter(ref["book"], ref["chapter"]) or []
    if not verses:
        return verse_text or ""
    start, end = ref["verse_start"], ref["verse_end"]
    selected = [v for v in verses if start <= v["verse"] <= end]
    if not selected:
        selected = verses[:end]
    return "\n".join(f"{v['verse']}. {v['text']}" for v in selected)


async def _commentary_snippets(ref: Dict, devotion: Dict, limit: int = _MAX_COMMENTARY_ENTRIES) -> List[Dict]:
    """Pull public-domain Matthew Henry notes for the passage's chapter."""
    try:
        data = await get_commentary_for_chapter("matthew-henry", ref["book"], ref["chapter"])
    except Exception as e:
        logger.warning(f"Commentary retrieval failed for {ref['book']} {ref['chapter']}: {e}")
        return []
    if not data:
        return []
    start, end = ref["verse_start"], ref["verse_end"]

    def _overlaps(entry) -> bool:
        vr = entry.get("verse_range")
        if vr in (None, "intro"):
            return False
        m = re.match(r"^(\d+)(?:\s*-\s*(\d+))?$", str(vr).strip())
        if not m:
            return False
        e_start = int(m.group(1))
        e_end = int(m.group(2)) if m.group(2) else e_start
        return e_start <= end and e_end >= start

    matched = [e for e in data["entries"] if _overlaps(e)]
    if not matched:
        matched = [e for e in data["entries"] if e.get("verse_range") not in (None, "intro")]
    if not matched:
        matched = data["entries"]
    return [
        {
            "reference": e.get("reference", ""),
            "text": (e.get("text") or "")[:1200],
        }
        for e in matched[:limit]
        if (e.get("text") or "").strip()
    ]


def _related_passages(devotion: Dict, ref: Dict, limit: int = _MAX_RELATED_VERSE_REFS) -> List[Dict]:
    """Find related scriptures via the concordance over the public-domain KJV."""
    hay = " ".join(
        filter(None, [devotion.get("title", ""), devotion.get("text", ""), devotion.get("verse_text", "")])
    )
    terms = _salient_terms(hay, limit=10)
    query = " ".join(terms[:6])
    if not query:
        return []
    try:
        matches = bible_kb.search_concordance(query, limit=limit + 4)
    except Exception as e:
        logger.warning(f"Concordance retrieval failed: {e}")
        return []
    seen = set()
    results = []
    salient = set(_salient_terms(hay, limit=12))
    for m in matches:
        key = m.get("reference", "")
        if key in seen:
            continue
        if m.get("book", "").lower() == ref["book"] and m.get("chapter") == ref["chapter"]:
            continue
        mtext = (m.get("text", "") or "").lower()
        if salient and not salient.intersection(set(_WORD_RE.findall(mtext))):
            continue
        seen.add(key)
        results.append({"reference": key, "text": m.get("text", "")})
        if len(results) >= limit:
            break
    return results


def _key_terms(devotion: Dict, limit: int = _MAX_DICTIONARY_TERMS) -> List[Dict]:
    """Look up distinctive words in Easton's Bible Dictionary."""
    hay = " ".join(
        filter(None, [devotion.get("title", ""), devotion.get("text", ""), devotion.get("verse_text", "")])
    )
    terms = _salient_terms(hay, limit=16)
    results = []
    seen = set()
    for t in terms:
        if t in seen:
            continue
        seen.add(t)
        try:
            hits = bible_kb.dictionary_search(t, limit=1)
        except Exception:
            hits = []
        if hits:
            results.append(
                {
                    "term": hits[0].get("term", t),
                    "definition": (hits[0].get("definition", "") or "")[:700],
                }
            )
            if len(results) >= limit:
                break
    return results


async def build_study_context(devotion: Dict) -> Dict:
    """Retrieve the full grounded context bundle for a devotional."""
    ref = parse_verse_ref(devotion.get("verse"))
    passage = ""
    if ref:
        passage = _passage_text(ref, devotion.get("verse_text"))
    return {
        "reference": devotion.get("verse", ""),
        "passage": passage,
        "commentary": await _commentary_snippets(ref, devotion) if ref else [],
        "related_passages": _related_passages(devotion, ref) if ref else [],
        "key_terms": _key_terms(devotion),
        "sources": [
            "King James Version (public domain)",
            "Matthew Henry's Complete Commentary (public domain)",
            "Easton's Bible Dictionary (public domain)",
        ],
    }


def _overview_from_context(devotion: Dict, ctx: Dict) -> Dict:
    """Build a grounded study overview without the language model."""
    body = devotion.get("text", "").strip()
    paragraphs = [p.strip() for p in body.split("\n\n") if p.strip()]
    summary = paragraphs[0] if paragraphs else ""
    application_paragraphs = paragraphs[1:]
    application = application_paragraphs[-1] if application_paragraphs else ""
    reflection = application_paragraphs[0] if application_paragraphs else ""

    meaning = ""
    if ctx.get("commentary"):
        meaning = ctx["commentary"][0]["text"]

    return {
        "reference": devotion.get("verse", ""),
        "title": devotion.get("title", ""),
        "summary": summary,
        "meaning": meaning,
        "application": application,
        "reflection": reflection,
        "prayer": (devotion.get("prayer", "") or "").strip(),
        "key_scriptures": [
            {"reference": ctx.get("reference", ""), "text": ctx.get("passage", "").strip()},
            *ctx.get("related_passages", []),
        ],
        "key_terms": ctx.get("key_terms", []),
        "sources": ctx.get("sources", []),
    }


def _grounded_prompt(devotion: Dict, ctx: Dict, question: str) -> str:
    lines = []
    lines.append("You are a concise, Scripture-grounded Bible study companion.")
    lines.append("Answer ONLY the user's question about the devotional below.")
    lines.append("Stay strictly on-topic: the devotional and the scriptures shown.")
    lines.append("Do not invent verses, authors, dates, or facts.")
    lines.append("When you quote Scripture, quote it exactly and label it as a quote.")
    lines.append("Clearly separate any study explanation from quoted Scripture.")
    lines.append("Do not use emojis or markdown. Use plain English paragraphs.")
    lines.append("Keep the answer to 2-4 short paragraphs unless the question needs more.")
    lines.append("")
    lines.append("=== TODAY'S DEVOTIONAL ===")
    lines.append(f"Title: {devotion.get('title', '')}")
    lines.append(f"Scripture: {devotion.get('verse', '')}")
    lines.append(f"Verse text: {devotion.get('verse_text', '')}")
    if devotion.get("text"):
        lines.append(f"Devotional message:\n{devotion['text']}")
    if devotion.get("prayer"):
        lines.append(f"Prayer:\n{devotion['prayer']}")
    lines.append("")
    lines.append("=== RETRIEVED SOURCE MATERIAL ===")
    if ctx.get("passage"):
        lines.append(f"Scripture passage ({ctx['reference']}):\n{ctx['passage']}")
    if ctx.get("commentary"):
        lines.append("Commentary notes:")
        for e in ctx["commentary"]:
            lines.append(f"[{e.get('reference', '')}] {e.get('text', '')}")
    if ctx.get("related_passages"):
        lines.append("Related scriptures:")
        for p in ctx["related_passages"]:
            lines.append(f"[{p.get('reference', '')}] {p.get('text', '')}")
    if ctx.get("key_terms"):
        lines.append("Dictionary definitions:")
        for t in ctx["key_terms"]:
            lines.append(f"- {t.get('term', '')}: {t.get('definition', '')}")
    lines.append("")
    lines.append("=== USER QUESTION ===")
    lines.append(question)
    return "\n".join(lines)


def _fallback_answer(devotion: Dict, ctx: Dict, question: str) -> Dict:
    """Grounded answer assembled purely from retrieved material (no LLM)."""
    ref = devotion.get("verse", "")
    parts = []
    if ctx.get("passage"):
        parts.append(f"Scripture ({ref}): {ctx['passage']}")
    if ctx.get("commentary"):
        note = ctx["commentary"][0]
        parts.append(f"Study note ({note.get('reference', ref)}): {note.get('text', '')}")
    if ctx.get("related_passages"):
        related = "; ".join(f"{p.get('reference', '')} - {p.get('text', '')}" for p in ctx["related_passages"][:2])
        parts.append(f"Related scriptures: {related}")
    if not parts:
        parts.append(
            "This devotional focuses on the scripture listed above. Read it with the reflection "
            "and prayer, and consider how it applies to your day."
        )
    return {
        "answer": "\n\n".join(parts),
        "ai": False,
        "note": "The study assistant model is currently unavailable, so this answer was compiled "
        "directly from the retrieved Bible text and commentary.",
        "references": [
            {"reference": ref, "text": ctx.get("passage", "").strip()},
            *ctx.get("related_passages", []),
        ],
    }


async def answer_question(devotion: Dict, question: str, provider: str = "groq") -> Dict:
    """Answer a user question about the current devotional, grounded in RAG."""
    ctx = await build_study_context(devotion)
    if not question or not question.strip():
        return {
            "answer": "",
            "ai": False,
            "overview": _overview_from_context(devotion, ctx),
            "context": ctx,
        }

    from api.llm_provider import call_llm

    system = (
        "You are a focused Bible study companion for the devotional currently being viewed. "
        "Ground every answer in the retrieved source material provided. Do not answer from "
        "general knowledge when the material is sufficient. Never invent citations."
    )
    prompt = _grounded_prompt(devotion, ctx, question.strip())
    try:
        answer = await call_llm(system, prompt, provider=provider, temperature=0.4, max_tokens=700)
        references = [
            {"reference": devotion.get("verse", ""), "text": ctx.get("passage", "").strip()},
            *ctx.get("related_passages", []),
        ]
        return {
            "answer": (answer or "").strip(),
            "ai": True,
            "references": [r for r in references if r.get("text")],
            "context": ctx,
        }
    except Exception as e:
        logger.warning(f"Devotional study LLM failed ({provider}), using grounded fallback: {e}")
        fallback = _fallback_answer(devotion, ctx, question)
        fallback["context"] = ctx
        return fallback
