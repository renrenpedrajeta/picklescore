'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getSynth } from '../lib/audio';

export const MATCH_DURATION_MS =
  Number(process.env.NEXT_PUBLIC_MATCH_DURATION_MS) || 30 * 60 * 1000;

export function useMatchTimer({
  durationMs = MATCH_DURATION_MS,
  storageKey = 'pikolscore_timer_v1',
  onExpire,
} = {}) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'running' | 'paused' | 'expired'
  const [remainingMs, setRemainingMs] = useState(durationMs);

  // Synchronous refs to prevent race conditions & React StrictMode updater double-execution bugs
  const statusRef = useRef('idle');
  const remainingMsRef = useRef(durationMs);
  const endsAtRef = useRef(null);

  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const durationMsRef = useRef(durationMs);
  durationMsRef.current = durationMs;

  const lastTickSecRef = useRef(null);

  // Helper to persist snapshot
  const persist = useCallback(
    (currentStatus, currentRemaining, currentEndsAt) => {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            status: currentStatus,
            remainingMs: currentRemaining,
            endsAt: currentEndsAt,
          })
        );
      } catch {
        // Ignore localStorage write error
      }
    },
    [storageKey]
  );

  // Hydrate from localStorage inside useEffect to prevent SSR hydration mismatch
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.status === 'running' && parsed.endsAt) {
          const now = Date.now();
          const rem = Math.max(0, parsed.endsAt - now);
          if (rem <= 0) {
            statusRef.current = 'expired';
            remainingMsRef.current = 0;
            endsAtRef.current = null;
            setStatus('expired');
            setRemainingMs(0);
            persist('expired', 0, null);
            onExpireRef.current?.();
          } else {
            statusRef.current = 'running';
            remainingMsRef.current = rem;
            endsAtRef.current = parsed.endsAt;
            setStatus('running');
            setRemainingMs(rem);
          }
        } else if (parsed.status === 'paused') {
          const rem = parsed.remainingMs ?? durationMs;
          statusRef.current = 'paused';
          remainingMsRef.current = rem;
          endsAtRef.current = null;
          setStatus('paused');
          setRemainingMs(rem);
        } else if (parsed.status === 'expired') {
          statusRef.current = 'expired';
          remainingMsRef.current = 0;
          endsAtRef.current = null;
          setStatus('expired');
          setRemainingMs(0);
        } else {
          statusRef.current = 'idle';
          remainingMsRef.current = durationMs;
          endsAtRef.current = null;
          setStatus('idle');
          setRemainingMs(durationMs);
        }
      }
    } catch {
      // Ignore localStorage read errors
    }
  }, [storageKey, durationMs, persist]);

  // Actions
  const start = useCallback(() => {
    if (statusRef.current === 'running' || statusRef.current === 'expired') return;
    const rem = remainingMsRef.current > 0 ? remainingMsRef.current : durationMsRef.current;
    const endsAt = Date.now() + rem;
    endsAtRef.current = endsAt;
    remainingMsRef.current = rem;
    statusRef.current = 'running';

    setRemainingMs(rem);
    setStatus('running');
    persist('running', rem, endsAt);
  }, [persist]);

  const pause = useCallback(() => {
    if (statusRef.current !== 'running') return;
    const now = Date.now();
    const currentRem = endsAtRef.current
      ? Math.max(0, endsAtRef.current - now)
      : remainingMsRef.current;

    endsAtRef.current = null;
    remainingMsRef.current = currentRem;
    statusRef.current = 'paused';

    setRemainingMs(currentRem);
    setStatus('paused');
    persist('paused', currentRem, null);
  }, [persist]);

  const resume = useCallback(() => {
    if (statusRef.current !== 'paused') return;
    const rem = remainingMsRef.current > 0 ? remainingMsRef.current : durationMsRef.current;
    const endsAt = Date.now() + rem;
    endsAtRef.current = endsAt;
    remainingMsRef.current = rem;
    statusRef.current = 'running';

    setRemainingMs(rem);
    setStatus('running');
    persist('running', rem, endsAt);
  }, [persist]);

  const toggle = useCallback(() => {
    if (statusRef.current === 'idle') {
      start();
    } else if (statusRef.current === 'running') {
      pause();
    } else if (statusRef.current === 'paused') {
      resume();
    }
  }, [start, pause, resume]);

  const reset = useCallback(() => {
    endsAtRef.current = null;
    lastTickSecRef.current = null;
    remainingMsRef.current = durationMsRef.current;
    statusRef.current = 'idle';

    setRemainingMs(durationMsRef.current);
    setStatus('idle');
    persist('idle', durationMsRef.current, null);
  }, [persist]);

  // Wall-clock ticker while running
  useEffect(() => {
    if (status !== 'running') return;

    const checkTime = () => {
      if (!endsAtRef.current || statusRef.current !== 'running') return;
      const now = Date.now();
      const rem = Math.max(0, endsAtRef.current - now);

      remainingMsRef.current = rem;
      setRemainingMs(rem);

      // Play soft tick in the final 10 seconds
      if (rem > 0 && rem <= 10000) {
        const sec = Math.ceil(rem / 1000);
        if (sec !== lastTickSecRef.current) {
          lastTickSecRef.current = sec;
          getSynth()?.tick();
        }
      }

      if (rem === 0) {
        endsAtRef.current = null;
        statusRef.current = 'expired';
        setStatus('expired');
        persist('expired', 0, null);
        getSynth()?.timeUp();
        onExpireRef.current?.();
      }
    };

    const intervalId = setInterval(checkTime, 250);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkTime();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [status, persist]);

  // Screen Wake Lock API handling
  useEffect(() => {
    let wakeLock = null;

    async function requestWakeLock() {
      if (typeof navigator !== 'undefined' && 'wakeLock' in navigator && status === 'running') {
        try {
          wakeLock = await navigator.wakeLock.request('screen');
        } catch {
          // Ignore wakeLock failures
        }
      }
    }

    if (status === 'running') {
      requestWakeLock();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && status === 'running') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, [status]);

  const progress =
    durationMs > 0 ? Math.min(1, Math.max(0, (durationMs - remainingMs) / durationMs)) : 0;

  const isWarning =
    (status === 'running' || status === 'paused') &&
    remainingMs <= 5 * 60 * 1000 &&
    remainingMs > 0;

  return {
    status,
    remainingMs,
    progress,
    isWarning,
    start,
    pause,
    resume,
    toggle,
    reset,
  };
}
