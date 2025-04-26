import { deleteHabit, logHabit } from '../../api/habits.js';

export default function HabitRow({ habit, onChanged, onRemoved }) {
  const progress = Math.min(1, habit.thisWeek / habit.targetPerWeek);
  const hitTarget = habit.thisWeek >= habit.targetPerWeek;

  async function toggle() {
    const { habit: updated } = await logHabit(habit.id);
    onChanged(updated);
  }

  async function handleDelete() {
    await deleteHabit(habit.id);
    onRemoved(habit.id);
  }

  return (
    <li className="habit-row">
      <button
        type="button"
        className={`habit-check ${habit.doneToday ? 'habit-check-done' : ''}`}
        onClick={toggle}
        aria-pressed={habit.doneToday}
        aria-label={`Mark ${habit.name} ${habit.doneToday ? 'not done' : 'done'} today`}
      >
        {habit.doneToday ? '✓' : ''}
      </button>
      <div className="habit-body">
        <span className="habit-name">{habit.name}</span>
        <span className="habit-progress">
          <span className="workload-bar">
            <span
              className={`workload-fill ${hitTarget ? 'habit-fill-done' : ''}`}
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </span>
          <span className="muted">
            {habit.thisWeek}/{habit.targetPerWeek} this week
          </span>
        </span>
      </div>
      {habit.streak > 1 && <span className="badge badge-info">🔥 {habit.streak}d</span>}
      <button type="button" className="btn-danger-inline" onClick={handleDelete} aria-label={`Stop tracking ${habit.name}`}>
        Remove
      </button>
    </li>
  );
}
