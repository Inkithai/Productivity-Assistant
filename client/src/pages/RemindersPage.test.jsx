import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import RemindersPage from './RemindersPage.jsx';
import * as remindersApi from '../api/reminders.js';

vi.mock('../api/reminders.js', () => ({
  listReminders: vi.fn(),
  createReminder: vi.fn(),
  snoozeReminder: vi.fn(),
  cancelReminder: vi.fn(),
}));

function reminder(id, overrides = {}) {
  return {
    _id: id,
    title: `Reminder ${id}`,
    message: '',
    remindAt: new Date('2030-06-15T09:30:00').toISOString(),
    status: 'scheduled',
    ...overrides,
  };
}

beforeEach(() => {
  remindersApi.listReminders.mockReset();
  remindersApi.cancelReminder.mockReset();
});

afterEach(cleanup);

describe('RemindersPage', () => {
  it('splits loaded reminders into scheduled and sent', async () => {
    remindersApi.listReminders.mockResolvedValue({
      reminders: [
        reminder('a'),
        reminder('b', { status: 'sent' }),
        reminder('c'),
      ],
    });

    render(<RemindersPage />);

    expect(await screen.findByText('Reminder a')).toBeInTheDocument();
    expect(screen.getByText('Scheduled (2)')).toBeInTheDocument();
    expect(screen.getByText('Reminder b')).toBeInTheDocument();
    expect(screen.getByText('Sent')).toBeInTheDocument();
  });

  it('shows the empty state when nothing is scheduled', async () => {
    remindersApi.listReminders.mockResolvedValue({ reminders: [] });

    render(<RemindersPage />);

    expect(await screen.findByText(/nothing scheduled/i)).toBeInTheDocument();
  });

  it('moves a cancelled reminder out of the scheduled list', async () => {
    remindersApi.listReminders.mockResolvedValue({ reminders: [reminder('a')] });
    remindersApi.cancelReminder.mockResolvedValue({});

    render(<RemindersPage />);
    await screen.findByText('Reminder a');

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() => expect(screen.getByText('Scheduled (0)')).toBeInTheDocument());
    expect(screen.getByText('Sent')).toBeInTheDocument();
    expect(screen.getByText('Reminder a')).toBeInTheDocument();
  });

  it('surfaces load failures', async () => {
    remindersApi.listReminders.mockRejectedValue(new Error('Session expired'));

    render(<RemindersPage />);

    expect(await screen.findByText(/session expired/i)).toBeInTheDocument();
  });
});
