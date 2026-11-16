const caches = new Map();

function normalizeKey(url) {
    return url.split('?')[0] + (url.includes('?') ? `?${[...new URLSearchParams(url.split('?')[1]).entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join('&')}` : '');
}

function getStore(name, ttlMs, maxEntries) {
    let store = caches.get(name);
    if (!store) {
        store = { ttlMs, maxEntries, entries: new Map() };
        caches.set(name, store);
    }
    return store;
}

export function primeResponseCache(name, url, body, ttlMs) {
    const store = caches.get(name);
    if (!store) return;
    const key = normalizeKey(url);
    if (store.entries.size >= store.maxEntries) {
        const oldest = store.entries.keys().next().value;
        if (oldest !== undefined) store.entries.delete(oldest);
    }
    store.entries.set(key, {
        expires: Date.now() + (ttlMs ?? store.ttlMs),
        body
    });
}

export function responseCache(name, ttlMs = 10 * 60 * 1000, maxEntries = 200) {
    const store = getStore(name, ttlMs, maxEntries);

    return (req, res, next) => {
        if (req.method !== 'GET') return next();

        const key = normalizeKey(req.originalUrl);
        const cached = store.entries.get(key);
        if (cached && cached.expires > Date.now()) {
            res.setHeader('X-Cache', 'HIT');
            return res.json(cached.body);
        }

        const originalJson = res.json.bind(res);
        res.json = (body) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                if (store.entries.size >= store.maxEntries) {
                    const oldest = store.entries.keys().next().value;
                    if (oldest !== undefined) store.entries.delete(oldest);
                }
                store.entries.set(key, {
                    expires: Date.now() + store.ttlMs,
                    body
                });
            }
            return originalJson(body);
        };

        next();
    };
}
