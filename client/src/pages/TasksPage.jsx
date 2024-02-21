import { useEffect, useState } from 'react';

import { listTasks } from '../api/tasks.js';
import TaskForm from '../components/tasks/TaskForm.jsx';
import TaskList from '../components/tasks/TaskList.jsx';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listTasks({ page })
      .then((data) => {
        if (cancelled) return;
        setTasks(data.tasks);
        setMeta(data.meta);
        setError('');
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [page]);

  function handleUpdate(updated) {
    setTasks((prev) => prev.map((task) => (task._id === updated._id ? updated : task)));
  }

  function handleDelete(id) {
    setTasks((prev) => prev.filter((task) => task._id !== id));
  }

  if (loading && !tasks.length) return <p className="muted">Loading tasks…</p>;
  if (error) return <div className="form-error">{error}</div>;

  return (
    <section>
      <header className="page-head">
        <h1>Tasks</h1>
      </header>
      <TaskForm onCreated={(task) => setTasks((prev) => [task, ...prev])} />
      <TaskList
        tasks={tasks}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        emptyHint="No tasks yet. Add your first one above."
      />
      {meta && meta.pages > 1 && (
        <footer className="pager">
          <button
            type="button"
            className="btn-ghost"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span className="muted">
            Page {meta.page} of {meta.pages}
          </span>
          <button
            type="button"
            className="btn-ghost"
            disabled={page >= meta.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </footer>
      )}
    </section>
  );
}
