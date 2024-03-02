const Event = require('../models/event.model');

async function listEvents(req, res) {
  const { from, to } = req.validatedQuery;
  const events = await Event.find({
    userId: req.user._id,
    start: { $gte: from, $lte: to },
  }).sort({ start: 1 });

  return res.json({ events });
}

async function createEvent(req, res) {
  const event = await Event.create({ ...req.body, userId: req.user._id });
  return res.status(201).json({ event });
}

async function updateEvent(req, res) {
  const event = await Event.findOne({ _id: req.params.id, userId: req.user._id });
  if (!event) {
    return res.status(404).json({ error: { message: 'Event not found' } });
  }

  Object.assign(event, req.body);
  await event.save();
  return res.json({ event });
}

async function deleteEvent(req, res) {
  const event = await Event.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!event) {
    return res.status(404).json({ error: { message: 'Event not found' } });
  }
  return res.status(204).send();
}

module.exports = { listEvents, createEvent, updateEvent, deleteEvent };
