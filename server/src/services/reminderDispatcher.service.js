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
  // Claim the reminder first: if another process already picked it up the
  // update matches nothing and we skip it, otherwise a crash between emit
  // and save would cause duplicate notifications on restart.
  const claimed = await Reminder.updateOne(
    { _id: reminder._id, status: 'scheduled' },
    { status: 'sent', sentAt: new Date() }
  );
  if (claimed.modifiedCount === 0) {
    return null;
  }

  const notification = await Notification.create({
    userId: reminder.userId,
    type: 'reminder',
    title: reminder.title,
    body: reminder.message || '',
    meta: { reminderId: reminder._id, taskId: reminder.taskId, eventId: reminder.eventId },
  });

  emitToUser(reminder.userId, 'reminder:due', {
    id: notification._id,
    title: reminder.title,
    message: reminder.message,
  });

  return notification;
}

module.exports = { dispatchDueReminders, dispatchReminder };
