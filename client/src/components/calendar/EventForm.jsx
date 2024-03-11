import { useState } from 'react';

import { createEvent, updateEvent } from '../../api/events.js';
import { toDateTimeInputValue } from '../../utils/dates.js';

const EVENT_TYPES = [
  { value: 'personal', label: 'Personal' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'other', label: 'Other' },
];

export default function EventForm({ event, onClose, onSaved }) {
  const isNew = !event._id;
  const [form, setForm] = useState({
    title: event.title || '',
    type: event.type || 'personal',
    start: toDateTimeInputValue(event.start) || toDateTimeInputValue(new Date()),
    end: toDateTimeInputValue(event.end),
    allDay: event.allDay || false,
    location: event.location || '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function update(field) {
    return (e) =>
      setForm((prev) => ({
        ...prev,
        [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
      }));
  }

  async function handleSubmit(submitEvent) {
    submitEvent.preventDefault();
    if (!form.title.trim()) {
      setError('Give the event a title');
      return;
    }

    const payload = {
      title: form.title.trim(),
      type: form.type,
      start: form.allDay ? form.start.slice(0, 10) : new Date(form.start).toISOString(),
      end: form.end ? new Date(form.end).toISOString() : null,
      allDay: form.allDay,
      location: form.location.trim(),
    };

    setBusy(true);
    setError('');
    try {
      const { event: saved } = isNew
        ? await createEvent(payload)
        : await updateEvent(event._id, payload);
      onSaved(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card event-form" onSubmit={handleSubmit}>
      <header className="editor-head">
        <h2>{isNew ? 'New event' : 'Edit event'}</h2>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close form">
          ✕
        </button>
      </header>
      {error && <div className="form-error">{error}</div>}
      <input
        value={form.title}
        onChange={update('title')}
        placeholder="Event title"
        aria-label="Event title"
        required
      />
      <div className="task-form-row">
        <select value={form.type} onChange={update('type')} aria-label="Event type">
          {EVENT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        <input
          type={form.allDay ? 'date' : 'datetime-local'}
          value={form.start}
          onChange={update('start')}
          aria-label="Starts"
        />
        <input
          type={form.allDay ? 'date' : 'datetime-local'}
          value={form.end}
          onChange={update('end')}
          aria-label="Ends (optional)"
        />
      </div>
      <div className="task-form-row">
        <input
          value={form.location}
          onChange={update('location')}
          placeholder="Location (optional)"
          aria-label="Location"
        />
        <label className="check-row">
          <input type="checkbox" checked={form.allDay} onChange={update('allDay')} />
          All day
        </label>
      </div>
      <button type="submit" className="btn-primary" disabled={busy}>
        {busy ? 'Saving…' : 'Save event'}
      </button>
    </form>
  );
}
