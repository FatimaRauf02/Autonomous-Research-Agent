import arxiv
import httpx
import asyncio
from pathlib import Path
from typing import List, Dict, Optional
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential

from core.config import settings


class ArxivFetcher:
    def __init__(self):
        self.papers_dir = Path(settings.PAPERS_DIR)
        self.papers_dir.mkdir(parents=True, exist_ok=True)

    def search(self, query: str, max_results: int = 10) -> List[Dict]:
        logger.info(f"Searching arXiv: '{query}' (max {max_results})")
        client = arxiv.Client()
        search = arxiv.Search(query=query, max_results=max_results, sort_by=arxiv.SortCriterion.Relevance)
        papers = []
        for result in client.results(search):
            papers.append({
                "arxiv_id": result.entry_id.split("/")[-1],
                "title": result.title,
                "authors": [a.name for a in result.authors],
                "abstract": result.summary,
                "year": result.published.year,
                "venue": "arXiv",
                "citation_count": 0,
                "pdf_url": result.pdf_url,
                "source": "arxiv",
            })
        logger.info(f"Found {len(papers)} papers on arXiv")
        # Enrich with citation counts from Semantic Scholar (no key needed)
        try:
            papers = asyncio.run(self._enrich_citations(papers))
        except Exception as e:
            logger.warning(f"Citation enrichment failed (non-critical): {e}")
        return papers

    async def _enrich_citations(self, papers: List[Dict]) -> List[Dict]:
        """Fetch citation counts from Semantic Scholar public API (no key needed)."""
        async with httpx.AsyncClient(timeout=15) as client:
            for paper in papers:
                try:
                    arxiv_id = paper.get("arxiv_id", "")
                    if not arxiv_id:
                        continue
                    resp = await client.get(
                        f"https://api.semanticscholar.org/graph/v1/paper/arXiv:{arxiv_id}",
                        params={"fields": "citationCount,influentialCitationCount"},
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        paper["citation_count"] = data.get("citationCount", 0) or 0
                    await asyncio.sleep(1.1)  # respect 1 req/sec rate limit
                except Exception as e:
                    logger.debug(f"Citation fetch skipped for {paper.get('arxiv_id')}: {e}")
        return papers

    def download_pdf(self, arxiv_id: str, pdf_url: str) -> Optional[str]:
        safe_id = arxiv_id.replace("/", "_")
        pdf_path = self.papers_dir / f"{safe_id}.pdf"
        if pdf_path.exists():
            logger.info(f"PDF already cached: {pdf_path}")
            return str(pdf_path)
        try:
            logger.info(f"Downloading PDF: {arxiv_id}")
            client = arxiv.Client()
            search = arxiv.Search(id_list=[arxiv_id])
            result = next(client.results(search))
            result.download_pdf(dirpath=str(self.papers_dir), filename=f"{safe_id}.pdf")
            return str(pdf_path)
        except Exception as e:
            logger.error(f"PDF download failed for {arxiv_id}: {e}")
            return None


class SemanticScholarFetcher:
    BASE_URL = "https://api.semanticscholar.org/graph/v1"

    def __init__(self):
        self.headers = {}
        if hasattr(settings, 'SEMANTIC_SCHOLAR_API_KEY') and settings.SEMANTIC_SCHOLAR_API_KEY:
            self.headers["x-api-key"] = settings.SEMANTIC_SCHOLAR_API_KEY

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def search(self, query: str, max_results: int = 10) -> List[Dict]:
        logger.info(f"Searching Semantic Scholar: '{query}'")
        fields = "title,authors,year,abstract,citationCount,venue,externalIds"
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(
                f"{self.BASE_URL}/paper/search",
                params={"query": query, "limit": max_results, "fields": fields},
                headers=self.headers,
            )
            resp.raise_for_status()
            data = resp.json()
        papers = []
        for p in data.get("data", []):
            papers.append({
                "arxiv_id": p.get("externalIds", {}).get("ArXiv", ""),
                "title": p.get("title", ""),
                "authors": [a.get("name", "") for a in p.get("authors", [])],
                "abstract": p.get("abstract", ""),
                "year": p.get("year"),
                "venue": p.get("venue", ""),
                "citation_count": p.get("citationCount", 0),
                "source": "semantic_scholar",
            })
        return papers


class PubMedFetcher:
    ESEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
    ESUMMARY_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"

    async def search(self, query: str, max_results: int = 10) -> List[Dict]:
        logger.info(f"Searching PubMed: '{query}'")
        async with httpx.AsyncClient(timeout=30) as client:
            search_resp = await client.get(self.ESEARCH_URL, params={"db":"pubmed","term":query,"retmax":max_results,"retmode":"json","sort":"relevance"})
            search_resp.raise_for_status()
            ids = search_resp.json().get("esearchresult", {}).get("idlist", [])
            if not ids:
                return []
            sum_resp = await client.get(self.ESUMMARY_URL, params={"db":"pubmed","id":",".join(ids),"retmode":"json"})
            sum_resp.raise_for_status()
            summaries = sum_resp.json().get("result", {})
        papers = []
        for pmid in ids:
            s = summaries.get(pmid, {})
            papers.append({
                "arxiv_id": f"pmid_{pmid}",
                "title": s.get("title", ""),
                "authors": [a.get("name","") for a in s.get("authors",[])],
                "abstract": "",
                "year": int(s.get("pubdate","0")[:4]) if s.get("pubdate") else None,
                "venue": s.get("source","PubMed"),
                "citation_count": 0,
                "source": "pubmed",
            })
        return papers