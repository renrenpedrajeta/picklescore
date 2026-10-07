'use client';

import { useScoreboard } from '../hooks/useScoreboard';
import { CONTENT } from '../config/content';
import ConsoleHeader from '../components/layout/ConsoleHeader';
import ConsoleFooter from '../components/layout/ConsoleFooter';
import FlapDisplay from '../components/scoreboard/FlapDisplay';
import TeamScoreColumn from '../components/scoreboard/TeamScoreColumn';
import ServerBadge from '../components/scoreboard/ServerBadge';
import ActionControls from '../components/scoreboard/ActionControls';
import GameWonModal from '../components/scoreboard/GameWonModal';

export default function ScoreboardPage() {
  const { state, point, fault, undo, reset, renameServingTeam } = useScoreboard();

  const handleReset = () => {
    if (typeof window !== 'undefined' && window.confirm(CONTENT.dialogs.resetConfirm)) {
      reset();
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

  return (
    <>
      {/* Mobile Portrait Orientation Prompt */}
      <div className="landscape-hint">
        <span>{CONTENT.hints.landscapePrompt}</span>
      </div>

      <main className="console-viewport">
        {/* Top Header */}
        <ConsoleHeader onReset={handleReset} />

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

          {/* Right Panel: Action Buttons */}
          <ActionControls
            canUndo={state.canUndo}
            disabled={state.gameOver}
            onUndo={undo}
            onPoint={point}
            onFault={fault}
          />
        </section>

        {/* Footer Status Bar */}
        <ConsoleFooter />

        {/* Game Won Celebration Overlay */}
        <GameWonModal
          open={state.gameOver}
          winnerName={state.winnerName}
          scores={state.scores}
          onNewMatch={handleReset}
        />
      </main>
    </>
  );
}
