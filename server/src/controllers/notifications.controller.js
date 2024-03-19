const Notification = require('../models/notification.model');

async function listNotifications(req, res) {
  const filter = { userId: req.user._id };
  if (req.query.unread === 'true') filter.read = false;

  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .limit(50);

  const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });

  return res.json({ notifications, unreadCount });
}

async function markRead(req, res) {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { read: true },
    { new: true }
  );
  if (!notification) {
    return res.status(404).json({ error: { message: 'Notification not found' } });
  }
  return res.json({ notification });
}

async function markAllRead(req, res) {
  const result = await Notification.updateMany(
    { userId: req.user._id, read: false },
    { read: true }
  );
  return res.json({ updated: result.modifiedCount });
}

module.exports = { listNotifications, markRead, markAllRead };
