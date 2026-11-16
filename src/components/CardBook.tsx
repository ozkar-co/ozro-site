import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import '../styles/CardBook.css';
import { apiClient, type CardBookResponse } from '../api/client';
import {
  cardAtlasUrl,
  loadCardCatalog,
  type CardCatalog,
  type CardEntry,
  type CardPage
} from '../api/cards';

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    setMatches(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

function formatUserid(value: string): string {
  return value
    .toLowerCase()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

interface BookCardProps {
  card: CardEntry;
  page: CardPage | undefined;
  owned: boolean;
}

function BookCard({ card, page, owned }: BookCardProps) {
  const style = page
    ? {
        width: card.w,
        height: card.h,
        backgroundImage: `url(${cardAtlasUrl(page.image)})`,
        backgroundPosition: `-${card.x}px -${card.y}px`
      }
    : undefined;

  return (
    <article
      className={`book-card ${owned ? 'is-owned' : 'is-missing'}`}
      title={`${card.id} · ${card.name}${owned ? '' : ' · sin obtener'}`}
    >
      <div className="book-card-art" style={style} aria-hidden="true">
        {!owned && <span className="book-card-lock">?</span>}
      </div>
      <div className="book-card-name">{card.name}</div>
    </article>
  );
}

const CardBook = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const [catalog, setCatalog] = useState<CardCatalog | null>(null);
  const [book, setBook] = useState<CardBookResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [ownedOnly, setOwnedOnly] = useState(false);
  const bookRef = useRef<HTMLDivElement>(null);
  const singlePage = useMediaQuery('(max-width: 1100px)');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    if (!accountId) {
      setError('Cuenta no especificada');
      setLoading(false);
      return;
    }

    Promise.all([loadCardCatalog(), apiClient.getCardBook(accountId)])
      .then(([catalogData, bookData]) => {
        if (cancelled) return;
        setCatalog(catalogData);
        setBook(bookData);
        setActiveCode(catalogData.categories[0]?.code ?? null);
      })
      .catch((fetchError: Error) => {
        if (cancelled) return;
        setError(fetchError.message || 'No se pudo cargar el libro de cartas');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accountId]);

  const owned = useMemo(() => new Set(book?.owned ?? []), [book]);

  const stats = useMemo(() => {
    const result = new Map<string, { owned: number; total: number }>();
    if (!catalog) return result;
    for (const category of catalog.categories) {
      let ownedCount = 0;
      for (const card of category.cards) {
        if (owned.has(card.id)) ownedCount += 1;
      }
      result.set(category.code, { owned: ownedCount, total: category.cards.length });
    }
    return result;
  }, [catalog, owned]);

  const totalOwned = useMemo(() => {
    if (!catalog) return 0;
    let count = 0;
    for (const category of catalog.categories) {
      for (const card of category.cards) {
        if (owned.has(card.id)) count += 1;
      }
    }
    return count;
  }, [catalog, owned]);

  const visibleCategories = useMemo(() => {
    if (!catalog) return [];
    if (!ownedOnly) return catalog.categories;
    return catalog.categories.filter((category) =>
      category.cards.some((card) => owned.has(card.id))
    );
  }, [catalog, owned, ownedOnly]);

  useEffect(() => {
    if (visibleCategories.length === 0) {
      setActiveCode(null);
      return;
    }
    if (!activeCode || !visibleCategories.some((category) => category.code === activeCode)) {
      setActiveCode(visibleCategories[0].code);
    }
  }, [activeCode, visibleCategories]);

  const activeCategory = useMemo(
    () => visibleCategories.find((category) => category.code === activeCode) ?? null,
    [activeCode, visibleCategories]
  );

  const cards = useMemo(() => {
    if (!activeCategory) return [];
    return ownedOnly
      ? activeCategory.cards.filter((card) => owned.has(card.id))
      : activeCategory.cards;
  }, [activeCategory, owned, ownedOnly]);

  const cardsPerPage = singlePage ? 6 : 12;
  const pageCount = Math.max(1, Math.ceil(cards.length / cardsPerPage));

  useEffect(() => {
    setPage(0);
  }, [activeCode, ownedOnly, singlePage]);

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount - 1));
  }, [pageCount]);

  const pageCards = useMemo(
    () => cards.slice(page * cardsPerPage, page * cardsPerPage + cardsPerPage),
    [cards, page, cardsPerPage]
  );

  const goToPage = (nextPage: number) => {
    setPage(nextPage);
    requestAnimationFrame(() => {
      bookRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const leftCards = singlePage
    ? pageCards
    : pageCards.slice(0, Math.ceil(cardsPerPage / 2));
  const rightCards = singlePage
    ? []
    : pageCards.slice(Math.ceil(cardsPerPage / 2));

  const pagesById = useMemo(() => {
    const result = new Map<number, CardPage>();
    if (!catalog) return result;
    for (const item of catalog.pages) result.set(item.page, item);
    return result;
  }, [catalog]);

  const progress = catalog && catalog.total > 0
    ? Math.round((totalOwned / catalog.total) * 100)
    : 0;

  return (
    <div className="cardbook">
      <Header />
      <main className="cardbook-container">
        {loading && (
          <div className="cardbook-status">
            <span className="cardbook-spinner" aria-hidden="true" />
            Abriendo el libro de cartas...
          </div>
        )}

        {!loading && error && (
          <div className="cardbook-status cardbook-status-error">
            <p>{error}</p>
            <Link to="/cards">Volver al libro de cartas</Link>
          </div>
        )}

        {!loading && !error && catalog && book && (
          <div className="cardbook-content">
            <section className="cardbook-hero">
              <div>
                <p className="cardbook-kicker">Archivo de Descubrimientos</p>
                <h1>Libro de Cartas de {formatUserid(book.account.userid)}</h1>
                <p className="cardbook-subtitle">
                  {totalOwned} de {catalog.total} cartas registradas. Las cartas en gris todavía faltan.
                </p>
              </div>
              <div className="cardbook-hero-actions">
                <Link to="/rankings">Rankings</Link>
                <Link to="/cards">Otros coleccionistas</Link>
              </div>
            </section>

            <section className="cardbook-toolbar" aria-label="Filtros del libro">
              <div className="cardbook-progress">
                <div className="cardbook-progress-track">
                  <span style={{ width: `${progress}%` }} />
                </div>
                <strong>{progress}%</strong>
              </div>
              <label className="cardbook-toggle">
                <input
                  type="checkbox"
                  checked={ownedOnly}
                  onChange={(event) => setOwnedOnly(event.target.checked)}
                />
                <span>Solo obtenidas</span>
              </label>
            </section>

            <nav className="cardbook-tabs" aria-label="Categorías de cartas">
              {visibleCategories.map((category) => {
                const categoryStats = stats.get(category.code);
                return (
                  <button
                    key={category.code}
                    type="button"
                    className={category.code === activeCategory?.code ? 'active' : ''}
                    onClick={() => setActiveCode(category.code)}
                  >
                    <span>{category.label}</span>
                    <small>
                      {categoryStats?.owned ?? 0}/{categoryStats?.total ?? 0}
                    </small>
                  </button>
                );
              })}
            </nav>

            {activeCategory && cards.length > 0 ? (
              <>
                <div className="book-spread" ref={bookRef}>
                  <div className="book-page">
                    <div className="book-page-heading">
                      <span>{activeCategory.label}</span>
                      <small>
                        {page * cardsPerPage + 1}–
                        {Math.min((page + 1) * cardsPerPage, cards.length)} de {cards.length}
                      </small>
                    </div>
                    <div className="book-grid">
                      {leftCards.map((card) => (
                        <BookCard
                          key={card.id}
                          card={card}
                          page={pagesById.get(card.page)}
                          owned={owned.has(card.id)}
                        />
                      ))}
                    </div>
                  </div>

                  {!singlePage && (
                    <div className="book-page">
                      <div className="book-page-heading">
                        <span>{activeCategory.label}</span>
                        <small>continuación</small>
                      </div>
                      <div className="book-grid">
                        {rightCards.map((card) => (
                          <BookCard
                            key={card.id}
                            card={card}
                            page={pagesById.get(card.page)}
                            owned={owned.has(card.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="book-controls">
                  <button
                    type="button"
                    onClick={() => goToPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                  >
                    ‹ Anterior
                  </button>
                  <span>
                    Página {Math.min(page + 1, pageCount)} de {pageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => goToPage(Math.min(pageCount - 1, page + 1))}
                    disabled={page >= pageCount - 1}
                  >
                    Siguiente ›
                  </button>
                </div>
              </>
            ) : (
              <div className="cardbook-status">
                {totalOwned === 0
                  ? 'Esta cuenta todavía no registró cartas en el Archivista.'
                  : ownedOnly
                    ? 'No hay cartas obtenidas en las categorías disponibles.'
                    : 'No hay cartas en esta categoría.'}
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CardBook;
