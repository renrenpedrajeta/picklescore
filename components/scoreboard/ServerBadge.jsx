export function ServerBadge({ serverNumber }) {
  return (
    <div className="server-badge-tile">
      <div className="server-number-circle">
        {serverNumber || 1}
      </div>
    </div>
  );
}

export default ServerBadge;
