import os
from typing import List, Dict, Tuple
from loguru import logger

from core.config import settings
os.environ["HF_HOME"] = settings.MODELS_CACHE_DIR


class TopicClusterer:
    """
    Cluster papers by topic using BERTopic.
    Identify underrepresented clusters as research gaps.
    All models downloaded to F:/research_agent/data/models_cache
    """

    def __init__(self):
        self._model = None

    def _load(self):
        if self._model:
            return
        logger.info("Loading BERTopic model...")
        try:
            from bertopic import BERTopic
            from sentence_transformers import SentenceTransformer

            embedding_model = SentenceTransformer(
                "all-MiniLM-L6-v2",
                cache_folder=settings.MODELS_CACHE_DIR,
            )
            self._model = BERTopic(
                embedding_model=embedding_model,
                min_topic_size=2,
                nr_topics="auto",
                verbose=False,
            )
            logger.info("BERTopic loaded")
        except Exception as e:
            logger.error(f"BERTopic load failed: {e}")
            self._model = None

    def cluster_papers(self, papers: List[Dict]) -> Tuple[List[int], Dict]:
        """
        Cluster papers by abstract/title text.
        Returns: (topic_assignments, topic_info_dict)
        """
        self._load()
        texts = [
            f"{p.get('title', '')} {p.get('abstract', '')}"
            for p in papers
        ]
        texts = [t.strip() for t in texts if t.strip()]

        if not texts or len(texts) < 3:
            return list(range(len(papers))), {}

        if not self._model:
            return [0] * len(texts), {}

        try:
            topics, probs = self._model.fit_transform(texts)
            topic_info = self._model.get_topic_info()
            topic_dict = {}
            for _, row in topic_info.iterrows():
                tid = row["Topic"]
                if tid != -1:
                    topic_dict[str(tid)] = {
                        "count": int(row["Count"]),
                        "name": row.get("Name", f"Topic {tid}"),
                        "keywords": [w for w, _ in self._model.get_topic(tid)][:5],
                    }
            return topics, topic_dict
        except Exception as e:
            logger.error(f"BERTopic clustering failed: {e}")
            return [0] * len(texts), {}

    def identify_gaps(self, topic_info: Dict, min_papers: int = 2) -> List[Dict]:
        """
        Identify underrepresented topics as research gaps.
        Topics with fewer than min_papers = gaps.
        """
        gaps = []
        for tid, info in topic_info.items():
            if info["count"] < min_papers:
                gaps.append({
                    "topic_id": tid,
                    "topic_name": info["name"],
                    "keywords": info["keywords"],
                    "papers_count": info["count"],
                    "gap_severity": "high" if info["count"] == 1 else "medium",
                })
        gaps.sort(key=lambda x: x["papers_count"])
        return gaps

    def gaps_to_queries(self, gaps: List[Dict]) -> List[str]:
        """Convert identified gaps into search queries."""
        queries = []
        for gap in gaps[:3]:
            kws = " ".join(gap["keywords"][:3])
            queries.append(kws)
            queries.append(f"{kws} recent advances")
        return queries
