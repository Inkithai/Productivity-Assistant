import { useState } from 'react';

import { createNote, summarizeNote, updateNote } from '../../api/notes.js';
import { NOTE_CATEGORY_LABELS } from '../../utils/constants.js';

export default function NoteEditor({ note, onClose, onSaved }) {
  const isNew = !note._id;
  const [form, setForm] = useState({
    title: note.title || '',
    content: note.content || '',
    category: note.category || 'general',
    tags: (note.tags || []).join(', '),
    pinned: note.pinned || false,
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState(null);
  const [summarizing, setSummarizing] = useState(false);

  function update(field) {
    return (e) =>
      setForm((prev) => ({
        ...prev,
        [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
      }));
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!form.title.trim()) {
      setError('Give the note a title');
      return;
    }

    setBusy(true);
    setError('');
    const payload = {
      title: form.title.trim(),
      content: form.content,
      category: form.category,
      pinned: form.pinned,
      tags: form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    try {
      const { note: saved } = isNew ? await createNote(payload) : await updateNote(note._id, payload);
      onSaved(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSummarize() {
    setSummarizing(true);
    setError('');
    try {
      const result = await summarizeNote(note._id);
      setSummary(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setSummarizing(false);
    }
  }

  return (
    <div className="editor-panel">
      <form onSubmit={handleSave} className="note-form">
        <header className="editor-head">
          <h2>{isNew ? 'New note' : 'Edit note'}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close editor">
            ✕
          </button>
        </header>
        {error && <div className="form-error">{error}</div>}
        <input
          value={form.title}
          onChange={update('title')}
          placeholder="Note title"
          aria-label="Note title"
          required
        />
        <textarea
          value={form.content}
          onChange={update('content')}
          placeholder="Start writing…"
          rows={12}
          aria-label="Note content"
        />
        <div className="task-form-row">
          <select value={form.category} onChange={update('category')} aria-label="Category">
            {Object.entries(NOTE_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            value={form.tags}
            onChange={update('tags')}
            placeholder="tags, comma separated"
            aria-label="Tags"
          />
        </div>
        <label className="check-row">
          <input type="checkbox" checked={form.pinned} onChange={update('pinned')} />
          Pinned
        </label>
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save note'}
        </button>
        {!isNew && (
          <button type="button" className="btn-ghost" onClick={handleSummarize} disabled={summarizing}>
            {summarizing ? 'Summarizing…' : '✨ Summarize with AI'}
          </button>
        )}
        {summary && (
          <div className="note-summary">
            <h4>Key points</h4>
            <ul>
              {summary.key_points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        )}
      </form>
    </div>
  );
}
