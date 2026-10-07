'use client';

import { useState, useEffect, useRef } from 'react';
import { PickleballEngine } from '../lib/engine';

// Zero-dependency native Web Audio synth
class WebAudioSynth {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type = 'sine', duration = 0.14, gainVal = 0.22) {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio autoplay restriction silent fallback
    }
  }

  point() {
    this.playTone(523.25, 'sine', 0.1, 0.25); // C5
    setTimeout(() => this.playTone(659.25, 'sine', 0.15, 0.25), 80); // E5
  }

  fault() {
    this.playTone(220, 'triangle', 0.2, 0.3); // A3
  }

  gameWon() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sine', 0.2, 0.3), i * 110);
    });
  }
}

const STORAGE_KEY = 'pikolscore_landscape_v2';

export default function ScoreboardPage() {
  const [engine, setEngine] = useState(null);
  const [state, setState] = useState(null);
  const audioRef = useRef(null);

  // Initialize engine and load persistence
  useEffect(() => {
    audioRef.current = new WebAudioSynth();
    const inst = new PickleballEngine({ format: 'doubles' });

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        inst.restoreSnapshot(saved);
      }
    } catch {
      // Ignore storage read error
    }

    setEngine(inst);
    setState(inst.getState());
  }, []);

  const syncState = (inst) => {
    const s = inst.getState();
    setState(s);
    try {
      localStorage.setItem(STORAGE_KEY, inst.saveSnapshot());
    } catch {
      // Ignore storage write error
    }
  };

  const handlePoint = () => {
    if (!engine || state?.gameOver) return;
    audioRef.current?.init();
    const res = engine.pointWon();
    if (res.event === 'gameWon') {
      audioRef.current?.gameWon();
    } else {
      audioRef.current?.point();
    }
    syncState(engine);
  };

  const handleFault = () => {
    if (!engine || state?.gameOver) return;
    audioRef.current?.init();
    engine.fault();
    audioRef.current?.fault();
    syncState(engine);
  };

  const handleUndo = () => {
    if (!engine) return;
    if (engine.undo()) {
      syncState(engine);
    }
  };

  const handleReset = () => {
    if (!engine) return;
    if (confirm('Start a new match?')) {
      engine.reset();
      syncState(engine);
    }
  };

  const handleEditTeam = () => {
    if (!engine || !state) return;
    const current = state.servingTeamName;
    const name = prompt('Edit serving team name:', current);
    if (name && name.trim()) {
      engine.setTeamName(state.servingTeam, name.trim().toUpperCase());
      syncState(engine);
    }
  };

  // Keyboard shortcuts (Z for Undo, Space for Point, F for Fault)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'z' || e.key === 'Z') {
        handleUndo();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handlePoint();
      } else if (e.key === 'f' || e.key === 'F') {
        handleFault();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  if (!state) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#00564c', fontWeight: 700 }}>
        Loading PikolScore...
      </div>
    );
  }

  return (
    <>
      {/* Mobile Portrait Orientation Prompt */}
      <div className="landscape-hint">
        <span>🔄 Rotate your phone to Landscape for optimal courtside console experience</span>
      </div>

      <main className="console-viewport">
        {/* Top Header */}
        <header className="console-header">
          <div className="brand-wrapper">
            <div className="brand-squircle" />
            <h1 className="brand-title">PIKOLSCORE</h1>
          </div>
          <button
            onClick={handleReset}
            title="Reset Match"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <div className="status-circle" />
          </button>
        </header>

        {/* Central Tactical Scoreboard Binder */}
        <section className="courtside-binder">
          {/* Left Panel: Scoreboard Display */}
          <div className="scoreboard-card">
            {/* Split Flap Team Header */}
            <div className="flap-display-wrapper" onClick={handleEditTeam} style={{ cursor: 'pointer' }}>
              <div className="flap-label">
                <span>↻</span>
                <span>FLAP DISPLAY</span>
              </div>
              <div className="flap-unit">
                <div className="flap-hinge-left" />
                <div className="flap-seam" />
                <span className="flap-text">{state.servingTeamName}</span>
                <div className="flap-hinge-right" />
              </div>
            </div>

            {/* Scores Dual Columns */}
            <div className="teams-score-grid">
              {/* Serving Team Column */}
              <div className="team-score-column">
                <div className="team-header-pill">
                  <span className="dot" />
                  <span>SERVING TEAM</span>
                </div>
                <div className="digits-container">
                  <div className="digit-tile">
                    <span className={`digit-number ${state.serverTens === 0 ? 'is-zero' : ''}`}>
                      {state.serverTens}
                    </span>
                  </div>
                  <div className="digit-tile">
                    <span className={`digit-number ${state.serverUnits === 0 ? 'is-zero' : ''}`}>
                      {state.serverUnits}
                    </span>
                  </div>
                </div>
              </div>

              {/* Receiving Team Column */}
              <div className="team-score-column">
                <div className="team-header-pill receiving">
                  <span className="dot" />
                  <span>RECEIVING TEAM</span>
                </div>
                <div className="digits-container">
                  <div className="digit-tile">
                    <span className={`digit-number ${state.receiverTens === 0 ? 'is-zero' : ''}`}>
                      {state.receiverTens}
                    </span>
                  </div>
                  <div className="digit-tile">
                    <span className={`digit-number ${state.receiverUnits === 0 ? 'is-zero' : ''}`}>
                      {state.receiverUnits}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Server Number Badge Tile (Bottom) */}
            <div className="server-badge-tile">
              <div className="server-number-circle">
                {state.serverNumber || 1}
              </div>
            </div>
          </div>

          {/* Book Fold Center Crease */}
          <div className="center-crease" />

          {/* Right Panel: Action Buttons */}
          <div className="action-column">
            {/* Undo Button */}
            <button
              className="btn-undo-header"
              onClick={handleUndo}
              disabled={!state.canUndo}
              title="Undo last rally"
            >
              <span>↶ UNDO</span>
              <span className="key-chip">Z</span>
            </button>

            {/* Action Buttons Wrapper */}
            <div className="action-buttons-wrapper">
              {/* Giant POINT WON Button */}
              <button className="btn-point-won" onClick={handlePoint} disabled={state.gameOver}>
                <div className="icon-circle-yellow">+</div>
                <span className="btn-title-white">POINT WON</span>
              </button>

              {/* Giant FAULT Button */}
              <button className="btn-fault" onClick={handleFault} disabled={state.gameOver}>
                <div className="icon-circle-sage">⚑</div>
                <span className="btn-title-teal">FAULT</span>
              </button>
            </div>
          </div>
        </section>

        {/* Footer Status Bar */}
        <footer className="console-footer">
          <div className="footer-left">Powered by</div>
          <div className="footer-center">Wren Labs</div>
          <div className="footer-right">Android recorder · 0.1.0</div>
        </footer>

        {/* Game Won Celebration Overlay */}
        {state.gameOver && (
          <div className="game-won-overlay">
            <div className="game-won-dialog">
              <h2>🏆 {state.winnerName} WINS!</h2>
              <p>
                Final Score: {state.scores[0]} - {state.scores[1]} (Official 11-point win by 2)
              </p>
              <button className="btn-new-game" onClick={handleReset}>
                Start New Match
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
