import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import '../styles/CardBook.css';
import { apiClient } from '../api/client';
import { loadCardCatalog, type CardCatalog } from '../api/cards';

interface Collector {
  account_id: number;
  userid: string;
  cards: number;
}

function formatUserid(value: string): string {
  return value
    .toLowerCase()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

const CardBookIndex = () => {
  const [catalog, setCatalog] = useState<CardCatalog | null>(null);
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([loadCardCatalog(), apiClient.rankingsAccounts()])
      .then(([catalogData, rankings]) => {
        if (cancelled) return;
        const list = rankings.rankings
          .filter((account) => !['admin', 'gamemaster'].includes(account.userid.toLowerCase()))
          .map((account) => ({
            account_id: account.account_id,
            userid: account.userid,
            cards: Number.parseInt(account.total_cards_distinct, 10) || 0
          }))
          .filter((account) => account.cards > 0)
          .sort((a, b) => b.cards - a.cards || a.userid.localeCompare(b.userid));
        setCatalog(catalogData);
        setCollectors(list);
      })
      .catch((fetchError: Error) => {
        if (cancelled) return;
        setError(fetchError.message || 'No se pudieron cargar los coleccionistas');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const total = catalog?.total ?? 0;

  const rows = useMemo(
    () => collectors.map((collector) => ({
      ...collector,
      progress: total > 0 ? Math.min(100, Math.round((collector.cards / total) * 100)) : 0
    })),
    [collectors, total]
  );

  return (
    <div className="cardbook cardbook-index-page">
      <Header />
      <main className="cardbook-container">
        <div className="cardbook-content">
          <section className="cardbook-hero">
            <div>
              <p className="cardbook-kicker">Archivo de Descubrimientos</p>
              <h1>Libro de Cartas</h1>
              <p className="cardbook-subtitle">
                Elegí una cuenta para abrir su colección de cartas registradas.
              </p>
            </div>
            <div className="cardbook-hero-actions">
              <Link to="/rankings">Ver rankings</Link>
            </div>
          </section>

          {loading && (
            <div className="cardbook-status">
              <span className="cardbook-spinner" aria-hidden="true" />
              Cargando coleccionistas...
            </div>
          )}

          {!loading && error && (
            <div className="cardbook-status cardbook-status-error">
              <p>{error}</p>
              <Link to="/rankings">Volver a rankings</Link>
            </div>
          )}

          {!loading && !error && rows.length === 0 && (
            <div className="cardbook-status">
              Todavía no hay cuentas con cartas registradas.
            </div>
          )}

          {!loading && !error && rows.length > 0 && (
            <div className="collector-grid">
              {rows.map((collector, index) => (
                <Link
                  key={collector.account_id}
                  to={`/cards/${collector.account_id}`}
                  className="collector-card"
                >
                  <div className="collector-rank">#{index + 1}</div>
                  <div className="collector-main">
                    <strong>{formatUserid(collector.userid)}</strong>
                    <span>{collector.cards} de {total} cartas</span>
                    <div className="collector-progress">
                      <span style={{ width: `${collector.progress}%` }} />
                    </div>
                  </div>
                  <div className="collector-percent">{collector.progress}%</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CardBookIndex;
