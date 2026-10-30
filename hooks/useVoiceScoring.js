'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { evaluateVoiceTranscript, append as appendVoiceAudit } from '../lib/voiceParser.js';
import { getSynth } from '../lib/audio.js';

const PILL_LABELS = {
  suppressed_cooldown: 'Ignored (cooldown)',
  rejected_ambiguous: 'Unclear command',
  rejected_confidence: 'Low confidence',
  rejected_state: 'Not allowed right now',
  rejected_paused: 'Paused',
};

const PILL_DURATION_MS = 2000;
const RESTART_DELAY_MS = 250;

function getSpeechRecognitionCtor() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function useVoiceScoring({ game, onPoint, onFault, onUndo } = {}) {
  const [supported, setSupported] = useState(false);
  const [active, setActive] = useState(false);
  const [pill, setPill] = useState(null);

  const gameRef = useRef(game);
  gameRef.current = game;

  const handlersRef = useRef({ onPoint, onFault, onUndo });
  handlersRef.current = { onPoint, onFault, onUndo };

  const timingRef = useRef({ lastScoreAt: null, lastUndoAt: null });
  const desiredActiveRef = useRef(false);
  const fatalErrorRef = useRef(false);
  const unmountedRef = useRef(false);
  const recognitionRef = useRef(null);
  const restartTimerRef = useRef(null);
  const pillTimerRef = useRef(null);
  const wakeLockRef = useRef(null);

  const showPill = useCallback((text) => {
    if (!text || unmountedRef.current) return;
    if (pillTimerRef.current) {
      clearTimeout(pillTimerRef.current);
    }
    setPill(text);
    pillTimerRef.current = setTimeout(() => {
      if (!unmountedRef.current) {
        setPill(null);
      }
      pillTimerRef.current = null;
    }, PILL_DURATION_MS);
  }, []);

  const releaseWakeLock = useCallback(async () => {
    const sentinel = wakeLockRef.current;
    wakeLockRef.current = null;
    if (sentinel && typeof sentinel.release === 'function') {
      try {
        await sentinel.release();
      } catch {
        // Ignore wakeLock release errors
      }
    }
  }, []);

  const acquireWakeLock = useCallback(async () => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.wakeLock?.request ||
      (typeof document !== 'undefined' && document.visibilityState !== 'visible') ||
      !desiredActiveRef.current
    ) {
      return;
    }
    if (wakeLockRef.current && !wakeLockRef.current.released) {
      return;
    }
    try {
      const sentinel = await navigator.wakeLock.request('screen');
      if (!desiredActiveRef.current || unmountedRef.current) {
        await sentinel.release().catch(() => {});
        return;
      }
      wakeLockRef.current = sentinel;
      sentinel.addEventListener?.('release', () => {
        if (wakeLockRef.current === sentinel) {
          wakeLockRef.current = null;
        }
      });
    } catch {
      // Ignore wakeLock acquisition errors
    }
  }, []);

  const stopRecognition = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    if (rec) {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        rec.abort();
      } catch {
        // Ignore stop/abort errors
      }
    }
  }, []);

  const canListenNow = useCallback(() => {
    const g = gameRef.current || {};
    return (
      !unmountedRef.current &&
      desiredActiveRef.current &&
      !fatalErrorRef.current &&
      !g.isGuest &&
      !g.isTimeExpired &&
      (typeof document === 'undefined' || document.visibilityState === 'visible')
    );
  }, []);

  const startRecognition = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    if (!canListenNow() || recognitionRef.current) return;

    const SpeechRec = getSpeechRecognitionCtor();
    if (!SpeechRec) return;

    let rec;
    try {
      rec = new SpeechRec();
    } catch {
      return;
    }

    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onresult = (event) => {
      if (!event?.results) return;
      const startIdx = typeof event.resultIndex === 'number' ? event.resultIndex : 0;

      for (let i = startIdx; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (!result || !result.isFinal) continue;
        const alt = result[0];
        if (!alt) continue;

        const transcript = alt.transcript ?? '';
        const confidence = typeof alt.confidence === 'number' ? alt.confidence : 0;
        const now = Date.now();
        const currentGame = gameRef.current || {};

        const evalRes = evaluateVoiceTranscript({
          transcript,
          confidence,
          now,
          game: currentGame,
          timing: timingRef.current,
        });

        timingRef.current = evalRes.timing;

        appendVoiceAudit({
          timestamp: new Date(now).toISOString(),
          sessionId: currentGame.sessionId ?? null,
          transcript,
          confidence,
          command: evalRes.command,
          outcome: evalRes.outcome,
        });

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('pikolscore:voice-audit'));
        }

        if (evalRes.outcome === 'accepted') {
          if (evalRes.command === 'point') {
            handlersRef.current.onPoint?.();
          } else if (evalRes.command === 'fault') {
            handlersRef.current.onFault?.();
          } else if (evalRes.command === 'undo') {
            getSynth()?.undo();
            handlersRef.current.onUndo?.();
          }
        } else if (evalRes.outcome !== 'ignored_unmatched') {
          getSynth()?.reject();
          showPill(PILL_LABELS[evalRes.outcome] || 'Not allowed right now');
        }
      }
    };

    rec.onerror = (event) => {
      const err = event?.error;
      if (err === 'not-allowed' || err === 'service-not-allowed') {
        fatalErrorRef.current = true;
        desiredActiveRef.current = false;
        setActive(false);
        stopRecognition();
        releaseWakeLock();
        getSynth()?.reject();
        showPill('Mic blocked');
      }
      // Treat 'no-speech', 'aborted', and transient errors normally; onend manages restart
    };

    rec.onend = () => {
      if (recognitionRef.current === rec) {
        recognitionRef.current = null;
      }
      if (canListenNow()) {
        restartTimerRef.current = setTimeout(() => {
          restartTimerRef.current = null;
          startRecognition();
        }, RESTART_DELAY_MS);
      }
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch (err) {
      recognitionRef.current = null;
      if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') {
        fatalErrorRef.current = true;
        desiredActiveRef.current = false;
        setActive(false);
        releaseWakeLock();
        showPill('Mic blocked');
      } else if (canListenNow()) {
        restartTimerRef.current = setTimeout(() => {
          restartTimerRef.current = null;
          startRecognition();
        }, RESTART_DELAY_MS);
      }
    }
  }, [canListenNow, releaseWakeLock, showPill, stopRecognition]);

  const toggle = useCallback(() => {
    if (!getSpeechRecognitionCtor()) return;
    getSynth()?.init();

    if (desiredActiveRef.current) {
      desiredActiveRef.current = false;
      setActive(false);
      stopRecognition();
      releaseWakeLock();
      return;
    }

    const g = gameRef.current || {};
    if (g.isGuest || g.isTimeExpired) return;

    fatalErrorRef.current = false;
    desiredActiveRef.current = true;
    setActive(true);
    startRecognition();
    acquireWakeLock();
  }, [acquireWakeLock, releaseWakeLock, startRecognition, stopRecognition]);

  // Detect browser support on mount & clean up everything on unmount
  useEffect(() => {
    unmountedRef.current = false;
    setSupported(Boolean(getSpeechRecognitionCtor()));

    return () => {
      unmountedRef.current = true;
      desiredActiveRef.current = false;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      if (pillTimerRef.current) clearTimeout(pillTimerRef.current);
      stopRecognition();
      releaseWakeLock();
    };
  }, [releaseWakeLock, stopRecognition]);

  // Auto-suspend when tab hides; resume + re-acquire wakeLock when visible again
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stopRecognition();
        releaseWakeLock();
      } else if (document.visibilityState === 'visible' && canListenNow()) {
        startRecognition();
        acquireWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [acquireWakeLock, canListenNow, releaseWakeLock, startRecognition, stopRecognition]);

  // Auto-suspend when match ends (isTimeExpired) or enters guest mode
  useEffect(() => {
    if ((game?.isTimeExpired || game?.isGuest) && desiredActiveRef.current) {
      stopRecognition();
      releaseWakeLock();
      if (game?.isGuest) {
        desiredActiveRef.current = false;
        setActive(false);
      }
    } else if (!game?.isTimeExpired && !game?.isGuest && desiredActiveRef.current && canListenNow()) {
      // Resume if toggle remained ON across a rematch after time expired
      startRecognition();
      acquireWakeLock();
    }
  }, [
    acquireWakeLock,
    canListenNow,
    game?.isGuest,
    game?.isTimeExpired,
    releaseWakeLock,
    startRecognition,
    stopRecognition,
  ]);

  return {
    supported,
    active: Boolean(active && !game?.isTimeExpired && !game?.isGuest),
    toggle,
    pill,
  };
}

export default useVoiceScoring;
