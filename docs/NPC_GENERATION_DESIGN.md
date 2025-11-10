# NPC Generation System - Design Document

## Current State Analysis

### Problems Identified
1. **Generic Content**: NPCs have repetitive names ("Human Thorn", "Human Swift"), identical bios ("A neutral human with a mysterious past"), and minimal variation
2. **Limited Randomization**: Only 6 name suffixes, 4 birthplaces, basic stat rolling (8-12 range)
3. **Weak AI Prompt**: Current prompt is too simple and doesn't provide enough context for quality generation
4. **Poor Fallback**: When AI fails, fallback generator is extremely basic
5. **No Thematic Coherence**: Generated NPCs don't feel like they belong to a cohesive world

### Current Implementation
- **AI Path**: Uses Workers AI with basic prompt, 700 token limit, 0.6 temperature
- **Fallback Path**: Simple random selection from small arrays
- **Input**: Basic prompt, level, race, temperament, equipment dropdowns
- **Output**: Name, bio, backstory, traits, stats, equipment

## Design Goals

1. **Diversity**: Generate thousands of unique NPCs without repetition
2. **Originality**: Each NPC should feel distinct and memorable
3. **Logical Coherence**: NPCs should make sense within D&D 5e rules and fantasy tropes
4. **Scalability**: System should work with or without AI
5. **Flexibility**: Support both prompt-driven and fully random generation

## Recommended Solution: Hybrid Procedural + AI System

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    NPC Generation                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐         ┌──────────────┐            │
│  │  Prompted    │         │   Random     │            │
│  │  Generation  │         │  Generation  │            │
│  └──────┬───────┘         └──────┬───────┘            │
│         │                         │                     │
│         └──────────┬──────────────┘                     │
│                    │                                     │
│         ┌──────────▼──────────┐                         │
│         │  Procedural Engine  │                         │
│         │  (Tables + Logic)   │                         │
│         └──────────┬──────────┘                         │
│                    │                                     │
│         ┌──────────▼──────────┐                         │
│         │   AI Enhancement    │                         │
│         │   (Optional Layer)  │                         │
│         └──────────┬──────────┘                         │
│                    │                                     │
│         ┌──────────▼──────────┐                         │
│         │   Final NPC Object  │                         │
│         └─────────────────────┘                         │
└─────────────────────────────────────────────────────────┘
```

### Core Components

#### 1. Procedural Generation Engine (Primary System)

**Purpose**: Generate diverse, logical NPCs using weighted tables and procedural logic

**Key Features**:
- **Expansive Name Generation**: Race-specific name tables with first/last name combinations
- **Personality System**: D&D 5e personality traits, ideals, bonds, flaws
- **Background System**: D&D backgrounds (Acolyte, Criminal, Folk Hero, etc.) with associated traits
- **Stat Generation**: Level-appropriate stat arrays based on NPC role/class
- **Equipment Logic**: Equipment that matches class, level, and background
- **Backstory Templates**: Procedural backstory generation with multiple variables

**Implementation Strategy**:
- Create comprehensive data tables (JSON files or TypeScript constants)
- Use weighted random selection for variety
- Apply logical constraints (e.g., wizard NPCs have high INT, fighters have high STR)
- Generate coherent combinations (e.g., Acolyte background → religious equipment)

#### 2. AI Enhancement Layer (Optional Enhancement)

**Purpose**: When AI is available, enhance procedural base with creative details

**Strategy**:
- Generate base NPC procedurally first (ensures quality fallback)
- Pass base NPC to AI with rich context prompt
- AI enhances: name variations, bio refinement, backstory details, personality quirks
- Merge AI enhancements with procedural base
- If AI fails, use procedural base (no degradation)

**AI Prompt Improvements**:
- Provide full context: world setting, existing NPCs, campaign themes
- Use structured examples in prompt
- Request specific enhancements, not full generation
- Higher temperature (0.8-0.9) for creativity when enhancing

#### 3. Data Tables Structure

**Name Tables** (Race-specific):
- Human: 50+ first names, 50+ last names (medieval fantasy)
- Elf: 40+ first names, 30+ last names (elven naming conventions)
- Dwarf: 40+ first names, 30+ clan names
- Each race: Cultural naming patterns

**Personality Tables**:
- **Traits**: 50+ personality traits (D&D 5e inspired)
- **Ideals**: 30+ ideals (Good, Evil, Law, Chaos, Neutral variants)
- **Bonds**: 40+ bond types (family, organization, location, object, person)
- **Flaws**: 40+ flaw types (greed, pride, fear, secret, etc.)

**Background Tables**:
- All 13 D&D 5e backgrounds + custom fantasy backgrounds
- Each background: Associated skills, equipment, personality tendencies

**Class/Role Tables**:
- Commoner, Guard, Noble, Merchant, Scholar, Warrior, Spellcaster, etc.
- Each role: Stat priorities, equipment, typical behaviors

**Backstory Elements**:
- Birthplaces: 30+ location types
- Life Events: 50+ event types (tragedy, triumph, discovery, loss, etc.)
- Motivations: 30+ motivation types
- Secrets: 20+ secret types

**Equipment Tables**:
- By class/role: Appropriate weapons, armor, tools
- By level: Quality/rarity scaling
- By background: Starting equipment variations

#### 4. Generation Logic Flow

**For Prompted Generation**:
1. Parse user prompt for keywords (race, class, personality hints)
2. Select base attributes from tables matching prompt
3. Generate complementary elements (e.g., if "wizard" → high INT, spellbook, scholar background)
4. Create backstory connecting all elements
5. (Optional) Pass to AI for enhancement
6. Return complete NPC

**For Random Generation**:
1. Roll for race (weighted by commonality: Human 40%, Elf 15%, Dwarf 12%, etc.)
2. Roll for class/role (weighted: Commoner 30%, Guard 15%, Merchant 10%, etc.)
3. Generate name from race-specific tables
4. Select personality traits (2 traits, 1 ideal, 1 bond, 1 flaw)
5. Select background (some backgrounds more common for certain classes)
6. Generate stats based on class and level
7. Generate equipment based on class, level, background
8. Generate backstory using templates with selected elements
9. (Optional) Pass to AI for enhancement
10. Return complete NPC

#### 5. Quality Assurance

**Uniqueness Checks**:
- Track recently generated NPCs (last 100)
- Avoid exact name duplicates
- Vary personality combinations
- Ensure stat diversity

**Logical Validation**:
- Stats match class (wizard has INT ≥ 13, fighter has STR ≥ 13)
- Equipment matches class and level
- Background aligns with personality
- Backstory elements are coherent

**Coherence Rules**:
- High-level NPCs have better equipment
- Spellcasters have spellcasting focus
- Nobles have noble background
- Criminals have criminal background

## Implementation Plan

### Phase 1: Data Tables (Foundation)
1. Create `src/lib/npc-generator/tables.ts` with all data tables
2. Organize by category: names, personalities, backgrounds, classes, equipment
3. Use TypeScript types for type safety
4. Make tables easily extensible

### Phase 2: Procedural Engine (Core)
1. Create `src/lib/npc-generator/procedural.ts` with generation logic
2. Implement weighted random selection
3. Implement logical constraint system
4. Implement backstory template system
5. Test with 100+ random generations to verify diversity

### Phase 3: AI Integration (Enhancement)
1. Update `functions/api/generate-world-npc.ts` to use procedural base
2. Enhance AI prompt with context and examples
3. Implement AI enhancement layer
4. Add fallback to procedural if AI fails

### Phase 4: UI Improvements (Optional)
1. Add more generation options (background, class, alignment)
2. Add preview before generation
3. Add "regenerate" option
4. Show generation method (procedural vs AI-enhanced)

## Technical Specifications

### Data Structure

```typescript
interface NPCTables {
  names: {
    [race: string]: {
      first: string[];
      last: string[];
      weights?: number[]; // Optional weighting
    };
  };
  personalities: {
    traits: Array<{ text: string; category: string }>;
    ideals: Array<{ text: string; alignment: string }>;
    bonds: Array<{ text: string; type: string }>;
    flaws: Array<{ text: string; severity: string }>;
  };
  backgrounds: Array<{
    name: string;
    skills: string[];
    equipment: string[];
    personalityTendencies: string[];
  }>;
  classes: Array<{
    name: string;
    statPriorities: string[]; // e.g., ['str', 'con'] for fighter
    equipment: string[];
    typicalLevels: number[];
  }>;
  backstoryTemplates: Array<{
    template: string;
    variables: string[];
    conditions?: Record<string, any>;
  }>;
}
```

### Generation Function Signature

```typescript
interface GenerateNPCOptions {
  worldId: string;
  // Prompted generation
  nameHint?: string;
  race?: string;
  class?: string;
  level?: number;
  background?: string;
  // Random generation
  fullyRandom?: boolean;
  // AI enhancement
  useAI?: boolean;
}

function generateNPC(options: GenerateNPCOptions): Promise<NPC> {
  // 1. Procedural generation
  // 2. Optional AI enhancement
  // 3. Return complete NPC
}
```

## Expected Outcomes

### Before (Current)
- 6 name variations
- 4 birthplace options
- Generic bios
- Repetitive content

### After (Proposed)
- 1000+ unique name combinations per race
- 50+ personality trait combinations
- 13+ background variations
- Coherent stat/equipment/background alignment
- Rich, varied backstories
- AI-enhanced creativity when available

## Risk Mitigation

1. **AI Unavailability**: Procedural system works standalone
2. **Performance**: Pre-compute tables, cache common combinations
3. **Quality**: Extensive testing with 1000+ generations
4. **Maintenance**: Modular design, easy to add new tables

## Next Steps

1. Review and approve this design
2. Create data tables (Phase 1)
3. Implement procedural engine (Phase 2)
4. Integrate with existing API (Phase 3)
5. Test and iterate

