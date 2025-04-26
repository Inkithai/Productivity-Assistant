import { useEffect, useState } from 'react';

import { createHabit, listHabits } from '../api/habits.js';
import HabitRow from '../components/habits/HabitRow.jsx';

export default function HabitsPage() {
  const [habits, setHabits] = useState([]);
  const [name, setName] = useState('');
  const [target, setTarget] = useState(5);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listHabits()
      .then((data) => !cancelled && setHabits(data.habits))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim()) return;

    setError('');
    try {
      const { habit } = await createHabit({ name: name.trim(), targetPerWeek: target });
      setHabits((prev) => [...prev, habit]);
      setName('');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="habits-page">
      <header className="page-head">
        <h1>Habits</h1>
      </header>

      <form className="card habit-form" onSubmit={handleSubmit}>
        <div className="task-form-row">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Read 20 pages"
            aria-label="Habit name"
            required
          />
          <select
            value={target}
            onChange={(event) => setTarget(Number(event.target.value))}
            aria-label="Days per week"
          >
            {[1, 2, 3, 4, 5, 6, 7].map((days) => (
              <option key={days} value={days}>
                {days}× per week
              </option>
            ))}
          </select>
          <button type="submit" className="btn-primary">
            Track habit
          </button>
        </div>
        {error && <div className="form-error">{error}</div>}
      </form>

      {loading ? (
        <p className="muted">Loading habits…</p>
      ) : habits.length === 0 ? (
        <p className="empty-state">Nothing tracked yet. Small habits, big wins.</p>
      ) : (
        <ul className="habit-list">
          {habits.map((habit) => (
            <HabitRow
              key={habit.id}
              habit={habit}
              onChanged={(updated) =>
                setHabits((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
              }
              onRemoved={(id) => setHabits((prev) => prev.filter((item) => item.id !== id))}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
