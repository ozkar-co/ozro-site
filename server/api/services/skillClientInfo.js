/**
 * Client skill names + descriptions from JSONL
 * (ozro-cli tools/build_client_descriptions.py).
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createReadStream } from 'fs';
import readline from 'readline';
import {
    normalizeAegisTail,
    parseAegisPrefix,
    resolveSkillDisplayName
} from './skillNames.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../../data');
const CANDIDATES = [
    path.join(DATA_DIR, 'client_skill_descriptions.jsonl'),
    path.resolve(__dirname, '../../../../ozro-data/reports/client_skill_descriptions.jsonl')
];

/** @type {Map<number, object>} */
let skillsById = new Map();
let sourcePath = null;

export function isSkillClientInfoAvailable() {
    return sourcePath !== null;
}

export function getSkillClientEntry(id) {
    return skillsById.get(Number(id)) || null;
}

export function findSkillIdsByDisplayName(term, limit = 200) {
    const trimmed = String(term || '').trim().toLowerCase();
    if (!trimmed) return [];
    const tokens = trimmed.split(/\s+/).filter(Boolean);
    const ranked = [];
    for (const [id, row] of skillsById) {
        const display = resolveSkillDisplayName({
            clientDisplayName: row.display_name,
            aegisName: row.aegis_name
        });
        const haystacks = [
            display,
            row.display_name,
            row.aegis_name,
            normalizeAegisTail(row.aegis_name)
        ]
            .filter(Boolean)
            .map((v) => String(v).toLowerCase());
        if (!tokens.every((token) => haystacks.some((h) => h.includes(token)))) continue;
        const primary = (display || '').toLowerCase();
        const score = primary === trimmed ? 0 : primary.startsWith(tokens[0]) ? 1 : 2;
        ranked.push({ id, score });
        if (ranked.length >= limit * 3) break;
    }
    ranked.sort((a, b) => a.score - b.score || a.id - b.id);
    return ranked.slice(0, limit).map((entry) => entry.id);
}

function mapClientFields(row) {
    if (!row) return null;
    const aegisName = row.aegis_name || null;
    const displayName = resolveSkillDisplayName({
        clientDisplayName: row.display_name,
        aegisName
    });
    return {
        displayName,
        aegisName,
        aegisPrefix: parseAegisPrefix(aegisName),
        description: Array.isArray(row.description) ? row.description : [],
        resourceName: row.resource_name || null,
        maxLv: row.max_lv ?? null,
        // Client skillinfolist Type is rare; UI prefers aegis prefix.
        clientType: row.type ?? null,
        spAmount: Array.isArray(row.sp_amount) ? row.sp_amount : null,
        attackRange: Array.isArray(row.attack_range) ? row.attack_range : null,
        separateLv: row.separate_lv ?? null,
        apAmount: Array.isArray(row.ap_amount) ? row.ap_amount : null,
        needSkills: Array.isArray(row.need_skills) ? row.need_skills : null,
        skillScale: Array.isArray(row.skill_scale) ? row.skill_scale : null
    };
}

export function getSkillClientPayload(id) {
    return mapClientFields(skillsById.get(Number(id)));
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
        const id = Number(row.skill_id);
        if (Number.isFinite(id)) byId.set(id, row);
    }

    return byId;
}

export async function initializeSkillClientInfo() {
    try {
        const filePath = await resolveSourcePath();
        if (!filePath) {
            throw new Error(
                'client_skill_descriptions.jsonl no encontrado (data/ o ozro-data/reports/)'
            );
        }
        skillsById = await loadJsonl(filePath);
        sourcePath = filePath;
        console.log(`Índice de skills cliente listo: ${skillsById.size} desde ${filePath}`);
    } catch (error) {
        skillsById = new Map();
        sourcePath = null;
        console.warn(`No se pudo leer descripciones de skills: ${error.message}`);
    }
}

export function getClientOnlySkill(id) {
    const client = getSkillClientPayload(id);
    if (!client) return null;
    return {
        id: Number(id),
        name: client.displayName || client.aegisName || null,
        displayName: client.displayName || null,
        aegisName: client.aegisName || null,
        aegisPrefix: client.aegisPrefix || null,
        mobCount: 0,
        useCount: 0,
        type: client.aegisPrefix,
        skillType: null,
        isQuest: false,
        isPlatinum: false,
        ...client,
        variants: [],
        mobs: [],
        itemCosts: [],
        teachers: [],
        recipes: []
    };
}
