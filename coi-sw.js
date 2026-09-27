// coi-sw.js
// GitHub Pages (and similar static hosts) can't send custom HTTP response
// headers, but SharedArrayBuffer requires the page to be "cross-origin
// isolated" via:
//   Cross-Origin-Opener-Policy: same-origin
//   Cross-Origin-Embedder-Policy: require-corp
// This service worker sits in front of every request to this origin and
// stamps those two headers onto the response, which achieves the same
// effect without needing server-side header support.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Let normal cache-only cross-origin requests pass through untouched.
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') {
    return;
  }

  event.respondWith(
    fetch(request).then((response) => {
      // Opaque responses (no-cors cross-origin) can't have headers read or
      // rewritten — just pass them through as-is.
      if (response.status === 0 || response.type === 'opaque') {
        return response;
      }
      const headers = new Headers(response.headers);
      headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
      headers.set('Cross-Origin-Opener-Policy', 'same-origin');
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    }).catch(() => new Response('', { status: 500, statusText: 'coi-sw fetch failed' }))
  );
});
