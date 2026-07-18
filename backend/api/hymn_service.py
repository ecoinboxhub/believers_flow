"""
Unified Hymn Service for BelieversFlow
Provides fuzzy matching, search, metadata aggregation, and provider abstraction.
"""
import re
import math
from typing import List, Dict, Optional, Tuple
from difflib import SequenceMatcher


# --- Hymn Metadata Store ---
# Extended metadata for hymns beyond the basic bundled data.
# This serves as the local database that can be enriched over time.

HYMN_METADATA: Dict[int, Dict] = {
    1: {
        "meter": "8.8.8.6",
        "scripture": "Ephesians 2:8-9",
        "year": 1779,
        "denomination": "Universal",
        "tune_name": "New Britain",
        "language": "en",
        "alternate_titles": ["Amazing Grace! How Sweet the Sound"],
        "tags": ["grace", "salvation", "testimony", "conversion"],
        "composer": "John Newton",
        "arranger": "",
    },
    2: {
        "meter": "10.10.10.10",
        "scripture": "Psalm 23",
        "year": 1865,
        "denomination": "Universal",
        "tune_name": "Crimond",
        "language": "en",
        "alternate_titles": ["The Lord Is My Shepherd"],
        "tags": ["psalm", "shepherd", "comfort", "providence"],
        "composer": "Jessie Seymour Irvine",
        "arranger": "",
    },
    3: {
        "meter": "8.8.8.8.8.8",
        "scripture": "Revelation 4:8",
        "year": 1744,
        "denomination": "Universal",
        "tune_name": "Holy, Holy, Holy",
        "language": "en",
        "alternate_titles": ["Holy, Holy, Holy! Lord God Almighty"],
        "tags": ["trinity", "worship", "praise", "holiness"],
        "composer": "Reginald Heber",
        "arranger": "John Bacchus Dykes",
    },
    4: {
        "meter": "8.8.8.8",
        "scripture": "Psalm 103:1",
        "year": 1774,
        "denomination": "Universal",
        "tune_name": "Old 100th",
        "language": "en",
        "alternate_titles": ["All People That on Earth Do Dwell", "Praise God from Whom All Blessings Flow"],
        "tags": ["praise", "doxology", "psalm", "thanksgiving"],
        "composer": "Louis Bourgeois",
        "arranger": "",
    },
    5: {
        "meter": "10.10.10.4",
        "scripture": "Philippians 4:6-7",
        "year": 1882,
        "denomination": "Universal",
        "tune_name": "Pass Me Not",
        "language": "en",
        "alternate_titles": [],
        "tags": ["prayer", "mercy", "penitence"],
        "composer": "Fanny Crosby",
        "arranger": "W.H. Doane",
    },
    6: {
        "meter": "8.8.8.8.8.8",
        "scripture": "Isaiah 53:5",
        "year": 1707,
        "denomination": "Universal",
        "tune_name": "Martyn",
        "language": "en",
        "alternate_titles": ["When I Survey the Wondrous Cross"],
        "tags": ["cross", "crucifixion", "love", "sacrifice"],
        "composer": "Isaac Watts",
        "arranger": "",
    },
    7: {
        "meter": "8.7.8.7.8.7",
        "scripture": "Psalm 91:1-2",
        "year": 1779,
        "denomination": "Universal",
        "tune_name": "Germany",
        "language": "en",
        "alternate_titles": ["He That Dwelleth in the Secret Place"],
        "tags": ["protection", "psalm", "refuge", "trust"],
        "composer": "Isaac Watts",
        "arranger": "",
    },
    8: {
        "meter": "10.10.10.10",
        "scripture": "Romans 8:38-39",
        "year": 1874,
        "denomination": "Universal",
        "tune_name": "Finlandia",
        "language": "en",
        "alternate_titles": ["Be Still, My Soul"],
        "tags": ["trust", "patience", "sovereignty", "comfort"],
        "composer": "Katharina von Schlegel",
        "arranger": "Jean Sibelius",
    },
    9: {
        "meter": "8.8.8.8",
        "scripture": "Psalm 46:10",
        "year": 1850,
        "denomination": "Universal",
        "tune_name": "St. Columba",
        "language": "en",
        "alternate_titles": ["Be Still, My Soul"],
        "tags": ["peace", "trust", "surrender"],
        "composer": "Katharina von Schlegel",
        "arranger": "",
    },
    10: {
        "meter": "8.8.8.8.8.8",
        "scripture": "Psalm 34:1-3",
        "year": 1779,
        "denomination": "Universal",
        "tune_name": "Old Hundredth",
        "language": "en",
        "alternate_titles": ["From All That Dwell Below the Skies"],
        "tags": ["praise", "psalm", "universal"],
        "composer": "Isaac Watts",
        "arranger": "",
    },
}


# --- Fuzzy Matching Engine ---

def _normalize(text: str) -> str:
    """Normalize text for comparison."""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text


def _tokenize(text: str) -> List[str]:
    """Tokenize text into words."""
    return _normalize(text).split()


def _levenshtein_distance(s1: str, s2: str) -> int:
    """Calculate Levenshtein edit distance between two strings."""
    if len(s1) < len(s2):
        return _levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)
    prev_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        curr_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = prev_row[j + 1] + 1
            deletions = curr_row[j] + 1
            substitutions = prev_row[j] + (c1 != c2)
            curr_row.append(min(insertions, deletions, substitutions))
        prev_row = curr_row
    return prev_row[-1]


def _sequence_ratio(s1: str, s2: str) -> float:
    """SequenceMatcher ratio for similarity."""
    return SequenceMatcher(None, _normalize(s1), _normalize(s2)).ratio()


def _first_line_match(query: str, first_line: str) -> float:
    """Check if query matches the first line of lyrics."""
    if not first_line:
        return 0.0
    q_tokens = set(_tokenize(query))
    fl_tokens = set(_tokenize(first_line))
    if not q_tokens:
        return 0.0
    overlap = len(q_tokens & fl_tokens)
    return overlap / len(q_tokens)


def match_hymn(query: str, hymn: Dict) -> float:
    """
    Calculate a confidence score (0.0 to 1.0) for how well a query matches a hymn.
    
    Considers:
    - Title match (exact, substring, fuzzy)
    - First line match
    - Author match
    - Hymn number match
    - Alternate title match
    - Tag match
    """
    score = 0.0
    query_norm = _normalize(query)
    title = hymn.get('title', '')
    author = hymn.get('author', '')
    lyrics = hymn.get('lyrics', '')
    first_line = lyrics.split('\n')[0] if lyrics else ''
    
    metadata = HYMN_METADATA.get(hymn.get('id', 0), {})
    alternate_titles = metadata.get('alternate_titles', [])
    tags = metadata.get('tags', [])
    
    # Exact title match (highest confidence)
    if query_norm == _normalize(title):
        return 1.0
    
    # Number match
    try:
        num = int(query)
        if hymn.get('id', 0) == num:
            return 0.99
    except ValueError:
        pass
    
    # Title contains query or query contains title
    if query_norm in _normalize(title) or _normalize(title) in query_norm:
        score = max(score, 0.9)
    
    # Alternate title match
    for alt_title in alternate_titles:
        if query_norm == _normalize(alt_title):
            return 0.98
        if query_norm in _normalize(alt_title) or _normalize(alt_title) in query_norm:
            score = max(score, 0.85)
    
    # Fuzzy title match
    title_ratio = _sequence_ratio(query, title)
    if title_ratio > 0.6:
        score = max(score, title_ratio * 0.9)
    
    # First line match
    fl_score = _first_line_match(query, first_line)
    if fl_score > 0.5:
        score = max(score, 0.8 + fl_score * 0.1)
    
    # Author match
    if author and query_norm in _normalize(author):
        score = max(score, 0.7)
    
    # Tag match
    for tag in tags:
        if query_norm in tag or tag in query_norm:
            score = max(score, 0.6)
    
    # General fuzzy fallback
    combined = f"{title} {author}"
    combined_ratio = _sequence_ratio(query, combined)
    if combined_ratio > 0.4:
        score = max(score, combined_ratio * 0.5)
    
    return round(score, 4)


def search_hymns(query: str, hymns: List[Dict], threshold: float = 0.3) -> List[Tuple[Dict, float]]:
    """
    Search hymns with fuzzy matching and confidence scoring.
    
    Returns list of (hymn, score) tuples sorted by confidence descending.
    """
    if not query or not query.strip():
        return [(h, 1.0) for h in hymns]
    
    results = []
    for hymn in hymns:
        score = match_hymn(query, hymn)
        if score >= threshold:
            results.append((hymn, score))
    
    results.sort(key=lambda x: (-x[1], x[0].get('title', '')))
    return results


def get_hymn_suggestions(query: str, hymns: List[Dict], limit: int = 5) -> List[Dict]:
    """
    Get autocomplete suggestions for a hymn query.
    Returns simplified results for autocomplete UI.
    """
    if not query or len(query.strip()) < 2:
        return []
    results = search_hymns(query, hymns, threshold=0.2)
    suggestions = []
    for hymn, score in results[:limit]:
        suggestions.append({
            'id': hymn.get('id'),
            'title': hymn.get('title', ''),
            'author': hymn.get('author', ''),
            'score': score,
        })
    return suggestions


def get_metadata(hymn_id: int) -> Dict:
    """Get extended metadata for a hymn."""
    return HYMN_METADATA.get(hymn_id, {})


def get_categories_with_counts(hymns: List[Dict]) -> List[Dict]:
    """Get all categories with their hymn counts."""
    counts = {}
    for h in hymns:
        cat = h.get('category', 'Uncategorized')
        counts[cat] = counts.get(cat, 0) + 1
    return [{'name': k, 'count': v} for k, v in sorted(counts.items())]
