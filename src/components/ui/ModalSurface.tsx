'use client';

import { useEffect, useId, useRef, type HTMLAttributes, type KeyboardEvent } from 'react';

export default function ModalSurface({ children, onClose, ...props }: HTMLAttributes<HTMLDivElement> & { onClose?: () => void }) {
  const surface = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // Focus the dialog itself, avoiding automatic mobile keyboards on form inputs.
    surface.current?.focus({ preventScroll: true });
    const heading = surface.current?.querySelector('h1,h2,h3');
    if (heading && surface.current) {
      if (!heading.id) heading.id = titleId;
      surface.current.setAttribute('aria-labelledby', heading.id);
    }
    return () => { if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, [titleId]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    props.onKeyDown?.(event);
    if (event.key === 'Escape' && onClose) {
      event.stopPropagation();
      onClose();
    }
    if (event.key !== 'Tab') return;
    const items = Array.from(surface.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]') || [])
      .filter(element => element.getClientRects().length > 0 && element.tabIndex >= 0);
    const first = items[0], last = items[items.length - 1];
    if (!first || (event.shiftKey && (document.activeElement === first || document.activeElement === surface.current))) {
      event.preventDefault();
      (last || surface.current)?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
    event.stopPropagation();
  };

  return <div {...props} ref={surface} role="dialog" aria-modal="true" aria-label={props['aria-label'] || 'Detalles y acciones'} tabIndex={-1} onKeyDown={onKeyDown}>{children}</div>;
}
