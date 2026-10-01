'use client';

import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/*
 * Keyboard + focus behaviour for modal dialogs.
 *
 * Why this exists: the site's modals are plain overlay elements, so
 * on their own they do not move focus into the dialog, do not keep
 * Tab inside it, do not close on Escape and do not hand focus back
 * to the control that opened them. This hook adds exactly that and
 * nothing else -- no markup or styling changes.
 *
 * (A native <dialog> would do this for free, but it renders in the
 * browser's top layer, which would paint above the site's custom
 * cursor element and make the pointer disappear while a modal is
 * open. This hook avoids that.)
 *
 * `onClose` is optional: omit it for dialogs that must not be
 * dismissed with Escape (e.g. a payment confirmation).
 */
export function useDialogA11y<T extends HTMLElement>(
  onClose?: () => void
) {
  const ref = useRef<T>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const dialog = ref.current;

    if (!dialog) return;

    const previouslyFocused =
      document.activeElement as HTMLElement | null;

    function focusables() {
      return Array.from(
        dialog!.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter((el) => el.getClientRects().length > 0);
    }

    // Move focus into the dialog (first control, else the dialog).
    (focusables()[0] ?? dialog).focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && closeRef.current) {
        event.stopPropagation();
        closeRef.current();
        return;
      }

      if (event.key !== 'Tab') return;

      const items = focusables();

      if (items.length === 0) {
        event.preventDefault();
        dialog!.focus();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const inside = dialog!.contains(active);

      if (event.shiftKey && (active === first || !inside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !inside)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, []);

  return ref;
}
