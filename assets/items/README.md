# Item taxonomy

Generated from the live rAthena database and active scripts:

```bash
python3 tools/generate_item_taxonomy.py
```

Output: `ozro-site/assets/items/taxonomy.json`

The website serves this file as `/assets/items/taxonomy.json`. It is meant to be the
source of truth for future custom NPCs, quests, events and item filters.

## How sources are detected

- **Mob / MVP drops**: `db/re/mob_db.yml` + `db/import/mob_db.yml`.
- **Map drops**: `db/re/map_drops.yml` + `db/import/map_drops.yml`.
- **NPC shops**: active `shop`/`itemshop`/`pointshop`/`marketshop`/`cashshop` lines,
  plus the `npc_buyable` flag from the ragnabots master list when available.
- **Cash shop**: `db/import/item_cash.yml`.
- **Quests / instances / NPC scripts**: item references in active scripts loaded from
  `npc/re/scripts_main.conf`. `getitem*` marks rewards; `delitem`/`countitem` marks
  requirements. Item IDs passed to `callsub S_Make` are treated as NPC/crafting
  references (e.g. Nightmare Biolab hats).
- **Skills**: `ItemCost` in `db/re/skill_db.yml` + `db/import/skill_db.yml`.
- **Crafting**: `produce_db.txt` outputs/materials and Laphine synthesis
  requirements/reward groups.
- **Groups / packages**: `item_group_db.yml`, `item_packages.yml`.
- **Spawns**: `ozro-site/assets/spawns/spawns.json` to classify normal, instance and
  guild-dungeon drops. Mobs without a known spawn are marked as `unknown_drop`.

## Categories

| Category | Meaning |
|----------|---------|
| `junk` | Conservative Garrett pool: `Etc`, sell value ≤ 2,000, droppable, not used by content, not untradeable, not part of a group/package. |
| `junk_low` / `junk_mid` / `junk_high` | Sub-tiers of `junk` by sell value (≤500, 501–1,000, 1,001–2,000). |
| `junk_npc_unused` | Same as `junk` but ignoring group/package membership and trade restrictions. Useful to review before filtering by market price. |
| `garrett_candidates` | `junk_npc_unused` minus untradeable items. This is the pool to cross with the ragnabots price list; it keeps group/package members like Spoon Stub or Tattered Clothes. |
| `untradeable` | Has `NoSell`, `NoTrade` or `NoDrop`; excluded from `garrett_candidates` to avoid buying quest/crafting materials. |
| `garrett_whitelist` | Items currently listed in `npc/custom/ozro/trasher.txt`. |
| `quest_referenced` / `instance_referenced` / `npc_referenced` | Item appears in quest, instance or other active NPC scripts. |
| `quest_only` | Only known source is a quest reward. |
| `instance_only` | Only known sources are instance drops/rewards. |
| `instance_or_quest_only` | Every known source is an instance drop/reward or a quest reward. |
| `instance_drop_only` | All known drop maps are instance maps. |
| `guild_dungeon_drop_only` | All known drop maps are guild dungeons (`gld*`). |
| `instance_or_guild_drop_only` | All drops are instance/guild and there is no other source. |
| `skill_cost` | Required by a skill's `ItemCost`. |
| `scripted` | Item has an item script. |
| `consumable_scripted` | Item script on a consumable/healing/delay/cash item. |
| `used_in_combo` | Part of an item combo. |
| `craft_material` / `craft_output` | Used or produced by crafting. |
| `npc_shop` / `cash_shop` | Purchasable from an NPC shop or the cash shop. |
| `mob_drop` / `map_drop` | Has a monster or map drop source. |
| `group_member` / `package_member` | Appears in an item group or selectable package. |
| `group_or_package_only` | No direct source, but appears in a group/package. Review before treating as unobtainable. |
| `unobtainable` | No direct source, group or package found. Conservative: it can still be an event/donation item outside the DB. |

## Notes

- `unobtainable` is intentionally conservative. An item is only marked unobtainable
  when no drop, shop, cash shop, quest/instance/NPC reward, crafting recipe, group or
  package references it.
- `instance_drop_only` and `guild_dungeon_drop_only` use the current spawn map cache.
  Mobs spawned dynamically by instance scripts may appear as `unknown_drop`.
- Items with display-name collisions are resolved by AegisName first. Script references
  that use only a display name may still be ambiguous.
- Re-run the generator after changing item, mob, quest, skill, shop or spawn data.
