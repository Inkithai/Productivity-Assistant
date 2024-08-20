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

function monthBuckets(reference = new Date()) {
  const buckets = [];
  const anchor = new Date(reference);
  for (let offset = 5; offset >= 0; offset -= 1) {
    const start = new Date(anchor.getFullYear(), anchor.getMonth() - offset, 1);
    const end = new Date(anchor.getFullYear(), anchor.getMonth() - offset + 1, 1);
    buckets.push({
      start,
      end,
      label: start.toLocaleDateString('en-US', { month: 'short' }),
      completed: 0,
    });
  }
  return buckets;
}

function countInto(buckets, date, field) {
  for (const bucket of buckets) {
    if (date >= bucket.start && date < bucket.end) {
      bucket[field] += 1;
      return;
    }
  }
}

async function buildSummary(userId, now = new Date()) {
  const tasks = await Task.find({ userId }).select('status dueDate completedAt createdAt');

  const counts = { total: tasks.length, todo: 0, in_progress: 0, done: 0, overdue: 0 };
  const week = weekBuckets(now);

  for (const task of tasks) {
    counts[task.status] += 1;
    if (task.status !== 'done' && task.dueDate && task.dueDate < now) {
      counts.overdue += 1;
    }
    if (task.completedAt) countInto(week, task.completedAt, 'completed');
    if (task.createdAt) countInto(week, task.createdAt, 'created');
  }

  return {
    tasks: counts,
    completionRate: counts.total === 0 ? 0 : Math.round((counts.done / counts.total) * 100),
    week: week.map(({ label, completed, created }) => ({ label, completed, created })),
  };
}

async function buildTrends(userId, now = new Date()) {
  const [tasks, tagTasks] = await Promise.all([
    Task.find({ userId }).select('status completedAt createdAt tags'),
    Task.find({ userId, status: { $ne: 'done' } }).select('tags'),
  ]);

  const months = monthBuckets(now);
  for (const task of tasks) {
    if (task.completedAt) countInto(months, task.completedAt, 'completed');
  }

  const byTag = new Map();
  for (const task of tagTasks) {
    for (const tag of task.tags || []) {
      byTag.set(tag, (byTag.get(tag) || 0) + 1);
    }
  }
  const workload = [...byTag.entries()]
    .map(([tag, open]) => ({ tag, open }))
    .sort((a, b) => b.open - a.open)
    .slice(0, 8);

  return {
    monthly: months.map(({ label, completed }) => ({ label, completed })),
    byTag: workload,
  };
}

module.exports = { buildSummary, buildTrends, weekBuckets, monthBuckets };
