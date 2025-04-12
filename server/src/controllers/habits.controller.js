const { Habit, HabitLog } = require('../models/habit.model');
const { dayKey, summarizeHabit } = require('../services/habitStats.service');

async function listHabits(req, res) {
  const habits = await Habit.find({ userId: req.user._id, archived: false }).sort({
    createdAt: 1,
  });
  const summaries = await Promise.all(habits.map((habit) => summarizeHabit(habit)));
  return res.json({ habits: summaries });
}

async function createHabit(req, res) {
  const exists = await Habit.findOne({ userId: req.user._id, name: req.body.name });
  if (exists) {
    return res.status(409).json({ error: { message: 'You already track this habit' } });
  }

  const habit = await Habit.create({ ...req.body, userId: req.user._id });
  return res.status(201).json({ habit: await summarizeHabit(habit) });
}

async function logHabit(req, res) {
  const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });
  if (!habit) {
    return res.status(404).json({ error: { message: 'Habit not found' } });
  }

  const day = req.body.day || dayKey(new Date());
  const existing = await HabitLog.findOne({ habitId: habit._id, day });

  if (existing) {
    await existing.deleteOne();
  } else {
    await HabitLog.create({ habitId: habit._id, userId: req.user._id, day });
  }

  return res.json({ habit: await summarizeHabit(habit), logged: !existing });
}

async function deleteHabit(req, res) {
  const habit = await Habit.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!habit) {
    return res.status(404).json({ error: { message: 'Habit not found' } });
  }
  await HabitLog.deleteMany({ habitId: habit._id });
  return res.status(204).send();
}

module.exports = { listHabits, createHabit, logHabit, deleteHabit };
