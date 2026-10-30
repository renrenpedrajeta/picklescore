'use client';

import { useRef, useEffect, useLayoutEffect } from 'react';
import FlipDigit from './FlipDigit';

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function CallRow({ servingTeamKey, servingTeamName, serverNumber, format = 'doubles' }) {
  const flapNameRef = useRef(null);
  const prevNameRef = useRef(undefined);
  const upperName = String(servingTeamName || 'TEAM OMEGA').toUpperCase();

  useIsoLayoutEffect(() => {
    const fn = flapNameRef.current;
    if (!fn) return;

    const old = prevNameRef.current;
    if (old === upperName) return;
    prevNameRef.current = upperName;

    if (typeof fn.getAnimations === 'function') {
      fn.getAnimations().forEach((a) => a.cancel());
    }

    const calm =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (old === undefined || calm || typeof fn.animate !== 'function') {
      fn.textContent = upperName;
      return;
    }

    fn.textContent = old;
    const foldAnim = fn.animate(
      [{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(-90deg)' }],
      { duration: 200, easing: 'ease-in', fill: 'forwards' }
    );
    foldAnim.onfinish = () => {
      fn.textContent = upperName;
      foldAnim.cancel();
      fn.animate(
        [{ transform: 'rotateX(90deg)' }, { transform: 'rotateX(0deg)' }],
        { duration: 200, easing: 'ease-out' }
      );
    };
  }, [upperName]);

  return (
    <div className="ps-callrow">
      <div className="ps-flap" data-team={servingTeamKey}>
        <span ref={flapNameRef} className="ps-flap-name">
          {upperName}
        </span>
      </div>
      {format !== 'singles' && (
        <div className="ps-srv" data-team={servingTeamKey}>
          <span className="ps-srv-label">SERVER</span>
          <FlipDigit value={serverNumber ?? 1} className="ps-fd-sm" />
        </div>
      )}
    </div>
  );
}

export default CallRow;
