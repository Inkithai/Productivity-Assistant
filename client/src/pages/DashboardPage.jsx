import { useEffect, useState } from 'react';

import { listTasks } from '../api/tasks.js';
import StatCard from '../components/dashboard/StatCard.jsx';
import UpcomingDeadlines from '../components/dashboard/UpcomingDeadlines.jsx';
import { isOverdue } from '../utils/dates.js';

export default function DashboardPage() {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listTasks({ limit: 100 })
      .then((data) => !cancelled && setTasks(data.tasks))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const open = tasks.filter((task) => task.status !== 'done');
  const done = tasks.filter((task) => task.status === 'done');
  const overdue = open.filter((task) => isOverdue(task.dueDate));
  const completionRate = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0;

  return (
    <section>
      <header className="page-head">
        <h1>Dashboard</h1>
      </header>

      {error && <div className="form-error">{error}</div>}
      {loading ? (
        <p className="muted">Loading your day…</p>
      ) : (
        <>
          <div className="stat-grid">
            <StatCard label="Open tasks" value={open.length} />
            <StatCard label="Completed" value={done.length} tone="good" />
            <StatCard label="Overdue" value={overdue.length} tone="danger" />
            <StatCard label="Completion rate" value={`${completionRate}%`} tone="info" />
          </div>

          <div className="dashboard-grid">
            <UpcomingDeadlines tasks={tasks} />
            <div className="card dashboard-panel">
              <h2>This week</h2>
              <p className="muted">Productivity charts are coming soon.</p>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
