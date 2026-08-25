'use client';

import {useEffect, type RefObject} from 'react';

/**
 * Close-on-Escape, and optionally close-on-click-outside.
 *
 * The application has no modals, so nothing here traps focus or blocks the
 * page — this only provides the two dismissals people expect from anything
 * that opened in place: pressing Escape, and clicking away from it.
 *
 * Pass a `ref` for popovers, which should close when you click elsewhere.
 * Omit it for inline editors, which should not: clicking into the page while
 * half way through typing a meeting must never discard what you have written.
 */
export const useDismiss = (
  onDismiss: () => void,
  {active = true, ref}: {active?: boolean; ref?: RefObject<HTMLElement | null>} = {}
): void => {
  useEffect(() => {
    if (!active) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      onDismiss();
    };

    document.addEventListener('keydown', onKeyDown);

    if (!ref) return () => document.removeEventListener('keydown', onKeyDown);

    const onPointerDown = (event: PointerEvent) => {
      const node = ref.current;
      if (node && !node.contains(event.target as Node)) onDismiss();
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [active, onDismiss, ref]);
};
