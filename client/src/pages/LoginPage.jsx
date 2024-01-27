import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { login } from '../api/auth.js';
import { setToken } from '../api/client.js';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await login({ email, password });
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
        <h1>Welcome back</h1>
        {error && <div className="form-error">{error}</div>}
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="muted">
          No account yet? <Link to="/register">Create one</Link>
        </p>
      </form>
    </main>
  );
}
