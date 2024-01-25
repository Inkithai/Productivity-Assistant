import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function LoginPage() {
  return (
    <main className="auth-page">
      <form className="auth-card">
        <h1>Welcome back</h1>
        <p className="muted">Login will be wired up shortly.</p>
        <Link to="/register">Create an account</Link>
      </form>
    </main>
  );
}
