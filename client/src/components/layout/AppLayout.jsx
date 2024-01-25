import { NavLink, Outlet } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/tasks', label: 'Tasks' },
  { to: '/notes', label: 'Notes' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/assistant', label: 'Assistant' },
];

export default function AppLayout() {
  return (
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
      </aside>
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}
