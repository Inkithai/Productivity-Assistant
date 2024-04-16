const Task = require('../models/task.model');

function weekBuckets(reference = new Date()) {
  const buckets = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const start = new Date(reference);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - offset);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    buckets.push({
      start,
      end,
      label: start.toLocaleDateString('en-US', { weekday: 'short' }),
      completed: 0,
      created: 0,
    });
  }
  return buckets;
}

async function buildSummary(userId, now = new Date()) {
  const tasks = await Task.find({ userId }).select('status dueDate completedAt createdAt');

  const counts = { total: tasks.length, todo: 0, in_progress: 0, done: 0, overdue: 0 };
  const buckets = weekBuckets(now);

  for (const task of tasks) {
    counts[task.status] += 1;
    if (task.status !== 'done' && task.dueDate && task.dueDate < now) {
      counts.overdue += 1;
    }
    for (const bucket of buckets) {
      if (task.completedAt >= bucket.start && task.completedAt < bucket.end) {
        bucket.completed += 1;
      }
      if (task.createdAt >= bucket.start && task.createdAt < bucket.end) {
        bucket.created += 1;
      }
    }
  }

  return {
    tasks: counts,
    completionRate: counts.total === 0 ? 0 : Math.round((counts.done / counts.total) * 100),
    week: buckets.map(({ label, completed, created }) => ({ label, completed, created })),
  };
}

module.exports = { buildSummary, weekBuckets };
