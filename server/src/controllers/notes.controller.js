const Note = require('../models/note.model');
const { summarize } = require('../services/aiGateway.service');
const { buildPagination, paginationMeta } = require('../utils/pagination');

async function listNotes(req, res) {
  const { category, pinned, page, limit } = req.validatedQuery;
  const filter = { userId: req.user._id };
  if (category) filter.category = category;
  if (pinned === true) filter.pinned = true;

  const { skip, page: safePage, limit: safeLimit } = buildPagination({ page, limit });
  const [notes, total] = await Promise.all([
    Note.find(filter).sort({ pinned: -1, updatedAt: -1 }).skip(skip).limit(safeLimit),
    Note.countDocuments(filter),
  ]);

  return res.json({ notes, meta: paginationMeta({ page: safePage, limit: safeLimit, total }) });
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

async function summarizeNote(req, res) {
  const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
  if (!note) {
    return res.status(404).json({ error: { message: 'Note not found' } });
  }
  if (!note.content || note.content.trim().length < 20) {
    return res.status(400).json({ error: { message: 'Note is too short to summarize' } });
  }

  const result = await summarize(note.content, 5);
  return res.json(result);
}

async function deleteNote(req, res) {
  const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!note) {
    return res.status(404).json({ error: { message: 'Note not found' } });
  }
  return res.status(204).send();
}

module.exports = { listNotes, createNote, getNote, updateNote, summarizeNote, deleteNote };
