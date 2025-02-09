const FocusSession = require('../models/focusSession.model');

const DEFAULT_DAYS = 7;
const MAX_DAYS = 90;

function dayKey(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.toISOString().slice(0, 10);
}

async function logSession(req, res) {
  const { startedAt, endedAt, taskId, completed } = req.body;
  const minutes = Math.max(1, Math.round((endedAt - startedAt) / 60000));

  const session = await FocusSession.create({
    userId: req.user._id,
    taskId: taskId || null,
    startedAt,
    endedAt,
    minutes,
    completed: completed !== false,
  });

  return res.status(201).json({ session });
}

async function sessionSummary(req, res) {
  const days = Math.min(Number(req.query.days) || DEFAULT_DAYS, MAX_DAYS);
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  const sessions = await FocusSession.find({
    userId: req.user._id,
    startedAt: { $gte: since },
  }).select('startedAt minutes completed');

  // oldest first so the client can chart it left to right
  const byDay = new Map();
  for (let offset = 0; offset < days; offset += 1) {
    const day = new Date(since);
    day.setDate(day.getDate() + offset);
    byDay.set(dayKey(day), { date: dayKey(day), minutes: 0, sessions: 0 });
  }

  for (const session of sessions) {
    const bucket = byDay.get(dayKey(session.startedAt));
    if (bucket) {
      bucket.minutes += session.minutes;
      bucket.sessions += 1;
    }
  }

  const daysList = [...byDay.values()];
  return res.json({
    summary: {
      days: daysList,
      totalMinutes: daysList.reduce((total, day) => total + day.minutes, 0),
    },
  });
}

module.exports = { logSession, sessionSummary };
