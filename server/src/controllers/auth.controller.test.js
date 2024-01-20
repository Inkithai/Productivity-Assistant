const request = require('supertest');
const app = require('../app');
const { connectTestDb, clearTestDb, disconnectTestDb, authHeader } = require('../testing/db');
const User = require('../models/user.model');

describe('auth endpoints', () => {
  beforeAll(connectTestDb);
  afterEach(clearTestDb);
  afterAll(disconnectTestDb);

  describe('POST /api/auth/register', () => {
    it('creates a user and returns a token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Kajanan', email: 'kajanan@example.com', password: 'secret123' });

      expect(res.status).toBe(201);
      expect(res.body.token).toBeTruthy();
      expect(res.body.user.email).toBe('kajanan@example.com');
      expect(res.body.user.passwordHash).toBeUndefined();

      const saved = await User.findOne({ email: 'kajanan@example.com' });
      expect(saved.passwordHash).not.toBe('secret123');
    });

    it('rejects an already registered email', async () => {
      const payload = { name: 'Inki', email: 'dup@example.com', password: 'secret123' };
      await request(app).post('/api/auth/register').send(payload);

      const res = await request(app).post('/api/auth/register').send(payload);

      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ name: 'Inki', email: 'inki@example.com', password: 'secret123' });
    });

    it('returns a token for valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'inki@example.com', password: 'secret123' });

      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe('Inki');
      expect(res.body.token).toBeTruthy();
    });

    it('rejects a wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'inki@example.com', password: 'wrong' });

      expect(res.status).toBe(401);
    });

    it('rejects an unknown email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ghost@example.com', password: 'secret123' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('requires a token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('returns the logged in user', async () => {
      const reg = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Inki', email: 'inki@example.com', password: 'secret123' });

      const res = await request(app).get('/api/auth/me').set(authHeader(reg.body.token));

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('inki@example.com');
    });
  });
});
