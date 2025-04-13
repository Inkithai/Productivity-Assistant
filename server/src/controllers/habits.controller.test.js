const request = require('supertest');

const app = require('../app');
const { connectTestDb, clearTestDb, disconnectTestDb, authHeader } = require('../testing/db');
const { registerUser } = require('../testing/fixtures');

describe('habits endpoints', () => {
  let auth;

  beforeAll(connectTestDb);
  afterEach(clearTestDb);
  afterAll(disconnectTestDb);

  beforeEach(async () => {
    auth = await registerUser();
  });

  it('creates a habit', async () => {
    const res = await request(app)
      .post('/api/habits')
      .set(authHeader(auth.token))
      .send({ name: 'Morning run', targetPerWeek: 4 });

    expect(res.status).toBe(201);
    expect(res.body.habit).toMatchObject({ name: 'Morning run', targetPerWeek: 4, thisWeek: 0 });
  });

  it('rejects duplicate habit names', async () => {
    await request(app)
      .post('/api/habits')
      .set(authHeader(auth.token))
      .send({ name: 'Read' });

    const res = await request(app)
      .post('/api/habits')
      .set(authHeader(auth.token))
      .send({ name: 'Read' });

    expect(res.status).toBe(409);
  });

  it('toggles a daily log', async () => {
    const create = await request(app)
      .post('/api/habits')
      .set(authHeader(auth.token))
      .send({ name: 'Meditate' });
    const id = create.body.habit.id;

    const first = await request(app)
      .post(`/api/habits/${id}/log`)
      .set(authHeader(auth.token))
      .send({});
    expect(first.body.logged).toBe(true);
    expect(first.body.habit.doneToday).toBe(true);

    const second = await request(app)
      .post(`/api/habits/${id}/log`)
      .set(authHeader(auth.token))
      .send({});
    expect(second.body.logged).toBe(false);
    expect(second.body.habit.thisWeek).toBe(0);
  });

  it('accepts an explicit day', async () => {
    const create = await request(app)
      .post('/api/habits')
      .set(authHeader(auth.token))
      .send({ name: 'Journal' });
    const id = create.body.habit.id;

    const res = await request(app)
      .post(`/api/habits/${id}/log`)
      .set(authHeader(auth.token))
      .send({ day: '2025-04-01' });

    expect(res.body.habit.doneToday).toBe(false);
    expect(res.body.habit.thisWeek).toBe(0);
  });

  it('scopes habits to the owner', async () => {
    const other = await registerUser();
    const create = await request(app)
      .post('/api/habits')
      .set(authHeader(other.token))
      .send({ name: 'Private habit' });

    const res = await request(app)
      .delete(`/api/habits/${create.body.habit.id}`)
      .set(authHeader(auth.token));

    expect(res.status).toBe(404);
  });

  it('deletes a habit with its logs', async () => {
    const create = await request(app)
      .post('/api/habits')
      .set(authHeader(auth.token))
      .send({ name: 'Temp' });
    await request(app)
      .post(`/api/habits/${create.body.habit.id}/log`)
      .set(authHeader(auth.token))
      .send({});

    const res = await request(app)
      .delete(`/api/habits/${create.body.habit.id}`)
      .set(authHeader(auth.token));

    expect(res.status).toBe(204);
    const list = await request(app).get('/api/habits').set(authHeader(auth.token));
    expect(list.body.habits).toHaveLength(0);
  });
});
