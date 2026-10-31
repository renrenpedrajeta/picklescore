'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { VOICE_CONFIG } from '../config/voice.js';
import { evaluateVoiceTranscript, append as appendVoiceAudit } from '../lib/voiceParser.js';
import { getSynth, speakScoreCallout } from '../lib/audio.js';

export const PILL_LABELS = {
  suppressed_cooldown: 'Ignored (cooldown)',
  rejected_ambiguous: 'Unclear command',
  rejected_confidence: 'Low confidence',
  rejected_state: 'Not allowed right now',
  rejected_paused: 'Paused',
  already_server_2: 'Already Server 2',
  still_server_1: 'Still Server 1',
  singles_match: 'Singles match',
};

const PILL_DURATION_MS = 2000;
const RESTART_DELAY_MS = 250;
const TTS_ECHO_TAIL_MS = 350;

function getSpeechRecognitionCtor() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

const HEADSET_KEYWORDS = [
  'airpods',
  'bluetooth',
  'headset',
  'headphones',
  'earbuds',
  'buds',
  'hands-free',
  'usb',
  'external',
  'jabra',
  'shokz',
  'wireless',
];

async function detectHeadsetHardware() {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
    return false;
  }
  try {
    let devices = await navigator.mediaDevices.enumerateDevices();
    let audioInputs = devices.filter((d) => d.kind === 'audioinput');

    // Probe iOS Safari once if labels are blank
    const hasEmptyLabels = audioInputs.length > 0 && audioInputs.every((d) => !d.label);
    if (hasEmptyLabels && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        devices = await navigator.mediaDevices.enumerateDevices();
        audioInputs = devices.filter((d) => d.kind === 'audioinput');
      } catch {
        // User denied or mic in use
      }
    }

    return audioInputs.some((d) =>
      HEADSET_KEYWORDS.some((kw) => (d.label || '').toLowerCase().includes(kw))
    );
  } catch {
    return false;
  }
}

export function useVoiceScoring({
  game,
  onPoint,
  onFault,
  onSecondServe,
  onSideOut,
  onUndo,
  onPauseTimer,
  onResumeTimer,
} = {}) {
  const [supported, setSupported] = useState(false);
  const [active, setActive] = useState(false);
  const [pill, setPill] = useState(null);
  const [heard, setHeard] = useState(null);

  // Mic Mode State ('auto' | 'headset' | 'open_mic')
  const [micModeSetting, setMicModeSettingState] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('pikolscore_mic_mode') || 'auto';
      } catch {
        return 'auto';
      }
    }
    return 'auto';
  });

  const [detectedHeadset, setDetectedHeadset] = useState(false);

  // Resolved effective mic mode ('headset' | 'open_mic')
  const effectiveMicMode =
    micModeSetting === 'auto'
      ? detectedHeadset
        ? 'headset'
        : 'open_mic'
      : micModeSetting;

  const micModeRef = useRef(effectiveMicMode);
  micModeRef.current = effectiveMicMode;

  // TTS Readback State
  const [ttsEnabled, setTtsEnabledState] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('pikolscore_tts') === 'true';
      } catch {
        return false;
      }
    }
    return false;
  });

  const ttsEnabledRef = useRef(ttsEnabled);
  ttsEnabledRef.current = ttsEnabled;

  const gameRef = useRef(game);
  gameRef.current = game;

  const handlersRef = useRef({
    onPoint,
    onFault,
    onSecondServe,
    onSideOut,
    onUndo,
    onPauseTimer,
    onResumeTimer,
  });
  handlersRef.current = {
    onPoint,
    onFault,
    onSecondServe,
    onSideOut,
    onUndo,
    onPauseTimer,
    onResumeTimer,
  };

  const timingRef = useRef({ lastScoreAt: null, lastUndoAt: null });
  const armedStateRef = useRef(null); // { trigger: 'point'|'fault', armedAt: number }
  const pendingInfractionRef = useRef(null); // string | null (e.g. 'Kitchen fault')
  const isSpeakingRef = useRef(false);
  const highestFinalIndexRef = useRef(-1);
  const recentDedupeRef = useRef(new Map());

  const desiredActiveRef = useRef(false);
  const fatalErrorRef = useRef(false);
  const unmountedRef = useRef(false);
  const recognitionRef = useRef(null);
  const restartTimerRef = useRef(null);
  const pillTimerRef = useRef(null);
  const hideHeardTimerRef = useRef(null);
  const wakeLockRef = useRef(null);

  const setMicModeSetting = useCallback((mode) => {
    setMicModeSettingState(mode);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('pikolscore_mic_mode', mode);
      } catch {
        // Ignore localStorage error
      }
    }
  }, []);

  const setTtsEnabled = useCallback((enabled) => {
    const val = typeof enabled === 'function' ? enabled(ttsEnabledRef.current) : Boolean(enabled);
    setTtsEnabledState(val);
    ttsEnabledRef.current = val;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('pikolscore_tts', String(val));
      } catch {
        // Ignore localStorage error
      }
    }
  }, []);

  // Poll hardware changes
  useEffect(() => {
    let mounted = true;
    const checkHardware = async () => {
      const isHeadset = await detectHeadsetHardware();
      if (mounted) {
        setDetectedHeadset(isHeadset);
      }
    };
    checkHardware();

    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', checkHardware);
      return () => {
        mounted = false;
        navigator.mediaDevices.removeEventListener('devicechange', checkHardware);
      };
    }
    return () => {
      mounted = false;
    };
  }, []);

  const showPill = useCallback((text, { sticky = false, duration = PILL_DURATION_MS } = {}) => {
    if (!text || unmountedRef.current) return;
    if (pillTimerRef.current) {
      clearTimeout(pillTimerRef.current);
      pillTimerRef.current = null;
    }
    setPill(text);
    if (!sticky) {
      pillTimerRef.current = setTimeout(() => {
        if (!unmountedRef.current) {
          setPill(null);
        }
        pillTimerRef.current = null;
      }, duration);
    }
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
    if (hideHeardTimerRef.current) {
      clearTimeout(hideHeardTimerRef.current);
      hideHeardTimerRef.current = null;
    }
    setHeard(null);
    highestFinalIndexRef.current = -1;
    recentDedupeRef.current.clear();

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

  const triggerTTS = useCallback((calloutText) => {
    if (!ttsEnabledRef.current || !calloutText) return;
    isSpeakingRef.current = true;
    speakScoreCallout(calloutText, () => {
      setTimeout(() => {
        isSpeakingRef.current = false;
      }, TTS_ECHO_TAIL_MS);
    });
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
    rec.interimResults = Boolean(VOICE_CONFIG.debugOverlay);
    rec.maxAlternatives = VOICE_CONFIG.maxAlternatives ?? 3;
    rec.lang = 'en-US';

    rec.onresult = (event) => {
      if (!event?.results) return;

      // Discard self-echo if TTS score readback is speaking
      if (isSpeakingRef.current) return;

      const startIdx = typeof event.resultIndex === 'number' ? event.resultIndex : 0;
      let finalProcessed = false;
      let interimAccumulator = '';

      for (let i = startIdx; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (!result) continue;

        if (result.isFinal) {
          // Mobile Chrome index de-duplication
          if (i <= highestFinalIndexRef.current) {
            continue;
          }
          highestFinalIndexRef.current = i;

          const alternatives = [];
          for (let j = 0; j < result.length; j += 1) {
            const alt = result[j];
            if (alt) {
              alternatives.push({
                transcript: alt.transcript ?? '',
                confidence: typeof alt.confidence === 'number' ? alt.confidence : 0,
              });
            }
          }

          if (alternatives.length === 0) continue;

          const topAlt = alternatives[0];
          const transcript = topAlt.transcript;
          const confidence = topAlt.confidence;
          const now = Date.now();

          // Monotonic transcript deduplication within 1000ms
          const lastSeenAt = recentDedupeRef.current.get(transcript);
          if (lastSeenAt && now - lastSeenAt < 1000) {
            continue;
          }
          recentDedupeRef.current.set(transcript, now);

          finalProcessed = true;
          const currentGame = gameRef.current || {};

          const evalRes = evaluateVoiceTranscript({
            transcript,
            confidence,
            alternatives,
            now,
            game: currentGame,
            timing: timingRef.current,
            micMode: micModeRef.current,
            armed: armedStateRef.current,
            pendingInfraction: pendingInfractionRef.current,
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
            armedStateRef.current = null;
            const synth = getSynth();

            if (evalRes.command === 'point') {
              synth?.point();
              pendingInfractionRef.current = null;
              handlersRef.current.onPoint?.(evalRes.reason);
              showPill(evalRes.reason ? `✓ Point · ${evalRes.reason}` : '✓ Point');
              triggerTTS(currentGame.callout || currentGame.callCompact);
            } else if (evalRes.command === 'secondServe') {
              synth?.secondServe();
              pendingInfractionRef.current = null;
              if (handlersRef.current.onSecondServe) {
                handlersRef.current.onSecondServe(evalRes.reason);
              } else {
                handlersRef.current.onFault?.(evalRes.reason);
              }
              showPill(evalRes.reason ? `✓ Second Serve · ${evalRes.reason}` : '✓ Second Serve');
              triggerTTS(currentGame.callout || currentGame.callCompact);
            } else if (evalRes.command === 'sideOut') {
              synth?.sideOut();
              pendingInfractionRef.current = null;
              if (handlersRef.current.onSideOut) {
                handlersRef.current.onSideOut(evalRes.reason);
              } else {
                handlersRef.current.onFault?.(evalRes.reason);
              }
              showPill(evalRes.reason ? `✓ Side Out · ${evalRes.reason}` : '✓ Side Out');
              triggerTTS(currentGame.callout || currentGame.callCompact);
            } else if (evalRes.command === 'fault') {
              synth?.fault();
              pendingInfractionRef.current = null;
              handlersRef.current.onFault?.(evalRes.reason);
              showPill(evalRes.reason ? `✓ Fault · ${evalRes.reason}` : '✓ Fault');
              triggerTTS(currentGame.callout || currentGame.callCompact);
            } else if (evalRes.command === 'pause_infraction') {
              synth?.pause();
              handlersRef.current.onPauseTimer?.();
              pendingInfractionRef.current = evalRes.label;
              showPill(`⏸ ${evalRes.label} — call ruling`, { sticky: true });
            } else if (evalRes.command === 'pause_admin') {
              synth?.pause();
              handlersRef.current.onPauseTimer?.();
              showPill(`⏸ ${evalRes.label} — say 'Time in'`, { sticky: true });
            } else if (evalRes.command === 'time_in') {
              synth?.timeIn();
              handlersRef.current.onResumeTimer?.();
              pendingInfractionRef.current = null;
              showPill('▶ Time In');
            } else if (evalRes.command === 'undo') {
              synth?.undo();
              pendingInfractionRef.current = null;
              handlersRef.current.onUndo?.();
              showPill('✓ Undo');
              triggerTTS(currentGame.callout || currentGame.callCompact);
            }
          } else if (evalRes.outcome === 'armed') {
            armedStateRef.current = evalRes.armed;
            getSynth()?.armed();
            showPill(
              `Armed: ${evalRes.command === 'point' ? 'Point' : 'Fault'} — say reason…`,
              { duration: VOICE_CONFIG.armedWindowMs }
            );
          } else if (evalRes.outcome !== 'ignored_unmatched') {
            getSynth()?.reject();
            const rejectMsg = evalRes.rejectReason
              ? PILL_LABELS[evalRes.rejectReason]
              : PILL_LABELS[evalRes.outcome] || 'Not allowed right now';
            showPill(rejectMsg);
          }

          if (VOICE_CONFIG.debugOverlay) {
            if (hideHeardTimerRef.current) {
              clearTimeout(hideHeardTimerRef.current);
              hideHeardTimerRef.current = null;
            }
            if (evalRes.outcome === 'ignored_unmatched') {
              setHeard(null);
            } else {
              setHeard({
                text: transcript,
                isFinal: true,
                command: evalRes.command,
                outcome: evalRes.outcome,
                reason: evalRes.reason,
                confidence,
              });
              hideHeardTimerRef.current = setTimeout(() => {
                if (!unmountedRef.current) {
                  setHeard(null);
                }
                hideHeardTimerRef.current = null;
              }, 1500);
            }
          }
        } else {
          const alt0 = result[0];
          interimAccumulator += (interimAccumulator ? ' ' : '') + (alt0?.transcript ?? '');
        }
      }

      if (!finalProcessed && interimAccumulator && VOICE_CONFIG.debugOverlay) {
        if (hideHeardTimerRef.current) {
          clearTimeout(hideHeardTimerRef.current);
          hideHeardTimerRef.current = null;
        }
        setHeard({
          text: interimAccumulator,
          isFinal: false,
          command: null,
          outcome: null,
          confidence: 0,
        });
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
  }, [canListenNow, releaseWakeLock, showPill, stopRecognition, triggerTTS]);

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

    // Show initial profile indicator pill
    const modeLabel = micModeRef.current === 'headset' ? 'Mic On · Headset' : 'Mic On · Open Mic';
    showPill(modeLabel);
  }, [acquireWakeLock, releaseWakeLock, showPill, startRecognition, stopRecognition]);

  // Detect browser support on mount & clean up everything on unmount
  useEffect(() => {
    unmountedRef.current = false;
    setSupported(Boolean(getSpeechRecognitionCtor()));

    return () => {
      unmountedRef.current = true;
      desiredActiveRef.current = false;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      if (pillTimerRef.current) clearTimeout(pillTimerRef.current);
      if (hideHeardTimerRef.current) clearTimeout(hideHeardTimerRef.current);
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

  // Clear sticky pause pill and pending infraction when timer resumes running
  useEffect(() => {
    if (game?.timerStatus === 'running') {
      pendingInfractionRef.current = null;
      setPill((prev) => (typeof prev === 'string' && prev.startsWith('⏸') ? null : prev));
    }
  }, [game?.timerStatus]);

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
    heard: VOICE_CONFIG.debugOverlay ? heard : null,
    micMode: effectiveMicMode,
    micModeSetting,
    setMicModeSetting,
    ttsEnabled,
    setTtsEnabled,
  };
}

export default useVoiceScoring;
