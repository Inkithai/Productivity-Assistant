const request = require('supertest');

const app = require('../app');
const { connectTestDb, clearTestDb, disconnectTestDb, authHeader } = require('../testing/db');
const { registerUser } = require('../testing/fixtures');

const MARCH = { from: '2024-03-01T00:00:00.000Z', to: '2024-03-31T23:59:59.999Z' };

describe('events endpoints', () => {
  let auth;

  beforeAll(connectTestDb);
  afterEach(clearTestDb);
  afterAll(disconnectTestDb);

  beforeEach(async () => {
    auth = await registerUser();
  });

  function createEvent(overrides = {}) {
    return request(app)
      .post('/api/events')
      .set(authHeader(auth.token))
      .send({
        title: 'Team meeting',
        type: 'meeting',
        start: '2024-03-11T09:00:00.000Z',
        ...overrides,
      });
  }

  it('creates an event', async () => {
    const res = await createEvent();

    expect(res.status).toBe(201);
    expect(res.body.event.title).toBe('Team meeting');
  });

  it('rejects an end before start', async () => {
    const res = await createEvent({ end: '2024-03-11T08:00:00.000Z' });
    expect(res.status).toBe(400);
  });

  it('requires a from/to range when listing', async () => {
    const res = await request(app).get('/api/events').set(authHeader(auth.token));
    expect(res.status).toBe(400);
  });

  it('returns events within the range only', async () => {
    await createEvent();
    await createEvent({ title: 'April event', start: '2024-04-02T10:00:00.000Z' });

    const res = await request(app)
      .get('/api/events')
      .query(MARCH)
      .set(authHeader(auth.token));

    expect(res.status).toBe(200);
    expect(res.body.events).toHaveLength(1);
    expect(res.body.events[0].title).toBe('Team meeting');
  });

  it('updates an event', async () => {
    const create = await createEvent();
    const res = await request(app)
      .put(`/api/events/${create.body.event._id}`)
      .set(authHeader(auth.token))
      .send({ title: 'Renamed' });

    expect(res.body.event.title).toBe('Renamed');
  });

  it('scoping hides other users events', async () => {
    const other = await registerUser();
    const create = await createEvent();

    const res = await request(app)
      .put(`/api/events/${create.body.event._id}`)
      .set(authHeader(other.token))
      .send({ title: 'Hijacked' });

    expect(res.status).toBe(404);
  });

  it('deletes an event', async () => {
    const create = await createEvent();
    const res = await request(app)
      .delete(`/api/events/${create.body.event._id}`)
      .set(authHeader(auth.token));

    expect(res.status).toBe(204);
  });
});
