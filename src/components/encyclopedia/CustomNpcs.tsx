import { customNpcGroups, type CustomNpc } from '../../data/customNpcs';
import '../../styles/Information.css';
import '../../styles/Encyclopedia.css';

const FALLBACK_SPRITE = '/icons/npc.png';

const NpcPortrait = ({ npc, large = false }: { npc: CustomNpc; large?: boolean }) => (
  <div className={large ? 'custom-npc-portrait is-large' : 'npc-sprite'}>
    <img
      src={npc.sprite}
      alt={npc.name}
      loading="lazy"
      onError={(event) => {
        event.currentTarget.src = FALLBACK_SPRITE;
      }}
    />
  </div>
);

const NpcDetails = ({ npc }: { npc: CustomNpc }) => (
  <>
    <h5>Qué ofrece</h5>
    <ul>
      {npc.services.map((service) => (
        <li key={service}>{service}</li>
      ))}
    </ul>
    <h5>Dónde encontrarlo</h5>
    <ul>
      {npc.locations.map((location) => (
        <li key={location}>{location}</li>
      ))}
    </ul>
  </>
);

const FeaturedNpc = ({ npc }: { npc: CustomNpc }) => (
  <article className="custom-npc-featured">
    <NpcPortrait npc={npc} large />
    <div className="custom-npc-featured-body">
      <span className="custom-npc-role">{npc.role}</span>
      <h4>{npc.name}</h4>
      <p className="custom-npc-summary">{npc.summary}</p>
      {npc.description.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      <NpcDetails npc={npc} />
    </div>
  </article>
);

const NpcCard = ({ npc }: { npc: CustomNpc }) => (
  <article className="custom-npc-card">
    <div className="custom-npc-card-head">
      <NpcPortrait npc={npc} />
      <div>
        <h4>{npc.name}</h4>
        <span className="custom-npc-role">{npc.role}</span>
      </div>
    </div>
    <p className="custom-npc-summary">{npc.summary}</p>
    <p className="custom-npc-location">{npc.locations.join(' · ')}</p>
    <details className="custom-npc-more">
      <summary>Ver detalles</summary>
      {npc.description.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      <NpcDetails npc={npc} />
    </details>
  </article>
);

const CustomNpcs = () => (
  <div className="info-content custom-npcs">
    <h2>NPCs personalizados</h2>
    <p className="custom-section-intro">
      Habitantes de Rune-Midgard con funciones propias de OzRo: economía, soporte,
      colecciones y lore. Las descripciones salen de los scripts activos del servidor.
    </p>

    {customNpcGroups.map((group) => (
      <section className="custom-npc-group" key={group.id}>
        <h3>{group.title}</h3>
        <p>{group.description}</p>
        <div className="custom-npc-list">
          {group.npcs.map((npc) =>
            npc.featured ? (
              <FeaturedNpc key={npc.id} npc={npc} />
            ) : (
              <NpcCard key={npc.id} npc={npc} />
            ),
          )}
        </div>
      </section>
    ))}
  </div>
);

export default CustomNpcs;
