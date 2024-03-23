const Reminder = require('../models/reminder.model');
const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const { dispatchDueReminders, dispatchReminder } = require('./reminderDispatcher.service');
const { connectTestDb, clearTestDb, disconnectTestDb } = require('../testing/db');

describe('reminder dispatcher', () => {
  beforeAll(connectTestDb);
  afterEach(clearTestDb);
  afterAll(disconnectTestDb);

  async function seedUser() {
    return User.create({ name: 'Dispatch', email: 'dispatch@example.com', passwordHash: 'x' });
  }

  it('dispatches only reminders that are due', async () => {
    const user = await seedUser();
    await Reminder.create([
      { userId: user._id, title: 'Overdue', remindAt: new Date(Date.now() - 60_000) },
      { userId: user._id, title: 'Future', remindAt: new Date(Date.now() + 3_600_000) },
      {
        userId: user._id,
        title: 'Already sent',
        remindAt: new Date(Date.now() - 60_000),
        status: 'sent',
      },
    ]);

    const dispatched = await dispatchDueReminders();

    expect(dispatched).toHaveLength(1);
    expect(dispatched[0].title).toBe('Overdue');

    const statuses = await Reminder.find({ title: 'Overdue' });
    expect(statuses[0].status).toBe('sent');
    expect(statuses[0].sentAt).toBeInstanceOf(Date);
  });

  it('creates a notification for the owner', async () => {
    const user = await seedUser();
    const reminder = await Reminder.create({
      userId: user._id,
      title: 'Project review',
      message: 'In 10 minutes',
      remindAt: new Date(Date.now() - 1000),
    });

    await dispatchDueReminders();

    const notification = await Notification.findOne({ userId: user._id });
    expect(notification.type).toBe('reminder');
    expect(notification.title).toBe('Project review');
    expect(String(notification.meta.reminderId)).toBe(String(reminder._id));
  });

  it('skips reminders already claimed by another worker', async () => {
    const user = await seedUser();
    const reminder = await Reminder.create({
      userId: user._id,
      title: 'Racy',
      remindAt: new Date(Date.now() - 1000),
    });

    // Simulate another process claiming it between the query and dispatch.
    await Reminder.updateOne({ _id: reminder._id }, { status: 'sent' });

    const result = await dispatchReminder(reminder);
    expect(result).toBeNull();

    const count = await Notification.countDocuments({ userId: user._id });
    expect(count).toBe(0);
  });
});
