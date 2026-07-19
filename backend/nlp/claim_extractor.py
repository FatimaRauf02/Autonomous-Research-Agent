import os
from pathlib import Path
from typing import List, Dict, Tuple
from loguru import logger


from core.config import settings
os.environ["HF_HOME"] = settings.MODELS_CACHE_DIR
os.environ["TRANSFORMERS_CACHE"] = settings.MODELS_CACHE_DIR

import spacy
from transformers import pipeline, AutoTokenizer, AutoModelForTokenClassification
import torch


class ClaimExtractor:
    """
    Extract factual claims (subject → predicate → object) from scientific text.
    Uses spaCy for dependency parsing + constituency for triple extraction.
    Falls back to sentence-level extraction if no triples found.
    """

    def __init__(self):
        self._nlp = None
        self._loaded = False

    def _load(self):
        if self._loaded:
            return
        logger.info("Loading spaCy model (en_core_web_sm)...")
        try:
            self._nlp = spacy.load("en_core_web_sm")
        except OSError:
            logger.warning("spaCy model not found. Run: python -m spacy download en_core_web_sm")
            self._nlp = None
        self._loaded = True

    def extract_claims(self, text: str, paper_title: str, paper_id: str,
                        year: int = None, chunk_index: int = 0, page: int = 0) -> List[Dict]:
        self._load()
        if not self._nlp:
            return self._fallback_sentences(text, paper_title, paper_id, year, chunk_index, page)

        doc = self._nlp(text[:5000]) 
        claims = []

        for sent in doc.sents:
            if len(sent.text.strip()) < 20:
                continue

            triples = self._extract_triples(sent)
            if triples:
                for subj, pred, obj in triples:
                    if len(subj) > 2 and len(obj) > 2:
                        claims.append({
                            "paper_id": paper_id,
                            "paper_title": paper_title,
                            "subject": subj,
                            "predicate": pred,
                            "obj": obj,
                            "full_text": sent.text.strip(),
                            "confidence": self._score_claim(sent.text),
                            "chunk_index": chunk_index,
                            "page_number": page,
                            "year": year,
                        })
            else:
                
                if self._is_claim_sentence(sent.text):
                    main_verb = self._get_main_verb(sent)
                    subj = self._get_subject(sent)
                    obj = sent.text[len(subj) + len(main_verb):][:100].strip()
                    claims.append({
                        "paper_id": paper_id,
                        "paper_title": paper_title,
                        "subject": subj or sent.text[:50],
                        "predicate": main_verb or "states",
                        "obj": obj or sent.text[-80:],
                        "full_text": sent.text.strip(),
                        "confidence": 0.4,
                        "chunk_index": chunk_index,
                        "page_number": page,
                        "year": year,
                    })

        return claims[:20]  

    def _extract_triples(self, sent) -> List[Tuple[str, str, str]]:
        """Extract SPO triples using dependency parse."""
        triples = []
        for token in sent:
            if token.dep_ in ("ROOT", "relcl") and token.pos_ == "VERB":
                subj_tokens = [t for t in token.subtree if t.dep_ in ("nsubj", "nsubjpass")]
                obj_tokens = [t for t in token.subtree if t.dep_ in ("dobj", "attr", "prep", "pobj")]
                if subj_tokens and obj_tokens:
                    subj = " ".join(t.text for t in subj_tokens[0].subtree)[:100]
                    pred = token.lemma_
                    obj = " ".join(t.text for t in obj_tokens[0].subtree)[:100]
                    triples.append((subj.strip(), pred.strip(), obj.strip()))
        return triples

    def _is_claim_sentence(self, text: str) -> bool:
        """Filter sentences likely to be factual claims."""
        claim_indicators = [
            "show", "demonstrate", "find", "propose", "achieve", "outperform",
            "improve", "reduce", "increase", "result", "conclude", "suggest",
            "indicate", "reveal", "prove", "establish", "confirm", "report",
        ]
        text_lower = text.lower()
        return any(ind in text_lower for ind in claim_indicators)

    def _score_claim(self, text: str) -> float:
        """Heuristic confidence score 0-1 based on linguistic features."""
        score = 0.5
        if any(w in text.lower() for w in ["significantly", "substantially", "clearly"]):
            score += 0.1
        if any(w in text.lower() for w in ["may", "might", "could", "possibly"]):
            score -= 0.15
        if any(c.isdigit() for c in text):  # has numbers → more specific
            score += 0.1
        return round(min(max(score, 0.0), 1.0), 3)

    def _get_main_verb(self, sent) -> str:
        for t in sent:
            if t.dep_ == "ROOT":
                return t.lemma_
        return "states"

    def _get_subject(self, sent) -> str:
        for t in sent:
            if t.dep_ in ("nsubj", "nsubjpass"):
                return " ".join(c.text for c in t.subtree)[:80]
        return ""

    def _fallback_sentences(self, text, paper_title, paper_id, year, chunk_index, page):
        sentences = [s.strip() for s in text.split(".") if len(s.strip()) > 40]
        return [
            {
                "paper_id": paper_id,
                "paper_title": paper_title,
                "subject": s[:60],
                "predicate": "states",
                "obj": s[-60:],
                "full_text": s,
                "confidence": 0.3,
                "chunk_index": chunk_index,
                "page_number": page,
                "year": year,
            }
            for s in sentences[:10]
        ]


class NERExtractor:
    """Extract named entities: people, orgs, methods, datasets."""

    def __init__(self):
        self._nlp = None

    def _load(self):
        if self._nlp:
            return
        try:
            self._nlp = spacy.load("en_core_web_sm")
        except OSError:
            self._nlp = None

    def extract(self, text: str) -> Dict[str, List[str]]:
        self._load()
        if not self._nlp:
            return {}
        doc = self._nlp(text[:5000])
        entities: Dict[str, List[str]] = {}
        for ent in doc.ents:
            label = ent.label_
            if label not in entities:
                entities[label] = []
            if ent.text not in entities[label]:
                entities[label].append(ent.text)
        return entities
