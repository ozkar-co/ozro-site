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
    if (!isCacheableBody(url, body)) return;
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

/** Empty meta/catalog payloads (e.g. after schema --reset) must not be cached. */
function isCacheableBody(url, body) {
    if (body == null || typeof body !== 'object') return true;
    const path = url.split('?')[0];
    if (!path.endsWith('/meta')) return true;
    if (Array.isArray(body.types) && body.types.length === 0) return false;
    if (Array.isArray(body.categories) && body.categories.length === 0) return false;
    return true;
}

export function clearResponseCache(name) {
    if (name) {
        caches.get(name)?.entries.clear();
        return;
    }
    for (const store of caches.values()) store.entries.clear();
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
            if (
                res.statusCode >= 200
                && res.statusCode < 300
                && isCacheableBody(req.originalUrl, body)
            ) {
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
