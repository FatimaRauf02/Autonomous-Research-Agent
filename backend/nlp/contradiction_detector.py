import os
from typing import List, Dict, Tuple, Optional
from loguru import logger

from core.config import settings
os.environ["HF_HOME"] = settings.MODELS_CACHE_DIR
os.environ["TRANSFORMERS_CACHE"] = settings.MODELS_CACHE_DIR


class ContradictionDetector:
    """
    Detect contradictions between claims using Natural Language Inference (NLI).
    Model: facebook/bart-large-mnli — MNLI fine-tuned for ENTAILMENT/NEUTRAL/CONTRADICTION.
    Downloads to F:/research_agent/data/models_cache on first run.
    """

    MODEL_NAME = "cross-encoder/nli-deberta-v3-small"

    def __init__(self):
        self._pipeline = None
        self._loaded = False

    def _load(self):
        if self._loaded:
            return
        logger.info(f"Loading NLI model: {self.MODEL_NAME}")
        logger.info(f"Model will cache to: {settings.MODELS_CACHE_DIR}")
        try:
            from transformers import pipeline
            self._pipeline = pipeline(
                "zero-shot-classification",
                model="facebook/bart-large-mnli",
                device=-1,  # CPU
            )
            self._loaded = True
            logger.info("NLI model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load NLI model: {e}")
            self._pipeline = None
            self._loaded = True

    def check_pair(self, claim_a: str, claim_b: str) -> Dict:
        """
        Check if claim_a and claim_b contradict each other.
        Returns: {label: CONTRADICTION|NEUTRAL|ENTAILMENT, score: float}
        """
        self._load()

        if not self._pipeline:
            return {"label": "NEUTRAL", "score": 0.5, "method": "fallback"}

        
        if claim_a.strip().lower() == claim_b.strip().lower():
            return {"label": "ENTAILMENT", "score": 0.99, "method": "exact_match"}

        try:
            result = self._pipeline(
                claim_a,
                candidate_labels=["contradiction", "entailment", "neutral"],
                hypothesis_template=f"This statement contradicts: {claim_b}",
            )
            top_label = result["labels"][0].upper()
            top_score = result["scores"][0]
            return {
                "label": top_label,
                "score": round(top_score, 4),
                "method": "nli",
            }
        except Exception as e:
            logger.error(f"NLI inference failed: {e}")
            return {"label": "NEUTRAL", "score": 0.5, "method": "error"}

    def find_contradictions(
        self,
        new_claims: List[Dict],
        existing_claims: List[Dict],
        threshold: float = 0.75,
    ) -> List[Dict]:
        """
        Compare new_claims against existing_claims.
        Returns list of contradiction records above threshold.
        """
        self._load()
        contradictions = []

        logger.info(f"Checking {len(new_claims)} new claims against {len(existing_claims)} existing")

        for new_claim in new_claims:
            for existing_claim in existing_claims:
                # Skip same paper comparisons
                if new_claim.get("paper_id") == existing_claim.get("paper_id"):
                    continue

                result = self.check_pair(new_claim["full_text"], existing_claim["full_text"])

                if result["label"] == "CONTRADICTION" and result["score"] >= threshold:
                    contradictions.append({
                        "claim_a_id": new_claim.get("id", ""),
                        "claim_b_id": existing_claim.get("id", ""),
                        "claim_a_text": new_claim["full_text"],
                        "claim_b_text": existing_claim["full_text"],
                        "paper_a_title": new_claim.get("paper_title", ""),
                        "paper_b_title": existing_claim.get("paper_title", ""),
                        "paper_a_year": new_claim.get("year"),
                        "paper_b_year": existing_claim.get("year"),
                        "nli_score": result["score"],
                        "job_id": new_claim.get("job_id", ""),
                    })

        logger.info(f"Found {len(contradictions)} contradictions")
        return contradictions
