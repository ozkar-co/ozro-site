import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Maps from './Maps';
import Mvps from './Mvps';
import ItemCard, { SearchResult } from './ItemCard';
import MobCard, { MobResult, MOB_SIZE, MOB_ELEMENTS, MOB_RACES } from './MobCard';
import '../styles/Database.css';
import { apiClient } from '../api/client';
import { hasManifestSprite, loadManifest, resolveSprite, type SpriteRect } from '../api/assets';
import {
  PLACEHOLDER_ITEM_ICON,
  PLACEHOLDER_ITEM_ILLUSTRATION,
  PLACEHOLDER_MOB_SPRITE
} from '../api/placeholders';
import {
  ACQUISITION_SOURCE_OPTIONS,
  ARMOR_SUBTYPE_LABELS,
  armorSubtypeLabel,
  buildItemSearchParams,
  buildMobSearchParams,
  CARD_LOCATION_OPTIONS,
  ITEM_TYPE_ARMOR,
  ITEM_TYPE_CARD,
  ITEM_TYPE_FILTER_ORDER,
  ITEM_TYPE_WEAPON,
  itemTypeFilterLabel,
  WEAPON_SUBTYPE_LABELS,
  weaponSubtypeLabel,
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
  results: (ItemResult | MobResultRow)[];
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
  const [itemTypeFilters, setItemTypeFilters] = useState<string[]>([...ITEM_TYPE_FILTER_ORDER]);
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
    apiClient.getItemMeta()
      .then((meta) => {
        const armorList = meta.armorSubtypes ?? [];
        setArmorSubtypes(armorList.length > 0 ? armorList : Object.keys(ARMOR_SUBTYPE_LABELS));
        const weaponList = meta.weaponSubtypes ?? [];
        setWeaponSubtypes(weaponList.length > 0 ? weaponList : Object.keys(WEAPON_SUBTYPE_LABELS));
        const metaTypes = (meta.types ?? [])
          .map((t) => (t === 'Delayconsume' ? 'DelayConsume' : t))
          .filter((t) => t && t !== 'Armor2');
        if (metaTypes.length > 0) {
          const preferred = ITEM_TYPE_FILTER_ORDER.filter((t) => metaTypes.includes(t));
          const extras = metaTypes.filter((t) => !ITEM_TYPE_FILTER_ORDER.includes(t as typeof ITEM_TYPE_FILTER_ORDER[number]));
          setItemTypeFilters([...preferred, ...extras]);
        }
      })
      .catch(() => {
        setArmorSubtypes(Object.keys(ARMOR_SUBTYPE_LABELS));
        setWeaponSubtypes(Object.keys(WEAPON_SUBTYPE_LABELS));
        setItemTypeFilters([...ITEM_TYPE_FILTER_ORDER]);
      });
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
      const illustration = illustrationResolved ?? iconResolved ?? PLACEHOLDER_ITEM_ILLUSTRATION;
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
                    placeholder={`Buscar por nombre o ID ${activeTab === 'items' ? 'del objeto' : 'del monstruo'}...`}
                    className="search-input"
                  />
                  <button type="submit" className="search-button" disabled={isSearching}>
                    {isSearching ? 'Buscando...' : 'Buscar'}
                  </button>
                </div>
              </form>
              <div className="search-options-container" ref={searchOptionsPanelRef}>
                <button className="search-options-toggle" onClick={handleOptionsToggle}>
                  <i className={`arrow-icon ${isOptionsVisible ? 'up' : 'down'}`}></i>
                </button>
                {isOptionsVisible && (
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
                                        : prev.selectedCardLocations
                                    };
                                  })}
                                />
                                {itemTypeFilterLabel(typeName)}
                              </label>
                            ))}
                          </div>
                        </div>
                        {searchOptions.selectedTypes.includes(ITEM_TYPE_ARMOR) && armorSubtypes.length > 0 && (
                          <div className="search-types">
                            <div className="search-types-title">Subtipo de armadura:</div>
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
                                  {armorSubtypeLabel(subtype)}
                                </option>
                              ))}
                            </select>
                            <div className="search-filter-hint">Ctrl+clic para varios</div>
                          </div>
                        )}
                        {searchOptions.selectedTypes.includes(ITEM_TYPE_WEAPON) && weaponSubtypes.length > 0 && (
                          <div className="search-types">
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
                                  {weaponSubtypeLabel(subtype)}
                                </option>
                              ))}
                            </select>
                            <div className="search-filter-hint">Ctrl+clic para varios</div>
                          </div>
                        )}
                        {searchOptions.selectedTypes.includes(ITEM_TYPE_CARD) && (
                          <div className="search-types">
                            <div className="search-types-title">Ubicación de carta:</div>
                            <select
                              className="search-filter-select"
                              multiple
                              size={Math.min(8, Object.keys(CARD_LOCATION_OPTIONS).length)}
                              value={searchOptions.selectedCardLocations}
                              onChange={(e) => {
                                const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
                                setSearchOptions((prev) => ({ ...prev, selectedCardLocations: selected }));
                              }}
                            >
                              {Object.entries(CARD_LOCATION_OPTIONS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                              ))}
                            </select>
                            <div className="search-filter-hint">Ctrl+clic para varios</div>
                          </div>
                        )}
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
                        <div className="search-types">
                          <div className="search-types-title">Obtención (tiene fuente):</div>
                          <div className="search-types-grid">
                            {ACQUISITION_SOURCE_OPTIONS.map((source) => (
                              <label key={source.id} className="type-checkbox">
                                <input
                                  type="checkbox"
                                  checked={searchOptions.selectedAcquisitionSources.includes(source.id)}
                                  onChange={() => setSearchOptions((prev) => {
                                    const selected = prev.selectedAcquisitionSources.includes(source.id);
                                    const selectedAcquisitionSources = selected
                                      ? prev.selectedAcquisitionSources.filter((id) => id !== source.id)
                                      : [...prev.selectedAcquisitionSources, source.id];
                                    // Si filtras por tienda/craft/etc., no ocultar sin drop natural
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
                                {source.label}
                              </label>
                            ))}
                          </div>
                          <div className="search-filter-hint">
                            Varios = OR (cualquiera de las fuentes)
                          </div>
                        </div>
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
                        <div className="search-types">
                          <div className="search-types-title">Filtrar por elemento:</div>
                          <div className="search-types-grid">
                            {Object.entries(MOB_ELEMENTS).map(([elementId, elementName]) => (
                              <label key={elementId} className="type-checkbox">
                                <input
                                  type="checkbox"
                                  checked={searchOptions.selectedElements.includes(Number(elementId))}
                                  onChange={() => setSearchOptions((prev) => ({
                                    ...prev,
                                    selectedElements: prev.selectedElements.includes(Number(elementId))
                                      ? prev.selectedElements.filter((e) => e !== Number(elementId))
                                      : [...prev.selectedElements, Number(elementId)]
                                  }))}
                                />
                                {elementName}
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="search-types">
                          <div className="search-types-title">Filtrar por raza:</div>
                          <div className="search-types-grid">
                            {Object.entries(MOB_RACES).map(([raceId, raceName]) => (
                              <label key={raceId} className="type-checkbox">
                                <input
                                  type="checkbox"
                                  checked={searchOptions.selectedRaces.includes(Number(raceId))}
                                  onChange={() => setSearchOptions((prev) => ({
                                    ...prev,
                                    selectedRaces: prev.selectedRaces.includes(Number(raceId))
                                      ? prev.selectedRaces.filter((r) => r !== Number(raceId))
                                      : [...prev.selectedRaces, Number(raceId)]
                                  }))}
                                />
                                {raceName}
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="search-types">
                          <div className="search-types-title">Filtrar por tamaño:</div>
                          <div className="search-types-grid">
                            {Object.entries(MOB_SIZE).map(([sizeId, sizeName]) => (
                              <label key={sizeId} className="type-checkbox">
                                <input
                                  type="checkbox"
                                  checked={searchOptions.selectedSizes.includes(Number(sizeId))}
                                  onChange={() => setSearchOptions((prev) => ({
                                    ...prev,
                                    selectedSizes: prev.selectedSizes.includes(Number(sizeId))
                                      ? prev.selectedSizes.filter((s) => s !== Number(sizeId))
                                      : [...prev.selectedSizes, Number(sizeId)]
                                  }))}
                                />
                                {sizeName}
                              </label>
                            ))}
                          </div>
                        </div>
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
                    const compactView = searchOptions.hideWithoutSprite && result.hasSprite !== true;
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
