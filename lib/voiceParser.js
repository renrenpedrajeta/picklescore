import { VOICE_CONFIG, VOICE_PHRASES } from '../config/voice.js';

export const VOICE_AUDIT_STORAGE_KEY = 'pikolscore_voice_audit_v1';
export const VOICE_AUDIT_MAX_ENTRIES = 500;

const BUCKETS = ['point', 'fault', 'undo'];

export function normalize(text) {
  if (typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function evaluateVoiceTranscript({
  transcript,
  confidence = 0,
  now = Date.now(),
  game = {},
  timing = {},
  config = VOICE_CONFIG,
  phrases = VOICE_PHRASES,
} = {}) {
  const cfg = { ...VOICE_CONFIG, ...config };
  const prevTiming = {
    lastScoreAt:
      typeof timing?.lastScoreAt === 'number' && Number.isFinite(timing.lastScoreAt)
        ? timing.lastScoreAt
        : null,
    lastUndoAt:
      typeof timing?.lastUndoAt === 'number' && Number.isFinite(timing.lastUndoAt)
        ? timing.lastUndoAt
        : null,
  };

  // 1. Normalize & word-count cap
  const normalized = normalize(transcript);
  if (!normalized) {
    return { outcome: 'ignored_unmatched', command: null, timing: prevTiming };
  }
  const words = normalized.split(' ');
  if (words.length > cfg.maxWords) {
    return { outcome: 'ignored_unmatched', command: null, timing: prevTiming };
  }

  // 2. Word-boundary phrase match across buckets
  const padded = ` ${normalized} `;
  const matchedBuckets = [];

  for (const bucket of BUCKETS) {
    const list = Array.isArray(phrases?.[bucket]) ? phrases[bucket] : [];
    for (const rawPhrase of list) {
      const normPhrase = normalize(rawPhrase);
      if (normPhrase && padded.includes(` ${normPhrase} `)) {
        matchedBuckets.push(bucket);
        break;
      }
    }
  }

  if (matchedBuckets.length === 0) {
    return { outcome: 'ignored_unmatched', command: null, timing: prevTiming };
  }
  if (matchedBuckets.length > 1) {
    return { outcome: 'rejected_ambiguous', command: null, timing: prevTiming };
  }

  const command = matchedBuckets[0];

  // 3. Confidence gate (0 means unpopulated on iOS Safari and must pass)
  const conf =
    typeof confidence === 'number' && Number.isFinite(confidence) ? confidence : 0;
  if (conf > 0 && conf < cfg.minConfidence) {
    return { outcome: 'rejected_confidence', command, timing: prevTiming };
  }

  // 4. Gate (lockout window)
  if (command === 'point' || command === 'fault') {
    if (prevTiming.lastScoreAt !== null && now - prevTiming.lastScoreAt < cfg.lockoutMs) {
      return { outcome: 'suppressed_cooldown', command, timing: prevTiming };
    }
  } else if (command === 'undo') {
    if (prevTiming.lastUndoAt !== null && now - prevTiming.lastUndoAt < cfg.undoLockoutMs) {
      return { outcome: 'suppressed_cooldown', command, timing: prevTiming };
    }
  }

  // 5. Validate game state
  const {
    isGuest = false,
    isTimeExpired = false,
    timerStatus = 'idle',
    gameOver = false,
    canUndo = false,
  } = game || {};

  if (isGuest || isTimeExpired) {
    return { outcome: 'rejected_state', command, timing: prevTiming };
  }

  // Scoreboard auto-pauses timer when gameOver becomes true, so evaluate gameOver before paused
  if (gameOver) {
    if (command !== 'undo' || !canUndo) {
      return { outcome: 'rejected_state', command, timing: prevTiming };
    }
  } else if (timerStatus === 'paused') {
    return { outcome: 'rejected_paused', command, timing: prevTiming };
  }

  if (command === 'undo' && !canUndo) {
    return { outcome: 'rejected_state', command, timing: prevTiming };
  }

  // 6. Accept
  if (command === 'undo') {
    return {
      outcome: 'accepted',
      command,
      timing: {
        lastScoreAt: null,
        lastUndoAt: now,
      },
    };
  }

  return {
    outcome: 'accepted',
    command,
    timing: {
      lastScoreAt: now,
      lastUndoAt: prevTiming.lastUndoAt,
    },
  };
}

function resolveStorage(injectedStorage) {
  if (injectedStorage !== undefined) return injectedStorage;
  if (typeof window !== 'undefined') {
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  }
  return null;
}

export function read(injectedStorage) {
  const storage = resolveStorage(injectedStorage);
  if (!storage || typeof storage.getItem !== 'function') return [];
  try {
    const raw = storage.getItem(VOICE_AUDIT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function append(entry, injectedStorage) {
  const storage = resolveStorage(injectedStorage);
  const record = {
    timestamp: entry?.timestamp ?? new Date().toISOString(),
    sessionId: entry?.sessionId ?? null,
    transcript: entry?.transcript === undefined || entry?.transcript === null ? '' : String(entry.transcript),
    confidence:
      typeof entry?.confidence === 'number' && Number.isFinite(entry.confidence)
        ? entry.confidence
        : 0,
    command: entry?.command ?? null,
    outcome: entry?.outcome ? String(entry.outcome) : '',
  };

  if (!storage || typeof storage.setItem !== 'function') return [record];

  try {
    const existing = read(storage);
    const next = [...existing, record].slice(-VOICE_AUDIT_MAX_ENTRIES);
    storage.setItem(VOICE_AUDIT_STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch {
    return [];
  }
}

export function clear(injectedStorage) {
  const storage = resolveStorage(injectedStorage);
  if (!storage || typeof storage.removeItem !== 'function') return;
  try {
    storage.removeItem(VOICE_AUDIT_STORAGE_KEY);
  } catch {
    // Ignore storage removal errors
  }
}

function escapeCsvField(value) {
  let str = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

export function toCsv(entries = []) {
  const header = ['timestamp', 'sessionId', 'transcript', 'confidence', 'command', 'outcome']
    .map(escapeCsvField)
    .join(',');

  const list = Array.isArray(entries) ? entries : [];
  const rows = list.map((item) =>
    [
      item?.timestamp ?? '',
      item?.sessionId ?? '',
      item?.transcript ?? '',
      item?.confidence ?? 0,
      item?.command ?? '',
      item?.outcome ?? '',
    ]
      .map(escapeCsvField)
      .join(',')
  );

  return [header, ...rows].join('\n');
}
