const request = require('supertest');

const app = require('../app');
const Task = require('../models/task.model');
const { authHeader } = require('../testing/db');
const { registerUser } = require('../testing/fixtures');

const { connectTestDb, clearTestDb, disconnectTestDb } = require('../testing/db');

describe('tasks endpoints', () => {
  let first;
  let second;

  beforeAll(connectTestDb);
  afterEach(clearTestDb);
  afterAll(disconnectTestDb);

  beforeEach(async () => {
    first = await registerUser();
    second = await registerUser();
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
  });

  it('creates a task for the current user', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set(authHeader(first.token))
      .send({ title: 'Ship the landing page', priority: 'high', tags: ['work'] });

    expect(res.status).toBe(201);
    expect(res.body.task.title).toBe('Ship the landing page');
    expect(res.body.task.priority).toBe('high');
    expect(String(res.body.task.userId)).toBe(String(first.user._id));
  });

  it('rejects an invalid priority', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set(authHeader(first.token))
      .send({ title: 'Bad task', priority: 'critical' });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Validation failed');
  });

  it('lists only the current user tasks', async () => {
    await request(app).post('/api/tasks').set(authHeader(first.token)).send({ title: 'Mine' });
    await request(app).post('/api/tasks').set(authHeader(second.token)).send({ title: 'Theirs' });

    const res = await request(app).get('/api/tasks').set(authHeader(first.token));

    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(1);
    expect(res.body.tasks[0].title).toBe('Mine');
  });

  it('filters by status', async () => {
    const base = { title: 'Filtered' };
    await request(app).post('/api/tasks').set(authHeader(first.token)).send(base);
    await request(app)
      .post('/api/tasks')
      .set(authHeader(first.token))
      .send({ ...base, status: 'done' });

    const res = await request(app)
      .get('/api/tasks')
      .query({ status: 'done' })
      .set(authHeader(first.token));

    expect(res.body.tasks).toHaveLength(1);
    expect(res.body.tasks[0].status).toBe('done');
  });

  it('lists dated tasks before undated ones', async () => {
    await request(app)
      .post('/api/tasks')
      .set(authHeader(first.token))
      .send({ title: 'No date at all' });
    await request(app)
      .post('/api/tasks')
      .set(authHeader(first.token))
      .send({ title: 'Dated', dueDate: '2030-01-01' });

    const res = await request(app).get('/api/tasks').set(authHeader(first.token));

    expect(res.body.tasks.map((task) => task.title)).toEqual(['Dated', 'No date at all']);
  });

  it('paginates the task list', async () => {
    const creations = Array.from({ length: 25 }, (_, i) =>
      request(app)
        .post('/api/tasks')
        .set(authHeader(first.token))
        .send({ title: `Task ${i + 1}` })
    );
    await Promise.all(creations);

    const res = await request(app)
      .get('/api/tasks')
      .query({ page: 2 })
      .set(authHeader(first.token));

    expect(res.body.tasks).toHaveLength(5);
    expect(res.body.meta).toMatchObject({ page: 2, limit: 20, total: 25, pages: 2 });
  });

  it('returns 404 for a task owned by someone else', async () => {
    const create = await request(app)
      .post('/api/tasks')
      .set(authHeader(second.token))
      .send({ title: 'Theirs' });

    const res = await request(app)
      .get(`/api/tasks/${create.body.task._id}`)
      .set(authHeader(first.token));

    expect(res.status).toBe(404);
  });

  it('updates a task', async () => {
    const create = await request(app)
      .post('/api/tasks')
      .set(authHeader(first.token))
      .send({ title: 'Before' });

    const res = await request(app)
      .put(`/api/tasks/${create.body.task._id}`)
      .set(authHeader(first.token))
      .send({ title: 'After', status: 'done' });

    expect(res.status).toBe(200);
    expect(res.body.task.title).toBe('After');
    expect(res.body.task.status).toBe('done');
  });

  it('returns 404 when updating a missing task', async () => {
    const res = await request(app)
      .put('/api/tasks/000000000000000000000000')
      .set(authHeader(first.token))
      .send({ title: 'Nope' });

    expect(res.status).toBe(404);
  });

  it('clears completedAt when a done task is reopened', async () => {
    const create = await request(app)
      .post('/api/tasks')
      .set(authHeader(first.token))
      .send({ title: 'Reopen me', status: 'done' });

    const res = await request(app)
      .put(`/api/tasks/${create.body.task._id}`)
      .set(authHeader(first.token))
      .send({ status: 'todo' });

    expect(res.body.task.completedAt).toBeNull();
  });

<<<<<<< HEAD
  it('completing a daily task spawns the next occurrence', async () => {
    const create = await request(app)
      .post('/api/tasks')
      .set(authHeader(first.token))
      .send({ title: 'Morning review', repeat: 'daily', dueDate: '2030-01-10' });

    const res = await request(app)
      .put(`/api/tasks/${create.body.task._id}`)
      .set(authHeader(first.token))
      .send({ status: 'done' });

    expect(res.status).toBe(200);
    expect(res.body.task.status).toBe('done');
    expect(res.body.spawned).toMatchObject({
      title: 'Morning review',
      status: 'todo',
      repeat: 'daily',
    });
    expect(new Date(res.body.spawned.dueDate).getUTCDate()).toBe(11);
  });

  it('plain tasks do not spawn anything on completion', async () => {
    const create = await request(app)
      .post('/api/tasks')
      .set(authHeader(first.token))
      .send({ title: 'One-off' });

    const res = await request(app)
      .put(`/api/tasks/${create.body.task._id}`)
      .set(authHeader(first.token))
      .send({ status: 'done' });

    expect(res.body.spawned).toBeNull();
    const listed = await request(app).get('/api/tasks').set(authHeader(first.token));
    expect(listed.body.tasks).toHaveLength(1);
  });

  it('weekly tasks jump forward seven days', async () => {
    const create = await request(app)
      .post('/api/tasks')
      .set(authHeader(first.token))
      .send({ title: 'Weekly report', repeat: 'weekly', dueDate: '2030-01-07' });

    const res = await request(app)
      .put(`/api/tasks/${create.body.task._id}`)
      .set(authHeader(first.token))
      .send({ status: 'done' });

    expect(new Date(res.body.spawned.dueDate).toISOString()).toContain('2030-01-14');
=======
  it('shares a task with another account', async () => {
    const create = await request(app)
      .post('/api/tasks')
      .set(authHeader(first.token))
      .send({ title: 'Shared work' });

    const res = await request(app)
      .post(`/api/tasks/${create.body.task._id}/share`)
      .set(authHeader(first.token))
      .send({ email: second.email });

    expect(res.status).toBe(200);
    expect(res.body.alreadyShared).toBe(false);
    expect(res.body.sharedWith).toHaveLength(1);

    const again = await request(app)
      .post(`/api/tasks/${create.body.task._id}/share`)
      .set(authHeader(first.token))
      .send({ email: second.email });
    expect(again.body.alreadyShared).toBe(true);
  });

  it('rejects sharing with unknown emails', async () => {
    const create = await request(app)
      .post('/api/tasks')
      .set(authHeader(first.token))
      .send({ title: 'Ghost share' });

    const res = await request(app)
      .post(`/api/tasks/${create.body.task._id}/share`)
      .set(authHeader(first.token))
      .send({ email: 'nobody@example.com' });

    expect(res.status).toBe(404);
  });

  it('collaborators see and update shared tasks but cannot delete them', async () => {
    const create = await request(app)
      .post('/api/tasks')
      .set(authHeader(first.token))
      .send({ title: 'Collab', priority: 'high' });
    await request(app)
      .post(`/api/tasks/${create.body.task._id}/share`)
      .set(authHeader(first.token))
      .send({ email: second.email });

    const listed = await request(app).get('/api/tasks').set(authHeader(second.token));
    expect(listed.body.tasks.some((task) => task.title === 'Collab')).toBe(true);

    const updated = await request(app)
      .put(`/api/tasks/${create.body.task._id}`)
      .set(authHeader(second.token))
      .send({ status: 'in_progress' });
    expect(updated.status).toBe(200);
    expect(updated.body.task.status).toBe('in_progress');

    const removed = await request(app)
      .delete(`/api/tasks/${create.body.task._id}`)
      .set(authHeader(second.token));
    expect(removed.status).toBe(404);
  });

  it('non-collaborators still cannot access private tasks', async () => {
    const create = await request(app)
      .post('/api/tasks')
      .set(authHeader(first.token))
      .send({ title: 'Private' });

    const res = await request(app)
      .get(`/api/tasks/${create.body.task._id}`)
      .set(authHeader(second.token));

    expect(res.status).toBe(404);
  });

  it('removes a collaborator', async () => {
    const create = await request(app)
      .post('/api/tasks')
      .set(authHeader(first.token))
      .send({ title: 'Unshare me' });
    const share = await request(app)
      .post(`/api/tasks/${create.body.task._id}/share`)
      .set(authHeader(first.token))
      .send({ email: second.email });

    const res = await request(app)
      .delete(`/api/tasks/${create.body.task._id}/share/${share.body.sharedWith[0].id}`)
      .set(authHeader(first.token));

    expect(res.status).toBe(204);
    const listed = await request(app).get('/api/tasks').set(authHeader(second.token));
    expect(listed.body.tasks.some((task) => task.title === 'Unshare me')).toBe(false);
>>>>>>> 5ec6efd (test(server): task sharing permissions)
  });

  it('deletes a task', async () => {
    const create = await request(app)
      .post('/api/tasks')
      .set(authHeader(first.token))
      .send({ title: 'Disposable' });

    const res = await request(app)
      .delete(`/api/tasks/${create.body.task._id}`)
      .set(authHeader(first.token));

    expect(res.status).toBe(204);
    const remaining = await Task.countDocuments({ _id: create.body.task._id });
    expect(remaining).toBe(0);
  });
});
