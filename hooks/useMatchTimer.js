'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getSynth } from '../lib/audio';
import { outbox } from '../lib/outbox';

export const MATCH_DURATION_MS =
  Number(process.env.NEXT_PUBLIC_MATCH_DURATION_MS) || 30 * 60 * 1000;

export function formatMmSs(totalSeconds) {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export function useMatchTimer({
  durationMs = MATCH_DURATION_MS,
  storageKey = 'pikolscore_timer_v2',
  onExpire,
  sync = null,
} = {}) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'running' | 'paused' | 'expired'
  const [remainingMs, setRemainingMs] = useState(durationMs);

  const statusRef = useRef('idle');
  const remainingMsRef = useRef(durationMs);
  const endsAtRef = useRef(null);

  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const durationMsRef = useRef(durationMs);
  durationMsRef.current = durationMs;

  const lastTickSecRef = useRef(null);

  const persist = useCallback(
    (currentStatus, currentRemaining, currentEndsAt) => {
      // LocalStorage persistence only when cloud sync is disabled
      if (!sync?.isEnabled) {
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
      }

      // Supabase timer sync when enabled
      if (sync?.isEnabled && sync.setTimer) {
        sync.setTimer({
          status: currentStatus,
          remainingMs: currentRemaining,
          endsAt: currentEndsAt,
          clientTs: new Date().toISOString(),
        });
      }
    },
    [storageKey, sync]
  );

  // Local mount hydration (when cloud sync is disabled)
  useEffect(() => {
    if (sync?.isEnabled) return;

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
          onExpireRef.current?.();
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
  }, [storageKey, durationMs, persist, sync?.isEnabled]);

  // Cloud timer hydration (when server session is fetched or updated)
  useEffect(() => {
    if (!sync?.isEnabled || !sync?.serverSession) return;
    // Do not overwrite local timer state while a timer mutation is still in flight in the outbox
    if (!sync.isGuest && outbox.getQueue().some((q) => q.op === 'fn_set_timer')) {
      return;
    }

    const sess = sync.serverSession;

    if (sess.timer_status === 'running' && sess.timer_ends_at) {
      const ends = new Date(sess.timer_ends_at).getTime();
      const rem = Math.max(0, ends - Date.now());
      if (rem <= 0) {
        statusRef.current = 'expired';
        remainingMsRef.current = 0;
        endsAtRef.current = null;
        setStatus('expired');
        setRemainingMs(0);
        onExpireRef.current?.();
      } else {
        // Avoid minor visual jitter on rally updates if already running within 3s of server endsAt
        const isAlreadyAligned =
          statusRef.current === 'running' &&
          endsAtRef.current &&
          Math.abs(endsAtRef.current - ends) < 3000;

        statusRef.current = 'running';
        setStatus('running');
        if (!isAlreadyAligned) {
          remainingMsRef.current = rem;
          endsAtRef.current = ends;
          setRemainingMs(rem);
        }
      }
    } else if (sess.timer_status === 'paused') {
      const rem = sess.timer_remaining_ms ?? durationMs;
      statusRef.current = 'paused';
      remainingMsRef.current = rem;
      endsAtRef.current = null;
      setStatus('paused');
      setRemainingMs(rem);
    } else if (sess.timer_status === 'expired') {
      statusRef.current = 'expired';
      remainingMsRef.current = 0;
      endsAtRef.current = null;
      setStatus('expired');
      setRemainingMs(0);
      onExpireRef.current?.();
    } else if (sess.timer_status === 'idle') {
      statusRef.current = 'idle';
      remainingMsRef.current = durationMs;
      endsAtRef.current = null;
      setStatus('idle');
      setRemainingMs(durationMs);
    }
  }, [sync?.isEnabled, sync?.isGuest, sync?.serverSession, durationMs]);

  const start = useCallback(
    (forceRestart = false) => {
      if (statusRef.current === 'running' && !forceRestart) return;
      const rem =
        forceRestart === true || remainingMsRef.current <= 0
          ? durationMsRef.current
          : remainingMsRef.current;
      const endsAt = Date.now() + rem;
      endsAtRef.current = endsAt;
      remainingMsRef.current = rem;
      statusRef.current = 'running';

      setRemainingMs(rem);
      setStatus('running');
      persist('running', rem, endsAt);
    },
    [persist]
  );

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
    const rem =
      remainingMsRef.current > 0 ? remainingMsRef.current : durationMsRef.current;
    const endsAt = Date.now() + rem;
    endsAtRef.current = endsAt;
    remainingMsRef.current = rem;
    statusRef.current = 'running';

    setRemainingMs(rem);
    setStatus('running');
    persist('running', rem, endsAt);
  }, [persist]);

  const reset = useCallback(
    (syncToCloud = true) => {
      endsAtRef.current = null;
      lastTickSecRef.current = null;
      remainingMsRef.current = durationMsRef.current;
      statusRef.current = 'idle';

      setRemainingMs(durationMsRef.current);
      setStatus('idle');
      if (syncToCloud) {
        persist('idle', durationMsRef.current, null);
      }
    },
    [persist]
  );

  const toggle = useCallback(() => {
    if (statusRef.current === 'running') {
      pause();
    } else if (statusRef.current === 'paused') {
      resume();
    } else {
      // 'idle' or 'expired': start (resetting to 30:00 if expired)
      start();
    }
  }, [start, pause, resume]);

  useEffect(() => {
    if (status !== 'running') return;

    const checkTime = () => {
      if (!endsAtRef.current || statusRef.current !== 'running') return;
      const now = Date.now();
      const rem = Math.max(0, endsAtRef.current - now);

      remainingMsRef.current = rem;
      setRemainingMs(rem);

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

  useEffect(() => {
    let wakeLock = null;

    async function requestWakeLock() {
      if (
        typeof navigator !== 'undefined' &&
        'wakeLock' in navigator &&
        status === 'running'
      ) {
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

  const totalSeconds = Math.round(durationMs / 1000);
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const elapsedSeconds = Math.max(0, totalSeconds - remainingSeconds);
  const formattedTime = formatMmSs(remainingSeconds);

  const label =
    remainingSeconds === 0 && status !== 'running'
      ? "time's up, tap to reset"
      : status === 'running'
      ? 'tap here to stop'
      : 'tap here to start';

  const progress =
    durationMs > 0
      ? Math.min(1, Math.max(0, (durationMs - remainingMs) / durationMs))
      : 0;

  const isWarning =
    (status === 'running' || status === 'paused') &&
    remainingMs <= 5 * 60 * 1000 &&
    remainingMs > 0;

  return {
    status,
    remainingMs,
    remainingSeconds,
    elapsedSeconds,
    durationMs,
    formattedTime,
    label,
    progress,
    isWarning,
    start,
    pause,
    resume,
    toggle,
    reset,
  };
}

export default useMatchTimer;
