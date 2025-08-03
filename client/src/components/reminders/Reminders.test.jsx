import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ReminderForm from './ReminderForm.jsx';
import ReminderItem from './ReminderItem.jsx';
import * as remindersApi from '../../api/reminders.js';

vi.mock('../../api/reminders.js', () => ({
  createReminder: vi.fn(),
  snoozeReminder: vi.fn(),
  cancelReminder: vi.fn(),
}));

function reminder(overrides = {}) {
  return {
    _id: 'r1',
    title: 'Standup',
    message: '',
    remindAt: new Date('2030-06-15T09:30:00').toISOString(),
    status: 'scheduled',
    ...overrides,
  };
}

beforeEach(() => {
  remindersApi.createReminder.mockReset();
  remindersApi.snoozeReminder.mockReset();
  remindersApi.cancelReminder.mockReset();
});

afterEach(cleanup);

describe('ReminderItem', () => {
  it('shows the title and formatted time', () => {
    render(<ReminderItem reminder={reminder()} onChanged={() => {}} />);

    expect(screen.getByText('Standup')).toBeInTheDocument();
    expect(screen.getByText(/09:30/i)).toBeInTheDocument();
  });

  it('offers snooze options for scheduled reminders', async () => {
    remindersApi.snoozeReminder.mockResolvedValue({ reminder: reminder() });

    render(<ReminderItem reminder={reminder()} onChanged={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: '+1h' }));

    await waitFor(() => expect(remindersApi.snoozeReminder).toHaveBeenCalledWith('r1', 60));
  });

  it('cancels through the api', async () => {
    remindersApi.cancelReminder.mockResolvedValue({});

    render(<ReminderItem reminder={reminder()} onChanged={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() => expect(remindersApi.cancelReminder).toHaveBeenCalledWith('r1'));
  });

  it('shows the status instead of actions once cancelled', () => {
    render(<ReminderItem reminder={reminder({ status: 'cancelled' })} onChanged={() => {}} />);

    expect(screen.getByText('cancelled')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
  });

  it('marks past-due reminders as overdue', () => {
    const past = reminder({ remindAt: new Date('2020-01-01T09:30:00').toISOString() });
    const { container } = render(<ReminderItem reminder={past} onChanged={() => {}} />);

    expect(container.querySelector('.reminder-overdue')).toBeInTheDocument();
  });
});

describe('ReminderForm', () => {
  it('blocks submission without a title', async () => {
    const { container } = render(<ReminderForm onCreated={() => {}} />);

    // submit directly: jsdom blocks required-field clicks before React runs
    fireEvent.submit(container.querySelector('form'));

    expect(await screen.findByText(/what should the reminder say/i)).toBeInTheDocument();
    expect(remindersApi.createReminder).not.toHaveBeenCalled();
  });

  it('creates a reminder from the form fields', async () => {
    remindersApi.createReminder.mockResolvedValue({ reminder: reminder() });

    render(<ReminderForm onCreated={() => {}} />);
    fireEvent.change(screen.getByLabelText(/reminder title/i), { target: { value: 'Dentist' } });
    fireEvent.change(screen.getByLabelText(/reminder detail/i), { target: { value: 'Bring card' } });
    fireEvent.click(screen.getByRole('button', { name: /set reminder/i }));

    await waitFor(() =>
      expect(remindersApi.createReminder).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Dentist', message: 'Bring card' })
      )
    );
  });

  it('schedules quick offsets without touching the form', async () => {
    remindersApi.createReminder.mockResolvedValue({ reminder: reminder() });

    render(<ReminderForm onCreated={() => {}} />);
    fireEvent.change(screen.getByLabelText(/reminder title/i), { target: { value: 'Stretch' } });
    fireEvent.click(screen.getByRole('button', { name: /in 3 hours/i }));

    await waitFor(() => {
      const call = remindersApi.createReminder.mock.calls[0][0];
      expect(call.title).toBe('Stretch');
      // roughly three hours out, give or take a second of test latency
      const minutes = (new Date(call.remindAt) - Date.now()) / 60000;
      expect(minutes).toBeGreaterThan(178);
      expect(minutes).toBeLessThan(182);
    });
  });
});
