import { useEffect, useRef, useState } from 'react';

import { logFocusSession } from '../../api/focus.js';
import { BREAK_MINUTES, FOCUS_MINUTES, useFocusTimer } from './useFocusTimer.js';

function formatClock(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function FocusTimer() {
  const startedAtRef = useRef(null);
  const [error, setError] = useState('');

  async function persistSession(startedAt, completed) {
    try {
      await logFocusSession({
        startedAt: startedAt.toISOString(),
        endedAt: new Date().toISOString(),
        completed,
      });
    } catch (err) {
      setError(err.message);
    }
  }

  const timer = useFocusTimer({
    onFocusComplete: () => {
      if (startedAtRef.current) {
        persistSession(startedAtRef.current, true);
        startedAtRef.current = null;
      }
    },
  });

  useEffect(() => {
    document.title =
      timer.mode === 'focus' || timer.mode === 'break'
        ? `${formatClock(timer.secondsLeft)} · Focus`
        : 'Productivity Assistant';
  }, [timer.mode, timer.secondsLeft]);

  function handleStart() {
    startedAtRef.current = new Date();
    setError('');
    timer.start();
  }

  function handleReset() {
    if (startedAtRef.current) {
      persistSession(startedAtRef.current, false);
      startedAtRef.current = null;
    }
    timer.reset();
  }

  const progress =
    timer.mode === 'break'
      ? 1 - timer.secondsLeft / (BREAK_MINUTES * 60)
      : 1 - timer.secondsLeft / (FOCUS_MINUTES * 60);

  return (
    <div className="card focus-card">
      <h2>Focus timer</h2>
      <div className={`focus-clock focus-${timer.mode}`} role="timer" aria-live="off">
        {formatClock(timer.secondsLeft)}
      </div>
      <div className="focus-bar" aria-hidden="true">
        <span className="focus-bar-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>
      <div className="focus-controls">
        {(timer.mode === 'idle' || timer.mode === 'paused') && (
          <button type="button" className="btn-primary" onClick={timer.mode === 'idle' ? handleStart : timer.resume}>
            {timer.mode === 'idle' ? `Start ${FOCUS_MINUTES}m` : 'Resume'}
          </button>
        )}
        {timer.mode === 'focus' && (
          <button type="button" className="btn-ghost" onClick={timer.pause}>
            Pause
          </button>
        )}
        {timer.mode !== 'idle' && (
          <button type="button" className="btn-ghost" onClick={handleReset}>
            Reset
          </button>
        )}
        {timer.mode === 'break' && <span className="muted">Break time — stretch your legs.</span>}
      </div>
      <p className="muted focus-count">
        {timer.sessionCount > 0
          ? `${timer.sessionCount} focus block${timer.sessionCount > 1 ? 's' : ''} completed this visit`
          : 'Pomodoro-style: 25 minutes of focus, then a 5 minute break.'}
      </p>
      {error && <div className="form-error">{error}</div>}
    </div>
  );
}
