# Free5e Reference Library Documentation

## Overview

The Free5e Reference Library is a comprehensive database of game content from Free5e (Creative Commons Attribution 4.0), stored in Supabase reference tables. This library serves as a shared resource for all worlds and campaigns, providing items, spells, monsters, classes, races, backgrounds, feats, and other game elements.

## Architecture

### Reference Tables

All reference tables follow a consistent pattern:

- **Source tracking**: `source` field indicates origin (`Free5e` or `custom`)
- **Metadata**: `page_reference`, `tags`, `created_at`, `created_by`
- **Unique constraints**: Most tables have unique constraints on `(name, source)` to prevent duplicates
- **Indexes**: Optimized for common queries (name, type, rarity, CR, level, etc.)

### Table Structure

#### `reference_item`
Stores weapons, armor, tools, consumables, and magic items.

**Key Fields:**
- `name`, `kind`, `category`, `rarity`
- `cost_gp` (standardized to gold pieces)
- `weight_lb`, `description`, `properties` (JSONB)
- `attunement`, `attunement_requirements`

#### `reference_spell`
Stores all spells with complete spellcasting information.

**Key Fields:**
- `name`, `level` (0-9), `school`
- `casting_time`, `range`, `components`, `material_components`
- `duration`, `description`, `higher_level`
- `ritual`, `concentration`

#### `reference_monster`
Stores monster stat blocks with complete combat information.

**Key Fields:**
- `name`, `size`, `type`, `subtype`, `alignment`
- `armor_class`, `hit_points`, `hit_dice`, `speed` (JSONB)
- `stats` (JSONB: str, dex, con, int, wis, cha)
- `challenge_rating`, `xp`
- `traits`, `actions`, `legendary_actions`, `reactions` (JSONB arrays)

#### `reference_class`
Stores class information with features by level.

**Key Fields:**
- `name`, `hit_dice`
- `hit_points_at_1st_level`, `hit_points_at_higher_levels`
- `proficiencies` (JSONB)
- `starting_equipment` (JSONB)
- `class_features` (JSONB array by level)

#### `reference_race`
Stores race information with traits and ability score increases.

**Key Fields:**
- `name`, `size`, `speed`
- `ability_score_increases` (JSONB)
- `traits` (JSONB array)
- `languages`, `subraces` (JSONB)

#### `reference_background`
Stores background information with proficiencies and features.

**Key Fields:**
- `name`
- `skill_proficiencies`, `tool_proficiencies`, `languages` (arrays)
- `equipment` (JSONB)
- `feature_name`, `feature_description`
- `personality_traits`, `ideals`, `bonds`, `flaws` (arrays)

#### `reference_feat`
Stores feat information with prerequisites and benefits.

**Key Fields:**
- `name`, `prerequisites`, `benefits`, `description`

#### `reference_trait`
Stores personality traits, ideals, bonds, and flaws.

**Key Fields:**
- `name`, `category` (personality_trait, ideal, bond, flaw)
- `description`, `associated_background`

#### `reference_location_name_component`
Stores components for procedural location name generation.

**Key Fields:**
- `component_type` (prefix, suffix, root, descriptor)
- `text`, `category`, `culture`, `frequency`

#### `reference_terrain_type`
Stores terrain and biome information for map generation.

**Key Fields:**
- `name`, `category` (biome, climate, elevation)
- `travel_modifier` (movement cost multiplier)
- `texture_tags` (for map rendering)
- `encounter_modifiers` (JSONB)

#### `reference_map_tile`
Stores map tile assets for rendering.

**Key Fields:**
- `name`, `tile_type` (terrain, structure, poi_marker)
- `category`, `image_url`, `width`, `height`, `tags`

#### `reference_equipment_pack`
Stores starting equipment packages.

**Key Fields:**
- `name`, `cost_gp`, `contents` (JSONB), `weight_lb`

## Data Acquisition

### Sources

1. **Free5e Official Sources**
   - Player Handbook (PDF/JSON)
   - Game Master Guide (PDF/JSON)
   - Monster Manual (PDF/JSON)

2. **License**: Creative Commons Attribution 4.0 (CC-BY-4.0)
   - Free to use, modify, and distribute
   - Attribution required
   - No commercial restrictions

### Acquisition Process

1. **Download** (`scripts/acquire-free5e-data.ps1`)
   - Downloads Free5e source materials
   - Validates license compliance
   - Stores raw data in `data/free5e/raw/`

2. **Process** (`scripts/process-free5e-data.ps1`)
   - Extracts structured data from raw sources
   - Normalizes formats (costs, weights, stats)
   - Stores processed data in `data/free5e/processed/`

3. **Validate** (`scripts/validate-free5e-data.ps1`)
   - Validates completeness and consistency
   - Checks rule compliance (CR calculations, stat ranges)
   - Generates validation reports

4. **Populate** (`scripts/populate-reference-tables.ps1`)
   - Inserts validated data into Supabase
   - Uses batch insertion for performance
   - Handles errors and retries

## Custom Content

DMs can create custom content that extends the Free5e library:

1. **API Endpoint**: `functions/api/create-custom-reference.ts`
   - Accepts custom items, spells, monsters, etc.
   - Validates against Free5e mechanics
   - Stores with `source='custom'`

2. **Validation**
   - Custom content must follow Free5e rules
   - CR calculations validated
   - Stat ranges checked
   - Spell levels limited to 0-9

3. **Sharing** (Future)
   - Export/import custom content
   - Community content library
   - Rating and review system

## Usage in Application

### Querying Reference Data

Use `functions/_lib/supabase-reference.ts` helpers:

```typescript
import { createReferenceClient, queryReferenceItems } from '../_lib/supabase-reference';

const client = createReferenceClient({ supabaseUrl, serviceRoleKey });
const items = await queryReferenceItems(client, {
  kind: 'weapon',
  rarity: 'rare',
  search: 'sword',
  limit: 10
});
```

### Integration with World Generation

Reference data is used throughout the application:

- **NPC Generation**: Pulls from `reference_class`, `reference_race`, `reference_background`
- **Item Generation**: References `reference_item` for stats and properties
- **Encounter Generation**: Uses `reference_monster` for stat blocks
- **Spell Lists**: Queries `reference_spell` for class spell lists

### Linking to World Content

World-specific content can reference library items:

- `world_item` can link to `reference_item.id`
- Campaign encounters can reference `reference_monster.id`
- NPCs can use `reference_class` and `reference_race` data

## Maintenance

### Updating Reference Library

1. **New Free5e Content**
   - Download updated sources
   - Process and validate
   - Use upsert to update existing records

2. **Errata and Corrections**
   - Update source data
   - Re-process affected content
   - Use upsert to correct records

3. **Extending Tables**
   - Add new fields to schema
   - Update processing scripts
   - Migrate existing data

### Quality Assurance

- Regular validation runs
- Cross-reference checks
- Stat block verification
- CR/XP consistency checks

## License Compliance

All Free5e content is used under Creative Commons Attribution 4.0:

- **Attribution**: Display "Free5e" source in UI
- **No Restrictions**: Can use commercially
- **Modification**: Can modify and extend
- **Distribution**: Can share modified versions

Custom content is owned by creators and subject to their terms.

## Performance Considerations

- **Indexes**: All reference tables have indexes on common query fields
- **Batch Operations**: Use batch insertion for large datasets
- **Caching**: Consider caching frequently accessed reference data
- **Lazy Loading**: Load reference data on-demand in UI

## Future Enhancements

- Community content sharing
- Version tracking for reference data
- Diff/merge tools for custom content
- Reference data analytics (most used items, spells, etc.)
- Integration with external Free5e resources

