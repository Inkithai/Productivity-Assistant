import EmptyState from '../common/EmptyState.jsx';
import TaskItem from './TaskItem.jsx';

export default function TaskList({ tasks, onUpdate, onDelete, onShare, emptyHint }) {
  if (!tasks.length) {
    return <EmptyState hint={emptyHint} />;
  }

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <TaskItem key={task._id} task={task} onUpdate={onUpdate} onDelete={onDelete} onShare={onShare} />
      ))}
    </div>
  );
}
