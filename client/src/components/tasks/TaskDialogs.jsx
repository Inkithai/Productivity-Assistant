import { useState } from 'react';

import { shareTask, updateTask } from '../../api/tasks.js';
import { TASK_PRIORITY_LABELS } from '../../utils/constants.js';
import { toDateInputValue } from '../../utils/dates.js';
import Modal from '../common/Modal.jsx';

export function TaskEditDialog({ task, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    dueDate: toDateInputValue(task.dueDate),
    tags: (task.tags || []).join(', '),
    repeat: task.repeat || 'none',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function update(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!form.title.trim()) {
      setError('Title cannot be empty');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const { task: saved } = await updateTask(task._id, {
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        repeat: form.repeat,
        dueDate: form.dueDate || null,
        tags: form.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
      onSaved(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Edit task" onClose={onClose}>
      <form className="event-form" onSubmit={handleSave}>
        {error && <div className="form-error">{error}</div>}
        <input value={form.title} onChange={update('title')} aria-label="Task title" required />
        <textarea
          value={form.description}
          onChange={update('description')}
          placeholder="Details (optional)"
          rows={3}
          aria-label="Task description"
        />
        <div className="task-form-row">
          <select value={form.priority} onChange={update('priority')} aria-label="Priority">
            {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label} priority
              </option>
            ))}
          </select>
          <input type="date" value={form.dueDate} onChange={update('dueDate')} aria-label="Due date" />
        </div>
        <select value={form.repeat} onChange={update('repeat')} aria-label="Repeat">
          <option value="none">No repeat</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
        <input value={form.tags} onChange={update('tags')} placeholder="tags, comma separated" aria-label="Tags" />
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </Modal>
  );
}

export function TaskShareDialog({ task, onClose, onShared }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleShare(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await shareTask(task._id, email.trim());
      onShared(result);
      setEmail('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`Share “${task.title}”`} onClose={onClose}>
      <form className="event-form" onSubmit={handleShare}>
        {error && <div className="form-error">{error}</div>}
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="collaborator@example.com"
          aria-label="Collaborator email"
          required
        />
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Sharing…' : 'Share task'}
        </button>
        <p className="muted">They will be able to view and update this task.</p>
      </form>
    </Modal>
  );
}
