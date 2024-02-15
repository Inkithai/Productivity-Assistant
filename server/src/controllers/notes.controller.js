const Note = require('../models/note.model');

async function listNotes(req, res) {
  const filter = { userId: req.user._id };
  if (req.validatedQuery?.category) filter.category = req.validatedQuery.category;
  if (req.validatedQuery?.pinned === true) filter.pinned = true;

  const notes = await Note.find(filter).sort({ pinned: -1, updatedAt: -1 });
  return res.json({ notes });
}

async function createNote(req, res) {
  const note = await Note.create({ ...req.body, userId: req.user._id });
  return res.status(201).json({ note });
}

async function getNote(req, res) {
  const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
  if (!note) {
    return res.status(404).json({ error: { message: 'Note not found' } });
  }
  return res.json({ note });
}

async function updateNote(req, res) {
  const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
  if (!note) {
    return res.status(404).json({ error: { message: 'Note not found' } });
  }

  Object.assign(note, req.body);
  await note.save();
  return res.json({ note });
}

async function deleteNote(req, res) {
  const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!note) {
    return res.status(404).json({ error: { message: 'Note not found' } });
  }
  return res.status(204).send();
}

module.exports = { listNotes, createNote, getNote, updateNote, deleteNote };
