const Event = require('../models/event.model');
const Note = require('../models/note.model');
const Reminder = require('../models/reminder.model');
const Task = require('../models/task.model');
const User = require('../models/user.model');

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;

  const matches = await req.user.comparePassword(currentPassword);
  if (!matches) {
    return res.status(400).json({ error: { message: 'Current password is incorrect' } });
  }

  req.user.passwordHash = await User.hashPassword(newPassword);
  await req.user.save();

  return res.json({ updated: true });
}

async function updateProfile(req, res) {
  const user = req.user;
  if (req.body.name !== undefined) {
    user.name = req.body.name;
  }
  if (req.body.timezone !== undefined) {
    user.timezone = req.body.timezone;
  }
  await user.save();
  return res.json({ user: user.toJSON() });
}

module.exports = { updateProfile, changePassword };

// everything the account owns, as one downloadable JSON document
async function exportData(req, res) {
  const [tasks, notes, events, reminders] = await Promise.all([
    Task.find({ userId: req.user._id }).sort({ createdAt: -1 }),
    Note.find({ userId: req.user._id }).sort({ updatedAt: -1 }),
    Event.find({ userId: req.user._id }).sort({ start: 1 }),
    Reminder.find({ userId: req.user._id }).sort({ remindAt: 1 }),
  ]);

  res.setHeader('Content-Disposition', 'attachment; filename="productivity-data.json"');
  return res.json({
    exportedAt: new Date().toISOString(),
    user: { name: req.user.name, email: req.user.email },
    tasks,
    notes,
    events,
    reminders,
  });
}

module.exports = { ...module.exports, exportData };
