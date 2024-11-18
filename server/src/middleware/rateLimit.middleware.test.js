const express = require('express');
const request = require('supertest');

const { createAuthLimiter } = require('./rateLimit.middleware');

describe('auth rate limiter', () => {
  function buildApp() {
    const app = express();
    app.use('/api/auth', createAuthLimiter({ windowMs: 60_000, max: 3 }));
    app.post('/api/auth/login', (req, res) => res.json({ ok: true }));
    app.use((err, req, res, next) => res.status(err.status || 500).end());
    return app;
  }

  it('allows requests under the limit', async () => {
    const app = buildApp();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const res = await request(app).post('/api/auth/login');
      expect(res.status).toBe(200);
    }
  });

  it('returns 429 once the limit is hit', async () => {
    const app = buildApp();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await request(app).post('/api/auth/login');
    }

    const res = await request(app).post('/api/auth/login');

    expect(res.status).toBe(429);
    expect(res.body.error.message).toMatch(/too many attempts/i);
    expect(res.headers['ratelimit-remaining']).toBe('0');
  });
});
