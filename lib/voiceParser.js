import {
  VOICE_CONFIG,
  VOICE_PHRASES,
  VOICE_PHASE1_FAULT_INFRACTIONS,
  VOICE_PHASE1_ADMIN_OVERRIDES,
  VOICE_CONTROLS,
  VOICE_REASONS,
} from '../config/voice.js';

export const VOICE_AUDIT_STORAGE_KEY = 'pikolscore_voice_audit_v1';
export const VOICE_AUDIT_MAX_ENTRIES = 500;

const NEGATION_WORDS = new Set(['no', 'not', 'dont', 'wait', 'cancel', 'never']);

export function normalize(text) {
  if (typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function canonicalizePhase2(text) {
  if (!text) return '';
  return text
    .replace(/\bpoint\s+(?:1|one)\b/g, 'point won')
    .replace(/\b2nd\b/g, 'second')
    .replace(/\bserver\s+2\b/g, 'server two');
}

function stripLeadingRole(text) {
  if (text.startsWith('umpire ')) {
    return text.slice(7).trim();
  }
  if (text.startsWith('referee ') && text !== 'referee correction') {
    return text.slice(8).trim();
  }
  return text;
}

function hasNegation(words) {
  return words.some((w) => NEGATION_WORDS.has(w));
}

// Ordered list of Phase 2 trigger phrases to match longest first
const PHASE2_TRIGGERS = [
  { trigger: 'second serve', command: 'secondServe', multiWord: true },
  { trigger: 'server two', command: 'secondServe', multiWord: true },
  { trigger: 'second', command: 'secondServe', multiWord: false },
  { trigger: 'side out', command: 'sideOut', multiWord: true },
  { trigger: 'sideout', command: 'sideOut', multiWord: true },
  { trigger: 'change side', command: 'sideOut', multiWord: true },
  { trigger: 'point won', command: 'point', multiWord: true },
  { trigger: 'score point', command: 'point', multiWord: true },
  { trigger: 'point', command: 'point', multiWord: false },
  { trigger: 'service fault', command: 'fault', multiWord: true },
  { trigger: 'fault', command: 'fault', multiWord: false },
];

export function evaluateVoiceTranscript({
  transcript = '',
  confidence = 0,
  alternatives = null,
  now = Date.now(),
  game = {},
  timing = {},
  config = VOICE_CONFIG,
  phrases = VOICE_PHRASES,
  reasons = VOICE_REASONS,
  micMode = 'open_mic', // 'open_mic' | 'headset'
  armed = null, // { trigger: 'point' | 'fault', armedAt: number } or null
  pendingInfraction = null, // e.g. 'Kitchen fault'
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

  const alts =
    Array.isArray(alternatives) && alternatives.length > 0
      ? alternatives
      : [{ transcript: transcript ?? '', confidence: confidence ?? 0 }];

  const topAlt = alts[0] || { transcript: '', confidence: 0 };
  const topNormalized = normalize(topAlt.transcript);

  // 1. If empty or exceeds maxWords
  if (!topNormalized) {
    return { outcome: 'ignored_unmatched', command: null, timing: prevTiming, armed: null };
  }
  const topWords = topNormalized.split(' ');
  if (topWords.length > cfg.maxWords) {
    return { outcome: 'ignored_unmatched', command: null, timing: prevTiming, armed: null };
  }

  // 2. Unconditional Negation Guard
  if (hasNegation(topWords)) {
    return { outcome: 'ignored_unmatched', command: null, timing: prevTiming, armed: null };
  }

  const topStripped = stripLeadingRole(topNormalized);
  const topConf =
    typeof topAlt.confidence === 'number' && Number.isFinite(topAlt.confidence)
      ? topAlt.confidence
      : 0;

  // 3. Armed State Check (Open Mic waiting for follow-up reason within armedWindowMs)
  const isArmedActive =
    armed &&
    armed.trigger &&
    typeof armed.armedAt === 'number' &&
    now - armed.armedAt <= (cfg.armedWindowMs ?? 2500);

  if (isArmedActive) {
    const reasonMap = reasons?.[armed.trigger] || VOICE_REASONS?.[armed.trigger] || {};
    const matchedReason = reasonMap[topStripped] || reasonMap[topNormalized];
    if (matchedReason) {
      // Check Phase 2 confidence gate
      if (topConf > 0 && topConf < cfg.minConfidence) {
        return { outcome: 'rejected_confidence', command: armed.trigger, timing: prevTiming, armed: null };
      }
      // Check lockout
      if (prevTiming.lastScoreAt !== null && now - prevTiming.lastScoreAt < cfg.lockoutMs) {
        return { outcome: 'suppressed_cooldown', command: armed.trigger, timing: prevTiming, armed: null };
      }
      // Check game state
      const { isGuest = false, isTimeExpired = false, gameOver = false } = game || {};
      if (isGuest || isTimeExpired || gameOver) {
        return { outcome: 'rejected_state', command: armed.trigger, timing: prevTiming, armed: null };
      }
      return {
        outcome: 'accepted',
        command: armed.trigger,
        reason: matchedReason,
        label: null,
        rejectReason: null,
        timing: {
          lastScoreAt: now,
          lastUndoAt: prevTiming.lastUndoAt,
        },
        armed: null,
      };
    }
  }

  // 4. Phase 1: High-Risk Triggers & Control Commands (Strict result[0] only)
  // 4a. Phase 1 Fault Infractions (Pauses match timer + stores infraction label)
  const infractionLabel =
    VOICE_PHASE1_FAULT_INFRACTIONS[topStripped] ||
    VOICE_PHASE1_FAULT_INFRACTIONS[topNormalized];

  if (infractionLabel) {
    if (topConf > 0 && topConf < (cfg.minPhase1Confidence ?? 0.75)) {
      return { outcome: 'rejected_confidence', command: 'pause_infraction', timing: prevTiming, armed: null };
    }
    const { isGuest = false, isTimeExpired = false, gameOver = false, timerStatus = 'idle' } = game || {};
    if (isGuest || isTimeExpired || gameOver) {
      return { outcome: 'rejected_state', command: 'pause_infraction', timing: prevTiming, armed: null };
    }
    if (timerStatus === 'paused') {
      return { outcome: 'rejected_state', command: 'pause_infraction', timing: prevTiming, armed: null };
    }
    return {
      outcome: 'accepted',
      command: 'pause_infraction',
      label: infractionLabel,
      reason: infractionLabel,
      rejectReason: null,
      timing: prevTiming,
      armed: null,
    };
  }

  // 4b. Phase 1 Administrative Overrides (Pauses match timer)
  const adminLabel =
    VOICE_PHASE1_ADMIN_OVERRIDES[topStripped] ||
    VOICE_PHASE1_ADMIN_OVERRIDES[topNormalized];

  if (adminLabel) {
    if (topConf > 0 && topConf < (cfg.minPhase1Confidence ?? 0.75)) {
      return { outcome: 'rejected_confidence', command: 'pause_admin', timing: prevTiming, armed: null };
    }
    const { isGuest = false, isTimeExpired = false, gameOver = false, timerStatus = 'idle' } = game || {};
    if (isGuest || isTimeExpired || gameOver) {
      return { outcome: 'rejected_state', command: 'pause_admin', timing: prevTiming, armed: null };
    }
    if (timerStatus === 'paused') {
      return { outcome: 'rejected_state', command: 'pause_admin', timing: prevTiming, armed: null };
    }
    return {
      outcome: 'accepted',
      command: 'pause_admin',
      label: adminLabel,
      reason: adminLabel,
      rejectReason: null,
      timing: prevTiming,
      armed: null,
    };
  }

  // 4c. Control Command: Time In / Resume Timer
  const timeInPhrases = VOICE_CONTROLS?.time_in || ['time in', 'resume timer'];
  if (timeInPhrases.includes(topStripped) || timeInPhrases.includes(topNormalized)) {
    if (topConf > 0 && topConf < (cfg.minPhase1Confidence ?? 0.75)) {
      return { outcome: 'rejected_confidence', command: 'time_in', timing: prevTiming, armed: null };
    }
    const { isGuest = false, isTimeExpired = false, gameOver = false, timerStatus = 'idle' } = game || {};
    if (isGuest || isTimeExpired || gameOver || timerStatus !== 'paused') {
      return { outcome: 'rejected_state', command: 'time_in', timing: prevTiming, armed: null };
    }
    return {
      outcome: 'accepted',
      command: 'time_in',
      label: 'Time In',
      reason: null,
      rejectReason: null,
      timing: prevTiming,
      armed: null,
    };
  }

  // 4d. Control Command: Undo (Strictly multi-word)
  const undoPhrases =
    VOICE_CONTROLS?.undo ||
    (Array.isArray(phrases?.undo) ? phrases.undo : ['undo score', 'umpire undo', 'correction undo']);

  if (undoPhrases.includes(topStripped) || undoPhrases.includes(topNormalized)) {
    if (topConf > 0 && topConf < cfg.minConfidence) {
      return { outcome: 'rejected_confidence', command: 'undo', timing: prevTiming, armed: null };
    }
    if (prevTiming.lastUndoAt !== null && now - prevTiming.lastUndoAt < cfg.undoLockoutMs) {
      return { outcome: 'suppressed_cooldown', command: 'undo', timing: prevTiming, armed: null };
    }
    const { isGuest = false, isTimeExpired = false, canUndo = false } = game || {};
    if (isGuest || isTimeExpired || !canUndo) {
      return { outcome: 'rejected_state', command: 'undo', timing: prevTiming, armed: null };
    }
    return {
      outcome: 'accepted',
      command: 'undo',
      label: 'Undo',
      reason: null,
      rejectReason: null,
      timing: {
        lastScoreAt: null,
        lastUndoAt: now,
      },
      armed: null,
    };
  }

  // 5. Phase 2: State-Changing Triggers (Evaluated asymmetrically over alternatives[0..2])
  const maxAlts = cfg.maxAlternatives ?? 3;
  const candidateAlts = alts.slice(0, maxAlts);

  for (let altIdx = 0; altIdx < candidateAlts.length; altIdx += 1) {
    const alt = candidateAlts[altIdx];
    if (!alt) continue;
    const rawNormalized = normalize(alt.transcript);
    if (!rawNormalized) continue;

    const words = rawNormalized.split(' ');
    if (words.length > cfg.maxWords) continue;
    if (hasNegation(words)) {
      return { outcome: 'ignored_unmatched', command: null, timing: prevTiming, armed: null };
    }

    const stripped = stripLeadingRole(rawNormalized);
    const canon = canonicalizePhase2(stripped);
    const altConf =
      typeof alt.confidence === 'number' && Number.isFinite(alt.confidence) ? alt.confidence : 0;

    // Match candidate trigger against PHASE2_TRIGGERS
    for (const item of PHASE2_TRIGGERS) {
      const { trigger, command, multiWord } = item;
      let matched = false;
      let remainder = '';

      if (canon === trigger) {
        matched = true;
        remainder = '';
      } else if (canon.startsWith(`${trigger} `)) {
        matched = true;
        remainder = canon.slice(trigger.length).trim();
      }

      if (!matched) continue;

      let inlineReason = null;
      if (remainder) {
        const reasonKey = command === 'point' ? 'point' : 'fault';
        const reasonMap = reasons?.[reasonKey] || VOICE_REASONS?.[reasonKey] || {};
        inlineReason = reasonMap[remainder] || null;
        if (!inlineReason) {
          // If trailing words are not in the curated glossary, reject this candidate (full utterance match)
          continue;
        }
      }

      // If standalone (no reason) in Open-Mic mode for 1-word triggers: enter armed window
      // (unless a Phase 1 pendingInfraction is already supplying the reason)
      if (!remainder && !multiWord && micMode === 'open_mic' && !pendingInfraction) {
        if (altConf > 0 && altConf < cfg.minConfidence) {
          return { outcome: 'rejected_confidence', command, timing: prevTiming, armed: null };
        }
        const { isGuest = false, isTimeExpired = false, gameOver = false } = game || {};
        if (isGuest || isTimeExpired || gameOver) {
          return { outcome: 'rejected_state', command, timing: prevTiming, armed: null };
        }
        return {
          outcome: 'armed',
          command,
          label: `Armed: ${command}`,
          reason: null,
          rejectReason: null,
          timing: prevTiming,
          armed: { trigger: command === 'point' ? 'point' : 'fault', armedAt: now },
        };
      }

      // Check Phase 2 confidence threshold
      if (altConf > 0 && altConf < cfg.minConfidence) {
        return { outcome: 'rejected_confidence', command, timing: prevTiming, armed: null };
      }

      // Lockout window
      if (prevTiming.lastScoreAt !== null && now - prevTiming.lastScoreAt < cfg.lockoutMs) {
        return { outcome: 'suppressed_cooldown', command, timing: prevTiming, armed: null };
      }

      // Game state validation
      const {
        isGuest = false,
        isTimeExpired = false,
        gameOver = false,
        format = 'doubles',
        serverNumber = 2,
      } = game || {};

      if (isGuest || isTimeExpired || gameOver) {
        return { outcome: 'rejected_state', command, timing: prevTiming, armed: null };
      }

      // State guards for secondServe and sideOut
      if (command === 'secondServe') {
        if (format === 'singles') {
          return {
            outcome: 'rejected_state',
            command,
            rejectReason: 'singles_match',
            timing: prevTiming,
            armed: null,
          };
        }
        if (serverNumber === 2) {
          return {
            outcome: 'rejected_state',
            command,
            rejectReason: 'already_server_2',
            timing: prevTiming,
            armed: null,
          };
        }
      }

      if (command === 'sideOut') {
        if (format === 'doubles' && serverNumber === 1) {
          return {
            outcome: 'rejected_state',
            command,
            rejectReason: 'still_server_1',
            timing: prevTiming,
            armed: null,
          };
        }
      }

      const effectiveReason = inlineReason || pendingInfraction || null;

      return {
        outcome: 'accepted',
        command,
        reason: effectiveReason,
        label: effectiveReason ? `${command} · ${effectiveReason}` : command,
        rejectReason: null,
        timing: {
          lastScoreAt: now,
          lastUndoAt: prevTiming.lastUndoAt,
        },
        armed: null,
      };
    }
  }

  return { outcome: 'ignored_unmatched', command: null, timing: prevTiming, armed: null };
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
