'use client';

import { useEffect, useCallback } from 'react';
import { useScoreboard } from '../hooks/useScoreboard';
import { useMatchTimer, MATCH_DURATION_MS } from '../hooks/useMatchTimer';
import { CONTENT } from '../config/content';
import ConsoleHeader from '../components/layout/ConsoleHeader';
import ConsoleFooter from '../components/layout/ConsoleFooter';
import MatchTimer from '../components/layout/MatchTimer';
import FlapDisplay from '../components/scoreboard/FlapDisplay';
import TeamScoreColumn from '../components/scoreboard/TeamScoreColumn';
import ServerBadge from '../components/scoreboard/ServerBadge';
import ActionControls from '../components/scoreboard/ActionControls';
import GameWonModal from '../components/scoreboard/GameWonModal';

export default function ScoreboardPage() {
  const onExpire = useCallback(() => {
    // onExpire is called when timer expires (0 ms)
  }, []);

  const timer = useMatchTimer({ onExpire });
  const locked = timer.status === 'paused' || timer.status === 'expired';

  const onRally = useCallback(() => {
    if (timer.status === 'idle') {
      timer.start();
    }
  }, [timer]);

  const { state, point, fault, undo, reset, renameServingTeam } = useScoreboard({
    locked,
    onRally,
    onTogglePause: timer.toggle,
  });

  // If the game is won on points while the timer is running, pause the timer at its remaining time
  useEffect(() => {
    if (state?.gameOver && timer.status === 'running') {
      timer.pause();
    }
  }, [state?.gameOver, timer]);

  const handleReset = () => {
    if (typeof window !== 'undefined' && window.confirm(CONTENT.dialogs.resetConfirm)) {
      reset();
      timer.reset();
    }
  };

  const handleEditTeam = () => {
    if (!state || typeof window === 'undefined') return;
    const name = window.prompt(CONTENT.dialogs.editTeamPrompt, state.servingTeamName);
    if (name) {
      renameServingTeam(name);
    }
  };

  if (!state) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#00564c', fontWeight: 700 }}>
        {CONTENT.hints.loading}
      </div>
    );
  }

  // Determine modal presentation (Game won on points vs Time Up expiry)
  const isTimeUp = timer.status === 'expired' && !state.gameOver;
  const isModalOpen = state.gameOver || timer.status === 'expired';

  let modalTitle = undefined;
  let modalDetail = undefined;

  if (isTimeUp) {
    modalTitle = "TIME'S UP";
    const team0Name = state.servingTeam === 0 ? state.servingTeamName : state.receivingTeamName;
    const team1Name = state.servingTeam === 1 ? state.servingTeamName : state.receivingTeamName;
    const score0 = state.scores[0];
    const score1 = state.scores[1];

    let leaderText = 'Draw';
    if (score0 > score1) {
      leaderText = `${team0Name} leads`;
    } else if (score1 > score0) {
      leaderText = `${team1Name} leads`;
    }

    modalDetail = `Final Score: ${score0} - ${score1} (${leaderText})`;
  }

  return (
    <>
      {/* Mobile Portrait Orientation Prompt */}
      <div className="landscape-hint">
        <span>{CONTENT.hints.landscapePrompt}</span>
      </div>

      <main className="console-viewport">
        {/* Top Header with 30-min Match Timer in Center Slot */}
        <ConsoleHeader
          onReset={handleReset}
          center={
            <MatchTimer
              remainingMs={timer.remainingMs}
              durationMs={MATCH_DURATION_MS}
              status={timer.status}
              isWarning={timer.isWarning}
            />
          }
        />

        {/* Central Tactical Scoreboard Binder */}
        <section className="courtside-binder">
          {/* Left Panel: Scoreboard Display */}
          <div className="scoreboard-card">
            {/* Split Flap Team Header */}
            <FlapDisplay teamName={state.servingTeamName} onEdit={handleEditTeam} />

            {/* Scores Dual Columns */}
            <div className="teams-score-grid">
              <TeamScoreColumn
                label={CONTENT.teams.servingLabel}
                tens={state.serverTens}
                units={state.serverUnits}
              />
              <TeamScoreColumn
                label={CONTENT.teams.receivingLabel}
                tens={state.receiverTens}
                units={state.receiverUnits}
                receiving
              />
            </div>

            {/* Server Number Badge Tile (Bottom) */}
            <ServerBadge serverNumber={state.serverNumber} />
          </div>

          {/* Book Fold Center Crease */}
          <div className="center-crease" />

          {/* Right Panel: Action Buttons (Pause & Undo top row, Point Won, Fault) */}
          <ActionControls
            canUndo={state.canUndo}
            disabled={state.gameOver || locked}
            onUndo={undo}
            onPoint={point}
            onFault={fault}
            timerStatus={timer.status}
            onTogglePause={timer.toggle}
          />
        </section>

        {/* Footer Status Bar */}
        <ConsoleFooter />

        {/* Game Won / Time's Up Celebration Overlay */}
        <GameWonModal
          open={isModalOpen}
          winnerName={state.winnerName}
          scores={state.scores}
          onNewMatch={handleReset}
          title={modalTitle}
          detail={modalDetail}
        />
      </main>
    </>
  );
}
