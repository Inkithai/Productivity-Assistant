import { useState } from 'react';

import { createReminder } from '../../api/reminders.js';
import { toDateTimeInputValue } from '../../utils/dates.js';

const QUICK_OFFSETS = [
  { minutes: 60, label: 'In an hour' },
  { minutes: 3 * 60, label: 'In 3 hours' },
  { minutes: 24 * 60, label: 'Tomorrow' },
];

export default function ReminderForm({ onCreated }) {
  const defaultWhen = () => {
    const date = new Date(Date.now() + 60 * 60 * 1000);
    date.setMinutes(0, 0, 0);
    return toDateTimeInputValue(date);
  };

  const [form, setForm] = useState({ title: '', message: '', remindAt: defaultWhen() });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function update(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function submit(payload) {
    setBusy(true);
    setError('');
    try {
      const { reminder } = await createReminder(payload);
      onCreated(reminder);
      setForm((prev) => ({ ...prev, title: '', message: '' }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!form.title.trim()) {
      setError('What should the reminder say?');
      return;
    }
    submit({
      title: form.title.trim(),
      message: form.message.trim(),
      remindAt: new Date(form.remindAt).toISOString(),
    });
  }

  function quick(minutes) {
    if (!form.title.trim()) {
      setError('Give the reminder a title first');
      return;
    }
    submit({
      title: form.title.trim(),
      message: form.message.trim(),
      remindAt: new Date(Date.now() + minutes * 60 * 1000).toISOString(),
    });
  }

  return (
    <form className="card reminder-form" onSubmit={handleSubmit}>
      <h2>New reminder</h2>
      {error && <div className="form-error">{error}</div>}
      <input
        value={form.title}
        onChange={update('title')}
        placeholder="What do you need to remember?"
        aria-label="Reminder title"
        required
      />
      <input
        value={form.message}
        onChange={update('message')}
        placeholder="Extra detail (optional)"
        aria-label="Reminder detail"
      />
      <div className="task-form-row">
        <input
          type="datetime-local"
          value={form.remindAt}
          onChange={update('remindAt')}
          aria-label="Remind at"
        />
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Set reminder'}
        </button>
      </div>
      <div className="quick-row">
        {QUICK_OFFSETS.map((offset) => (
          <button
            key={offset.minutes}
            type="button"
            className="btn-ghost"
            onClick={() => quick(offset.minutes)}
            disabled={busy}
          >
            {offset.label}
          </button>
        ))}
      </div>
    </form>
  );
}
