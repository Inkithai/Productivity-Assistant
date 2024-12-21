const request = require('supertest');

const app = require('../app');
const { connectTestDb, clearTestDb, disconnectTestDb, authHeader } = require('../testing/db');
const { registerUser } = require('../testing/fixtures');

describe('error middleware', () => {
  beforeAll(connectTestDb);
  afterEach(clearTestDb);
  afterAll(disconnectTestDb);

  it('rejects oversized payloads with 413', async () => {
    const auth = await registerUser();
    const big = 'x'.repeat(200 * 1024);

    const res = await request(app)
      .post('/api/tasks')
      .set(authHeader(auth.token))
      .send({ title: 'Big', description: big });

    expect(res.status).toBe(413);
    expect(res.body.error.message).toMatch(/too large/i);
  });

  it('rejects malformed JSON with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send('{"name": broken');

    expect(res.status).toBe(400);
  });
});
