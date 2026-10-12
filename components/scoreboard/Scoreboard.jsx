'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useScoreboard } from '../../hooks/useScoreboard';
import { useMatchTimer } from '../../hooks/useMatchTimer';
import Header from '../layout/Header';
import ConsoleFooter from '../layout/ConsoleFooter';
import ControlBar from './ControlBar';
import TeamPanel from './TeamPanel';
import CallRow from './CallRow';
import MatchLog from './MatchLog';
import GameWonModal from './GameWonModal';
import { supabase } from '@/config/supabase';

export function Scoreboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [logOpen, setLogOpen] = useState(false);
  const [gameWonModalOpen, setGameWonModalOpen] = useState(false);

  useEffect(() => {
    async function loadUserProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          if (
            typeof window !== 'undefined' &&
            new URLSearchParams(window.location.search).get('demo') === '1'
          ) {
            return;
          }
          router.replace('/auth/login');
          return;
        }
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
        // Ignore auth errors when offline
      }
    }
    loadUserProfile();
  }, [router]);

  const timer = useMatchTimer();

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
    point,
    fault,
    undo,
    redo,
    reset,
  } = useScoreboard({
    elapsedSeconds: timer.elapsedSeconds,
    onEscape: handleEscape,
  });

  // Automatically pause timer and trigger GameWonModal when a team wins
  useEffect(() => {
    if (state?.gameOver) {
      timer.pause();
      setGameWonModalOpen(true);
    } else {
      setGameWonModalOpen(false);
    }
  }, [state?.gameOver]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNewMatch = useCallback(() => {
    reset();
    timer.reset();
    setGameWonModalOpen(false);
  }, [reset, timer]);

  const handleUndoWinningPoint = useCallback(() => {
    undo();
    setGameWonModalOpen(false);
  }, [undo]);

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
      <Header
        onOpenLog={() => setLogOpen(true)}
        profile={profile}
        userEmail={userEmail}
      />

      <main className="ps-main">
        <ControlBar
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          formattedTime={timer.formattedTime}
          timerLabel={timer.label}
          onToggleTimer={timer.toggle}
        />

        {state?.gameOver && !gameWonModalOpen && (
          <button
            type="button"
            className="ps-victory-reopen-bar"
            onClick={() => setGameWonModalOpen(true)}
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
            onPoint={point}
            onFault={fault}
          />
          <TeamPanel
            teamKey={teamKeys[1]}
            teamName={teamNames[1]}
            score={scores[1]}
            isServing={servingTeam === 1}
            onPoint={point}
            onFault={fault}
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

      <ConsoleFooter />

      <MatchLog
        open={logOpen}
        entries={log}
        onClose={handleCloseLog}
      />

      <GameWonModal
        open={gameWonModalOpen}
        winnerName={state?.winnerName}
        scores={scores}
        teamNames={teamNames}
        canUndo={canUndo}
        onNewMatch={handleNewMatch}
        onUndo={handleUndoWinningPoint}
        onClose={handleCloseGameWon}
      />
    </div>
  );
}

export default Scoreboard;
