"""
Bible Service — Translation registry, providers, text fetching.
Designed for unlimited future translations via provider abstraction.
"""
import json
import logging
from typing import Optional, List, Dict
from dataclasses import dataclass, field

logger = logging.getLogger("beliversflow.bible")

# ---------------------------------------------------------------------------
# Data models
# ---------------------------------------------------------------------------

@dataclass
class BibleVersion:
    id: str
    name: str
    language: str = "en"
    language_name: str = "English"
    category: str = "English"
    testament: str = "OT+NT"
    provider: str = "api"
    public_domain: bool = False
    licensed: bool = False
    requires_key: bool = False
    rtl: bool = False
    original_language: bool = False
    strongs: bool = False
    year: int = 0
    description: str = ""
    region: str = ""
    skip_reason: str = ""

# ---------------------------------------------------------------------------
# Translation Registry — comprehensive list of Bible versions
# ---------------------------------------------------------------------------

VERSIONS: List[BibleVersion] = [
    # === English Versions ===
    BibleVersion(id="KJV", name="King James Version", year=1611, public_domain=True, description="The authorized King James Version, the most widely recognized English Bible translation.", provider="bible-api"),
    BibleVersion(id="NKJV", name="New King James Version", year=1982, licensed=True, description="A modern update preserving the KJV's literary style."),
    BibleVersion(id="NIV", name="New International Version", year=2011, licensed=True, description="A balanced modern translation widely used in evangelical churches.", requires_key=True),
    BibleVersion(id="ESV", name="English Standard Version", year=2001, licensed=True, description="A word-for-word translation valued for its accuracy.", requires_key=True),
    BibleVersion(id="NASB", name="New American Standard Bible", year=2020, licensed=True, description="Known for its literal, word-for-word translation philosophy.", requires_key=True),
    BibleVersion(id="NASB1995", name="New American Standard Bible (1995)", year=1995, licensed=True, description="The 1995 edition of the literal NASB translation."),
    BibleVersion(id="NLT", name="New Living Translation", year=2015, licensed=True, description="A dynamic-equivalence translation focused on readability.", requires_key=True),
    BibleVersion(id="CSB", name="Christian Standard Bible", year=2017, licensed=True, description="A modern translation balancing accuracy and readability.", requires_key=True),
    BibleVersion(id="HCSB", name="Holman Christian Standard Bible", year=2009, licensed=True, description="A predecessor to the CSB, known for its fidelity to the original languages."),
    BibleVersion(id="AMP", name="Amplified Bible", year=2015, licensed=True, description="Includes multiple amplifications to convey fuller meaning of the original text."),
    BibleVersion(id="ASV", name="American Standard Version", year=1901, public_domain=True, description="A highly respected American revision of the KJV, now in the public domain.", provider="local"),
    BibleVersion(id="RSV", name="Revised Standard Version", year=1971, licensed=True, description="A mid-20th century revision of the ASV, known for its scholarly accuracy."),
    BibleVersion(id="NRSV", name="New Revised Standard Version", year=1989, licensed=True, description="Widely used in academic and mainline church settings.", requires_key=True),
    BibleVersion(id="NRSVue", name="New Revised Standard Version Updated Edition", year=2021, licensed=True, description="The most recent update of the NRSV with inclusive language updates."),
    BibleVersion(id="GNB", name="Good News Bible", year=1992, licensed=True, description="Also known as Today's English Version, uses simple everyday language."),
    BibleVersion(id="CEV", name="Contemporary English Version", year=1995, licensed=True, description="Designed for readability at a third-grade reading level."),
    BibleVersion(id="NET", name="NET Bible", year=2005, licensed=True, description="A completely new translation with extensive translation notes, available free online."),
    BibleVersion(id="WEB", name="World English Bible", year=2000, public_domain=True, description="A modern public-domain English translation based on the ASV.", provider="bible-api"),
    BibleVersion(id="WEBBE", name="World English Bible British Edition", year=2000, public_domain=True, description="British spelling edition of the World English Bible."),
    BibleVersion(id="YLT", name="Young's Literal Translation", year=1898, public_domain=True, description="An extremely literal translation of the original texts.", provider="local"),
    BibleVersion(id="DBY", name="Darby Bible", year=1890, public_domain=True, description="A literal translation by John Nelson Darby.", provider="local"),
    BibleVersion(id="DRB", name="Douay-Rheims Bible", year=1899, public_domain=True, description="A traditional Catholic English translation from the Latin Vulgate.", provider="local"),
    BibleVersion(id="WNT", name="Weymouth New Testament", year=1903, public_domain=True, description="A modern-speech translation of the New Testament by Richard Weymouth."),
    BibleVersion(id="WBT", name="Webster Bible", year=1833, public_domain=True, description="Noah Webster's revision of the KJV, published in 1833.", provider="local"),
    BibleVersion(id="BBE", name="Bible in Basic English", year=1949, public_domain=True, description="A simplified English translation using only 1,000 words.", provider="local"),
    BibleVersion(id="ERV", name="Easy-to-Read Version", year=1987, public_domain=True, description="A simple English translation designed for new readers."),
    BibleVersion(id="TLB", name="The Living Bible", year=1971, licensed=True, description="A paraphrase of the Bible by Kenneth Taylor, known for its accessibility."),
    BibleVersion(id="MSG", name="The Message", year=2002, licensed=True, description="A contemporary paraphrase by Eugene Peterson in idiomatic English.", requires_key=True),
    BibleVersion(id="NCV", name="New Century Version", year=1987, licensed=True, description="A simplified translation designed for children and new readers."),
    BibleVersion(id="CEB", name="Common English Bible", year=2011, licensed=True, description="A modern, balanced translation by a broad team of scholars."),
    BibleVersion(id="NJB", name="New Jerusalem Bible", year=1985, licensed=True, description="A Catholic English translation with extensive footnotes."),
    BibleVersion(id="JB", name="Jerusalem Bible", year=1966, licensed=True, description="The original English Jerusalem Bible, a Catholic translation."),
    BibleVersion(id="NAB", name="New American Bible", year=2011, licensed=True, description="The official Catholic Bible translation for the United States."),
    BibleVersion(id="MEV", name="Modern English Version", year=2014, licensed=True, description="A modern translation in the KJV tradition."),
    BibleVersion(id="LEB", name="Lexham English Bible", year=2012, licensed=True, description="A literal translation with extensive linguistic notes."),
    BibleVersion(id="TLV", name="Tree of Life Version", year=2014, licensed=True, description="A Messianic Jewish translation that restores Hebrew names."),
    BibleVersion(id="NEB", name="New English Bible", year=1970, licensed=True, description="A British translation produced by mainstream churches."),
    BibleVersion(id="REB", name="Revised English Bible", year=1989, licensed=True, description="A revision of the NEB with updated language."),
    BibleVersion(id="Moffatt", name="Moffatt New Translation", year=1926, licensed=True, description="A personal translation by James Moffatt, known for its literary quality."),
    BibleVersion(id="Phillips", name="J.B. Phillips New Testament", year=1972, licensed=True, description="A classic modern-speech translation of the New Testament."),
    BibleVersion(id="RV", name="Revised Version", year=1885, public_domain=True, description="The first major revision of the KJV, known for its accuracy.", provider="local"),
    BibleVersion(id="ISV", name="International Standard Version", year=2011, licensed=True, description="A modern translation based on the best available manuscripts."),
    BibleVersion(id="TNIV", name="Today's New International Version", year=2005, licensed=True, description="An updated revision of the NIV with inclusive language."),
    BibleVersion(id="NIrV", name="New International Reader's Version", year=2014, licensed=True, description="A simplified NIV for early readers."),
    BibleVersion(id="EHV", name="Evangelical Heritage Version", year=2019, licensed=True, description="A modern translation preserving traditional theological terms."),
    BibleVersion(id="LSV", name="Literal Standard Version", year=2020, public_domain=True, description="A highly literal translation of the Hebrew, Aramaic, and Greek texts.", provider="local"),
    BibleVersion(id="BSB", name="Berean Standard Bible", year=2020, licensed=True, description="A modern, accurate translation from the original languages."),
    BibleVersion(id="KJV2000", name="King James Version 2000", year=2000, licensed=True, description="A modernized update of the KJV."),
    BibleVersion(id="AKJV", name="Authorized King James Version", year=1769, public_domain=True, description="The 1769 standard edition of the King James Bible.", provider="bible-api"),
    BibleVersion(id="Geneva", name="Geneva Bible", year=1599, public_domain=True, description="The Bible of the Protestant Reformation, preferred by the Pilgrims.", provider="local"),
    BibleVersion(id="Tyndale", name="Tyndale Bible", year=1534, public_domain=True, description="William Tyndale's pioneering English translation (NT and Pentateuch)."),

    # === Hebrew / Jewish ===
    BibleVersion(id="WLC", name="Westminster Leningrad Codex", language="he", language_name="Hebrew", category="Hebrew", testament="OT", public_domain=True, original_language=True, strongs=True, description="The standard scholarly edition of the Hebrew Bible (OT).", provider="local"),
    BibleVersion(id="MHC", name="Mechon Mamre Hebrew", language="he", language_name="Hebrew", category="Hebrew", testament="OT", public_domain=True, original_language=True, description="The Hebrew text from Mechon Mamre based on the Aleppo Codex."),
    BibleVersion(id="JPS", name="Jewish Publication Society (1917)", language="en", language_name="English", category="Jewish", year=1917, public_domain=True, description="The classic Jewish English translation of the Tanakh."),
    BibleVersion(id="JPS1985", name="Jewish Publication Society (1985)", language="en", language_name="English", category="Jewish", year=1985, licensed=True, description="The modern JPS translation of the Tanakh (NJPS)."),
    BibleVersion(id="HNV", name="Hebrew Names Version", language="en", language_name="English", category="Jewish", public_domain=True, description="A version of the WEB that restores Hebrew names."),
    BibleVersion(id="OJB", name="Orthodox Jewish Bible", language="en", language_name="English", category="Jewish", licensed=True, description="A translation incorporating Orthodox Jewish terminology."),

    # === Greek ===
    BibleVersion(id="TR", name="Textus Receptus (Greek NT)", language="el", language_name="Greek", category="Greek", testament="NT", public_domain=True, original_language=True, strongs=True, description="The Greek New Testament underlying the KJV (Stephanus 1550).", provider="local"),
    BibleVersion(id="NA27", name="Nestle-Aland 27th Edition (Greek NT)", language="el", language_name="Greek", category="Greek", testament="NT", licensed=True, original_language=True, strongs=True, description="The standard scholarly Greek New Testament."),
    BibleVersion(id="SBLGNT", name="SBL Greek New Testament", language="el", language_name="Greek", category="Greek", testament="NT", public_domain=True, original_language=True, description="An open-licensed critical edition of the Greek NT.", provider="local"),
    BibleVersion(id="Mounce", name="Mounce Reverse Interlinear", language="en", language_name="English", category="Greek", licensed=True, original_language=True, strongs=True, description="An interlinear English-Greek New Testament."),

    # === Latin ===
    BibleVersion(id="Vulgate", name="Latin Vulgate", language="la", language_name="Latin", category="Latin", public_domain=True, description="Jerome's 4th-century Latin translation, the standard Bible of the medieval Western Church.", provider="local"),
    BibleVersion(id="VulgateClem", name="Clementine Vulgate", language="la", language_name="Latin", category="Latin", year=1592, public_domain=True, description="The official Latin Bible of the Catholic Church until 1979."),
    BibleVersion(id="NovaVulgata", name="Nova Vulgata", language="la", language_name="Latin", category="Latin", year=1979, licensed=True, description="The modern official Latin Bible of the Catholic Church."),

    # === Aramaic ===
    BibleVersion(id="Peshitta", name="Peshitta (Aramaic NT)", language="arc", language_name="Aramaic", category="Aramaic", testament="NT", public_domain=True, original_language=True, description="The standard Syriac/Aramaic New Testament used by Eastern churches.", provider="local"),

    # === Nigerian Languages ===
    BibleVersion(id="Yoruba", name="Bibeli Mimo (Yoruba Bible)", language="yo", language_name="Yoruba", category="African Languages", public_domain=True, description="The complete Bible in the Yoruba language of Nigeria."),
    BibleVersion(id="Igbo", name="Baibo Nso (Igbo Bible)", language="ig", language_name="Igbo", category="African Languages", public_domain=True, description="The complete Bible in the Igbo language of Nigeria."),
    BibleVersion(id="Hausa", name="Littafi Mai Tsarki (Hausa Bible)", language="ha", language_name="Hausa", category="African Languages", public_domain=True, description="The complete Bible in the Hausa language of West Africa."),
    BibleVersion(id="Pidgin", name="Nigerian Pidgin English Bible", language="pcm", language_name="Nigerian Pidgin", category="African Languages", description="The Bible in Nigerian Pidgin English."),

    # === African Languages ===
    BibleVersion(id="Swahili", name="Biblia Takatifu (Swahili Bible)", language="sw", language_name="Swahili", category="African Languages", description="The complete Bible in Swahili, widely used in East Africa."),
    BibleVersion(id="Zulu", name="IBhayibheli Elingcwele (Zulu Bible)", language="zu", language_name="Zulu", category="African Languages", description="The complete Bible in the Zulu language of South Africa."),
    BibleVersion(id="Xhosa", name="IBhayibhile Eyingcwele (Xhosa Bible)", language="xh", language_name="Xhosa", category="African Languages", description="The complete Bible in the Xhosa language of South Africa."),
    BibleVersion(id="Afrikaans", name="Bybel (Afrikaans Bible)", language="af", language_name="Afrikaans", category="African Languages", public_domain=True, description="The complete Bible in Afrikaans (1933/1953 translation)."),
    BibleVersion(id="Amharic", name="Amharic Bible", language="am", language_name="Amharic", category="African Languages", description="The complete Bible in Amharic, the liturgical language of Ethiopia."),
    BibleVersion(id="Twi", name="Twi Bible (Asante)", language="tw", language_name="Twi", category="African Languages", description="The Bible in the Twi language of Ghana."),
    BibleVersion(id="Malagasy", name="Malagasy Bible", language="mg", language_name="Malagasy", category="African Languages", description="The complete Bible in Malagasy, the language of Madagascar."),

    # === European Languages ===
    BibleVersion(id="Luther", name="Lutherbibel (German)", language="de", language_name="German", category="European Languages", public_domain=True, description="Martin Luther's classic German translation (1912 revision).", provider="local"),
    BibleVersion(id="Segond", name="Louis Segond (French)", language="fr", language_name="French", category="European Languages", public_domain=True, description="The standard French Protestant translation (1910)."),
    BibleVersion(id="RVR", name="Reina-Valera (Spanish)", language="es", language_name="Spanish", category="European Languages", public_domain=True, description="The classic Spanish Protestant translation (1909 revision)."),
    BibleVersion(id="Dio", name="Giovanni Diodati (Italian)", language="it", language_name="Italian", category="European Languages", public_domain=True, description="The classic Italian Protestant translation (1649)."),
    BibleVersion(id="Almeida", name="João Ferreira de Almeida (Portuguese)", language="pt", language_name="Portuguese", category="European Languages", public_domain=True, description="The classic Portuguese Protestant translation (1750)."),
    BibleVersion(id="Synodal", name="Russian Synodal Bible", language="ru", language_name="Russian", category="European Languages", public_domain=True, description="The official Russian Orthodox Bible translation (1876)."),
    BibleVersion(id="Ostrog", name="Ostrog Bible (Church Slavonic)", language="cu", language_name="Church Slavonic", category="European Languages", public_domain=True, description="The first complete printed Bible in Church Slavonic (1581)."),
    BibleVersion(id="DutchSV", name="Statenvertaling (Dutch)", language="nl", language_name="Dutch", category="European Languages", public_domain=True, description="The official Dutch translation commissioned by the Synod of Dort (1637)."),
    BibleVersion(id="CzechKR", name="Bible kralická (Czech)", language="cs", language_name="Czech", category="European Languages", public_domain=True, description="The classic Czech Protestant translation (1613)."),
    BibleVersion(id="Norwegian", name="Det Norske Bibelselskap (Norwegian)", language="no", language_name="Norwegian", category="European Languages", public_domain=True, description="The official Norwegian Bible translation (1930)."),
    BibleVersion(id="Swedish", name="Svenska Folkbibeln (Swedish)", language="sv", language_name="Swedish", category="European Languages", description="A modern Swedish Bible translation."),
    BibleVersion(id="Finnish", name="Pyhä Raamattu (Finnish)", language="fi", language_name="Finnish", category="European Languages", public_domain=True, description="The Finnish Bible translation (1938)."),
    BibleVersion(id="PolishGd", name="Biblia Gdańska (Polish)", language="pl", language_name="Polish", category="European Languages", public_domain=True, description="The classic Polish Protestant Bible (1632)."),

    # === Asian Languages ===
    BibleVersion(id="Chinese", name="Chinese Union Version (Simplified)", language="zh", language_name="Chinese (Simplified)", category="Asian Languages", public_domain=True, description="The most widely used Chinese Bible translation (1919)."),
    BibleVersion(id="ChineseT", name="Chinese Union Version (Traditional)", language="zh-Hant", language_name="Chinese (Traditional)", category="Asian Languages", public_domain=True, description="The traditional character edition of the Chinese Union Version."),
    BibleVersion(id="Japanese", name="Japanese Bible (Kougo-yaku)", language="ja", language_name="Japanese", category="Asian Languages", description="The Japanese colloquial Bible translation (1955)."),
    BibleVersion(id="Korean", name="Korean Bible (Revised)", language="ko", language_name="Korean", category="Asian Languages", description="The revised Korean Bible translation (1998)."),
    BibleVersion(id="Hindi", name="Hindi Bible (IRV)", language="hi", language_name="Hindi", category="Asian Languages", description="The Indian Revised Version in Hindi."),
    BibleVersion(id="Tamil", name="Tamil Bible (UV)", language="ta", language_name="Tamil", category="Asian Languages", description="The Union Version Tamil Bible."),
    BibleVersion(id="Telugu", name="Telugu Bible", language="te", language_name="Telugu", category="Asian Languages", description="The Bible in the Telugu language of India."),
    BibleVersion(id="Marathi", name="Marathi Bible", language="mr", language_name="Marathi", category="Asian Languages", description="The Bible in the Marathi language of India."),
    BibleVersion(id="Indonesian", name="Indonesian Bible (TB)", language="id", language_name="Indonesian", category="Asian Languages", description="The Terjemahan Baru Indonesian Bible."),
    BibleVersion(id="Vietnamese", name="Vietnamese Bible (1934)", language="vi", language_name="Vietnamese", category="Asian Languages", public_domain=True, description="The classic Vietnamese Bible translation."),
    BibleVersion(id="Tagalog", name="Tagalog Bible (Ang Biblia)", language="tl", language_name="Tagalog", category="Asian Languages", description="The Bible in Tagalog/Filipino."),
    BibleVersion(id="Burmese", name="Burmese Bible", language="my", language_name="Burmese", category="Asian Languages", description="The Bible in the Burmese language."),
    BibleVersion(id="Thai", name="Thai Bible (KJV)", language="th", language_name="Thai", category="Asian Languages", description="The Thai King James Version."),
    BibleVersion(id="Urdu", name="Urdu Bible (UV)", language="ur", language_name="Urdu", category="Asian Languages", description="The Urdu Union Version Bible."),

    # === Orthodox ===
    BibleVersion(id="LXX", name="Septuagint (Greek OT)", language="el", language_name="Greek", category="Greek", testament="OT", public_domain=True, original_language=True, description="The Greek translation of the Hebrew Bible used by the early Church (Brenton 1851).", provider="local"),
    BibleVersion(id="OSB", name="Orthodox Study Bible", language="en", language_name="English", category="Orthodox", licensed=True, description="An English translation using the Septuagint for the OT."),

    # === Other Languages ===
    BibleVersion(id="Esperanto", name="Esperanto Bible", language="eo", language_name="Esperanto", category="Other Languages", public_domain=True, description="The complete Bible in Esperanto."),
    BibleVersion(id="LatinV", name="Latin Vulgate (Clementine)", language="la", language_name="Latin", category="Latin", testament="OT+NT", public_domain=True, description="The Clementine edition of the Latin Vulgate."),
]

# Index for fast lookup
_VERSIONS_BY_ID: Dict[str, BibleVersion] = {v.id: v for v in VERSIONS}

# ---------------------------------------------------------------------------
# Public-domain versions that can be served locally
# ---------------------------------------------------------------------------

PUBLIC_DOMAIN_IDS = {v.id for v in VERSIONS if v.public_domain}

# Versions available through bible-api.com (KJV, WEB, etc.)
BIBLE_API_VERSIONS = {
    "KJV": "kjv",
    "WEB": "web",
    "AKJV": "akjv",
    "ASV": "asv",
    "BBE": "bbe",
    "DBY": "dby",
    "DRB": "drb",
    "YLT": "ylt",
    "WBT": "wbt",
    "RV": "rv",
}

# ---------------------------------------------------------------------------
# Provider Interface
# ---------------------------------------------------------------------------

async def fetch_chapter(version_id: str, book: str, chapter: int) -> Optional[Dict]:
    """Fetch a Bible chapter using the appropriate provider."""
    version = _VERSIONS_BY_ID.get(version_id)
    if not version:
        return None

    provider = version.provider

    if provider == "bible-api":
        return await _fetch_from_bible_api(version_id, book, chapter)
    elif provider == "local" and version.public_domain:
        result = await _fetch_local_bible(version_id, book, chapter)
        if result:
            return result
        # Fallback to bible-api.com if the local file isn't available yet
        if version_id in BIBLE_API_VERSIONS:
            return await _fetch_from_bible_api(version_id, book, chapter)
        return None
    else:
        return None  # Will use AI fallback

# ---------------------------------------------------------------------------
# bible-api.com provider
# ---------------------------------------------------------------------------

async def _fetch_from_bible_api(version_id: str, book: str, chapter: int) -> Optional[Dict]:
    """Fetch from bible-api.com (supports KJV, WEB, etc.)."""
    import httpx
    from urllib.parse import quote

    api_version = BIBLE_API_VERSIONS.get(version_id, version_id.lower())
    encoded_book = quote(book.replace(' ', '+'))
    url = f"https://bible-api.com/{encoded_book}+{chapter}?translation={api_version}"

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()
        return {
            "reference": data.get("reference", f"{book} {chapter}"),
            "verses": [{"verse": v["verse"], "text": v["text"]} for v in data.get("verses", [])],
            "version": version_id,
            "chapter": f"{book} {chapter}",
        }
    except Exception as e:
        logger.warning(f"bible-api.com fetch failed for {version_id} {book} {chapter}: {e}")
        return None

# ---------------------------------------------------------------------------
# Local public-domain Bible texts
# ---------------------------------------------------------------------------

_LOCAL_BIBLES: Dict[str, Dict] = {}

def _load_local_bible(version_id: str) -> Optional[Dict]:
    """Load a local public-domain Bible text file."""
    if version_id in _LOCAL_BIBLES:
        return _LOCAL_BIBLES[version_id]

    import os
    path = os.path.join(os.path.dirname(__file__), "..", "bible_texts", f"{version_id.lower()}.json")
    if not os.path.exists(path):
        return None

    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        _LOCAL_BIBLES[version_id] = data
        return data
    except Exception as e:
        logger.error(f"Failed to load local Bible {version_id}: {e}")
        return None

async def _fetch_local_bible(version_id: str, book: str, chapter: int) -> Optional[Dict]:
    """Fetch a chapter from a local public-domain Bible text."""
    bible = _load_local_bible(version_id)
    if not bible:
        return None

    book_key = book.lower()
    book_data = bible.get(book_key)
    if not book_data:
        # Try alternate key formats
        for k, v in bible.items():
            if k.replace(" ", "").replace("-", "") == book_key.replace(" ", "").replace("-", ""):
                book_data = v
                break
    if not book_data:
        return None

    chapter_key = str(chapter)
    verses = book_data.get(chapter_key)
    if not verses:
        return None

    result_verses = []
    for v_num, v_text in verses.items():
        result_verses.append({"verse": int(v_num), "text": v_text})

    return {
        "reference": f"{book} {chapter}",
        "verses": result_verses,
        "version": version_id,
        "chapter": f"{book} {chapter}",
    }

# ---------------------------------------------------------------------------
# Public API functions
# ---------------------------------------------------------------------------

def get_versions() -> List[Dict]:
    """Return all registered Bible versions as serializable dicts."""
    return [
        {
            "id": v.id,
            "name": v.name,
            "language": v.language,
            "language_name": v.language_name,
            "category": v.category,
            "testament": v.testament,
            "public_domain": v.public_domain,
            "licensed": v.licensed,
            "requires_key": v.requires_key,
            "rtl": v.rtl,
            "original_language": v.original_language,
            "strongs": v.strongs,
            "year": v.year,
            "description": v.description,
            "region": v.region,
            "available": v.public_domain or v.provider in ("bible-api", "local"),
            "provider": v.provider if v.public_domain or v.provider in ("bible-api", "local") else "ai",
        }
        for v in VERSIONS
    ]


def get_version(version_id: str) -> Optional[Dict]:
    """Get metadata for a single version."""
    v = _VERSIONS_BY_ID.get(version_id)
    if not v:
        return None
    return {
        "id": v.id,
        "name": v.name,
        "language": v.language,
        "language_name": v.language_name,
        "category": v.category,
        "public_domain": v.public_domain,
        "licensed": v.licensed,
        "available": v.public_domain or v.provider in ("bible-api", "local"),
    }


def get_languages() -> List[Dict]:
    """Get unique languages from the registry."""
    seen = set()
    result = []
    for v in VERSIONS:
        key = v.language
        if key not in seen:
            seen.add(key)
            result.append({"code": v.language, "name": v.language_name})
    return sorted(result, key=lambda x: x["name"])


def get_categories() -> List[Dict]:
    """Get unique categories with version counts."""
    counts = {}
    for v in VERSIONS:
        counts[v.category] = counts.get(v.category, 0) + 1
    return [{"name": k, "count": v} for k, v in sorted(counts.items())]
