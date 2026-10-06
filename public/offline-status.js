/* Standalone public snapshots deliberately have no React, Next or session runtime. */
(() => {
  const banner = document.getElementById('connection-status');
  if (!banner) return;
  let timer;
  const offlineText = '<span class="connection-dot" aria-hidden="true"></span><div><strong>Estás en modo offline</strong><span>Contenido público disponible sin internet. Las citas y los datos privados requieren conexión.</span></div>';
  function update(offline) {
    clearTimeout(timer);
    banner.hidden = false;
    banner.classList.toggle('connection-status--online', !offline);
    banner.innerHTML = offline ? offlineText : '<span class="connection-dot" aria-hidden="true"></span><div><strong>Conexión restablecida</strong><span>Ya puedes volver a consultar tus citas y tu información.</span></div>';
    if (!offline) {
      navigator.serviceWorker?.controller?.postMessage({ type: 'REFRESH_PUBLIC_CONTENT' });
      timer = setTimeout(() => { banner.hidden = true; }, 4000);
    }
  }
  window.addEventListener('offline', () => update(true));
  window.addEventListener('online', () => update(false));
  // A navigation may fail even when navigator.onLine reports a network connection.
  update(true);
})();
