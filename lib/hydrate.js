/**
 * Engine Hydration Adapter (lib/hydrate.js)
 *
 * Bridges the Supabase PostgreSQL ledger (match_sessions & match_events)
 * with the local deterministic PickleballEngine in lib/engine.js without
 * modifying lib/engine.js.
 */

/**
 * Extracts pure RallyState from an active PickleballEngine instance.
 * @param {import('./engine').PickleballEngine} engine
 * @returns {object} RallyState
 */
export function engineToRallyState(engine) {
  if (!engine) return null;
  return {
    format: engine.format || 'doubles',
    scores: Array.isArray(engine.scores) ? [...engine.scores] : [0, 0],
    servingTeam: engine.servingTeam ?? 0,
    serverNumber: engine.serverNumber ?? (engine.format === 'doubles' ? 2 : 1),
    serverCourt: engine.serverCourt || 'right',
    courtPositions: Array.isArray(engine.courtPositions)
      ? JSON.parse(JSON.stringify(engine.courtPositions))
      : [
          { left: 'Player 2', right: 'Player 1' },
          { left: 'Player 4', right: 'Player 3' },
        ],
    gameOver: Boolean(engine.gameOver),
    winner: engine.winner ?? null,
  };
}

/**
 * Normalizes log entries into the exact double-keyed format expected by PickleballEngine:
 * { elapsed, message, call, e, m, sc }
 */
export function formatLogEntry(eventOrEntry) {
  if (!eventOrEntry) return null;
  const elapsed = Math.max(
    0,
    Math.floor(
      Number(
        eventOrEntry.elapsed_seconds ??
          eventOrEntry.elapsed ??
          eventOrEntry.e ??
          0
      ) || 0
    )
  );
  const message = String(
    eventOrEntry.message ?? eventOrEntry.m ?? ''
  );
  const call = String(
    eventOrEntry.call_string ?? eventOrEntry.call ?? eventOrEntry.sc ?? ''
  );
  return { elapsed, message, call, e: elapsed, m: message, sc: call };
}

/**
 * Rehydrates a PickleballEngine instance from a Supabase session and its ledger events.
 * 
 * Rebuilds engine.history and engine.redoStack so that undo() and redo() locally
 * reflect cloud state precisely per Section 7.5.
 *
 * @param {import('./engine').PickleballEngine} engine
 * @param {object} session Supabase match_sessions row
 * @param {Array<object>} events Array of Supabase match_events rows (status: 'active' | 'undone')
 */
export function sessionToEngine(engine, session, events = []) {
  if (!engine || !session) return;

  const format = session.format || engine.format || 'doubles';
  const teamKeys = session.team_keys || engine.teamKeys || ['omega', 'alpha'];
  const teamNames = session.team_names || engine.teamNames || ['Team Omega', 'Team Alpha'];
  const teamPalettes = session.team_palettes || engine.teamPalettes || ['omega', 'alpha'];

  // 1. Separate and sort active and undone events ascending by sequence
  const activeEvents = (events || [])
    .filter((e) => e && e.status === 'active')
    .sort((a, b) => (Number(a.sequence) || 0) - (Number(b.sequence) || 0));

  const undoneEvents = (events || [])
    .filter((e) => e && e.status === 'undone')
    .sort((a, b) => (Number(a.sequence) || 0) - (Number(b.sequence) || 0));

  // Helper to ensure state object
  const parseState = (st) => {
    if (!st) return null;
    if (typeof st === 'string') {
      try {
        return JSON.parse(st);
      } catch {
        return null;
      }
    }
    return st;
  };

  // Helper to serialize a full PickleballEngine snapshot string
  const makeSnapshot = (rallyState, logList) => {
    const s = parseState(rallyState) || {};
    return JSON.stringify({
      format: s.format || format,
      scores: Array.isArray(s.scores) ? [...s.scores] : [0, 0],
      servingTeam: s.servingTeam ?? 0,
      serverNumber: s.serverNumber ?? (format === 'doubles' ? 2 : 1),
      courtPositions: Array.isArray(s.courtPositions)
        ? JSON.parse(JSON.stringify(s.courtPositions))
        : JSON.parse(JSON.stringify(engine.courtPositions || [])),
      serverCourt: s.serverCourt || 'right',
      gameOver: Boolean(s.gameOver),
      winner: s.winner ?? null,
      teamPalettes: [...teamPalettes],
      teamNames: [...teamNames],
      teamKeys: [...teamKeys],
      log: (logList || []).map(formatLogEntry).filter(Boolean),
    });
  };

  // 2. Base initial state before rally 1 (undo boundary)
  const parsedInitial = parseState(session.initial_state);
  const initialState = parsedInitial || {
    format,
    scores: [0, 0],
    servingTeam: 0,
    serverNumber: format === 'doubles' ? 2 : 1,
    serverCourt: 'right',
    courtPositions: engine.courtPositions,
    gameOver: false,
    winner: null,
  };

  // Active states timeline: [initialState, state_after_event1, state_after_event2, ...]
  const states = [
    initialState,
    ...activeEvents.map((e) => parseState(e.state_after)),
  ];

  const activeLogs = activeEvents.map(formatLogEntry).filter(Boolean);

  // 3. Build history snapshots (all states prior to the current head)
  const history = [];
  for (let i = 0; i < states.length - 1; i++) {
    const logsUpToI = activeLogs.slice(0, i);
    history.push(makeSnapshot(states[i], logsUpToI));
  }

  // 4. Restore the current head state into the engine
  const currentHeadState = states[states.length - 1];
  const currentSnapshot = makeSnapshot(currentHeadState, activeLogs);
  engine.restoreSnapshot(currentSnapshot);
  engine.history = history;

  // 5. Build redoStack from undoneEvents:
  // Each snapshot contains activeLogs + cumulative slice of undoneEvents up to that index,
  // before reversing so top-of-stack (last item in array) is the oldest undone event.
  const redoSnapshots = undoneEvents.map((uEvent, idx) => {
    const cumulativeLogs = [
      ...activeLogs,
      ...undoneEvents.slice(0, idx + 1).map(formatLogEntry).filter(Boolean),
    ];
    return makeSnapshot(parseState(uEvent.state_after), cumulativeLogs);
  });

  // Reversing puts index 0 (oldest undone) at the end (.pop() target)
  engine.redoStack = redoSnapshots.reverse();
}
