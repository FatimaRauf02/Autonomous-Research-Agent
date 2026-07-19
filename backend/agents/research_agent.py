import asyncio
from typing import TypedDict, List, Dict, Any, Annotated
from loguru import logger

from core.config import settings
from core.fetchers import ArxivFetcher, SemanticScholarFetcher
from core.pdf_parser import PDFParser
from nlp.claim_extractor import ClaimExtractor, NERExtractor
from nlp.contradiction_detector import ContradictionDetector
from nlp.topic_clusterer import TopicClusterer
from rag.retriever import HybridRetriever
from graph.knowledge_graph import KnowledgeGraph
from agents.llm_client import LLMClient


class AgentState(TypedDict):
    job_id: str
    topic: str
    queries: List[str]
    iteration: int
    papers: List[Dict]
    all_chunks: List[Dict]
    claims: List[Dict]
    contradictions: List[Dict]
    topic_gaps: List[Dict]
    report: str
    status: str
    progress: int
    current_step: str
    error: str



class ResearchAgentNodes:

    def __init__(self, progress_callback=None):
        self.arxiv = ArxivFetcher()
        self.ss_fetcher = SemanticScholarFetcher()
        self.pdf_parser = PDFParser()
        self.claim_extractor = ClaimExtractor()
        self.ner_extractor = NERExtractor()
        self.contradiction_detector = ContradictionDetector()
        self.topic_clusterer = TopicClusterer()
        self.retriever = HybridRetriever()
        self.kg = KnowledgeGraph()
        self.llm = LLMClient()
        self.progress_callback = progress_callback

    def _update(self, state: AgentState, step: str, progress: int) -> Dict:
        logger.info(f"[{state['job_id']}] Step: {step} ({progress}%)")
        if self.progress_callback:
            self.progress_callback(state["job_id"], step, progress)
        return {"current_step": step, "progress": progress, "status": "running"}


    def decompose_query(self, state: AgentState) -> AgentState:
        self._update(state, "Decomposing research topic into queries", 5)
        topic = state["topic"]

        queries = self.llm.decompose_topic(topic)
        if not queries:
            queries = [topic, f"{topic} survey", f"{topic} recent advances"]

        logger.info(f"Generated {len(queries)} sub-queries: {queries}")
        return {**state, "queries": queries, **self._update(state, "Queries generated", 10)}

  
    def search_papers(self, state: AgentState) -> AgentState:
        self._update(state, "Searching arXiv and Semantic Scholar", 15)

        all_papers = list(state.get("papers", []))
        seen_ids = {p.get("arxiv_id") for p in all_papers}
        max_per_query = max(2, settings.MAX_PAPERS_PER_JOB // len(state["queries"]))

        for query in state["queries"]:
            papers = self.arxiv.search(query, max_results=max_per_query)
            for p in papers:
                if p["arxiv_id"] not in seen_ids:
                    p["job_id"] = state["job_id"]
                    all_papers.append(p)
                    seen_ids.add(p["arxiv_id"])
                if len(all_papers) >= settings.MAX_PAPERS_PER_JOB:
                    break
            if len(all_papers) >= settings.MAX_PAPERS_PER_JOB:
                break

        logger.info(f"Total papers collected: {len(all_papers)}")
        return {**state, "papers": all_papers, **self._update(state, f"Found {len(all_papers)} papers", 25)}

  
    def ingest_papers(self, state: AgentState) -> AgentState:
        self._update(state, "Downloading and parsing PDFs", 30)

        all_chunks = list(state.get("all_chunks", []))

        for paper in state["papers"]:
            pdf_path = None
            if paper.get("pdf_url") and paper.get("arxiv_id"):
                pdf_path = self.arxiv.download_pdf(paper["arxiv_id"], paper["pdf_url"])

            if pdf_path:
                chunks = self.pdf_parser.parse(pdf_path)
            else:
                
                text = f"{paper.get('title', '')} {paper.get('abstract', '')}"
                chunks = [{"text": text, "chunk_index": 0, "page_number": 1}] if text.strip() else []

            paper_id = paper.get("arxiv_id") or paper.get("id", "")
            self.retriever.add_chunks(chunks, paper_id, paper.get("title", ""), state["job_id"])
            self.kg.add_paper(paper)

            for chunk in chunks:
                chunk["paper_id"] = paper_id
                chunk["paper_title"] = paper.get("title", "")
                chunk["year"] = paper.get("year")
                all_chunks.append(chunk)

        logger.info(f"Total chunks indexed: {len(all_chunks)}")
        return {**state, "all_chunks": all_chunks, **self._update(state, f"Indexed {len(all_chunks)} chunks", 45)}

    
    def extract_claims(self, state: AgentState) -> AgentState:
        self._update(state, "Extracting factual claims with NLP", 50)

        all_claims = list(state.get("claims", []))
        processed_papers = {c["paper_id"] for c in all_claims}

        for chunk in state["all_chunks"]:
            paper_id = chunk.get("paper_id", "")
            if paper_id in processed_papers:
                continue

            claims = self.claim_extractor.extract_claims(
                text=chunk["text"],
                paper_title=chunk.get("paper_title", ""),
                paper_id=paper_id,
                year=chunk.get("year"),
                chunk_index=chunk.get("chunk_index", 0),
                page=chunk.get("page_number", 0),
            )
            for c in claims:
                c["job_id"] = state["job_id"]
                c["id"] = f"{paper_id}_{c['chunk_index']}_{len(all_claims)}"
            all_claims.extend(claims)
            self.kg.add_claim_to_graph({"paper_id": paper_id, "subject": chunk.get("text", "")[:100], "obj": ""})

        logger.info(f"Total claims extracted: {len(all_claims)}")
        return {**state, "claims": all_claims, **self._update(state, f"Extracted {len(all_claims)} claims", 60)}

   
    def detect_contradictions(self, state: AgentState) -> AgentState:
        self._update(state, "Running NLI contradiction detection", 65)

        claims = state.get("claims", [])
        if len(claims) < 2:
            return {**state, "contradictions": []}

       
        sample = claims[:100]
        mid = len(sample) // 2
        new_claims = sample[:mid]
        existing_claims = sample[mid:]

        contradictions = self.contradiction_detector.find_contradictions(new_claims, existing_claims)

        for c in contradictions:
            c["job_id"] = state["job_id"]
            self.kg.add_contradiction(
                c.get("paper_a_title", "")[:50],
                c.get("paper_b_title", "")[:50],
                c.get("nli_score", 0.0),
            )

        logger.info(f"Contradictions found: {len(contradictions)}")
        return {**state, "contradictions": contradictions,
                **self._update(state, f"Found {len(contradictions)} contradictions", 70)}

   
    def analyze_gaps(self, state: AgentState) -> AgentState:
        self._update(state, "Clustering topics and identifying research gaps", 75)

        papers = state.get("papers", [])
        topics, topic_info = self.topic_clusterer.cluster_papers(papers)
        gaps = self.topic_clusterer.identify_gaps(topic_info)

        logger.info(f"Topic clusters: {len(topic_info)}, Gaps: {len(gaps)}")
        return {**state, "topic_gaps": gaps, **self._update(state, f"Identified {len(gaps)} research gaps", 80)}


    def adaptive_requery(self, state: AgentState) -> AgentState:
        iteration = state.get("iteration", 0)
        gaps = state.get("topic_gaps", [])

        if iteration >= settings.MAX_SEARCH_ITERATIONS or not gaps:
            return {**state, "iteration": iteration + 1}

        self._update(state, f"Generating follow-up queries (iteration {iteration + 1})", 82)
        new_queries = self.topic_clusterer.gaps_to_queries(gaps[:3])
        all_queries = list(set(state["queries"] + new_queries))

        logger.info(f"Adaptive queries added: {new_queries}")
        return {**state, "queries": all_queries, "iteration": iteration + 1,
                **self._update(state, "Added gap-filling queries", 83)}

    def generate_report(self, state: AgentState) -> AgentState:
        self._update(state, "Generating structured research report", 88)

        report = self.llm.generate_report(
            topic=state["topic"],
            papers=state["papers"],
            claims=state["claims"],
            contradictions=state["contradictions"],
            gaps=state["topic_gaps"],
        )

      
        from pathlib import Path
        import json
        from datetime import datetime

        reports_dir = Path(settings.REPORTS_DIR)
        reports_dir.mkdir(parents=True, exist_ok=True)
        report_path = reports_dir / f"{state['job_id']}.json"

        report_data = {
            "job_id": state["job_id"],
            "topic": state["topic"],
            "report": report,
            "papers_count": len(state["papers"]),
            "claims_count": len(state["claims"]),
            "contradictions_count": len(state["contradictions"]),
            "gaps_count": len(state["topic_gaps"]),
            "generated_at": datetime.utcnow().isoformat(),
            "contradictions": state["contradictions"][:20],
            "top_papers": state["papers"][:10],
            "gaps": state["topic_gaps"],
            "graph": self.kg.get_paper_network(),
            "central_concepts": self.kg.get_concept_centrality(),
        }
        report_path.write_text(json.dumps(report_data, indent=2, default=str))
        logger.info(f"Report saved to: {report_path}")

        return {**state, "report": report, "status": "done",
                **self._update(state, "Report complete", 100)}




def build_graph(progress_callback=None):
    """Build and compile the research agent LangGraph."""
    try:
        from langgraph.graph import StateGraph, END
    except ImportError:
        logger.error("langgraph not installed. Run: pip install langgraph")
        return None

    nodes = ResearchAgentNodes(progress_callback=progress_callback)

    builder = StateGraph(AgentState)

    builder.add_node("decompose_query", nodes.decompose_query)
    builder.add_node("search_papers", nodes.search_papers)
    builder.add_node("ingest_papers", nodes.ingest_papers)
    builder.add_node("extract_claims", nodes.extract_claims)
    builder.add_node("detect_contradictions", nodes.detect_contradictions)
    builder.add_node("analyze_gaps", nodes.analyze_gaps)
    builder.add_node("adaptive_requery", nodes.adaptive_requery)
    builder.add_node("generate_report", nodes.generate_report)

    builder.set_entry_point("decompose_query")
    builder.add_edge("decompose_query", "search_papers")
    builder.add_edge("search_papers", "ingest_papers")
    builder.add_edge("ingest_papers", "extract_claims")
    builder.add_edge("extract_claims", "detect_contradictions")
    builder.add_edge("detect_contradictions", "analyze_gaps")
    builder.add_edge("analyze_gaps", "adaptive_requery")
    builder.add_conditional_edges(
        "adaptive_requery",
        lambda s: "search_papers" if s["iteration"] < settings.MAX_SEARCH_ITERATIONS and s["topic_gaps"] else "generate_report",
        {"search_papers": "search_papers", "generate_report": "generate_report"},
    )
    builder.add_edge("generate_report", END)

    return builder.compile()


def run_research_job(job_id: str, topic: str, progress_callback=None) -> Dict:
    """Entry point called by Celery task."""
    graph = build_graph(progress_callback=progress_callback)
    if not graph:
        return {"error": "LangGraph failed to build"}

    initial_state = AgentState(
        job_id=job_id,
        topic=topic,
        queries=[],
        iteration=0,
        papers=[],
        all_chunks=[],
        claims=[],
        contradictions=[],
        topic_gaps=[],
        report="",
        status="running",
        progress=0,
        current_step="Starting",
        error="",
    )

    try:
        final_state = graph.invoke(initial_state)
        return {"status": "done", "report": final_state.get("report", ""), "job_id": job_id}
    except Exception as e:
        logger.error(f"Agent failed: {e}")
        return {"status": "failed", "error": str(e), "job_id": job_id}
