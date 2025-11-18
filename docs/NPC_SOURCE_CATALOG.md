# NPC Source Catalog

This document catalogs all sources used to build the NPC (and broader world content) generation library. Each source includes license information, extraction method, and tagging vocabulary.

## License Categories
- **Public Domain** - No restrictions, can be freely used and modified
- **CC-BY** - Creative Commons Attribution, requires attribution
- **CC-BY-SA** - Share Alike, requires attribution and same license
- **SRD** - System Reference Document, open game content
- **Commercial-with-Credit** - Requires attribution in generated content
- **Synthetic** - AI-generated with QC validation

## Source Libraries

### 1. System Reference Documents (SRD)

#### D&D 5e SRD
- **License**: OGL 1.0a / CC-BY 4.0 (WotC)
- **Source**: https://dnd.wizards.com/resources/systems-reference-document
- **Content**: Classes, races, backgrounds, spells, monsters, items
- **Extraction**: Manual parsing + structured data exports
- **Tags**: `srd`, `dnd5e`, `class`, `race`, `background`, `spell`, `monster`, `item`
- **Status**: ✅ Ingested

#### Level Up: Advanced 5e (A5E) SRD
- **License**: CC-BY 4.0
- **Source**: https://www.levelup5e.com/srd
- **Content**: Expanded classes, cultures, heritages, maneuvers
- **Extraction**: Manual parsing
- **Tags**: `srd`, `a5e`, `culture`, `heritage`, `maneuver`
- **Status**: 🔄 Planned

#### Pathfinder 2e ORC
- **License**: ORC (Open RPG Creative)
- **Source**: https://paizo.com/orc
- **Content**: Classes, ancestries, backgrounds, feats
- **Extraction**: Manual parsing
- **Tags**: `srd`, `pf2e`, `ancestry`, `class`, `feat`
- **Status**: 🔄 Planned

### 2. Open RPG Supplements

#### Kobold Press (Court of Seasons, etc.)
- **License**: CC-BY (specific products)
- **Source**: Kobold Press blog, free previews
- **Content**: NPCs, locations, cultural details
- **Extraction**: Manual curation
- **Tags**: `kobold-press`, `npc`, `location`, `culture`
- **Status**: 🔄 Planned

#### Mage Hand Press
- **License**: CC-BY (blog content)
- **Source**: https://magehandpress.com
- **Content**: NPCs, items, world-building tools
- **Extraction**: Manual curation
- **Tags**: `mage-hand-press`, `npc`, `item`
- **Status**: 🔄 Planned

#### Gnome Stew NPC Tables
- **License**: Pay-what-you-want (reuse allowed)
- **Source**: DriveThruRPG
- **Content**: NPC generation tables
- **Extraction**: Manual entry
- **Tags**: `gnome-stew`, `npc-table`, `generator`
- **Status**: 🔄 Planned

### 3. Folklore & Mythology

#### Project Gutenberg Epics
- **License**: Public Domain
- **Sources**: 
  - Mahabharata, Ramayana
  - Kalevala
  - Arabian Nights
  - Beowulf
  - Norse Eddas
- **Content**: Character archetypes, conflicts, cultural patterns
- **Extraction**: Text parsing + manual curation
- **Tags**: `folklore`, `mythology`, `public-domain`, `[culture]`, `archetype`
- **Status**: 🔄 Planned

#### Irish Mythological Cycle
- **License**: Public Domain
- **Source**: Various translations
- **Content**: Heroes, gods, conflicts, locations
- **Extraction**: Manual curation
- **Tags**: `folklore`, `irish`, `mythology`, `public-domain`
- **Status**: 🔄 Planned

#### African Oral Histories (UNESCO)
- **License**: Public Domain / CC-BY (varies)
- **Source**: UNESCO archives, public domain collections
- **Content**: Cultural practices, character types, social structures
- **Extraction**: Manual curation
- **Tags**: `folklore`, `african`, `oral-history`, `culture`
- **Status**: 🔄 Planned

#### Latin American Folklore
- **License**: Public Domain
- **Source**: Popol Vuh, regional collections
- **Content**: Creation myths, heroes, conflicts
- **Extraction**: Manual curation
- **Tags**: `folklore`, `latin-american`, `mythology`, `public-domain`
- **Status**: 🔄 Planned

### 4. Literature & Theater

#### Shakespeare Corpus
- **License**: Public Domain
- **Source**: Project Gutenberg, Folger Digital Texts
- **Content**: Character archetypes, dialogue patterns, conflicts
- **Extraction**: Text analysis + manual curation
- **Tags**: `literature`, `shakespeare`, `public-domain`, `dialogue`, `archetype`
- **Status**: 🔄 Planned

#### Russian Classics
- **License**: Public Domain
- **Source**: Pushkin, Gogol, Dostoevsky (translations)
- **Content**: Character psychology, social dynamics
- **Extraction**: Manual curation
- **Tags**: `literature`, `russian`, `public-domain`, `psychology`
- **Status**: 🔄 Planned

#### Gothic Novels
- **License**: Public Domain
- **Source**: Le Fanu, Shelley, Stoker
- **Content**: Atmosphere, mystery, supernatural elements
- **Extraction**: Manual curation
- **Tags**: `literature`, `gothic`, `public-domain`, `mystery`, `supernatural`
- **Status**: 🔄 Planned

#### Wuxia Sagas
- **License**: Varies (some public domain translations)
- **Source**: Jin Yong summaries, open translations
- **Content**: Martial arts archetypes, honor codes, conflicts
- **Extraction**: Manual curation
- **Tags**: `literature`, `wuxia`, `martial-arts`, `honor`
- **Status**: 🔄 Planned

#### Cyberpunk Literature
- **License**: Varies (some CC-BY)
- **Source**: Neuromancer (commentary), open wikis
- **Content**: Tech-augmented characters, corporate conflicts
- **Extraction**: Manual curation
- **Tags**: `literature`, `cyberpunk`, `tech`, `corporate`
- **Status**: 🔄 Planned

### 5. Film/TV/Game Inspirations (Metadata Only)

#### TV Tropes (with Attribution)
- **License**: CC-BY-SA
- **Source**: https://tvtropes.org
- **Content**: Character tropes, plot structures
- **Extraction**: Manual curation (metadata only, no direct copying)
- **Tags**: `trope`, `narrative-structure`, `character-archetype`
- **Status**: 🔄 Planned

#### Open Game NPCs
- **License**: Varies (CC-BY, OGL)
- **Sources**: 
  - Sunless Sea lore (Failbetter open excerpts)
  - Disco Elysium dev blog character notes
  - Lancer RPG pilot dossiers
- **Content**: NPC personalities, motivations, quirks
- **Extraction**: Manual curation
- **Tags**: `game`, `npc`, `[game-name]`
- **Status**: 🔄 Planned

### 6. Historical & Socio-Economic Data

#### World Bank Cultural Datasets
- **License**: Open Data (CC-BY)
- **Source**: World Bank open data portal
- **Content**: Cultural practices, economic patterns
- **Extraction**: CSV parsing
- **Tags**: `data`, `culture`, `economics`, `world-bank`
- **Status**: 🔄 Planned

#### CIA World Factbook Summaries
- **License**: Public Domain (US Government)
- **Source**: https://www.cia.gov/the-world-factbook
- **Content**: Geopolitical tensions, resource conflicts
- **Extraction**: Manual curation
- **Tags**: `data`, `geopolitics`, `conflict`, `public-domain`
- **Status**: 🔄 Planned

#### UN Trade/Aid Reports
- **License**: Open Data
- **Source**: UN data portals
- **Content**: Trade routes, resource scarcity patterns
- **Extraction**: CSV parsing
- **Tags**: `data`, `trade`, `resources`, `un`
- **Status**: 🔄 Planned

### 7. Internal Sources

#### Campaign Logs & QC Feedback
- **License**: Internal (user-generated)
- **Source**: Supabase `qc_feedback` table, campaign notes
- **Content**: User-reported issues, successful patterns
- **Extraction**: Database queries
- **Tags**: `internal`, `user-feedback`, `campaign-log`
- **Status**: ✅ Available

#### Therios NPC Samples
- **License**: Internal (curated examples)
- **Source**: `docs/NPC_THERIOS_SAMPLES.md`
- **Content**: High-quality NPC templates
- **Extraction**: Manual entry
- **Tags**: `internal`, `template`, `quality-benchmark`
- **Status**: ✅ Available

## Tagging Vocabulary

### Culture Tags
- Geographic: `european`, `asian`, `african`, `latin-american`, `middle-eastern`, `oceanic`
- Temporal: `medieval`, `renaissance`, `victorian`, `modern`, `futuristic`
- Fantasy: `elven`, `dwarven`, `orcish`, `tiefling`, `dragonborn`

### Archetype Tags
- `hero`, `villain`, `mentor`, `trickster`, `guardian`, `scholar`, `merchant`, `noble`, `commoner`, `outcast`

### Conflict Tags
- `resource-scarcity`, `political-intrigue`, `religious-conflict`, `family-drama`, `honor-code`, `betrayal`, `redemption`

### Tone Tags
- `heroic`, `tragic`, `comedic`, `mysterious`, `dark`, `hopeful`, `melancholic`

### Mechanical Tags
- `combat-focused`, `social-encounter`, `puzzle-solver`, `information-broker`, `quest-giver`

## Extraction Scripts

- `scripts/data-extraction/import-source-snippets.ts` - Main ingestion script for structured JSON/CSV
- `scripts/data-extraction/parse-folklore.ts` - Folklore/mythology text parsing
- `scripts/data-extraction/parse-literature.ts` - Literature character extraction
- `scripts/data-extraction/import-srd-data.ts` - SRD structured data import

## Quality Standards

All ingested snippets must include:
- Source attribution
- License information
- Culture/archetype/conflict tags
- Quality score (0-100, based on completeness and uniqueness)
- Extraction timestamp

## Status Legend
- ✅ Ingested - Data loaded into `source_snippet` table
- 🔄 Planned - Cataloged, extraction script pending
- ⏸️ On Hold - License/permission pending
- ❌ Rejected - License incompatible or quality insufficient

