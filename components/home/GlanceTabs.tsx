'use client';

import { useId, useRef, useState, type ReactNode } from 'react';
import styles from './glance.module.css';

export type GlanceTab = {
  id: string;
  label: string;
  hint: string;
  /* Server-rendered comparison table for this category. */
  content: ReactNode;
};

/*
 * The only client code in the "Compare Venues at a Glance" section: a tab
 * switcher. Every category's table is already in the server HTML (inactive
 * ones are just `hidden`), so the content is crawlable and works without
 * any comparison logic running in the browser.
 */
export function GlanceTabs({ tabs }: { tabs: GlanceTab[] }) {
  const uid = useId();
  const [active, setActive] = useState(0);
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const select = (next: number, focus = false) => {
    setActive(next);
    if (focus) refs.current[next]?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent, i: number) => {
    const last = tabs.length - 1;
    const map: Record<string, number> = {
      ArrowDown: i === last ? 0 : i + 1,
      ArrowRight: i === last ? 0 : i + 1,
      ArrowUp: i === 0 ? last : i - 1,
      ArrowLeft: i === 0 ? last : i - 1,
      Home: 0,
      End: last,
    };

    if (event.key in map) {
      event.preventDefault();
      select(map[event.key], true);
    }
  };

  return (
    <div className={styles.shell}>
      <div
        className={styles.tabs}
        role="tablist"
        aria-label="Comparison categories"
      >
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={`${uid}-tab-${tab.id}`}
            role="tab"
            type="button"
            aria-selected={i === active}
            aria-controls={`${uid}-panel-${tab.id}`}
            tabIndex={i === active ? 0 : -1}
            className={i === active ? styles.tabActive : styles.tab}
            onClick={() => select(i)}
            onKeyDown={(event) => onKeyDown(event, i)}
          >
            <span className={styles.tabLabel}>{tab.label}</span>
            <span className={styles.tabHint}>{tab.hint}</span>
          </button>
        ))}
      </div>

      <div className={styles.panels}>
        {tabs.map((tab, i) => (
          <div
            key={tab.id}
            id={`${uid}-panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`${uid}-tab-${tab.id}`}
            hidden={i !== active}
            className={styles.panel}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
}
