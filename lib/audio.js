// Zero-dependency native Web Audio synth
export class WebAudioSynth {
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

  tick() {
    this.playTone(880, 'sine', 0.05, 0.1);
  }

  timeUp() {
    [440, 330, 220].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'triangle', 0.25, 0.3), i * 180);
    });
  }
}

let synthInstance = null;
export function getSynth() {
  if (!synthInstance && typeof window !== 'undefined') {
    synthInstance = new WebAudioSynth();
  }
  return synthInstance;
}
