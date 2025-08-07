import { cancelReminder, snoozeReminder } from '../../api/reminders.js';
import { formatDate } from '../../utils/dates.js';

const SNOOZE_OPTIONS = [
  { minutes: 10, label: '10m' },
  { minutes: 60, label: '1h' },
  { minutes: 24 * 60, label: '1d' },
];

export default function ReminderItem({ reminder, onChanged }) {
  const overdue = reminder.status === 'scheduled' && new Date(reminder.remindAt) <= new Date();

  async function handleSnooze(minutes) {
    const { reminder: updated } = await snoozeReminder(reminder._id, minutes);
    onChanged(updated);
  }

  async function handleCancel() {
    await cancelReminder(reminder._id);
    // pass the cancelled state through so the page can re-file it
    onChanged({ ...reminder, status: 'cancelled' });
  }

  return (
    <li className={`reminder-item ${overdue ? 'reminder-overdue' : ''}`}>
      <div className="reminder-when">
        <span className="reminder-date">{formatDate(reminder.remindAt)}</span>
        <span className="reminder-time">
          {new Date(reminder.remindAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div className="reminder-body">
        <span className="reminder-title">{reminder.title}</span>
        {reminder.message && <span className="reminder-message">{reminder.message}</span>}
      </div>
      {reminder.status === 'scheduled' ? (
        <div className="reminder-actions">
          {SNOOZE_OPTIONS.map((option) => (
            <button
              key={option.minutes}
              type="button"
              className="btn-ghost"
              onClick={() => handleSnooze(option.minutes)}
            >
              +{option.label}
            </button>
          ))}
          <button type="button" className="btn-danger-inline" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      ) : (
        <span className="badge badge-info">{reminder.status}</span>
      )}
    </li>
  );
}
