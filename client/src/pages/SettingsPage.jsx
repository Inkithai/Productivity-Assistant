import { useState } from 'react';

import { updateProfile } from '../api/users.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const TIMEZONES = [
  'UTC',
  'Asia/Colombo',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Los_Angeles',
  'Australia/Sydney',
];

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const { push } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSave(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { user: updated } = await updateProfile({ name, timezone });
      setUser(updated);
      push('Profile saved');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="settings-page">
      <header className="page-head">
        <h1>Settings</h1>
      </header>

      <form className="card settings-form" onSubmit={handleSave}>
        <h2>Profile</h2>
        {error && <div className="form-error">{error}</div>}
        <label>
          Display name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Timezone
          <select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </label>
        <p className="muted">Signed in as {user?.email}</p>
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save profile'}
        </button>
      </form>
    </section>
  );
}
