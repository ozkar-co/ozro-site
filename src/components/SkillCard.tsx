import { Link } from 'react-router-dom';
import type { SpriteRect } from '../api/assets';
import { PLACEHOLDER_ITEM_ICON } from '../api/placeholders';
import AtlasSprite from './AtlasSprite';

export interface SkillResult {
  id: number;
  name: string | null;
  mobCount: number;
  useCount: number;
  displayName?: string | null;
  aegisName?: string | null;
  aegisPrefix?: string | null;
  description?: string[];
  maxLv?: number | null;
  /** Job / source prefix from aegis (SM, WZ, NPC…). */
  type?: string | null;
  /** Combat type from skill_db (Weapon, Magic, …). */
  skillType?: string | null;
  targetType?: string | null;
  isQuest?: boolean;
  isPlatinum?: boolean;
  spAmount?: number[] | null;
  attackRange?: number[] | null;
  separateLv?: boolean | null;
  icon?: SpriteRect | string | null;
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
  itemCosts?: {
    itemId: number | null;
    itemAegisName: string | null;
    itemName: string | null;
    amount: number | null;
    level: number | null;
  }[];
  teachers?: {
    grantKind: string | null;
    npcId: string | null;
    npcName: string | null;
    mapId: string | null;
    x: number | null;
    y: number | null;
  }[];
  recipes?: {
    recipeId: string | null;
    family: string | null;
    skillLevel: number | null;
    resultItemId: number | null;
    resultAegisName: string | null;
    resultName: string | null;
    resultAmount: number | null;
  }[];
}

interface SkillCardProps {
  result: SkillResult;
}

const processColoredText = (text: string): JSX.Element[] => {
  const parts = text.split(/(\^[0-9A-F]{6})/i);
  let currentColor = '000000';
  const elements: JSX.Element[] = [];
  let key = 0;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.startsWith('^')) {
      currentColor = part.substring(1);
      continue;
    }
    if (part) {
      elements.push(
        <span key={key++} style={{ color: `#${currentColor}` }}>
          {part}
        </span>
      );
    }
  }

  return elements;
};

const SkillCard = ({ result }: SkillCardProps) => {
  const title = result.displayName || result.name || result.aegisName || `Skill #${result.id}`;
  const prefix = result.aegisPrefix || result.type || null;
  const description = Array.isArray(result.description) ? result.description : [];
  const hasDescription = description.some((line) => String(line || '').trim());
  const spPreview = Array.isArray(result.spAmount) && result.spAmount.length > 0
    ? result.spAmount.length === 1 || result.spAmount.every((v) => v === result.spAmount![0])
      ? String(result.spAmount[0])
      : `${result.spAmount[0]}–${result.spAmount[result.spAmount.length - 1]}`
    : null;
  const rangePreview = Array.isArray(result.attackRange) && result.attackRange.length > 0
    ? String(Math.max(...result.attackRange))
    : null;
  const itemCosts = result.itemCosts || [];
  const teachers = result.teachers || [];
  const recipes = result.recipes || [];

  return (
    <div className="result-card result-card--skill">
      <div className="result-card-header skill-card-header">
        <AtlasSprite
          sprite={result.icon}
          alt={title}
          className="skill-card-icon"
          fallback={PLACEHOLDER_ITEM_ICON}
          fit={{ maxWidth: 32, maxHeight: 32 }}
        />
        <div className="skill-card-heading">
          <h3>
            {prefix && <span className="skill-prefix-badge">{prefix}</span>}
            {' '}
            <span className="name-title">
              <Link to={`/database?tab=skills&q=${result.id}&run=1`}>{title}</Link>
            </span>
            {' '}
            <span className="result-card-id">#{result.id}</span>
            {result.isPlatinum && <span className="skill-flag-badge skill-flag-badge--platinum">Platinum</span>}
            {result.isQuest && <span className="skill-flag-badge skill-flag-badge--quest">Quest</span>}
          </h3>
          <div className="skill-card-meta">
            {result.maxLv != null && <span>Max Lv {result.maxLv}</span>}
            {result.skillType && <span>{result.skillType}</span>}
            {spPreview != null && <span>SP {spPreview}</span>}
            {rangePreview != null && <span>Rango {rangePreview}</span>}
            {result.mobCount > 0 && <span>{result.mobCount.toLocaleString()} mobs</span>}
            {result.useCount > 0 && <span>{result.useCount.toLocaleString()} usos</span>}
          </div>
          {result.aegisName && result.aegisName !== title && (
            <div className="skill-card-aegis">{result.aegisName}</div>
          )}
        </div>
      </div>

      {hasDescription && (
        <div className="result-card-section">
          <div className="result-card-description skill-desc-body">
            <div className="result-card-description-content">
              {processColoredText(description.join('\n'))}
            </div>
          </div>
        </div>
      )}

      {itemCosts.length > 0 && (
        <div className="result-card-section">
          <div className="result-card-script-header">Consumo</div>
          <ul className="skill-variant-list">
            {itemCosts.slice(0, 12).map((cost, index) => {
              const label = cost.itemName || cost.itemAegisName || 'ítem';
              const amount = cost.amount != null ? `×${cost.amount}` : null;
              const level = cost.level != null ? `Lv ${cost.level}` : null;
              const text = [label, amount, level].filter(Boolean).join(' · ');
              return (
                <li key={`${cost.itemAegisName}-${index}`}>
                  {cost.itemId != null ? (
                    <Link to={`/database?tab=items&q=${cost.itemId}&run=1`}>{text}</Link>
                  ) : text}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {teachers.length > 0 && (
        <div className="result-card-section">
          <div className="result-card-script-header">Maestros</div>
          <ul className="skill-variant-list">
            {teachers.slice(0, 8).map((teacher, index) => {
              const place = teacher.mapId
                ? `${teacher.mapId}${teacher.x != null && teacher.y != null ? ` (${teacher.x}, ${teacher.y})` : ''}`
                : null;
              const parts = [
                teacher.npcName || teacher.npcId || 'NPC',
                teacher.grantKind,
                place
              ].filter(Boolean);
              return (
                <li key={`${teacher.npcId}-${index}`}>
                  {teacher.npcId ? (
                    <Link to={`/database?tab=npcs&q=${encodeURIComponent(teacher.npcId)}&run=1`}>
                      {parts.join(' · ')}
                    </Link>
                  ) : parts.join(' · ')}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {recipes.length > 0 && (
        <div className="result-card-section">
          <div className="result-card-script-header">Produce</div>
          <ul className="skill-variant-list">
            {recipes.slice(0, 12).map((recipe, index) => {
              const label = recipe.resultName || recipe.resultAegisName || 'resultado';
              const amount = recipe.resultAmount != null && recipe.resultAmount !== 1
                ? `×${recipe.resultAmount}`
                : null;
              const level = recipe.skillLevel != null ? `Lv ${recipe.skillLevel}` : null;
              const text = [label, amount, level, recipe.family].filter(Boolean).join(' · ');
              return (
                <li key={`${recipe.recipeId}-${index}`}>
                  {recipe.resultItemId != null ? (
                    <Link to={`/database?tab=items&q=${recipe.resultItemId}&run=1`}>{text}</Link>
                  ) : text}
                </li>
              );
            })}
          </ul>
        </div>
      )}

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
