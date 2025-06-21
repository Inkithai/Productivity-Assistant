import { useEffect, useRef, useState } from 'react';

import { chatWithAssistant } from '../../api/assistant.js';

const SUGGESTIONS = [
  'What do I need to finish today?',
  'Which tasks should I prioritize?',
  'What deadlines are coming this week?',
  'Summarize my notes',
];

export default function ChatAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef(null);
  const pinnedToBottom = useRef(true);

  useEffect(() => {
    const list = listRef.current;
    if (list && pinnedToBottom.current) {
      list.scrollTop = list.scrollHeight;
    }
  }, [messages, busy]);

  function handleScroll() {
    const list = listRef.current;
    if (!list) return;
    const distance = list.scrollHeight - list.scrollTop - list.clientHeight;
    pinnedToBottom.current = distance < 60;
  }

  async function send(text) {
    const message = (text ?? input).trim();
    if (!message || busy) return;

    const history = messages.map(({ role, content }) => ({ role, content }));
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setInput('');
    setBusy(true);
    setError('');

    try {
      const reply = await chatWithAssistant(message, history);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply.reply }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="chat">
      <div className="chat-messages" ref={listRef} onScroll={handleScroll}>
        {messages.length === 0 && (
          <div className="chat-empty">
            <p>Ask me about your tasks, deadlines or notes.</p>
            <div className="chat-chips">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="chip"
                  onClick={() => send(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index} className={`chat-bubble chat-${message.role}`}>
            {message.content.split('\n').map((line, lineIndex) => (
              <p key={lineIndex}>{line}</p>
            ))}
          </div>
        ))}

        {busy && <div className="chat-bubble chat-assistant chat-typing">thinking…</div>}
        {error && <div className="form-error">{error}</div>}
      </div>

      <form
        className="chat-input"
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask anything about your day…"
          aria-label="Message the assistant"
          disabled={busy}
        />
        <button type="submit" className="btn-primary" disabled={busy || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
