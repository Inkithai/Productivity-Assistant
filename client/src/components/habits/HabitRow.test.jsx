import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import HabitRow from './HabitRow.jsx';

import * as habitsApi from '../../api/habits.js';

vi.mock('../../api/habits.js', () => ({
  logHabit: vi.fn(),
  deleteHabit: vi.fn(),
}));

function habit(overrides = {}) {
  return {
    id: 'h1',
    name: 'Read 20 pages',
    targetPerWeek: 5,
    thisWeek: 2,
    doneToday: false,
    streak: 1,
    ...overrides,
  };
}

describe('HabitRow', () => {
  beforeEach(() => {
    habitsApi.logHabit.mockReset();
    habitsApi.deleteHabit.mockReset();
  });

  it('shows weekly progress against the target', () => {
    render(<HabitRow habit={habit()} onChanged={() => {}} onRemoved={() => {}} />);
    expect(screen.getByText('2/5 this week')).toBeInTheDocument();
    expect(screen.queryByText(/🔥/)).not.toBeInTheDocument();
  });

  it('shows a streak badge once it is above one day', () => {
    render(
      <HabitRow habit={habit({ streak: 6 })} onChanged={() => {}} onRemoved={() => {}} />
    );
    expect(screen.getByText('🔥 6d')).toBeInTheDocument();
  });

  it('marks today done through the API', async () => {
    habitsApi.logHabit.mockResolvedValue({ habit: habit({ doneToday: true, thisWeek: 3 }), logged: true });
    const onChanged = vi.fn();

    render(<HabitRow habit={habit()} onChanged={onChanged} onRemoved={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /mark read 20 pages done today/i }));

    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(habitsApi.logHabit).toHaveBeenCalledWith('h1');
  });

  it('removes a habit after confirmation-free delete', async () => {
    habitsApi.deleteHabit.mockResolvedValue(undefined);
    const onRemoved = vi.fn();

    render(<HabitRow habit={habit()} onChanged={() => {}} onRemoved={onRemoved} />);
    fireEvent.click(screen.getByRole('button', { name: /stop tracking read 20 pages/i }));

    await waitFor(() => expect(onRemoved).toHaveBeenCalledWith('h1'));
  });
});
