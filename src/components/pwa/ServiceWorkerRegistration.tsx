'use client';

import { useEffect, useState } from 'react';
import ConnectionStatus from './ConnectionStatus';

export default function ServiceWorkerRegistration() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    let disposed = false;
    let registration: ServiceWorkerRegistration | undefined;
    const detectUpdate = () => {
      if (!disposed && registration?.waiting && navigator.serviceWorker.controller) setWaitingWorker(registration.waiting);
    };
    const onUpdateFound = () => {
      registration?.installing?.addEventListener('statechange', detectUpdate);
    };
    const checkForUpdate = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        registration?.update().catch(() => {});
        navigator.serviceWorker.controller?.postMessage({ type: 'REFRESH_PUBLIC_CONTENT' });
      }
    };
    const refreshPublic = () => navigator.serviceWorker.controller?.postMessage({ type: 'REFRESH_PUBLIC_CONTENT' });
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).then(result => {
      if (disposed) return;
      registration = result;
      detectUpdate();
      registration.addEventListener('updatefound', onUpdateFound);
      document.addEventListener('visibilitychange', checkForUpdate);
      window.addEventListener('online', refreshPublic);
      navigator.serviceWorker.ready.then(() => { if (!disposed) refreshPublic(); });
      if (window.matchMedia('(display-mode: standalone)').matches && navigator.storage?.persist) {
        navigator.storage.persisted().then(persisted => { if (!persisted) return navigator.storage.persist(); }).catch(() => {});
      }
    }).catch(error => console.warn('No se pudo registrar el modo offline:', error));
    return () => {
      disposed = true;
      registration?.removeEventListener('updatefound', onUpdateFound);
      document.removeEventListener('visibilitychange', checkForUpdate);
      window.removeEventListener('online', refreshPublic);
    };
  }, []);

  return (
    <>
    <ConnectionStatus />
    {waitingWorker && !dismissed && (
    <aside className="fixed bottom-4 inset-x-4 z-[100] mx-auto flex max-w-lg flex-wrap items-center gap-3 rounded-2xl border border-[#E6E3DE] bg-white p-4 shadow-lg" aria-label="Actualización disponible">
      <p className="min-w-0 flex-1 text-sm text-[#2C3E34]">Hay una nueva versión disponible. Guarda tus cambios antes de actualizar.</p>
      <button type="button" className="rounded-xl bg-[#456D5E] px-4 py-2 text-white" onClick={() => {
        navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true });
        waitingWorker.postMessage({ type: 'ACTIVATE_UPDATE' });
      }}>Actualizar</button>
      <button type="button" className="rounded-xl px-3 py-2 text-[#6E7C72]" onClick={() => setDismissed(true)}>Después</button>
    </aside>)}
    </>
  );
}
