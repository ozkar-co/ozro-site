import { useEffect, useRef, useState } from 'react';
import { legacyUpdates, recentUpdates, type UpdateEntry } from '../data/updates';

function UpdateBlock({ entry }: { entry: UpdateEntry }) {
  return (
    <article className={entry.milestone ? 'news-entry news-milestone' : 'news-entry'}>
      <strong>
        {entry.date}
        {entry.title ? ` — ${entry.title}` : ''}
      </strong>
      {entry.paragraphs.map((text, i) => (
        <p key={i}>{text}</p>
      ))}
    </article>
  );
}

const News = () => {
  const [isVisible, setIsVisible] = useState(false);
  const newsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      {
        threshold: 0.2,
        rootMargin: '-100px 0px',
      }
    );

    if (newsRef.current) {
      observer.observe(newsRef.current);
    }

    return () => {
      if (newsRef.current) {
        observer.unobserve(newsRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={newsRef}
      className={`news-section ${isVisible ? 'visible' : ''}`}
    >
      <h2>Últimas Actualizaciones</h2>
      <div className="news-container">
        {recentUpdates.map((entry) => (
          <UpdateBlock key={entry.date} entry={entry} />
        ))}
        <hr className="news-divider" />
        <p className="news-legacy-label">Historial (era Hercules)</p>
        {legacyUpdates.map((entry) => (
          <UpdateBlock key={entry.date} entry={entry} />
        ))}
      </div>
    </div>
  );
};

export default News;
