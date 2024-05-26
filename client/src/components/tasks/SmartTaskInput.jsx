import { useState } from 'react';

import { extractTask } from '../../api/assistant.js';
import { createTask } from '../../api/tasks.js';
import { TASK_PRIORITY_LABELS } from '../../utils/constants.js';
import { formatDate } from '../../utils/dates.js';

export default function SmartTaskInput({ onCreated }) {
  const [text, setText] = useState('');
  const [suggestion, setSuggestion] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleExtract(event) {
    event.preventDefault();
    if (text.trim().length < 3) return;

    setBusy(true);
    setError('');
    try {
      const data = await extractTask(text.trim());
      setSuggestion(data.suggestion);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirm() {
    setBusy(true);
    try {
      const { task } = await createTask({
        title: suggestion.title,
        priority: suggestion.priority,
        dueDate: suggestion.due_date || null,
        tags: suggestion.tags || [],
      });
      onCreated(task);
      reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setText('');
    setSuggestion(null);
    setError('');
  }

  return (
    <div className="smart-input">
      <form onSubmit={handleExtract} className="smart-input-form">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='Try "remind me to prepare for my interview next friday"'
          aria-label="Describe a task in your own words"
          disabled={busy}
        />
        <button type="submit" className="btn-primary" disabled={busy || text.trim().length < 3}>
          {busy ? 'Thinking…' : '✨ Add with AI'}
        </button>
      </form>

      {error && <div className="form-error">{error}</div>}

      {suggestion && (
        <div className="suggestion-card card">
          <p className="muted">Here's what I understood:</p>
          <p className="suggestion-title">{suggestion.title}</p>
          <div className="task-meta">
            <span className="badge badge-info">
              {TASK_PRIORITY_LABELS[suggestion.priority] || suggestion.priority} priority
            </span>
            {suggestion.due_date && (
              <span className="due">Due {formatDate(suggestion.due_date)}</span>
            )}
            <span className="muted">
              confidence {Math.round((suggestion.confidence || 0) * 100)}%
            </span>
          </div>
          <div className="suggestion-actions">
            <button type="button" className="btn-primary" onClick={handleConfirm} disabled={busy}>
              Create task
            </button>
            <button type="button" className="btn-ghost" onClick={reset}>
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
