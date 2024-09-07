import { useEffect, useState } from 'react';

import { listReminders } from '../api/reminders.js';
import ReminderForm from '../components/reminders/ReminderForm.jsx';
import ReminderItem from '../components/reminders/ReminderItem.jsx';

export default function RemindersPage() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    listReminders()
      .then((data) => !cancelled && setReminders(data.reminders))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  function handleChanged(updated) {
    setReminders((prev) =>
      updated ? prev.map((item) => (item._id === updated._id ? updated : item)) : prev
    );
  }

  const scheduled = reminders.filter((reminder) => reminder.status === 'scheduled');
  const history = reminders.filter((reminder) => reminder.status !== 'scheduled');

  return (
    <section className="reminders-page">
      <header className="page-head">
        <h1>Reminders</h1>
      </header>

      {error && <div className="form-error">{error}</div>}

      <ReminderForm onCreated={(reminder) => setReminders((prev) => [...prev, reminder])} />

      {loading ? (
        <p className="muted">Loading reminders…</p>
      ) : (
        <>
          <h2 className="section-title">Scheduled ({scheduled.length})</h2>
          {scheduled.length === 0 ? (
            <p className="empty-state">Nothing scheduled. Set one above.</p>
          ) : (
            <ul className="reminder-list">
              {scheduled.map((reminder) => (
                <ReminderItem key={reminder._id} reminder={reminder} onChanged={handleChanged} />
              ))}
            </ul>
          )}

          {history.length > 0 && (
            <>
              <h2 className="section-title">Sent</h2>
              <ul className="reminder-list reminder-history">
                {history.map((reminder) => (
                  <ReminderItem key={reminder._id} reminder={reminder} onChanged={handleChanged} />
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </section>
  );
}
