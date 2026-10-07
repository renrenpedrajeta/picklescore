import { CONTENT } from '../../config/content';

function UndoIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="6" y="4" width="3.5" height="16" rx="1" />
      <rect x="14.5" y="4" width="3.5" height="16" rx="1" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="6 4 20 12 6 20 6 4" />
    </svg>
  );
}

export function ActionControls({
  canUndo,
  disabled,
  onUndo,
  onPoint,
  onFault,
  timerStatus = 'idle',
  onTogglePause,
  labels = CONTENT.actions,
}) {
  let pauseLabel = labels.startLabel || 'START';
  let PauseSvg = PlayIcon;
  let pauseDisabled = false;
  let isResume = false;
  let pauseTitle = 'Start match (P)';

  if (timerStatus === 'running') {
    pauseLabel = labels.pauseLabel || 'PAUSE';
    PauseSvg = PauseIcon;
    pauseTitle = 'Pause match (P)';
  } else if (timerStatus === 'paused') {
    pauseLabel = labels.resumeLabel || 'RESUME';
    PauseSvg = PlayIcon;
    isResume = true;
    pauseTitle = 'Resume match (P)';
  } else if (timerStatus === 'expired') {
    pauseLabel = labels.pauseLabel || 'PAUSE';
    PauseSvg = PauseIcon;
    pauseDisabled = true;
    pauseTitle = 'Match time expired';
  }

  return (
    <div className="action-column">
      {/* Top Row: Pause & Undo Buttons */}
      <div className="action-top-row">
        <button
          className={`btn-action-top btn-pause ${isResume ? 'is-resume' : ''}`}
          onClick={onTogglePause}
          disabled={pauseDisabled}
          title={pauseTitle}
          aria-keyshortcuts="p"
        >
          <PauseSvg />
          <span>{pauseLabel}</span>
        </button>

        <button
          className="btn-action-top btn-undo-header"
          onClick={onUndo}
          disabled={!canUndo}
          title={labels.undoTitle || 'Undo last rally (Z)'}
          aria-keyshortcuts="z"
        >
          <UndoIcon />
          <span>{labels.undoLabel || 'UNDO'}</span>
        </button>
      </div>

      {/* Action Buttons Wrapper */}
      <div className="action-buttons-wrapper">
        {/* Giant POINT WON Button */}
        <button className="btn-point-won" onClick={onPoint} disabled={disabled}>
          <div className="icon-circle-yellow">+</div>
          <span className="btn-title-white">{labels.pointWonLabel}</span>
        </button>

        {/* Giant FAULT Button */}
        <button className="btn-fault" onClick={onFault} disabled={disabled}>
          <div className="icon-circle-sage">⚑</div>
          <span className="btn-title-teal">{labels.faultLabel}</span>
        </button>
      </div>
    </div>
  );
}

export default ActionControls;
