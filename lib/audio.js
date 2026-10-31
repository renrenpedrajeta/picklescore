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

  secondServe() {
    this.playTone(329.63, 'sine', 0.1, 0.25); // E4
    setTimeout(() => this.playTone(329.63, 'sine', 0.12, 0.25), 80);
  }

  sideOut() {
    this.playTone(329.63, 'sine', 0.1, 0.25); // E4
    setTimeout(() => this.playTone(220, 'triangle', 0.18, 0.28), 90); // A3
  }

  pause() {
    this.playTone(783.99, 'sine', 0.09, 0.25); // G5
    setTimeout(() => this.playTone(587.33, 'sine', 0.12, 0.25), 80); // D5
  }

  timeIn() {
    this.playTone(587.33, 'sine', 0.09, 0.22); // D5
    setTimeout(() => this.playTone(783.99, 'sine', 0.14, 0.25), 80); // G5
  }

  armed() {
    this.playTone(698.46, 'sine', 0.06, 0.16); // F5
  }

  undo() {
    this.playTone(587.33, 'sine', 0.09, 0.22); // D5
    setTimeout(() => this.playTone(440, 'sine', 0.13, 0.22), 75); // A4
  }

  reject() {
    this.playTone(180, 'triangle', 0.08, 0.18);
    setTimeout(() => this.playTone(160, 'triangle', 0.1, 0.18), 95);
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

export function speakScoreCallout(text, onComplete) {
  if (typeof window === 'undefined' || !window.speechSynthesis || !text) {
    onComplete?.();
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    let finished = false;
    const finish = () => {
      if (!finished) {
        finished = true;
        onComplete?.();
      }
    };
    utterance.onend = finish;
    utterance.onerror = finish;
    window.speechSynthesis.speak(utterance);
    setTimeout(finish, 4000);
  } catch {
    onComplete?.();
  }
}
