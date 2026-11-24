import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import InfoSidebar from './InfoSidebar';
import BountyBoards from './BountyBoards';
import CustomNpcs from './encyclopedia/CustomNpcs';
import CustomQuests from './encyclopedia/CustomQuests';
import NpcMapBrowser from './encyclopedia/NpcMapBrowser';
import FarmingCalculator from './encyclopedia/FarmingCalculator';
import DropCalculator from './encyclopedia/DropCalculator';
import MarketSimulator from './encyclopedia/MarketSimulator';
import WorldMap from './encyclopedia/WorldMap';
import TransportMap from './encyclopedia/TransportMap';
import References from './encyclopedia/References';
import {
  loadNpcMaps,
  loadNpcSprites,
  type NpcMapsIndex,
  type NpcSpriteIndex,
} from '../api/npcData';
import { episodes } from '../data/episodes';
import '../styles/Encyclopedia.css';

type EncyclopediaSection = {
  id: string;
  title: string;
  icon: string;
  category: string;
};

const sections: EncyclopediaSection[] = [
  {
    id: 'npcs',
    title: 'NPCs personalizados',
    icon: '/icons/npc.png',
    category: 'Contenido personalizado',
  },
  {
    id: 'bounty',
    title: 'Bounty Boards',
    icon: '/icons/bounty.png',
    category: 'Contenido personalizado',
  },
  {
    id: 'repeatables',
    title: 'Quests repetibles',
    icon: '/icons/hunt.png',
    category: 'Contenido personalizado',
  },
  {
    id: 'episodes',
    title: 'Episodios',
    icon: '/icons/feature.png',
    category: 'General',
  },
  {
    id: 'maps',
    title: 'NPCs por mapa',
    icon: '/icons/stats.png',
    category: 'General',
  },
  {
    id: 'farming',
    title: 'Calculadora de farmeo',
    icon: '/icons/drop.png',
    category: 'Farmeo y mapas',
  },
  {
    id: 'drops',
    title: 'Calculadora de drops',
    icon: '/icons/hunt.png',
    category: 'Farmeo y mapas',
  },
  {
    id: 'simulator',
    title: 'Simulador de mercado',
    icon: '/icons/exp.png',
    category: 'Farmeo y mapas',
  },
  {
    id: 'worldmap',
    title: 'Mapa del mundo',
    icon: '/icons/feature.png',
    category: 'Farmeo y mapas',
  },
  {
    id: 'transport',
    title: 'Transporte',
    icon: '/icons/feature.png',
    category: 'Farmeo y mapas',
  },
  {
    id: 'references',
    title: 'Referencias',
    icon: '/icons/exp.png',
    category: 'Farmeo y mapas',
  },
];

const Encyclopedia = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const selectedSection = sections.some((section) => section.id === tabParam)
    ? tabParam as string
    : sections[0].id;
  const [maps, setMaps] = useState<NpcMapsIndex | null>(null);
  const [sprites, setSprites] = useState<NpcSpriteIndex | null>(null);
  const [mapsError, setMapsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadNpcMaps()
      .then((data) => {
        if (!cancelled) setMaps(data);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setMapsError(
            loadError instanceof Error
              ? loadError.message
              : 'No se pudieron cargar los mapas',
          );
        }
      });

    loadNpcSprites()
      .then((data) => {
        if (!cancelled) setSprites(data);
      })
      .catch(() => {
        // Sprites are optional: the map browser falls back to a placeholder.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const totalVisible = useMemo(
    () => (maps ? maps.maps.reduce((sum, item) => sum + item.visible, 0) : 0),
    [maps],
  );

  return (
    <div className="encyclopedia">
      <Header />
      <main className="encyclopedia-content">
        <div className="encyclopedia-inner">
          <section className="encyclopedia-hero">
            <h1>Enciclopedia</h1>
            <p>
              Guía de Rune-Midgard: NPCs personalizados, quests, episodios, mapas y farmeo.
            </p>
            <div className="encyclopedia-stats">
              <span>{maps ? maps.maps.length.toLocaleString('es') : '—'} mapas</span>
              <span>
                {maps ? totalVisible.toLocaleString('es') : '—'} NPCs visibles
              </span>
              <span>
                {sprites ? sprites.count.toLocaleString('es') : '—'} sprites
              </span>
            </div>
          </section>

          <div className="encyclopedia-layout">
            <InfoSidebar
              sections={sections}
              selectedSection={selectedSection}
              onSectionChange={(sectionId) => setSearchParams({ tab: sectionId }, { replace: true })}
            />

            <div className="encyclopedia-main">
              {selectedSection === 'npcs' && <CustomNpcs />}
              {selectedSection === 'bounty' && (
                <div className="info-content">
                  <BountyBoards embedded />
                </div>
              )}
              {selectedSection === 'repeatables' && <CustomQuests />}

              {selectedSection === 'episodes' && (
                <section className="encyclopedia-episodes">
                  <div className="episodes-head">
                    <h2>Episodios</h2>
                    <p>
                      Línea principal hasta Episode 17.1, en orden de lanzamiento.
                      Los enlaces van a iRO Wiki; se irán reemplazando por páginas
                      propias.
                    </p>
                  </div>
                  <ol className="episode-list">
                    {episodes.map((episode) => (
                      <li
                        className="episode-item"
                        key={`${episode.id}-${episode.date}-${episode.title}`}
                      >
                        <span className="episode-date">{episode.date}</span>
                        <a
                          className="episode-title"
                          href={episode.wiki}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {episode.title}
                        </a>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {selectedSection === 'maps' && (
                <NpcMapBrowser maps={maps} mapsError={mapsError} />
              )}

              {selectedSection === 'farming' && <FarmingCalculator />}
              {selectedSection === 'drops' && <DropCalculator />}
              {selectedSection === 'simulator' && <MarketSimulator />}
              {selectedSection === 'worldmap' && <WorldMap />}
              {selectedSection === 'transport' && <TransportMap />}
              {selectedSection === 'references' && <References />}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Encyclopedia;
