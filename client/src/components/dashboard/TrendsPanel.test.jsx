import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import TrendsPanel from './TrendsPanel.jsx';
import { TagWorkload } from './TagWorkload.jsx';

import * as analyticsApi from '../../api/analytics.js';

vi.mock('../../api/analytics.js', () => ({
  fetchTrends: vi.fn(),
}));

// recharts needs real layout math, keep it out of the jsdom run
vi.mock('./MonthlyTrend.jsx', () => ({
  MonthlyTrend: () => <div data-testid="monthly-trend" />,
}));

const TRENDS = {
  monthly: [
    { label: 'Mar', completed: 3 },
    { label: 'Apr', completed: 5 },
    { label: 'May', completed: 0 },
    { label: 'Jun', completed: 8 },
    { label: 'Jul', completed: 2 },
    { label: 'Aug', completed: 6 },
  ],
  byTag: [
    { tag: 'work', open: 5 },
    { tag: 'api', open: 2 },
  ],
};

describe('TrendsPanel', () => {
  beforeEach(() => {
    analyticsApi.fetchTrends.mockReset();
  });

  it('renders charts when there is data', async () => {
    analyticsApi.fetchTrends.mockResolvedValue({ trends: TRENDS });

    render(<TrendsPanel />);

    expect(await screen.findByTestId('monthly-trend')).toBeInTheDocument();
    expect(screen.getByText('#work')).toBeInTheDocument();
    expect(screen.getByText('#api')).toBeInTheDocument();
  });

  it('shows a nudge when there is nothing to chart', async () => {
    analyticsApi.fetchTrends.mockResolvedValue({
      trends: { monthly: TRENDS.monthly.map((m) => ({ ...m, completed: 0 })), byTag: [] },
    });

    render(<TrendsPanel />);

    expect(await screen.findByText(/complete a few tasks/i)).toBeInTheDocument();
  });

  it('surfaces API errors', async () => {
    analyticsApi.fetchTrends.mockRejectedValue(new Error('stats unavailable'));

    render(<TrendsPanel />);

    expect(await screen.findByText('stats unavailable')).toBeInTheDocument();
  });
});

describe('TagWorkload', () => {
  it('scales bars against the busiest tag', () => {
    render(<TagWorkload byTag={[{ tag: 'work', open: 4 }, { tag: 'home', open: 1 }]} />);

    const bars = document.querySelectorAll('.workload-fill');
    expect(bars[0].style.width).toBe('100%');
    expect(bars[1].style.width).toBe('25%');
  });

  it('avoids division by zero on empty input', () => {
    render(<TagWorkload byTag={[]} />);
    expect(screen.getByText(/no tagged open tasks/i)).toBeInTheDocument();
  });
});
