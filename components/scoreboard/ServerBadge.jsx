export function ServerBadge({ serverNumber, format = 'doubles' }) {
  return (
    <div
      className="server-badge-tile"
      title="3rd Number in Official Call: Server Number (1 or 2)"
    >
      <span className="server-badge-label">SERVER #</span>
      <div className="server-number-circle">
        {format === 'singles' ? '—' : (serverNumber || 1)}
      </div>
    </div>
  );
}

export default ServerBadge;
