# Extraction Preparation Summary

## Ready for Extraction

### 1. Classes & Subclasses
- **Status**: ✅ Parsing functions created
- **Sources**: Player's Handbook, Tasha's Cauldron, Xanathar's Guide
- **Fields Extracted**:
  - Classes: name, hit_dice, hit_points_at_1st_level, hit_points_at_higher_levels, proficiencies, class_features, spellcasting, starting_equipment, multiclassing
  - Subclasses: name, parent_class, level_granted, description, features (array with level, name, description)

### 2. Races
- **Status**: ✅ Parsing functions created
- **Sources**: Player's Handbook, Volo's Guide, Tasha's Cauldron
- **Fields Extracted**: name, size, speed, ability_score_increases, traits, languages, subraces

### 3. Feats
- **Status**: ✅ Parsing functions created
- **Sources**: Player's Handbook, supplements
- **Fields Extracted**: name, prerequisites, benefits, description

### 4. Enhanced Monsters
- **Status**: ✅ Enhanced parsing functions created
- **Sources**: Monster Manual, Volo's Guide, supplements
- **Fields Extracted**: 
  - Core: name, size, type, subtype, alignment, armor_class, armor_class_type, hit_points, hit_dice, speed, stats
  - Defenses: saving_throws, skills, damage_resistances, damage_immunities, condition_immunities
  - Senses & Communication: senses, languages
  - Challenge: challenge_rating, xp
  - **Combat**: traits, actions, legendary_actions, reactions, **lair_actions** (note: may need schema update)

### 5. Enhanced Items
- **Status**: ✅ Enhanced parsing functions created
- **Sources**: All PDFs (Player's Handbook, DMG, Tasha's, Xanathar's, supplements)
- **Item Types Handled**:
  - Mundane weapons & armor
  - Magic weapons & armor
  - Potions (healing, buffs, etc.)
  - Poisons
  - Spell components
  - Item enchantments/characteristics
  - Tools & equipment
- **Fields Extracted**: name, kind, category, rarity, cost_gp, cost_breakdown, weight_lb, description, properties, attunement, attunement_requirements
- **Cost Normalization**: Uses "Sane Magical Prices" reference and rarity-based estimation

## Cost Normalization System

### Reference: "Sane Magical Prices"
- Common items: 50-100 gp
- Uncommon items: 100-500 gp
- Rare items: 500-5,000 gp
- Very Rare items: 5,000-50,000 gp
- Legendary items: 50,000+ gp

### Cost Estimation Logic
1. Check known costs from "Sane Magical Prices" database
2. If not found, estimate based on rarity tier
3. Adjust for item type (armor costs 20% more, consumables 50% less)
4. Convert all costs to gold pieces with breakdown (cp, sp, gp, pp)

## Schema Note: Lair Actions

The `reference_monster` table currently includes:
- `traits` (JSONB)
- `actions` (JSONB)
- `legendary_actions` (JSONB)
- `reactions` (JSONB)

**Missing**: `lair_actions` (JSONB) - needs to be added to schema or stored in a separate table.

## Usage

### Run Enhanced Extraction
```bash
npm run extract-enhanced -- Downloads data/free5e/processed
```

This will extract:
- Classes → `classes-extracted.json`
- Subclasses → `subclasses-extracted.json`
- Races → `races-extracted.json`
- Feats → `feats-extracted.json`
- Enhanced Monsters → `monsters-enhanced.json` (with all combat data)
- Enhanced Items → `items-enhanced.json` (all item types with normalized costs)

### Merge with Existing Data
After extraction, merge with existing data:
```bash
# Merge monsters (enhanced has more fields)
# Merge items (enhanced has cost normalization)
```

## Full Examples

See `docs/EXTRACTION_EXAMPLES.md` for complete examples of each data type with all variables populated.

---

**Status**: Ready for extraction
**Next Step**: Run `npm run extract-enhanced` to begin extraction

