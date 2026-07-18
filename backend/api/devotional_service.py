import re
import json
import urllib.parse
import logging
from datetime import date, timedelta
from bs4 import BeautifulSoup
import httpx

logger = logging.getLogger("beliversflow.devotional")

TD = "https://thedevotionals.com.ng"

def _ord(n):
    if 11 <= n % 100 <= 13: return f"{n}th"
    return f"{n}{['th','st','nd','rd','th','th','th','th','th','th'][n%10]}"

def _month_name(d):
    return d.strftime('%B').lower()

def _clean_html(html):
    """Strip HTML tags, replace block elements with paragraph breaks,
    decode entities, and collapse inline whitespace."""
    if not html:
        return ""
    # Replace block-level tags with paragraph breaks
    html = re.sub(
        r'</?(?:p|div|h[1-6]|blockquote|li|tr|td|th|section|article|header|footer|aside|nav|br)\s?[^>]*>',
        '\n', html, flags=re.I
    )
    # Remove all remaining tags
    html = re.sub(r'<[^>]+>', ' ', html)
    # Decode common HTML entities
    html = re.sub(r'&amp;', '&', html)
    html = re.sub(r'&nbsp;', ' ', html)
    html = re.sub(r'&#\d+;', '', html)
    for e, r in [
        ('&rsquo;', "'"), ('&lsquo;', "'"), ('&rdquo;', '"'), ('&ldquo;', '"'),
        ('&mdash;', '—'), ('&ndash;', '–'), ('&hellip;', '…'),
        ('&bull;', '•'), ('&middot;', '·'), ('&raquo;', '»'), ('&laquo;', '«'),
    ]:
        html = html.replace(e, r)
    # Normalize line endings
    html = html.replace('\r\n', '\n').replace('\r', '\n')
    # Collapse 3+ newlines into 2 (preserve paragraph breaks)
    html = re.sub(r'\n{3,}', '\n\n', html)
    # Collapse horizontal whitespace but keep newlines
    html = re.sub(r'[ \t]+', ' ', html)
    # Trim leading/trailing whitespace per line
    lines = [l.strip() for l in html.split('\n')]
    # Remove empty lines at start/end but keep internal paragraph breaks
    result = '\n'.join(lines)
    result = re.sub(r'\n{3,}', '\n\n', result)
    return result.strip()

def _extract_meta(soup, *names):
    for name in names:
        m = soup.find("meta", property=name) or soup.find("meta", attrs={"name": name})
        if m and m.get("content"):
            return _clean_html(m["content"])
    return ""

def _find_bible_ref(text):
    """Extract Bible verse reference from text."""
    m = re.search(
        r'(?:(?:Bible\s+Reading|Scripture|Memory\s+Verse|Memory\s+Text|Text|Read|Key\s+Verse)\s*[:;]?\s*)'
        r'([A-Za-z0-9\s.,;:]+?\d+(?::\d+(?:-\d+)?)?)',
        text, re.I
    )
    return m.group(1).strip() if m else ""

def _find_prayer(text):
    """Extract prayer/confession section."""
    m = re.search(
        r'(?:Prayer|Confession|Declaration|Let\s+us\s+pray|Life\s+Application|Action\s+Point)'
        r'[:\n]+(.*?)(?:\n{2,}(?:Today|Memory|Bible|Topic|\w+\s+\d+)|\Z)',
        text, re.I | re.DOTALL
    )
    return _clean_html(m.group(1)) if m else ""

def _format_paragraphs(text, max_length=8000):
    """Clean text while preserving paragraph structure."""
    if not text:
        return ""
    text = text.strip()
    # Split into paragraphs
    paragraphs = re.split(r'\n{2,}', text)
    # Clean each paragraph
    cleaned = []
    for p in paragraphs:
        p = p.strip()
        if len(p) < 3:
            continue
        # Collapse internal whitespace
        p = re.sub(r'\s+', ' ', p).strip()
        cleaned.append(p)
    result = '\n\n'.join(cleaned)
    return result[:max_length] if max_length else result

def _build_sections(text):
    """Break devotional text into labeled sections for frontend rendering."""
    if not text:
        return [{"type": "text", "content": ""}]

    sections = []
    # Common section header patterns
    header_patterns = [
        (r'^(MEMORISE|Memory Verse|Memory Text)\s*[:;]?\s*(.+)$', 'memory', re.M | re.I),
        (r'^(TEXT|Scripture|Bible Reading|Read)\s*[:;]?\s*(.+)$', 'scripture', re.M | re.I),
        (r'^(MESSAGE|Today\'s Message|Devotional|Thought|Focus)\s*[:;]?\s*', 'message', re.M | re.I),
        (r'^(PRAYER|Confession|Declaration|Prayer Point|Life Application|Action Point)\s*[:;]?\s*', 'prayer', re.M | re.I),
    ]

    remaining = text
    for pattern, label, flags in header_patterns:
        m = re.search(pattern, remaining, flags)
        if m:
            # Everything before this section is previous content
            before = remaining[:m.start()].strip()
            if before:
                sections.append({"type": "text", "content": before})
            if label in ('memory', 'scripture'):
                sections.append({"type": label, "content": _format_paragraphs(m.group(2).strip())})
            elif label in ('message', 'prayer'):
                # Capture everything until next section header
                rest = remaining[m.end():].strip()
                # Try to find where the next section starts
                next_section = None
                for p2, _, _ in header_patterns:
                    nm = re.search(p2, rest, re.M | re.I)
                    if nm and (next_section is None or nm.start() < next_section):
                        next_section = nm.start()
                if next_section is not None:
                    section_content = rest[:next_section].strip()
                    remaining = rest[next_section:]
                else:
                    section_content = rest
                    remaining = ""
                sections.append({"type": label, "content": _format_paragraphs(section_content)})
            remaining = remaining.strip()
            continue

    # Any remaining text
    if remaining:
        sections.append({"type": "text", "content": _format_paragraphs(remaining)})

    if not sections:
        sections.append({"type": "text", "content": _format_paragraphs(text)})

    return sections

CHURCH_SOURCES = {
    "believersloveworld": {
        "name": "Believers Loveworld (Christ Embassy)",
        "url": "https://rhapsodyofrealities.org",
        "daily_url": lambda d: f"https://rhapsodyofrealities.org/en/read/{d.year}/{d.month:02d}/{d.day:02d}",
        "api_url": lambda d: f"https://read.rhapsodyofrealities.org/api/ror-translations/{d.isoformat()}/english",
        "parser": "parse_rhapsody_api",
    },
    "dunamis": {
        "name": "Dunamis Gospel Church",
        "url": "https://dunamisgospel.org",
        "daily_url": lambda d: f"https://dunamisgospel.org/{d.year}/{d.month:02d}/{d.day:02d}/",
        "api_url": None,
        "parser": "parse_dunamis_post",
    },
    "rccg": {
        "name": "Redeemed Christian Church of God",
        "url": "https://rccgonline.org",
        "daily_url": lambda d: f"https://rccgonline.org/open-heaven-{d.day}-{_month_name(d)}-{d.year}/",
        "api_url": None,
        "parser": "parse_rccg_post",
    },
    "dailymanna": {
        "name": "Daily Manna",
        "url": "https://www.dailymanna.app/",
        "daily_url": lambda d: "https://www.dailymanna.app/",
        "api_url": None,
        "parser": None,
    },
    "cac": {
        "name": "Christ Apostolic Church",
        "url": "https://cacsalvationcentre.org",
        "daily_url": lambda d: f"https://cacsalvationcentre.org/devotional/{d.year}/{d.month:02d}/{d.day:02d}/",
        "api_url": None,
        "parser": "parse_cac_devotional",
    },
    "mfm": {
        "name": "MFM Mountain Top Life",
        "url": f"{TD}/devotional/uncategorized/mfm-devotional/",
        "daily_url": lambda d: f"{TD}/mfm-daily-devotional-{_ord(d.day)}-{_month_name(d)}/",
        "api_url": None,
        "parser": "parse_td_wp",
    },
    "deeperlife": {
        "name": "Deeper Life (DCLM)",
        "url": f"{TD}/devotional/dlcm-daily-manna/",
        "daily_url": lambda d: f"{TD}/dclm-daily-manna-devotional-{_ord(d.day)}-{_month_name(d)}/",
        "api_url": None,
        "parser": "parse_td_wp",
    },
    "fcs": {
        "name": "FCS Ministries",
        "url": "https://fcsministries.org",
        "daily_url": lambda d: "https://fcsministries.org/devotional",
        "api_url": None,
        "parser": "parse_generic_wp",
    },
    "foodfortheday": {
        "name": "Food for the Day",
        "url": f"{TD}/devotional/food-for-the-day/",
        "daily_url": lambda d: f"{TD}/food-for-the-day-devotional-{_ord(d.day)}-{_month_name(d)}/",
        "api_url": None,
        "parser": "parse_td_wp",
    },
    "winners": {
        "name": "Winners Chapel (Faith Food)",
        "url": "https://faithfood.org",
        "daily_url": lambda d: f"https://faithfood.org/{d.year}/{d.month:02d}/{d.day:02d}/",
        "api_url": None,
        "parser": "parse_faithfood",
    },
    "trem": {
        "name": "TREM Devotional",
        "url": f"{TD}/devotional/trem-devotioal/",
        "daily_url": lambda d: f"{TD}/devotional/trem-devotioal/",
        "api_url": None,
        "parser": "parse_td_wp",
    },
    "joycemeyer": {
        "name": "Joyce Meyer Devotional",
        "url": f"{TD}/devotional/joyce-meyer/",
        "daily_url": lambda d: f"{TD}/devotional/joyce-meyer/",
        "api_url": None,
        "parser": "parse_td_wp",
    },
    "odbtd": {
        "name": "Our Daily Bread (TD)",
        "url": f"{TD}/devotional/odb/",
        "daily_url": lambda d: f"{TD}/devotional/odb/",
        "api_url": None,
        "parser": "parse_td_wp",
    },
    "billygraham": {
        "name": "Billy Graham Devotional",
        "url": f"{TD}/devotional/billy-graham/",
        "daily_url": lambda d: f"{TD}/devotional/billy-graham/",
        "api_url": None,
        "parser": "parse_td_wp",
    },
    "josephprince": {
        "name": "Joseph Prince Devotional",
        "url": f"{TD}/devotional/joseph-prince-devotional/",
        "daily_url": lambda d: f"{TD}/devotional/joseph-prince-devotional/",
        "api_url": None,
        "parser": "parse_td_wp",
    },
    "cdr": {
        "name": "CDR Devotional",
        "url": f"{TD}/devotional/cdr/",
        "daily_url": lambda d: f"{TD}/devotional/cdr/",
        "api_url": None,
        "parser": "parse_td_wp",
    },
    "kennethcopeland": {
        "name": "Kenneth Copeland Devotional",
        "url": f"{TD}/devotional/kenneth-copeland-devotional/",
        "daily_url": lambda d: f"{TD}/devotional/kenneth-copeland-devotional/",
        "api_url": None,
        "parser": "parse_td_wp",
    },
    "ourdailybread": {
        "name": "Our Daily Bread",
        "url": "https://odb.org",
        "daily_url": lambda d: f"https://odb.org/{d.year}/{d.month:02d}/{d.day:02d}/",
        "api_url": None,
        "parser": "parse_odb",
    },
    "davidjeremiah": {
        "name": "David Jeremiah (Turning Point)",
        "url": "https://www.davidjeremiah.org",
        "daily_url": lambda d: f"https://www.davidjeremiah.org/magazine/daily-devotional?showsignup=true&date={d.isoformat()}",
        "api_url": lambda d: "https://www.davidjeremiah.org/api/daily_devotional/get_web_html",
        "parser": "parse_davidjeremiah",
    },
    "intouch": {
        "name": "In Touch Ministries (Charles Stanley)",
        "url": "https://intouch.org",
        "daily_url": lambda d: f"https://intouch.org/read/daily-devotions/{d.year}-{d.month:02d}-{d.day:02d}",
        "api_url": None,
        "parser": "parse_intouch",
    },
    "joelosteen": {
        "name": "Joel Osteen (Lakewood Church)",
        "url": "https://joelosteen.com",
        "daily_url": lambda d: f"https://joelosteen.com/pages/daily-devotional-{d.year}-{d.month:02d}-{d.day:02d}",
        "api_url": None,
        "parser": "parse_joelosteen",
    },
}

PARSERS = {}

def register_parser(name):
    def wrapper(fn):
        PARSERS[name] = fn
        return fn
    return wrapper

# ─── RHAPSODY API ────────────────────────────────────────────
@register_parser("parse_rhapsody_api")
async def parse_rhapsody_api(html, source_url, request_date):
    try:
        api_url = f"https://read.rhapsodyofrealities.org/api/ror-translations/{request_date.isoformat()}/english"
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(api_url, headers={"User-Agent": "Mozilla/5.0"})
            resp.raise_for_status()
            data = resp.json()
        if "devotionals" in data and len(data["devotionals"]) > 0:
            d = data["devotionals"][0]
            content = _clean_html(d.get("content_body", ""))
            prayer = _clean_html(d.get("confession_or_prayer", ""))
            return {
                "title": d.get("title", ""),
                "verse": "",
                "verseText": _clean_html(d.get("opening_scripture", "")),
                "text": _format_paragraphs(content),
                "prayer": _format_paragraphs(prayer),
                "furtherStudy": _clean_html(d.get("further_study", "")),
                "sections": _build_sections(content),
                "sourceUrl": f"https://rhapsodyofrealities.org/en/read/{request_date.year}/{request_date.month:02d}/{request_date.day:02d}",
                "synced": True,
                "_src": "rhapsody_api",
            }
    except Exception as e:
        logger.warning(f"Rhapsody API failed: {e}")
    return None

# ─── DUNASIS ─────────────────────────────────────────────────
@register_parser("parse_dunamis_post")
async def parse_dunamis_post(html, source_url, request_date):
    soup = BeautifulSoup(html, "lxml")
    title = _clean_html(_extract_meta(soup, "og:title", "twitter:title", "title"))
    og_desc = _clean_html(_extract_meta(soup, "og:description", "description"))
    content = ""
    entry = soup.select_one(".entry-content")
    if entry:
        for tag in entry.find_all(["script", "style", "nav", "header", "footer", "iframe"]):
            tag.decompose()
        content = _clean_html(str(entry))
    if not content or len(content) < 80:
        content = og_desc
    if title or content:
        return {
            "title": title or "Seeds of Destiny",
            "verse": _find_bible_ref(content),
            "verseText": "",
            "text": _format_paragraphs(content, 5000),
            "prayer": _find_prayer(content),
            "sections": _build_sections(content),
            "sourceUrl": source_url,
            "synced": True,
            "_src": "dunamis_v2",
        }
    return None

# ─── RCCG ────────────────────────────────────────────────────
@register_parser("parse_rccg_post")
async def parse_rccg_post(html, source_url, request_date):
    soup = BeautifulSoup(html, "lxml")
    article = soup.find("article")
    if not article:
        return None
    for tag in article.find_all(["script", "style"]):
        tag.decompose()

    content = _clean_html(str(article))
    if not content or len(content) < 100:
        return None

    title = ""
    if "OPEN HEAVEN" in content.upper():
        for line in content.split('\n'):
            if "OPEN HEAVEN" in line.upper():
                title = line.strip()
                break
    title = title or _clean_html(_extract_meta(soup, "og:title", "twitter:title", "title")) or "Open Heaven"

    verse = _find_bible_ref(content)
    prayer = _find_prayer(content)

    return {
        "title": title,
        "verse": verse,
        "verseText": "",
        "text": _format_paragraphs(content, 5000),
        "prayer": prayer,
        "sections": _build_sections(content),
        "sourceUrl": source_url,
        "synced": True,
        "_src": "rccg_v2",
    }

# ─── THEDEVOTIONALS WORDPRESS GENERIC ────────────────────────
@register_parser("parse_td_wp")
async def parse_td_wp(html, source_url, request_date):
    soup = BeautifulSoup(html, "lxml")
    title = _clean_html(_extract_meta(soup, "og:title", "twitter:title", "title"))
    og_desc = _clean_html(_extract_meta(soup, "og:description", "description"))

    content = ""
    # Strategy 1: Elementor layout
    post = soup.select_one("[class*=elementor-location-single], article")
    if post:
        for tag in post.find_all(["script", "style", "ins", "iframe", "nav"]):
            tag.decompose()
        containers = post.select(".elementor-widget-container")
        if containers:
            best = max(containers, key=lambda c: len(c.get_text(strip=True)))
            content = _clean_html(str(best))
        else:
            content = _clean_html(str(post))

    # Strategy 2: Standard WordPress .entry-content
    if not content or len(content) < 200:
        entry = soup.select_one(".entry-content")
        if entry:
            content = _clean_html(str(entry))

    # Strategy 3: Generic article
    if not content or len(content) < 200:
        art = soup.find("article")
        if art:
            content = _clean_html(str(art))

    if not content or len(content) < 100:
        content = og_desc

    verse = _find_bible_ref(content)
    prayer = _find_prayer(content)

    if title or content:
        return {
            "title": title or "Daily Devotional",
            "verse": verse,
            "verseText": "",
            "text": _format_paragraphs(content, 5000),
            "prayer": prayer,
            "sections": _build_sections(content),
            "sourceUrl": source_url,
            "synced": True,
            "_src": "td_wp",
        }
    return None

# ─── CAC LIVING WATER ────────────────────────────────────────
@register_parser("parse_cac_devotional")
async def parse_cac_devotional(html, source_url, request_date):
    soup = BeautifulSoup(html, "lxml")
    title = _clean_html(_extract_meta(soup, "og:title", "twitter:title", "title"))
    og_desc = _clean_html(_extract_meta(soup, "og:description", "description"))

    content = ""
    for selector in ["article", ".entry-content", ".post-content", ".devotional-content", ".content-area", "#content", "main"]:
        el = soup.select_one(selector)
        if el:
            for tag in el.find_all(["script", "style", "nav", "header", "footer", "iframe", "aside"]):
                tag.decompose()
            content = _clean_html(str(el))
            if len(content) > 200:
                break

    if not content or len(content) < 100:
        for cls in ["devotional", "living-water", "daily-devotional"]:
            div = soup.find(class_=cls)
            if div:
                content = _clean_html(str(div))
                break

    if not content or len(content) < 100:
        content = og_desc

    verse = _find_bible_ref(content)
    prayer = _find_prayer(content)

    if title or content:
        return {
            "title": title or "CAC Living Water",
            "verse": verse,
            "verseText": "",
            "text": _format_paragraphs(content, 5000),
            "prayer": prayer,
            "sections": _build_sections(content),
            "sourceUrl": source_url,
            "synced": True,
            "_src": "cac_v1",
        }
    return None


# ─── FAITH FOOD (WINNERS CHAPEL) ──────────────────────────────
@register_parser("parse_faithfood")
async def parse_faithfood(html, source_url, request_date):
    soup = BeautifulSoup(html, "lxml")
    title = _clean_html(_extract_meta(soup, "og:title", "twitter:title", "title"))
    og_desc = _clean_html(_extract_meta(soup, "og:description", "description"))

    content = ""
    for selector in [".entry-content", ".post-content", "article", ".devotional-content", ".daily-word", ".faith-food-content", "main"]:
        el = soup.select_one(selector)
        if el:
            for tag in el.find_all(["script", "style", "nav", "header", "footer", "iframe"]):
                tag.decompose()
            content = _clean_html(str(el))
            if len(content) > 200:
                break

    if not content or len(content) < 100:
        content = og_desc

    verse = _find_bible_ref(content)
    prayer = _find_prayer(content)

    if title or content:
        return {
            "title": title or "Faith Food",
            "verse": verse,
            "verseText": "",
            "text": _format_paragraphs(content, 5000),
            "prayer": prayer,
            "sections": _build_sections(content),
            "sourceUrl": source_url,
            "synced": True,
            "_src": "faithfood_v1",
        }
    return None


# ─── GENERIC WORDPRESS (FCS, etc.) ────────────────────────────
@register_parser("parse_generic_wp")
async def parse_generic_wp(html, source_url, request_date):
    soup = BeautifulSoup(html, "lxml")
    title = _clean_html(_extract_meta(soup, "og:title", "twitter:title", "title"))
    og_desc = _clean_html(_extract_meta(soup, "og:description", "description"))

    content = ""
    for selector in [".entry-content", "article", ".post-content", "main", ".content-area", "#content"]:
        el = soup.select_one(selector)
        if el:
            for tag in el.find_all(["script", "style", "nav", "header", "footer", "iframe", "aside"]):
                tag.decompose()
            content = _clean_html(str(el))
            if len(content) > 200:
                break

    if not content or len(content) < 100:
        content = og_desc

    if title or content:
        return {
            "title": title or "Daily Devotional",
            "verse": _find_bible_ref(content),
            "verseText": "",
            "text": _format_paragraphs(content, 5000),
            "prayer": _find_prayer(content),
            "sections": _build_sections(content),
            "sourceUrl": source_url,
            "synced": True,
            "_src": "generic_wp",
        }
    return None


# ─── OUR DAILY BREAD ─────────────────────────────────────────
@register_parser("parse_odb")
async def parse_odb(html, source_url, request_date):
    soup = BeautifulSoup(html, "lxml")
    title = _clean_html(_extract_meta(soup, "og:title", "twitter:title", "title"))
    og_desc = _clean_html(_extract_meta(soup, "og:description", "description"))

    content = ""
    for selector in [".post-content", ".entry-content", "article", ".devotional-content", ".odb-content", "main"]:
        el = soup.select_one(selector)
        if el:
            for tag in el.find_all(["script", "style", "nav", "header", "footer", "iframe", "aside"]):
                tag.decompose()
            content = _clean_html(str(el))
            if len(content) > 200:
                break

    if not content or len(content) < 100:
        content = og_desc

    verse = _find_bible_ref(content)
    prayer = _find_prayer(content)

    if title or content:
        return {
            "title": title or "Our Daily Bread",
            "verse": verse,
            "verseText": "",
            "text": _format_paragraphs(content, 5000),
            "prayer": prayer,
            "sections": _build_sections(content),
            "sourceUrl": source_url,
            "synced": True,
            "_src": "odb_v1",
        }
    return None


# ─── DAVID JEREMIAH (TURNING POINT) ──────────────────────────
@register_parser("parse_davidjeremiah")
async def parse_davidjeremiah(html, source_url, request_date):
    """Fetch from David Jeremiah's official API endpoint."""
    try:
        api_url = f"https://www.davidjeremiah.org/api/daily_devotional/get_web_html?date={request_date.isoformat()}"
        post_data = urllib.parse.urlencode({
            "action": "build_devotional",
            "page": f"https://www.davidjeremiah.org/magazine/daily-devotional?showsignup=true&date={request_date.isoformat()}",
            "date": request_date.isoformat(),
            "is_test": 0,
            "user_token": "",
        })
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                api_url,
                data=post_data,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
                    "Content-Type": "application/x-www-form-urlencoded",
                }
            )
            resp.raise_for_status()
            data = resp.json()

        if not data.get("success") or not data.get("html"):
            logger.warning(f"David Jeremiah API returned no content for {request_date}")
            return None

        soup = BeautifulSoup(data["html"], "lxml")

        title_el = soup.find("h1", id="edevo_title")
        title = _clean_html(title_el.get_text()) if title_el else ""

        if not title:
            title = _clean_html(data.get("page_title", ""))

        # Scripture verse (italic paragraph before content)
        verse_para = soup.find("p", style=re.compile(r"font-style:\s*italic", re.I))
        verse = ""
        verse_text = ""
        if verse_para:
            full = _clean_html(str(verse_para))
            # Extract reference (last line or separate)
            lines = [l.strip() for l in full.split("\n") if l.strip()]
            if lines:
                verse_text = lines[0]
                if len(lines) > 1:
                    verse = lines[-1]
                else:
                    # Try to extract reference from the text
                    ref_match = re.search(r'([A-Za-z]+\s*\d+:\d+(?:-\d+)?)', verse_text)
                    if ref_match:
                        verse = ref_match.group(1)
                        verse_text = verse_text.replace(verse, "").strip(" \u201c\u201d\u2018\u2019\"'")

        # Extract devotional paragraphs (the actual content)
        content_parts = []
        for p in soup.find_all("p"):
            p_cls = p.get("class", [])
            p_style = p.get("style", "") or ""
            # Skip metadata paragraphs
            if "run-date" in p_cls:
                continue
            if "edevo_share" in p_cls:
                continue
            if "font-style" in p_style.lower() and "italic" in p_style.lower():
                continue  # skip scripture paragraph
            txt = _clean_html(str(p))
            if txt and len(txt) > 10:
                content_parts.append(txt)

        content = "\n\n".join(content_parts)

        # Build sections
        sections = [{"type": "text", "content": _format_paragraphs(content)}]

        # Check for recommended reading
        rec_reading = soup.select_one(".recommended-reading")
        if rec_reading:
            rec_text = _clean_html(rec_reading.get_text())
            if rec_text:
                sections.insert(0, {
                    "type": "scripture",
                    "content": rec_text.replace("Recommended Reading:", "").strip()
                })

        if title or content:
            return {
                "title": title or "Turning Point Devotional",
                "verse": verse,
                "verseText": verse_text,
                "text": _format_paragraphs(content, 5000),
                "prayer": "",
                "sections": sections,
                "sourceUrl": f"https://www.davidjeremiah.org/magazine/daily-devotional?showsignup=true&date={request_date.isoformat()}",
                "synced": True,
                "_src": "davidjeremiah_api",
            }
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return None
        logger.warning(f"David Jeremiah API HTTP error: {e}")
    except Exception as e:
        logger.warning(f"David Jeremiah API failed: {e}")

    return None


# ─── IN TOUCH (CHARLES STANLEY) ──────────────────────────────
@register_parser("parse_intouch")
async def parse_intouch(html, source_url, request_date):
    soup = BeautifulSoup(html, "lxml")
    title = _clean_html(_extract_meta(soup, "og:title", "twitter:title", "title"))
    og_desc = _clean_html(_extract_meta(soup, "og:description", "description"))

    content = ""
    for selector in [".devotional-content", ".entry-content", "article", ".post-content", "main", "#content", ".daily-devotional"]:
        el = soup.select_one(selector)
        if el:
            for tag in el.find_all(["script", "style", "nav", "header", "footer", "iframe", "aside"]):
                tag.decompose()
            content = _clean_html(str(el))
            if len(content) > 200:
                break

    if not content or len(content) < 100:
        content = og_desc

    verse = _find_bible_ref(content)
    prayer = _find_prayer(content)

    if title or content:
        return {
            "title": title or "In Touch Daily Devotional",
            "verse": verse,
            "verseText": "",
            "text": _format_paragraphs(content, 5000),
            "prayer": prayer,
            "sections": _build_sections(content),
            "sourceUrl": source_url,
            "synced": True,
            "_src": "intouch_v1",
        }
    return None


# ─── JOEL OSTEEN ─────────────────────────────────────────────
@register_parser("parse_joelosteen")
async def parse_joelosteen(html, source_url, request_date):
    soup = BeautifulSoup(html, "lxml")
    title = _clean_html(_extract_meta(soup, "og:title", "twitter:title", "title"))
    og_desc = _clean_html(_extract_meta(soup, "og:description", "description"))

    content = ""
    for selector in [".devotional-content", ".entry-content", "article", ".post-content", "main", "#content", ".daily-word"]:
        el = soup.select_one(selector)
        if el:
            for tag in el.find_all(["script", "style", "nav", "header", "footer", "iframe", "aside"]):
                tag.decompose()
            content = _clean_html(str(el))
            if len(content) > 200:
                break

    if not content or len(content) < 100:
        content = og_desc

    verse = _find_bible_ref(content)
    prayer = _find_prayer(content)

    if title or content:
        return {
            "title": title or "Joel Osteen Devotional",
            "verse": verse,
            "verseText": "",
            "text": _format_paragraphs(content, 5000),
            "prayer": prayer,
            "sections": _build_sections(content),
            "sourceUrl": source_url,
            "synced": True,
            "_src": "joelosteen_v1",
        }
    return None


# ─── MAIN FETCH ──────────────────────────────────────────────
async def fetch_devotional(church_key, request_date=None):
    if request_date is None:
        request_date = date.today()

    cache_key = f"devotional:v2:{church_key}:{request_date.isoformat()}"
    try:
        from api.redis_client import cache_get, cache_set
        cached = await cache_get("devotional", cache_key)
        if cached:
            return json.loads(cached)
    except Exception:
        pass

    source = CHURCH_SOURCES.get(church_key)
    if not source:
        return {"error": f"Unknown church: {church_key}", "synced": False}

    daily_url = source["daily_url"](request_date)
    parser_name = source["parser"]
    parser_fn = PARSERS.get(parser_name) if parser_name else None

    # API-first path
    if parser_fn and source.get("api_url"):
        try:
            result = await parser_fn(None, daily_url, request_date)
            if result:
                try: await cache_set("devotional", cache_key, json.dumps(result), ttl=21600)
                except: pass
                return result
        except Exception as e:
            logger.warning(f"{church_key} API error: {e}")

    # HTML fetch + parse path
    if parser_fn:
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0"}
        try:
            async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
                resp = await client.get(daily_url, headers=headers)
                resp.raise_for_status()
                html = resp.text

            result = await parser_fn(html, daily_url, request_date)
            if result:
                try: await cache_set("devotional", cache_key, json.dumps(result), ttl=21600)
                except: pass
                return result

            return {"error": "Could not extract devotional", "sourceUrl": daily_url, "synced": False}

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return {"error": "Devotional not yet available", "sourceUrl": daily_url, "synced": False}
            return {"error": f"HTTP {e.response.status_code}", "sourceUrl": daily_url, "synced": False}
        except httpx.TimeoutException:
            return {"error": "Source timeout", "sourceUrl": daily_url, "synced": False}
        except Exception as e:
            err = str(e)
            if "getaddrinfo failed" in err:
                return {"error": "Source unavailable", "sourceUrl": daily_url, "synced": False}
            logger.warning(f"Fetch error {daily_url}: {e}")
            return {"error": "Failed to fetch", "sourceUrl": daily_url, "synced": False}

    return {"error": "No parser available", "sourceUrl": daily_url, "synced": False, "offline": True}