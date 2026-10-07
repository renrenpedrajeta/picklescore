import { CONTENT } from '../../config/content';

export function ConsoleFooter({
  prefix = CONTENT.footer.prefix,
  credit = CONTENT.footer.credit,
  meta = CONTENT.footer.meta,
}) {
  return (
    <footer className="console-footer">
      <div className="footer-left">{prefix}</div>
      <div className="footer-center">{credit}</div>
      <div className="footer-right">{meta}</div>
    </footer>
  );
}

export default ConsoleFooter;
