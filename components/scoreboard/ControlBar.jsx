'use client';

export function ControlBar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  formattedTime,
  timerLabel,
  onToggleTimer,
}) {
  const handleUndo = () => {
    if (!canUndo) return;
    onUndo?.();
  };

  const handleRedo = () => {
    if (!canRedo) return;
    onRedo?.();
  };

  return (
    <div className="ps-bar">
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
        className="ps-bar-btn ps-timer-btn"
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
    </div>
  );
}

export default ControlBar;
