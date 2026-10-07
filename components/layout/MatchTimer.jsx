export function MatchTimer({
  remainingMs = 0,
  durationMs = 30 * 60 * 1000,
  status = 'idle',
  isWarning = false,
}) {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progress =
    durationMs > 0 ? Math.min(1, Math.max(0, (durationMs - remainingMs) / durationMs)) : 0;

  let stateClass = 'is-idle';
  if (status === 'expired') {
    stateClass = 'is-expired';
  } else if (isWarning && status === 'running') {
    stateClass = 'is-warning';
  } else if (status === 'paused') {
    stateClass = 'is-paused';
  } else if (status === 'running') {
    stateClass = 'is-running';
  }

  return (
    <div
      className={`match-timer ${stateClass}`}
      role="timer"
      aria-label={`Time remaining ${minutes} minutes ${seconds} seconds`}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="timer-clock-icon"
      >
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15 14" />
      </svg>

      <span className="timer-digits">{formattedTime}</span>

      <div
        className="match-timer-progress"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}

export default MatchTimer;
