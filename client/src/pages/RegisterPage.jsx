import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { register } from '../api/auth.js';
import { setToken } from '../api/client.js';

const MIN_PASSWORD_LENGTH = 8;

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  function update(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (form.password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const data = await register(form);
      setToken(data.token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Create your account</h1>
        {error && <div className="form-error">{error}</div>}
        <label>
          Name
          <input value={form.name} onChange={update('name')} autoComplete="name" required />
        </label>
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={update('email')}
            autoComplete="email"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={update('password')}
            autoComplete="new-password"
            required
          />
        </label>
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Creating…' : 'Create account'}
        </button>
        <p className="muted">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </main>
  );
}
