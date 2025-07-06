import { useState } from 'react';

import { deleteTask, updateTask } from '../../api/tasks.js';
import { TASK_PRIORITY_CLASSES, TASK_PRIORITY_LABELS } from '../../utils/constants.js';
import { dueLabel, isOverdue } from '../../utils/dates.js';
import { TaskEditDialog, TaskShareDialog } from './TaskDialogs.jsx';

export default function TaskItem({ task, onUpdate, onDelete }) {
  const done = task.status === 'done';
  const [editing, setEditing] = useState(false);
  const [sharing, setSharing] = useState(false);

  async function toggleStatus() {
    const { task: updated } = await updateTask(task._id, {
      status: done ? 'todo' : 'done',
    });
    onUpdate(updated);
  }

  async function handleDelete() {
    await deleteTask(task._id);
    onDelete(task._id);
  }

  return (
    <>
      <article className={`task-card ${done ? 'task-card-completed' : ''}`}>
        <label className="task-check">
          <input type="checkbox" checked={done} onChange={toggleStatus} />
        </label>
        <div className="task-body">
          <h3 className="task-title">{task.title}</h3>
          {task.description && <p className="task-desc">{task.description}</p>}
          <div className="task-meta">
            <span className={TASK_PRIORITY_CLASSES[task.priority]}>
              {TASK_PRIORITY_LABELS[task.priority]}
            </span>
            {task.dueDate && (
              <span className={isOverdue(task.dueDate) && !done ? 'due due-overdue' : 'due'}>
                {dueLabel(task.dueDate)}
              </span>
            )}
            {task.repeat && task.repeat !== 'none' && (
              <span className="tag">↻ {task.repeat}</span>
            )}
            {task.tags?.map((tag) => (
              <span key={tag} className="tag">
                #{tag}
              </span>
            ))}
            {task.sharedWith?.length > 0 && <span className="tag">👥 shared</span>}
          </div>
        </div>
        <div className="task-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={() => setEditing(true)}
            aria-label={`Edit ${task.title}`}
          >
            ✎
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setSharing(true)}
            aria-label={`Share ${task.title}`}
          >
            👥
          </button>
          <button type="button" className="icon-btn" onClick={handleDelete} aria-label="Delete task">
            ✕
          </button>
        </div>
      </article>

      {editing && (
        <TaskEditDialog
          task={task}
          onClose={() => setEditing(false)}
          onSaved={(saved) => {
            onUpdate(saved);
            setEditing(false);
          }}
        />
      )}
      {sharing && (
        <TaskShareDialog
          task={task}
          onClose={() => setSharing(false)}
          onShared={() => setSharing(false)}
        />
      )}
    </>
  );
}
