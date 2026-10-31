export const VOICE_CONFIG = {
  lockoutMs: 2500,
  undoLockoutMs: 2000,
  minConfidence: 0.65,
  minPhase1Confidence: 0.75,
  maxWords: 7,
  maxAlternatives: 3,
  armedWindowMs: 2500,
  debugOverlay: true,
};

// Phase 1: High-Risk Triggers (Pause timer, strict result[0] only)
export const VOICE_PHASE1_FAULT_INFRACTIONS = {
  'fault non volley zone': 'Non-volley zone fault',
  'non volley zone fault': 'Non-volley zone fault',
  'kitchen fault': 'Kitchen fault',
  'service foot fault': 'Service foot fault',
  'foot fault': 'Foot fault',
  'fault permanent object': 'Permanent object fault',
};

export const VOICE_PHASE1_ADMIN_OVERRIDES = {
  'referee correction': 'Referee correction',
  'technical warning': 'Technical warning',
  'technical foul': 'Technical foul',
  'time out': 'Time out',
  'medical time out': 'Medical time out',
};

// Control commands
export const VOICE_CONTROLS = {
  time_in: ['time in', 'resume timer'],
  undo: ['undo score', 'umpire undo', 'correction undo'], // strictly multi-word
};

// Phase 2: State-Changing Triggers (Score & Server State)
export const VOICE_PHRASES = {
  point: {
    primary: 'point',
    variants: ['point won', 'score point'],
  },
  secondServe: {
    primary: 'second serve',
    variants: ['server two', 'second'],
  },
  sideOut: {
    primary: 'side out',
    variants: ['sideout', 'change side'],
  },
  fault: {
    primary: 'fault',
    variants: ['service fault'],
  },
  undo: ['undo score', 'umpire undo', 'correction undo'],
};

// Curated R&D follow-up reasons for MatchLog
export const VOICE_REASONS = {
  point: {
    'serve in': 'Serve in',
    'server in': 'Serve in',
    'bounce twice': 'Double bounce',
    'double bounce': 'Double bounce',
  },
  fault: {
    'bounce twice': 'Double bounce',
    'double bounce': 'Double bounce',
    'out': 'Out',
    'ball out': 'Out',
    'net': 'Net',
  },
};
