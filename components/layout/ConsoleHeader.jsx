import { CONTENT } from '../../config/content';

export function ConsoleHeader({
  onReset,
  title = CONTENT.header.brandTitle,
  resetTooltip = CONTENT.header.resetTooltip,
}) {
  return (
    <header className="console-header">
      <div className="brand-wrapper">
        <div className="brand-squircle" />
        <h1 className="brand-title">{title}</h1>
      </div>
      {onReset && (
        <button
          onClick={onReset}
          title={resetTooltip}
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <div className="status-circle" />
        </button>
      )}
    </header>
  );
}

export default ConsoleHeader;
