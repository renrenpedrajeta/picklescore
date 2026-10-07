import { CONTENT } from '../../config/content';

export function ConsoleHeader({
  onReset,
  center,
  title = CONTENT.header.brandTitle,
  resetTooltip = CONTENT.header.resetTooltip,
}) {
  return (
    <header className="console-header">
      <div className="brand-wrapper">
        <div className="brand-squircle" />
        <h1 className="brand-title">{title}</h1>
      </div>
      <div className="header-center-slot">
        {center}
      </div>
      <div className="header-right-slot">
        {onReset && (
          <button
            onClick={onReset}
            title={resetTooltip}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <div className="status-circle" />
          </button>
        )}
      </div>
    </header>
  );
}

export default ConsoleHeader;
