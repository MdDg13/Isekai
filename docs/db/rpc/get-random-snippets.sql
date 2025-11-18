-- RPC Function: Get Random Snippets with Tag Filters
--
-- Returns random source snippets matching criteria. Useful for weighted
-- selection and ensuring diversity in generation.
--
-- Parameters:
--   p_tags TEXT[] (optional) - Must match at least one tag
--   p_exclude_tags TEXT[] (optional) - Exclude snippets with these tags
--   p_count INTEGER (default 5) - Number of snippets to return
--   p_min_quality NUMERIC (default 80) - Minimum quality score
--   p_ensure_diversity BOOLEAN (default true) - Try to avoid similar snippets
--
-- Returns: JSON array of source snippets

CREATE OR REPLACE FUNCTION get_random_snippets(
  p_tags TEXT[] DEFAULT NULL,
  p_exclude_tags TEXT[] DEFAULT NULL,
  p_count INTEGER DEFAULT 5,
  p_min_quality NUMERIC DEFAULT 80,
  p_ensure_diversity BOOLEAN DEFAULT true
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_snippets JSON[];
  v_snippet JSON;
  v_selected_ids UUID[] := ARRAY[]::UUID[];
  v_candidate RECORD;
  v_similar_count INTEGER;
BEGIN
  -- If ensuring diversity, select one at a time and check for similarity
  IF p_ensure_diversity THEN
    FOR i IN 1..p_count LOOP
      -- Find candidates that haven't been selected and aren't too similar
      SELECT json_build_object(
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
      ) INTO v_snippet
      FROM source_snippet
      WHERE quality_score >= p_min_quality
        AND (p_tags IS NULL OR tags && p_tags)
        AND (p_exclude_tags IS NULL OR NOT (tags && p_exclude_tags))
        AND (array_length(v_selected_ids, 1) IS NULL OR id != ALL(v_selected_ids))
        -- Check similarity: avoid selecting too many with same archetype/culture/biome
        AND (
          SELECT COUNT(*) FROM source_snippet s2
          WHERE s2.id = ANY(v_selected_ids)
            AND (
              (s2.archetype IS NOT NULL AND archetype = s2.archetype)
              OR (s2.culture IS NOT NULL AND culture = s2.culture)
              OR (s2.biome IS NOT NULL AND biome = s2.biome)
            )
        ) < 2  -- Allow max 2 similar snippets
      ORDER BY RANDOM()
      LIMIT 1;

      IF v_snippet IS NOT NULL THEN
        v_snippets := array_append(v_snippets, v_snippet);
        v_selected_ids := array_append(v_selected_ids, (v_snippet->>'id')::UUID);
      END IF;
    END LOOP;

    SELECT json_agg(elem) INTO v_result
    FROM unnest(v_snippets) AS elem;
  ELSE
    -- Simple random selection without diversity checks
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
    ) INTO v_result
    FROM (
      SELECT *
      FROM source_snippet
      WHERE quality_score >= p_min_quality
        AND (p_tags IS NULL OR tags && p_tags)
        AND (p_exclude_tags IS NULL OR NOT (tags && p_exclude_tags))
      ORDER BY RANDOM()
      LIMIT p_count
    ) sub;
  END IF;

  RETURN COALESCE(v_result, '[]'::JSON);
END;
$$;

COMMENT ON FUNCTION get_random_snippets IS 
  'Returns random source snippets with optional diversity checking to avoid 
   selecting too many similar snippets. Used for weighted selection in generation.';

