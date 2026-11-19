function clean(value: string | null | undefined): string {
  return String(value ?? '').trim();
}

function sameName(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

/** Identificadores de ítem: kRo = name_aegis (cliente), iRo = name_english (item_db). */
export function formatItemNameDetails(
  nameAegis?: string | null,
  nameEnglish?: string | null
): string | null {
  const aegis = clean(nameAegis);
  const english = clean(nameEnglish);

  if (aegis && english && !sameName(aegis, english)) {
    return `[${aegis} / ${english}]`;
  }
  if (aegis) return `[kRo: ${aegis}]`;
  if (english) return `[iRo: ${english}]`;
  return null;
}

/** Identificadores de mob: kRo = name_japanese, recurso = name_aegis. */
export function formatMobNameDetails(
  nameJapanese?: string | null,
  nameAegis?: string | null
): string | null {
  const japanese = clean(nameJapanese);
  const aegis = clean(nameAegis);

  if (japanese && aegis && !sameName(japanese, aegis)) {
    return `[${japanese} / ${aegis}]`;
  }
  if (japanese) return `[kRo: ${japanese}]`;
  if (aegis) return `[Aegis: ${aegis}]`;
  return null;
}