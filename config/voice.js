export const VOICE_CONFIG = {
  lockoutMs: 2500,
  undoLockoutMs: 2000,
  minConfidence: 0.65,
  maxWords: 4,
};

export const VOICE_PHRASES = {
  point: ['point won', 'umpire point', 'score point'],
  fault: ['fault', 'service fault', 'side out', 'second server'],
  undo: ['undo score', 'umpire undo', 'correction undo'], // strictly multi-word
};

// ponytail: later upgrade is ONE flat Supabase table
// (phrase TEXT PRIMARY KEY, command TEXT, enabled BOOL) cached in localStorage.
// Do not build it now.
