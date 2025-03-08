const request = require('supertest');

const app = require('../app');
const FocusSession = require('../models/focusSession.model');
const { connectTestDb, clearTestDb, disconnectTestDb, authHeader } = require('../testing/db');
const { registerUser } = require('../testing/fixtures');

describe('focus endpoints', () => {
  let auth;

  beforeAll(connectTestDb);
  afterEach(clearTestDb);
  afterAll(disconnectTestDb);

  beforeEach(async () => {
    auth = await registerUser();
  });

  it('logs a session with computed minutes', async () => {
    const startedAt = new Date(Date.now() - 25 * 60 * 1000);
    const endedAt = new Date();

    const res = await request(app)
      .post('/api/focus/sessions')
      .set(authHeader(auth.token))
      .send({ startedAt, endedAt });

    expect(res.status).toBe(201);
    expect(res.body.session.minutes).toBe(25);
    expect(res.body.session.completed).toBe(true);
  });

  it('rejects sessions that end before they start', async () => {
    const res = await request(app)
      .post('/api/focus/sessions')
      .set(authHeader(auth.token))
      .send({ startedAt: new Date(), endedAt: new Date(Date.now() - 60_000) });

    expect(res.status).toBe(400);
  });

  it('caps partial sessions at one minute', async () => {
    const startedAt = new Date(Date.now() - 20_000);

    const res = await request(app)
      .post('/api/focus/sessions')
      .set(authHeader(auth.token))
      .send({ startedAt, endedAt: new Date(), completed: false });

    expect(res.body.session.minutes).toBe(1);
    expect(res.body.session.completed).toBe(false);
  });

  it('summarises the last seven days', async () => {
    const now = Date.now();
    await FocusSession.create([
      {
        userId: auth.user._id,
        startedAt: new Date(now - 30 * 60 * 1000),
        endedAt: new Date(now - 5 * 60 * 1000),
        minutes: 25,
      },
      {
        userId: auth.user._id,
        startedAt: new Date(now - 26 * 60 * 1000),
        endedAt: new Date(now),
        minutes: 26,
      },
    ]);

    const res = await request(app)
      .get('/api/focus/sessions/summary')
      .set(authHeader(auth.token));

    expect(res.status).toBe(200);
    expect(res.body.summary.days).toHaveLength(7);
    expect(res.body.summary.totalMinutes).toBe(51);
    expect(res.body.summary.days[6]).toMatchObject({ minutes: 51, sessions: 2 });
    expect(res.body.summary.days[0].minutes).toBe(0);
  });

  it('ignores sessions from other users', async () => {
    const other = await registerUser();
    await FocusSession.create({
      userId: other.user._id,
      startedAt: new Date(Date.now() - 30 * 60 * 1000),
      endedAt: new Date(),
      minutes: 30,
    });

    const res = await request(app)
      .get('/api/focus/sessions/summary')
      .set(authHeader(auth.token));

    expect(res.body.summary.totalMinutes).toBe(0);
  });
});
