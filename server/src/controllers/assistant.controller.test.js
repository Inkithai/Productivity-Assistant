const request = require('supertest');

const app = require('../app');
const { authHeader } = require('../testing/db');
const { registerUser } = require('../testing/fixtures');

jest.mock('../services/aiGateway.service', () => ({
  extractTask: jest.fn(),
  chat: jest.fn(),
  summarize: jest.fn(),
}));

const { chat, extractTask } = require('../services/aiGateway.service');

describe('assistant endpoints', () => {
  let auth;

  beforeAll(async () => {
    auth = await registerUser();
  });

  it('proxies chat messages with the users context', async () => {
    chat.mockResolvedValue({ reply: 'You have 1 task due today', intent: 'today', provider: 'rules' });

    const res = await request(app)
      .post('/api/assistant/chat')
      .set(authHeader(auth.token))
      .send({ message: 'What is due today?' });

    expect(res.status).toBe(200);
    expect(res.body.reply).toBe('You have 1 task due today');
    expect(chat).toHaveBeenCalledWith(
      'What is due today?',
      expect.objectContaining({
        today_tasks: expect.any(Array),
        recent_notes: expect.any(Array),
      }),
      []
    );
  });

  it('forwards conversation history', async () => {
    chat.mockResolvedValue({ reply: 'ok', intent: 'general', provider: 'rules' });

    await request(app)
      .post('/api/assistant/chat')
      .set(authHeader(auth.token))
      .send({
        message: 'and tomorrow?',
        history: [{ role: 'user', content: 'what about today?' }],
      });

    expect(chat).toHaveBeenCalledWith(
      'and tomorrow?',
      expect.anything(),
      [{ role: 'user', content: 'what about today?' }]
    );
  });

  it('rejects an empty message', async () => {
    const res = await request(app)
      .post('/api/assistant/chat')
      .set(authHeader(auth.token))
      .send({ message: '' });

    expect(res.status).toBe(400);
  });

  it('returns extraction suggestions', async () => {
    extractTask.mockResolvedValue({
      title: 'Prepare for the interview',
      due_date: '2024-06-21T03:30:00Z',
      priority: 'high',
      tags: [],
      confidence: 0.75,
      provider: 'rules',
    });

    const res = await request(app)
      .post('/api/assistant/extract')
      .set(authHeader(auth.token))
      .send({ text: 'prepare for the interview next friday, urgent' });

    expect(res.status).toBe(200);
    expect(res.body.suggestion.title).toBe('Prepare for the interview');
    expect(extractTask).toHaveBeenCalledWith(
      'prepare for the interview next friday, urgent',
      'UTC'
    );
  });
});
