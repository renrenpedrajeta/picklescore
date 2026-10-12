'use client';

import { Trophy, RotateCcw, Undo2, X } from 'lucide-react';
import { CONTENT } from '../../config/content';

export function GameWonModal({
  open,
  winnerName,
  scores = [0, 0],
  teamNames = ['Team Omega', 'Team Alpha'],
  onNewMatch,
  onUndo,
  onClose,
  canUndo = true,
  title,
  detail,
}) {
  if (!open) return null;

  const resolvedWinner = winnerName || teamNames[0] || 'Team';
  const displayTitle = title ?? CONTENT.gameWonModal.title(resolvedWinner);
  const displayDetail = detail ?? CONTENT.gameWonModal.finalScoreLabel(scores);

  return (
    <div className="ps-modal-overlay" role="presentation">
      <div className="ps-scrim" onClick={onClose} aria-hidden="true" />
      <div
        className="ps-victory-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="victory-modal-title"
      >
        <button
          type="button"
          className="ps-modal-close-btn"
          onClick={onClose}
          aria-label="Dismiss and review scoreboard"
          title="Review scoreboard"
        >
          <X size={18} aria-hidden="true" />
        </button>

        <div className="ps-victory-trophy-wrap">
          <div className="ps-victory-trophy-glow" />
          <Trophy className="ps-victory-trophy" size={38} strokeWidth={2.2} />
        </div>

        <h2 id="victory-modal-title" className="ps-victory-title">
          {displayTitle}
        </h2>

        <div className="ps-victory-scoreboard">
          <div className="ps-victory-team-box">
            <span className="ps-victory-team-name">{teamNames[0]}</span>
            <span className="ps-victory-team-score">{scores[0]}</span>
          </div>
          <div className="ps-victory-score-divider">–</div>
          <div className="ps-victory-team-box">
            <span className="ps-victory-team-name">{teamNames[1]}</span>
            <span className="ps-victory-team-score">{scores[1]}</span>
          </div>
        </div>

        <p className="ps-victory-detail">{displayDetail}</p>

        <div className="ps-victory-actions">
          <button
            type="button"
            className="ps-victory-btn-primary"
            onClick={onNewMatch}
          >
            <RotateCcw size={18} aria-hidden="true" />
            <span>{CONTENT.gameWonModal.newMatchButton}</span>
          </button>

          {canUndo && onUndo && (
            <button
              type="button"
              className="ps-victory-btn-secondary"
              onClick={onUndo}
            >
              <Undo2 size={16} aria-hidden="true" />
              <span>{CONTENT.gameWonModal.undoButton}</span>
            </button>
          )}

          <button
            type="button"
            className="ps-victory-btn-tertiary"
            onClick={onClose}
          >
            {CONTENT.gameWonModal.reviewButton}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameWonModal;
