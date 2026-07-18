"""
Hebrew/Greek Interlinear Bible Service — AI-powered OT (Hebrew) and NT (Greek) analysis.
"""
import os
import logging
import json
import re
from typing import Optional, List, Dict

import httpx
from fastapi import HTTPException

logger = logging.getLogger("beliversflow.interlinear")

BIBLE_API_BASE = "https://bible-api.com"

OT_BOOKS = {
    "genesis", "exodus", "leviticus", "numbers", "deuteronomy",
    "joshua", "judges", "ruth", "1 samuel", "2 samuel", "1 kings",
    "2 kings", "1 chronicles", "2 chronicles", "ezra", "nehemiah",
    "esther", "job", "psalms", "proverbs", "ecclesiastes",
    "song of solomon", "isaiah", "jeremiah", "lamentations",
    "ezekiel", "daniel", "hosea", "joel", "amos", "obadiah",
    "jonah", "micah", "nahum", "habakkuk", "zephaniah", "haggai",
    "zechariah", "malachi",
}


def _is_ot(book: str) -> bool:
    return book.lower().strip() in OT_BOOKS


async def get_interlinear_verse(
    book: str,
    chapter: int,
    verse: int,
    version: str = "KJV",
) -> dict:
    book_lower = book.lower().strip()
    language = "hebrew" if _is_ot(book_lower) else "greek"

    english_text = await _fetch_verse_text(book_lower, chapter, verse, version)
    interlinear_words = await _fetch_interlinear(book_lower, chapter, verse, language)

    return {
        "reference": f"{book} {chapter}:{verse}",
        "version": version,
        "language": language,
        "english_text": english_text,
        "words": interlinear_words,
    }


async def get_interlinear_chapter(
    book: str,
    chapter: int,
    version: str = "KJV",
) -> dict:
    book_lower = book.lower().strip()
    language = "hebrew" if _is_ot(book_lower) else "greek"

    url = f"{BIBLE_API_BASE}/{book_lower.replace(' ', '+')}+{chapter}"
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        data = resp.json()

    verses = []
    for v in data.get("verses", []):
        interlinear = await _fetch_interlinear(book_lower, chapter, v["verse"], language)
        verses.append({
            "verse": v["verse"],
            "text": v["text"],
            "words": interlinear,
        })

    return {
        "reference": f"{book} {chapter}",
        "version": version,
        "language": language,
        "verses": verses,
    }


async def _fetch_verse_text(book: str, chapter: int, verse: int, version: str) -> str:
    url = f"{BIBLE_API_BASE}/{book.replace(' ', '+')}+{chapter}:{verse}"
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        data = resp.json()
    for v in data.get("verses", []):
        if v.get("verse") == verse:
            return v.get("text", "")
    return ""


async def _fetch_interlinear(book: str, chapter: int, verse: int, language: str) -> List[Dict]:
    """Fetch interlinear word data using curated data + AI fallback for any verse."""
    curated = _get_curated_interlinear(book, chapter, verse, language)
    if curated:
        return curated

    return await _generate_interlinear_ai(book, chapter, verse, language)


def _get_curated_interlinear(book: str, chapter: int, verse: int, language: str) -> Optional[List[Dict]]:
    greek_interlinear = {
        "john": {
            (1, 1): [
                {"word": "Ἐν", "transliteration": "En", "strong": "G1722", "meaning": "in, on, among", "parsing": "Preposition"},
                {"word": "ἀρχῇ", "transliteration": "archē", "strong": "G746", "meaning": "beginning, origin", "parsing": "Noun, Dative Feminine Singular"},
                {"word": "ἦν", "transliteration": "ēn", "strong": "G2252", "meaning": "was, existed", "parsing": "Verb, Imperfect Active Indicative 3rd Singular"},
                {"word": "ὁ", "transliteration": "ho", "strong": "G3588", "meaning": "the", "parsing": "Article, Nominative Masculine Singular"},
                {"word": "λόγος", "transliteration": "logos", "strong": "G3056", "meaning": "word, reason, message", "parsing": "Noun, Nominative Masculine Singular"},
                {"word": "καὶ", "transliteration": "kai", "strong": "G2532", "meaning": "and, also, even", "parsing": "Conjunction"},
                {"word": "θεόν", "transliteration": "theon", "strong": "G2316", "meaning": "God", "parsing": "Noun, Accusative Masculine Singular"},
                {"word": "θεὸς", "transliteration": "theos", "strong": "G2316", "meaning": "God", "parsing": "Noun, Nominative Masculine Singular"},
                {"word": "πρὸς", "transliteration": "pros", "strong": "G4314", "meaning": "to, toward, with", "parsing": "Preposition"},
            ],
            (1, 14): [
                {"word": "σὰρξ", "transliteration": "sarx", "strong": "G4561", "meaning": "flesh, body, human nature", "parsing": "Noun, Nominative Feminine Singular"},
                {"word": "ἐγένετο", "transliteration": "egeneto", "strong": "G1096", "meaning": "became, came to be", "parsing": "Verb, Aorist Middle Deponent Indicative 3rd Singular"},
                {"word": "ἐσκήνωσεν", "transliteration": "eskēnōsen", "strong": "G4637", "meaning": "dwelt, tabernacled among", "parsing": "Verb, Aorist Active Indicative 3rd Singular"},
                {"word": "δόξαν", "transliteration": "doxan", "strong": "G1391", "meaning": "glory, splendor", "parsing": "Noun, Accusative Feminine Singular"},
            ],
        },
        "romans": {
            (8, 28): [
                {"word": "οἴδαμεν", "transliteration": "oidamen", "strong": "G1492", "meaning": "we know", "parsing": "Verb, Perfect Active Indicative 1st Plural"},
                {"word": "ἀγαπῶσιν", "transliteration": "agapōsin", "strong": "G25", "meaning": "loving, who love", "parsing": "Verb, Present Active Participle Dative Plural"},
                {"word": "συνεργεῖ", "transliteration": "synergei", "strong": "G4903", "meaning": "works together", "parsing": "Verb, Present Active Indicative 3rd Singular"},
                {"word": "εἰς", "transliteration": "eis", "strong": "G1519", "meaning": "to, for, unto", "parsing": "Preposition"},
                {"word": "ἀγαθόν", "transliteration": "agathon", "strong": "G18", "meaning": "good", "parsing": "Adjective, Accusative Neuter Singular"},
            ],
        },
    }

    hebrew_interlinear = {
        "genesis": {
            (1, 1): [
                {"word": "בְּרֵאשִׁית", "transliteration": "bereshit", "strong": "H7225", "meaning": "in the beginning", "parsing": "Preposition + Noun"},
                {"word": "בָּרָא", "transliteration": "bara", "strong": "H1254", "meaning": "created", "parsing": "Verb, Qal Perfect 3rd Masculine Singular"},
                {"word": "אֱלֹהִים", "transliteration": "elohim", "strong": "H430", "meaning": "God", "parsing": "Noun, Masculine Plural"},
                {"word": "הַשָּׁמַיִם", "transliteration": "hashamayim", "strong": "H8064", "meaning": "the heavens", "parsing": "Article + Noun, Masculine Plural"},
                {"word": "הָאָרֶץ", "transliteration": "haaretz", "strong": "H776", "meaning": "the earth", "parsing": "Article + Noun, Feminine Singular"},
            ],
        },
    }

    book_lower = book.lower()
    verse_key = (chapter, verse)

    if language == "greek" and book_lower in greek_interlinear:
        if verse_key in greek_interlinear[book_lower]:
            return greek_interlinear[book_lower][verse_key]

    if language == "hebrew" and book_lower in hebrew_interlinear:
        if verse_key in hebrew_interlinear[book_lower]:
            return hebrew_interlinear[book_lower][verse_key]

    return None


async def _generate_interlinear_ai(book: str, chapter: int, verse: int, language: str) -> List[Dict]:
    """Generate interlinear word analysis using AI."""
    try:
        from api.llm_provider import call_llm

        verse_text = await _fetch_verse_text(book, chapter, verse, "KJV")

        lang_name = "Biblical Hebrew" if language == "hebrew" else "Koine Greek"
        system = (
            f"You are a Bible scholar specializing in {lang_name} word analysis. "
            "For each word in the verse, provide: "
            "the original language word, transliteration, Strong's number, meaning, and grammatical parsing. "
            "Respond ONLY with a valid JSON array of objects. "
            "Each object must have keys: word, transliteration, strong, meaning, parsing. "
            f"Use 'H' prefix for Strong's numbers in Hebrew, 'G' prefix for Greek. "
            "Do NOT include any text outside the JSON array."
        )

        prompt = (
            f"Analyze the words in this Bible verse word by word.\n\n"
            f"Book: {book.title()}\nChapter: {chapter}\nVerse: {verse}\n"
            f"Language: {lang_name}\n"
            f"Verse text: {verse_text}\n\n"
            f"Provide interlinear data as a JSON array of word objects. "
            f"Include at least 3-15 words depending on the verse length."
        )

        response = await call_llm(system, prompt, temperature=0.3)

        json_match = re.search(r'\[.*\]', response, re.DOTALL)
        if json_match:
            words = json.loads(json_match.group())
            if isinstance(words, list) and len(words) > 0:
                return words

        logger.warning(f"AI returned invalid interlinear JSON for {book} {chapter}:{verse}")
    except Exception as e:
        logger.error(f"AI interlinear generation failed: {e}")

    return [
        {
            "word": "(Analysis unavailable)",
            "transliteration": "",
            "strong": "",
            "meaning": f"Interlinear analysis for {book} {chapter}:{verse} could not be generated",
            "parsing": "Please try again later",
        }
    ]
