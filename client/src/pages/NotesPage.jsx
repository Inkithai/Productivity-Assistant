import { useEffect, useMemo, useState } from 'react';

import { deleteNote, listNotes } from '../api/notes.js';
import NoteEditor from '../components/notes/NoteEditor.jsx';
import NotesGrid from '../components/notes/NotesGrid.jsx';

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    listNotes({ limit: 100 })
      .then((data) => !cancelled && setNotes(data.notes))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return notes;
    return notes.filter((note) =>
      [note.title, note.content, ...(note.tags || [])]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    );
  }, [notes, query]);

  function handleSaved(saved) {
    setNotes((prev) => {
      const exists = prev.some((note) => note._id === saved._id);
      return exists ? prev.map((note) => (note._id === saved._id ? saved : note)) : [saved, ...prev];
    });
    setEditing(null);
  }

  async function handleDelete() {
    if (!editing?._id) {
      setEditing(null);
      return;
    }
    await deleteNote(editing._id);
    setNotes((prev) => prev.filter((note) => note._id !== editing._id));
    setEditing(null);
  }

  return (
    <section>
      <header className="page-head">
        <h1>Notes</h1>
        <button type="button" className="btn-primary" onClick={() => setEditing({})}>
          New note
        </button>
      </header>

      <input
        className="notes-search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Filter notes…"
        aria-label="Filter notes"
      />

      {error && <div className="form-error">{error}</div>}
      {loading ? (
        <p className="muted">Loading notes…</p>
      ) : (
        <NotesGrid notes={filtered} onOpen={(note) => setEditing(note)} />
      )}

      {editing && (
        <NoteEditor
          note={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
      {editing?._id && (
        <button type="button" className="btn-danger" onClick={handleDelete}>
          Delete note
        </button>
      )}
    </section>
  );
}
