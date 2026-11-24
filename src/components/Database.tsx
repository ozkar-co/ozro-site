import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Maps from './Maps';
import Mvps from './Mvps';
import ItemCard, { SearchResult } from './ItemCard';
import MobCard, { MobResult } from './MobCard';
import SkillCard, { type SkillResult } from './SkillCard';
import NpcCard, { type NpcResult } from './NpcCard';
import '../styles/Database.css';
import { apiClient } from '../api/client';
import { hasManifestSprite, loadManifest, resolveSprite, type SpriteRect } from '../api/assets';
import {
  PLACEHOLDER_ITEM_ICON,
  PLACEHOLDER_ITEM_ILLUSTRATION,
  PLACEHOLDER_MOB_SPRITE
} from '../api/placeholders';
import {
  buildItemSearchParams,
  buildMobSearchParams,
  formatFilterLabel,
  ITEM_TYPE_AMMO,
  ITEM_TYPE_ARMOR,
  ITEM_TYPE_CARD,
  ITEM_TYPE_COSTUME,
  ITEM_TYPE_SHADOWGEAR,
  ITEM_TYPE_WEAPON,
  mapItemToCard,
  mapMobToCard,
  SearchOptions,
  defaultSearchOptions
} from '../api/databaseMappers';
import {
  buildDatabaseSearchParams,
  getLegacyDeepLinkId,
  hasSearchCriteria,
  parseDatabaseUrl,
  type DatabaseTab
} from '../api/databaseUrl';

type TabType = DatabaseTab;

type ItemResult = SearchResult & { hasSprite?: boolean };
type MobResultRow = MobResult & { hasSprite?: boolean };

interface SearchState {
  total: number;
  currentPage: number;
  results: (ItemResult | MobResultRow | SkillResult | NpcResult)[];
  totalPages: number;
}

const RESULTS_PER_PAGE = 10;

const emptySearchState = (): SearchState => ({
  total: 0,
  currentPage: 0,
  results: [],
  totalPages: 0
});

const Database = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>('items');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [imagesReady, setImagesReady] = useState(false);
  const [searchState, setSearchState] = useState<SearchState>(emptySearchState);
  const [resultsTab, setResultsTab] = useState<TabType>('items');
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [searchOptions, setSearchOptions] = useState<SearchOptions>(defaultSearchOptions());
  const [armorSubtypes, setArmorSubtypes] = useState<string[]>([]);
  const [weaponSubtypes, setWeaponSubtypes] = useState<string[]>([]);
  const [cardLocations, setCardLocations] = useState<string[]>([]);
  const [shadowSubtypes, setShadowSubtypes] = useState<string[]>([]);
  const [ammoSubtypes, setAmmoSubtypes] = useState<string[]>([]);
  const [costumeSubtypes, setCostumeSubtypes] = useState<string[]>([]);
  const [jobFilters, setJobFilters] = useState<string[]>([]);
  const [classFilters, setClassFilters] = useState<string[]>([]);
  const [acquisitionSources, setAcquisitionSources] = useState<string[]>([]);
  const [itemTypeFilters, setItemTypeFilters] = useState<string[]>([]);
  const [itemMetaError, setItemMetaError] = useState<string | null>(null);
  const [itemMetaLoading, setItemMetaLoading] = useState(false);
  const [mobElements, setMobElements] = useState<string[]>([]);
  const [mobRaces, setMobRaces] = useState<string[]>([]);
  const [mobSizes, setMobSizes] = useState<string[]>([]);
  const [mobMetaError, setMobMetaError] = useState<string | null>(null);
  const [mobMetaLoading, setMobMetaLoading] = useState(false);
  const searchOptionsRef = useRef(searchOptions);
  const searchOptionsPanelRef = useRef<HTMLDivElement>(null);

  searchOptionsRef.current = searchOptions;

  const navigateToSearch = useCallback((
    tab: TabType,
    q: string,
    page: number,
    options: SearchOptions,
    run = false,
    replace = false
  ) => {
    const params = buildDatabaseSearchParams(tab, q, page, options, run);
    navigate({ pathname: '/database', search: params.toString() }, { replace });
  }, [navigate]);

  useEffect(() => {
    const legacy = getLegacyDeepLinkId(location.search);
    if (legacy) {
      navigateToSearch(legacy.tab, legacy.q, 0, defaultSearchOptions(), true, true);
    }
  }, [location.search, navigateToSearch]);

  useEffect(() => {
    if (activeTab !== 'items') return;
    let cancelled = false;
    setItemMetaLoading(true);
    setItemMetaError(null);
    apiClient.getItemMeta()
      .then((meta) => {
        if (cancelled) return;
        const metaTypes = (meta.types || [])
          .map((t) => (t === 'Delayconsume' ? 'DelayConsume' : t))
          .filter((t) => t && t !== 'Armor2');
        if (metaTypes.length === 0) {
          throw new Error('items/meta: types vacío (sin fallback)');
        }
        if (!Array.isArray(meta.armorSubtypes) || !Array.isArray(meta.costumeSubtypes)
          || !Array.isArray(meta.weaponSubtypes) || !Array.isArray(meta.cardLocations)
          || !Array.isArray(meta.shadowSubtypes) || !Array.isArray(meta.ammoSubtypes)
          || !Array.isArray(meta.acquisitionSources) || !Array.isArray(meta.jobs)
          || !Array.isArray(meta.classes)) {
          throw new Error(
            'items/meta incompleto: faltan listas de filtros (armor/costume/weapon/card/shadow/ammo/acquisition/jobs/classes)'
          );
        }
        setArmorSubtypes(meta.armorSubtypes);
        setCostumeSubtypes(meta.costumeSubtypes);
        setWeaponSubtypes(meta.weaponSubtypes);
        setCardLocations(meta.cardLocations);
        setShadowSubtypes(meta.shadowSubtypes);
        setAmmoSubtypes(meta.ammoSubtypes);
        setAcquisitionSources(meta.acquisitionSources);
        setJobFilters(meta.jobs);
        setClassFilters(meta.classes);
        setItemTypeFilters(metaTypes);
        setItemMetaError(null);
      })
      .catch((error: Error) => {
        if (cancelled) return;
        console.error('Fallo cargando items/meta', error);
        setArmorSubtypes([]);
        setCostumeSubtypes([]);
        setWeaponSubtypes([]);
        setCardLocations([]);
        setShadowSubtypes([]);
        setAmmoSubtypes([]);
        setAcquisitionSources([]);
        setJobFilters([]);
        setClassFilters([]);
        setItemTypeFilters([]);
        setItemMetaError(error?.message || String(error));
      })
      .finally(() => {
        if (!cancelled) setItemMetaLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'mobs') return;
    let cancelled = false;
    setMobMetaLoading(true);
    setMobMetaError(null);
    apiClient.getMobMeta()
      .then((meta) => {
        if (cancelled) return;
        if (!Array.isArray(meta.elements) || meta.elements.length === 0
          || !Array.isArray(meta.races) || meta.races.length === 0
          || !Array.isArray(meta.sizes) || meta.sizes.length === 0) {
          throw new Error('mobs/meta incompleto: elements/races/sizes vacío (sin fallback)');
        }
        setMobElements(meta.elements);
        setMobRaces(meta.races);
        setMobSizes(meta.sizes);
        setMobMetaError(null);
      })
      .catch((error: Error) => {
        if (cancelled) return;
        console.error('Fallo cargando mobs/meta', error);
        setMobElements([]);
        setMobRaces([]);
        setMobSizes([]);
        setMobMetaError(error?.message || String(error));
      })
      .finally(() => {
        if (!cancelled) setMobMetaLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  useEffect(() => {
    loadManifest()
      .then(() => setImagesReady(true))
      .catch(() => setImagesReady(true));
  }, []);

  const getImage = useCallback(async (
    id: string,
    type: 'icons' | 'illustrations' | 'sprites'
  ): Promise<SpriteRect | string> => {
    const category = type === 'sprites'
      ? 'mobs/sprites'
      : type === 'icons'
        ? 'items/icons'
        : 'items/illustrations';
    const sprite = await resolveSprite(id, category);
    if (sprite) return sprite;
    if (type === 'icons') return PLACEHOLDER_ITEM_ICON;
    if (type === 'illustrations') return PLACEHOLDER_ITEM_ILLUSTRATION;
    return PLACEHOLDER_MOB_SPRITE;
  }, []);

  const enrichMobResults = useCallback(async (mobs: MobResult[]): Promise<MobResultRow[]> => {
    return Promise.all(mobs.map(async (mob) => {
      const spriteResolved = await resolveSprite(mob.id, 'mobs/sprites');
      const sprite = spriteResolved ?? PLACEHOLDER_MOB_SPRITE;
      const hasSprite = hasManifestSprite(spriteResolved);
      const drop = await Promise.all(
        (mob.drop || []).map(async (entry) => ({
          ...entry,
          itemIcon: entry.id ? await getImage(String(entry.id), 'icons') : PLACEHOLDER_ITEM_ICON
        }))
      );
      return { ...mob, sprite, drop, hasSprite };
    }));
  }, [getImage]);

  const enrichItemResults = useCallback(async (items: SearchResult[]): Promise<ItemResult[]> => {
    return Promise.all(items.map(async (item) => {
      const iconResolved = await resolveSprite(item.id, 'items/icons');
      const illustrationResolved = await resolveSprite(item.id, 'items/illustrations');
      const icon = iconResolved ?? PLACEHOLDER_ITEM_ICON;
      // Never fall back to the 24×24 inventory icon in the illustration slot —
      // that reads as a broken/wrong connection. Use the illustration placeholder instead.
      const illustration = illustrationResolved ?? PLACEHOLDER_ITEM_ILLUSTRATION;
      const hasSprite = hasManifestSprite(illustrationResolved ?? iconResolved);
      return { ...item, icon, illustration, hasSprite };
    }));
  }, []);

  const fetchSearchResults = useCallback(async (
    tab: TabType,
    term: string,
    options: SearchOptions,
    page: number
  ) => {
    const trimmed = term.trim();
    const isIdLookup = /^\d+$/.test(trimmed);

    if (tab === 'skills') {
      if (isIdLookup) {
        const skill = await apiClient.getSkill(parseInt(trimmed, 10)).catch(() => null);
        if (!skill) {
          return { total: 0, currentPage: 0, results: [], totalPages: 0 };
        }
        return { total: 1, currentPage: 0, results: [skill], totalPages: 1 };
      }
      const data = await apiClient.searchSkills({
        q: trimmed || undefined,
        page: page + 1,
        limit: RESULTS_PER_PAGE
      });
      return {
        total: data.total,
        currentPage: page,
        results: data.results,
        totalPages: Math.max(1, Math.ceil(data.total / RESULTS_PER_PAGE))
      };
    }

    if (tab === 'npcs') {
      if (/^npc_[0-9a-f]+$/i.test(trimmed)) {
        const npc = await apiClient.getNpc(trimmed).catch(() => null);
        if (!npc) {
          return { total: 0, currentPage: 0, results: [], totalPages: 0 };
        }
        return { total: 1, currentPage: 0, results: [npc], totalPages: 1 };
      }
      const data = await apiClient.searchNpcs({
        q: trimmed || undefined,
        page: page + 1,
        limit: RESULTS_PER_PAGE
      });
      return {
        total: data.total,
        currentPage: page,
        results: data.results,
        totalPages: Math.max(1, Math.ceil(data.total / RESULTS_PER_PAGE))
      };
    }

    if (tab === 'mobs') {
      if (isIdLookup) {
        const mob = await apiClient.getMob(parseInt(trimmed, 10)).catch(() => null);
        if (!mob) {
          return { total: 0, currentPage: 0, results: [], totalPages: 0 };
        }
        let results = [mapMobToCard(mob)];
        if (imagesReady) {
          results = await enrichMobResults(results);
        }
        return { total: 1, currentPage: 0, results, totalPages: 1 };
      }

      const params = buildMobSearchParams(term, options, page, RESULTS_PER_PAGE);
      const data = await apiClient.searchMobs(params);
      let results = data.results.map((mob) => mapMobToCard(mob));
      if (imagesReady) {
        results = await enrichMobResults(results);
      }
      return {
        total: data.total,
        currentPage: page,
        results,
        totalPages: Math.max(1, Math.ceil(data.total / RESULTS_PER_PAGE))
      };
    }

    if (isIdLookup) {
      const item = await apiClient.getItem(parseInt(trimmed, 10)).catch(() => null);
      if (!item) {
        return { total: 0, currentPage: 0, results: [], totalPages: 0 };
      }
      let results = [mapItemToCard(item)];
      if (imagesReady) {
        results = await enrichItemResults(results);
      }
      return { total: 1, currentPage: 0, results, totalPages: 1 };
    }

    const params = buildItemSearchParams(term, options, page, RESULTS_PER_PAGE);
    const data = await apiClient.searchItems(params);
    let results = data.results.map((item) => mapItemToCard(item));
    if (imagesReady) {
      results = await enrichItemResults(results);
    }
    return {
      total: data.total,
      currentPage: page,
      results,
      totalPages: Math.max(1, Math.ceil(data.total / RESULTS_PER_PAGE))
    };
  }, [enrichItemResults, enrichMobResults, imagesReady]);

  useEffect(() => {
    if (getLegacyDeepLinkId(location.search)) return;

    const urlState = parseDatabaseUrl(location.search);
    const { tab, q, page, options } = urlState;

    setActiveTab(tab);
    setSearchTerm(q);
    setSearchOptions(options);

    if (tab === 'maps' || tab === 'mvps') {
      setSearchState(emptySearchState());
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    if (!hasSearchCriteria(urlState)) {
      setSearchState(emptySearchState());
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    if (!imagesReady) {
      setIsSearching(true);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    setSearchError(null);
    setSearchState(emptySearchState());

    fetchSearchResults(tab, q, options, page)
      .then((state) => {
        if (!cancelled) {
          setResultsTab(tab);
          setSearchState(state);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setSearchError(error instanceof Error ? error.message : 'Error al buscar');
          setSearchState(emptySearchState());
        }
      })
      .finally(() => {
        if (!cancelled) setIsSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [location.search, fetchSearchResults, imagesReady]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    closeOptionsPanel();
    navigateToSearch(activeTab, searchTerm, 0, searchOptions, true);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 0 || newPage >= searchState.totalPages) return;
    navigateToSearch(activeTab, searchTerm, newPage, searchOptions, true);
    document.querySelector('.results-section')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeOptionsPanel = useCallback(() => {
    if (!isOptionsVisible) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsOptionsVisible(false);
      setIsClosing(false);
    }, 300);
  }, [isOptionsVisible]);

  const handleOptionsToggle = () => {
    if (isOptionsVisible) {
      closeOptionsPanel();
    } else {
      setIsOptionsVisible(true);
      setIsClosing(false);
    }
  };

  const handleClearFilters = () => {
    const fresh = defaultSearchOptions();
    setSearchOptions(fresh);
    setSearchTerm('');
    setSearchState(emptySearchState());
    setSearchError(null);
    navigate({ pathname: '/database', search: `tab=${activeTab}` });
  };

  const handleTabChange = (tab: TabType) => {
    setSearchOptions(defaultSearchOptions());
    setSearchError(null);
    setIsOptionsVisible(false);
    setIsClosing(false);
    setActiveTab(tab);
    navigate({ pathname: '/database', search: `tab=${tab}` });
  };

  return (
    <div className="database">
      <Header />
      <div className="database-content">
        <div className="database-tabs">
          <button
            className={`tab-button ${activeTab === 'items' ? 'active' : ''}`}
            onClick={() => handleTabChange('items')}
          >
            Objetos
          </button>
          <button
            className={`tab-button ${activeTab === 'mobs' ? 'active' : ''}`}
            onClick={() => handleTabChange('mobs')}
          >
            Monstruos
          </button>
          <button
            className={`tab-button ${activeTab === 'skills' ? 'active' : ''}`}
            onClick={() => handleTabChange('skills')}
          >
            Skills
          </button>
          <button
            className={`tab-button ${activeTab === 'npcs' ? 'active' : ''}`}
            onClick={() => handleTabChange('npcs')}
          >
            NPCs
          </button>
          <button
            className={`tab-button ${activeTab === 'maps' ? 'active' : ''}`}
            onClick={() => handleTabChange('maps')}
          >
            Mapas
          </button>
          <button
            className={`tab-button ${activeTab === 'mvps' ? 'active' : ''}`}
            onClick={() => handleTabChange('mvps')}
          >
            MVPs
          </button>
        </div>
        <div className={`database-container${activeTab === 'maps' || activeTab === 'mvps' ? ' database-embed' : ''}`}>
          {activeTab === 'maps' || activeTab === 'mvps' ? (
            activeTab === 'maps' ? <Maps /> : <Mvps />
          ) : (
            <>
          <div className="search-section">
            <div className="search-container">
              <form onSubmit={handleSearch} className="search-form">
                <div className="form-group">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={
                      activeTab === 'items'
                        ? 'Buscar por nombre o ID del objeto...'
                        : activeTab === 'mobs'
                          ? 'Buscar por nombre o ID del monstruo...'
                          : activeTab === 'skills'
                            ? 'Buscar skill por nombre o ID...'
                            : 'Buscar NPC por nombre, mapa o ID...'
                    }
                    className="search-input"
                  />
                  <button type="submit" className="search-button" disabled={isSearching}>
                    {isSearching ? 'Buscando...' : 'Buscar'}
                  </button>
                </div>
              </form>
              <div className="search-options-container" ref={searchOptionsPanelRef}>
                {(activeTab === 'items' || activeTab === 'mobs') && (
                <button className="search-options-toggle" onClick={handleOptionsToggle}>
                  <i className={`arrow-icon ${isOptionsVisible ? 'up' : 'down'}`}></i>
                </button>
                )}
                {isOptionsVisible && (activeTab === 'items' || activeTab === 'mobs') && (
                  <div className={`search-options-panel ${isClosing ? 'closing' : ''}`}>
                    {activeTab === 'items' ? (
                      <>
                        <div className="search-types">
                          <div className="search-types-title">Filtrar por tipo:</div>
                          <div className="search-types-grid">
                            {itemTypeFilters.map((typeName) => (
                              <label key={typeName} className="type-checkbox">
                                <input
                                  type="checkbox"
                                  checked={searchOptions.selectedTypes.includes(typeName)}
                                  onChange={() => setSearchOptions((prev) => {
                                    const selected = prev.selectedTypes.includes(typeName);
                                    const selectedTypes = selected
                                      ? prev.selectedTypes.filter((t) => t !== typeName)
                                      : [...prev.selectedTypes, typeName];
                                    return {
                                      ...prev,
                                      selectedTypes,
                                      selectedArmorSubtypes: typeName === ITEM_TYPE_ARMOR && selected
                                        ? []
                                        : prev.selectedArmorSubtypes,
                                      selectedWeaponSubtypes: typeName === ITEM_TYPE_WEAPON && selected
                                        ? []
                                        : prev.selectedWeaponSubtypes,
                                      selectedCardLocations: typeName === ITEM_TYPE_CARD && selected
                                        ? []
                                        : prev.selectedCardLocations,
                                      selectedShadowSubtypes: typeName === ITEM_TYPE_SHADOWGEAR && selected
                                        ? []
                                        : prev.selectedShadowSubtypes,
                                      selectedAmmoSubtypes: typeName === ITEM_TYPE_AMMO && selected
                                        ? []
                                        : prev.selectedAmmoSubtypes,
                                      selectedCostumeSubtypes: typeName === ITEM_TYPE_COSTUME && selected
                                        ? []
                                        : prev.selectedCostumeSubtypes
                                    };
                                  })}
                                />
                                {formatFilterLabel(typeName)}
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="search-filter-columns">
                        {searchOptions.selectedTypes.includes(ITEM_TYPE_ARMOR) && armorSubtypes.length > 0 && (
                          <div className="search-types search-types--column">
                            <div className="search-types-title">Slot de armadura:</div>
                            <select
                              className="search-filter-select"
                              multiple
                              size={Math.min(8, armorSubtypes.length)}
                              value={searchOptions.selectedArmorSubtypes}
                              onChange={(e) => {
                                const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
                                setSearchOptions((prev) => ({ ...prev, selectedArmorSubtypes: selected }));
                              }}
                            >
                              {armorSubtypes.map((subtype) => (
                                <option key={subtype} value={subtype}>
                                  {formatFilterLabel(subtype)}
                                </option>
                              ))}
                            </select>
                            <div className="search-filter-hint">Ctrl+clic para varios</div>
                          </div>
                        )}
                        {searchOptions.selectedTypes.includes(ITEM_TYPE_COSTUME) && costumeSubtypes.length > 0 && (
                          <div className="search-types search-types--column">
                            <div className="search-types-title">Slot de costume:</div>
                            <select
                              className="search-filter-select"
                              multiple
                              size={Math.min(8, costumeSubtypes.length)}
                              value={searchOptions.selectedCostumeSubtypes}
                              onChange={(e) => {
                                const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
                                setSearchOptions((prev) => ({ ...prev, selectedCostumeSubtypes: selected }));
                              }}
                            >
                              {costumeSubtypes.map((subtype) => (
                                <option key={subtype} value={subtype}>
                                  {formatFilterLabel(subtype)}
                                </option>
                              ))}
                            </select>
                            <div className="search-filter-hint">Ctrl+clic para varios</div>
                          </div>
                        )}
                        {searchOptions.selectedTypes.includes(ITEM_TYPE_WEAPON) && weaponSubtypes.length > 0 && (
                          <div className="search-types search-types--column">
                            <div className="search-types-title">Subtipo de arma:</div>
                            <select
                              className="search-filter-select"
                              multiple
                              size={Math.min(8, weaponSubtypes.length)}
                              value={searchOptions.selectedWeaponSubtypes}
                              onChange={(e) => {
                                const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
                                setSearchOptions((prev) => ({ ...prev, selectedWeaponSubtypes: selected }));
                              }}
                            >
                              {weaponSubtypes.map((subtype) => (
                                <option key={subtype} value={subtype}>
                                  {formatFilterLabel(subtype)}
                                </option>
                              ))}
                            </select>
                            <div className="search-filter-hint">Ctrl+clic para varios</div>
                          </div>
                        )}
                        {searchOptions.selectedTypes.includes(ITEM_TYPE_CARD) && cardLocations.length > 0 && (
                          <div className="search-types search-types--column">
                            <div className="search-types-title">Inserción de carta:</div>
                            <select
                              className="search-filter-select"
                              multiple
                              size={Math.min(8, cardLocations.length)}
                              value={searchOptions.selectedCardLocations}
                              onChange={(e) => {
                                const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
                                setSearchOptions((prev) => ({ ...prev, selectedCardLocations: selected }));
                              }}
                            >
                              {cardLocations.map((key) => (
                                <option key={key} value={key}>{formatFilterLabel(key)}</option>
                              ))}
                            </select>
                            <div className="search-filter-hint">Ctrl+clic para varios</div>
                          </div>
                        )}
                        {searchOptions.selectedTypes.includes(ITEM_TYPE_SHADOWGEAR) && shadowSubtypes.length > 0 && (
                          <div className="search-types search-types--column">
                            <div className="search-types-title">Slot shadow:</div>
                            <select
                              className="search-filter-select"
                              multiple
                              size={Math.min(8, shadowSubtypes.length)}
                              value={searchOptions.selectedShadowSubtypes}
                              onChange={(e) => {
                                const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
                                setSearchOptions((prev) => ({ ...prev, selectedShadowSubtypes: selected }));
                              }}
                            >
                              {shadowSubtypes.map((subtype) => (
                                <option key={subtype} value={subtype}>
                                  {formatFilterLabel(subtype)}
                                </option>
                              ))}
                            </select>
                            <div className="search-filter-hint">Ctrl+clic para varios</div>
                          </div>
                        )}
                        {searchOptions.selectedTypes.includes(ITEM_TYPE_AMMO) && ammoSubtypes.length > 0 && (
                          <div className="search-types search-types--column">
                            <div className="search-types-title">Subtipo de munición:</div>
                            <select
                              className="search-filter-select"
                              multiple
                              size={Math.min(8, ammoSubtypes.length)}
                              value={searchOptions.selectedAmmoSubtypes}
                              onChange={(e) => {
                                const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
                                setSearchOptions((prev) => ({ ...prev, selectedAmmoSubtypes: selected }));
                              }}
                            >
                              {ammoSubtypes.map((subtype) => (
                                <option key={subtype} value={subtype}>
                                  {formatFilterLabel(subtype)}
                                </option>
                              ))}
                            </select>
                            <div className="search-filter-hint">Ctrl+clic para varios</div>
                          </div>
                        )}
                        {jobFilters.length > 0 && (
                          <div className="search-types search-types--column">
                            <div className="search-types-title">Jobs:</div>
                            <select
                              className="search-filter-select"
                              multiple
                              size={Math.min(8, jobFilters.length)}
                              value={searchOptions.selectedJobs}
                              onChange={(e) => {
                                const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
                                setSearchOptions((prev) => ({ ...prev, selectedJobs: selected }));
                              }}
                            >
                              {jobFilters.map((job) => (
                                <option key={job} value={job}>{formatFilterLabel(job)}</option>
                              ))}
                            </select>
                            <div className="search-filter-hint">Ctrl+clic para varios</div>
                          </div>
                        )}
                        {classFilters.length > 0 && (
                          <div className="search-types search-types--column">
                            <div className="search-types-title">Clases:</div>
                            <select
                              className="search-filter-select"
                              multiple
                              size={Math.min(8, classFilters.length)}
                              value={searchOptions.selectedClasses}
                              onChange={(e) => {
                                const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
                                setSearchOptions((prev) => ({ ...prev, selectedClasses: selected }));
                              }}
                            >
                              {classFilters.map((cls) => (
                                <option key={cls} value={cls}>{formatFilterLabel(cls)}</option>
                              ))}
                            </select>
                            <div className="search-filter-hint">Ctrl+clic para varios</div>
                          </div>
                        )}
                        </div>
                        <div className="search-types">
                          <div className="search-types-title">Texto en script del objeto:</div>
                          <input
                            type="text"
                            className="search-filter-input"
                            value={searchOptions.scriptQuery}
                            onChange={(e) => setSearchOptions((prev) => ({
                              ...prev,
                              scriptQuery: e.target.value
                            }))}
                            placeholder="Ej: bonus bStr, heal"
                          />
                        </div>
                        {itemMetaLoading && (
                          <div className="search-meta-status">Cargando filtros desde ozro_items…</div>
                        )}
                        {itemMetaError && (
                          <div className="search-meta-error" role="alert">
                            <strong>Meta de filtros falló (sin fallback):</strong>
                            <div>{itemMetaError}</div>
                          </div>
                        )}
                        {acquisitionSources.length > 0 && (
                          <div className="search-types">
                            <div className="search-types-title">Obtención (tiene fuente):</div>
                            <div className="search-types-grid">
                              {acquisitionSources.map((sourceId) => (
                                <label key={sourceId} className="type-checkbox">
                                  <input
                                    type="checkbox"
                                    checked={searchOptions.selectedAcquisitionSources.includes(sourceId)}
                                    onChange={() => setSearchOptions((prev) => {
                                      const selected = prev.selectedAcquisitionSources.includes(sourceId);
                                      const selectedAcquisitionSources = selected
                                        ? prev.selectedAcquisitionSources.filter((id) => id !== sourceId)
                                        : [...prev.selectedAcquisitionSources, sourceId];
                                      const nonDropSelected = selectedAcquisitionSources.some(
                                        (id) => id !== 'mob_drop' && id !== 'map_drop'
                                      );
                                      return {
                                        ...prev,
                                        selectedAcquisitionSources,
                                        hideItemsWithoutNaturalDrop: nonDropSelected
                                          ? false
                                          : prev.hideItemsWithoutNaturalDrop
                                      };
                                    })}
                                  />
                                  {formatFilterLabel(sourceId)}
                                </label>
                              ))}
                            </div>
                            <div className="search-filter-hint">
                              Varios = OR (cualquiera de las fuentes)
                            </div>
                          </div>
                        )}
                        <div className="search-types">
                          <div className="search-types-title">Fuente de obtención:</div>
                          <div className="search-types-grid">
                            <label className="type-checkbox">
                              <input
                                type="checkbox"
                                checked={searchOptions.hideItemsWithoutNaturalDrop}
                                onChange={() => setSearchOptions((prev) => ({
                                  ...prev,
                                  hideItemsWithoutNaturalDrop: !prev.hideItemsWithoutNaturalDrop
                                }))}
                              />
                              Ocultar sin drop natural
                            </label>
                            <label className="type-checkbox">
                              <input
                                type="checkbox"
                                checked={searchOptions.hideWithoutSprite}
                                onChange={() => setSearchOptions((prev) => ({
                                  ...prev,
                                  hideWithoutSprite: !prev.hideWithoutSprite
                                }))}
                              />
                              Vista reducida sin sprite
                            </label>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="search-types">
                          <div className="search-types-title">Tipo de monstruo:</div>
                          <div className="search-types-grid">
                            <label className="type-checkbox">
                              <input
                                type="checkbox"
                                checked={searchOptions.showNormal}
                                onChange={() => setSearchOptions((p) => ({ ...p, showNormal: !p.showNormal }))}
                              />
                              Monstruos Normales
                            </label>
                            <label className="type-checkbox">
                              <input
                                type="checkbox"
                                checked={searchOptions.showBoss}
                                onChange={() => setSearchOptions((p) => ({ ...p, showBoss: !p.showBoss }))}
                              />
                              Monstruos Boss
                            </label>
                            <label className="type-checkbox">
                              <input
                                type="checkbox"
                                checked={searchOptions.showMvp}
                                onChange={() => setSearchOptions((p) => ({ ...p, showMvp: !p.showMvp }))}
                              />
                              Monstruos MVP
                            </label>
                          </div>
                        </div>
                        <div className="search-types">
                          <div className="search-types-title">Spawn:</div>
                          <div className="search-types-grid">
                            <label className="type-checkbox">
                              <input
                                type="checkbox"
                                checked={searchOptions.hideMobsWithoutSpawn}
                                onChange={() => setSearchOptions((p) => ({
                                  ...p,
                                  hideMobsWithoutSpawn: !p.hideMobsWithoutSpawn
                                }))}
                              />
                              Ocultar sin spawn
                            </label>
                            <label className="type-checkbox">
                              <input
                                type="checkbox"
                                checked={searchOptions.includeInstanceSpawns}
                                onChange={() => setSearchOptions((p) => ({
                                  ...p,
                                  includeInstanceSpawns: !p.includeInstanceSpawns
                                }))}
                                disabled={!searchOptions.hideMobsWithoutSpawn}
                              />
                              Incluir instancias
                            </label>
                          </div>
                        </div>
                        {mobMetaLoading && (
                          <div className="search-meta-status">Cargando filtros desde ozro_mobs…</div>
                        )}
                        {mobMetaError && (
                          <div className="search-meta-error" role="alert">
                            <strong>Meta de monstruos falló (sin fallback):</strong>
                            <div>{mobMetaError}</div>
                          </div>
                        )}
                        {mobElements.length > 0 && (
                          <div className="search-types">
                            <div className="search-types-title">Filtrar por elemento:</div>
                            <div className="search-types-grid">
                              {mobElements.map((element) => (
                                <label key={element} className="type-checkbox">
                                  <input
                                    type="checkbox"
                                    checked={searchOptions.selectedElements.includes(element)}
                                    onChange={() => setSearchOptions((prev) => ({
                                      ...prev,
                                      selectedElements: prev.selectedElements.includes(element)
                                        ? prev.selectedElements.filter((e) => e !== element)
                                        : [...prev.selectedElements, element]
                                    }))}
                                  />
                                  {formatFilterLabel(element)}
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                        {mobRaces.length > 0 && (
                          <div className="search-types">
                            <div className="search-types-title">Filtrar por raza:</div>
                            <div className="search-types-grid">
                              {mobRaces.map((race) => (
                                <label key={race} className="type-checkbox">
                                  <input
                                    type="checkbox"
                                    checked={searchOptions.selectedRaces.includes(race)}
                                    onChange={() => setSearchOptions((prev) => ({
                                      ...prev,
                                      selectedRaces: prev.selectedRaces.includes(race)
                                        ? prev.selectedRaces.filter((r) => r !== race)
                                        : [...prev.selectedRaces, race]
                                    }))}
                                  />
                                  {formatFilterLabel(race)}
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                        {mobSizes.length > 0 && (
                          <div className="search-types">
                            <div className="search-types-title">Filtrar por tamaño:</div>
                            <div className="search-types-grid">
                              {mobSizes.map((size) => (
                                <label key={size} className="type-checkbox">
                                  <input
                                    type="checkbox"
                                    checked={searchOptions.selectedSizes.includes(size)}
                                    onChange={() => setSearchOptions((prev) => ({
                                      ...prev,
                                      selectedSizes: prev.selectedSizes.includes(size)
                                        ? prev.selectedSizes.filter((s) => s !== size)
                                        : [...prev.selectedSizes, size]
                                    }))}
                                  />
                                  {formatFilterLabel(size)}
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="search-types">
                          <div className="search-types-title">Sprites (cliente):</div>
                          <div className="search-types-grid">
                            <label className="type-checkbox">
                              <input
                                type="checkbox"
                                checked={searchOptions.hideWithoutSprite}
                                onChange={() => setSearchOptions((prev) => ({
                                  ...prev,
                                  hideWithoutSprite: !prev.hideWithoutSprite
                                }))}
                              />
                              Vista reducida sin sprite
                            </label>
                          </div>
                        </div>
                      </>
                    )}
                    <div className="search-filter-actions">
                      <button
                        type="button"
                        className="search-action-button"
                        onClick={handleClearFilters}
                      >
                        Limpiar filtros
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="results-section">
            {searchError && (
              <div className="no-results">{searchError}</div>
            )}
            {!searchError && isSearching && searchState.results.length === 0 && (
              <div className="loading-results">Cargando resultados...</div>
            )}
            {!searchError && !isSearching && searchState.results.length > 0 && resultsTab === activeTab ? (
              <>
                <div className="results-grid">
                  {searchState.results.map((result) => {
                    if (activeTab === 'skills') {
                      const skill = result as SkillResult;
                      return <SkillCard key={skill.id} result={skill} />;
                    }
                    if (activeTab === 'npcs') {
                      const npc = result as NpcResult;
                      return <NpcCard key={npc.id} result={npc} />;
                    }
                    const compactView = searchOptions.hideWithoutSprite
                      && (result as ItemResult | MobResultRow).hasSprite !== true;
                    return activeTab === 'items' ? (
                      <ItemCard
                        key={result.id}
                        result={result as SearchResult}
                        compact={compactView}
                      />
                    ) : (
                      <MobCard
                        key={result.id}
                        result={result as MobResult}
                        compact={compactView}
                      />
                    );
                  })}
                </div>
                {searchState.totalPages > 1 && (
                  <div className="pagination">
                    <button onClick={() => handlePageChange(0)} disabled={searchState.currentPage === 0} className="pagination-button">{'<<'}</button>
                    <button onClick={() => handlePageChange(searchState.currentPage - 1)} disabled={searchState.currentPage === 0} className="pagination-button">{'<'}</button>
                    <span className="pagination-info">
                      Página {searchState.currentPage + 1} de {searchState.totalPages} ({searchState.total} resultados)
                    </span>
                    <button onClick={() => handlePageChange(searchState.currentPage + 1)} disabled={searchState.currentPage >= searchState.totalPages - 1} className="pagination-button">{'>'}</button>
                    <button onClick={() => handlePageChange(searchState.totalPages - 1)} disabled={searchState.currentPage >= searchState.totalPages - 1} className="pagination-button">{'>>'}</button>
                  </div>
                )}
              </>
            ) : (
              !searchError && !isSearching && (
                <div className="no-results">
                  {hasSearchCriteria({
                    tab: activeTab,
                    q: searchTerm,
                    page: 0,
                    run: parseDatabaseUrl(location.search).run,
                    options: searchOptions
                  })
                    ? 'No se encontraron resultados'
                    : 'Escribe un nombre o ID, o aplica filtros y pulsa Buscar.'}
                </div>
              )
            )}
          </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Database;
