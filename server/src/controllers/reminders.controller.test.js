const request = require('supertest');

const app = require('../app');
const Reminder = require('../models/reminder.model');
const { connectTestDb, clearTestDb, disconnectTestDb, authHeader } = require('../testing/db');
const { registerUser } = require('../testing/fixtures');

describe('reminders endpoints', () => {
  let auth;

  beforeAll(connectTestDb);
  afterEach(clearTestDb);
  afterAll(disconnectTestDb);

  beforeEach(async () => {
    auth = await registerUser();
  });

  function createReminder(overrides = {}) {
    return request(app)
      .post('/api/reminders')
      .set(authHeader(auth.token))
      .send({
        title: 'Project review',
        remindAt: new Date(Date.now() + 3_600_000).toISOString(),
        ...overrides,
      });
  }

  it('creates a scheduled reminder', async () => {
    const res = await createReminder({ message: 'Prepare the agenda' });

    expect(res.status).toBe(201);
    expect(res.body.reminder.status).toBe('scheduled');
    expect(res.body.reminder.title).toBe('Project review');
  });

  it('rejects a reminder without a time', async () => {
    const res = await request(app)
      .post('/api/reminders')
      .set(authHeader(auth.token))
      .send({ title: 'No time' });

    expect(res.status).toBe(400);
  });

  it('snoozes by the requested minutes', async () => {
    const create = await createReminder();
    const before = new Date(create.body.reminder.remindAt).getTime();

    const res = await request(app)
      .post(`/api/reminders/${create.body.reminder._id}/snooze`)
      .set(authHeader(auth.token))
      .send({ minutes: 30 });

    expect(res.status).toBe(200);
    const after = new Date(res.body.reminder.remindAt).getTime();
    expect(after).toBeGreaterThanOrEqual(Date.now() + 29 * 60 * 1000);
    expect(after).toBeGreaterThan(before);
  });

  it('does not resurrect a cancelled reminder', async () => {
    const create = await createReminder();
    await request(app)
      .patch(`/api/reminders/${create.body.reminder._id}/cancel`)
      .set(authHeader(auth.token));

    const res = await request(app)
      .post(`/api/reminders/${create.body.reminder._id}/snooze`)
      .set(authHeader(auth.token))
      .send({ minutes: 10 });

    expect(res.status).toBe(409);
    const stored = await Reminder.findById(create.body.reminder._id);
    expect(stored.status).toBe('cancelled');
  });

  it('cancels a scheduled reminder', async () => {
    const create = await createReminder();

    const res = await request(app)
      .patch(`/api/reminders/${create.body.reminder._id}/cancel`)
      .set(authHeader(auth.token));

    expect(res.status).toBe(200);
    expect(res.body.reminder.status).toBe('cancelled');
  });

  it('hides cancelled reminders from the list', async () => {
    const create = await createReminder();
    await createReminder({ title: 'Stays' });
    await request(app)
      .patch(`/api/reminders/${create.body.reminder._id}/cancel`)
      .set(authHeader(auth.token));

    const res = await request(app).get('/api/reminders').set(authHeader(auth.token));

    expect(res.body.reminders).toHaveLength(1);
    expect(res.body.reminders[0].title).toBe('Stays');
  });

  it('scopes reminders to the owner', async () => {
    const other = await registerUser();
    const create = await createReminder();

    const res = await request(app)
      .delete(`/api/reminders/${create.body.reminder._id}`)
      .set(authHeader(other.token));

    expect(res.status).toBe(404);
  });
});
