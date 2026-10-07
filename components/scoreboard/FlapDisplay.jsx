import { CONTENT } from '../../config/content';

export function FlapDisplay({
  teamName,
  onEdit,
  label = CONTENT.flapDisplay.label,
  symbol = CONTENT.flapDisplay.symbol,
}) {
  return (
    <div
      className="flap-display-wrapper"
      onClick={onEdit}
      style={onEdit ? { cursor: 'pointer' } : undefined}
    >
      <div className="flap-label">
        <span>{symbol}</span>
        <span>{label}</span>
      </div>
      <div className="flap-unit">
        <div className="flap-hinge-left" />
        <div className="flap-seam" />
        <span className="flap-text">{teamName}</span>
        <div className="flap-hinge-right" />
      </div>
    </div>
  );
}

export default FlapDisplay;
