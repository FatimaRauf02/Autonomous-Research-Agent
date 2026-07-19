"""
Scheduled arXiv monitor.
Runs as a background Celery beat task.
Watches arXiv RSS feeds for new papers matching saved topics.
Sends alerts when new papers contradict existing knowledge or fill gaps.
"""
import httpx
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
from typing import List, Dict
from loguru import logger

from core.celery_app import celery_app
from core.config import settings


ARXIV_RSS_BASE = "https://rss.arxiv.org/rss"


TOPIC_TO_CATEGORY = {
    "machine learning": "cs.LG",
    "deep learning": "cs.LG",
    "nlp": "cs.CL",
    "computer vision": "cs.CV",
    "robotics": "cs.RO",
    "reinforcement learning": "cs.AI",
    "default": "cs.AI",
}


def get_arxiv_category(topic: str) -> str:
    topic_lower = topic.lower()
    for key, cat in TOPIC_TO_CATEGORY.items():
        if key in topic_lower:
            return cat
    return TOPIC_TO_CATEGORY["default"]


async def fetch_rss_papers(category: str, max_papers: int = 20) -> List[Dict]:
    """Fetch latest papers from arXiv RSS feed."""
    url = f"{ARXIV_RSS_BASE}/{category}"
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.get(url)
            resp.raise_for_status()
    except Exception as e:
        logger.error(f"RSS fetch failed for {category}: {e}")
        return []

    papers = []
    root = ET.fromstring(resp.text)
    ns = {"dc": "http://purl.org/dc/elements/1.1/"}

    for item in root.findall(".//item")[:max_papers]:
        title_el = item.find("title")
        desc_el = item.find("description")
        link_el = item.find("link")
        date_el = item.find("pubDate")

        papers.append({
            "title": title_el.text.strip() if title_el is not None else "",
            "abstract": desc_el.text.strip() if desc_el is not None else "",
            "url": link_el.text.strip() if link_el is not None else "",
            "published": date_el.text if date_el is not None else "",
            "source": "arxiv_rss",
        })

    logger.info(f"RSS: {len(papers)} new papers from {category}")
    return papers


@celery_app.task(name="scheduler.monitor.check_new_papers")
def check_new_papers(topic: str, job_id: str = None):
    """
    Celery task: check arXiv RSS for new papers on a topic.
    Run this on a schedule (e.g. daily) using Celery beat.
    """
    import asyncio
    category = get_arxiv_category(topic)
    papers = asyncio.run(fetch_rss_papers(category))

    if not papers:
        return {"checked": 0, "new": 0}

    logger.info(f"Monitor: found {len(papers)} recent papers for topic '{topic}'")


    new_contradictions = 0
    if job_id:
        try:
            from nlp.contradiction_detector import ContradictionDetector
            detector = ContradictionDetector()
            # Build simple claims from abstracts
            new_claims = [
                {"paper_id": f"rss_{i}", "paper_title": p["title"],
                 "full_text": p["abstract"][:500], "year": datetime.now().year,
                 "job_id": job_id}
                for i, p in enumerate(papers)
                if p["abstract"]
            ]
          
            from core.models import SessionLocal, Claim
            db = SessionLocal()
            existing = db.query(Claim).filter(Claim.job_id == job_id).limit(50).all()
            db.close()
            existing_claims = [
                {"paper_id": c.paper_id, "paper_title": c.paper_title,
                 "full_text": c.full_text, "year": c.year, "id": c.id}
                for c in existing
            ]
            contradictions = detector.find_contradictions(new_claims, existing_claims)
            new_contradictions = len(contradictions)
            if contradictions:
                logger.warning(f"Monitor: {new_contradictions} contradictions found with new papers!")
        except Exception as e:
            logger.error(f"Monitor contradiction check failed: {e}")

    return {
        "topic": topic,
        "checked": len(papers),
        "new_contradictions": new_contradictions,
        "latest_titles": [p["title"] for p in papers[:5]],
        "checked_at": datetime.utcnow().isoformat(),
    }


