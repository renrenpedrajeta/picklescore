'use client';

import { Mic, MicOff } from 'lucide-react';

export function ControlBar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  formattedTime,
  timerLabel,
  onToggleTimer,
  voiceSupported = false,
  voiceActive = false,
  voicePill = null,
  onToggleVoice,
  isGuest = false,
  isTimeExpired = false,
}) {
  const handleUndo = () => {
    if (!canUndo) return;
    onUndo?.();
  };

  const handleRedo = () => {
    if (!canRedo) return;
    onRedo?.();
  };

  const micDisabled = Boolean(isGuest || !voiceSupported || isTimeExpired);
  const micTooltip = isGuest
    ? 'Voice scoring disabled in Spectator Mode'
    : !voiceSupported
    ? 'Voice scoring is not supported in this browser'
    : isTimeExpired
    ? 'Match time expired'
    : voiceActive
    ? 'Voice scoring ON — click to stop listening'
    : 'Enable hands-free voice scoring';

  const handleVoiceClick = () => {
    if (micDisabled) return;
    onToggleVoice?.();
  };

  return (
    <div className="relative self-center w-[min(100%,700px)] flex-none">
      <div className="ps-bar w-full">
        <button
          type="button"
          className="ps-bar-btn"
          aria-disabled={canUndo ? 'false' : 'true'}
          onClick={handleUndo}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 14l-4-4 4-4" />
            <path d="M5 10h11a4 4 0 1 1 0 8h-1" />
          </svg>
          <span>Undo</span>
        </button>

        <button
          type="button"
          className="ps-bar-btn ps-timer-btn max-sm:!w-[152px]"
          onClick={onToggleTimer}
        >
          <span className="ps-tm">{formattedTime}</span>
          <span className="ps-tl">{timerLabel}</span>
        </button>

        <button
          type="button"
          className="ps-bar-btn"
          aria-disabled={canRedo ? 'false' : 'true'}
          onClick={handleRedo}
        >
          <span>Redo</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 14l4-4-4-4" />
            <path d="M19 10H8a4 4 0 1 0 0 8h1" />
          </svg>
        </button>

        <button
          type="button"
          onClick={handleVoiceClick}
          disabled={micDisabled}
          aria-disabled={micDisabled ? 'true' : 'false'}
          aria-pressed={voiceActive}
          aria-label={voiceActive ? 'Voice scoring active, stop listening' : 'Start voice scoring'}
          title={micTooltip}
          className={`flex-1 flex items-center justify-center gap-2 border-0 border-l-[1.5px] border-[#E2E5DC] px-3 sm:px-4 min-h-[48px] font-bold text-[14px] sm:text-[17px] select-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#0F5C62] ${
            micDisabled
              ? 'bg-transparent text-[#748079] opacity-60 cursor-not-allowed'
              : voiceActive
              ? 'bg-[#0F5C62] text-[#FEECD6] hover:bg-[#085953] active:translate-y-[1px] cursor-pointer'
              : 'bg-transparent text-[#203F39] hover:bg-[#EAF0E5] active:translate-y-[1px] cursor-pointer'
          }`}
        >
          {voiceActive ? (
            <>
              <span
                className="h-2 w-2 rounded-full bg-[#FEECD6] animate-pulse shrink-0"
                aria-hidden="true"
              />
              <Mic size={19} className="shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Mic On</span>
            </>
          ) : (
            <>
              <MicOff size={19} className="shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Mic</span>
            </>
          )}
        </button>
      </div>

      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={`pointer-events-none absolute right-2 top-full z-20 mt-1 transition-opacity duration-150 ${
          voicePill ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {voicePill && (
          <span className="inline-flex items-center rounded-full border border-[#0F5C62]/30 bg-[#FEECD6] px-3 py-0.5 text-xs font-bold tracking-wide text-[#084B46] shadow-sm">
            {voicePill}
          </span>
        )}
      </div>
    </div>
  );
}

export default ControlBar;
