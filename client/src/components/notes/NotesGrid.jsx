import { NOTE_CATEGORY_LABELS } from '../../utils/constants.js';
import { formatDate } from '../../utils/dates.js';

export default function NotesGrid({ notes, onOpen }) {
  if (!notes.length) {
    return <p className="empty-state">No notes found. Create one to get started.</p>;
  }

  return (
    <div className="notes-grid">
      {notes.map((note) => (
        <button type="button" key={note._id} className="note-card" onClick={() => onOpen(note)}>
          {note.pinned && <span className="pin">📌</span>}
          <h3>{note.title}</h3>
          <p className="note-preview">{note.content || 'Empty note'}</p>
          <footer>
            <span className="tag">{NOTE_CATEGORY_LABELS[note.category] || note.category}</span>
            <span className="muted">{formatDate(note.updatedAt)}</span>
          </footer>
        </button>
      ))}
    </div>
  );
}
