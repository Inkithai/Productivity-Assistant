const Reminder = require('../models/reminder.model');

async function listReminders(req, res) {
  const reminders = await Reminder.find({
    userId: req.user._id,
    status: { $ne: 'cancelled' },
  })
    .sort({ remindAt: 1 })
    .limit(200);

  return res.json({ reminders });
}

async function createReminder(req, res) {
  const reminder = await Reminder.create({ ...req.body, userId: req.user._id });
  return res.status(201).json({ reminder });
}

async function updateReminder(req, res) {
  const reminder = await Reminder.findOne({ _id: req.params.id, userId: req.user._id });
  if (!reminder) {
    return res.status(404).json({ error: { message: 'Reminder not found' } });
  }
  if (reminder.status === 'sent') {
    return res.status(409).json({ error: { message: 'Reminder was already sent' } });
  }

  Object.assign(reminder, req.body);
  await reminder.save();
  return res.json({ reminder });
}

async function snoozeReminder(req, res) {
  const reminder = await Reminder.findOne({ _id: req.params.id, userId: req.user._id });
  if (!reminder) {
    return res.status(404).json({ error: { message: 'Reminder not found' } });
  }

  const snoozedUntil = new Date(Date.now() + req.body.minutes * 60 * 1000);
  reminder.status = 'scheduled';
  reminder.remindAt = snoozedUntil;
  await reminder.save();

  return res.json({ reminder });
}

async function cancelReminder(req, res) {
  const reminder = await Reminder.findOne({ _id: req.params.id, userId: req.user._id });
  if (!reminder) {
    return res.status(404).json({ error: { message: 'Reminder not found' } });
  }
  if (reminder.status === 'sent') {
    return res.status(409).json({ error: { message: 'Reminder was already sent' } });
  }

  reminder.status = 'cancelled';
  await reminder.save();
  return res.json({ reminder });
}

async function deleteReminder(req, res) {
  const reminder = await Reminder.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });
  if (!reminder) {
    return res.status(404).json({ error: { message: 'Reminder not found' } });
  }
  return res.status(204).send();
}

module.exports = {
  listReminders,
  createReminder,
  updateReminder,
  snoozeReminder,
  cancelReminder,
  deleteReminder,
};
