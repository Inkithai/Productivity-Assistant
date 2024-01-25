import { Link } from 'react-router-dom';

export default function RegisterPage() {
  return (
    <main className="auth-page">
      <form className="auth-card">
        <h1>Create your account</h1>
        <p className="muted">Registration will be wired up shortly.</p>
        <Link to="/login">Back to login</Link>
      </form>
    </main>
  );
}
