'use client';

import { useEffect, useRef } from 'react';

export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const finePointer = window.matchMedia('(pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!finePointer.matches || reducedMotion.matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    const glow = glowRef.current;
    if (!dot || !ring || !label || !glow) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let ringX = x;
    let ringY = y;
    let raf = 0;

    const render = () => {
      ringX += (x - ringX) * 0.14;
      ringY += (y - ringY) * 0.14;
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      glow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      raf = requestAnimationFrame(render);
    };

    const move = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      document.documentElement.style.setProperty('--cursor-x', `${x}px`);
      document.documentElement.style.setProperty('--cursor-y', `${y}px`);

      const target = event.target as HTMLElement | null;
      const interactive = target?.closest<HTMLElement>('a, button, [data-cursor]');
      const cursorType = interactive?.dataset.cursor || (interactive ? 'view' : '');
      const isHero = !!target?.closest('.hero');

      ring.classList.toggle('cursor-active', !!interactive);
      ring.classList.toggle('cursor-hero', isHero);
      label.textContent = cursorType;
      label.classList.toggle('visible', !!interactive && !!cursorType);
    };

    const leave = () => {
      dot.classList.add('cursor-hidden');
      ring.classList.add('cursor-hidden');
      glow.classList.add('cursor-hidden');
    };
    const enter = () => {
      dot.classList.remove('cursor-hidden');
      ring.classList.remove('cursor-hidden');
      glow.classList.remove('cursor-hidden');
    };

    const click = (event: MouseEvent) => {
      const ripple = document.createElement('span');
      ripple.className = 'cursor-ripple';
      ripple.style.left = `${event.clientX}px`;
      ripple.style.top = `${event.clientY}px`;
      document.body.appendChild(ripple);
      window.setTimeout(() => ripple.remove(), 650);
    };

    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerleave', leave);
    window.addEventListener('pointerenter', enter);
    window.addEventListener('click', click);
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerleave', leave);
      window.removeEventListener('pointerenter', enter);
      window.removeEventListener('click', click);
    };
  }, []);

  return (
    <>
      <div ref={glowRef} className="cursor-glow" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true">
        <span ref={labelRef} className="cursor-label" />
      </div>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
    </>
  );
}
