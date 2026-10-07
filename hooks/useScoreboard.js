'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { PickleballEngine } from '../lib/engine';
import { WebAudioSynth, getSynth } from '../lib/audio';

export function useScoreboard({
  format = 'doubles',
  storageKey = 'pikolscore_landscape_v2',
  keyboardShortcuts = true,
  locked = false,
  onRally,
  onTogglePause,
} = {}) {
  const [state, setState] = useState(null);
  const engineRef = useRef(null);
  const audioRef = useRef(null);

  const lockedRef = useRef(locked);
  lockedRef.current = locked;

  const onRallyRef = useRef(onRally);
  onRallyRef.current = onRally;

  const onTogglePauseRef = useRef(onTogglePause);
  onTogglePauseRef.current = onTogglePause;

  const syncState = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const s = engine.getState();
    setState(s);
    try {
      localStorage.setItem(storageKey, engine.saveSnapshot());
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
        inst.restoreSnapshot(saved);
      }
    } catch {
      // Ignore storage read error
    }

    engineRef.current = inst;
    setState(inst.getState());
  }, [format, storageKey]);

  const point = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || engine.getState().gameOver || lockedRef.current) return;
    audioRef.current?.init();
    const res = engine.pointWon();
    if (res?.event === 'gameWon') {
      audioRef.current?.gameWon();
    } else {
      audioRef.current?.point();
    }
    syncState();
    onRallyRef.current?.();
  }, [syncState]);

  const fault = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || engine.getState().gameOver || lockedRef.current) return;
    audioRef.current?.init();
    engine.fault();
    audioRef.current?.fault();
    syncState();
    onRallyRef.current?.();
  }, [syncState]);

  const undo = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.undo()) {
      syncState();
    }
  }, [syncState]);

  const reset = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.reset();
    syncState();
  }, [syncState]);

  const renameServingTeam = useCallback((name) => {
    const engine = engineRef.current;
    if (!engine || !name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const s = engine.getState();
    engine.setTeamName(s.servingTeam, trimmed.toUpperCase());
    syncState();
  }, [syncState]);

  useEffect(() => {
    if (!keyboardShortcuts) return;

    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        onTogglePauseRef.current?.();
      } else if (e.key === 'z' || e.key === 'Z') {
        undo();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        point();
      } else if (e.key === 'f' || e.key === 'F') {
        fault();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [keyboardShortcuts, undo, point, fault]);

  return {
    state,
    point,
    fault,
    undo,
    reset,
    renameServingTeam,
  };
}
