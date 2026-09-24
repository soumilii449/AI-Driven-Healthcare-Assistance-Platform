"""
MedlinePlus Web Service integration
====================================

Free-text fallback search against the NLM MedlinePlus Web service, used
when a user's search doesn't match any of our curated local topics
(see health_education.py). No API key required.

Docs: https://medlineplus.gov/about/developers/webservices/
"""

import re
import requests
import xml.etree.ElementTree as ET

MEDLINEPLUS_BASE_URL = "https://wsearch.nlm.nih.gov/ws/query"

_TAG_RE = re.compile(r"<[^>]+>")


def _strip_tags(text):
    if not text:
        return ""
    return _TAG_RE.sub("", text).strip()


def search_medlineplus(query, lang="en", limit=6):
    """
    Search MedlinePlus health topics for a free-text query.

    Returns a list of dicts shaped like our local topic summaries so the
    frontend can render them with the same card component:
      { id, title, category, icon, summary, url, source }

    Returns an empty list on any network, HTTP, or parsing error — this
    is a best-effort fallback, not a hard dependency.
    """

    query = (query or "").strip()

    if not query:
        return []

    db = "healthTopicsSpanish" if lang == "es" else "healthTopics"

    params = {
        "db": db,
        "term": query,
        "retmax": limit,
    }

    try:
        response = requests.get(MEDLINEPLUS_BASE_URL, params=params, timeout=6)
        response.raise_for_status()
    except requests.RequestException:
        return []

    try:
        root = ET.fromstring(response.content)
    except ET.ParseError:
        return []

    results = []

    for doc in root.findall(".//document"):
        url = doc.get("url", "")
        title = ""
        snippet = ""

        for content in doc.findall("content"):
            name = content.get("name", "")
            text = "".join(content.itertext())

            if name == "title":
                title = _strip_tags(text)
            elif name in ("snippet", "FullSummary") and not snippet:
                snippet = _strip_tags(text)

        if not title:
            continue

        results.append({
            "id": url,
            "title": title,
            "category": "MedlinePlus",
            "icon": "BookOpen",
            "summary": snippet[:400] if snippet else "Tap to read the full article on MedlinePlus.",
            "url": url,
            "source": "medlineplus",
        })

    return results[:limit]