from typing import List, Dict, Optional
from loguru import logger
from groq import Groq

from core.config import settings


class LLMClient:
    """Groq LLM client for all GenAI tasks in the research agent."""

    MODEL = "llama-3.1-8b-instant"

    def __init__(self):
        self._client = None

    def _get_client(self) -> Optional[Groq]:
        if self._client:
            return self._client
        if not settings.GROQ_API_KEY:
            logger.error("GROQ_API_KEY not set in .env")
            return None
        self._client = Groq(api_key=settings.GROQ_API_KEY)
        return self._client

    def _call(self, system: str, user: str, max_tokens: int = 1024) -> str:
        client = self._get_client()
        if not client:
            return ""
        try:
            response = client.chat.completions.create(
                model=self.MODEL,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                max_tokens=max_tokens,
                temperature=0.3,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Groq API call failed: {e}")
            return ""

    def decompose_topic(self, topic: str) -> List[str]:
        """Break a research topic into 4-5 targeted search queries."""
        result = self._call(
            system="You are a research expert. Return exactly 5 search queries as a newline-separated list. No numbering, no explanation.",
            user=f"Generate 5 specific academic search queries to comprehensively research: {topic}",
        )
        if not result:
            return [topic, f"{topic} survey", f"{topic} deep learning", f"{topic} benchmark", f"state of the art {topic}"]
        queries = [q.strip().lstrip("- ").lstrip("•") for q in result.split("\n") if q.strip()]
        return queries[:5] if queries else [topic]

    def generate_followup_queries(self, topic: str, gaps: List[Dict]) -> List[str]:
        """Generate targeted queries based on identified research gaps."""
        gap_text = "\n".join(f"- {g.get('topic_name', '')} ({g.get('papers_count', 0)} papers)" for g in gaps[:5])
        result = self._call(
            system="You are a research expert. Return search queries as a newline-separated list only.",
            user=f"Research topic: {topic}\n\nUnderexplored areas:\n{gap_text}\n\nGenerate 4 search queries to find papers in these gaps.",
        )
        if not result:
            return []
        return [q.strip().lstrip("- •") for q in result.split("\n") if q.strip()][:4]

    def generate_report(self, topic: str, papers: List[Dict], claims: List[Dict],
                         contradictions: List[Dict], gaps: List[Dict]) -> str:
        """Generate the final structured research report."""
        papers_summary = "\n".join(
            f"- {p.get('title', 'Unknown')} ({p.get('year', 'N/A')}) — {p.get('venue', '')} [citations: {p.get('citation_count', 0)}]"
            for p in papers[:20]
        )
        claims_sample = "\n".join(
            f"- [{c.get('paper_title', 'Unknown')}] {c.get('full_text', '')[:150]}"
            for c in claims[:15]
        )
        contradiction_summary = "\n".join(
            f"- '{c.get('paper_a_title', '')}' vs '{c.get('paper_b_title', '')}': {c.get('claim_a_text', '')[:100]} | {c.get('claim_b_text', '')[:100]}"
            for c in contradictions[:5]
        ) or "No significant contradictions detected."
        gap_summary = "\n".join(
            f"- {g.get('topic_name', '')} (only {g.get('papers_count', 0)} papers found)"
            for g in gaps[:5]
        ) or "Coverage appears comprehensive."

        prompt = f"""Write a comprehensive research report on: {topic}

PAPERS REVIEWED ({len(papers)} total):
{papers_summary}

KEY CLAIMS FROM PAPERS:
{claims_sample}

CONTRADICTIONS DETECTED:
{contradiction_summary}

RESEARCH GAPS:
{gap_summary}

Write the report with these sections:
1. Executive Summary (3-4 sentences)
2. Background & Context
3. Key Findings (by subtopic)
4. Contradictions in the Literature
5. Research Gaps & Open Problems
6. Recommended Next Steps

Use citations like [Author Year] throughout. Be concise but comprehensive."""

        report = self._call(
            system="You are a senior research analyst writing a formal literature review. Be precise, cite papers and identify genuine insights.",
            user=prompt,
            max_tokens=3000,
        )
        return report or f"# Research Report: {topic}\n\nReport generation failed. Please check your GROQ_API_KEY."

    def answer_query(self, query: str, context_chunks: List[Dict]) -> str:
        """Answer a user question using retrieved context (RAG)."""
        context = "\n\n".join(
            f"[{c['metadata'].get('paper_title', 'Unknown')} p.{c['metadata'].get('page_number', '?')}]\n{c['text']}"
            for c in context_chunks
        )
        return self._call(
            system="You are a research assistant. Answer based only on the provided context. Cite sources using [Title, page X].",
            user=f"Context:\n{context}\n\nQuestion: {query}",
            max_tokens=800,
        )
