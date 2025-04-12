const { HabitLog } = require('../models/habit.model');

function dayKey(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return `${copy.getFullYear()}-${String(copy.getMonth() + 1).padStart(2, '0')}-${String(
    copy.getDate()
  ).padStart(2, '0')}`;
}

function startOfWeek(reference) {
  const monday = new Date(reference);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
}

function countStreak(logDays) {
  const set = new Set(logDays);
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  // allow the streak to still count if today is not logged yet
  if (!set.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (set.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

async function summarizeHabit(habit, now = new Date()) {
  const since = startOfWeek(now);
  const logs = await HabitLog.find({ habitId: habit._id })
    .select('day')
    .sort({ day: -1 })
    .limit(90);

  const logDays = logs.map((log) => log.day);
  const weekStartKey = dayKey(since);
  const thisWeek = logDays.filter((day) => day >= weekStartKey);

  return {
    id: String(habit._id),
    name: habit.name,
    targetPerWeek: habit.targetPerWeek,
    thisWeek: thisWeek.length,
    doneToday: logDays.includes(dayKey(now)),
    streak: countStreak(logDays),
  };
}

module.exports = { summarizeHabit, countStreak, dayKey, startOfWeek };
