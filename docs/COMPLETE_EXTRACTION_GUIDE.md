# Complete Extraction Guide

## Overview

This guide provides complete examples and extraction patterns for all data types: classes, subclasses, races, feats, enhanced monsters (with all combat data), and comprehensive items (mundane to magical, potions, poisons, spell components, enchantments).

## Extraction Status

### ✅ Ready for Extraction

1. **Classes** - Complete with hit dice, proficiencies, class features, spellcasting
2. **Subclasses** - Complete with parent class, level granted, features
3. **Races** - Complete with ability scores, traits, languages, subraces
4. **Feats** - Complete with prerequisites, benefits, description
5. **Enhanced Monsters** - Complete with traits, actions, legendary actions, reactions, **lair actions**
6. **Enhanced Items** - All types with cost normalization

### Cost Normalization

- Uses "Sane Magical Prices" as primary reference
- Estimates based on rarity when cost missing
- Converts all costs to gold pieces with breakdown (cp, sp, gp, pp)
- See `scripts/cost-normalizer.ts` for implementation

## Schema Update Required

**Lair Actions**: The `reference_monster` table needs a `lair_actions` JSONB field to store lair action data. Currently extracted but not in schema.

## Complete Examples

See `docs/EXTRACTION_EXAMPLES.md` for full examples of each data type with all variables.

### Quick Reference

1. **Monster** - 30+ fields including all combat data
2. **Class** - 10+ fields including spellcasting and features by level
3. **Subclass** - Parent class, features by level
4. **Race** - Ability scores, traits, languages, subraces
5. **Feat** - Prerequisites, benefits, description
6. **Item (Mundane)** - Cost, weight, properties
7. **Item (Magic)** - Rarity, attunement, enchantments
8. **Item (Potion)** - Healing/buff properties
9. **Item (Poison)** - DC, damage, save type
10. **Item (Spell Component)** - Minimum value, used in spells
11. **Item (Enchantment)** - Attack/damage bonuses, stackability
12. **Background** - Proficiencies, equipment, feature, personality tables

## Usage

### Run Enhanced Extraction
```bash
npm run extract-enhanced -- Downloads data/free5e/processed
```

### Output Files
- `classes-extracted.json`
- `subclasses-extracted.json`
- `races-extracted.json`
- `feats-extracted.json`
- `monsters-enhanced.json` (includes lair_actions)
- `items-enhanced.json` (all item types with normalized costs)

## Extraction Patterns

### Monster Extraction
- Extracts: name, size, type, subtype, alignment, AC, HP, speed, stats
- Extracts: saving_throws, skills, damage_resistances/immunities, condition_immunities
- Extracts: senses, languages, CR, XP
- **Extracts**: traits (array), actions (array with attack_bonus, damage), legendary_actions (array with cost), reactions (array), **lair_actions (array)**

### Item Extraction
- Handles: weapons, armor, tools, consumables, magic items
- Handles: potions, poisons, spell components, enchantments
- Normalizes costs using "Sane Magical Prices" reference
- Estimates costs based on rarity when missing
- Extracts properties (finesse, versatile, etc.)
- Extracts attunement requirements

### Class Extraction
- Extracts: hit dice, hit points at 1st/higher levels
- Extracts: proficiencies (armor, weapons, tools, saving throws, skills)
- Extracts: class features by level (array)
- Extracts: spellcasting info (ability, save DC, attack modifier, slots, cantrips)
- Extracts: starting equipment, multiclassing

### Race Extraction
- Extracts: size, speed, ability score increases
- Extracts: traits (array with name, description)
- Extracts: languages, subraces (array)

### Feat Extraction
- Extracts: name, prerequisites, benefits, description

## Cost Normalization Reference

### Rarity-Based Estimates (from Sane Magical Prices)
- **Common**: 50-100 gp (typical: 75 gp)
- **Uncommon**: 100-500 gp (typical: 300 gp)
- **Rare**: 500-5,000 gp (typical: 2,500 gp)
- **Very Rare**: 5,000-50,000 gp (typical: 25,000 gp)
- **Legendary**: 50,000+ gp (typical: 250,000 gp)

### Known Costs (Sample from Sane Magical Prices)
- Potion of Healing: 50 gp
- Potion of Greater Healing: 150 gp
- +1 Weapon: 500 gp
- +2 Weapon: 4,000 gp
- +3 Weapon: 32,000 gp
- Flametongue: 5,000 gp
- Ring of Protection: 3,500 gp
- Staff of Power: 20,000 gp

## Next Steps

1. **Update Schema**: Add `lair_actions` JSONB field to `reference_monster` table
2. **Run Extraction**: Execute `npm run extract-enhanced`
3. **Validate Data**: Run `npm run validate-extracted`
4. **Review Samples**: Run `npm run sample-data`
5. **Load to Database**: Use `populate-reference-tables.ps1` with enhanced data

---

**Status**: Ready for extraction
**Examples**: See `docs/EXTRACTION_EXAMPLES.md` for complete examples

