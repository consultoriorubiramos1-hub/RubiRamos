/* Generate offline documents from a fixed list of prerendered public pages.
 * Never fetch live HTML: even a public URL can contain an authenticated session.
 * No Next scripts, session provider, RSC payload, forms or private data are copied.
 */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const publicRoot = path.join(root, 'public');
const release = fs.readFileSync(path.join(root, '.next/BUILD_ID'), 'utf8').trim();
if (!/^[\w-]{1,100}$/.test(release)) throw Error('Invalid offline build ID');
const pages = { '/': 'index', '/servicios': 'servicios', '/quienessomos': 'quienessomos', '/politicas': 'politicas', '/terminos': 'terminos' };
const output = path.join(publicRoot, 'offline-public', release);
const assets = new Set(['/logo_rubi.png', '/icons/icon-192x192.png', '/icons/icon-512x512.png', '/offline-status.js']);
const routes = {};
const escape = value => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function extractMain(html) {
  const start = html.search(/<main\b[^>]*\bid="main-content"[^>]*>/i);
  if (start < 0) throw Error('Public main element missing');
  const tags = /<\/?main\b[^>]*>/gi;
  tags.lastIndex = start;
  let depth = 0, match;
  while ((match = tags.exec(html))) {
    depth += /^<\//.test(match[0]) ? -1 : 1;
    if (depth === 0) return html.slice(start, tags.lastIndex);
  }
  throw Error('Public main element is not balanced');
}

function addAsset(url) {
  const parsed = new URL(url.replace(/&amp;/g, '&'), 'https://offline.invalid');
  if (parsed.origin !== 'https://offline.invalid' || parsed.search || parsed.hash) throw Error(`Non-public offline asset: ${url}`);
  const pathname = parsed.pathname;
  const staticFile = /^\/_next\/static\/[\w./-]+\.(?:css|woff2?)$/.test(pathname);
  const publicImage = /^\/[\w./-]+\.(?:png|jpe?g|webp|avif|gif)$/.test(pathname);
  if ((!staticFile && !publicImage) || pathname.includes('..')) throw Error(`Unexpected offline asset: ${url}`);
  const base = staticFile ? path.join(root, '.next/static') : publicRoot;
  const file = path.resolve(staticFile ? path.join(root, '.next', pathname.slice('/_next/'.length)) : path.join(publicRoot, pathname));
  const relative = path.relative(fs.realpathSync(base), fs.realpathSync(file));
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw Error('Offline asset escapes public directory');
  assets.add(pathname);
  return pathname;
}

fs.mkdirSync(output, { recursive: true });
for (const [route, filename] of Object.entries(pages)) {
  const html = fs.readFileSync(path.join(root, '.next/server/app', `${filename}.html`), 'utf8');
  let main = extractMain(html);
  if (/<(?:script|form|input|textarea|iframe|object|embed)\b|\son\w+=/i.test(main)) throw Error(`Unsafe content in public snapshot ${route}`);
  main = main.replace(/<img\b[^>]*>/gi, tag => {
    const src = tag.match(/\bsrc="([^"]+)"/)?.[1];
    if (!src) throw Error('Offline image has no source');
    const url = new URL(src.replace(/&amp;/g, '&'), 'https://offline.invalid');
    const image = url.pathname === '/_next/image' ? url.searchParams.get('url') : src;
    const safe = addAsset(image || '');
    return tag.replace(/\s(?:srcset|sizes)="[^"]*"/gi, '').replace(/\bsrc="[^"]*"/, `src="${escape(safe)}"`);
  });
  const styles = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/gi)].map(match => {
    const href = match[0].match(/\bhref="([^"]+)"/)?.[1];
    const cssUrl = addAsset(href || '');
    const css = fs.readFileSync(path.join(root, '.next', cssUrl.slice('/_next/'.length)), 'utf8');
    for (const item of css.matchAll(/url\((?:["']?)([^)"']+)(?:["']?)\)/g)) {
      if (!item[1].startsWith('data:')) addAsset(new URL(item[1], `https://offline.invalid${cssUrl}`).pathname);
    }
    return `<link rel="stylesheet" href="${escape(cssUrl)}">`;
  }).join('');
  const title = html.match(/<title>(.*?)<\/title>/)?.[1] || 'Rubí Ramos';
  const bodyClass = html.match(/<body\b[^>]*\bclass="([^"]*)"/)?.[1] || '';
  const document = `<!doctype html><html lang="es" data-offline-snapshot><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#6B8E7B"><title>${title}</title><link rel="manifest" href="/manifest.json"><link rel="icon" href="/icons/icon-192x192.png">${styles}<script src="/offline-status.js" defer></script></head><body class="${bodyClass}"><a class="skip-link" href="#main-content">Ir al contenido</a><aside id="connection-status" class="connection-status" role="status" aria-live="polite"><span class="connection-dot" aria-hidden="true"></span><div><strong>Estás en modo offline</strong><span>Contenido público disponible sin internet. Las citas y los datos privados requieren conexión.</span></div></aside><header class="offline-header"><a href="/" aria-label="Inicio"><img src="/logo_rubi.png" alt="Consultorio Rubí Ramos" width="180" height="34"></a><nav aria-label="Navegación pública"><a href="/">Inicio</a><a href="/servicios">Servicios</a><a href="/quienessomos">Nosotros</a></nav></header>${main}<footer class="offline-footer"><p>Consultorio Nutricional · Rubí Ramos Álvarez</p><nav aria-label="Información legal"><a href="/politicas">Privacidad</a><a href="/terminos">Términos</a><a href="tel:+527717206956">+52 77 1720 6956</a></nav></footer></body></html>`;
  const url = `/offline-public/${release}/${filename}.html`;
  fs.writeFileSync(path.join(output, `${filename}.html`), document);
  routes[route] = url;
  assets.add(url);
}
// Publish the index last. A worker commits it only after all referenced assets are stored.
fs.writeFileSync(path.join(publicRoot, 'offline-public/index.json'), JSON.stringify({ release, routes, assets: [...assets].sort() }));
console.log(`Offline público: ${Object.keys(routes).length} páginas y ${assets.size} recursos de la versión ${release}.`);
