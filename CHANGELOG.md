# Changelog

## v1.0.0 — 2025-08-09

First full release.

### Added

- Tasks with priorities, due dates, tags, filters and pagination
- Natural language quick add ("remind me to … next friday") across client,
  API and AI service
- Notes with categories, pinning and AI summaries (key points)
- Calendar month view with meetings, deadlines and events
- Reminders with background dispatch, Socket.IO delivery, snooze and cancel
- Assistant chat grounded in the user's tasks and notes
- Semantic search over tasks and notes with embeddings and lazy write-back
- Analytics: completion rate, weekly and monthly trends, workload by tag
- Habits with weekly targets and streaks
- Pomodoro focus timer with logged sessions
- Recurring tasks — daily and weekly repeats respawn on completion
- Shared tasks — collaborate on a task with another account
- Day planner — time-blocked schedule generated from open tasks
- Overdue-only task filter and full-account JSON data export
- Task editing and sharing dialogs in the client
- Dark mode, responsive layout, keyboard navigation
- Docker, docker-compose, Render and Vercel deployment configs
- CI running lint, tests and builds for all three services

### Fixed since v0.4.0

- Cancelled reminders no longer resurrect on snooze
- Undated tasks sort after dated ones in the task list
- Reminder toasts are actually rendered (caught by ESLint during the January
  cleanup)
- Chat autoscroll no longer fights manual scrolling
- Request bodies are capped and parser errors map to 4xx responses
- Auth endpoints are rate limited outside tests
- Time-dependent and timestamp-seeded tests made deterministic (no more
  order-flaky runs)

## v0.4.0 — 2024-07-18

### Added

- Semantic search (AI service embeddings + ranking, server integration,
  client global search)

## v0.3.0 — 2024-06-24

### Added

- Assistant chat with intent routing and provider fallback
- Note summarization endpoint and editor integration
- Task extraction from natural language
- Service token authentication between API server and AI service

## v0.2.0 — 2024-04-20

### Added

- Dashboard with stat cards and weekly productivity chart
- Profile settings, timezone handling and password change
- Calendar events, reminders and live notifications

## v0.1.0 — 2024-02-27

### Added

- Authentication (register, login, JWT sessions)
- Task and note CRUD with validation and pagination
- React app shell with routing
