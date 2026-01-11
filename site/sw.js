/**
 * Yen-Doku Service Worker
 * Provides offline support with cache-first strategy for puzzles
 */

const CACHE_NAME = 'yen-doku-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching static assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    // Skip waiting to activate immediately
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
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
    // Take control of all clients immediately
    self.clients.claim();
});

// Fetch event - cache-first for puzzles, network-first for static assets
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Puzzle JSON files - cache-first strategy
    if (url.pathname.includes('/puzzles/') && url.pathname.endsWith('.json')) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    console.log('[SW] Serving cached puzzle:', url.pathname);
                    return cachedResponse;
                }
                
                // Not in cache - fetch and cache
                return fetch(event.request).then((networkResponse) => {
                    // Clone response before caching
                    const responseToCache = networkResponse.clone();
                    
                    caches.open(CACHE_NAME).then((cache) => {
                        console.log('[SW] Caching new puzzle:', url.pathname);
                        cache.put(event.request, responseToCache);
                    });
                    
                    return networkResponse;
                });
            })
        );
        return;
    }
    
    // Static assets - network-first with cache fallback
    if (STATIC_ASSETS.some((asset) => url.pathname.endsWith(asset) || url.pathname === asset)) {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    // Update cache with fresh version
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                    return networkResponse;
                })
                .catch(() => {
                    // Network failed - try cache
                    console.log('[SW] Network failed, serving from cache:', url.pathname);
                    return caches.match(event.request);
                })
        );
        return;
    }
    
    // All other requests - network only
    event.respondWith(fetch(event.request));
});
