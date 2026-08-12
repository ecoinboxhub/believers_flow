"""
Hebrew/Greek Interlinear Bible Service — word-by-word analysis from a curated
set of well-known key verses. No AI generation: only real, hand-checked data is
served so the feature is fast and never hangs. Verses without curated data are
reported clearly as unavailable.
"""
import logging
from typing import Optional, List, Dict

import httpx

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


GREEK_INTERLINEAR = {
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
        (3, 16): [
            {"word": "Οὕτως", "transliteration": "Houtōs", "strong": "G3779", "meaning": "so, thus, in this way", "parsing": "Adverb"},
            {"word": "ἠγάπησεν", "transliteration": "ēgapēsen", "strong": "G25", "meaning": "loved", "parsing": "Verb, Aorist Active Indicative 3rd Singular"},
            {"word": "ὁ", "transliteration": "ho", "strong": "G3588", "meaning": "the", "parsing": "Article, Nominative Masculine Singular"},
            {"word": "θεὸς", "transliteration": "theos", "strong": "G2316", "meaning": "God", "parsing": "Noun, Nominative Masculine Singular"},
            {"word": "τὸν", "transliteration": "ton", "strong": "G3588", "meaning": "the", "parsing": "Article, Accusative Masculine Singular"},
            {"word": "κόσμον", "transliteration": "kosmon", "strong": "G2889", "meaning": "world", "parsing": "Noun, Accusative Masculine Singular"},
            {"word": "υἱὸν", "transliteration": "huion", "strong": "G5207", "meaning": "son", "parsing": "Noun, Accusative Masculine Singular"},
            {"word": "μονογενῆ", "transliteration": "monogenē", "strong": "G3439", "meaning": "only begotten, unique", "parsing": "Adjective, Accusative Masculine Singular"},
            {"word": "πιστεύων", "transliteration": "pisteuōn", "strong": "G4100", "meaning": "believing, who believes", "parsing": "Verb, Present Active Participle Nominative Masculine Singular"},
            {"word": "ἀπόληται", "transliteration": "apolētai", "strong": "G622", "meaning": "perish, be destroyed", "parsing": "Verb, Aorist Middle Subjunctive 3rd Singular"},
            {"word": "αἰώνιον", "transliteration": "aiōnion", "strong": "G166", "meaning": "eternal, everlasting", "parsing": "Adjective, Accusative Feminine Singular"},
            {"word": "ζωήν", "transliteration": "zōēn", "strong": "G2222", "meaning": "life", "parsing": "Noun, Accusative Feminine Singular"},
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
        (3, 23): [
            {"word": "πάντες", "transliteration": "pantes", "strong": "G3956", "meaning": "all", "parsing": "Adjective, Nominative Masculine Plural"},
            {"word": "ἥμαρτον", "transliteration": "hēmarton", "strong": "G264", "meaning": "sinned", "parsing": "Verb, Aorist Active Indicative 3rd Plural"},
            {"word": "ὑστεροῦνται", "transliteration": "hysterountai", "strong": "G5302", "meaning": "fall short, lack", "parsing": "Verb, Present Passive Indicative 3rd Plural"},
            {"word": "δόξης", "transliteration": "doxēs", "strong": "G1391", "meaning": "glory", "parsing": "Noun, Genitive Feminine Singular"},
        ],
    },
    "matthew": {
        (6, 9): [
            {"word": "Πάτερ", "transliteration": "Pater", "strong": "G3962", "meaning": "Father", "parsing": "Noun, Vocative Masculine Singular"},
            {"word": "ἡμῶν", "transliteration": "hēmōn", "strong": "G2257", "meaning": "our", "parsing": "Pronoun, Genitive 1st Plural"},
            {"word": "οὐρανοῖς", "transliteration": "ouranois", "strong": "G3772", "meaning": "heavens", "parsing": "Noun, Dative Masculine Plural"},
            {"word": "ἁγιασθήτω", "transliteration": "hagiasthetō", "strong": "G37", "meaning": "hallowed be, sanctified", "parsing": "Verb, Aorist Passive Imperative 3rd Singular"},
            {"word": "ὄνομά", "transliteration": "onoma", "strong": "G3686", "meaning": "name", "parsing": "Noun, Nominative Neuter Singular"},
        ],
    },
    "philippians": {
        (4, 13): [
            {"word": "ἰσχύω", "transliteration": "ischyō", "strong": "G2480", "meaning": "I can, I have strength", "parsing": "Verb, Present Active Indicative 1st Singular"},
            {"word": "ἐνδυναμοῦντί", "transliteration": "endynamounti", "strong": "G1743", "meaning": "strengthening, who strengthens", "parsing": "Verb, Present Active Participle Dative Masculine Singular"},
            {"word": "Χριστῷ", "transliteration": "Christō", "strong": "G5547", "meaning": "Christ", "parsing": "Noun, Dative Masculine Singular"},
        ],
    },
}

HEBREW_INTERLINEAR = {
    "genesis": {
        (1, 1): [
            {"word": "בְּרֵאשִׁית", "transliteration": "bereshit", "strong": "H7225", "meaning": "in the beginning", "parsing": "Preposition + Noun"},
            {"word": "בָּרָא", "transliteration": "bara", "strong": "H1254", "meaning": "created", "parsing": "Verb, Qal Perfect 3rd Masculine Singular"},
            {"word": "אֱלֹהִים", "transliteration": "elohim", "strong": "H430", "meaning": "God", "parsing": "Noun, Masculine Plural"},
            {"word": "הַשָּׁמַיִם", "transliteration": "hashamayim", "strong": "H8064", "meaning": "the heavens", "parsing": "Article + Noun, Masculine Plural"},
            {"word": "הָאָרֶץ", "transliteration": "haaretz", "strong": "H776", "meaning": "the earth", "parsing": "Article + Noun, Feminine Singular"},
        ],
        (1, 26): [
            {"word": "נַעֲשֶׂה", "transliteration": "na'aseh", "strong": "H6213", "meaning": "let us make", "parsing": "Verb, Qal Cohortative 1st Common Plural"},
            {"word": "אָדָם", "transliteration": "adam", "strong": "H120", "meaning": "man, mankind", "parsing": "Noun, Masculine Singular"},
            {"word": "צַלְמֵנוּ", "transliteration": "tsalmenu", "strong": "H6754", "meaning": "our image", "parsing": "Noun + Suffix"},
            {"word": "דְּמוּתֵנוּ", "transliteration": "demuthenu", "strong": "H1823", "meaning": "our likeness", "parsing": "Noun + Suffix"},
        ],
    },
    "exodus": {
        (3, 14): [
            {"word": "אֶהְיֶה", "transliteration": "ehyeh", "strong": "H1961", "meaning": "I AM, I will be", "parsing": "Verb, Qal Imperfect 1st Common Singular"},
            {"word": "אֲשֶׁר", "transliteration": "asher", "strong": "H834", "meaning": "who, which, that", "parsing": "Relative Pronoun"},
            {"word": "מֹשֶׁה", "transliteration": "mosheh", "strong": "H4872", "meaning": "Moses", "parsing": "Noun, Proper Masculine Singular"},
        ],
    },
    "psalms": {
        (23, 1): [
            {"word": "יְהוָה", "transliteration": "YHWH", "strong": "H3068", "meaning": "LORD", "parsing": "Noun, Proper Masculine Singular"},
            {"word": "רֹעִי", "transliteration": "ro'i", "strong": "H7462", "meaning": "my shepherd", "parsing": "Noun + Suffix"},
            {"word": "לֹא", "transliteration": "lo", "strong": "H3808", "meaning": "not", "parsing": "Adverb"},
            {"word": "אֶחְסָר", "transliteration": "echsar", "strong": "H2637", "meaning": "I shall lack, want", "parsing": "Verb, Qal Imperfect 1st Common Singular"},
        ],
    },
}


def _get_curated_interlinear(book: str, chapter: int, verse: int, language: str) -> Optional[List[Dict]]:
    book_lower = book.lower()
    verse_key = (chapter, verse)

    if language == "greek" and book_lower in GREEK_INTERLINEAR:
        if verse_key in GREEK_INTERLINEAR[book_lower]:
            return GREEK_INTERLINEAR[book_lower][verse_key]

    if language == "hebrew" and book_lower in HEBREW_INTERLINEAR:
        if verse_key in HEBREW_INTERLINEAR[book_lower]:
            return HEBREW_INTERLINEAR[book_lower][verse_key]

    return None


def _curated_verses_for_chapter(book: str, chapter: int, language: str) -> List[Dict]:
    """List curated {verse, words} entries available for this chapter (if any)."""
    book_lower = book.lower()
    lookup = GREEK_INTERLINEAR if language == "greek" else HEBREW_INTERLINEAR
    entries = lookup.get(book_lower, {})
    result = []
    for (chap, verse), words in entries.items():
        if chap == chapter:
            result.append({"verse": verse, "words": words})
    result.sort(key=lambda x: x["verse"])
    return result


async def get_interlinear_verse(
    book: str,
    chapter: int,
    verse: int,
    version: str = "KJV",
) -> dict:
    book_lower = book.lower().strip()
    language = "hebrew" if _is_ot(book_lower) else "greek"

    words = _get_curated_interlinear(book_lower, chapter, verse, language)
    english_text = await _fetch_verse_text(book_lower, chapter, verse, version)

    return {
        "reference": f"{book} {chapter}:{verse}",
        "version": version,
        "language": language,
        "available": bool(words),
        "english_text": english_text,
        "words": words or [],
    }


async def get_interlinear_chapter(
    book: str,
    chapter: int,
    version: str = "KJV",
) -> dict:
    book_lower = book.lower().strip()
    language = "hebrew" if _is_ot(book_lower) else "greek"

    verses = _curated_verses_for_chapter(book_lower, chapter, language)

    if verses:
        note = (
            "Word-by-word analysis is available for select key verses in this chapter. "
            "The English text is shown from your current translation."
        )
    else:
        note = (
            "Word-by-word analysis is not available for this chapter yet. "
            "We only show hand-checked original-language data, so unlisted verses are intentionally omitted."
        )

    return {
        "reference": f"{book} {chapter}",
        "version": version,
        "language": language,
        "available": bool(verses),
        "verses": verses,
        "note": note,
    }


async def _fetch_verse_text(book: str, chapter: int, verse: int, version: str) -> str:
    """Best-effort English verse text from bible-api.com; never raises."""
    try:
        url = f"{BIBLE_API_BASE}/{book.replace(' ', '+')}+{chapter}:{verse}"
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()
        for v in data.get("verses", []):
            if v.get("verse") == verse:
                return v.get("text", "")
    except Exception as e:
        logger.warning(f"Failed to fetch verse text for {book} {chapter}:{verse}: {e}")
    return ""
