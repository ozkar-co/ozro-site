import { useSearchParams } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import InfoSidebar from './InfoSidebar';
import BountyBoards from './BountyBoards';
import CustomNpcs from './encyclopedia/CustomNpcs';
import CustomQuests from './encyclopedia/CustomQuests';
import EncyclopediaPlaceholder from './encyclopedia/EncyclopediaPlaceholder';
import FarmingCalculator from './encyclopedia/FarmingCalculator';
import DropCalculator from './encyclopedia/DropCalculator';
import MarketSimulator from './encyclopedia/MarketSimulator';
import WorldMap from './encyclopedia/WorldMap';
import TransportMap from './encyclopedia/TransportMap';
import References from './encyclopedia/References';
import type { InfoSection } from './Information';
import { episodes } from '../data/episodes';
import '../styles/Encyclopedia.css';

const sections: InfoSection[] = [
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
    iconItemId: 2272,
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
    id: 'worldmap',
    title: 'Mapa del mundo',
    icon: '/icons/feature.png',
    iconItemId: 28354,
    category: 'General',
  },
  {
    id: 'transport',
    title: 'Transporte',
    icon: '/icons/feature.png',
    category: 'General',
  },
  {
    id: 'card-combos',
    title: 'Combos de cartas',
    icon: '/icons/unique.png',
    category: 'General',
  },
  {
    id: 'equipment-sets',
    title: 'Sets de equipos',
    icon: '/icons/unique.png',
    category: 'General',
  },
  {
    id: 'enchants',
    title: 'Enchants',
    icon: '/icons/buff.png',
    category: 'General',
  },
  {
    id: 'socket-enchants',
    title: 'Socket enchants',
    icon: '/icons/buff.png',
    category: 'General',
  },
  {
    id: 'hat-quests',
    title: 'Quests de sombreros',
    icon: '/icons/hunt.png',
    category: 'General',
  },
  {
    id: 'creation-quests',
    title: 'Otras quests de creación',
    icon: '/icons/hunt.png',
    category: 'General',
  },
  {
    id: 'farming',
    title: 'Calculadora de farmeo',
    icon: '/icons/drop.png',
    category: 'Utilidades',
  },
  {
    id: 'drops',
    title: 'Calculadora de drops',
    icon: '/icons/hunt.png',
    category: 'Utilidades',
  },
  {
    id: 'simulator',
    title: 'Simulador de mercado',
    icon: '/icons/exp.png',
    category: 'Utilidades',
  },
  {
    id: 'references',
    title: 'Referencias',
    icon: '/icons/exp.png',
    category: 'Utilidades',
  },
  {
    id: 'cooking',
    title: 'Calculadora de cocina',
    icon: '/icons/drop.png',
    category: 'Utilidades',
  },
  {
    id: 'alchemy',
    title: 'Calculadora de alquimia',
    icon: '/icons/drop.png',
    category: 'Utilidades',
  },
  {
    id: 'forging',
    title: 'Calculadora de forja',
    icon: '/icons/drop.png',
    category: 'Utilidades',
  },
];

const PLACEHOLDERS: Record<string, { title: string; summary: string; references?: string[] }> = {
  'card-combos': {
    title: 'Combos de cartas',
    summary: 'Catálogo de combos de cartas del servidor. Próximamente desde la base OzRo.',
    references: [
      'ozro-data: ozro_item_combo_groups / ozro_item_combo_sets / ozro_item_combo_members',
      'rathena/docs/ozro-market/historia/brief-02/master_dataset.md',
      'ozro-data/DATA.md · SCHEMA_DELTA.md',
    ],
  },
  'equipment-sets': {
    title: 'Sets de equipos',
    summary: 'Bonos de sets de equipo. Vista pendiente de cablear a la DB.',
    references: [
      'rathena/docs/ozro-market/historia/brief-02/master_dataset.md',
      'rathena/docs/.../08-ideas-backlog.md (sets custom)',
      'ozro-data item combo / relationship tables',
    ],
  },
  enchants: {
    title: 'Enchants',
    summary: 'Encantamientos de equipo. En preparación.',
    references: [
      'ozro-data: ozro_enchantments / enchant_targets / enchant_options / …',
      'rathena/docs/ozro-market/historia/brief-02/master_dataset.md',
      'rathena/docs/.../13-mercado-npc-tasador.md',
    ],
  },
  'socket-enchants': {
    title: 'Socket enchants',
    summary: 'Encantamientos por socket. En preparación.',
    references: [
      'ozro-data/README.md · DATA.md (socket / enchant coverage)',
      'rathena/docs/ozro-market/historia/brief-02/master_dataset.md',
    ],
  },
  'hat-quests': {
    title: 'Quests de sombreros',
    summary: 'Guía de quests de headgears. En preparación.',
    references: [
      'Pendiente de extractor / atribución quest→reward en ozro-data',
      'Database tab Quests + NPCs (enlaces cuando haya datos)',
    ],
  },
  'creation-quests': {
    title: 'Otras quests de creación',
    summary: 'Quests de crafting / creación fuera de sombreros. En preparación.',
    references: [
      'ozro-data recipes / boxes / acquisition_outputs',
      'rathena/docs/.../recipes_variable_formulas.md',
    ],
  },
  cooking: {
    title: 'Calculadora de cocina',
    summary: 'Utilidad de cocina (Chef). En preparación.',
    references: [
      'rathena/docs/.../08-ideas-backlog.md (Chef/cocina)',
      'rathena/docs/.../recipes_variable_formulas.md',
      'ozro_recipes (cooking rows en master_dataset)',
    ],
  },
  alchemy: {
    title: 'Calculadora de alquimia',
    summary: 'Utilidad de alquimia. En preparación.',
    references: [
      'rathena/docs/.../09-estado-tecnico-y-estabilidad.md (CR_ALCHEMY)',
      'ozro_recipes / skill costs',
    ],
  },
  forging: {
    title: 'Calculadora de forja',
    summary: 'Utilidad de forja / blacksmith. En preparación.',
    references: [
      'rathena/docs/.../recipes_variable_formulas.md',
      'rathena/docs/ozro-market/historia/brief-02/master_dataset.md (forge)',
      'ozro_recipes',
    ],
  },
};

const Encyclopedia = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const selectedSection = sections.some((section) => section.id === tabParam)
    ? (tabParam as string)
    : sections[0].id;

  const placeholder = PLACEHOLDERS[selectedSection];

  return (
    <div className="encyclopedia">
      <Header />
      <main className="encyclopedia-content">
        <div className="encyclopedia-inner">
          <section className="encyclopedia-hero">
            <h1>Enciclopedia</h1>
            <p>
              Guía de Rune-Midgard: lore personalizado, mapas, combos y utilidades del servidor.
            </p>
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

              {selectedSection === 'worldmap' && <WorldMap />}
              {selectedSection === 'transport' && <TransportMap />}
              {selectedSection === 'farming' && <FarmingCalculator />}
              {selectedSection === 'drops' && <DropCalculator />}
              {selectedSection === 'simulator' && <MarketSimulator />}
              {selectedSection === 'references' && <References />}

              {placeholder && (
                <EncyclopediaPlaceholder
                  title={placeholder.title}
                  summary={placeholder.summary}
                  references={placeholder.references}
                />
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
