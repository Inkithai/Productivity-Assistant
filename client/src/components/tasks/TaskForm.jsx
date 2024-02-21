import { useState } from 'react';

import { createTask } from '../../api/tasks.js';
import { TASK_PRIORITY_LABELS } from '../../utils/constants.js';

const EMPTY = { title: '', description: '', priority: 'medium', dueDate: '', tags: '' };

export default function TaskForm({ onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function update(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.title.trim()) {
      setError('Give the task a title');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const payload = {
        title: form.title.trim(),
        priority: form.priority,
        dueDate: form.dueDate || null,
        tags: form.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      };
      if (form.description.trim()) payload.description = form.description.trim();

      const { task } = await createTask(payload);
      setForm(EMPTY);
      onCreated(task);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="task-form card" onSubmit={handleSubmit}>
      <h2>New task</h2>
      {error && <div className="form-error">{error}</div>}
      <input
        value={form.title}
        onChange={update('title')}
        placeholder="What needs to be done?"
        aria-label="Task title"
        required
      />
      <textarea
        value={form.description}
        onChange={update('description')}
        placeholder="Details (optional)"
        rows={2}
      />
      <div className="task-form-row">
        <select value={form.priority} onChange={update('priority')} aria-label="Priority">
          {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label} priority
            </option>
          ))}
        </select>
        <input
          type="date"
          value={form.dueDate}
          onChange={update('dueDate')}
          aria-label="Due date"
        />
        <input
          value={form.tags}
          onChange={update('tags')}
          placeholder="tags, comma separated"
          aria-label="Tags"
        />
      </div>
      <button type="submit" className="btn-primary" disabled={busy}>
        {busy ? 'Adding…' : 'Add task'}
      </button>
    </form>
  );
}
