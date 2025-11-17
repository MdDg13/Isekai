# Quality Control Examples

This document provides examples of good and bad data extractions to guide the quality control process.

## Good Extractions

### Example 1: Complete Spell Extraction ✅

**Source:** Player's Handbook, page 211

**Extracted Data:**
```json
{
  "name": "Fireball",
  "level": 3,
  "school": "evocation",
  "casting_time": "1 action",
  "range": "150 feet",
  "components": "V, S, M",
  "material_components": "a tiny ball of bat guano and sulfur",
  "duration": "Instantaneous",
  "description": "A bright streak flashes from your pointing finger to a point you choose within range and then blossoms with a low roar into an explosion of flame. Each creature in a 20-foot-radius sphere centered on that point must make a Dexterity saving throw. A target takes 8d6 fire damage on a failed save, or half as much damage on a successful one. The fire spreads around corners. It ignites flammable objects in the area that aren't being worn or carried.",
  "higher_level": "When you cast this spell using a spell slot of 4th level or higher, the damage increases by 1d6 for each slot level above 3rd.",
  "ritual": false,
  "concentration": false,
  "source": "Player's Handbook",
  "page_reference": "211",
  "extraction_confidence_score": 95
}
```

**Why it's good:**
- All required fields present
- Accurate data matching source
- Proper formatting
- High confidence score justified

---

### Example 2: Complete Monster Extraction ✅

**Source:** Monster Manual, page 8

**Extracted Data:**
```json
{
  "name": "Aboleth",
  "size": "Large",
  "type": "aberration",
  "subtype": null,
  "alignment": "lawful evil",
  "armor_class": 17,
  "armor_class_type": "natural armor",
  "hit_points": 135,
  "hit_dice": "18d10+36",
  "speed": {"walk": 10, "swim": 40},
  "stats": {"str": 21, "dex": 9, "con": 15, "int": 18, "wis": 15, "cha": 18},
  "saving_throws": {"con": "+6", "int": "+8", "wis": "+6"},
  "skills": {"history": "+12", "perception": "+10"},
  "damage_resistances": [],
  "damage_immunities": [],
  "condition_immunities": [],
  "senses": "darkvision 120 ft., passive Perception 20",
  "languages": "Deep Speech, telepathy 120 ft.",
  "challenge_rating": 10,
  "xp": 5900,
  "traits": [
    {
      "name": "Amphibious",
      "description": "The aboleth can breathe air and water."
    },
    {
      "name": "Mucous Cloud",
      "description": "While underwater, the aboleth is surrounded by transformative mucus. A creature that touches the aboleth or that hits it with a melee attack while within 5 feet of it must make a DC 14 Constitution saving throw. On a failure, the creature is diseased for 1d4 hours. The diseased creature can breathe only underwater."
    }
  ],
  "actions": [
    {
      "name": "Multiattack",
      "description": "The aboleth makes three tentacle attacks."
    },
    {
      "name": "Tentacle",
      "description": "Melee Weapon Attack: +9 to hit, reach 10 ft., one target. Hit: 12 (2d6 + 5) bludgeoning damage. If the target is a creature, it must succeed on a DC 14 Constitution saving throw or become diseased. The disease has no effect for 1 minute and can be removed by any magic that cures disease. After 1 minute, the diseased creature's skin becomes translucent and slimy, the creature can't regain hit points unless it is underwater, and the disease can be removed only by heal or another disease-curing spell of 6th level or higher. When the creature is outside a body of water, it takes 6 (1d12) acid damage every 10 minutes unless moisture is applied to the skin before 10 minutes have passed."
    }
  ],
  "source": "Monster Manual",
  "page_reference": "8",
  "extraction_confidence_score": 92
}
```

**Why it's good:**
- Complete stat block
- All traits and actions captured
- Proper JSON structure
- Accurate values

---

### Example 3: Complete Item Extraction ✅

**Source:** Player's Handbook, page 150

**Extracted Data:**
```json
{
  "name": "Longsword",
  "kind": "weapon",
  "category": "martial_melee",
  "rarity": null,
  "cost_gp": 15,
  "cost_breakdown": {"gp": 15},
  "weight_lb": 3,
  "weight_kg": 1.36,
  "estimated_real_weight_kg": 1.2,
  "volume_category": "sheath/quiver",
  "description": "A longsword is a versatile one-handed melee weapon.",
  "properties": {
    "versatile": "1d10"
  },
  "attunement": false,
  "source": "Player's Handbook",
  "page_reference": "150",
  "extraction_confidence_score": 88
}
```

**Why it's good:**
- All fields populated
- Proper weight conversion
- Correct volume category
- Accurate cost breakdown

---

## Bad Extractions

### Example 1: Missing Critical Data ❌

**Source:** Player's Handbook, page 211

**Extracted Data:**
```json
{
  "name": "Fireball",
  "level": 3,
  "school": "evocation",
  "casting_time": "1 action",
  "range": "150 feet",
  "components": "V, S, M",
  "duration": "Instantaneous",
  "description": "A bright streak flashes from your pointing finger...",
  "source": "Player's Handbook",
  "extraction_confidence_score": 45
}
```

**Issues:**
- ❌ Missing `material_components` (required when M is in components)
- ❌ Missing `higher_level` description
- ❌ Missing `ritual` and `concentration` flags
- ❌ Missing `page_reference`

**Feedback:**
```json
{
  "issue": "missing_data",
  "description": "Material components, higher level description, ritual/concentration flags, and page reference are missing",
  "expectedValue": "material_components: 'a tiny ball of bat guano and sulfur', higher_level: 'When you cast...', ritual: false, concentration: false, page_reference: '211'",
  "suggestedFix": "Improve regex to capture material components after 'M' in components field. Add pattern to extract higher level text. Check for ritual/concentration keywords in description."
}
```

---

### Example 2: Incorrect Data ❌

**Source:** Monster Manual, page 8

**Extracted Data:**
```json
{
  "name": "Aboleth",
  "size": "Medium",
  "type": "beast",
  "armor_class": 10,
  "hit_points": 50,
  "challenge_rating": 1,
  "source": "Monster Manual",
  "extraction_confidence_score": 30
}
```

**Issues:**
- ❌ Wrong size (should be "Large", not "Medium")
- ❌ Wrong type (should be "aberration", not "beast")
- ❌ Wrong armor class (should be 17, not 10)
- ❌ Wrong hit points (should be 135, not 50)
- ❌ Wrong challenge rating (should be 10, not 1)
- ❌ Missing most fields (stats, traits, actions, etc.)

**Feedback:**
```json
{
  "issue": "incorrect_data",
  "description": "Multiple fields have incorrect values. Size, type, AC, HP, and CR are all wrong. Most fields are missing.",
  "expectedValue": "size: 'Large', type: 'aberration', armor_class: 17, hit_points: 135, challenge_rating: 10, plus all stats, traits, and actions",
  "actualValue": "size: 'Medium', type: 'beast', armor_class: 10, hit_points: 50, challenge_rating: 1",
  "suggestedFix": "The extraction pattern is matching the wrong section. Need to ensure we're capturing the full stat block, not a summary or table entry. Verify the pattern matches the complete monster entry format."
}
```

---

### Example 3: False Positive ❌

**Source:** Player's Handbook, page 150

**Extracted Data:**
```json
{
  "name": "Longsword Proficiency",
  "kind": "weapon",
  "category": "martial_melee",
  "cost_gp": 0,
  "description": "You gain proficiency with longswords.",
  "source": "Player's Handbook",
  "extraction_confidence_score": 15
}
```

**Issues:**
- ❌ This is not an item - it's a proficiency description
- ❌ Extracted from a class feature or feat, not equipment section
- ❌ Should not have been extracted as an item

**Feedback:**
```json
{
  "issue": "false_positive",
  "description": "This is not an item - it's a proficiency description from a class feature. Should not be in items list.",
  "suggestedFix": "Add context checking to ensure items are only extracted from equipment/items sections. Exclude text that contains 'proficiency', 'you gain', 'class feature' keywords when extracting items."
}
```

---

### Example 4: Formatting Issues ❌

**Source:** Player's Handbook, page 211

**Extracted Data:**
```json
{
  "name": "Fireball",
  "level": 3,
  "school": "evocation",
  "casting_time": "1 action",
  "range": "150 feet",
  "components": "V, S, M (a tiny ball of bat guano and sulfur)",
  "duration": "Instantaneous",
  "description": "A bright streak flashes from your pointing finger to a point you choose within range and then blossoms with a low roar into an explosion of flame. Each creature in a 20-foot-radius sphere centered on that point must make a Dexterity saving throw. A target takes 8d6 fire damage on a failed save, or half as much damage on a successful one. The fire spreads around corners. It ignites flammable objects in the area that aren't being worn or carried.",
  "source": "Player's Handbook",
  "extraction_confidence_score": 70
}
```

**Issues:**
- ❌ Material components included in `components` field instead of separate `material_components` field
- ❌ Missing `higher_level` field
- ❌ Description has extra line breaks that should be normalized

**Feedback:**
```json
{
  "issue": "formatting",
  "description": "Material components are embedded in components field. Description has inconsistent formatting. Missing higher_level field.",
  "expectedValue": "components: 'V, S, M', material_components: 'a tiny ball of bat guano and sulfur', higher_level: 'When you cast...'",
  "actualValue": "components: 'V, S, M (a tiny ball of bat guano and sulfur)'",
  "suggestedFix": "Parse components field to extract material components into separate field. Normalize description text (remove extra whitespace, line breaks). Add pattern to extract higher level text that appears after main description."
}
```

---

### Example 5: Incomplete Extraction ❌

**Source:** Monster Manual, page 8

**Extracted Data:**
```json
{
  "name": "Aboleth",
  "size": "Large",
  "type": "aberration",
  "armor_class": 17,
  "hit_points": 135,
  "challenge_rating": 10,
  "traits": [
    {
      "name": "Amphibious",
      "description": "The aboleth can breathe air and water."
    }
  ],
  "source": "Monster Manual",
  "extraction_confidence_score": 60
}
```

**Issues:**
- ❌ Missing many required fields (speed, stats, saving_throws, skills, senses, languages, xp)
- ❌ Missing most traits (only one of several captured)
- ❌ Missing all actions
- ❌ Missing legendary actions (if applicable)

**Feedback:**
```json
{
  "issue": "missing_data",
  "description": "Many required fields are missing: speed, stats, saving_throws, skills, senses, languages, xp. Only one trait captured, missing others. All actions missing.",
  "expectedValue": "Complete stat block with all fields, all traits, all actions",
  "suggestedFix": "The extraction pattern is stopping too early. Need to capture the full monster entry until the next monster or section break. Improve trait and action extraction patterns to capture all instances, not just the first one."
}
```

---

## Feedback Strategy

### 1. Issue Categorization

Categorize feedback into:
- **missing_data**: Required fields are absent
- **incorrect_data**: Fields have wrong values
- **false_positive**: Item shouldn't have been extracted
- **formatting**: Data structure/format issues
- **other**: Miscellaneous issues

### 2. Feedback Format

Each feedback should include:
- **issue**: Category of the problem
- **description**: Clear explanation of what's wrong
- **expectedValue**: What the correct value should be
- **actualValue**: What was actually extracted (if applicable)
- **suggestedFix**: Specific suggestion for improving extraction

### 3. Using Feedback to Improve Extraction

1. **Collect feedback** in structured format (JSON)
2. **Analyze patterns** - group similar issues
3. **Update extraction patterns**:
   - Refine regex patterns
   - Add validation rules
   - Improve context detection
   - Add missing field extraction
4. **Re-run extraction** on same sources
5. **Verify improvements** by comparing before/after
6. **Iterate** until quality threshold met

### 4. Automated Feedback Processing

Create a script that:
- Parses feedback JSON files
- Groups by issue type and data type
- Suggests pattern improvements
- Tests new patterns on known good/bad examples
- Generates updated extraction code

### 5. Quality Metrics

Track:
- **Completeness**: % of required fields populated
- **Accuracy**: % of fields with correct values
- **False Positive Rate**: % of extractions that shouldn't exist
- **False Negative Rate**: % of items that should exist but weren't extracted
- **Confidence Score Accuracy**: How well confidence scores predict actual quality

---

## Example Feedback Collection Script

See `scripts/collect-qc-feedback.ts` for automated feedback collection and analysis.

