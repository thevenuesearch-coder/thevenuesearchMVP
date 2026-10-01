'use client';

import type { CSSProperties, ReactNode } from 'react';

import { useDialogA11y } from '../lib/use-dialog-a11y';

/*
 * Accessible wrapper for the booking review page's overlay dialogs.
 * Renders the same single overlay element those dialogs already
 * used (same inline style), adding the dialog semantics, focus
 * handling and Escape/backdrop dismissal from useDialogA11y.
 */
export function ModalFocus({
  labelledBy,
  onClose,
  style,
  children,
}: {
  labelledBy: string;
  /* Omit for dialogs that must not be dismissed with Escape/backdrop. */
  onClose?: () => void;
  style: CSSProperties;
  children: ReactNode;
}) {
  const ref = useDialogA11y<HTMLDivElement>(onClose);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      tabIndex={-1}
      style={style}
      onClick={
        onClose
          ? (event) => {
              // Backdrop click only -- not clicks inside the panel.
              if (event.target === event.currentTarget) onClose();
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}
