const request = require('supertest');

const app = require('../app');

let counter = 0;

function uniqueEmail() {
  counter += 1;
  return `user-${Date.now()}-${counter}@example.com`;
}

async function registerUser({ name = 'Test User', email, password = 'secret123' } = {}) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name, email: email || uniqueEmail(), password });

  if (res.status !== 201) {
    throw new Error(`Fixture registration failed: ${res.status} ${res.text}`);
  }
  return { token: res.body.token, user: res.body.user, email: res.body.user.email, password };
}

module.exports = { registerUser, uniqueEmail };
