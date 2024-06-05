const Task = require('../models/task.model');
const Note = require('../models/note.model');

const UPCOMING_WINDOW_DAYS = 14;
const MAX_ITEMS = 20;

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date) {
  const copy = startOfDay(date);
  copy.setDate(copy.getDate() + 1);
  return copy;
}

function toTaskView(task) {
  return {
    id: String(task._id),
    title: task.title,
    priority: task.priority,
    status: task.status,
    due_date: task.dueDate ? task.dueDate.toISOString() : null,
  };
}

async function buildContext(userId, now = new Date()) {
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);
  const upcomingEnd = new Date(dayEnd);
  upcomingEnd.setDate(upcomingEnd.getDate() + UPCOMING_WINDOW_DAYS);

  const [tasks, notes] = await Promise.all([
    Task.find({ userId, status: { $ne: 'done' } })
      .select('title priority status dueDate createdAt')
      .sort({ dueDate: 1 })
      .limit(200),
    Note.find({ userId })
      .select('title updatedAt')
      .sort({ updatedAt: -1 })
      .limit(MAX_ITEMS),
  ]);

  const today = [];
  const overdue = [];
  const upcoming = [];

  for (const task of tasks) {
    if (!task.dueDate) continue;
    if (task.dueDate < dayStart) overdue.push(task);
    else if (task.dueDate < dayEnd) today.push(task);
    else if (task.dueDate < upcomingEnd) upcoming.push(task);
  }

  return {
    today_tasks: today.map(toTaskView),
    overdue: overdue.map(toTaskView),
    upcoming: upcoming.slice(0, MAX_ITEMS).map(toTaskView),
    recent_notes: notes.map((note) => ({ id: String(note._id), title: note.title })),
  };
}

module.exports = { buildContext };
