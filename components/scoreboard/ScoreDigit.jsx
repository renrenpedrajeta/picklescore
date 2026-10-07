export function ScoreDigit({ value }) {
  return (
    <div className="digit-tile">
      <span className={`digit-number ${value === 0 ? 'is-zero' : ''}`}>
        {value}
      </span>
    </div>
  );
}

export default ScoreDigit;
