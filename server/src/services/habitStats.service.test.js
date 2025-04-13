const { countStreak, dayKey, startOfWeek, summarizeHabit } = require('./habitStats.service');
const { Habit, HabitLog } = require('../models/habit.model');
const User = require('../models/user.model');
const { connectTestDb, clearTestDb, disconnectTestDb } = require('../testing/db');

describe('habit stats', () => {
  beforeAll(connectTestDb);
  afterEach(clearTestDb);
  afterAll(disconnectTestDb);

  it('formats day keys without timezone surprises', () => {
    expect(dayKey(new Date('2025-04-12T23:30:00'))).toBe('2025-04-12');
  });

  it('starts weeks on monday', () => {
    // 2025-04-12 is a Saturday; its week starts Monday the 7th
    expect(startOfWeek(new Date(2025, 3, 12)).getDate()).toBe(7);
  });

  it('counts consecutive days including today', () => {
    const today = new Date();
    const days = [dayKey(today), dayKey(new Date(today.getTime() - 86_400_000))];
    expect(countStreak(days)).toBe(2);
  });

  it('keeps the streak alive when today is not logged yet', () => {
    const yesterday = new Date(Date.now() - 86_400_000);
    expect(countStreak([dayKey(yesterday)])).toBe(1);
    expect(countStreak([])).toBe(0);
  });

  it('summarises a habit with weekly progress and streak', async () => {
    const user = await User.create({ name: 'Habit', email: 'habits@example.com', passwordHash: 'x' });
    const habit = await Habit.create({ userId: user._id, name: 'Read', targetPerWeek: 5 });

    const today = new Date();
    await HabitLog.create([
      { habitId: habit._id, userId: user._id, day: dayKey(today) },
      { habitId: habit._id, userId: user._id, day: dayKey(new Date(today.getTime() - 86_400_000)) },
      { habitId: habit._id, userId: user._id, day: dayKey(new Date(today.getTime() - 2 * 86_400_000)) },
    ]);

    const summary = await summarizeHabit(habit, today);

    expect(summary).toMatchObject({
      name: 'Read',
      targetPerWeek: 5,
      thisWeek: 3,
      doneToday: true,
      streak: 3,
    });
  });
});
