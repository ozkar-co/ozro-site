export const API_BASE_URL = '/api';

export interface HealthResponse {
  status: string;
}

export interface PlayersResponse {
  online: number;
}

export interface UptimeResponse {
  uptime: {
    seconds: number;
    milliseconds: number;
    formatted: string;
  };
}

export interface StatusResponse {
  timestamp: string;
  services: {
    login: { status: string };
    char: { status: string };
    map: { status: string };
  };
}

export interface StatsResponse {
  timestamp: string;
  accounts: {
    total: number;
    activeLastWeek: number;
  };
  characters: {
    total: number;
    activeLast24h: number;
    highestLevel: number;
    averageLevel: number;
    maxLevelCount: number;
  };
  guilds: {
    total: number;
  };
  economy: {
    totalZeny: string;
    bankZeny: string;
    averageZenyPerChar: number;
    averageZenyPerAccount: number;
  };
}

export interface RankingsAccountResponse {
  timestamp: string;
  cardCatalogTotal: number;
  rankings: {
    account_id: number;
    userid: string;
    logincount: number;
    total_zeny: string;
    total_cards_distinct: string;
    total_mvp_cards: string;
    total_boss_cards: string;
    total_diamonds: string;
  }[];
}

export interface CardBookResponse {
  timestamp: string;
  account: {
    account_id: number;
    userid: string;
  };
  total_owned: number;
  owned: number[];
}

export interface RankingsCharacterResponse {
  timestamp: string;
  rankings: {
    char_id: number;
    account_id: number;
    userid: string;
    name: string;
    class: number;
    base_level: number;
    base_exp: number;
    job_exp: string;
    fame: number;
  }[];
}

export interface RankingsMvpResponse {
  timestamp: string;
  rankings: {
    char_id: number;
    account_id: number;
    userid: string;
    name: string;
    class: number;
    kills: number;
    assistances: number;
  }[];
}

export interface RankingsMvpDetailResponse {
  timestamp: string;
  char_id: number;
  name: string;
  kills: number;
  assistances: number;
  entries: {
    mobId: number;
    name: string;
    nameAegis: string | null;
    kills: number;
    assistances: number;
  }[];
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  limit: number;
  results: T[];
}

export type MobSpawnType = 'permanent' | 'scripted' | 'instance' | 'event';

export interface MobSpawnMapSummary {
  map: string;
  mapName?: string;
  amount: number;
  points: number;
  boss: boolean;
  instance: boolean;
  type?: MobSpawnType | string | null;
}

export interface MobSpawnPoint {
  map: string;
  mapName?: string;
  x: number;
  y: number;
  xs: number;
  ys: number;
  amount: number;
  delay: number;
  delay2: number;
  boss: boolean;
  instance: boolean;
  spawnType?: string | null;
  spawnRoute?: string | null;
  source?: { file: string; line: number };
}

export interface MobSummon {
  mobId: number | null;
  mobAegis?: string | null;
  mobName?: string | null;
  amount: number | null;
  kind?: string | null;
  skillId?: number | null;
  skillName?: string | null;
  conditions?: Record<string, unknown> | null;
}

export interface MobSkill {
  skillId: number | null;
  skillName: string | null;
  skillLv: number | null;
  state: string | null;
  conditionType: string | null;
  conditionValue: string | null;
  rate: number | null;
  val1?: number | null;
  vals?: unknown;
}

export interface MobSummary {
  id: number;
  name: string;
  nameAegis: string;
  nameJapanese?: string | null;
  level: number | null;
  hp: number | null;
  hpBase?: number | null;
  hpStatus?: string | null;
  hpNote?: string | null;
  baseExp: number | null;
  jobExp: number | null;
  mvpExp: number | null;
  attack: number | null;
  defense: number | null;
  magicDefense: number | null;
  element: string | null;
  elementLevel: number | null;
  race: string | null;
  size: string | null;
  isMvp: boolean | null;
  class?: string | null;
  mobRole?: string | null;
  spawnMaps?: MobSpawnMapSummary[];
  spawnMapCount?: number;
  spawnAmount?: number;
  hasWorldSpawn?: boolean;
  summons?: MobSummon[];
  skills?: MobSkill[];
}

export interface MobDrop {
  itemId: number | null;
  itemName: string | null;
  itemAegis: string | null;
  itemType?: string | null;
  rate: number | null;
  baseRate?: number | null;
  type: string | null;
  chancePercent: number | null;
  rateUnit?: string | null;
}

export interface MobMetaResponse {
  elements: string[];
  races: string[];
  sizes: string[];
  classes: string[];
  roles: string[];
}

export interface MobDetail extends MobSummary {
  str?: number | null;
  agi?: number | null;
  vit?: number | null;
  int?: number | null;
  dex?: number | null;
  luk?: number | null;
  sp?: number | null;
  attack2?: number | null;
  attackRange?: number | null;
  walkSpeed?: number | null;
  attackDelay?: number | null;
  attackMotion?: number | null;
  damageMotion?: number | null;
  skillRange?: number | null;
  chaseRange?: number | null;
  damageTaken?: number | null;
  resistance?: number | null;
  magicResistance?: number | null;
  raceGroups?: string[] | null;
  title?: string | null;
  ai?: string | null;
  modes?: Record<string, boolean> | null;
  drops: MobDrop[];
  skills?: MobSkill[];
  spawns?: MobSpawnPoint[];
}

export interface ItemSummary {
  id: number;
  name: string;
  nameAegis: string;
  nameEnglish?: string | null;
  type: string;
  subtype?: string;
  attack?: number;
  magicAttack?: number;
  defense?: number;
  weight?: number;
  priceBuy?: number;
  priceSell?: number;
  slots?: number;
  equipLevelMin?: number;
  equipLevelMax?: number;
}

export interface AcquisitionOpenerItem {
  id: number;
  name: string;
  nameAegis?: string;
}

export interface AcquisitionBarterRequire {
  id: number;
  name: string;
  amount: number;
}

export interface ItemAcquisition {
  available: boolean;
  summary: Record<string, number>;
  labels?: Record<string, string>;
  dropCount?: number;
  mapDropCount?: number;
  shops: {
    shopId?: string | null;
    shopName: string;
    npcId?: string | null;
    mapId?: string | null;
    x?: number | null;
    y?: number | null;
    price?: number | null;
    runtimeMutated?: boolean;
    inventoryDeclared?: boolean | null;
    stock?: number | null;
  }[];
  shopTotal?: number;
  boxes: {
    boxId?: string | null;
    groupName?: string | null;
    algorithm?: string | null;
    chanceStatus?: string | null;
    chanceLabel?: string | null;
    chancePercent?: number | null;
    quantityMin?: number | null;
    quantityMax?: number | null;
    openers: AcquisitionOpenerItem[];
  }[];
  boxTotal?: number;
  crafting: {
    recipeId?: string;
    family?: string | null;
    skillName?: string | null;
    skillLevel?: number | null;
    amount?: number | null;
    zenyCost?: number | null;
    successStatus?: string | null;
    successLabel?: string | null;
    successPercent?: number | null;
    successVariable?: boolean;
  }[];
  barters: {
    barterName?: string | null;
    zeny?: number | null;
    refine?: number | null;
    quantity?: number;
    requires: AcquisitionBarterRequire[];
  }[];
  barterTotal?: number;
  npcRewards: {
    npcId?: string | null;
    npcName: string;
    mapId?: string | null;
    quantityMin?: number | null;
    quantityMax?: number | null;
    command?: string | null;
  }[];
  npcRewardTotal?: number;
  questDrops?: unknown[];
  mapDrops?: unknown[];
  other?: { sourceType: string; label: string; mapId?: string | null }[];
}

export interface ItemDetail extends ItemSummary {
  range?: number;
  weaponLevel?: number;
  armorLevel?: number;
  refineable?: boolean;
  gradable?: boolean;
  gender?: string;
  script?: string;
  equipScript?: string;
  unequipScript?: string;
  jobs?: { all: boolean; jobs: string[] };
  classes?: { all: boolean; classes: string[] };
  locations?: Record<string, boolean>;
  droppedBy?: {
    id: number;
    name: string;
    level: number;
    rate?: number;
    dropType?: string;
    chancePercent?: number | null;
    spawnMaps?: MobSpawnMapSummary[];
    spawnMapCount?: number;
    spawnAmount?: number;
    hasWorldSpawn?: boolean;
  }[];
  acquisition?: ItemAcquisition | null;
}

export interface ItemDescriptionResponse {
  id: number;
  identified: string[];
  unidentified: string[];
}

export type MvpState = 'dead' | 'probable' | 'alive' | 'unknown';

export interface MvpLastKill {
  at: number;
  secondsAgo: number;
  killer: string | null;
}

export interface MvpEntry {
  id: string;
  mobId: number;
  name: string;
  nameAegis: string;
  level: number;
  hp: number;
  element: string;
  elementLevel: number;
  race: string;
  size: string;
  baseExp: number;
  jobExp: number;
  mvpExp: number;
  souls: number;
  map: string;
  amount: number;
  delay: number;
  delay2: number;
  state: MvpState;
  probabilityAlive: number | null;
  windowStart: number | null;
  windowEnd: number | null;
  respawnMinSeconds: number;
  respawnMaxSeconds: number;
  lastKill: MvpLastKill | null;
  summons?: MobSummon[];
}

export interface MvpRecentKill {
  mobId: number;
  map: string;
  at: number;
  secondsAgo: number;
  killer: string | null;
}

export interface MvpRadarResponse {
  serverTime: number;
  yellowWindowSeconds: number;
  mvps: MvpEntry[];
  recentKills: MvpRecentKill[];
}

export type MobSearchParams = Record<string, string | number | undefined>;
export type ItemSearchParams = Record<string, string | number | undefined>;
export type SkillSearchParams = Record<string, string | number | undefined>;
export type NpcSearchParams = Record<string, string | number | undefined>;

export interface SkillSummary {
  id: number;
  name: string | null;
  mobCount: number;
  useCount: number;
  displayName?: string | null;
  aegisName?: string | null;
  aegisPrefix?: string | null;
  description?: string[];
  resourceName?: string | null;
  maxLv?: number | null;
  /** Job / namespace prefix from aegis (SM, WZ, NPC…). */
  type?: string | null;
  /** Combat type from skill_db (Weapon, Magic, …). */
  skillType?: string | null;
  targetType?: string | null;
  isQuest?: boolean;
  isPlatinum?: boolean;
  spAmount?: number[] | null;
  attackRange?: number[] | null;
  separateLv?: boolean | null;
  apAmount?: number[] | null;
  needSkills?: {
    skill: string | null;
    level: number | null;
    skillId?: number | null;
    displayName?: string | null;
  }[] | null;
  skillScale?: { level: number; x: number; y: number }[] | null;
}

export interface SkillMetaResponse {
  prefixes: string[];
  skillTypes: string[];
  targetTypes: string[];
}

export interface SkillDetail extends SkillSummary {
  variants?: {
    skillLv: number | null;
    state: string | null;
    conditionType: string | null;
    conditionValue: string | null;
    rate: number | null;
    entries: number;
  }[];
  mobs?: {
    id: number | null;
    name: string | null;
    nameAegis: string | null;
    uses: number;
  }[];
  itemCosts?: {
    itemId: number | null;
    itemAegisName: string | null;
    itemName: string | null;
    amount: number | null;
    level: number | null;
  }[];
  teachers?: {
    grantKind: string | null;
    npcId: string | null;
    npcName: string | null;
    mapId: string | null;
    x: number | null;
    y: number | null;
    scriptPath?: string | null;
    scriptLine?: number | null;
  }[];
  recipes?: {
    recipeId: string | null;
    family: string | null;
    skillLevel: number | null;
    resultItemId: number | null;
    resultAegisName: string | null;
    resultName: string | null;
    resultAmount: number | null;
  }[];
}

export interface NpcShopItem {
  itemId: number | null;
  name: string;
  aegisName?: string | null;
  price: number | null;
  stock: number | null;
  listIndex?: number | null;
}

export interface NpcShopLink {
  linkId: string;
  targetName: string | null;
  itemCount: number | null;
  resolveStatus: string | null;
  isRuntime?: boolean | null;
  scriptPath?: string | null;
  scriptLine?: number | null;
  shops: {
    shopId: string;
    shopName: string;
    shopType: string | null;
    shopNpcId: string | null;
  }[];
}

export interface NpcSummary {
  id: string;
  name: string;
  nameRaw?: string | null;
  type: string | null;
  mapId: string | null;
  x: number | null;
  y: number | null;
  spriteStem?: string | null;
  hasSprite?: boolean | null;
  shopCount: number;
  functionCount: number;
  questCount?: number;
  rewardCount?: number;
  teacherCount?: number;
  shopLinkCount?: number;
  scriptPath?: string | null;
}

export interface NpcDetail extends NpcSummary {
  facing?: number | null;
  scriptLine?: number | null;
  duplicateOf?: string | null;
  shops?: {
    shopId: string;
    shopName: string;
    shopType: string | null;
    mapId: string | null;
    x: number | null;
    y: number | null;
    itemCount: number | null;
    currency: string | null;
    sprite?: string | null;
    items?: NpcShopItem[];
  }[];
  functions?: string[];
  quests?: {
    linkId: string;
    questId: number | null;
    title: string | null;
    role: string | null;
    scriptPath?: string | null;
    scriptLine?: number | null;
  }[];
  rewards?: {
    rewardId: string;
    itemId: number | null;
    name: string;
    aegisName?: string | null;
    quantity: number | null;
    refine: number | null;
    deliveryKind: string | null;
    acquisitionType?: string | null;
  }[];
  teachers?: {
    teacherId: string;
    skillId: number | null;
    skillName: string | null;
    skillAegis?: string | null;
    grantKind: string | null;
    mapId?: string | null;
    x?: number | null;
    y?: number | null;
  }[];
  shopLinks?: NpcShopLink[];
  shopItemTotal?: number;
  questTotal?: number;
  rewardTotal?: number;
  teacherTotal?: number;
  shopLinkTotal?: number;
}

export interface MapSummary {
  id: string;
  name: string;
  category: string | null;
  categories: string[];
  isTown: boolean;
  isDungeon: boolean;
  isInstance: boolean;
  isQuestMap: boolean;
  isGuildMap: boolean;
  isInterior: boolean;
  isAccessible: boolean;
  width: number | null;
  height: number | null;
  hasClientResource: boolean;
  spawnSpecies: number;
  spawnAmount: number;
  spawnPoints: number;
  hasBossSpawn: boolean;
  npcCount: number;
}

export interface MapConnection {
  id: string;
  type: string | null;
  from: string | null;
  to: string | null;
  fromX: number | null;
  fromY: number | null;
  toX: number | null;
  toY: number | null;
  warpName: string | null;
  zenyCost: number | null;
}

export interface MapSpawnPoint {
  id: string;
  mobId: number | null;
  mobName: string | null;
  mobAegis: string | null;
  level: number | null;
  hp: number | null;
  amount: number;
  x: number | null;
  y: number | null;
  xArea: number | null;
  yArea: number | null;
  respawnMin: number | null;
  respawnMax: number | null;
  respawnUnit: string | null;
  boss: boolean;
  mvp: boolean;
  spawnType: string | null;
  spawnKind: string | null;
}

export interface MapNpcPoint {
  id: string;
  name: string;
  nameRaw: string | null;
  type: string | null;
  x: number | null;
  y: number | null;
  spriteStem: string | null;
  facing: number | null;
}

export interface MapDetail extends MapSummary {
  client?: unknown;
  connections?: MapConnection[];
  spawns?: MapSpawnPoint[];
  npcs?: MapNpcPoint[];
}

export interface MapMetaResponse {
  categories: string[];
  counts: {
    total: number;
    towns: number;
    dungeons: number;
    instances: number;
    questMaps: number;
  };
}

export interface MapSearchParams {
  q?: string;
  page?: number;
  limit?: number;
  category?: string;
  town?: number | boolean;
  dungeon?: number | boolean;
  instance?: number | boolean;
  quest?: number | boolean;
  hasSpawns?: number | boolean;
  hasNpcs?: number | boolean;
  accessible?: number | boolean;
}

export interface ItemMetaResponse {
  types: string[];
  armorSubtypes: string[];
  costumeSubtypes: string[];
  weaponSubtypes: string[];
  cardLocations: string[];
  shadowSubtypes: string[];
  ammoSubtypes: string[];
  acquisitionSources: string[];
  classes: string[];
  jobs: string[];
}

export interface BoxGroupItem {
  rewardId: string;
  id: number;
  name: string;
  nameAegis?: string | null;
  amount: number;
  rate?: number | null;
  subgroup?: number | null;
  algorithm?: string | null;
  chanceStatus?: string | null;
  chanceLabel?: string | null;
  chancePercent?: number | null;
}

export interface BoxGroupResponse {
  groupName: string;
  itemCount: number;
  items: BoxGroupItem[];
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

async function apiFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || body.hint || `API error ${response.status}`);
  }
  return response.json();
}

export const apiClient = {
  health: () => apiFetch<HealthResponse>('/health'),
  players: () => apiFetch<PlayersResponse>('/players'),
  stats: () => apiFetch<StatsResponse>('/stats'),
  rankingsAccounts: () => apiFetch<RankingsAccountResponse>('/rankings/accounts'),
  rankingsCharacters: () => apiFetch<RankingsCharacterResponse>('/rankings/characters'),
  rankingsMvps: () => apiFetch<RankingsMvpResponse>('/rankings/mvps'),
  rankingsMvpDetail: (charId: number | string) =>
    apiFetch<RankingsMvpDetailResponse>(`/rankings/mvps/${charId}`),
  getCardBook: (accountId: number | string) =>
    apiFetch<CardBookResponse>(`/accounts/${accountId}/card-book`),
  uptime: () => apiFetch<UptimeResponse>('/uptime'),
  status: () => apiFetch<StatusResponse>('/status'),
  mvpRadar: () => apiFetch<MvpRadarResponse>('/mvps'),

  searchMobs: (params: MobSearchParams) =>
    apiFetch<PaginatedResponse<MobDetail>>(`/mobs${buildQuery(params)}`),

  getMob: (id: number | string) => apiFetch<MobDetail>(`/mobs/${id}`),

  getMobMeta: () => apiFetch<MobMetaResponse>('/mobs/meta'),

  searchItems: (params: ItemSearchParams) =>
    apiFetch<PaginatedResponse<ItemDetail>>(`/items${buildQuery(params)}`),

  getItemMeta: () => apiFetch<ItemMetaResponse>('/items/meta'),

  getItem: (id: number | string) => apiFetch<ItemDetail>(`/items/${id}`),

  getItemDescription: (id: number | string) =>
    apiFetch<ItemDescriptionResponse>(`/items/${id}/description`),

  getBoxGroup: (groupName: string) =>
    apiFetch<BoxGroupResponse>(`/items/box-groups/${encodeURIComponent(groupName)}`),

  searchSkills: (params: SkillSearchParams) =>
    apiFetch<PaginatedResponse<SkillSummary>>(`/skills${buildQuery(params)}`),

  getSkillMeta: () => apiFetch<SkillMetaResponse>('/skills/meta'),

  getSkill: (id: number | string) => apiFetch<SkillDetail>(`/skills/${id}`),

  searchNpcs: (params: NpcSearchParams) =>
    apiFetch<PaginatedResponse<NpcSummary>>(`/npcs${buildQuery(params)}`),

  getNpc: (id: string) => apiFetch<NpcDetail>(`/npcs/${encodeURIComponent(id)}`),

  getNpcMeta: () => apiFetch<{ types: string[] }>('/npcs/meta'),

  searchMaps: (params: MapSearchParams) =>
    apiFetch<PaginatedResponse<MapSummary>>(`/maps${buildQuery(params as Record<string, string | number | undefined>)}`),

  getMap: (id: string) => apiFetch<MapDetail>(`/maps/${encodeURIComponent(id)}`),

  getMapMeta: () => apiFetch<MapMetaResponse>('/maps/meta')
};
