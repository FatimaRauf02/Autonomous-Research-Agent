"""
Shared utility functions used across the research agent backend.
"""
import re
import hashlib
from typing import List, Dict, Any, Optional
from datetime import datetime


def clean_text(text: str) -> str:
    """Remove excessive whitespace, control chars, and LaTeX artifacts."""
    if not text:
        return ""
   
    text = re.sub(r'\\[a-zA-Z]+\{[^}]*\}', '', text)
    text = re.sub(r'\$[^$]*\$', '[formula]', text)
    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text)
    # Remove non-printable chars
    text = ''.join(c for c in text if c.isprintable() or c in '\n\t')
    return text.strip()


def deduplicate_papers(papers: List[Dict]) -> List[Dict]:
    """Remove duplicate papers by arxiv_id or title similarity."""
    seen_ids = set()
    seen_title_hashes = set()
    unique = []

    for p in papers:
        arxiv_id = p.get("arxiv_id", "")
        title = p.get("title", "").lower().strip()
        title_hash = hashlib.md5(title.encode()).hexdigest()

        if arxiv_id and arxiv_id in seen_ids:
            continue
        if title_hash in seen_title_hashes:
            continue

        if arxiv_id:
            seen_ids.add(arxiv_id)
        seen_title_hashes.add(title_hash)
        unique.append(p)

    return unique


def truncate_text(text: str, max_chars: int = 500) -> str:
    """Truncate text to max_chars, ending on a word boundary."""
    if len(text) <= max_chars:
        return text
    truncated = text[:max_chars]
    last_space = truncated.rfind(' ')
    return (truncated[:last_space] if last_space > 0 else truncated) + "..."


def format_authors(authors: List[str], max_authors: int = 3) -> str:
    """Format author list for display."""
    if not authors:
        return "Unknown authors"
    if len(authors) <= max_authors:
        return ", ".join(authors)
    return ", ".join(authors[:max_authors]) + f" et al. (+{len(authors) - max_authors})"


def estimate_reading_time(text: str) -> int:
    """Estimate reading time in minutes (avg 200 words/min)."""
    word_count = len(text.split())
    return max(1, round(word_count / 200))


def sanitize_filename(name: str) -> str:
    """Make a string safe for use as a filename."""
    safe = re.sub(r'[^\w\s-]', '', name)
    safe = re.sub(r'[\s]+', '_', safe)
    return safe[:100].lower()


def chunk_list(lst: List[Any], size: int) -> List[List[Any]]:
    """Split a list into chunks of given size."""
    return [lst[i:i + size] for i in range(0, len(lst), size)]


def extract_year_from_date(date_str: str) -> Optional[int]:
    """Try to extract a 4-digit year from various date string formats."""
    if not date_str:
        return None
    match = re.search(r'\b(19|20)\d{2}\b', str(date_str))
    return int(match.group()) if match else None


def score_paper_relevance(paper: Dict, topic: str) -> float:
    """
    Simple relevance score for a paper given a topic.
    Used to sort papers before processing.
    """
    score = 0.0
    topic_words = set(topic.lower().split())
    title = paper.get("title", "").lower()
    abstract = paper.get("abstract", "").lower()

    for word in topic_words:
        if len(word) < 4:
            continue
        if word in title:
            score += 2.0
        if word in abstract:
            score += 1.0

    # Boost highly cited papers
    citations = paper.get("citation_count", 0)
    if citations > 100:
        score += 2.0
    elif citations > 10:
        score += 1.0

    # Slight recency boost
    year = paper.get("year", 2000)
    if year and year >= 2022:
        score += 1.0
    elif year and year >= 2020:
        score += 0.5

    return round(score, 2)


def build_report_metadata(job_id: str, topic: str, papers: List[Dict],
                           claims: List[Dict], contradictions: List[Dict]) -> Dict:
    """Build metadata dict for report header."""
    return {
        "job_id": job_id,
        "topic": topic,
        "generated_at": datetime.utcnow().isoformat(),
        "stats": {
            "papers_count": len(papers),
            "claims_count": len(claims),
            "contradictions_count": len(contradictions),
            "sources": list({p.get("source", "arxiv") for p in papers}),
            "year_range": _year_range(papers),
        }
    }


def _year_range(papers: List[Dict]) -> str:
    years = [p.get("year") for p in papers if p.get("year")]
    if not years:
        return "Unknown"
    return f"{min(years)}–{max(years)}"
