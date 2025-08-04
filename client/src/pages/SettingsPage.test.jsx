import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import SettingsPage from './SettingsPage.jsx';
import * as usersApi from '../api/users.js';

vi.mock('../api/users.js', () => ({
  updateProfile: vi.fn(),
  exportData: vi.fn(),
}));

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: { name: 'Inkithai', email: 'ink@example.com', timezone: 'UTC' },
    setUser: vi.fn(),
  }),
}));

vi.mock('../context/ToastContext.jsx', () => ({
  useToast: () => ({ push: vi.fn() }),
}));

vi.mock('../components/settings/PasswordForm.jsx', () => ({
  default: () => <div data-testid="password-form" />,
}));

beforeEach(() => {
  usersApi.updateProfile.mockReset();
  usersApi.exportData.mockReset();
});

afterEach(cleanup);

describe('SettingsPage', () => {
  it('saves the display name and timezone', async () => {
    usersApi.updateProfile.mockResolvedValue({ user: { name: 'Inki' } });

    render(<SettingsPage />);

    fireEvent.change(screen.getByLabelText(/display name/i), { target: { value: 'Inki' } });
    fireEvent.change(screen.getByLabelText(/timezone/i), { target: { value: 'Asia/Colombo' } });
    fireEvent.click(screen.getByRole('button', { name: /save profile/i }));

    await waitFor(() =>
      expect(usersApi.updateProfile).toHaveBeenCalledWith({
        name: 'Inki',
        timezone: 'Asia/Colombo',
      })
    );
  });

  it('surfaces profile save failures', async () => {
    usersApi.updateProfile.mockRejectedValue(new Error('Name is too long'));

    render(<SettingsPage />);

    fireEvent.change(screen.getByLabelText(/display name/i), { target: { value: 'X'.repeat(80) } });
    fireEvent.click(screen.getByRole('button', { name: /save profile/i }));

    expect(await screen.findByText(/name is too long/i)).toBeInTheDocument();
  });

  it('downloads the account export', async () => {
    usersApi.exportData.mockResolvedValue(undefined);

    render(<SettingsPage />);
    fireEvent.click(screen.getByRole('button', { name: /download my data/i }));

    await waitFor(() => expect(usersApi.exportData).toHaveBeenCalled());
  });

  it('shows the signed-in address', () => {
    render(<SettingsPage />);
    expect(screen.getByText(/ink@example.com/)).toBeInTheDocument();
  });
});
