export function ConsoleFooter({
  text = 'Tap the serving team to score a point. Tap the receiving team to call a fault.',
}) {
  return <footer className="ps-footer">{text}</footer>;
}

export default ConsoleFooter;
