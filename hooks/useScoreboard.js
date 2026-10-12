'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { PickleballEngine } from '../lib/engine';
import { WebAudioSynth, getSynth } from '../lib/audio';

function vibrate(pattern) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch {
    // Ignore haptics errors
  }
}

export function useScoreboard({
  format = 'doubles',
  storageKey = 'pikolscore_v3',
  keyboardShortcuts = true,
  elapsedSeconds = 0,
  onEscape,
} = {}) {
  const [state, setState] = useState(null);
  const engineRef = useRef(null);
  const audioRef = useRef(null);

  const elapsedSecondsRef = useRef(elapsedSeconds);
  elapsedSecondsRef.current = elapsedSeconds;

  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  const syncState = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const s = engine.getState();
    setState(s);
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          snapshot: engine.saveSnapshot(),
          history: engine.history,
          redoStack: engine.redoStack,
        })
      );
    } catch {
      // Ignore storage write error
    }
  }, [storageKey]);

  useEffect(() => {
    audioRef.current = getSynth() || new WebAudioSynth();
    const inst = new PickleballEngine({ format });

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.snapshot) {
          inst.restoreSnapshot(parsed.snapshot);
          inst.history = Array.isArray(parsed.history) ? parsed.history : [];
          inst.redoStack = Array.isArray(parsed.redoStack) ? parsed.redoStack : [];
        } else {
          inst.restoreSnapshot(saved);
        }
      }
    } catch {
      // Ignore storage read error
    }

    engineRef.current = inst;
    setState(inst.getState());
  }, [format, storageKey]);

  const point = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    audioRef.current?.init();
    const res = engine.pointWon(elapsedSecondsRef.current);
    if (res?.event === 'gameWon') {
      audioRef.current?.gameWon();
    } else {
      audioRef.current?.point();
    }
    vibrate(15);
    syncState();
  }, [syncState]);

  const fault = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    audioRef.current?.init();
    engine.fault(elapsedSecondsRef.current);
    audioRef.current?.fault();
    vibrate([20, 40, 20]);
    syncState();
  }, [syncState]);

  const undo = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.undo()) {
      syncState();
    }
  }, [syncState]);

  const redo = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.redo()) {
      syncState();
    }
  }, [syncState]);

  const reset = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.reset();
    syncState();
  }, [syncState]);

  const setTeamName = useCallback(
    (teamIdx, name) => {
      const engine = engineRef.current;
      if (!engine || !name) return;
      const trimmed = name.trim();
      if (!trimmed) return;
      engine.setTeamName(teamIdx, trimmed);
      syncState();
    },
    [syncState]
  );

  const setTeamPalette = useCallback(
    (teamIdx, paletteKey) => {
      const engine = engineRef.current;
      if (!engine || !paletteKey) return;
      engine.setTeamPalette(teamIdx, paletteKey);
      syncState();
    },
    [syncState]
  );

  useEffect(() => {
    if (!keyboardShortcuts) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        onEscapeRef.current?.();
        return;
      }
      if (
        e.target &&
        typeof e.target.closest === 'function' &&
        e.target.closest('button, [role="button"], input, textarea, select')
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const k = e.key.toLowerCase();
      if (k === ' ') {
        e.preventDefault();
        point();
      } else if (k === 'f') {
        fault();
      } else if (k === 'z') {
        undo();
      } else if (k === 'y') {
        redo();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [keyboardShortcuts, point, fault, undo, redo]);

  return {
    state,
    servingTeam: state?.servingTeam ?? 0,
    servingTeamKey: state?.servingTeamKey ?? 'omega',
    log: state?.log ?? [],
    canUndo: Boolean(state?.canUndo),
    canRedo: Boolean(state?.canRedo),
    gameOver: Boolean(state?.gameOver),
    winner: state?.winner ?? null,
    winnerName: state?.winnerName ?? null,
    point,
    fault,
    undo,
    redo,
    reset,
    setTeamName,
    setTeamPalette,
  };
}
