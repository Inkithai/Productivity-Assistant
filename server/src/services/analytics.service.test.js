const mongoose = require('mongoose');

const TaskModel = require('../models/task.model');
const User = require('../models/user.model');
const { buildSummary, weekBuckets } = require('./analytics.service');
const { connectTestDb, clearTestDb, disconnectTestDb } = require('../testing/db');

describe('analytics summary', () => {
  beforeAll(connectTestDb);
  afterEach(clearTestDb);
  afterAll(disconnectTestDb);

  async function seedUser() {
    return User.create({ name: 'Stats', email: 'stats@example.com', passwordHash: 'x' });
  }

  it('builds seven day buckets ending today', () => {
    const buckets = weekBuckets(new Date('2024-04-16T15:00:00Z'));

    expect(buckets).toHaveLength(7);
    expect(buckets[6].label).toBe(new Date('2024-04-16T15:00:00Z').toLocaleDateString('en-US', { weekday: 'short' }));
    for (const bucket of buckets) {
      expect(bucket.end.getTime() - bucket.start.getTime()).toBe(24 * 60 * 60 * 1000);
    }
  });

  it('counts task states and overdue tasks', async () => {
    const user = await seedUser();
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    await TaskModel.create([
      { userId: user._id, title: 'Open', status: 'todo' },
      { userId: user._id, title: 'Doing', status: 'in_progress' },
      { userId: user._id, title: 'Done', status: 'done', completedAt: yesterday },
      { userId: user._id, title: 'Late', status: 'todo', dueDate: yesterday },
      { userId: user._id, title: 'Future', status: 'todo', dueDate: new Date(now.getTime() + 86_400_000) },
    ]);

    const summary = await buildSummary(user._id, now);

    expect(summary.tasks).toMatchObject({
      total: 5,
      todo: 3,
      in_progress: 1,
      done: 1,
      overdue: 1,
    });
    expect(summary.completionRate).toBe(20);
  });

  it('buckets completions into the right weekday', async () => {
    const user = await seedUser();
    const now = new Date();

    const completedAt = new Date(now);
    completedAt.setHours(now.getHours() - 2);

    await TaskModel.create({
      userId: user._id,
      title: 'Just finished',
      status: 'done',
      completedAt,
    });

    const summary = await buildSummary(user._id, now);

    expect(summary.week).toHaveLength(7);
    const todayBucket = summary.week[6];
    expect(todayBucket.completed).toBe(1);
    expect(summary.week.slice(0, 6).every((day) => day.completed === 0)).toBe(true);
  });

  it('handles users without tasks', async () => {
    const user = await seedUser();
    const summary = await buildSummary(user._id);

    expect(summary.tasks.total).toBe(0);
    expect(summary.completionRate).toBe(0);
    expect(summary.week.every((day) => day.completed === 0 && day.created === 0)).toBe(true);
  });
});
