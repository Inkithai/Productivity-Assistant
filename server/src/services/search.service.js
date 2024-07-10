const Note = require('../models/note.model');
const Task = require('../models/task.model');
const { search: searchSemantically } = require('./aiGateway.service');

const MAX_ITEMS_PER_TYPE = 100;

function taskToItem(task) {
  return {
    id: String(task._id),
    type: 'task',
    title: task.title,
    content: task.description || '',
    embedding: task.embedding?.vector || null,
    embedding_provider: task.embedding?.provider || null,
  };
}

function noteToItem(note) {
  return {
    id: String(note._id),
    type: 'note',
    title: note.title,
    content: note.content || '',
    embedding: note.embedding?.vector || null,
    embedding_provider: note.embedding?.provider || null,
  };
}

async function persistEmbeddings(refreshes) {
  const updates = refreshes.map((refresh) => {
    const filter = { _id: refresh.id };
    const update = {
      embedding: { vector: refresh.vector, provider: refresh.provider },
    };
    return refresh.type === 'task'
      ? Task.updateOne(filter, update)
      : Note.updateOne(filter, update);
  });
  await Promise.all(updates);
}

async function searchEverything(userId, query, limit = 10) {
  const [tasks, notes] = await Promise.all([
    Task.find({ userId })
      .select('title description embedding')
      .limit(MAX_ITEMS_PER_TYPE),
    Note.find({ userId })
      .select('title content embedding')
      .limit(MAX_ITEMS_PER_TYPE),
  ]);

  const items = [...tasks.map(taskToItem), ...notes.map(noteToItem)];
  if (items.length === 0) {
    return { results: [] };
  }

  const { results, embeddings } = await searchSemantically(query, items, limit);

  if (embeddings?.length) {
    await persistEmbeddings(embeddings);
  }

  return {
    results: results.map((result) => ({
      id: result.id,
      type: result.type,
      title: result.title,
      score: result.score,
    })),
  };
}

module.exports = { searchEverything, persistEmbeddings };
