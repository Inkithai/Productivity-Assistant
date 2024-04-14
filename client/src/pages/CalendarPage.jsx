import { useEffect, useMemo, useState } from 'react';

import { deleteEvent, listEvents } from '../api/events.js';
import CalendarGrid from '../components/calendar/CalendarGrid.jsx';
import EventForm from '../components/calendar/EventForm.jsx';
import Modal from '../components/common/Modal.jsx';
import { dayKey, formatDate, monthMatrix } from '../utils/dates.js';

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function CalendarPage() {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(dayKey(today));
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const range = useMemo(() => {
    const from = new Date(cursor.year, cursor.month, 1);
    const to = new Date(cursor.year, cursor.month + 1, 0, 23, 59, 59);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [cursor]);

  useEffect(() => {
    let cancelled = false;
    listEvents(range)
      .then((data) => !cancelled && setEvents(data.events))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [range]);

  const weeks = useMemo(() => monthMatrix(cursor.year, cursor.month), [cursor]);

  const eventsByDay = useMemo(() => {
    const map = new Map();
    for (const event of events) {
      const key = dayKey(new Date(event.start));
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(event);
    }
    return map;
  }, [events]);

  const selectedEvents = eventsByDay.get(selected) || [];

  function shiftMonth(delta) {
    setCursor((prev) => {
      const next = new Date(prev.year, prev.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  }

  function handleSaved(saved) {
    setEvents((prev) => {
      const exists = prev.some((event) => event._id === saved._id);
      return exists
        ? prev.map((event) => (event._id === saved._id ? saved : event))
        : [...prev, saved];
    });
    setEditing(null);
  }

  async function handleDelete(id) {
    await deleteEvent(id);
    setEvents((prev) => prev.filter((event) => event._id !== id));
    setEditing(null);
  }

  return (
    <section>
      <header className="page-head">
        <h1>
          {MONTH_LABELS[cursor.month]} {cursor.year}
        </h1>
        <div className="month-nav">
          <button type="button" className="btn-ghost" onClick={() => shiftMonth(-1)}>
            ‹ Prev
          </button>
          <button type="button" className="btn-ghost" onClick={() => setCursor({ year: today.getFullYear(), month: today.getMonth() })}>
            Today
          </button>
          <button type="button" className="btn-ghost" onClick={() => shiftMonth(1)}>
            Next ›
          </button>
        </div>
      </header>

      {error && <div className="form-error">{error}</div>}

      <CalendarGrid
        weeks={weeks}
        eventsByDay={eventsByDay}
        today={today}
        selected={selected}
        onDaySelect={(date) => setSelected(dayKey(date))}
      />

      <div className="day-detail card">
        <header className="editor-head">
          <h2>{formatDate(new Date(`${selected}T00:00:00`))}</h2>
          <button type="button" className="btn-primary" onClick={() => setEditing({ start: `${selected}T09:00:00` })}>
            Add event
          </button>
        </header>
        {selectedEvents.length === 0 && <p className="muted">No events on this day.</p>}
        <ul className="day-event-list">
          {selectedEvents.map((event) => (
            <li key={event._id}>
              <button type="button" className="day-event-row" onClick={() => setEditing(event)}>
                <span className={`event-dot type-${event.type}`} aria-hidden="true" />
                <span>{event.title}</span>
                {!event.allDay && <span className="muted">{new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
              </button>
              {editing?._id === event._id && (
                <button type="button" className="btn-danger-inline" onClick={() => handleDelete(event._id)}>
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {editing && (
        <Modal title={editing._id ? 'Edit event' : 'New event'} onClose={() => setEditing(null)}>
          <EventForm event={editing} onSaved={handleSaved} />
        </Modal>
      )}
    </section>
  );
}
