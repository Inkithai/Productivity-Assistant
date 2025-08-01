# Contributing

Thanks for helping out. This document covers the day-to-day workflow the team
uses.

## Setup

1. Clone and follow the [README](README.md#getting-started) to run the three
   services locally.
2. Create a branch from `main`:
   - `feature/<short-name>` for new work
   - `bugfix/<short-name>` for fixes
   - `chore/<short-name>` for tooling and maintenance
3. Keep branches short-lived; open a pull request when the work is reviewable.

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/) style:

```
feat(client): add drag-and-drop for task reordering
fix(server): guard against duplicate reminder dispatch
test(ai): cover fallback summarizer output
docs: expand the deployment guide
```

Scope is the service or layer (`client`, `server`, `ai`, `ci`, `deploy`).
A commit should do one thing — if you wrote "and" in the message, split it.

## Code style

- **Server** is CommonJS; keep modules small and controllers thin. Business
  logic belongs in `services/`, request shaping in `controllers/`, validation
  in `validators/`.
- **Client** is ESM with function components and hooks. Extract a component
  only when it is reused or the file gets unwieldy.
- **AI service** uses Pydantic models for every request and response, and
  every feature needs a working fallback path for when no provider key is
  configured.
- Comments should explain *why*, not *what*.
- `npm run lint` (server/client) and `pytest` must pass before you push.

## Testing expectations

- New endpoints get controller tests (in-memory MongoDB, no network).
- New AI logic gets pytest coverage including the offline fallback path.
- New components get Vitest coverage for user-visible behaviour, not
  implementation details.

## Reviewing

- CI must be green before review.
- Keep PRs under ~400 lines of diff where practical; split bigger work.
- Every user-facing change should mention how it was manually verified.

## Reporting bugs

Open an issue with the service, steps to reproduce, and expected vs actual
behaviour. Include server logs (`console` output) or browser console errors
where relevant.
