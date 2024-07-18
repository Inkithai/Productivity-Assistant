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

function type(text) {
  fireEvent.change(screen.getByLabelText(/search tasks and notes/i), {
    target: { value: text },
  });
}

describe('GlobalSearch', () => {
  beforeEach(() => {
    searchApi.searchEverything.mockReset();
  });

  it('does not search for short queries', async () => {
    renderSearch();
    type('a');
    // give the debounce plenty of time to prove it stays quiet
    await new Promise((resolve) => setTimeout(resolve, 450));
    expect(searchApi.searchEverything).not.toHaveBeenCalled();
  });

  it('searches once input settles', async () => {
    searchApi.searchEverything.mockResolvedValue({
      results: [{ id: 'n1', type: 'note', title: 'Interview questions', score: 0.42 }],
    });

    renderSearch();
    type('interview');

    await waitFor(() => expect(searchApi.searchEverything).toHaveBeenCalledWith('interview'));
    expect(await screen.findByText('Interview questions')).toBeInTheDocument();
  });

  it('collapses duplicate keystrokes into one query', async () => {
    searchApi.searchEverything.mockResolvedValue({ results: [] });

    renderSearch();
    type('in');
    type('int');
    type('inte');

    await waitFor(() => expect(searchApi.searchEverything).toHaveBeenCalledTimes(1));
    expect(searchApi.searchEverything).toHaveBeenCalledWith('inte');
  });

  it('shows a friendly empty state', async () => {
    searchApi.searchEverything.mockResolvedValue({ results: [] });

    renderSearch();
    type('nothinglikeit');

    expect(await screen.findByText(/nothing matched/i)).toBeInTheDocument();
  });

  it('recovers when the API fails', async () => {
    searchApi.searchEverything.mockRejectedValue(new Error('boom'));

    renderSearch();
    type('anything');

    await waitFor(() => expect(searchApi.searchEverything).toHaveBeenCalled());
    expect(screen.getByLabelText(/search tasks and notes/i)).toBeInTheDocument();
  });
});
