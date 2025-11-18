# Supabase RPC Functions for Context Graph

## Installation

Run these SQL files in Supabase SQL Editor in order:

1. `get-context-pack.sql` - Main context pack fetcher
2. `get-random-snippets.sql` - Random snippet selector with diversity
3. `get-world-context.sql` - World context combiner

## Functions

### `get_context_pack(p_world_id, p_tags, p_culture, p_biome, p_tone, p_limit, p_min_quality)`

Returns curated source snippets based on filters.

**Parameters:**
- `p_world_id` UUID (optional) - World ID for context
- `p_tags` TEXT[] (optional) - Filter by tags
- `p_culture` TEXT (optional) - Filter by culture
- `p_biome` TEXT (optional) - Filter by biome
- `p_tone` TEXT (optional) - Filter by tone
- `p_limit` INTEGER (default 20) - Max snippets
- `p_min_quality` NUMERIC (default 80) - Min quality score

**Returns:** JSON array of snippets

**Example:**
```sql
SELECT get_context_pack(
  p_tags => ARRAY['npc', 'wizard'],
  p_culture => 'urban',
  p_limit => 10
);
```

### `get_random_snippets(p_tags, p_exclude_tags, p_count, p_min_quality, p_ensure_diversity)`

Returns random snippets with diversity checking.

**Parameters:**
- `p_tags` TEXT[] (optional) - Must match at least one
- `p_exclude_tags` TEXT[] (optional) - Exclude these tags
- `p_count` INTEGER (default 5) - Number to return
- `p_min_quality` NUMERIC (default 80) - Min quality
- `p_ensure_diversity` BOOLEAN (default true) - Avoid similar snippets

**Returns:** JSON array of snippets

**Example:**
```sql
SELECT get_random_snippets(
  p_tags => ARRAY['npc'],
  p_count => 5,
  p_ensure_diversity => true
);
```

### `get_world_context(p_world_id, p_element_type, p_include_snippets, p_snippet_count)`

Combines existing world elements with relevant snippets.

**Parameters:**
- `p_world_id` UUID (required) - World ID
- `p_element_type` world_element_type (optional) - Filter by type
- `p_include_snippets` BOOLEAN (default true) - Include snippets
- `p_snippet_count` INTEGER (default 10) - Snippet count

**Returns:** JSON object with elements, snippets, and summary

**Example:**
```sql
SELECT get_world_context(
  p_world_id => '...',
  p_element_type => 'npc',
  p_snippet_count => 10
);
```

## Testing

Test in Supabase SQL Editor:

```sql
-- Test context pack
SELECT get_context_pack(p_tags => ARRAY['npc'], p_limit => 5);

-- Test random snippets
SELECT get_random_snippets(p_tags => ARRAY['location'], p_count => 3);

-- Test world context (requires existing world)
SELECT get_world_context(p_world_id => '<your-world-id>');
```

## Cloudflare Functions

These RPCs are wrapped by Cloudflare Functions:
- `/api/get-context-pack` - Wraps `get_context_pack`
- `/api/get-random-snippets` - Wraps `get_random_snippets`
- `/api/get-world-context` - Wraps `get_world_context`

See `functions/api/` for implementation.

