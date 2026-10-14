'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, AlertTriangle, X } from 'lucide-react';
import { useScoreboard } from '../../hooks/useScoreboard';
import { useMatchTimer } from '../../hooks/useMatchTimer';
import { useMatchSync } from '../../hooks/useMatchSync';
import Header from '../layout/Header';
import ConsoleFooter from '../layout/ConsoleFooter';
import ControlBar from './ControlBar';
import TeamPanel from './TeamPanel';
import CallRow from './CallRow';
import MatchLog from './MatchLog';
import GameWonModal from './GameWonModal';
import { supabase } from '@/config/supabase';
import { PickleballEngine } from '@/lib/engine';
import { getSynth } from '@/lib/audio';

export function Scoreboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [logOpen, setLogOpen] = useState(false);
  const [gameWonModalOpen, setGameWonModalOpen] = useState(false);
  const [isTimeExpired, setIsTimeExpired] = useState(false);

  // 1. Detect Guest State (isGuest)
  const [isGuest, setIsGuest] = useState(() => {
    if (typeof window !== 'undefined') {
      const search = new URLSearchParams(window.location.search);
      return search.get('demo') === '1';
    }
    return false;
  });

  const engineRef = useRef(null);
  if (!engineRef.current) {
    engineRef.current = new PickleballEngine({ format: 'doubles' });
  }

  // Cloud sync coordinator hook
  const sync = useMatchSync({
    engineRef,
    isGuest,
  });

  useEffect(() => {
    async function checkAuthAndProfile() {
      try {
        const isDemo =
          typeof window !== 'undefined' &&
          new URLSearchParams(window.location.search).get('demo') === '1';

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (isDemo || !session?.user) {
          setIsGuest(true);
          return;
        }

        setIsGuest(false);
        const user = session.user;
        setUserEmail(user.email || null);
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (data) {
          setProfile(data);
        }
      } catch {
        // Fallback to guest if offline or session unavailable
        setIsGuest(true);
      }
    }
    checkAuthAndProfile();
  }, [router]);

  const handleTimerExpireRef = useRef(null);

  const timer = useMatchTimer({
    onExpire: () => handleTimerExpireRef.current?.(),
    sync,
  });

  const handleCloseLog = useCallback(() => {
    setLogOpen(false);
  }, []);

  const handleCloseGameWon = useCallback(() => {
    setGameWonModalOpen(false);
  }, []);

  const handleEscape = useCallback(() => {
    if (gameWonModalOpen) {
      setGameWonModalOpen(false);
    } else if (logOpen) {
      setLogOpen(false);
    }
  }, [gameWonModalOpen, logOpen]);

  const {
    state,
    canUndo,
    canRedo,
    log,
    gameOver,
    winnerName,
    isDraw,
    point,
    fault,
    undo,
    redo,
    reset,
    timeExpired,
  } = useScoreboard({
    elapsedSeconds: timer.elapsedSeconds,
    onEscape: handleEscape,
    isGuest,
    sync,
    engineRef,
  });

  // Handler for when match countdown timer reaches 00:00
  handleTimerExpireRef.current = () => {
    if (state?.gameOver) return;
    setIsTimeExpired(true);
    const res = timeExpired?.();
    if (res?.isDraw) {
      // Time-up buzzer already played by useMatchTimer
    } else {
      setTimeout(() => {
        getSynth()?.gameWon();
      }, 500);
    }
    setGameWonModalOpen(true);
  };

  // Automatically pause timer and trigger GameWonModal when a team wins
  useEffect(() => {
    if (state?.gameOver) {
      timer.pause();
      setGameWonModalOpen(true);
    } else {
      setGameWonModalOpen(false);
    }
  }, [state?.gameOver]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-initialize cloud session only after discovery completes and none is found
  useEffect(() => {
    if (
      sync?.isEnabled &&
      !sync.isLoadingSession &&
      !sync.sessionId &&
      engineRef.current &&
      !isGuest &&
      profile
    ) {
      timer.start();
      sync.createSession(engineRef.current, timer.durationMs, true);
    }
  }, [sync?.isEnabled, sync?.isLoadingSession, sync?.sessionId, isGuest, profile, timer.durationMs]);

  // Score & control guards for Guest Mode
  const handleNewMatch = useCallback(async () => {
    if (isGuest) return;

    setIsTimeExpired(false);
    if (sync?.isEnabled && sync.sessionId) {
      const isCompleted = state?.gameOver;
      await sync.closeSession(isCompleted ? 'completed' : 'abandoned');
      reset();
      timer.reset();
      timer.start();
      setGameWonModalOpen(false);
      if (engineRef.current) {
        await sync.createSession(engineRef.current, timer.durationMs, true);
      }
    } else {
      reset();
      timer.reset();
      timer.start();
      setGameWonModalOpen(false);
    }
  }, [isGuest, reset, timer, sync, state?.gameOver]);

  const handleUndoWinningPoint = useCallback(() => {
    if (isGuest) return;
    undo();
    setGameWonModalOpen(false);
  }, [isGuest, undo]);

  const handlePoint = useCallback(() => {
    if (isGuest) return;
    point();
  }, [isGuest, point]);

  const handleFault = useCallback(() => {
    if (isGuest) return;
    fault();
  }, [isGuest, fault]);

  const handleUndo = useCallback(() => {
    if (isGuest) return;
    undo();
  }, [isGuest, undo]);

  const handleRedo = useCallback(() => {
    if (isGuest) return;
    redo();
  }, [isGuest, redo]);

  const handleToggleTimer = useCallback(() => {
    if (isGuest) return;
    timer.toggle();
  }, [isGuest, timer]);

  const teamKeys = state?.teamKeys || ['omega', 'alpha'];
  const teamNames = state?.teamNames || ['Team Omega', 'Team Alpha'];
  const scores = state?.scores || [0, 0];
  const servingTeam = state?.servingTeam ?? 0;
  const servingTeamKey = state?.servingTeamKey || teamKeys[servingTeam];
  const servingTeamName = state?.servingTeamName || teamNames[servingTeam];
  const serverNumber = state?.serverNumber ?? 2;
  const liveAnnouncement =
    state?.liveAnnouncement ||
    `${servingTeamName} serving. ${scores[servingTeam]}, ${scores[1 - servingTeam]}, ${serverNumber}.`;

  return (
    <div className="ps-shell">
      {/* 1. Subtle Spectator Mode Top Banner */}
      {isGuest && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-center gap-2 bg-[#FAF9F5] border-b border-[#E2E5DC] px-4 py-2 text-center text-[13px] font-semibold text-[#084B46] tracking-wide"
        >
          <Eye size={15} className="text-[#0F5C62] shrink-0" aria-hidden="true" />
          <span>Spectator Mode (Read-Only) — Sign out to log in as an official umpire.</span>
        </div>
      )}

      {/* 2. Version Conflict / Sync Alert Toast */}
      {sync?.toastMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-center justify-between gap-3 bg-[#FEECD6] border-b border-[#E2E5DC] px-4 py-2 text-[13px] font-medium text-[#203F39]"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-[#BA1A1A] shrink-0" aria-hidden="true" />
            <span>{sync.toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={sync.clearToast}
            className="p-1 text-[#748079] hover:text-[#203F39] rounded"
            aria-label="Dismiss alert"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* 3. Header remains outside the disabled/inert wrapper */}
      <Header
        onOpenLog={() => !isGuest && setLogOpen(true)}
        profile={profile}
        userEmail={userEmail}
        isGuest={isGuest}
        syncStatus={sync?.syncStatus}
        pendingCount={sync?.pendingCount}
        isCloudSync={sync?.isEnabled}
        inert={gameWonModalOpen || undefined}
      />

      {/* 4. Main scoreboard & game controls put behind glass for guests */}
      <div
        inert={isGuest || undefined}
        className={`flex-1 flex flex-col min-h-0 ${isGuest ? 'pointer-events-none select-none' : ''}`}
      >
        <main
          className="ps-main"
          inert={gameWonModalOpen || undefined}
        >
          <ControlBar
            canUndo={!isGuest && canUndo}
            canRedo={!isGuest && canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
            formattedTime={timer.formattedTime}
            timerLabel={timer.label}
            onToggleTimer={handleToggleTimer}
          />

          {state?.gameOver && !gameWonModalOpen && (
            <button
              type="button"
              className="ps-victory-reopen-bar"
              onClick={() => !isGuest && setGameWonModalOpen(true)}
              disabled={isGuest}
            >
              <span>🏆 Match won by {state.winnerName}! Tap to view summary or start new match</span>
            </button>
          )}

          <div className="ps-teams">
            <TeamPanel
              teamKey={teamKeys[0]}
              teamName={teamNames[0]}
              score={scores[0]}
              isServing={servingTeam === 0}
              onPoint={handlePoint}
              onFault={handleFault}
            />
            <TeamPanel
              teamKey={teamKeys[1]}
              teamName={teamNames[1]}
              score={scores[1]}
              isServing={servingTeam === 1}
              onPoint={handlePoint}
              onFault={handleFault}
            />
          </div>

          <CallRow
            servingTeamKey={servingTeamKey}
            servingTeamName={servingTeamName}
            serverNumber={serverNumber}
          />

          <div className="ps-sr" aria-live="polite">
            {liveAnnouncement}
          </div>
        </main>

        <ConsoleFooter inert={gameWonModalOpen || undefined} />

        <MatchLog
          open={logOpen}
          entries={log}
          legacyEntries={sync?.legacyLog || []}
          onClose={handleCloseLog}
          inert={gameWonModalOpen || undefined}
        />

        <GameWonModal
          open={gameWonModalOpen}
          winnerName={state?.winnerName}
          scores={scores}
          teamNames={teamNames}
          canUndo={canUndo && !isTimeExpired}
          isDraw={Boolean(state?.isDraw)}
          isTimeExpired={isTimeExpired}
          onNewMatch={handleNewMatch}
          onUndo={handleUndoWinningPoint}
          onClose={handleCloseGameWon}
        />
      </div>
    </div>
  );
}

export default Scoreboard;
