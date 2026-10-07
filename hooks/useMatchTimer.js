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
            setStatus('expired');
            setRemainingMs(0);
            endsAtRef.current = null;
            persist('expired', 0, null);
            onExpireRef.current?.();
          } else {
            setStatus('running');
            setRemainingMs(rem);
            endsAtRef.current = parsed.endsAt;
          }
        } else if (parsed.status === 'paused') {
          setStatus('paused');
          const rem = parsed.remainingMs ?? durationMs;
          setRemainingMs(rem);
          endsAtRef.current = null;
        } else if (parsed.status === 'expired') {
          setStatus('expired');
          setRemainingMs(0);
          endsAtRef.current = null;
        } else {
          setStatus('idle');
          setRemainingMs(durationMs);
          endsAtRef.current = null;
        }
      }
    } catch {
      // Ignore localStorage read errors
    }
  }, [storageKey, durationMs, persist]);

  // Actions
  const start = useCallback(() => {
    setStatus((prevStatus) => {
      if (prevStatus === 'running' || prevStatus === 'expired') return prevStatus;
      setRemainingMs((prevRem) => {
        const rem = prevRem > 0 ? prevRem : durationMsRef.current;
        const endsAt = Date.now() + rem;
        endsAtRef.current = endsAt;
        persist('running', rem, endsAt);
        return rem;
      });
      return 'running';
    });
  }, [persist]);

  const pause = useCallback(() => {
    setStatus((prevStatus) => {
      if (prevStatus !== 'running') return prevStatus;
      let currentRem = 0;
      if (endsAtRef.current) {
        currentRem = Math.max(0, endsAtRef.current - Date.now());
      }
      endsAtRef.current = null;
      setRemainingMs(currentRem);
      persist('paused', currentRem, null);
      return 'paused';
    });
  }, [persist]);

  const resume = useCallback(() => {
    setStatus((prevStatus) => {
      if (prevStatus !== 'paused') return prevStatus;
      setRemainingMs((prevRem) => {
        const endsAt = Date.now() + prevRem;
        endsAtRef.current = endsAt;
        persist('running', prevRem, endsAt);
        return prevRem;
      });
      return 'running';
    });
  }, [persist]);

  const toggle = useCallback(() => {
    setStatus((prevStatus) => {
      if (prevStatus === 'idle') {
        setRemainingMs((prevRem) => {
          const rem = prevRem > 0 ? prevRem : durationMsRef.current;
          const endsAt = Date.now() + rem;
          endsAtRef.current = endsAt;
          persist('running', rem, endsAt);
          return rem;
        });
        return 'running';
      }
      if (prevStatus === 'running') {
        let currentRem = 0;
        if (endsAtRef.current) {
          currentRem = Math.max(0, endsAtRef.current - Date.now());
        }
        endsAtRef.current = null;
        setRemainingMs(currentRem);
        persist('paused', currentRem, null);
        return 'paused';
      }
      if (prevStatus === 'paused') {
        setRemainingMs((prevRem) => {
          const endsAt = Date.now() + prevRem;
          endsAtRef.current = endsAt;
          persist('running', prevRem, endsAt);
          return prevRem;
        });
        return 'running';
      }
      return prevStatus; // expired is no-op
    });
  }, [persist]);

  const reset = useCallback(() => {
    endsAtRef.current = null;
    lastTickSecRef.current = null;
    setStatus('idle');
    setRemainingMs(durationMsRef.current);
    persist('idle', durationMsRef.current, null);
  }, [persist]);

  // Wall-clock ticker while running
  useEffect(() => {
    if (status !== 'running') return;

    const checkTime = () => {
      if (!endsAtRef.current) return;
      const now = Date.now();
      const rem = Math.max(0, endsAtRef.current - now);
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
