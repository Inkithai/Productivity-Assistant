const Notification = require('../models/notification.model');
const Reminder = require('../models/reminder.model');
const { emitToUser } = require('../sockets');

const BATCH_LIMIT = 50;

async function dispatchDueReminders(now = new Date()) {
  const due = await Reminder.find({ status: 'scheduled', remindAt: { $lte: now } })
    .sort({ remindAt: 1 })
    .limit(BATCH_LIMIT);

  const results = [];
  for (const reminder of due) {
    const notification = await dispatchReminder(reminder);
    if (notification) results.push(notification);
  }
  return results;
}

async function dispatchReminder(reminder) {
  emitToUser(reminder.userId, 'reminder:due', {
    id: reminder._id,
    title: reminder.title,
    message: reminder.message,
  });

  const notification = await Notification.create({
    userId: reminder.userId,
    type: 'reminder',
    title: reminder.title,
    body: reminder.message || '',
    meta: { reminderId: reminder._id, taskId: reminder.taskId, eventId: reminder.eventId },
  });

  reminder.status = 'sent';
  reminder.sentAt = new Date();
  await reminder.save();

  return notification;
}

module.exports = { dispatchDueReminders, dispatchReminder };
