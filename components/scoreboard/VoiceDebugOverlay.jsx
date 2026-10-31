'use client';

import { PILL_LABELS } from '../../hooks/useVoiceScoring';

export function VoiceDebugOverlay({ heard }) {
  if (!heard || !heard.text) return null;

  const isFinal = Boolean(heard.isFinal);
  const isAccepted = heard.outcome === 'accepted';
  const outcomeLabel = PILL_LABELS[heard.outcome] || heard.outcome || 'Evaluated';

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[55] pointer-events-none flex items-center justify-center p-4 transition-opacity duration-150 animate-in fade-in"
    >
      {/* Blurred background scrim */}
      <div className="absolute inset-0 bg-[#203F39]/35 backdrop-blur-md" />

      {/* Centered ivory card */}
      <div className="relative max-w-lg w-full bg-[#FEFEFB] border-[1.5px] border-[#E2E5DC] rounded-3xl p-6 sm:p-7 shadow-[0_24px_48px_-12px_rgba(8,75,70,0.3)] flex flex-col items-center text-center gap-3">
        {!isFinal ? (
          <>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#0F5C62] animate-pulse shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#748079]">
                Listening…
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-medium italic text-[#748079] break-words max-h-36 overflow-y-auto px-2">
              “{heard.text}”
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {isAccepted ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F5C62] text-[#FEECD6] text-xs font-extrabold uppercase tracking-wider shadow-sm">
                  <span>✓</span>
                  <span>
                    {heard.command ? heard.command.toUpperCase() : 'ACCEPTED'}
                    {heard.reason ? ` · ${heard.reason}` : ''}
                  </span>
                </span>
              ) : heard.outcome === 'armed' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#084B46] text-[#FEECD6] text-xs font-extrabold uppercase tracking-wider shadow-sm animate-pulse">
                  <span>ARMED: SAY REASON</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEECD6] border border-[#E2E5DC] text-[#084B46] text-xs font-bold tracking-wide shadow-sm">
                  <span>{outcomeLabel}</span>
                </span>
              )}
              <span className="text-[11px] font-mono text-[#748079] px-2 py-0.5 rounded-md bg-[#FAF9F5] border border-[#E2E5DC]">
                {heard.confidence > 0 ? `conf ${heard.confidence.toFixed(2)}` : 'conf n/a'}
              </span>
            </div>

            <div className="text-2xl sm:text-4xl font-extrabold text-[#084B46] tracking-tight break-words max-h-40 overflow-y-auto px-2">
              “{heard.text}”
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default VoiceDebugOverlay;
