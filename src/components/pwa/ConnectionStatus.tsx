'use client';

import { useEffect, useRef, useState } from 'react';

const publicRoutes = new Set(['/', '/servicios', '/quienessomos', '/politicas', '/terminos']);

export default function ConnectionStatus() {
  const [status, setStatus] = useState<'offline' | 'reconnected' | null>(null);
  const banner = useRef<HTMLElement>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let wasOffline = false;
    const update = () => {
      clearTimeout(timer);
      if (!navigator.onLine) {
        wasOffline = true;
        setStatus('offline');
      } else if (wasOffline) {
        wasOffline = false;
        setStatus('reconnected');
        timer = setTimeout(() => setStatus(null), 4000);
      }
    };
    const navigateOffline = (event: MouseEvent) => {
      if (navigator.onLine || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>('a[href]');
      if (!link || link.target || link.hasAttribute('download')) return;
      const url = new URL(link.href);
      if (url.origin === location.origin && !url.search && !url.hash && publicRoutes.has(url.pathname)) {
        event.preventDefault();
        location.assign(url.href);
      }
    };
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    document.addEventListener('click', navigateOffline, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
      document.removeEventListener('click', navigateOffline, true);
    };
  }, []);
  useEffect(() => {
    const element = banner.current;
    if (!element) return;
    const measure = () => document.documentElement.style.setProperty('--connection-bar-height', `${element.getBoundingClientRect().height}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty('--connection-bar-height');
    };
  }, [status]);
  if (!status) return null;
  return (
    <aside ref={banner} role="status" aria-live="polite" className={`connection-status${status === 'reconnected' ? ' connection-status--online' : ''}`}>
      <span className="connection-dot" aria-hidden="true" />
      <div>
        <strong>{status === 'offline' ? 'Estás en modo offline' : 'Conexión restablecida'}</strong>
        <span>{status === 'offline' ? 'Contenido público disponible sin internet. Las citas y los datos privados requieren conexión.' : 'Ya puedes volver a consultar tus citas y tu información.'}</span>
      </div>
    </aside>
  );
}
