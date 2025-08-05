const Task = require('../models/task.model');
const Note = require('../models/note.model');
const User = require('../models/user.model');
const { buildContext } = require('./contextBuilder.service');
const { connectTestDb, clearTestDb, disconnectTestDb } = require('../testing/db');

const NOW = new Date('2024-06-15T10:00:00');

describe('assistant context builder', () => {
  beforeAll(connectTestDb);
  afterEach(clearTestDb);
  afterAll(disconnectTestDb);

  let user;

  beforeEach(async () => {
    user = await User.create({ name: 'Ctx', email: 'ctx@example.com', passwordHash: 'x' });
  });

  function task(overrides = {}) {
    return { userId: user._id, title: 'Task', ...overrides };
  }

  it('splits tasks into today, overdue and upcoming', async () => {
    await Task.create([
      task({ title: 'Due now', dueDate: new Date('2024-06-15T15:00:00') }),
      task({ title: 'Late', dueDate: new Date('2024-06-13T09:00:00') }),
      task({ title: 'Soon', dueDate: new Date('2024-06-20T09:00:00') }),
      task({ title: 'Far', dueDate: new Date('2024-09-20T09:00:00') }),
      task({ title: 'No date' }),
      task({ title: 'Done today', status: 'done', completedAt: NOW, dueDate: NOW }),
    ]);

    const context = await buildContext(user._id, NOW);

    expect(context.today_tasks.map((t) => t.title)).toEqual(['Due now']);
    expect(context.overdue.map((t) => t.title)).toEqual(['Late']);
    expect(context.upcoming.map((t) => t.title)).toEqual(['Soon']);
  });

  it('never leaks other users tasks', async () => {
    const other = await User.create({ name: 'Other', email: 'other-ctx@example.com', passwordHash: 'x' });
    await Task.create({ userId: other._id, title: 'Theirs', dueDate: NOW });

    const context = await buildContext(user._id, NOW);

    expect(context.today_tasks).toHaveLength(0);
    expect(context.overdue).toHaveLength(0);
  });

  it('includes recent note titles', async () => {
    // insert at the driver level: the timestamps plugin overwrites an
    // explicit updatedAt on create, which made this test order-flaky
    await Note.collection.insertMany([
      {
        userId: user._id,
        title: 'Newest note',
        createdAt: new Date('2024-06-01T09:00:00'),
        updatedAt: new Date('2024-06-15T09:00:00'),
      },
      {
        userId: user._id,
        title: 'Older note',
        createdAt: new Date('2024-05-01T09:00:00'),
        updatedAt: new Date('2024-06-01T09:00:00'),
      },
    ]);

    const context = await buildContext(user._id, NOW);

    expect(context.recent_notes.map((note) => note.title)).toEqual([
      'Newest note',
      'Older note',
    ]);
  });
});
