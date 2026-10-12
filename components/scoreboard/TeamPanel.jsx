'use client';

import { useRef, useEffect, useLayoutEffect } from 'react';
import FlipDigit from './FlipDigit';

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function TeamPanel({
  teamKey,
  teamName,
  score,
  isServing,
  onPoint,
  onFault,
}) {
  const panelRef = useRef(null);
  const prevServingRef = useRef(isServing);
  const beforeRectRef = useRef(null);

  // Capture bounding rect during render right before DOM updates data-serving/order
  if (panelRef.current && prevServingRef.current !== isServing) {
    beforeRectRef.current = panelRef.current.getBoundingClientRect();
  }

  useIsoLayoutEffect(() => {
    const el = panelRef.current;
    if (!el) return;

    if (prevServingRef.current !== isServing) {
      prevServingRef.current = isServing;
      const before = beforeRectRef.current;
      beforeRectRef.current = null;

      const calm =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (before && !calm && typeof el.animate === 'function') {
        const after = el.getBoundingClientRect();
        const dx = before.left - after.left;
        const dy = before.top - after.top;
        if (dx !== 0 || dy !== 0) {
          el.animate(
            [
              { transform: `translate(${dx}px, ${dy}px)` },
              { transform: 'translate(0, 0)' },
            ],
            { duration: 350, easing: 'ease-out' }
          );
        }
      }
    }
  }, [isServing]);

  const paddedScore = String(score ?? 0).padStart(2, '0');
  const tens = paddedScore[0];
  const units = paddedScore[1];

  const roleText = isServing ? 'serving' : 'receiving';
  const hintText = isServing ? 'Tap: point won' : 'Tap: fault';
  const ariaLabel = `${teamName}, ${roleText}, score ${score}. ${
    isServing ? 'Activate for a point.' : 'Activate for a fault.'
  }`;

  const handleActivate = () => {
    if (isServing) {
      onPoint?.();
    } else {
      onFault?.();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      handleActivate();
    }
  };

  return (
    <div
      ref={panelRef}
      className="ps-team"
      role="button"
      tabIndex={0}
      data-team={teamKey}
      data-serving={isServing ? 'true' : 'false'}
      aria-label={ariaLabel}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
    >
      <div className="ps-chip">
        <span className="ps-chip-name">
          {teamName}
          <small className="ps-role">{roleText}</small>
        </span>
      </div>
      <div className="ps-pair">
        <FlipDigit value={tens} />
        <FlipDigit value={units} />
      </div>
      <div className="ps-hint">{hintText}</div>
    </div>
  );
}

export default TeamPanel;
