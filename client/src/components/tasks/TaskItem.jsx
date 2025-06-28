import { deleteTask, updateTask } from '../../api/tasks.js';
import { TASK_PRIORITY_CLASSES, TASK_PRIORITY_LABELS } from '../../utils/constants.js';
import { dueLabel, isOverdue } from '../../utils/dates.js';

export default function TaskItem({ task, onUpdate, onDelete }) {
  const done = task.status === 'done';

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
        </div>
      </div>
      <button type="button" className="icon-btn" onClick={handleDelete} aria-label="Delete task">
        ✕
      </button>
    </article>
  );
}
