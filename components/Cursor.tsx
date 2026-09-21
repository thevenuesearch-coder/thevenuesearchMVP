'use client';

import { useEffect, useRef } from 'react';

export default function Cursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const dot = dotRef.current;

    if (!cursor || !dot) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    let cursorX = mouseX;
    let cursorY = mouseY;

    let animationFrame = 0;

    const handleMouseMove = (event: MouseEvent) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const animate = () => {
      // Smooth trailing movement
      cursorX += (mouseX - cursorX) * 0.16;
      cursorY += (mouseY - cursorY) * 0.16;

      cursor.style.transform = `
        translate3d(${cursorX}px, ${cursorY}px, 0)
      `;

      // Center dot follows immediately
      dot.style.transform = `
        translate3d(${mouseX}px, ${mouseY}px, 0)
      `;

      animationFrame = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);

    animationFrame = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener(
        'mousemove',
        handleMouseMove
      );

      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <>
      {/* Main animated cursor */}
      <div
        ref={cursorRef}
        className="custom-cursor"
        aria-hidden="true"
      >
        <span className="custom-cursor-ring" />
      </div>

      {/* Instant center point */}
      <div
        ref={dotRef}
        className="custom-cursor-dot"
        aria-hidden="true"
      />
    </>
  );
}