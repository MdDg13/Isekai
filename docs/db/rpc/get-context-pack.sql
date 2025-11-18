-- RPC Function: Get Context Pack for World Generation
-- 
-- Returns a curated set of source snippets based on filters for building
-- world context (NPCs, locations, conflicts, etc.)
--
-- Parameters:
--   p_world_id UUID (optional) - If provided, includes existing world elements
--   p_tags TEXT[] (optional) - Filter by tags (e.g., ['npc', 'wizard'])
--   p_culture TEXT (optional) - Filter by culture
--   p_biome TEXT (optional) - Filter by biome
--   p_tone TEXT (optional) - Filter by tone
--   p_limit INTEGER (default 20) - Max snippets to return
--   p_min_quality NUMERIC (default 80) - Minimum quality score
--
-- Returns: JSON array of source snippets with metadata

CREATE OR REPLACE FUNCTION get_context_pack(
  p_world_id UUID DEFAULT NULL,
  p_tags TEXT[] DEFAULT NULL,
  p_culture TEXT DEFAULT NULL,
  p_biome TEXT DEFAULT NULL,
  p_tone TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_min_quality NUMERIC DEFAULT 80
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'id', id,
      'source_name', source_name,
      'excerpt', excerpt,
      'tags', tags,
      'archetype', archetype,
      'conflict_hook', conflict_hook,
      'rp_cues', rp_cues,
      'culture', culture,
      'biome', biome,
      'tone', tone,
      'mechanics', mechanics,
      'quality_score', quality_score
    )
    ORDER BY quality_score DESC, RANDOM()
  ) INTO v_result
  FROM source_snippet
  WHERE quality_score >= p_min_quality
    AND (p_tags IS NULL OR tags && p_tags)
    AND (p_culture IS NULL OR culture = p_culture)
    AND (p_biome IS NULL OR biome = p_biome)
    AND (p_tone IS NULL OR tone = p_tone)
  LIMIT p_limit;

  RETURN COALESCE(v_result, '[]'::JSON);
END;
$$;

COMMENT ON FUNCTION get_context_pack IS 
  'Returns curated source snippets for world generation based on filters. 
   Used by generation pipelines to build context from source library.';

