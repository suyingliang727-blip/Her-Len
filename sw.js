const SITE_VERSION = 'v61';
const CACHE_NAME = 'her-lens-v61';
const STATIC_CACHE = 'her-lens-static-v61';
const IMAGE_CACHE = 'her-lens-images-v61';

const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

const CDN_ASSETS = [
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.0/dist/umd/supabase.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js',
    'https://challenges.cloudflare.com/turnstile/v0/api.js'
];

const LAZY_CDN_ASSETS = [
    'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
    'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js'
];

const IMAGE_CACHE_MAX = 100;

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
            .catch(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(key => key !== STATIC_CACHE && key !== IMAGE_CACHE && key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('message', event => {
    if (event.data && event.data.type === 'GET_VERSION') {
        event.source.postMessage({ type: 'VERSION', version: SITE_VERSION });
    }
});

self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    if (request.method !== 'GET') return;

    if (url.hostname === 'tydbvpmigvzsnlmsjuby.supabase.co') {
        if (url.pathname.includes('/storage/')) {
            event.respondWith(cacheFirstWithLimit(request, IMAGE_CACHE, IMAGE_CACHE_MAX));
        } else {
            event.respondWith(networkFirst(request));
        }
        return;
    }

    if (url.hostname === 'cdn.jsdelivr.net' || url.hostname === 'challenges.cloudflare.com') {
        event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
        return;
    }

    if (url.hostname === 'shared.cloudflare.steamstatic.com') {
        event.respondWith(cacheFirstWithLimit(request, IMAGE_CACHE, IMAGE_CACHE_MAX));
        return;
    }

    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
});

async function cacheFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (e) {
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
    }
}

async function cacheFirstWithLimit(request, cacheName, maxEntries) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
        const response = await fetch(request);
        if (response.ok) {
            const keys = await cache.keys();
            if (keys.length >= maxEntries) {
                await cache.delete(keys[0]);
            }
            cache.put(request, response.clone());
        }
        return response;
    } catch (e) {
        return new Response('', { status: 503, statusText: 'Service Unavailable' });
    }
}

async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (e) {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response('{"error":"offline"}', {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    const fetchPromise = fetch(request).then(response => {
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    }).catch(() => cached);
    return cached || fetchPromise;
}
