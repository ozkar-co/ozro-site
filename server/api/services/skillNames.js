/**
 * Skill display helpers: aegis prefix (job code) + normalized fallback names.
 */

export function parseAegisPrefix(aegis) {
    if (!aegis || typeof aegis !== 'string') return null;
    const idx = aegis.indexOf('_');
    if (idx <= 0) return null;
    const prefix = aegis.slice(0, idx).trim();
    return prefix || null;
}

export function normalizeAegisTail(aegis) {
    if (!aegis || typeof aegis !== 'string') return null;
    const idx = aegis.indexOf('_');
    const rest = idx >= 0 ? aegis.slice(idx + 1) : aegis;
    const compact = String(rest).replace(/_/g, '');
    if (!compact) return null;
    return compact.charAt(0).toUpperCase() + compact.slice(1).toLowerCase();
}

/**
 * Prefer client display name, then server description, then normalized aegis tail.
 */
export function resolveSkillDisplayName({
    clientDisplayName = null,
    serverDescription = null,
    aegisName = null
} = {}) {
    const client = typeof clientDisplayName === 'string' ? clientDisplayName.trim() : '';
    if (client) return client;
    const server = typeof serverDescription === 'string' ? serverDescription.trim() : '';
    if (server) return server;
    return normalizeAegisTail(aegisName) || aegisName || null;
}
