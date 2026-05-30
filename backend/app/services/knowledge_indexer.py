"""Chunk, store, and TF-IDF-search knowledge documents using the knowledge_chunks table."""
from __future__ import annotations

import logging
import math
import re
import uuid
from collections import Counter
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

log = logging.getLogger(__name__)


# ── Text chunking ────────────────────────────────────────────────────────────

def chunk_text(text: str, chunk_size: int = 800, overlap: int = 100) -> list[str]:
    """Split *text* into overlapping fixed-size chunks."""
    text = text.strip()
    if not text:
        return []
    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunks.append(text[start:end])
        if end == len(text):
            break
        start = end - overlap
    return chunks


# ── Indexing ─────────────────────────────────────────────────────────────────

def index_document(
    tenant_id: str,
    doc_id: str,
    title: str,
    text: str,
    db: "Session",
) -> int:
    """Store all text chunks for *doc_id* in knowledge_chunks table.

    Returns the number of chunks stored.
    """
    from app.models.knowledge import KnowledgeChunk
    from sqlalchemy import delete

    # Delete old chunks for this document first (re-indexing case)
    try:
        db.execute(
            delete(KnowledgeChunk).where(
                KnowledgeChunk.tenant_id == tenant_id,
                KnowledgeChunk.doc_id == doc_id,
            )
        )
    except Exception as exc:
        log.warning("Could not delete old chunks for %s: %s", doc_id, exc)

    chunks = chunk_text(text)
    if not chunks:
        return 0

    for idx, chunk in enumerate(chunks):
        kc = KnowledgeChunk(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            doc_id=doc_id,
            title=title,
            chunk_index=idx,
            text=chunk,
            tokens=_tokenize(chunk),
        )
        db.add(kc)

    db.flush()
    log.info("Indexed %d chunks for doc %s (tenant %s)", len(chunks), doc_id, tenant_id)
    return len(chunks)


# ── TF-IDF search ─────────────────────────────────────────────────────────────

def search_knowledge(
    query: str,
    tenant_id: str,
    db: "Session",
    top_k: int = 5,
) -> list[dict]:
    """Return *top_k* most relevant knowledge chunks for *query*."""
    from app.models.knowledge import KnowledgeChunk
    from sqlalchemy import select

    rows = db.scalars(
        select(KnowledgeChunk).where(
            KnowledgeChunk.tenant_id == tenant_id,
        ).limit(2000)
    ).all()

    if not rows:
        return []

    q_tokens = _tokenize(query)
    if not q_tokens:
        return []

    # Build corpus from stored token lists for IDF
    corpus: list[list[str]] = []
    for row in rows:
        tok = row.tokens
        if isinstance(tok, list):
            corpus.append(tok)
        else:
            corpus.append(_tokenize(row.text or ""))

    idf = _compute_idf(corpus)

    q_tf = _term_freq(q_tokens)
    q_vec = {t: q_tf[t] * idf.get(t, 0.0) for t in q_tf}

    scored: list[tuple[float, KnowledgeChunk]] = []
    for row, doc_tokens in zip(rows, corpus):
        d_tf = _term_freq(doc_tokens)
        d_vec = {t: d_tf[t] * idf.get(t, 0.0) for t in d_tf}
        score = _cosine(q_vec, d_vec)
        if score > 0:
            scored.append((score, row))

    scored.sort(key=lambda x: x[0], reverse=True)

    results = []
    for score, row in scored[:top_k]:
        results.append({
            "doc_id": row.doc_id,
            "title": row.title or "Unknown",
            "text": row.text or "",
            "chunk_index": row.chunk_index,
            "score": round(score, 4),
        })

    return results


# ── Private helpers ──────────────────────────────────────────────────────────

def _tokenize(text: str) -> list[str]:
    """Lowercase, strip punctuation, split on whitespace."""
    return re.findall(r"[a-z0-9]+", (text or "").lower())


def _term_freq(tokens: list[str]) -> dict[str, float]:
    if not tokens:
        return {}
    counts = Counter(tokens)
    total = len(tokens)
    return {t: c / total for t, c in counts.items()}


def _compute_idf(corpus: list[list[str]]) -> dict[str, float]:
    n = len(corpus)
    if n == 0:
        return {}
    df: Counter = Counter()
    for doc in corpus:
        for term in set(doc):
            df[term] += 1
    return {term: math.log((n + 1) / (freq + 1)) + 1.0 for term, freq in df.items()}


def _cosine(a: dict[str, float], b: dict[str, float]) -> float:
    shared = set(a) & set(b)
    if not shared:
        return 0.0
    dot = sum(a[t] * b[t] for t in shared)
    norm_a = math.sqrt(sum(v * v for v in a.values()))
    norm_b = math.sqrt(sum(v * v for v in b.values()))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)
