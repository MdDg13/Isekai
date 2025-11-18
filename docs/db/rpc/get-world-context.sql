-- RPC Function: Get World Context (Existing Elements + Source Snippets)
--
-- Combines existing world elements with relevant source snippets to build
-- comprehensive context for generation. Used when generating new elements
-- for an existing world.
--
-- Parameters:
--   p_world_id UUID (required) - World to get context for
--   p_element_type world_element_type (optional) - Filter by element type
--   p_include_snippets BOOLEAN (default true) - Include source snippets
--   p_snippet_count INTEGER (default 10) - Number of snippets to include
--
-- Returns: JSON object with:
--   - elements: Existing world elements
--   - snippets: Relevant source snippets
--   - summary: Context summary (culture, biome, tone, etc.)

CREATE OR REPLACE FUNCTION get_world_context(
  p_world_id UUID,
  p_element_type world_element_type DEFAULT NULL,
  p_include_snippets BOOLEAN DEFAULT true,
  p_snippet_count INTEGER DEFAULT 10
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_elements JSON;
  v_snippets JSON;
  v_summary JSON;
  v_cultures TEXT[];
  v_biomes TEXT[];
  v_tones TEXT[];
  v_tags TEXT[];
BEGIN
  -- Get existing world elements
  SELECT json_agg(
    json_build_object(
      'id', id,
      'type', type,
      'name', name,
      'summary', summary,
      'detail', detail,
      'tone', tone,
      'culture_tags', culture_tags,
      'keywords', keywords
    )
  ) INTO v_elements
  FROM world_element
  WHERE world_id = p_world_id
    AND (p_element_type IS NULL OR type = p_element_type);

  -- Extract context from existing elements
  SELECT 
    array_agg(DISTINCT detail->'world_integration'->>'culture'),
    array_agg(DISTINCT detail->'geography'->>'biome'),
    array_agg(DISTINCT tone),
    array_agg(DISTINCT unnest(culture_tags || keywords))
  INTO v_cultures, v_biomes, v_tones, v_tags
  FROM world_element
  WHERE world_id = p_world_id
    AND detail IS NOT NULL;

  -- Get relevant source snippets if requested
  IF p_include_snippets THEN
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
        'mechanics', mechanics
      )
    ) INTO v_snippets
    FROM source_snippet
    WHERE quality_score >= 80
      AND (
        (array_length(v_cultures, 1) IS NOT NULL AND culture = ANY(v_cultures))
        OR (array_length(v_biomes, 1) IS NOT NULL AND biome = ANY(v_biomes))
        OR (array_length(v_tones, 1) IS NOT NULL AND tone = ANY(v_tones))
        OR (array_length(v_tags, 1) IS NOT NULL AND tags && v_tags)
      )
    ORDER BY RANDOM()
    LIMIT p_snippet_count;
  END IF;

  -- Build summary
  SELECT json_build_object(
    'cultures', COALESCE(v_cultures, ARRAY[]::TEXT[]),
    'biomes', COALESCE(v_biomes, ARRAY[]::TEXT[]),
    'tones', COALESCE(v_tones, ARRAY[]::TEXT[]),
    'tags', COALESCE(v_tags, ARRAY[]::TEXT[]),
    'element_count', (SELECT COUNT(*) FROM world_element WHERE world_id = p_world_id)
  ) INTO v_summary;

  -- Return combined context
  RETURN json_build_object(
    'elements', COALESCE(v_elements, '[]'::JSON),
    'snippets', COALESCE(v_snippets, '[]'::JSON),
    'summary', v_summary
  );
END;
$$;

COMMENT ON FUNCTION get_world_context IS 
  'Combines existing world elements with relevant source snippets to build 
   comprehensive context for generating new elements in an existing world.';

