import { Link } from 'react-router-dom';

export interface SkillResult {
  id: number;
  name: string | null;
  mobCount: number;
  useCount: number;
  variants?: {
    skillLv: number | null;
    state: string | null;
    conditionType: string | null;
    conditionValue: string | null;
    rate: number | null;
    entries: number;
  }[];
  mobs?: {
    id: number | null;
    name: string | null;
    nameAegis: string | null;
    uses: number;
  }[];
}

interface SkillCardProps {
  result: SkillResult;
}

const SkillCard = ({ result }: SkillCardProps) => {
  const title = result.name || `Skill #${result.id}`;
  return (
    <div className="result-card result-card--skill">
      <div className="result-card-header">
        <h3>
          <span className="name-title">
            <Link to={`/database?tab=skills&q=${result.id}&run=1`}>{title}</Link>
          </span>
          {' '}
          <span className="result-card-id">#{result.id}</span>
        </h3>
        <div className="skill-card-meta">
          <span>{result.mobCount.toLocaleString()} mobs</span>
          <span>{result.useCount.toLocaleString()} usos</span>
        </div>
      </div>

      {result.mobs && result.mobs.length > 0 && (
        <div className="result-card-section">
          <div className="result-card-script-header">Usado por</div>
          <div className="skill-mob-list">
            {result.mobs.slice(0, 12).map((mob) => (
              mob.id != null ? (
                <Link
                  key={mob.id}
                  to={`/database?tab=mobs&q=${mob.id}&run=1`}
                  className="skill-mob-chip"
                >
                  {mob.name || mob.nameAegis || `#${mob.id}`}
                  {mob.uses > 1 ? ` · ${mob.uses}` : ''}
                </Link>
              ) : null
            ))}
            {result.mobs.length > 12 && (
              <span className="skill-mob-more">+{result.mobs.length - 12}</span>
            )}
          </div>
        </div>
      )}

      {result.variants && result.variants.length > 0 && (
        <div className="result-card-section">
          <div className="result-card-script-header">Variantes</div>
          <ul className="skill-variant-list">
            {result.variants.slice(0, 8).map((variant, index) => {
              const rateText = variant.rate != null
                ? `${(variant.rate / 100).toFixed(variant.rate % 100 === 0 ? 0 : 1)}%`
                : null;
              const parts = [
                variant.skillLv != null ? `Lv ${variant.skillLv}` : null,
                variant.state,
                variant.conditionType
                  ? `${variant.conditionType}${variant.conditionValue ? ` ${variant.conditionValue}` : ''}`
                  : null,
                rateText,
                variant.entries > 1 ? `×${variant.entries}` : null
              ].filter(Boolean);
              return (
                <li key={`${variant.state}-${index}`}>{parts.join(' · ')}</li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SkillCard;
