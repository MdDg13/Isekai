# Data Model Restructure Plan

## Overview

Restructuring the data model to separate **World-level** content (shared across all campaigns) from **Campaign-level** content (specific to one game/story).

## World-Level Content (Shared Across All Campaigns)

These are created once and shared by all campaigns in that world:

- **Maps** - Geographic maps of the world
- **Entities** - General entities (cities, kingdoms, organizations)
- **Populations** - NPCs that exist in the world (not tied to a specific campaign)
- **NPCs** - Non-player characters that are part of the world lore
- **Locations** - Places in the world (cities, dungeons, landmarks)
- **Items** - Items that exist in the world (magic items, artifacts, equipment)
- **Lore** - World history, mythology, legends
- **Climate** - Weather patterns, seasons, environmental conditions
- **Technology** - Tech level, magic systems, available tools/weapons
- **Factions** - Organizations, guilds, religions, governments
- **Races/Cultures** - Available races and cultures in the world

## Campaign-Level Content (Specific to One Game)

These are created per campaign and track game progress:

- **Arcs** - Story arcs specific to this campaign
- **Beats** - Story beats within arcs
- **Encounters** - Combat encounters that happened/will happen
- **Characters** - Player characters (PCs) in this campaign
- **Sessions** - Session logs and notes
- **Time Period** - When in the world's timeline this campaign takes place
- **World State Changes** - How the campaign affects/changes the world
- **Campaign-Specific NPCs** - NPCs created specifically for this campaign (different from world NPCs)
- **Shops** - Shops available in this campaign
- **Scenes** - Scenes/descriptions for this campaign
- **Treasure** - Loot generated for this campaign

## Schema Changes Required

### New World-Level Tables

1. **world_npc** (rename from `npc`, move to world level)
   - `world_id` (not `campaign_id`)
   - Remove campaign-specific fields
   - Add world-level context

2. **world_location** (rename from `location`, move to world level)
   - `world_id` (not `campaign_id`)

3. **world_item** (rename from `item`, move to world level)
   - `world_id` (not `campaign_id`)

4. **world_map** (new table)
   - `world_id`
   - `name`, `description`, `image_url`, `bounds`, etc.

5. **world_lore** (new table)
   - `world_id`
   - `title`, `category` (history, mythology, legend), `content`, etc.

6. **world_climate** (new table)
   - `world_id`
   - `region`, `season`, `temperature`, `weather_patterns`, etc.

7. **world_technology** (new table)
   - `world_id`
   - `category`, `name`, `description`, `availability`, etc.

8. **world_faction** (new table)
   - `world_id`
   - `name`, `type`, `description`, `headquarters`, etc.

### Campaign-Level Tables (Keep/Modify)

1. **campaign** - Keep as is
2. **arc** - Keep as is (campaign-specific)
3. **beat** - Keep as is (campaign-specific)
4. **encounter** - Keep as is (campaign-specific)
5. **campaign_character** (new) - Player characters
   - `campaign_id`
   - `player_id`, `name`, `class`, `level`, `stats`, etc.

6. **campaign_session** (new) - Session logs
   - `campaign_id`
   - `date`, `notes`, `summary`, etc.

7. **campaign_npc** (new) - Campaign-specific NPCs
   - `campaign_id`
   - Links to `world_npc` if applicable, or standalone

8. **campaign_world_state** (new) - Track world changes from campaign
   - `campaign_id`
   - `change_type`, `description`, `affected_world_id`, etc.

### Migration Strategy

1. Create new world-level tables
2. Migrate existing NPCs/locations/items to world level (if they should be shared)
3. Create campaign-specific tables
4. Update RLS policies
5. Update application code

## Next Steps

1. Create updated schema.sql with new structure
2. Create migration scripts
3. Update RLS policies
4. Update application code to use new structure

