import { clientsClaim } from 'workbox-core';
import { matchPrecache, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkOnly } from 'workbox-strategies';

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  ({ request, url }) => request.mode === 'navigate'
    && url.pathname !== '/api'
    && !url.pathname.startsWith('/api/'),
  new NetworkOnly({
    plugins: [
      {
        handlerDidError: () => matchPrecache('/offline.html'),
      },
    ],
  }),
);

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(
      names
        .filter((name) => name.startsWith('edutalk-'))
        .map((name) => caches.delete(name)),
    )),
  );
});
