const request = require('supertest');

const app = require('../app');
const { connectTestDb, clearTestDb, disconnectTestDb, authHeader } = require('../testing/db');
const { registerUser } = require('../testing/fixtures');

describe('notes endpoints', () => {
  let auth;

  beforeAll(connectTestDb);
  afterEach(clearTestDb);
  afterAll(disconnectTestDb);

  beforeEach(async () => {
    auth = await registerUser();
  });

  function createNote(overrides = {}) {
    return request(app)
      .post('/api/notes')
      .set(authHeader(auth.token))
      .send({ title: 'Sprint retro notes', ...overrides });
  }

  it('creates a note', async () => {
    const res = await createNote({
      content: 'API integration is pending',
      category: 'meeting',
      tags: ['retro'],
    });

    expect(res.status).toBe(201);
    expect(res.body.note.category).toBe('meeting');
    expect(res.body.note.pinned).toBe(false);
  });

  it('rejects an unknown category', async () => {
    const res = await createNote({ category: 'diary' });
    expect(res.status).toBe(400);
  });

  it('pins a note via update', async () => {
    const create = await createNote();
    const res = await request(app)
      .put(`/api/notes/${create.body.note._id}`)
      .set(authHeader(auth.token))
      .send({ pinned: true });

    expect(res.body.note.pinned).toBe(true);
  });

  it('lists pinned notes first', async () => {
    await createNote({ title: 'Plain note' });
    const pin = await createNote({ title: 'Pinned note' });
    await request(app)
      .put(`/api/notes/${pin.body.note._id}`)
      .set(authHeader(auth.token))
      .send({ pinned: true });

    const res = await request(app).get('/api/notes').set(authHeader(auth.token));

    expect(res.body.notes[0].title).toBe('Pinned note');
  });

  it('filters by category', async () => {
    await createNote({ title: 'Meeting', category: 'meeting' });
    await createNote({ title: 'Idea', category: 'idea' });

    const res = await request(app)
      .get('/api/notes')
      .query({ category: 'idea' })
      .set(authHeader(auth.token));

    expect(res.body.notes).toHaveLength(1);
    expect(res.body.notes[0].category).toBe('idea');
  });

  it('does not expose other users notes', async () => {
    const other = await registerUser();
    const create = await request(app)
      .post('/api/notes')
      .set(authHeader(other.token))
      .send({ title: 'Private' });

    const res = await request(app)
      .get(`/api/notes/${create.body.note._id}`)
      .set(authHeader(auth.token));

    expect(res.status).toBe(404);
  });

  it('deletes a note', async () => {
    const create = await createNote();
    const res = await request(app)
      .delete(`/api/notes/${create.body.note._id}`)
      .set(authHeader(auth.token));

    expect(res.status).toBe(204);
  });
});
