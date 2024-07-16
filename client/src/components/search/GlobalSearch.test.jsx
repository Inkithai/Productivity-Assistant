import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import GlobalSearch from './GlobalSearch.jsx';

import * as searchApi from '../../api/search.js';

vi.mock('../../api/search.js', () => ({
  searchEverything: vi.fn(),
}));

function renderSearch() {
  return render(
    <MemoryRouter>
      <GlobalSearch />
    </MemoryRouter>
  );
}

describe('GlobalSearch', () => {
  beforeEach(() => {
    searchApi.searchEverything.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function type(text) {
    fireEvent.change(screen.getByLabelText(/search tasks and notes/i), {
      target: { value: text },
    });
    vi.advanceTimersByTime(350);
  }

  it('does not search for short queries', async () => {
    renderSearch();
    await type('a');
    expect(searchApi.searchEverything).not.toHaveBeenCalled();
  });

  it('searches once input settles', async () => {
    searchApi.searchEverything.mockResolvedValue({
      results: [
        { id: 'n1', type: 'note', title: 'Interview questions', score: 0.42 },
      ],
    });

    renderSearch();
    await type('interview');

    await waitFor(() => expect(searchApi.searchEverything).toHaveBeenCalledWith('interview'));
    expect(await screen.findByText('Interview questions')).toBeInTheDocument();
  });

  it('shows a friendly empty state', async () => {
    searchApi.searchEverything.mockResolvedValue({ results: [] });

    renderSearch();
    await type('nothinglikeit');

    expect(await screen.findByText(/nothing matched/i)).toBeInTheDocument();
  });

  it('recovers when the API fails', async () => {
    searchApi.searchEverything.mockRejectedValue(new Error('boom'));

    renderSearch();
    await type('anything');

    await waitFor(() => expect(screen.getByLabelText(/search tasks and notes/i)).toBeInTheDocument());
  });
});
