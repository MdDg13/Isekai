/**
 * Context Builder Library
 * 
 * Utilities for building context packs from source snippets and world elements.
 * Used by generation pipelines to assemble context for AI prompts.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface SourceSnippet {
  id: string;
  source_name: string;
  excerpt: string;
  tags?: string[];
  archetype?: string;
  conflict_hook?: string;
  rp_cues?: string[];
  culture?: string;
  biome?: string;
  tone?: string;
  mechanics?: Record<string, unknown>;
  quality_score?: number;
}

export interface WorldElement {
  id: string;
  type: string;
  name: string;
  summary?: string;
  detail?: Record<string, unknown>;
  tone?: string;
  culture_tags?: string[];
  keywords?: string[];
}

export interface ContextPack {
  snippets: SourceSnippet[];
  elements?: WorldElement[];
  summary: {
    cultures: string[];
    biomes: string[];
    tones: string[];
    tags: string[];
    element_count?: number;
  };
}

/**
 * Build context pack from source snippets
 */
export async function buildContextPack(
  supabase: SupabaseClient,
  options: {
    tags?: string[];
    culture?: string;
    biome?: string;
    tone?: string;
    limit?: number;
    minQuality?: number;
  } = {}
): Promise<ContextPack> {
  const { data, error } = await supabase.rpc('get_context_pack', {
    p_world_id: null,
    p_tags: options.tags || null,
    p_culture: options.culture || null,
    p_biome: options.biome || null,
    p_tone: options.tone || null,
    p_limit: options.limit || 20,
    p_min_quality: options.minQuality || 80
  });

  if (error) {
    throw new Error(`Failed to get context pack: ${error.message}`);
  }

  const snippets: SourceSnippet[] = (data || []) as SourceSnippet[];

  // Extract summary from snippets
  const cultures = [...new Set(snippets.map(s => s.culture).filter(Boolean))] as string[];
  const biomes = [...new Set(snippets.map(s => s.biome).filter(Boolean))] as string[];
  const tones = [...new Set(snippets.map(s => s.tone).filter(Boolean))] as string[];
  const tags = [...new Set(snippets.flatMap(s => s.tags || []))];

  return {
    snippets,
    summary: {
      cultures,
      biomes,
      tones,
      tags
    }
  };
}

/**
 * Get random snippets with diversity
 */
export async function getRandomSnippets(
  supabase: SupabaseClient,
  options: {
    tags?: string[];
    excludeTags?: string[];
    count?: number;
    minQuality?: number;
    ensureDiversity?: boolean;
  } = {}
): Promise<SourceSnippet[]> {
  const { data, error } = await supabase.rpc('get_random_snippets', {
    p_tags: options.tags || null,
    p_exclude_tags: options.excludeTags || null,
    p_count: options.count || 5,
    p_min_quality: options.minQuality || 80,
    p_ensure_diversity: options.ensureDiversity !== false
  });

  if (error) {
    throw new Error(`Failed to get random snippets: ${error.message}`);
  }

  return (data || []) as SourceSnippet[];
}

/**
 * Get world context (elements + snippets)
 */
export async function getWorldContext(
  supabase: SupabaseClient,
  worldId: string,
  options: {
    elementType?: string;
    includeSnippets?: boolean;
    snippetCount?: number;
  } = {}
): Promise<ContextPack> {
  const { data, error } = await supabase.rpc('get_world_context', {
    p_world_id: worldId,
    p_element_type: options.elementType || null,
    p_include_snippets: options.includeSnippets !== false,
    p_snippet_count: options.snippetCount || 10
  });

  if (error) {
    throw new Error(`Failed to get world context: ${error.message}`);
  }

  const result = data as {
    elements?: WorldElement[];
    snippets?: SourceSnippet[];
    summary: {
      cultures: string[];
      biomes: string[];
      tones: string[];
      tags: string[];
      element_count: number;
    };
  };

  return {
    snippets: result.snippets || [],
    elements: result.elements || [],
    summary: result.summary
  };
}

/**
 * Format context pack for AI prompt
 */
export function formatContextForPrompt(pack: ContextPack): string {
  const parts: string[] = [];

  // Summary
  if (pack.summary.cultures.length > 0) {
    parts.push(`Cultures: ${pack.summary.cultures.join(', ')}`);
  }
  if (pack.summary.biomes.length > 0) {
    parts.push(`Biomes: ${pack.summary.biomes.join(', ')}`);
  }
  if (pack.summary.tones.length > 0) {
    parts.push(`Tones: ${pack.summary.tones.join(', ')}`);
  }

  // Existing elements
  if (pack.elements && pack.elements.length > 0) {
    parts.push('\nExisting World Elements:');
    pack.elements.forEach(el => {
      parts.push(`- ${el.name} (${el.type}): ${el.summary || 'No summary'}`);
    });
  }

  // Source snippets
  if (pack.snippets.length > 0) {
    parts.push('\nSource Inspiration:');
    pack.snippets.forEach(snippet => {
      const snippetParts = [snippet.excerpt];
      if (snippet.archetype) snippetParts.push(`Archetype: ${snippet.archetype}`);
      if (snippet.conflict_hook) snippetParts.push(`Conflict: ${snippet.conflict_hook}`);
      if (snippet.rp_cues && snippet.rp_cues.length > 0) {
        snippetParts.push(`RP cues: ${snippet.rp_cues.join(', ')}`);
      }
      parts.push(`- ${snippetParts.join(' | ')}`);
    });
  }

  return parts.join('\n');
}

