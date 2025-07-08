import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import TaskList from './TaskList.jsx';
import TaskForm from './TaskForm.jsx';
import { TaskEditDialog, TaskShareDialog } from './TaskDialogs.jsx';

import * as tasksApi from '../../api/tasks.js';

vi.mock('../../api/tasks.js', () => ({
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  shareTask: vi.fn(),
}));

function makeTask(overrides = {}) {
  return {
    _id: 't1',
    title: 'Write release notes',
    status: 'todo',
    priority: 'medium',
    tags: [],
    ...overrides,
  };
}

describe('TaskList', () => {
  beforeEach(() => {
    tasksApi.createTask.mockReset();
    tasksApi.updateTask.mockReset();
    tasksApi.deleteTask.mockReset();
    tasksApi.shareTask.mockReset();
  });

  it('shows an empty state when there are no tasks', () => {
    render(<TaskList tasks={[]} onUpdate={() => {}} onDelete={() => {}} />);
    expect(screen.getByText(/nothing here yet/i)).toBeInTheDocument();
  });

  it('renders task titles and meta', () => {
    const task = makeTask({
      priority: 'high',
      dueDate: '2031-01-15T00:00:00.000Z',
      tags: ['work', 'release'],
    });
    render(<TaskList tasks={[task]} onUpdate={() => {}} onDelete={() => {}} />);

    expect(screen.getByText('Write release notes')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('#work')).toBeInTheDocument();
  });

  it('marks a completed task', () => {
    const task = makeTask({ status: 'done' });
    const { container } = render(
      <TaskList tasks={[task]} onUpdate={() => {}} onDelete={() => {}} />
    );
    expect(container.querySelector('.task-card-completed')).toBeInTheDocument();
  });

  it('toggles status through the checkbox', async () => {
    tasksApi.updateTask.mockResolvedValue({ task: makeTask({ status: 'done' }) });
    const onUpdate = vi.fn();
    render(<TaskList tasks={[makeTask()]} onUpdate={onUpdate} onDelete={() => {}} />);

    fireEvent.click(screen.getByRole('checkbox'));
    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    expect(tasksApi.updateTask).toHaveBeenCalledWith('t1', { status: 'done' });
  });

  it('opens the edit dialog and saves changes', async () => {
    tasksApi.updateTask.mockResolvedValue({ task: makeTask({ title: 'Renamed' }) });

    render(<TaskList tasks={[makeTask()]} onUpdate={() => {}} onDelete={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /edit write release notes/i }));

    const titleInput = screen.getByLabelText(/task title/i);
    expect(titleInput).toHaveValue('Write release notes');
    fireEvent.change(titleInput, { target: { value: 'Renamed note' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() =>
      expect(tasksApi.updateTask).toHaveBeenCalledWith(
        't1',
        expect.objectContaining({ title: 'Renamed note' })
      )
    );
  });

  it('blocks empty titles in the edit dialog', async () => {
    render(
      <TaskEditDialog task={makeTask()} onClose={() => {}} onSaved={() => {}} />
    );

    fireEvent.change(screen.getByLabelText(/task title/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    expect(await screen.findByText(/title cannot be empty/i)).toBeInTheDocument();
    expect(tasksApi.updateTask).not.toHaveBeenCalled();
  });

  it('shares a task by email', async () => {
    tasksApi.shareTask.mockResolvedValue({ sharedWith: [{ id: 'u2', email: 'team@example.com' }] });

    render(
      <TaskShareDialog task={makeTask()} onClose={() => {}} onShared={() => {}} />
    );
    fireEvent.change(screen.getByLabelText(/collaborator email/i), {
      target: { value: 'team@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /share task/i }));

    await waitFor(() => expect(tasksApi.shareTask).toHaveBeenCalledWith('t1', 'team@example.com'));
  });

  it('removes a task after delete', async () => {
    tasksApi.deleteTask.mockResolvedValue(undefined);
    const onDelete = vi.fn();
    render(<TaskList tasks={[makeTask()]} onUpdate={() => {}} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole('button', { name: /delete task/i }));
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('t1'));
  });
});

describe('TaskForm', () => {
  it('blocks submission without a title', async () => {
    render(<TaskForm onCreated={() => {}} />);
    fireEvent.submit(screen.getByRole('button', { name: /add task/i }));
    expect(await screen.findByText(/give the task a title/i)).toBeInTheDocument();
    expect(tasksApi.createTask).not.toHaveBeenCalled();
  });

  it('creates a task with parsed tags', async () => {
    tasksApi.createTask.mockResolvedValue({ task: makeTask() });
    const onCreated = vi.fn();

    render(<TaskForm onCreated={onCreated} />);
    fireEvent.change(screen.getByLabelText(/task title/i), {
      target: { value: 'Prepare demo' },
    });
    fireEvent.change(screen.getByLabelText(/tags/i), {
      target: { value: 'demo, q1 , ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /add task/i }));

    await waitFor(() => expect(onCreated).toHaveBeenCalled());
    expect(tasksApi.createTask).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Prepare demo', tags: ['demo', 'q1'] })
    );
  });
});
