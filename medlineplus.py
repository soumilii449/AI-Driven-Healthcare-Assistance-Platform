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
from urllib.parse import urlparse

from bs4 import BeautifulSoup

MEDLINEPLUS_BASE_URL = "https://wsearch.nlm.nih.gov/ws/query"

# Only ever fetch pages from medlineplus.gov itself — the URL for
# fetch_medlineplus_article() ultimately comes from the client, so this
# stops the backend being used to fetch arbitrary third-party pages.
ALLOWED_ARTICLE_HOST_SUFFIX = "medlineplus.gov"

_TAG_RE = re.compile(r"<[^>]+>")


class MedlinePlusError(Exception):
    """Raised when a MedlinePlus lookup can't be completed."""


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


def fetch_medlineplus_article(url, timeout=8):
    """
    Fetch and extract the readable body text of a single MedlinePlus
    article page (used when the user opens a MedlinePlus search result).

    Returns { title, content: [paragraph, ...], url, source }.
    Raises MedlinePlusError with a human-readable message on any failure,
    so the API layer can turn that into a clean HTTP error.
    """

    url = (url or "").strip()

    if not url:
        raise MedlinePlusError("No article URL was provided.")

    parsed = urlparse(url)

    if parsed.scheme not in ("http", "https") or not parsed.netloc.endswith(
        ALLOWED_ARTICLE_HOST_SUFFIX
    ):
        raise MedlinePlusError("Only medlineplus.gov article URLs can be fetched.")

    try:
        response = requests.get(
            url,
            timeout=timeout,
            headers={"User-Agent": "Mozilla/5.0 (compatible; HealthcareAssistant/1.0)"},
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        raise MedlinePlusError(f"Could not reach MedlinePlus: {exc}")

    soup = BeautifulSoup(response.content, "html.parser")

    title_tag = soup.find("h1")
    title = title_tag.get_text(strip=True) if title_tag else ""

    # MedlinePlus uses different container ids depending on the page type
    # (encyclopedia article vs. topic summary) — try the known ones, then
    # fall back to the whole page.
    main = (
        soup.find("div", id="ency_summary")
        or soup.find("div", id="topic-summary")
        or soup.find("main")
        or soup
    )

    paragraphs = []

    for p in main.find_all("p"):
        text = p.get_text(" ", strip=True)

        # Skip short fragments — usually nav links, captions, or ads
        # rather than actual article body text.
        if len(text) >= 40:
            paragraphs.append(text)

    if not paragraphs:
        raise MedlinePlusError("This article has no readable text to display.")

    return {
        "title": title,
        "content": paragraphs[:25],
        "url": url,
        "source": "medlineplus",
    }