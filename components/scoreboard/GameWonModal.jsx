import { CONTENT } from '../../config/content';

export function GameWonModal({
  open,
  winnerName,
  scores,
  onNewMatch,
  title,
  detail,
}) {
  if (!open) return null;

  const displayTitle = title ?? CONTENT.gameWonModal.title(winnerName);
  const displayDetail = detail ?? CONTENT.gameWonModal.finalScoreLabel(scores);

  return (
    <div className="game-won-overlay">
      <div className="game-won-dialog">
        <h2>{displayTitle}</h2>
        <p>{displayDetail}</p>
        <button className="btn-new-game" onClick={onNewMatch}>
          {CONTENT.gameWonModal.newMatchButton}
        </button>
      </div>
    </div>
  );
}

export default GameWonModal;
