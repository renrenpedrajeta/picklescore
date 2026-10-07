import { CONTENT } from '../../config/content';

export function GameWonModal({ open, winnerName, scores, onNewMatch }) {
  if (!open) return null;

  return (
    <div className="game-won-overlay">
      <div className="game-won-dialog">
        <h2>{CONTENT.gameWonModal.title(winnerName)}</h2>
        <p>{CONTENT.gameWonModal.finalScoreLabel(scores)}</p>
        <button className="btn-new-game" onClick={onNewMatch}>
          {CONTENT.gameWonModal.newMatchButton}
        </button>
      </div>
    </div>
  );
}

export default GameWonModal;
