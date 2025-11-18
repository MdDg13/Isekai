-- Phase 1: Schema Enhancement Migration
-- Enhances world_element.detail JSONB structure and adds performance indexes
-- Idempotent: Can be run multiple times safely
-- 
-- Run after: 2025-11-content-graph.sql
-- Assumes: world_element table exists from content-graph migration

BEGIN;

-- ============================================
-- INDEXES FOR COMMONLY QUERIED NESTED FIELDS
-- ============================================

-- NPC identity indexes (for filtering NPCs by race, class, level)
CREATE INDEX IF NOT EXISTS idx_npc_race 
  ON world_element USING GIN ((detail->'identity'->>'race'))
  WHERE type = 'npc';

CREATE INDEX IF NOT EXISTS idx_npc_class 
  ON world_element USING GIN ((detail->'identity'->>'class'))
  WHERE type = 'npc';

CREATE INDEX IF NOT EXISTS idx_npc_level 
  ON world_element ((detail->'identity'->>'level'))
  WHERE type = 'npc';

CREATE INDEX IF NOT EXISTS idx_npc_alignment 
  ON world_element USING GIN ((detail->'identity'->>'alignment'))
  WHERE type = 'npc';

-- NPC conflict index (for finding NPCs with active conflicts)
CREATE INDEX IF NOT EXISTS idx_npc_conflict 
  ON world_element USING GIN ((detail->'conflict'->>'active_conflict'))
  WHERE type = 'npc';

-- NPC location link index (for finding NPCs at a location)
CREATE INDEX IF NOT EXISTS idx_npc_primary_location 
  ON world_element USING GIN ((detail->'world_integration'->>'primary_location_id'))
  WHERE type = 'npc';

-- Location type and biome indexes
CREATE INDEX IF NOT EXISTS idx_location_type 
  ON world_element USING GIN ((detail->'identity'->>'type'))
  WHERE type = 'location';

CREATE INDEX IF NOT EXISTS idx_location_biome 
  ON world_element USING GIN ((detail->'geography'->>'biome'))
  WHERE type = 'location';

CREATE INDEX IF NOT EXISTS idx_location_region 
  ON world_element USING GIN ((detail->'geography'->>'region'))
  WHERE type = 'location';

-- Faction indexes
CREATE INDEX IF NOT EXISTS idx_faction_type 
  ON world_element USING GIN ((detail->'identity'->>'type'))
  WHERE type = 'faction';

-- General indexes for element_link queries
CREATE INDEX IF NOT EXISTS idx_element_link_from 
  ON element_link(from_element);

CREATE INDEX IF NOT EXISTS idx_element_link_to 
  ON element_link(to_element);

CREATE INDEX IF NOT EXISTS idx_element_link_type 
  ON element_link(link_type);

CREATE INDEX IF NOT EXISTS idx_element_link_world 
  ON element_link(world_id);

-- Index for world_element queries by world and type
CREATE INDEX IF NOT EXISTS idx_world_element_world_type 
  ON world_element(world_id, type);

-- Index for quality scoring queries
CREATE INDEX IF NOT EXISTS idx_element_quality_checks 
  ON element_quality(has_location_link, has_faction_link, has_conflict);

-- ============================================
-- HELPER FUNCTIONS FOR JSONB VALIDATION
-- ============================================

-- Function to check if NPC has required fields
CREATE OR REPLACE FUNCTION validate_npc_detail(detail JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    detail ? 'identity' AND
    detail->'identity' ? 'race' AND
    detail->'identity' ? 'class' AND
    detail->'identity' ? 'level' AND
    detail ? 'narrative' AND
    detail->'narrative' ? 'bio' AND
    detail ? 'conflict' AND
    detail->'conflict' ? 'active_conflict'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if location has required fields
CREATE OR REPLACE FUNCTION validate_location_detail(detail JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    detail ? 'identity' AND
    detail->'identity' ? 'type' AND
    detail ? 'geography' AND
    detail->'geography' ? 'biome' AND
    detail ? 'appearance' AND
    detail->'appearance' ? 'first_impression'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if faction has required fields
CREATE OR REPLACE FUNCTION validate_faction_detail(detail JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    detail ? 'identity' AND
    detail->'identity' ? 'type' AND
    detail->'identity' ? 'goals' AND
    detail ? 'conflicts'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View for NPCs with their primary location
CREATE OR REPLACE VIEW npc_with_location AS
SELECT 
  we.id,
  we.world_id,
  we.name,
  we.summary,
  we.detail->'identity'->>'race' AS race,
  we.detail->'identity'->>'class' AS class,
  (we.detail->'identity'->>'level')::INTEGER AS level,
  we.detail->'world_integration'->>'primary_location_id' AS primary_location_id,
  loc.name AS location_name,
  we.detail->'conflict'->>'active_conflict' AS active_conflict,
  we.quality_score,
  we.created_at
FROM world_element we
LEFT JOIN world_element loc 
  ON loc.id = (we.detail->'world_integration'->>'primary_location_id')::UUID
  AND loc.type = 'location'
WHERE we.type = 'npc';

-- View for locations with NPC counts
CREATE OR REPLACE VIEW location_with_npc_count AS
SELECT 
  we.id,
  we.world_id,
  we.name,
  we.summary,
  we.detail->'identity'->>'type' AS location_type,
  we.detail->'geography'->>'biome' AS biome,
  we.detail->'geography'->>'region' AS region,
  COUNT(npc.id) AS npc_count,
  we.quality_score,
  we.created_at
FROM world_element we
LEFT JOIN world_element npc 
  ON npc.type = 'npc'
  AND npc.detail->'world_integration'->>'primary_location_id' = we.id::TEXT
WHERE we.type = 'location'
GROUP BY we.id, we.world_id, we.name, we.summary, we.detail, we.quality_score, we.created_at;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN world_element.detail IS 
  'JSONB structure varies by type. See docs/INTEGRATED_WORLD_DESIGN.md for schemas:
   - NPC: identity, appearance, stats, equipment, narrative, conflict, dm_tools, world_integration
   - Location: identity, geography, appearance, function, history, npc_integration, dm_tools
   - Faction: identity, resources, conflicts, npcs, locations, campaign_hooks
   - Map: identity, spatial, layers, markers, routes';

COMMENT ON INDEX idx_npc_race IS 
  'GIN index for filtering NPCs by race. Query: WHERE type = ''npc'' AND detail->''identity''->>''race'' = ''human''';

COMMENT ON INDEX idx_npc_class IS 
  'GIN index for filtering NPCs by class. Query: WHERE type = ''npc'' AND detail->''identity''->>''class'' = ''wizard''';

COMMENT ON INDEX idx_npc_level IS 
  'B-tree index for filtering NPCs by level. Query: WHERE type = ''npc'' AND (detail->''identity''->>''level'')::INTEGER >= 5';

COMMENT ON INDEX idx_npc_conflict IS 
  'GIN index for finding NPCs with active conflicts. Query: WHERE type = ''npc'' AND detail->''conflict''->>''active_conflict'' IS NOT NULL';

COMMENT ON INDEX idx_npc_primary_location IS 
  'GIN index for finding NPCs at a specific location. Query: WHERE type = ''npc'' AND detail->''world_integration''->>''primary_location_id'' = ''<uuid>''';

COMMENT ON VIEW npc_with_location IS 
  'Convenience view joining NPCs with their primary location for common queries';

COMMENT ON VIEW location_with_npc_count IS 
  'Convenience view showing locations with count of NPCs located there';

COMMIT;

-- ============================================
-- VERIFICATION QUERIES (Run after migration)
-- ============================================

-- Verify indexes were created
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'world_element' 
-- ORDER BY indexname;

-- Test NPC query performance
-- EXPLAIN ANALYZE
-- SELECT * FROM world_element 
-- WHERE type = 'npc' 
-- AND detail->'identity'->>'race' = 'human';

-- Test location query performance
-- EXPLAIN ANALYZE
-- SELECT * FROM world_element 
-- WHERE type = 'location' 
-- AND detail->'geography'->>'biome' = 'forest';

