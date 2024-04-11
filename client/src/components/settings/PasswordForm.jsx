import { useState } from 'react';

import { changePassword } from '../../api/users.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function PasswordForm() {
  const { push } = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function update(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (form.newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    if (form.newPassword !== form.confirm) {
      setError('Passwords do not match');
      return;
    }

    setBusy(true);
    setError('');
    try {
      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
      push('Password updated');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card settings-form" onSubmit={handleSubmit}>
      <h2>Password</h2>
      {error && <div className="form-error">{error}</div>}
      <label>
        Current password
        <input
          type="password"
          value={form.currentPassword}
          onChange={update('currentPassword')}
          autoComplete="current-password"
          required
        />
      </label>
      <label>
        New password
        <input
          type="password"
          value={form.newPassword}
          onChange={update('newPassword')}
          autoComplete="new-password"
          required
        />
      </label>
      <label>
        Confirm new password
        <input
          type="password"
          value={form.confirm}
          onChange={update('confirm')}
          autoComplete="new-password"
          required
        />
      </label>
      <button type="submit" className="btn-primary" disabled={busy}>
        {busy ? 'Updating…' : 'Update password'}
      </button>
    </form>
  );
}
