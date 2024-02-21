import TaskItem from './TaskItem.jsx';

export default function TaskList({ tasks, onUpdate, onDelete, emptyHint = 'Nothing here yet.' }) {
  if (!tasks.length) {
    return <p className="empty-state">{emptyHint}</p>;
  }

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <TaskItem key={task._id} task={task} onUpdate={onUpdate} onDelete={onDelete} />
      ))}
    </div>
  );
}
