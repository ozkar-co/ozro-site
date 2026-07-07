import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ItemCard, { SearchResult, ITEM_TYPES } from './ItemCard';
import MobCard, { MobResult, MOB_SIZE, MOB_ELEMENTS, MOB_RACES } from './MobCard';
import '../styles/Database.css';
import { apiClient } from '../api/client';
import {
  buildItemSearchParams,
  buildMobSearchParams,
  mapItemToCard,
  mapMobToCard,
  SearchOptions
} from '../api/databaseMappers';
import {
  buildDatabaseSearchParams,
  getLegacyDeepLinkId,
  hasSearchCriteria,
  parseDatabaseUrl,
  type DatabaseTab
} from '../api/databaseUrl';

type TabType = DatabaseTab;

interface SearchState {
  total: number;
  currentPage: number;
  results: (SearchResult | MobResult)[];
  totalPages: number;
}

interface ImageData {
  imageDescriptor: { icons: Record<string, number>; illustrations: Record<string, number> };
  mobImageDescriptor: Record<string, number>;
  iconBatches: Record<number, Record<string, string>>;
  illustrationBatches: Record<number, Record<string, string>>;
  mobSpriteBatches: Record<number, Record<string, string>>;
}

const RESULTS_PER_PAGE = 10;

const emptyImageData = (): ImageData => ({
  imageDescriptor: { icons: {}, illustrations: {} },
  mobImageDescriptor: {},
  iconBatches: {},
  illustrationBatches: {},
  mobSpriteBatches: {}
});

const emptySearchState = (): SearchState => ({
  total: 0,
  currentPage: 0,
  results: [],
  totalPages: 0
});

const defaultSearchOptions = (): SearchOptions => ({
  selectedTypes: [],
  selectedElements: [],
  selectedRaces: [],
  selectedSizes: [],
  showBoss: true,
  showNormal: true,
  showMvp: true
});

const Database = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>('items');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [imageData, setImageData] = useState<ImageData>(emptyImageData());
  const [imagesReady, setImagesReady] = useState(false);
  const [searchState, setSearchState] = useState<SearchState>(emptySearchState);
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [searchOptions, setSearchOptions] = useState<SearchOptions>(defaultSearchOptions());
  const searchOptionsRef = useRef(searchOptions);
  const searchOptionsPanelRef = useRef<HTMLDivElement>(null);

  searchOptionsRef.current = searchOptions;

  const navigateToSearch = useCallback((
    tab: TabType,
    q: string,
    page: number,
    replace = false
  ) => {
    const params = buildDatabaseSearchParams(tab, q, page);
    navigate({ pathname: '/database', search: params.toString() }, { replace });
  }, [navigate]);

  useEffect(() => {
    const legacy = getLegacyDeepLinkId(location.search);
    if (legacy) {
      navigateToSearch(legacy.tab, legacy.q, 0, true);
    }
  }, [location.search, navigateToSearch]);

  useEffect(() => {
    const loadImageDescriptors = async () => {
      try {
        const [imageDescriptorResponse, mobImageDescriptorResponse] = await Promise.all([
          fetch('/data/images_descriptor.json'),
          fetch('/data/mob-images-descriptor.json')
        ]);
        const [imageDescriptor, mobImageDescriptor] = await Promise.all([
          imageDescriptorResponse.json(),
          mobImageDescriptorResponse.json()
        ]);
        setImageData((prev) => ({
          ...prev,
          imageDescriptor,
          mobImageDescriptor
        }));
        setImagesReady(true);
      } catch (error) {
        console.error('Error cargando descriptores de imágenes:', error);
        setImagesReady(true);
      }
    };
    loadImageDescriptors();
  }, []);

  const loadImageBatch = useCallback(async (
    batchNumber: number,
    type: 'icons' | 'illustrations' | 'sprites'
  ): Promise<Record<string, string> | null> => {
    const batchKey = type === 'sprites'
      ? 'mobSpriteBatches'
      : type === 'icons'
        ? 'iconBatches'
        : 'illustrationBatches';
    const batchPrefix = type === 'sprites' ? 'mob_sprites' : type;

    const cached = imageData[batchKey][batchNumber];
    if (cached) return cached;

    try {
      const response = await fetch(`/data/${batchPrefix}_batch_${batchNumber}.json`);
      if (!response.ok) return null;
      const batchData = await response.json();
      setImageData((prev) => ({
        ...prev,
        [batchKey]: { ...prev[batchKey], [batchNumber]: batchData }
      }));
      return batchData;
    } catch {
      return null;
    }
  }, [imageData]);

  const getImage = useCallback(async (
    id: string,
    type: 'icons' | 'illustrations' | 'sprites'
  ): Promise<string> => {
    const descriptor = type === 'sprites'
      ? imageData.mobImageDescriptor
      : imageData.imageDescriptor[type === 'icons' ? 'icons' : 'illustrations'];

    if (!descriptor || descriptor[id] === undefined) {
      return '/placeholder.png';
    }

    const batch = await loadImageBatch(descriptor[id], type);
    return batch?.[id] || '/placeholder.png';
  }, [imageData, loadImageBatch]);

  const enrichMobResults = useCallback(async (mobs: MobResult[]): Promise<MobResult[]> => {
    return Promise.all(mobs.map(async (mob) => {
      const sprite = await getImage(mob.id, 'sprites');
      const drop = await Promise.all(
        (mob.drop || []).map(async (entry) => ({
          ...entry,
          itemIcon: entry.id ? await getImage(String(entry.id), 'icons') : '/placeholder.png'
        }))
      );
      return { ...mob, sprite, drop };
    }));
  }, [getImage]);

  const enrichItemResults = useCallback(async (items: SearchResult[]): Promise<SearchResult[]> => {
    return Promise.all(items.map(async (item) => {
      const [icon, illustration] = await Promise.all([
        getImage(item.id, 'icons'),
        getImage(item.id, 'illustrations')
      ]);
      return { ...item, icon, illustration };
    }));
  }, [getImage]);

  const fetchSearchResults = useCallback(async (
    tab: TabType,
    term: string,
    options: SearchOptions,
    page: number
  ) => {
    if (tab === 'mobs') {
      const params = buildMobSearchParams(term, options, page, RESULTS_PER_PAGE);
      const data = await apiClient.searchMobs(params);
      const details = await Promise.all(
        data.results.map((summary) => apiClient.getMob(summary.id).catch(() => summary))
      );
      let results = details.map((mob) => mapMobToCard(mob));
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

    const params = buildItemSearchParams(term, options, page, RESULTS_PER_PAGE);
    const data = await apiClient.searchItems(params);
    const details = await Promise.all(
      data.results.map((summary) => apiClient.getItem(summary.id).catch(() => summary))
    );
    let results = details.map((item) => mapItemToCard(item));
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

    const { tab, q, page } = parseDatabaseUrl(location.search);
    const options = searchOptionsRef.current;

    setActiveTab(tab);
    setSearchTerm(q);

    if (!hasSearchCriteria(q, options)) {
      setSearchState(emptySearchState());
      setSearchError(null);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    setSearchError(null);

    fetchSearchResults(tab, q, options, page)
      .then((state) => {
        if (!cancelled) setSearchState(state);
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
  }, [location.search, fetchSearchResults]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigateToSearch(activeTab, searchTerm, 0);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 0 || newPage >= searchState.totalPages) return;
    navigateToSearch(activeTab, searchTerm, newPage);
    document.querySelector('.results-section')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOptionsToggle = () => {
    if (isOptionsVisible) {
      setIsClosing(true);
      setTimeout(() => {
        setIsOptionsVisible(false);
        setIsClosing(false);
      }, 300);
    } else {
      setIsOptionsVisible(true);
      setIsClosing(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setSearchOptions(defaultSearchOptions());
    setSearchError(null);
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
            Base de Datos de Objetos
          </button>
          <button
            className={`tab-button ${activeTab === 'mobs' ? 'active' : ''}`}
            onClick={() => handleTabChange('mobs')}
          >
            Base de Datos de Monstruos
          </button>
        </div>
        <div className="database-container">
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
                      <div className="search-types">
                        <div className="search-types-title">Filtrar por tipo:</div>
                        <div className="search-types-grid">
                          {Object.entries(ITEM_TYPES).map(([typeId, typeName]) => (
                            <label key={typeId} className="type-checkbox">
                              <input
                                type="checkbox"
                                checked={searchOptions.selectedTypes.includes(Number(typeId))}
                                onChange={() => setSearchOptions((prev) => ({
                                  ...prev,
                                  selectedTypes: prev.selectedTypes.includes(Number(typeId))
                                    ? prev.selectedTypes.filter((t) => t !== Number(typeId))
                                    : [...prev.selectedTypes, Number(typeId)]
                                }))}
                              />
                              {typeName}
                            </label>
                          ))}
                        </div>
                      </div>
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
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="results-section">
            {searchError && (
              <div className="no-results">{searchError}</div>
            )}
            {!searchError && searchState.results.length > 0 ? (
              <>
                <div className="results-grid">
                  {searchState.results.map((result) =>
                    activeTab === 'items' ? (
                      <ItemCard key={result.id} result={result as SearchResult} />
                    ) : (
                      <MobCard key={result.id} result={result as MobResult} />
                    )
                  )}
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
              !searchError && (
                <div className="no-results">
                  {searchTerm || searchOptions.selectedTypes.length > 0
                    ? 'No se encontraron resultados'
                    : 'Ingresa un término para buscar o selecciona un filtro'}
                </div>
              )
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Database;
