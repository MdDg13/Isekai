-- Content Graph Schema Refresh (November 2025)
-- Run after archiving existing data. Assumes `world` table already exists.

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TYPE world_element_type AS ENUM (
  'npc',
  'location',
  'faction',
  'item',
  'event',
  'puzzle',
  'hook',
  'campaign_arc',
  'ritual'
);

CREATE TYPE element_link_type AS ENUM (
  'belongs_to',
  'controls',
  'rival_of',
  'allied_with',
  'spawned_by',
  'guards',
  'causes',
  'references',
  'located_at',
  'in_conflict_over'
);

CREATE TYPE source_license AS ENUM (
  'public_domain',
  'cc0',
  'cc_by',
  'cc_by_sa',
  'open_game_license',
  'orc',
  'commercial_with_credit',
  'synthetic'
);

CREATE TABLE IF NOT EXISTS source_snippet (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_name TEXT NOT NULL,
  source_link TEXT,
  license source_license NOT NULL,
  excerpt TEXT NOT NULL,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  archetype TEXT,
  conflict_hook TEXT,
  rp_cues TEXT[] DEFAULT ARRAY[]::TEXT[],
  culture TEXT,
  biome TEXT,
  tone TEXT,
  mechanics JSONB DEFAULT '{}'::JSONB,
  quality_score NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mechanic_template (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- e.g. trap, encounter, item_power
  description TEXT NOT NULL,
  payload JSONB NOT NULL,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS world_element (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  world_id UUID NOT NULL REFERENCES world(id) ON DELETE CASCADE,
  type world_element_type NOT NULL,
  name TEXT NOT NULL,
  summary TEXT,
  detail JSONB DEFAULT '{}'::JSONB,
  tier TEXT,
  tone TEXT,
  culture_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  snippet_refs UUID[] DEFAULT ARRAY[]::UUID[],
  mechanic_template_id UUID REFERENCES mechanic_template(id),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  quality_score NUMERIC(5,2) DEFAULT 0,
  UNIQUE(world_id, type, name)
);

CREATE TABLE IF NOT EXISTS element_link (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  world_id UUID NOT NULL REFERENCES world(id) ON DELETE CASCADE,
  from_element UUID NOT NULL REFERENCES world_element(id) ON DELETE CASCADE,
  to_element UUID NOT NULL REFERENCES world_element(id) ON DELETE CASCADE,
  link_type element_link_type NOT NULL,
  weight NUMERIC(5,2),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(from_element, to_element, link_type)
);

CREATE TABLE IF NOT EXISTS element_quality (
  element_id UUID PRIMARY KEY REFERENCES world_element(id) ON DELETE CASCADE,
  has_location_link BOOLEAN DEFAULT FALSE,
  has_faction_link BOOLEAN DEFAULT FALSE,
  has_conflict BOOLEAN DEFAULT FALSE,
  uniqueness_score NUMERIC(5,2) DEFAULT 0,
  critique_notes TEXT,
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS similarity_vectors (
  element_id UUID PRIMARY KEY REFERENCES world_element(id) ON DELETE CASCADE,
  embedding VECTOR(1536),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS puzzle_blueprint (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sensory_cues TEXT[] DEFAULT ARRAY[]::TEXT[],
  solution TEXT NOT NULL,
  failure_states TEXT[] DEFAULT ARRAY[]::TEXT[],
  hint_structure JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_arc (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  scope TEXT NOT NULL, -- e.g. street, regional, planar
  beats JSONB NOT NULL, -- ordered list of scenes/conflicts
  failure_twists JSONB DEFAULT '{"twists": []}'::JSONB,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMIT;

