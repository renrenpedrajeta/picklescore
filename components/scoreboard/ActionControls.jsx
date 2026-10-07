import { CONTENT } from '../../config/content';

export function ActionControls({
  canUndo,
  disabled,
  onUndo,
  onPoint,
  onFault,
  labels = CONTENT.actions,
}) {
  return (
    <div className="action-column">
      {/* Undo Button */}
      <button
        className="btn-undo-header"
        onClick={onUndo}
        disabled={!canUndo}
        title={labels.undoTitle}
      >
        <span>{labels.undoLabel}</span>

      </button>

      {/* Action Buttons Wrapper */}
      <div className="action-buttons-wrapper">
        {/* Giant POINT WON Button */}
        <button className="btn-point-won" onClick={onPoint} disabled={disabled}>
          <div className="icon-circle-yellow">+</div>
          <span className="btn-title-white">{labels.pointWonLabel}</span>
        </button>

        {/* Giant FAULT Button */}
        <button className="btn-fault" onClick={onFault} disabled={disabled}>
          <div className="icon-circle-sage">⚑</div>
          <span className="btn-title-teal">{labels.faultLabel}</span>
        </button>
      </div>
    </div>
  );
}

export default ActionControls;
