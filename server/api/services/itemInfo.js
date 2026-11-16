import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ITEM_INFO_PATH = path.resolve(__dirname, '../../../data/itemInfo_EN.lua');
const ITEM_START_PATTERN = /^[ \t]*\[(\d+)\][ \t]*= \{/gm;

let itemInfoPath = null;
let itemRanges = new Map();

export function isItemInfoAvailable() {
    return itemInfoPath !== null;
}

export async function initializeItemInfoIndex() {
    try {
        const content = await fs.readFile(ITEM_INFO_PATH, 'latin1');
        const starts = [];
        let match;

        ITEM_START_PATTERN.lastIndex = 0;
        while ((match = ITEM_START_PATTERN.exec(content)) !== null) {
            starts.push({ id: Number(match[1]), start: match.index });
        }

        const ranges = new Map();
        for (let i = 0; i < starts.length; i++) {
            const end = i + 1 < starts.length ? starts[i + 1].start : content.length;
            ranges.set(starts[i].id, { start: starts[i].start, end });
        }

        itemRanges = ranges;
        itemInfoPath = ITEM_INFO_PATH;
        console.log(`Índice de descripciones listo: ${ranges.size} objetos desde ${ITEM_INFO_PATH}`);
    } catch (error) {
        itemRanges = new Map();
        itemInfoPath = null;
        console.warn(`No se pudo leer itemInfo para descripciones: ${error.message}`);
    }
}

function extractDescription(block, key) {
    const keyIndex = block.indexOf(`${key} = {`);
    if (keyIndex === -1) return [];

    const open = block.indexOf('{', keyIndex);
    if (open === -1) return [];

    let depth = 0;
    let inString = false;
    let escape = false;
    let i = open;

    for (; i < block.length; i++) {
        const char = block[i];
        if (inString) {
            if (escape) {
                escape = false;
            } else if (char === '\\') {
                escape = true;
            } else if (char === '"') {
                inString = false;
            }
            continue;
        }

        if (char === '"') {
            inString = true;
        } else if (char === '{') {
            depth++;
        } else if (char === '}') {
            depth--;
            if (depth === 0) break;
        }
    }

    return parseLuaStrings(block.slice(open + 1, i));
}

function parseLuaStrings(text) {
    const result = [];
    let i = 0;

    while (i < text.length) {
        if (text[i] !== '"') {
            i++;
            continue;
        }

        i++;
        let value = '';
        while (i < text.length) {
            const char = text[i];
            if (char === '\\') {
                const next = text[i + 1];
                if (next === 'n') value += '\n';
                else if (next === 't') value += '\t';
                else if (next === 'r') value += '\r';
                else if (next === '"') value += '"';
                else if (next === '\\') value += '\\';
                else if (next !== undefined) value += next;
                i += 2;
            } else if (char === '"') {
                i++;
                break;
            } else {
                value += char;
                i++;
            }
        }
        result.push(value);
    }

    return result;
}

export async function getItemDescription(id) {
    if (!itemInfoPath) return null;

    const range = itemRanges.get(id);
    if (!range) return { identified: [], unidentified: [] };

    const handle = await fs.open(itemInfoPath, 'r');
    try {
        const length = range.end - range.start;
        const buffer = Buffer.alloc(length);
        await handle.read(buffer, 0, length, range.start);
        const block = buffer.toString('latin1');

        return {
            identified: extractDescription(block, 'identifiedDescriptionName'),
            unidentified: extractDescription(block, 'unidentifiedDescriptionName')
        };
    } finally {
        await handle.close();
    }
}
