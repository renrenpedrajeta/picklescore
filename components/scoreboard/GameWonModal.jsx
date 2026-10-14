'use client';

import { useEffect, useRef } from 'react';
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
  isDraw = false,
  isTimeExpired = false,
  title,
  detail,
  inert: inertProp,
}) {
  const overlayRef = useRef(null);
  const primaryBtnRef = useRef(null);

  // Apply HTML inert to background / sibling elements while modal is open
  useEffect(() => {
    if (!open) return;

    const overlay = overlayRef.current;
    if (!overlay) return;

    const previouslyFocused = document.activeElement;
    const modifiedElements = [];

    // Find all sibling elements at each ancestor level outside this modal overlay
    let current = overlay;
    while (
      current &&
      current.parentElement &&
      current.parentElement !== document.documentElement
    ) {
      const parent = current.parentElement;
      for (const child of parent.children) {
        if (child !== current && !child.contains(overlay)) {
          if (!child.hasAttribute('inert')) {
            child.setAttribute('inert', '');
            try {
              child.inert = true;
            } catch {
              // Ignore if not supported directly on property
            }
            modifiedElements.push(child);
          }
        }
      }
      current = parent;
    }

    // Auto-focus primary action inside the modal
    const focusTimer = setTimeout(() => {
      if (primaryBtnRef.current) {
        primaryBtnRef.current.focus();
      }
    }, 40);

    // Trap Escape key to exit modal
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);

      // Restore inert state on background elements
      modifiedElements.forEach((el) => {
        el.removeAttribute('inert');
        try {
          el.inert = false;
        } catch {
          // Ignore
        }
      });

      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        try {
          previouslyFocused.focus();
        } catch {
          // Ignore
        }
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  const resolvedWinner = winnerName || teamNames[0] || 'Team';
  const displayTitle =
    title ??
    (isDraw
      ? `MATCH TIED: ${scores[0]} – ${scores[1]}`
      : CONTENT.gameWonModal.title(resolvedWinner));

  const displayDetail =
    detail ??
    (isDraw
      ? 'Time expired · Match concluded in a draw'
      : isTimeExpired
      ? `Final Score: ${scores[0]} – ${scores[1]} (Time Expired)`
      : CONTENT.gameWonModal.finalScoreLabel(scores));

  return (
    <div
      ref={overlayRef}
      className="ps-modal-overlay"
      role="presentation"
      inert={Boolean(inertProp)}
    >
      <div className="ps-scrim" inert aria-hidden="true" />
      <div
        className="ps-victory-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="victory-modal-title"
      >
        {/* "X" button for exiting out of the modal */}
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

        {/* Action buttons: "New Match" and "Undo" or "Review Scoreboard" */}
        <div className="ps-victory-actions">
          <button
            ref={primaryBtnRef}
            type="button"
            className="ps-victory-btn-primary"
            onClick={onNewMatch}
          >
            <RotateCcw size={18} aria-hidden="true" />
            <span>{CONTENT.gameWonModal.newMatchButton}</span>
          </button>

          {canUndo && onUndo ? (
            <button
              type="button"
              className="ps-victory-btn-secondary"
              onClick={onUndo}
            >
              <Undo2 size={16} aria-hidden="true" />
              <span>{CONTENT.gameWonModal.undoButton}</span>
            </button>
          ) : onClose ? (
            <button
              type="button"
              className="ps-victory-btn-secondary"
              onClick={onClose}
            >
              <span>{CONTENT.gameWonModal.reviewButton || 'Review Scoreboard'}</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default GameWonModal;
