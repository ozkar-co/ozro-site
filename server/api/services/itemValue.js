function numberOrNull(value) {
    if (value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

export function npcValue(item) {
    if (!item || Number(item.trade_nosell) === 1) return 0;

    let buy = numberOrNull(item.price_buy);
    let sell = numberOrNull(item.price_sell);

    if (buy === null && sell !== null) buy = sell * 2;
    if (sell === null && buy !== null) sell = Math.floor(buy / 2);

    if (buy === null) buy = 0;
    if (sell === null) sell = 0;

    if (buy / 124 < sell / 75) sell = 1;
    return sell > 0 ? sell : 0;
}

export function garrettValue(item) {
    return null;
}

export function tasadorValue(item) {
    return null;
}

export function bestItemValue(item) {
    const sources = [
        { source: 'npc', value: npcValue(item) },
        { source: 'garrett', value: garrettValue(item) },
        { source: 'tasador', value: tasadorValue(item) }
    ].filter((entry) => entry.value !== null && entry.value > 0);

    if (sources.length === 0) {
        return { value: 0, source: null };
    }

    sources.sort((a, b) => b.value - a.value);
    return sources[0];
}
