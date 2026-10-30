'use client';

import { formatMmSs } from '../../hooks/useMatchTimer';

export function MatchLog({
  open,
  entries = [],
  legacyEntries = [],
  format = 'doubles',
  teamNames = ['Team Omega', 'Team Alpha'],
  playerNames = null,
  onClose,
  ...rest
}) {
  if (!open) return null;

  const reversed = [...entries].reverse();
  const reversedLegacy = [...legacyEntries].reverse();

  return (
    <>
      <div className="ps-scrim" onClick={onClose} aria-hidden="true" />
      <aside className="ps-log-aside" aria-label="Match log" {...rest}>
        <div className="ps-log-header">
          <span>Match log</span>
          <button type="button" className="ps-pill" onClick={onClose}>
            Close
          </button>
        </div>

        {/* Match Roster: Historical Participant Truth */}
        <div className="mb-4 rounded-xl bg-[#EAF0E5] border border-[#E2E5DC] p-3 text-xs text-[#203F39]">
          <div className="font-bold uppercase tracking-wider text-[11px] text-[#0F5C62] mb-1">
            {format === 'singles' ? 'Singles Match Lineup' : 'Doubles Match Lineup'}
          </div>
          {format === 'singles' ? (
            <div className="font-medium text-[#084B46]">
              <span>{teamNames[0] || 'Player 1'}</span>
              <span className="text-[#748079] mx-1.5">vs</span>
              <span>{teamNames[1] || 'Player 2'}</span>
            </div>
          ) : (
            <div className="flex flex-col gap-1 text-[12px]">
              <div>
                <span className="font-semibold text-[#084B46]">{teamNames[0] || 'Team Omega'}:</span>{' '}
                <span className="text-[#203F39]">{playerNames?.team0?.filter(Boolean).join(' & ') || 'Player 1 & Player 2'}</span>
              </div>
              <div>
                <span className="font-semibold text-[#084B46]">{teamNames[1] || 'Team Alpha'}:</span>{' '}
                <span className="text-[#203F39]">{playerNames?.team1?.filter(Boolean).join(' & ') || 'Player 3 & Player 4'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Legacy imported entries notice & list */}
        {reversedLegacy.length > 0 && (
          <div className="ps-legacy-log-section">
            <div className="ps-legacy-log-badge">
              <span>Imported local log (read-only)</span>
            </div>
            <ol className="ps-log-list ps-legacy-log-list">
              {reversedLegacy.map((item, idx) => (
                <li
                  key={`legacy-${idx}-${item.elapsed ?? item.e ?? 0}`}
                  className="ps-log-item ps-log-item-legacy"
                >
                  <b>{formatMmSs(item.elapsed ?? item.e ?? 0)}</b>
                  <div>{item.message ?? item.m}</div>
                  <span>{item.call ?? item.sc}</span>
                </li>
              ))}
            </ol>
            <div className="ps-legacy-divider" />
          </div>
        )}

        <ol className="ps-log-list">
          {reversed.length === 0 && reversedLegacy.length === 0 ? (
            <li className="ps-log-empty">No points yet.</li>
          ) : (
            reversed.map((item, idx) => (
              <li
                key={`${entries.length - 1 - idx}-${item.elapsed ?? item.e ?? 0}`}
                className="ps-log-item"
              >
                <b>{formatMmSs(item.elapsed ?? item.e ?? 0)}</b>
                <div>{item.message ?? item.m}</div>
                <span>{item.call ?? item.sc}</span>
              </li>
            ))
          )}
        </ol>
      </aside>
    </>
  );
}

export default MatchLog;
