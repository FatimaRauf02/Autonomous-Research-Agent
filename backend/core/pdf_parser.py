import fitz  
from pathlib import Path
from typing import List, Dict, Optional
from loguru import logger

from core.config import settings


class PDFParser:
    """Parse PDFs into text chunks for indexing."""

    def __init__(self, chunk_size: int = None, chunk_overlap: int = None):
        self.chunk_size = chunk_size or settings.CHUNK_SIZE
        self.chunk_overlap = chunk_overlap or settings.CHUNK_OVERLAP

    def parse(self, pdf_path: str) -> List[Dict]:
        """Parse PDF into overlapping text chunks with metadata."""
        path = Path(pdf_path)
        if not path.exists():
            logger.error(f"PDF not found: {pdf_path}")
            return []

        try:
            doc = fitz.open(str(path))
        except Exception as e:
            logger.error(f"Failed to open PDF {pdf_path}: {e}")
            return []

        full_text_by_page = []
        for page_num, page in enumerate(doc):
            text = page.get_text("text")
            if text.strip():
                full_text_by_page.append({"page": page_num + 1, "text": text})

        doc.close()

        # Join all text then split into overlapping chunks
        all_text = "\n".join(p["text"] for p in full_text_by_page)
        chunks = self._chunk_text(all_text)

        result = []
        for i, chunk in enumerate(chunks):
            result.append({
                "chunk_index": i,
                "text": chunk,
                "page_number": self._estimate_page(i, len(chunks), len(full_text_by_page)),
                "char_count": len(chunk),
            })

        logger.info(f"Parsed {path.name}: {len(result)} chunks")
        return result

    def _chunk_text(self, text: str) -> List[str]:
        """Split text into overlapping chunks by word count."""
        words = text.split()
        chunks = []
        step = self.chunk_size - self.chunk_overlap
        for i in range(0, len(words), step):
            chunk_words = words[i: i + self.chunk_size]
            chunk = " ".join(chunk_words)
            if len(chunk.strip()) > 50:  # skip tiny chunks
                chunks.append(chunk)
        return chunks

    def _estimate_page(self, chunk_idx: int, total_chunks: int, total_pages: int) -> int:
        if total_chunks == 0 or total_pages == 0:
            return 1
        return max(1, round((chunk_idx / total_chunks) * total_pages))

    def extract_abstract(self, pdf_path: str) -> str:
        """Try to extract abstract section from a paper PDF."""
        chunks = self.parse(pdf_path)
        if not chunks:
            return ""
        # Abstract usually in first 2 chunks
        first_text = " ".join(c["text"] for c in chunks[:2])
        lower = first_text.lower()
        start = lower.find("abstract")
        if start == -1:
            return first_text[:800]
        intro = lower.find("introduction", start)
        end = intro if intro != -1 else start + 1200
        return first_text[start:end].strip()
