import { Link } from 'react-router-dom';
import type { QuestDetail } from '../api/client';
import { formatFilterLabel, mapDetailHref } from '../api/databaseMappers';

export type QuestResult = QuestDetail;

interface QuestCardProps {
  result: QuestResult;
}

const numberFormat = new Intl.NumberFormat('es');

function formatRate(rate: number | null | undefined, unit: string | null | undefined) {
  if (rate == null) return null;
  if (unit === 'per_10000') {
    return `${(rate / 100).toFixed(rate % 100 === 0 ? 0 : 2)}%`;
  }
  return `${numberFormat.format(rate)}${unit ? ` ${unit}` : ''}`;
}

function formatDuration(seconds: number | null | undefined, raw: string | null | undefined) {
  if (seconds != null && seconds > 0) {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)} h`;
    return `${Math.round(seconds / 86400)} d`;
  }
  return raw || null;
}

function formatNpcReason(reason: string | null | undefined) {
  if (!reason) return null;
  if (reason === 'same_id') return 'script de quest';
  if (reason === 'same_file') return 'mismo archivo';
  return formatFilterLabel(reason);
}

function formatMergeReason(reason: string | null | undefined) {
  if (!reason) return null;
  if (reason === 'script_transition') return 'script_transition';
  if (reason === 'same_title_contig') return 'same_title_contig';
  return reason;
}

const QuestCard = ({ result }: QuestCardProps) => {
  const members = result.members || [];
  const targets = result.targets || [];
  const drops = result.drops || [];
  const npcs = result.npcs || [];
  const timeLabel = formatDuration(result.timeLimit?.seconds, result.timeLimit?.raw);
  const focusQuestId = result.focusQuestId ?? null;
  const mergeLabel = formatMergeReason(result.primaryMergeReason);

  return (
    <div className="result-card result-card--quest">
      <div className="result-card-header">
        <div className="result-card-heading">
          <h3>
            <span className="name-title">
              <Link to={`/database?tab=quests&q=${encodeURIComponent(result.id)}&run=1`}>
                {result.title}
              </Link>
            </span>
            {' '}
            <span className="result-card-id">{result.id}</span>
          </h3>
          <div className="result-card-meta">
            {(result.memberCount ?? 0) > 0 && (
              <span>
                {result.memberCount} paso{result.memberCount === 1 ? '' : 's'}
              </span>
            )}
            {(result.npcCount ?? 0) > 0 && (
              <span>{result.npcCount} NPC{result.npcCount === 1 ? '' : 's'}</span>
            )}
            {(result.targetCount ?? 0) > 0 && (
              <span>
                {result.targetCount} objetivo{result.targetCount === 1 ? '' : 's'}
              </span>
            )}
            {(result.dropCount ?? 0) > 0 && (
              <span>{result.dropCount} drop{result.dropCount === 1 ? '' : 's'}</span>
            )}
            {timeLabel && <span>Límite {timeLabel}</span>}
            {mergeLabel && <span>{mergeLabel}</span>}
          </div>
        </div>
      </div>

      {members.length > 0 && (
        <div className="result-card-section">
          <div className="result-card-script-header">
            Pasos ({members.length})
          </div>
          <ul className="npc-shop-list">
            {members.map((member) => {
              const qid = member.questId;
              const isFocus = qid != null && focusQuestId != null && qid === focusQuestId;
              const label = [
                qid != null ? `#${qid}` : null,
                member.title || null
              ].filter(Boolean).join(' ');
              return (
                <li key={`${qid}-${member.sortIndex}`}>
                  {qid != null ? (
                    <Link to={`/database?tab=quests&q=${qid}&run=1`}>
                      {isFocus ? <strong>{label}</strong> : label}
                    </Link>
                  ) : (
                    <span>{label || 'Paso'}</span>
                  )}
                  {(member.targetCount || 0) > 0 && (
                    <span className="acquisition-meta">
                      {' · '}
                      {member.targetCount} obj.
                    </span>
                  )}
                  {(member.dropCount || 0) > 0 && (
                    <span className="acquisition-meta">
                      {' · '}
                      {member.dropCount} drop
                      {member.dropCount === 1 ? '' : 's'}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {targets.length > 0 && (
        <div className="result-card-section">
          <div className="result-card-script-header">
            Objetivos
            {focusQuestId != null ? ` (#${focusQuestId})` : ''}
            {' '}
            ({result.targetTotal ?? targets.length})
          </div>
          <ul className="npc-shop-list">
            {targets.map((target, index) => {
              const label = [
                target.mobName || (target.mobId != null ? `Mob #${target.mobId}` : null),
                target.count != null ? `×${numberFormat.format(target.count)}` : null,
                target.race ? formatFilterLabel(target.race) : null,
                target.minLevel != null ? `Lv≥${target.minLevel}` : null
              ].filter(Boolean).join(' · ');
              return (
                <li key={`${target.targetIndex}-${target.mobSubindex}-${index}`}>
                  {target.mobId != null ? (
                    <Link to={`/database?tab=mobs&q=${target.mobId}&run=1`}>
                      {label || `Mob #${target.mobId}`}
                    </Link>
                  ) : (
                    <span>{label || 'Objetivo'}</span>
                  )}
                  {target.location && (
                    <span className="acquisition-meta">
                      {' · '}
                      <Link to={mapDetailHref(target.location)}>{target.location}</Link>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          {(result.targetTotal ?? 0) > targets.length && (
            <div className="acquisition-more">
              +{(result.targetTotal || 0) - targets.length} objetivos más
            </div>
          )}
        </div>
      )}

      {drops.length > 0 && (
        <div className="result-card-section">
          <div className="result-card-script-header">
            Drops de quest
            {focusQuestId != null ? ` (#${focusQuestId})` : ''}
            {' '}
            ({result.dropTotal ?? drops.length})
          </div>
          <ul className="npc-shop-item-list">
            {drops.map((drop, index) => {
              const rate = formatRate(drop.rate, drop.rateUnit);
              const mob = drop.mobName || (drop.mobId != null ? `Mob #${drop.mobId}` : null);
              return (
                <li key={`${drop.dropIndex}-${index}`}>
                  {drop.itemId != null ? (
                    <Link to={`/database?tab=items&q=${drop.itemId}&run=1`}>
                      {drop.itemName || `#${drop.itemId}`}
                    </Link>
                  ) : (
                    <span>{drop.itemName || 'Ítem'}</span>
                  )}
                  {rate && <span className="acquisition-meta"> · {rate}</span>}
                  {mob && (
                    <span className="acquisition-meta">
                      {' · '}
                      {drop.mobId != null ? (
                        <Link to={`/database?tab=mobs&q=${drop.mobId}&run=1`}>{mob}</Link>
                      ) : (
                        mob
                      )}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {npcs.length > 0 && (
        <div className="result-card-section">
          <div className="result-card-script-header">
            NPCs ({result.npcTotal ?? npcs.length})
          </div>
          <ul className="npc-shop-list">
            {npcs.map((npc) => {
              const reason = formatNpcReason(npc.primaryReason)
                || (npc.role ? formatFilterLabel(npc.role) : null);
              return (
                <li key={npc.linkId}>
                  {npc.npcId ? (
                    <Link to={`/database?tab=npcs&q=${encodeURIComponent(npc.npcId)}&run=1`}>
                      {npc.name || npc.npcId}
                    </Link>
                  ) : (
                    <span>{npc.name || 'NPC'}</span>
                  )}
                  {reason && (
                    <span className="acquisition-meta"> · {reason}</span>
                  )}
                  {npc.mapId && (
                    <span className="acquisition-meta">
                      {' · '}
                      <Link
                        to={mapDetailHref(
                          npc.mapId,
                          npc.x != null && npc.y != null ? { x: npc.x, y: npc.y } : null
                        )}
                      >
                        {npc.mapId}
                        {npc.x != null && npc.y != null ? ` (${npc.x}, ${npc.y})` : ''}
                      </Link>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          {(result.npcTotal ?? 0) > npcs.length && (
            <div className="acquisition-more">
              +{(result.npcTotal || 0) - npcs.length} NPCs más
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestCard;
