import { useEffect, useState } from 'react';
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
    {npc.invocationCosts && (
      <>
        <h5>Costos de invocación</h5>
        <div className="custom-table-wrap">
          <table className="bounty-table custom-repeatable-table custom-invocation-table">
            <thead>
              <tr>
                <th>Almas</th>
                <th>MVP</th>
                <th>Objetos</th>
              </tr>
            </thead>
            <tbody>
              {npc.invocationCosts.flatMap((group) =>
                group.mvps.map((mvp) => (
                  <tr key={`${group.souls}-${mvp.name}`}>
                    <td>{group.souls}</td>
                    <td>{mvp.name}</td>
                    <td>{mvp.keys.join(' + ')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="bounty-note">
          El costo se paga al crear la arena. Reingresar a una arena activa no vuelve a cobrar.
        </p>
      </>
    )}
  </>
);

const NpcCard = ({ npc, onOpen }: { npc: CustomNpc; onOpen: (npc: CustomNpc) => void }) => (
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
    <button
      type="button"
      className="custom-npc-details"
      onClick={() => onOpen(npc)}
    >
      Ver detalles
    </button>
  </article>
);

const NpcModal = ({ npc, onClose }: { npc: CustomNpc; onClose: () => void }) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="custom-npc-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="custom-npc-modal"
        role="dialog"
        aria-modal="true"
        aria-label={npc.name}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="custom-npc-modal-close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          ×
        </button>

        <div className="custom-npc-modal-hero">
          <NpcPortrait npc={npc} large />
          <div className="custom-npc-modal-heading">
            <span className="custom-npc-role">{npc.role}</span>
            <h4>{npc.name}</h4>
            <p>{npc.summary}</p>
          </div>
        </div>

        <div className="custom-npc-modal-body">
          {npc.description.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <NpcDetails npc={npc} />
        </div>
      </div>
    </div>
  );
};

const CustomNpcs = () => {
  const [selectedNpc, setSelectedNpc] = useState<CustomNpc | null>(null);

  return (
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
            {group.npcs.map((npc) => (
              <NpcCard key={npc.id} npc={npc} onOpen={setSelectedNpc} />
            ))}
          </div>
        </section>
      ))}

      {selectedNpc && (
        <NpcModal npc={selectedNpc} onClose={() => setSelectedNpc(null)} />
      )}
    </div>
  );
};

export default CustomNpcs;
