import os
from pathlib import Path
from typing import List, Dict, Optional
from loguru import logger

from core.config import settings
os.environ["HF_HOME"] = settings.MODELS_CACHE_DIR
os.environ["SENTENCE_TRANSFORMERS_HOME"] = settings.MODELS_CACHE_DIR


class VectorStore:
    """ChromaDB vector store. Data persisted to F:/research_agent/data/chroma"""

    COLLECTION_NAME = "research_papers"

    def __init__(self):
        self._client = None
        self._collection = None
        self._embed_model = None

    def _load(self):
        if self._client:
            return
        logger.info(f"Initializing ChromaDB at: {settings.CHROMA_DIR}")
        import chromadb
        from chromadb.config import Settings as ChromaSettings
        from sentence_transformers import SentenceTransformer

        self._client = chromadb.PersistentClient(
            path=settings.CHROMA_DIR,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        self._collection = self._client.get_or_create_collection(
            name=self.COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
        logger.info("Loading sentence-transformer embedding model...")
        self._embed_model = SentenceTransformer(
            "all-MiniLM-L6-v2",
            cache_folder=settings.MODELS_CACHE_DIR,
        )
        logger.info(f"ChromaDB ready. Collection docs: {self._collection.count()}")

    def add_chunks(self, chunks: List[Dict], paper_id: str, paper_title: str, job_id: str):
        self._load()
        if not chunks:
            return

        texts = [c["text"] for c in chunks]
        embeddings = self._embed_model.encode(texts, show_progress_bar=False).tolist()

        ids = [f"{paper_id}_chunk_{c['chunk_index']}" for c in chunks]
        metadatas = [
            {
                "paper_id": paper_id,
                "paper_title": paper_title,
                "chunk_index": c["chunk_index"],
                "page_number": c.get("page_number", 0),
                "job_id": job_id,
            }
            for c in chunks
        ]

        # Upsert to avoid duplicates
        self._collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas,
        )
        logger.info(f"Indexed {len(chunks)} chunks for paper {paper_id}")

    def query(self, query_text: str, top_k: int = 20, job_id: str = None) -> List[Dict]:
        self._load()
        query_embedding = self._embed_model.encode([query_text]).tolist()

        where = {"job_id": job_id} if job_id else None

        results = self._collection.query(
            query_embeddings=query_embedding,
            n_results=min(top_k, self._collection.count() or 1),
            where=where,
            include=["documents", "metadatas", "distances"],
        )

        output = []
        for i, doc in enumerate(results["documents"][0]):
            output.append({
                "text": doc,
                "metadata": results["metadatas"][0][i],
                "score": 1 - results["distances"][0][i],  # cosine similarity
                "source": "dense",
            })
        return output


class BM25Retriever:
    """BM25 keyword search over paper chunks."""

    def __init__(self):
        self._index: Dict[str, List[Dict]] = {}  # job_id -> chunks

    def index_chunks(self, chunks: List[Dict], paper_id: str, paper_title: str, job_id: str):
        if job_id not in self._index:
            self._index[job_id] = []
        for c in chunks:
            self._index[job_id].append({
                "text": c["text"],
                "paper_id": paper_id,
                "paper_title": paper_title,
                "chunk_index": c["chunk_index"],
                "page_number": c.get("page_number", 0),
            })

    def query(self, query_text: str, top_k: int = 20, job_id: str = None) -> List[Dict]:
        try:
            from rank_bm25 import BM25Okapi
        except ImportError:
            return []

        corpus = self._index.get(job_id, [])
        if not corpus:
            all_docs = []
            for docs in self._index.values():
                all_docs.extend(docs)
            corpus = all_docs

        if not corpus:
            return []

        tokenized_corpus = [doc["text"].lower().split() for doc in corpus]
        bm25 = BM25Okapi(tokenized_corpus)
        query_tokens = query_text.lower().split()
        scores = bm25.get_scores(query_tokens)

        ranked = sorted(
            zip(scores, corpus),
            key=lambda x: x[0],
            reverse=True,
        )[:top_k]

        return [
            {
                "text": doc["text"],
                "metadata": {
                    "paper_id": doc["paper_id"],
                    "paper_title": doc["paper_title"],
                    "chunk_index": doc["chunk_index"],
                    "page_number": doc["page_number"],
                    "job_id": job_id,
                },
                "score": float(score),
                "source": "bm25",
            }
            for score, doc in ranked
            if score > 0
        ]


class CrossEncoderReranker:
    """Re-rank merged results using a cross-encoder model."""

    MODEL_NAME = "cross-encoder/ms-marco-MiniLM-L-6-v2"

    def __init__(self):
        self._model = None

    def _load(self):
        if self._model:
            return
        logger.info("Loading cross-encoder reranker...")
        try:
            from sentence_transformers import CrossEncoder
            self._model = CrossEncoder(
                self.MODEL_NAME,
                max_length=512,
                device="cpu",
            )
            logger.info("Cross-encoder loaded")
        except Exception as e:
            logger.error(f"Cross-encoder load failed: {e}")

    def rerank(self, query: str, results: List[Dict], top_k: int = 5) -> List[Dict]:
        self._load()
        if not self._model or not results:
            return results[:top_k]

        pairs = [(query, r["text"]) for r in results]
        try:
            scores = self._model.predict(pairs)
            for i, r in enumerate(results):
                r["rerank_score"] = float(scores[i])
            results.sort(key=lambda x: x.get("rerank_score", 0), reverse=True)
        except Exception as e:
            logger.error(f"Reranking failed: {e}")

        return results[:top_k]


class HybridRetriever:
    """Merge dense + BM25 results, then rerank with cross-encoder."""

    def __init__(self):
        self.vector_store = VectorStore()
        self.bm25 = BM25Retriever()
        self.reranker = CrossEncoderReranker()

    def add_chunks(self, chunks: List[Dict], paper_id: str, paper_title: str, job_id: str):
        self.vector_store.add_chunks(chunks, paper_id, paper_title, job_id)
        self.bm25.index_chunks(chunks, paper_id, paper_title, job_id)

    def query(self, query_text: str, top_k: int = None, job_id: str = None) -> List[Dict]:
        top_k = top_k or settings.RERANK_TOP_K
        k_fetch = settings.TOP_K_RETRIEVAL

        dense_results = self.vector_store.query(query_text, top_k=k_fetch, job_id=job_id)
        bm25_results = self.bm25.query(query_text, top_k=k_fetch, job_id=job_id)

        # Merge, deduplicate by text
        seen_texts = set()
        merged = []
        for r in dense_results + bm25_results:
            key = r["text"][:200]
            if key not in seen_texts:
                seen_texts.add(key)
                merged.append(r)

        reranked = self.reranker.rerank(query_text, merged, top_k=top_k)
        return reranked
