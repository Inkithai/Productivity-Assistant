import { act, renderHook } from '@testing-library/react';
import { vi } from 'vitest';

import { BREAK_MINUTES, FOCUS_MINUTES, useFocusTimer } from './useFocusTimer.js';

describe('useFocusTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts idle with a full focus block on the clock', () => {
    const { result } = renderHook(() => useFocusTimer());

    expect(result.current.mode).toBe('idle');
    expect(result.current.secondsLeft).toBe(FOCUS_MINUTES * 60);
  });

  it('counts down once started', () => {
    const { result } = renderHook(() => useFocusTimer());

    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(3000));

    expect(result.current.mode).toBe('focus');
    expect(result.current.secondsLeft).toBe(FOCUS_MINUTES * 60 - 3);
  });

  it('pauses and resumes', () => {
    const { result } = renderHook(() => useFocusTimer());

    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(5000));
    act(() => result.current.pause());
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.secondsLeft).toBe(FOCUS_MINUTES * 60 - 5);

    act(() => result.current.resume());
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.secondsLeft).toBe(FOCUS_MINUTES * 60 - 6);
  });

  it('moves to a break and reports the completed block', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useFocusTimer({ onFocusComplete: onComplete }));

    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(FOCUS_MINUTES * 60 * 1000));

    expect(result.current.mode).toBe('break');
    expect(result.current.secondsLeft).toBe(BREAK_MINUTES * 60);
    expect(result.current.sessionCount).toBe(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('ends the break back at a full focus block', () => {
    const { result } = renderHook(() => useFocusTimer());

    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(FOCUS_MINUTES * 60 * 1000));
    act(() => vi.advanceTimersByTime(BREAK_MINUTES * 60 * 1000));

    expect(result.current.mode).toBe('idle');
    expect(result.current.secondsLeft).toBe(FOCUS_MINUTES * 60);
  });

  it('reset clears the countdown without completing', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useFocusTimer({ onFocusComplete: onComplete }));

    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(10_000));
    act(() => result.current.reset());
    act(() => vi.advanceTimersByTime(60_000));

    expect(result.current.mode).toBe('idle');
    expect(result.current.secondsLeft).toBe(FOCUS_MINUTES * 60);
    expect(onComplete).not.toHaveBeenCalled();
  });
});
