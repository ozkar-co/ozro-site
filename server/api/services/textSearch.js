export function tokenizeSearchQuery(q) {
    return String(q || '')
        .trim()
        .split(/\s+/)
        .filter((token) => token.length > 0);
}

export function escapeLikeFragment(term) {
    return String(term).replace(/[%_\\]/g, '\\$&');
}

/**
 * Match every token against at least one column (AND across tokens, OR across columns).
 * @param {string} alias - SQL table alias
 * @param {string[]} columns - e.g. ['m.name_english', 'm.name_aegis']
 * @param {string} term - full query string
 * @returns {{ clause: string, values: string[] } | null}
 */
export function buildTokenMatchClause(alias, columns, term) {
    const tokens = tokenizeSearchQuery(term);
    if (tokens.length === 0) return null;

    const parts = [];
    const values = [];

    for (const token of tokens) {
        const like = `%${escapeLikeFragment(token)}%`;
        const colConditions = columns.map((col) => `${col} LIKE ?`).join(' OR ');
        parts.push(`(${colConditions})`);
        for (let i = 0; i < columns.length; i++) {
            values.push(like);
        }
    }

    return {
        clause: parts.join(' AND '),
        values
    };
}

/**
 * Relevance score for ORDER BY (lower = better). Uses first column as primary display name.
 * @param {string} alias
 * @param {string[]} columns
 * @param {string} term
 * @param {string} idColumn - e.g. 'm.id'
 */
export function buildRelevanceOrderSql(alias, columns, term, idColumn) {
    const trimmed = String(term || '').trim();
    const tokens = tokenizeSearchQuery(trimmed);
    if (tokens.length === 0) return { orderSql: '', values: [] };

    const primary = columns[0];
    const primaryLower = `LOWER(${primary})`;
    const needleLower = trimmed.toLowerCase();
    const firstToken = tokens[0].toLowerCase();
    const prefixLike = `${escapeLikeFragment(firstToken)}%`;
    const containsLike = `%${escapeLikeFragment(firstToken)}%`;

    const caseParts = [
        `WHEN ${idColumn} = ? THEN 0`,
        `WHEN ${primaryLower} = ? THEN 1`,
        `WHEN ${primaryLower} LIKE ? THEN 2`,
        `WHEN ${primaryLower} LIKE ? THEN 3`
    ];
    const values = [];

    if (/^\d+$/.test(trimmed)) {
        values.push(parseInt(trimmed, 10));
    } else {
        values.push(-1);
    }
    values.push(needleLower, prefixLike, containsLike);

    for (let i = 1; i < columns.length; i++) {
        const colLower = `LOWER(${columns[i]})`;
        caseParts.push(`WHEN ${colLower} = ? THEN ${4 + i - 1}`);
        caseParts.push(`WHEN ${colLower} LIKE ? THEN ${4 + i}`);
        values.push(needleLower, containsLike);
    }

    return {
        orderSql: `CASE ${caseParts.join(' ')} ELSE 99 END, ${primary} ASC, ${idColumn} ASC`,
        values
    };
}