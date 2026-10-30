/* Slow, decorative ticker. Pure CSS; hidden from assistive tech; paused for reduced motion. */
export function Marquee({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  const row = (key: string) => (
    <ul className="mqRow" key={key} aria-hidden="true">
      {items.map((t, i) => (
        <li key={`${key}-${i}`}>
          {t}
          <span className="mqX">×</span>
        </li>
      ))}
    </ul>
  );
  return (
    <div className="mq" aria-hidden="true">
      <div className="mqTrack">{row('a')}{row('b')}</div>
    </div>
  );
}
