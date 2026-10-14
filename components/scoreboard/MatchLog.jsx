'use client';

import { formatMmSs } from '../../hooks/useMatchTimer';

export function MatchLog({ open, entries = [], legacyEntries = [], onClose, ...rest }) {
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
