'use client';

import { useState, useEffect, useCallback } from 'react';
import { Volume2, VolumeX, Headphones, Mic } from 'lucide-react';
import { formatMmSs } from '../../hooks/useMatchTimer';
import {
  read as readVoiceAudit,
  clear as clearVoiceAudit,
  toCsv as voiceAuditToCsv,
} from '../../lib/voiceParser';

export function MatchLog({
  open,
  entries = [],
  legacyEntries = [],
  format = 'doubles',
  teamNames = ['Team Omega', 'Team Alpha'],
  playerNames = null,
  onClose,
  voiceMicMode = 'open_mic',
  voiceMicModeSetting = 'auto',
  onSetMicModeSetting,
  voiceTtsEnabled = false,
  onSetTtsEnabled,
  ...rest
}) {
  const [voiceEntries, setVoiceEntries] = useState([]);

  const refreshVoiceAudit = useCallback(() => {
    setVoiceEntries(readVoiceAudit());
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    refreshVoiceAudit();
    if (typeof window === 'undefined') return undefined;
    window.addEventListener('pikolscore:voice-audit', refreshVoiceAudit);
    return () => window.removeEventListener('pikolscore:voice-audit', refreshVoiceAudit);
  }, [open, refreshVoiceAudit]);

  const handleExportVoiceCsv = () => {
    const current = readVoiceAudit();
    if (current.length === 0 || typeof window === 'undefined') return;
    const csv = voiceAuditToCsv(current);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `pikolscore-voice-audit-${dateStamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClearVoiceAudit = () => {
    clearVoiceAudit();
    setVoiceEntries([]);
  };

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

        {/* Voice Officiating Settings */}
        <div className="mb-4 rounded-xl border border-[#E2E5DC] bg-[#FAF9F5] p-3 text-xs text-[#203F39]">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold uppercase tracking-wider text-[11px] text-[#0F5C62] flex items-center gap-1.5">
              <Mic size={13} aria-hidden="true" />
              <span>Voice Officiating Settings</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[#EAF0E5] text-[#084B46]">
              Active: {voiceMicMode === 'headset' ? 'Headset (Quick)' : 'Open Mic (Strict)'}
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {/* 3-way Mic Profile Selector */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-[#748079]">Mic Profile:</span>
              <div className="inline-flex rounded-lg border border-[#E2E5DC] bg-[#FEFEFB] p-0.5">
                {[
                  { key: 'auto', label: 'Auto' },
                  { key: 'headset', label: 'Headset' },
                  { key: 'open_mic', label: 'Open Mic' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => onSetMicModeSetting?.(opt.key)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                      voiceMicModeSetting === opt.key
                        ? 'bg-[#0F5C62] text-[#FEECD6] shadow-xs'
                        : 'text-[#748079] hover:text-[#203F39]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* TTS Score Readback Toggle */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#E2E5DC]">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#203F39]">
                {voiceTtsEnabled ? (
                  <Volume2 size={13} className="text-[#0F5C62]" aria-hidden="true" />
                ) : (
                  <VolumeX size={13} className="text-[#748079]" aria-hidden="true" />
                )}
                <span>Score Readback (TTS)</span>
              </div>
              <button
                type="button"
                onClick={() => onSetTtsEnabled?.(!voiceTtsEnabled)}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                  voiceTtsEnabled
                    ? 'bg-[#0F5C62] text-[#FEECD6]'
                    : 'bg-[#E2E5DC] text-[#748079] hover:bg-[#D5D8CF]'
                }`}
              >
                {voiceTtsEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>

        {voiceEntries.length > 0 && (
          <div className="mb-4 flex items-center justify-between gap-2 rounded-xl border border-[#E2E5DC] bg-[#FAF9F5] p-2.5 text-xs text-[#203F39]">
            <span className="font-semibold text-[#084B46]">
              Voice log ({voiceEntries.length})
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleExportVoiceCsv}
                className="rounded-full bg-[#0F5C62] px-3 py-1 text-[11px] font-bold text-[#FEECD6] hover:bg-[#085953] transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F5C62]"
              >
                Export Voice CSV
              </button>
              <button
                type="button"
                onClick={handleClearVoiceAudit}
                className="rounded-full border border-[#E2E5DC] bg-[#FEFEFB] px-2.5 py-1 text-[11px] font-semibold text-[#748079] hover:bg-[#EAF0E5] hover:text-[#203F39] transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F5C62]"
              >
                Clear
              </button>
            </div>
          </div>
        )}

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
