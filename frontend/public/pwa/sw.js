/**
 * Service Worker for SR University Coding Club PWA
 */

const CACHE_NAME = 'cc-cache-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache immediately
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/login.html',
    '/join.html',
    '/offline.html',
    '/css/main.css',
    '/js/app.js',
    '/pwa/manifest.json'
];

// Install - Precache critical assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Precaching assets');
            return cache.addAll(PRECACHE_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate - Clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        })
    );
    self.clients.claim();
});

// Fetch - Network first, fall back to cache, then offline page
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip API requests (they should fail properly)
    if (request.url.includes('/api/')) return;

    event.respondWith(
        fetch(request)
            .then((response) => {
                // Clone response for caching
                if (response.ok) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });
                }
                return response;
            })
            .catch(async () => {
                // Try cache
                const cachedResponse = await caches.match(request);
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Return offline page for navigation requests
                if (request.mode === 'navigate') {
                    const offlinePage = await caches.match(OFFLINE_URL);
                    return offlinePage;
                }

                // Return nothing for other resources
                return new Response('', { status: 503, statusText: 'Service Unavailable' });
            })
    );
});

// Push notifications (placeholder)
self.addEventListener('push', (event) => {
    const data = event.data?.json() || { title: 'Notification', body: 'You have a new notification' };

    const options = {
        body: data.body,
        icon: '/assets/icons/icon-192.png',
        badge: '/assets/icons/badge-72.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/'
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.openWindow(event.notification.data.url || '/')
    );
});
