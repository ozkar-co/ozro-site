/**
 * Client item display names + descriptions from JSONL
 * (ozro-cli tools/build_client_descriptions.py).
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createReadStream } from 'fs';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../../data');
const CANDIDATES = [
    path.join(DATA_DIR, 'client_item_descriptions.jsonl'),
    path.resolve(__dirname, '../../../../ozro-data/reports/client_item_descriptions.jsonl')
];

/** @type {Map<number, object>} */
let itemsById = new Map();
/** @type {Map<number, string>} */
let itemNames = new Map();
let sourcePath = null;

export function isItemInfoAvailable() {
    return sourcePath !== null;
}

export function getItemDisplayName(id) {
    return itemNames.get(Number(id)) || null;
}

function nameMatchesTokens(name, tokens) {
    const haystack = name.toLowerCase();
    return tokens.every((token) => haystack.includes(token));
}

function nameRelevanceScore(name, tokens, trimmedLower) {
    const haystack = name.toLowerCase();
    if (haystack === trimmedLower) return 0;
    if (tokens.length > 0 && haystack.startsWith(tokens[0])) return 1;
    if (tokens.length > 0 && haystack.includes(` ${tokens[0]}`)) return 2;
    if (tokens.every((token) => haystack.includes(token))) return 3;
    return 99;
}

export function findItemIdsByDisplayName(term, limit = 1000) {
    const trimmed = String(term || '').trim();
    if (!trimmed) return [];

    const tokens = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
    const trimmedLower = trimmed.toLowerCase();

    const ranked = [];
    for (const [id, name] of itemNames) {
        if (!nameMatchesTokens(name, tokens)) continue;
        ranked.push({
            id,
            score: nameRelevanceScore(name, tokens, trimmedLower)
        });
        if (ranked.length >= limit * 3) break;
    }

    ranked.sort((a, b) => a.score - b.score || a.id - b.id);
    return ranked.slice(0, limit).map((entry) => entry.id);
}

async function resolveSourcePath() {
    for (const candidate of CANDIDATES) {
        try {
            await fs.access(candidate);
            return candidate;
        } catch {
            // try next
        }
    }
    return null;
}

async function loadJsonl(filePath) {
    const byId = new Map();
    const names = new Map();
    const rl = readline.createInterface({
        input: createReadStream(filePath, { encoding: 'utf8' }),
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        if (!line.trim()) continue;
        let row;
        try {
            row = JSON.parse(line);
        } catch {
            continue;
        }
        const id = Number(row.item_id);
        if (!Number.isFinite(id)) continue;
        byId.set(id, row);
        const name = row.identified_display_name || row.unidentified_display_name;
        if (name) names.set(id, name);
    }

    return { byId, names };
}

export async function initializeItemInfoIndex() {
    try {
        const filePath = await resolveSourcePath();
        if (!filePath) {
            throw new Error(
                'client_item_descriptions.jsonl no encontrado (data/ o ozro-data/reports/)'
            );
        }
        const { byId, names } = await loadJsonl(filePath);
        itemsById = byId;
        itemNames = names;
        sourcePath = filePath;
        console.log(`Índice de descripciones listo: ${byId.size} objetos desde ${filePath}`);
    } catch (error) {
        itemsById = new Map();
        itemNames = new Map();
        sourcePath = null;
        console.warn(`No se pudo leer descripciones de objetos: ${error.message}`);
    }
}

export async function getItemDescription(id) {
    if (!sourcePath) return null;
    const row = itemsById.get(Number(id));
    if (!row) {
        return { identified: [], unidentified: [] };
    }
    return {
        identified: Array.isArray(row.identified_description)
            ? row.identified_description
            : [],
        unidentified: Array.isArray(row.unidentified_description)
            ? row.unidentified_description
            : [],
        displayName: row.identified_display_name || null,
        unidentifiedDisplayName: row.unidentified_display_name || null,
        slotCount: row.slot_count ?? null,
        classNum: row.class_num ?? null,
        costume: row.costume ?? null,
        effectId: row.effect_id ?? null,
        server: row.server ?? null,
        identifiedResourceName: row.identified_resource_name || null
    };
}
