# Productivity Assistant

![Version](https://img.shields.io/badge/version-1.0.0-blue) ![Tests](https://img.shields.io/badge/tests-185%2B-brightgreen)

A personal productivity platform with tasks, notes, a calendar, reminders,
habits and an AI assistant that understands natural language. Built as three
services: a React client, an Express API and a FastAPI AI service.

Type `"remind me to prepare for my interview next friday"` and the assistant
turns it into a structured task with the right date. Ask `"what should I
prioritize?"` and it ranks your open work. Ask it to plan your day and you get
back-to-back focus blocks starting from your most urgent work. Search finds
notes by meaning, not just keywords.

## Features

- **Tasks** — priorities, due dates, tags, filters, overdue view, pagination,
  sharing, daily/weekly recurrence
- **Day planner** — time-blocked plan built from your open tasks
- **Data export** — download everything you own as a single JSON document
- **Quick add** — natural language input parsed into task fields
- **Notes** — categories, pinning, tags, AI summaries with key points
- **Calendar** — month view with meetings, deadlines and events
- **Reminders** — scheduled dispatch, live notifications via Socket.IO, snooze
- **AI assistant** — chat grounded in your own tasks and notes
- **Semantic search** — embeddings across tasks and notes (OpenAI or offline
  fallback embeddings)
- **Analytics** — completion rate, weekly and monthly trends, workload by tag
- **Habits** — weekly targets and streaks
- **Focus timer** — pomodoro blocks logged to your history
- **Dark mode**, responsive layout, keyboard-friendly navigation

## Architecture

```
┌────────────┐     REST + Socket.IO      ┌────────────┐     HTTP      ┌────────────┐
│   client   │ ────────────────────────▶ │   server   │ ────────────▶ │ ai-service │
│ React/Vite │                           │ Express    │               │ FastAPI    │
│            │                           │ MongoDB    │               │ LLM +      │
└────────────┘                           └────────────┘               │ fallbacks  │
                                                                      └────────────┘
```

The AI service is internal: it is only reachable from the API server and
requires a shared service token. Every AI feature works without an OpenAI key
by falling back to deterministic, rule-based implementations — useful for
development, CI and offline use.

## Tech stack

| Layer | Choices |
| --- | --- |
| Client | React 18, Vite, react-router, recharts, socket.io-client, Vitest + Testing Library |
| API | Node 20, Express 4, Mongoose 8 (MongoDB), JWT + bcrypt, zod, Socket.IO, Jest + Supertest |
| AI | FastAPI, Pydantic v2, OpenAI-compatible client, pytest |

## Getting started

Prerequisites: Node 20+, Python 3.11+, MongoDB (local or Atlas).

```bash
# 1. API server
cd server
cp .env.example .env
npm install
npm run dev            # http://localhost:4000

# 2. AI service
cd ai-service
cp .env.example .env
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload   # http://localhost:8000

# 3. Client
cd client
cp .env.example .env
npm install
npm run dev            # http://localhost:5173
```

Or run the whole stack with Docker:

```bash
docker compose up --build
```

The client is available on `http://localhost:8080`, the API on `:4000`.

## Environment variables

**server/.env**

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP port (default 4000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Token signing secret — set a strong value in production |
| `JWT_EXPIRES_IN` | Token lifetime (default `7d`) |
| `CLIENT_ORIGIN` | Allowed CORS origin for the client |
| `AI_SERVICE_URL` | Base URL of the AI service |
| `AI_SERVICE_TOKEN` | Shared secret for service-to-service calls |
| `AI_SERVICE_TIMEOUT_MS` | Gateway timeout (default 25000) |

**ai-service/.env**

| Variable | Purpose |
| --- | --- |
| `AI_SERVICE_TOKEN` | Must match the server's token |
| `SERVER_URL` | Express API base URL |
| `OPENAI_API_KEY` | Optional; empty key enables offline fallback mode |
| `OPENAI_MODEL` | Chat model (default `gpt-4o-mini`) |
| `EMBEDDING_MODEL` | Embedding model (default `text-embedding-3-small`) |

## Tests

```bash
cd server  && npm test    # Jest + Supertest against an in-memory MongoDB
cd client  && npm test    # Vitest + Testing Library
cd ai-service && pytest   # pytest, no network needed
```

CI runs lint, tests and a production build for all three services on every
push (`.github/workflows/ci.yml`).

## Project structure

```
client/     React app (components, pages, api clients, contexts, hooks)
server/     Express API (routes, controllers, models, services, middleware)
ai-service/ FastAPI service (routers, schemas, services)
docs/       Service-level documentation
```

## Deployment

- `render.yaml` describes the API and AI service for Render (web services,
  with MongoDB Atlas for the database)
- `client/vercel.json` covers SPA routing for Vercel
- `Dockerfile`s and `docker-compose.yml` for container-based deploys

Set `OPENAI_API_KEY` on the AI service to enable provider-backed responses;
without it everything still works through the fallback engines.

## License

MIT
