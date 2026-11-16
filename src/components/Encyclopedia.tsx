import { useEffect, useMemo, useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import InfoSidebar from './InfoSidebar';
import CustomNpcs from './encyclopedia/CustomNpcs';
import CustomQuests from './encyclopedia/CustomQuests';
import NpcMapBrowser from './encyclopedia/NpcMapBrowser';
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
    category: 'Guía del servidor',
  },
  {
    id: 'quests',
    title: 'Quests personalizadas',
    icon: '/icons/bounty.png',
    category: 'Guía del servidor',
  },
  {
    id: 'episodes',
    title: 'Episodios',
    icon: '/icons/feature.png',
    category: 'Guía del servidor',
  },
  {
    id: 'maps',
    title: 'NPCs por mapa',
    icon: '/icons/stats.png',
    category: 'Mapas',
  },
];

const Encyclopedia = () => {
  const [selectedSection, setSelectedSection] = useState('npcs');
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
              Guía de Rune-Midgard: NPCs personalizados, quests, episodios y mapas.
            </p>
            <div className="encyclopedia-stats">
              <span>{maps ? maps.maps.length.toLocaleString('es') : '—'} mapas</span>
              <span>
                {maps ? totalVisible.toLocaleString('es') : '—'} NPCs visibles
              </span>
              <span>
                {sprites ? sprites.counts.sprites.toLocaleString('es') : '—'} sprites
              </span>
            </div>
          </section>

          <div className="encyclopedia-layout">
            <InfoSidebar
              sections={sections}
              selectedSection={selectedSection}
              onSectionChange={setSelectedSection}
            />

            <div className="encyclopedia-main">
              {selectedSection === 'npcs' && <CustomNpcs />}
              {selectedSection === 'quests' && <CustomQuests />}

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
                <NpcMapBrowser maps={maps} sprites={sprites} mapsError={mapsError} />
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Encyclopedia;
