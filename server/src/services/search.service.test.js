const request = require('supertest');

const app = require('../app');
const Note = require('../models/note.model');
const Task = require('../models/task.model');
const { connectTestDb, clearTestDb, disconnectTestDb, authHeader } = require('../testing/db');
const { registerUser } = require('../testing/fixtures');

jest.mock('../services/aiGateway.service', () => ({
  search: jest.fn(),
}));

const { search: gatewaySearch } = require('../services/aiGateway.service');

describe('search endpoints', () => {
  let auth;

  beforeAll(connectTestDb);
  afterEach(clearTestDb);
  afterAll(disconnectTestDb);

  beforeEach(async () => {
    gatewaySearch.mockReset();
    auth = await registerUser();
  });

  it('requires at least two characters', async () => {
    const res = await request(app)
      .get('/api/search')
      .query({ q: 'a' })
      .set(authHeader(auth.token));

    expect(res.status).toBe(400);
  });

  it('sends notes and tasks to the AI service', async () => {
    gatewaySearch.mockResolvedValue({ results: [], embeddings: [] });
    await Note.create({ userId: auth.user._id, title: 'Interview prep', content: 'questions' });
    await Task.create({ userId: auth.user._id, title: 'Practice answers' });

    const res = await request(app)
      .get('/api/search')
      .query({ q: 'interview questions' })
      .set(authHeader(auth.token));

    expect(res.status).toBe(200);
    const [query, items] = gatewaySearch.mock.calls[0];
    expect(query).toBe('interview questions');
    expect(items.map((item) => item.type).sort()).toEqual(['note', 'task']);
  });

  it('returns ranked results', async () => {
    await Note.create({ userId: auth.user._id, title: 'Interview prep' });
    gatewaySearch.mockResolvedValue({
      results: [{ id: 'n1', type: 'note', title: 'Interview prep', score: 0.42 }],
      embeddings: [],
    });

    const res = await request(app)
      .get('/api/search')
      .query({ q: 'interview' })
      .set(authHeader(auth.token));

    expect(res.status).toBe(200);
    expect(res.body.results[0]).toMatchObject({ type: 'note', score: 0.42 });
  });

  it('persists refreshed embeddings on the right collection', async () => {
    const note = await Note.create({ userId: auth.user._id, title: 'Old note' });
    const task = await Task.create({ userId: auth.user._id, title: 'Old task' });

    gatewaySearch.mockResolvedValue({
      results: [],
      embeddings: [
        { id: String(note._id), type: 'note', vector: [0.1, 0.2], provider: 'fallback' },
        { id: String(task._id), type: 'task', vector: [0.3, 0.4], provider: 'fallback' },
      ],
    });

    await request(app)
      .get('/api/search')
      .query({ q: 'anything' })
      .set(authHeader(auth.token));

    const savedNote = await Note.findById(note._id);
    const savedTask = await Task.findById(task._id);
    expect(savedNote.embedding).toMatchObject({ provider: 'fallback' });
    expect(savedNote.embedding.vector).toHaveLength(2);
    expect(savedTask.embedding.vector).toHaveLength(2);
  });

  it('does not include other users items', async () => {
    const other = await registerUser();
    await Note.create({ userId: other.user._id, title: 'Private note' });
    gatewaySearch.mockResolvedValue({ results: [], embeddings: [] });

    const res = await request(app)
      .get('/api/search')
      .query({ q: 'private' })
      .set(authHeader(auth.token));

    // the caller has nothing searchable, so the AI service is never involved
    expect(res.status).toBe(200);
    expect(gatewaySearch).not.toHaveBeenCalled();
  });
});
