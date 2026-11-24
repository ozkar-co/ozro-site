/**
 * Aegis skill-name prefixes → display labels (rAthena skill_db Name prefixes).
 * Unknown prefixes fall back to the raw code.
 */
export const SKILL_PREFIX_LABELS: Record<string, string> = {
  // Novice / shared
  NV: 'Novice',
  ALL: 'All Jobs',
  WE: 'Wedding',
  GD: 'Guild',
  GM: 'GM',
  CASH: 'Cash',
  ITEM: 'Item',
  ITM: 'Item',
  RETURN: 'Return',

  // 1st class
  SM: 'Swordman',
  MG: 'Mage',
  AC: 'Archer',
  AL: 'Acolyte',
  MC: 'Merchant',
  TF: 'Thief',

  // 2nd class
  KN: 'Knight',
  PR: 'Priest',
  WZ: 'Wizard',
  BS: 'Blacksmith',
  HT: 'Hunter',
  AS: 'Assassin',
  CR: 'Crusader',
  MO: 'Monk',
  SA: 'Sage',
  RG: 'Rogue',
  AM: 'Alchemist',
  BA: 'Bard',
  DC: 'Dancer',
  BD: 'Bard / Dancer',

  // Transcendent 2nd
  LK: 'Lord Knight',
  HP: 'High Priest',
  HW: 'High Wizard',
  WS: 'Whitesmith',
  SN: 'Sniper',
  ASC: 'Assassin Cross',
  PA: 'Paladin',
  CH: 'Champion',
  PF: 'Professor',
  ST: 'Stalker',
  CG: 'Clown / Gypsy',

  // Expanded
  NJ: 'Ninja',
  GS: 'Gunslinger',
  TK: 'Taekwon',
  SG: 'Star Gladiator',
  SL: 'Soul Linker',
  KO: 'Kagerou / Oboro',
  KG: 'Kagerou',
  OB: 'Oboro',
  RL: 'Rebellion',
  SU: 'Summoner',
  SJ: 'Star Emperor',
  SP: 'Soul Reaper',

  // 3rd class
  RK: 'Rune Knight',
  WL: 'Warlock',
  RA: 'Ranger',
  AB: 'Arch Bishop',
  NC: 'Mechanic',
  GC: 'Guillotine Cross',
  LG: 'Royal Guard',
  SO: 'Sorcerer',
  MI: 'Maestro / Wanderer',
  WA: 'Wanderer',
  WM: 'Maestro / Wanderer',
  SR: 'Sura',
  GN: 'Genetic',
  SC: 'Shadow Chaser',

  // 4th class
  DK: 'Dragon Knight',
  AG: 'Arch Mage',
  WH: 'Windhawk',
  IQ: 'Inquisitor',
  MT: 'Meister',
  SHC: 'Shadow Cross',
  IG: 'Imperial Guard',
  CD: 'Cardinal',
  TR: 'Troubadour / Trouvère',
  ABC: 'Abyss Chaser',
  BO: 'Biolo',
  EM: 'Elemental Master',
  NW: 'Night Watch',
  SH: 'Spirit Handler',
  HN: 'Hyper Novice',
  SKE: 'Sky Emperor',
  SOA: 'Soul Ascetic',
  SS: 'Shinkiro / Shiranui',

  // Mercenary / Homunculus / Elemental / NPC
  MER: 'Mercenary',
  MS: 'Mercenary Swordman',
  MA: 'Mercenary Archer',
  ML: 'Mercenary Lancer',
  MH: 'Homunculus S',
  HAMI: 'Homunculus Amistr',
  HLIF: 'Homunculus Lif',
  HFLI: 'Homunculus Filir',
  HVAN: 'Homunculus Vanilmirth',
  ABR: 'Abracas',
  EL: 'Elemental',
  NPC: 'NPC / Monster',
  ECL: 'Eclage',
  ECLAGE: 'Eclage'
};

export function skillPrefixLabel(prefix: string | null | undefined): string | null {
  if (!prefix) return null;
  const key = String(prefix).trim().toUpperCase();
  if (!key) return null;
  return SKILL_PREFIX_LABELS[key] || key;
}
