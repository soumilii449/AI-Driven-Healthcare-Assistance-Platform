"""
MedlinePlus Web Service integration
==================================

Provides broad healthcare article search and full-article retrieval from
the free NLM MedlinePlus service. No API key is required for MedlinePlus.

Regional-language translation is performed by the project's translator.py
after the English article is retrieved.
"""

import re
import requests
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup

MEDLINEPLUS_BASE_URL = "https://wsearch.nlm.nih.gov/ws/query"

_TAG_RE = re.compile(r"<[^>]+>")


def _strip_tags(text):
    if not text:
        return ""
    return _TAG_RE.sub("", text).strip()


def search_medlineplus(query, lang="en", limit=12):
    """
    Search MedlinePlus health topics for a free-text query.

    Returns:
      id, title, category, icon, summary, url, source

    The returned id is intentionally frontend-safe. The actual URL is kept
    separately and is used by the article-detail endpoint.
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
        response = requests.get(
            MEDLINEPLUS_BASE_URL,
            params=params,
            timeout=8,
            headers={"User-Agent": "AI-Healthcare-Assistance-Platform/1.0"},
        )
        response.raise_for_status()
    except requests.RequestException:
        return []

    try:
        root = ET.fromstring(response.content)
    except ET.ParseError:
        return []

    results = []

    for index, doc in enumerate(root.findall(".//document")):
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

        if not title or not url:
            continue

        results.append({
            "id": f"medlineplus-{index}-{abs(hash(url))}",
            "title": title,
            "category": "MedlinePlus Health Article",
            "icon": "BookOpen",
            "summary": (
                snippet[:500]
                if snippet
                else "Open this article to read the full healthcare information."
            ),
            "url": url,
            "source": "medlineplus",
        })

    return results[:limit]


def fetch_medlineplus_article(url):
    """
    Fetch and extract the readable article content from a MedlinePlus page.

    The function deliberately extracts article text rather than returning
    arbitrary HTML, so the frontend can safely render the content.
    """

    if not url or not url.startswith("https://medlineplus.gov/"):
        return None

    try:
        response = requests.get(
            url,
            timeout=10,
            headers={
                "User-Agent": "AI-Healthcare-Assistance-Platform/1.0"
            },
        )
        response.raise_for_status()
    except requests.RequestException:
        return None

    try:
        soup = BeautifulSoup(response.text, "html.parser")

        for element in soup([
            "script",
            "style",
            "noscript",
            "nav",
            "header",
            "footer",
            "aside",
            "form",
        ]):
            element.decompose()

        title_node = soup.find("h1")
        title = title_node.get_text(" ", strip=True) if title_node else ""

        main = (
            soup.find("main")
            or soup.find("article")
            or soup.select_one("#main")
            or soup.select_one(".main-content")
            or soup.body
        )

        if main is None:
            return None

        paragraphs = []

        for node in main.find_all(["p", "li"]):
            text = node.get_text(" ", strip=True)
            text = re.sub(r"\s+", " ", text).strip()

            if len(text) < 20:
                continue

            if text not in paragraphs:
                paragraphs.append(text)

        content = "\n\n".join(paragraphs)

        if not content:
            return None

        # Keep the article readable and prevent an unexpectedly huge
        # translation request. The translator itself chunks the text.
        content = content[:18000]

        return {
            "title": title,
            "content": content,
            "url": url,
            "source": "medlineplus",
        }

    except Exception:
        return None
