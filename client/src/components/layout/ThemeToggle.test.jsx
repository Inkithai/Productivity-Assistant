import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ThemeToggle, { applyTheme, readStoredTheme } from './ThemeToggle.jsx';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  afterEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it('defaults to the system preference', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    expect(readStoredTheme()).toBe('dark');
  });

  it('prefers an explicit stored choice over the system', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    localStorage.setItem('pa_theme', 'light');
    expect(readStoredTheme()).toBe('light');
  });

  it('applies and persists the theme', () => {
    applyTheme('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('pa_theme')).toBe('dark');
  });

  it('toggles between themes', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    render(<ThemeToggle />);

    expect(document.documentElement.dataset.theme).toBe('light');
    fireEvent.click(screen.getByRole('button', { name: /switch to dark theme/i }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('pa_theme')).toBe('dark');

    fireEvent.click(screen.getByRole('button', { name: /switch to light theme/i }));
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
