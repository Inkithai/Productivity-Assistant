import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext.jsx';
import Topbar from './Topbar.jsx';
import ReminderToaster from './ReminderToaster.jsx';
import { ToastProvider } from '../../context/ToastContext.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/tasks', label: 'Tasks' },
  { to: '/notes', label: 'Notes' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/assistant', label: 'Assistant' },
  { to: '/reminders', label: 'Reminders' },
  { to: '/settings', label: 'Settings' },
];

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  function handleSignOut() {
    signOut();
    navigate('/login');
  }

  return (
    <ToastProvider>
      <ReminderToaster />
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="sidebar-brand">
            Productivity<span>Assistant</span>
          </div>
          <nav className="sidebar-nav">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-footer">
            <span className="muted">{user?.name}</span>
            <button type="button" className="btn-ghost" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </aside>
      <div className="app-main">
        <Topbar title="Productivity Assistant" />
        <main className="app-content">
          <Outlet />
        </main>
        </div>
      </div>
    </ToastProvider>
  );
}
