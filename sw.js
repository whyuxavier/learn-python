/* Python з нуля — Service Worker: повна робота курсу без інтернету.
   Сторінка курсу: спершу мережа (щоб після оновлення на GitHub учні одразу
   отримали нову версію), без мережі — збережена копія.
   Pyodide і шрифти: з кешу (їхні адреси містять версію й не змінюються). */
const VERSION = '2026-11-09';
const SHELL = 'lp-shell-' + VERSION;   // сторінка, маніфест, іконки
const ASSETS = 'lp-assets';            // Pyodide, шрифти (переживають оновлення SW)
const SHELL_FILES = [
  './',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png'
];
const PAGE = new URL('./', self.registration.scope).href;
const NET_TIMEOUT = 4000;              // повільний інтернет — не чекати довше, віддати копію

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(SHELL);
    await Promise.all(SHELL_FILES.map(async f => {
      const r = await fetch(new Request(f, { cache: 'reload' }));
      if (r.ok) await c.put(new URL(f, self.registration.scope).href, r);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys())
      if (k.startsWith('lp-shell-') && k !== SHELL) await caches.delete(k);
    await self.clients.claim();
  })());
});

/* Сторінка надсилає список файлів, потрібних для офлайну (Pyodide поточної версії, шрифти).
   Кешуємо відсутні й прибираємо застарілі версії Pyodide. */
self.addEventListener('message', e => {
  const d = e.data || {};
  if (d.type !== 'warm' || !Array.isArray(d.urls)) return;
  e.waitUntil(warm(d.urls, d.fontCss || []).then(
    n => e.source && e.source.postMessage({ type: 'warmed', missing: n }),
    () => {}
  ));
});

async function warm(urls, fontCss) {
  const c = await caches.open(ASSETS);
  const want = new Set(urls);
  for (const css of fontCss) {
    want.add(css);
    try {
      let r = await c.match(css);
      if (!r) { r = await fetch(css, { mode: 'cors' }); if (r.ok) await c.put(css, r.clone()); }
      if (r && r.ok) {
        const txt = await r.text();
        for (const m of txt.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) want.add(new URL(m[1], css).href);
      }
    } catch (err) {}
  }
  let missing = 0;
  await Promise.all([...want].map(async u => {
    if (await c.match(u)) return;
    try {
      const r = await fetch(u, { mode: 'cors' });
      if (r.ok) await c.put(u, r); else missing++;
    } catch (err) { missing++; }
  }));
  // старі версії Pyodide після зміни PYO в index.html
  for (const req of await c.keys())
    if (req.url.includes('/pyodide/') && !want.has(req.url)) await c.delete(req);
  return missing;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const scopePath = new URL(self.registration.scope).pathname;
  if (req.mode === 'navigate' && url.origin === location.origin &&
      (url.pathname === scopePath || url.pathname === scopePath + 'index.html')) {
    e.respondWith(page(req, e));
    return;
  }
  if (url.hostname === 'cdn.jsdelivr.net' || url.hostname.endsWith('cdnfonts.com')) {
    e.respondWith(cacheFirst(req));
    return;
  }
  if (url.origin === location.origin && url.href.startsWith(self.registration.scope)) {
    e.respondWith(staleWhileRevalidate(req, e));
  }
});

async function page(req, e) {
  const c = await caches.open(SHELL);
  const net = fetch(PAGE, { cache: 'no-cache' }).then(async r => {
    if (r.ok && r.type === 'basic') await c.put(PAGE, r.clone());
    return r;
  });
  e.waitUntil(net.catch(() => {}));
  const timeout = new Promise(res => setTimeout(res, NET_TIMEOUT));
  try {
    const r = await Promise.race([net, timeout.then(() => null)]);
    if (r && r.ok) return r;
  } catch (err) {}
  const cached = await c.match(PAGE) || await caches.match(PAGE);
  if (cached) return cached;
  return net;   // ще немає копії — чекаємо мережу, як звичайний сайт
}

async function cacheFirst(req) {
  const c = await caches.open(ASSETS);
  const hit = await c.match(req.url);
  if (hit) return hit;
  const r = await fetch(req.url, { mode: 'cors' }).catch(() => fetch(req));
  if (r && (r.ok || r.type === 'opaque')) await c.put(req.url, r.clone());
  return r;
}

async function staleWhileRevalidate(req, e) {
  const c = await caches.open(SHELL);
  const hit = await c.match(req, { ignoreSearch: true });
  const net = fetch(req).then(async r => {
    if (r.ok) await c.put(req, r.clone());
    return r;
  });
  if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
  return net;
}
