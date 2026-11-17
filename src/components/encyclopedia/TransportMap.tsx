import '../../styles/TransportMap.css';

const MAP_URL = '/assets/world/transport-map.svg';

const TransportMap = () => (
  <section className="transport-view">
    <div className="transport-head">
      <div>
        <h2>Transporte</h2>
        <p>Mapa esquemático de las rutas de Kafra y airship de Rune-Midgard.</p>
      </div>
      <a className="transport-open" href={MAP_URL} target="_blank" rel="noreferrer">
        Abrir mapa
      </a>
    </div>

    <a className="transport-map-link" href={MAP_URL} target="_blank" rel="noreferrer">
      <img
        src={MAP_URL}
        alt="Mapa esquemático de transporte de Rune-Midgard"
      />
    </a>

    <p className="transport-caption">
      Las líneas punteadas son Kafra unidireccional.
    </p>
  </section>
);

export default TransportMap;
