'use client';

import { formatMmSs } from '../../hooks/useMatchTimer';

export function MatchLog({ open, entries = [], onClose, ...rest }) {
  if (!open) return null;

  const reversed = [...entries].reverse();

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
        <ol className="ps-log-list">
          {reversed.length === 0 ? (
            <li className="ps-log-empty">No points yet.</li>
          ) : (
            reversed.map((item, idx) => (
              <li key={`${entries.length - 1 - idx}-${item.elapsed ?? item.e ?? 0}`} className="ps-log-item">
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
