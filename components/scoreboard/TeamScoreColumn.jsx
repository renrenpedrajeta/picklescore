import ScoreDigit from './ScoreDigit';

export function TeamScoreColumn({
  teamName,
  roleLabel,
  label,
  tens,
  units,
  isServing,
  palette,
  serverNumber,
  receiving = false,
  onEdit,
}) {
  const serving = isServing !== undefined ? isServing : !receiving;
  const primaryName = teamName || label;
  const secondaryRole = roleLabel || (serving ? 'SERVING' : 'RECEIVING');

  const columnStyle = palette
    ? {
        '--team-primary': palette.primary,
        '--team-dark': palette.dark,
        '--team-accent': palette.accent,
        '--team-light': palette.light,
        '--team-border': palette.border,
        '--team-glow': palette.glow,
      }
    : undefined;

  return (
    <div
      className={`team-score-column ${serving ? 'is-serving' : 'is-receiving'}`}
      style={columnStyle}
    >
      <div
        className={`team-header-pill ${serving ? 'serving' : 'receiving'}`}
        onClick={onEdit}
        style={onEdit ? { cursor: 'pointer' } : undefined}
        title={onEdit ? 'Edit team name and color' : undefined}
      >
        <span className="dot" />
        <span className="team-pill-name">{primaryName}</span>
        <span className="team-role-tag">{secondaryRole}</span>
        {serving && serverNumber && (
          <span className="team-serve-chip">#{serverNumber}</span>
        )}
      </div>
      <div className={`digits-container ${serving ? 'active-serving-container' : ''}`}>
        <ScoreDigit value={tens} />
        <ScoreDigit value={units} />
      </div>
    </div>
  );
}

export default TeamScoreColumn;
