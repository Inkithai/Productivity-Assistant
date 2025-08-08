import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import HabitsPage from './HabitsPage.jsx';
import * as habitsApi from '../api/habits.js';

vi.mock('../api/habits.js', () => ({
  listHabits: vi.fn(),
  createHabit: vi.fn(),
  logHabit: vi.fn(),
  deleteHabit: vi.fn(),
}));

function habit(id, overrides = {}) {
  return {
    _id: id,
    name: `Habit ${id}`,
    targetPerWeek: 5,
    thisWeek: 2,
    doneToday: false,
    streak: 3,
    ...overrides,
  };
}

beforeEach(() => {
  habitsApi.listHabits.mockReset();
  habitsApi.createHabit.mockReset();
});

afterEach(cleanup);

describe('HabitsPage', () => {
  it('renders the habit list with weekly progress', async () => {
    habitsApi.listHabits.mockResolvedValue({ habits: [habit('h1'), habit('h2')] });

    render(<HabitsPage />);

    expect(await screen.findByText('Habit h1')).toBeInTheDocument();
    expect(screen.getByText('Habit h2')).toBeInTheDocument();
  });

  it('creates a habit from the form', async () => {
    habitsApi.listHabits.mockResolvedValue({ habits: [] });
    habitsApi.createHabit.mockResolvedValue({ habit: habit('new') });

    render(<HabitsPage />);
    await screen.findByText(/nothing tracked yet/i);

    fireEvent.change(screen.getByLabelText(/habit name/i), { target: { value: 'Read' } });
    fireEvent.click(screen.getByRole('button', { name: /track habit/i }));

    await waitFor(() =>
      expect(habitsApi.createHabit).toHaveBeenCalledWith({ name: 'Read', targetPerWeek: 5 })
    );
    expect(await screen.findByText('Habit new')).toBeInTheDocument();
  });

  it('ignores empty habit names', async () => {
    habitsApi.listHabits.mockResolvedValue({ habits: [] });

    render(<HabitsPage />);
    await screen.findByText(/nothing tracked yet/i);

    fireEvent.click(screen.getByRole('button', { name: /track habit/i }));

    expect(habitsApi.createHabit).not.toHaveBeenCalled();
  });

  it('shows duplicate-name errors from the server', async () => {
    habitsApi.listHabits.mockResolvedValue({ habits: [] });
    habitsApi.createHabit.mockRejectedValue(new Error('You already track that habit'));

    render(<HabitsPage />);
    await screen.findByText(/nothing tracked yet/i);

    fireEvent.change(screen.getByLabelText(/habit name/i), { target: { value: 'Read' } });
    fireEvent.click(screen.getByRole('button', { name: /track habit/i }));

    expect(await screen.findByText(/already track that habit/i)).toBeInTheDocument();
  });
});
