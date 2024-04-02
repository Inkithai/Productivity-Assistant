import { Link } from 'react-router-dom';

import { dueLabel } from '../../utils/dates.js';

export default function UpcomingDeadlines({ tasks }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = tasks
    .filter((task) => task.status !== 'done' && task.dueDate && new Date(task.dueDate) >= today)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  return (
    <div className="card dashboard-panel">
      <header className="editor-head">
        <h2>Upcoming deadlines</h2>
        <Link to="/tasks" className="panel-link">
          All tasks →
        </Link>
      </header>
      {upcoming.length === 0 ? (
        <p className="muted">Nothing due soon. Enjoy the calm.</p>
      ) : (
        <ul className="deadline-list">
          {upcoming.map((task) => (
            <li key={task._id}>
              <span className="deadline-title">{task.title}</span>
              <span className="due">{dueLabel(task.dueDate)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
