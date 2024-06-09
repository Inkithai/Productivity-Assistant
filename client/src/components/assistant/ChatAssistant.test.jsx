import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import ChatAssistant from './ChatAssistant.jsx';

import * as assistantApi from '../../api/assistant.js';

vi.mock('../../api/assistant.js', () => ({
  chatWithAssistant: vi.fn(),
}));

describe('ChatAssistant', () => {
  beforeEach(() => {
    assistantApi.chatWithAssistant.mockReset();
  });

  it('shows suggestion chips before any message', () => {
    render(<ChatAssistant />);
    expect(screen.getByText('What do I need to finish today?')).toBeInTheDocument();
  });

  it('sends a message and shows the reply', async () => {
    assistantApi.chatWithAssistant.mockResolvedValue({
      reply: 'You have 2 tasks due today',
      intent: 'today',
      provider: 'rules',
    });

    render(<ChatAssistant />);
    fireEvent.change(screen.getByLabelText(/message the assistant/i), {
      target: { value: 'What is due today?' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() =>
      expect(screen.getByText('You have 2 tasks due today')).toBeInTheDocument()
    );
    expect(assistantApi.chatWithAssistant).toHaveBeenCalledWith('What is due today?', []);
  });

  it('passes conversation history on the next message', async () => {
    assistantApi.chatWithAssistant.mockResolvedValue({ reply: 'ok' });

    render(<ChatAssistant />);
    const input = screen.getByLabelText(/message the assistant/i);
    fireEvent.change(input, { target: { value: 'hi' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    await waitFor(() => screen.getByText('ok'));

    fireEvent.change(input, { target: { value: 'and now?' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() =>
      expect(assistantApi.chatWithAssistant).toHaveBeenLastCalledWith('and now?', [
        { role: 'user', content: 'hi' },
        { role: 'assistant', content: 'ok' },
      ])
    );
  });

  it('shows an error when the API fails', async () => {
    assistantApi.chatWithAssistant.mockRejectedValue(new Error('AI service is unavailable'));

    render(<ChatAssistant />);
    fireEvent.change(screen.getByLabelText(/message the assistant/i), {
      target: { value: 'hello' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() =>
      expect(screen.getByText('AI service is unavailable')).toBeInTheDocument()
    );
  });

  it('sends a suggestion when a chip is clicked', async () => {
    assistantApi.chatWithAssistant.mockResolvedValue({ reply: 'Here is the plan' });

    render(<ChatAssistant />);
    fireEvent.click(screen.getByText('Summarize my notes'));

    await waitFor(() => expect(screen.getByText('Here is the plan')).toBeInTheDocument());
    expect(assistantApi.chatWithAssistant).toHaveBeenCalledWith('Summarize my notes', []);
  });
});
