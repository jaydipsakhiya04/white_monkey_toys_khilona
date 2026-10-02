'use client';

import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

function getFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true' && el.offsetParent !== null,
  );
}

let lockCount = 0;
let savedOverflow = '';

/**
 * Traps focus inside `ref` while `active`, closes on Escape, locks body scroll,
 * and restores focus to the previously focused element on deactivate.
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  onEscape?: () => void,
  options: { lockScroll?: boolean; initialFocus?: RefObject<HTMLElement | null> } = {},
) {
  const { lockScroll = true, initialFocus } = options;
  const escapeRef = useRef(onEscape);
  useEffect(() => {
    escapeRef.current = onEscape;
  });

  useEffect(() => {
    if (!active) return;
    const root = ref.current;
    if (!root) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusFirst = () => {
      const target = initialFocus?.current ?? root.querySelector<HTMLElement>('[data-autofocus]') ?? getFocusable(root)[0] ?? root;
      target.focus({ preventScroll: true });
    };
    const raf = requestAnimationFrame(focusFirst);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // only the top-most trap handles Escape
        const traps = document.querySelectorAll('[data-focus-trap="true"]');
        if (traps[traps.length - 1] !== root) return;
        e.stopPropagation();
        escapeRef.current?.();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = getFocusable(root);
      if (items.length === 0) {
        e.preventDefault();
        root.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (current === first || !root.contains(current))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (current === last || !root.contains(current))) {
        e.preventDefault();
        first.focus();
      }
    };

    root.setAttribute('data-focus-trap', 'true');
    document.addEventListener('keydown', onKeyDown);

    if (lockScroll) {
      if (lockCount === 0) {
        savedOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
      }
      lockCount += 1;
    }

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKeyDown);
      root.removeAttribute('data-focus-trap');
      if (lockScroll) {
        lockCount = Math.max(0, lockCount - 1);
        if (lockCount === 0) document.body.style.overflow = savedOverflow;
      }
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}
