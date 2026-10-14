export function ConsoleFooter({
  text = 'Tap the serving team to score a point. Tap the receiving team to call a fault.',
  ...rest
}) {
  return <footer className="ps-footer" {...rest}>{text}</footer>;
}

export default ConsoleFooter;
