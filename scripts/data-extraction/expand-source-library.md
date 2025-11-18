# Expanding the Source Library

## Quick Start

### Option 1: Interactive Tool (Easiest)
Add snippets one at a time interactively:

```bash
npx tsx scripts/data-extraction/add-source-snippet.ts
```

Follow the prompts to add a new snippet. The tool will:
- Guide you through all fields
- Show a preview before inserting
- Ask if you want to add another

### Option 2: JSON File (Batch Import)
Create a new JSON file following the template:

1. Copy `scripts/data-extraction/sources/TEMPLATE.json`
2. Rename it (e.g., `my-new-source.json`)
3. Fill in your source data
4. Import:
   ```bash
   npx tsx scripts/data-extraction/import-source-snippets.ts scripts/data-extraction/sources/my-new-source.json
   ```

### Option 3: Direct Database (Advanced)
Use Supabase dashboard or API to insert directly into `source_snippet` table.

## Field Guidelines

### Required Fields
- **excerpt**: Full description (50-200 words recommended)
- **source_name**: Name of the source collection
- **license**: One of the license enum values

### Recommended Fields
- **tags**: 5+ relevant tags (lowercase, hyphenated)
- **archetype**: Clear classification
- **conflict_hook**: Specific, actionable conflict
- **rp_cues**: 2-3 behavioral patterns
- **culture/biome/tone**: World-building context
- **quality_score**: 80+ for high quality

### Optional Fields
- **source_link**: URL or reference
- **mechanics**: JSONB for structured data
- **rp_cues**: Array of roleplay cues

## Quality Checklist

Before adding, ensure:
- [ ] Excerpt is vivid and engaging (not generic)
- [ ] At least 5 relevant tags
- [ ] Clear archetype classification
- [ ] Specific conflict hook (not vague)
- [ ] 2-3 roleplay cues for DM use
- [ ] Culture/biome/tone specified
- [ ] Quality score 80+ (or plan to improve later)
- [ ] Immediately usable at table

## Category Priorities

Based on current library (56 snippets):

### Well Covered
- NPC archetypes (16)
- Location types (10)
- Conflict hooks (10)

### Could Use More
- Cultural patterns (5) - add more social structures
- Biome-specific (5) - add more environments
- Faction types (5) - add more organizations
- Item hooks (5) - add more artifacts
- Puzzle types (5) - add more challenges
- Tone variations (5) - add more atmospheres

### Expansion Ideas
- More biome combinations (coastal, swamp, arctic, etc.)
- More cultural structures (caste systems, guild hierarchies, etc.)
- More conflict types (moral dilemmas, time pressure, etc.)
- More item types (cursed, sentient, transformative, etc.)
- More puzzle types (logical, social, physical, etc.)

## Batch Import Process

1. **Create source file** using template
2. **Review quality** against guidelines
3. **Test import** with `--dry-run`:
   ```bash
   npx tsx scripts/data-extraction/import-source-snippets.ts path/to/file.json --dry-run
   ```
4. **Import for real**:
   ```bash
   npx tsx scripts/data-extraction/import-source-snippets.ts path/to/file.json
   ```
5. **Verify** with:
   ```bash
   npx tsx scripts/database/verify-source-snippets.ts
   ```

## Review Schedule

See `docs/checkpoints/phase-3-data-review-scheduled.md` for:
- When to review (after Phase 3)
- What to review (volume, quality, diversity)
- How to prioritize expansion

## Notes

- Quality over quantity: Better to have fewer high-quality snippets
- Diversity matters: Avoid duplicating similar concepts
- Use Therios samples as quality guide, not strict template
- All snippets should be immediately usable at table

