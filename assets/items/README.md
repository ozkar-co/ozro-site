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
| `junk` | Conservative junk pool: `Etc`, sell value ≤ 2,000, droppable, not used by content, not untradeable, not part of a group/package. |
| `junk_low` / `junk_mid` / `junk_high` | Sub-tiers of `junk` by sell value (≤500, 501–1,000, 1,001–2,000). |
| `junk_npc_unused` | Same as `junk` but ignoring group/package membership and trade restrictions. Useful to review before filtering by market price. |
| `untradeable` | Has `NoSell`, `NoTrade` or `NoDrop`. |
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
| `unobtainable_no_image` | `unobtainable` items without a client item/collection image. Tracked so they are not used by accident until assets are added. |
| `obtainable_no_image` | Obtainable items without a client item/collection image. Candidate list for custom artwork. |

Item image coverage (`icon`, `collection`, `sprite`) comes from `assets/items/item-images.json`,
generated from the active client GRFs and `data/itemInfo_EN.lua`. Unidentified placeholder
entries are excluded from both `*_no_image` categories.

Item atlases come from **ozro-cli** (`python3 tools/build_web_atlases.py`). Taxonomy:

```bash
python3 ../rathena/tools/generate_item_taxonomy.py
```

## Access metadata

Each item in `items` also carries an `access` object derived from its sources:

| Field | Meaning |
|-------|---------|
| `best` | Best known access: `normal`, `guild`, `instance`, `npc`, `cash`, `craft`, `quest`, `group`, `unknown` or `none`. |
| `normalMaps` / `guildMaps` / `instanceMaps` | Number of known drop maps by kind. |
| `dropMobs` / `spawnMobs` | Drop mobs and how many of them have a known spawn. |
| `bossOnly` | Every drop mob is a boss/MVP source. |
| `minMobHp` / `maxMobHp` | Effective HP range of spawn-capable source mobs (after server HP rates). |
| `highHp` | The easiest source is at or above the `highHpThreshold` rule. |
| `highHpSource` | At least one source is at or above the threshold, but an easier source exists. |
| `noSpawn` | Drop mobs exist but none has a known spawn. |
| `restrictions` | Tags such as `instance_only`, `guild_only`, `quest_source`, `boss_only`, `high_hp`. |
| `commonFarmEligible` | Rule result: normal map, non-boss, and not `high_hp`. |

These are metadata tags, not categories. Consumers decide which restrictions
matter for their NPC, quest or market rule.

## Notes

- `unobtainable` is intentionally conservative. An item is only marked unobtainable
  when no drop, shop, cash shop, quest/instance/NPC reward, crafting recipe, group or
  package references it.
- `instance_drop_only` and `guild_dungeon_drop_only` use the current spawn map cache.
  Mobs spawned dynamically by instance scripts may appear as `unknown_drop`.
- Items with display-name collisions are resolved by AegisName first. Script references
  that use only a display name may still be ambiguous.
- Re-run the generator after changing item, mob, quest, skill, shop or spawn data.
- Missions below the 500,000 minimum are not offered as contracts; they remain in daily offers.
- The table lowers quantities when weight or payout cap requires it; it does not
  cap the payout first.
- Current output: 39 mission contracts (14 common, 16 uncommon, 9 rare).
