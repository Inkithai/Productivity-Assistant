const request = require('supertest');

const app = require('../app');
const User = require('../models/user.model');
const { connectTestDb, clearTestDb, disconnectTestDb, authHeader } = require('../testing/db');
const { registerUser } = require('../testing/fixtures');

describe('users endpoints', () => {
  let auth;

  beforeAll(connectTestDb);
  afterEach(clearTestDb);
  afterAll(disconnectTestDb);

  beforeEach(async () => {
    auth = await registerUser();
  });

  it('updates the display name', async () => {
    const res = await request(app)
      .put('/api/users/me')
      .set(authHeader(auth.token))
      .send({ name: 'Renamed' });

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Renamed');
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('stores the timezone', async () => {
    const res = await request(app)
      .put('/api/users/me')
      .set(authHeader(auth.token))
      .send({ timezone: 'Asia/Colombo' });

    expect(res.body.user.timezone).toBe('Asia/Colombo');

    const saved = await User.findById(auth.user._id);
    expect(saved.timezone).toBe('Asia/Colombo');
  });

  it('rejects a malformed timezone', async () => {
    const res = await request(app)
      .put('/api/users/me')
      .set(authHeader(auth.token))
      .send({ timezone: 'Mars/Olympus' });

    expect(res.status).toBe(400);
  });

  it('changes the password and keeps the old one working until then', async () => {
    const res = await request(app)
      .put('/api/users/me/password')
      .set(authHeader(auth.token))
      .send({ currentPassword: auth.password, newPassword: 'new-secret-123' });

    expect(res.status).toBe(200);

    const loginOld = await request(app)
      .post('/api/auth/login')
      .send({ email: auth.email, password: auth.password });
    expect(loginOld.status).toBe(401);

    const loginNew = await request(app)
      .post('/api/auth/login')
      .send({ email: auth.email, password: 'new-secret-123' });
    expect(loginNew.status).toBe(200);
  });

  it('rejects a wrong current password', async () => {
    const res = await request(app)
      .put('/api/users/me/password')
      .set(authHeader(auth.token))
      .send({ currentPassword: 'wrong-password', newPassword: 'new-secret-123' });

    expect(res.status).toBe(400);
  });

  it('rejects an identical new password', async () => {
    const res = await request(app)
      .put('/api/users/me/password')
      .set(authHeader(auth.token))
      .send({ currentPassword: auth.password, newPassword: auth.password });

    expect(res.status).toBe(400);
  });
});
