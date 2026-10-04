'use client';

import { useEffect, useState } from 'react';

export default function ServiceWorkerRegistration() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const updateConnection = () => setOffline(!navigator.onLine);
    updateConnection();
    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);
    return () => {
      window.removeEventListener('online', updateConnection);
      window.removeEventListener('offline', updateConnection);
    };
  }, []);

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
      if (document.visibilityState === 'visible') registration?.update().catch(() => {});
    };
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).then(result => {
      if (disposed) return;
      registration = result;
      detectUpdate();
      registration.addEventListener('updatefound', onUpdateFound);
      document.addEventListener('visibilitychange', checkForUpdate);
    }).catch(error => console.warn('No se pudo registrar el modo offline:', error));
    return () => {
      disposed = true;
      registration?.removeEventListener('updatefound', onUpdateFound);
      document.removeEventListener('visibilitychange', checkForUpdate);
    };
  }, []);

  if (offline) return (
    <aside role="status" className="fixed bottom-4 inset-x-4 z-[100] mx-auto max-w-lg rounded-2xl border border-[#E6E3DE] bg-white p-4 text-sm text-[#2C3E34] shadow-lg">
      Sin conexión. Las citas y los datos privados requieren internet. <a className="inline-block py-2 font-semibold underline" href="/offline">Ver ayuda de conexión</a>
    </aside>
  );
  if (!waitingWorker || dismissed) return null;
  return (
    <aside className="fixed bottom-4 inset-x-4 z-[100] mx-auto flex max-w-lg flex-wrap items-center gap-3 rounded-2xl border border-[#E6E3DE] bg-white p-4 shadow-lg" aria-label="Actualización disponible">
      <p className="min-w-0 flex-1 text-sm text-[#2C3E34]">Hay una nueva versión disponible. Guarda tus cambios antes de actualizar.</p>
      <button type="button" className="rounded-xl bg-[#5A8C7A] px-4 py-2 text-white" onClick={() => {
        navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true });
        waitingWorker.postMessage({ type: 'ACTIVATE_UPDATE' });
      }}>Actualizar</button>
      <button type="button" className="rounded-xl px-3 py-2 text-[#6E7C72]" onClick={() => setDismissed(true)}>Después</button>
    </aside>
  );
}
