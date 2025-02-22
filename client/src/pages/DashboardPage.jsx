import { useEffect, useState } from 'react';

import { fetchSummary } from '../api/analytics.js';
import { listTasks } from '../api/tasks.js';
import StatCard from '../components/dashboard/StatCard.jsx';
import UpcomingDeadlines from '../components/dashboard/UpcomingDeadlines.jsx';
import FocusTimer from '../components/focus/FocusTimer.jsx';
import TrendsPanel from '../components/dashboard/TrendsPanel.jsx';
import WeeklyProgress from '../components/dashboard/WeeklyProgress.jsx';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchSummary(), listTasks({ limit: 100 })])
      .then(([analytics, taskData]) => {
        if (cancelled) return;
        setSummary(analytics.summary);
        setTasks(taskData.tasks);
        setError('');
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section>
      <header className="page-head">
        <h1>Dashboard</h1>
      </header>

      {error && <div className="form-error">{error}</div>}
      {loading ? (
        <p className="muted">Loading your day…</p>
      ) : (
        summary && (
          <>
            <div className="stat-grid">
              <StatCard label="Open tasks" value={summary.tasks.total - summary.tasks.done} />
              <StatCard label="Completed" value={summary.tasks.done} tone="good" />
              <StatCard label="Overdue" value={summary.tasks.overdue} tone="danger" />
              <StatCard label="Completion rate" value={`${summary.completionRate}%`} tone="info" />
            </div>

            <div className="dashboard-grid">
              <UpcomingDeadlines tasks={tasks} />
              <div className="card dashboard-panel">
                <h2>This week</h2>
                <WeeklyProgress week={summary.week} />
              </div>
            </div>

            <div className="dashboard-grid">
              <FocusTimer />
              <div className="card dashboard-panel">
                <h2>Focus time</h2>
                <p className="muted">Sessions show up here after your first block.</p>
              </div>
            </div>

            <TrendsPanel />
          </>
        )
      )}
    </section>
  );
}
