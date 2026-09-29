'use client';

import { useEffect, useState } from 'react';

import { isInCompare, toggleCompare, type CompareEntry } from '../lib/compare';

type CompareToggleButtonProps = CompareEntry & {
  className?: string;
  label?: string;
  activeLabel?: string;
};

export function CompareToggleButton({
  id,
  name,
  image,
  city,
  className,
  label = 'Compare',
  activeLabel = 'Comparing',
}: CompareToggleButtonProps) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(isInCompare(id));

    function onChange() {
      setActive(isInCompare(id));
    }

    window.addEventListener('tvs-compare-change', onChange);
    return () => window.removeEventListener('tvs-compare-change', onChange);
  }, [id]);

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    toggleCompare({ id, name, image, city });
  }

  return (
    <button
      type="button"
      className={`compareToggle${active ? ' active' : ''}${
        className ? ` ${className}` : ''
      }`}
      aria-pressed={active}
      aria-label={
        active ? `Remove ${name} from comparison` : `Add ${name} to comparison`
      }
      onClick={handleClick}
    >
      <span className="compareToggleIcon" aria-hidden="true">
        {active ? '✓' : '⇄'}
      </span>
      {active ? activeLabel : label}
    </button>
  );
}
