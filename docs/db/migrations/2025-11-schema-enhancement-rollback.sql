-- Phase 1: Schema Enhancement Rollback
-- Removes indexes and helper functions added in 2025-11-schema-enhancement.sql
-- Safe to run if migration hasn't been applied

BEGIN;

-- ============================================
-- DROP VIEWS
-- ============================================

DROP VIEW IF EXISTS location_with_npc_count;
DROP VIEW IF EXISTS npc_with_location;

-- ============================================
-- DROP INDEXES
-- ============================================

DROP INDEX IF EXISTS idx_element_quality_checks;
DROP INDEX IF EXISTS idx_world_element_world_type;
DROP INDEX IF EXISTS idx_element_link_world;
DROP INDEX IF EXISTS idx_element_link_type;
DROP INDEX IF EXISTS idx_element_link_to;
DROP INDEX IF EXISTS idx_element_link_from;
DROP INDEX IF EXISTS idx_faction_type;
DROP INDEX IF EXISTS idx_location_region;
DROP INDEX IF EXISTS idx_location_biome;
DROP INDEX IF EXISTS idx_location_type;
DROP INDEX IF EXISTS idx_npc_primary_location;
DROP INDEX IF EXISTS idx_npc_conflict;
DROP INDEX IF EXISTS idx_npc_alignment;
DROP INDEX IF EXISTS idx_npc_level;
DROP INDEX IF EXISTS idx_npc_class;
DROP INDEX IF EXISTS idx_npc_race;

-- ============================================
-- DROP FUNCTIONS
-- ============================================

DROP FUNCTION IF EXISTS validate_faction_detail(JSONB);
DROP FUNCTION IF EXISTS validate_location_detail(JSONB);
DROP FUNCTION IF EXISTS validate_npc_detail(JSONB);

COMMIT;

