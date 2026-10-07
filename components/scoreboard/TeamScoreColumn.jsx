import ScoreDigit from './ScoreDigit';

export function TeamScoreColumn({ label, tens, units, receiving = false }) {
  return (
    <div className="team-score-column">
      <div className={`team-header-pill${receiving ? ' receiving' : ''}`}>
        <span className="dot" />
        <span>{label}</span>
      </div>
      <div className="digits-container">
        <ScoreDigit value={tens} />
        <ScoreDigit value={units} />
      </div>
    </div>
  );
}

export default TeamScoreColumn;
