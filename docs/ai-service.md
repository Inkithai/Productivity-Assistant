# AI service

FastAPI service that powers the assistant features. It runs standalone and is
only called by the Express API server, which is the only client expected to
talk to it.

## Running locally

```bash
cd ai-service
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --port 8000
```

Interactive docs live at `http://localhost:8000/docs`.

## Provider modes

The service runs in one of two modes:

- **openai** – when `OPENAI_API_KEY` is set, all features call an
  OpenAI-compatible chat endpoint first.
- **fallback** – without a key every feature degrades to deterministic
  rule-based behaviour so the product still works offline and in CI.

Responses include a `provider` field so callers can tell which path produced
the answer.

## Endpoints

All `/api/v1` routes require the `x-service-token` header shared with the API
server.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Liveness probe (no auth) |
| POST | `/api/v1/tasks/extract` | Natural language → task suggestion |
| POST | `/api/v1/tasks/prioritize` | Score and rank open tasks |
| POST | `/api/v1/notes/summarize` | Extractive note summary + key points |
| POST | `/api/v1/assistant/chat` | Chat answers built from user context |

### POST /api/v1/tasks/extract

```json
{ "text": "remind me to prepare for my interview next friday", "timezone": "Asia/Colombo" }
```

```json
{
  "task": {
    "title": "Prepare for my interview",
    "due_date": "2024-05-24T03:30:00+00:00",
    "priority": "medium",
    "tags": [],
    "confidence": 0.75,
    "provider": "rules"
  }
}
```

### POST /api/v1/assistant/chat

The API server builds the user context (today's tasks, overdue, upcoming
deadlines, recent note titles) and posts it together with the message:

```json
{
  "message": "What do I need to finish today?",
  "context": { "today_tasks": [], "overdue": [], "upcoming": [], "recent_notes": [] },
  "history": [{ "role": "user", "content": "hi" }]
}
```

## Tests

```bash
pytest
```
