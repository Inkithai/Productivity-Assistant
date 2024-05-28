"""Extractive note summarisation with an optional LLM path.

The offline algorithm is a simple frequency scorer: sentences that share words
with the rest of the note carry the most information. It is deterministic,
which also makes it easy to test.
"""

import json
import logging
import re

from app.services.llm_client import LLMClient, LLMError

logger = logging.getLogger(__name__)

SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?])\s+|\n+")
TOKEN_RE = re.compile(r"[a-zA-Z']+")

STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "been", "but", "by", "can",
    "could", "did", "do", "does", "for", "from", "had", "has", "have", "he",
    "her", "his", "how", "i", "if", "in", "into", "is", "it", "its", "just",
    "me", "more", "my", "no", "not", "of", "on", "or", "our", "out", "she",
    "should", "so", "some", "than", "that", "the", "their", "them", "then",
    "there", "they", "this", "to", "too", "up", "us", "very", "was", "we",
    "were", "what", "when", "which", "who", "why", "will", "with", "would",
    "you", "your",
}

SYSTEM_PROMPT = (
    "You summarise notes. Reply with a single JSON object with keys: "
    "summary (two or three sentences) and key_points (list of 3-6 short "
    "bullet strings, each a standalone fact)."
)


def _sentences(text):
    parts = [part.strip() for part in SENTENCE_SPLIT_RE.split(text)]
    return [part for part in parts if len(part) > 2]


def _tokenize(sentence):
    return [token for token in TOKEN_RE.findall(sentence.lower()) if token not in STOPWORDS]


def _summarize_with_rules(text, max_points):
    sentences = _sentences(text)
    if len(sentences) <= max_points:
        return sentences[:max_points], "rules"

    frequencies = {}
    for sentence in sentences:
        for token in _tokenize(sentence):
            frequencies[token] = frequencies.get(token, 0) + 1
    if not frequencies:
        return sentences[:max_points], "rules"

    peak = max(frequencies.values())
    for token in frequencies:
        frequencies[token] /= peak

    scored = []
    for index, sentence in enumerate(sentences):
        tokens = _tokenize(sentence)
        if not tokens:
            scored.append((0.0, index))
            continue
        average = sum(frequencies[token] for token in tokens) / len(tokens)
        # small nudge so the opening sentence is not always skipped
        if index == 0:
            average *= 1.1
        scored.append((average, index))

    top_indices = sorted(
        sorted(scored, reverse=True)[:max_points], key=lambda pair: pair[1]
    )
    return [sentences[index] for _, index in top_indices], "rules"


def _summarize_with_llm(text, max_points, client):
    raw = client.chat(
        [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"Summarise this note in at most {max_points} key points:\n\n{text}",
            },
        ],
        json_mode=True,
        temperature=0.2,
    )
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as err:
        raise LLMError(f"model returned invalid JSON: {err}") from err

    key_points = [str(point).strip() for point in (data.get("key_points") or []) if str(point).strip()]
    summary = str(data.get("summary") or "").strip()
    if not key_points or not summary:
        raise LLMError("model returned an incomplete summary")
    return summary, key_points, "openai"


def summarize(text, max_points=5, client=None):
    client = client or LLMClient()

    if client.enabled:
        try:
            summary, key_points, provider = _summarize_with_llm(text, max_points, client)
        except LLMError as err:
            logger.warning("LLM summarisation failed (%s), falling back to rules", err)
        else:
            return {"summary": summary, "key_points": key_points, "provider": provider}

    key_points, provider = _summarize_with_rules(text, max_points)
    return {
        "summary": " ".join(key_points[:2]),
        "key_points": key_points,
        "provider": provider,
    }
