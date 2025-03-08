import { useCallback, useEffect, useRef, useState } from 'react';

export const FOCUS_MINUTES = 25;
export const BREAK_MINUTES = 5;

export function useFocusTimer({ onFocusComplete } = {}) {
  const [mode, setMode] = useState('idle'); // idle | focus | break | paused
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_MINUTES * 60);
  const [sessionCount, setSessionCount] = useState(0);
  const completeRef = useRef(onFocusComplete);

  useEffect(() => {
    completeRef.current = onFocusComplete;
  }, [onFocusComplete]);

  useEffect(() => {
    if (mode !== 'focus' && mode !== 'break') return undefined;

    const timer = setInterval(() => {
      setSecondsLeft((seconds) => {
        if (seconds > 1) return seconds - 1;

        if (mode === 'focus') {
          setSessionCount((count) => count + 1);
          setMode('break');
          completeRef.current?.();
          return BREAK_MINUTES * 60;
        }

        setMode('idle');
        return FOCUS_MINUTES * 60;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [mode]);

  const start = useCallback(() => {
    setSecondsLeft((seconds) => (seconds > 0 ? seconds : FOCUS_MINUTES * 60));
    setMode('focus');
  }, []);

  const pause = useCallback(() => setMode('paused'), []);
  const resume = useCallback(() => setMode('focus'), []);
  const reset = useCallback(() => {
    setMode('idle');
    setSecondsLeft(FOCUS_MINUTES * 60);
  }, []);

  return { mode, secondsLeft, sessionCount, start, pause, resume, reset };
}
