import Link from 'next/link';
import type { ReactNode } from 'react';

/*
 * Editorial section opener: numbered index, slash label, hairline rule and an
 * optional text link, followed by an oversized serif headline.
 * Numbering is purely typographic (01, 02, …) — it carries no data claims.
 */
export function SectionHead({
  index,
  label,
  title,
  blurb,
  href,
  hrefLabel,
  id,
}: {
  index: string;
  label: string;
  title: ReactNode;
  blurb?: string;
  href?: string;
  hrefLabel?: string;
  id: string;
}) {
  return (
    <header className="edHead">
      <div className="edTop">
        <span className="edIdx">{index}</span>
        <span className="edLabel">/ {label}</span>
        <i className="edRule" aria-hidden="true" />
        {href && (
          <Link className="edLink" href={href}>
            {hrefLabel || 'View all'} <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
      <h2 id={id} className="edTitle">{title}</h2>
      {blurb && <p className="edBlurb">{blurb}</p>}
    </header>
  );
}
