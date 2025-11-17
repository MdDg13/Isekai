/**
 * Supabase Reference Table Helpers
 * Utilities for inserting and querying reference data
 */

import { createClient } from '@supabase/supabase-js';

export interface SupabaseReferenceConfig {
  supabaseUrl: string;
  serviceRoleKey: string;
}

export function createReferenceClient(config: SupabaseReferenceConfig) {
  return createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: { persistSession: false },
  });
}

/**
 * Insert reference items in batch
 */
export async function insertReferenceItems(
  client: ReturnType<typeof createReferenceClient>,
  items: Array<Record<string, unknown>>
) {
  const { data, error } = await client
    .from('reference_item')
    .insert(items)
    .select();

  if (error) {
    throw new Error(`Failed to insert reference items: ${error.message}`);
  }

  return data;
}

/**
 * Insert reference spells in batch
 */
export async function insertReferenceSpells(
  client: ReturnType<typeof createReferenceClient>,
  spells: Array<Record<string, unknown>>
) {
  const { data, error } = await client
    .from('reference_spell')
    .insert(spells)
    .select();

  if (error) {
    throw new Error(`Failed to insert reference spells: ${error.message}`);
  }

  return data;
}

/**
 * Insert reference monsters in batch
 */
export async function insertReferenceMonsters(
  client: ReturnType<typeof createReferenceClient>,
  monsters: Array<Record<string, unknown>>
) {
  const { data, error } = await client
    .from('reference_monster')
    .insert(monsters)
    .select();

  if (error) {
    throw new Error(`Failed to insert reference monsters: ${error.message}`);
  }

  return data;
}

/**
 * Insert reference classes in batch
 */
export async function insertReferenceClasses(
  client: ReturnType<typeof createReferenceClient>,
  classes: Array<Record<string, unknown>>
) {
  const { data, error } = await client
    .from('reference_class')
    .insert(classes)
    .select();

  if (error) {
    throw new Error(`Failed to insert reference classes: ${error.message}`);
  }

  return data;
}

/**
 * Insert reference races in batch
 */
export async function insertReferenceRaces(
  client: ReturnType<typeof createReferenceClient>,
  races: Array<Record<string, unknown>>
) {
  const { data, error } = await client
    .from('reference_race')
    .insert(races)
    .select();

  if (error) {
    throw new Error(`Failed to insert reference races: ${error.message}`);
  }

  return data;
}

/**
 * Insert reference backgrounds in batch
 */
export async function insertReferenceBackgrounds(
  client: ReturnType<typeof createReferenceClient>,
  backgrounds: Array<Record<string, unknown>>
) {
  const { data, error } = await client
    .from('reference_background')
    .insert(backgrounds)
    .select();

  if (error) {
    throw new Error(`Failed to insert reference backgrounds: ${error.message}`);
  }

  return data;
}

/**
 * Insert reference feats in batch
 */
export async function insertReferenceFeats(
  client: ReturnType<typeof createReferenceClient>,
  feats: Array<Record<string, unknown>>
) {
  const { data, error } = await client
    .from('reference_feat')
    .insert(feats)
    .select();

  if (error) {
    throw new Error(`Failed to insert reference feats: ${error.message}`);
  }

  return data;
}

/**
 * Upsert reference item (update if exists, insert if new)
 */
export async function upsertReferenceItem(
  client: ReturnType<typeof createReferenceClient>,
  item: Record<string, unknown>
) {
  const { data, error } = await client
    .from('reference_item')
    .upsert(item, {
      onConflict: 'name,source',
      ignoreDuplicates: false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upsert reference item: ${error.message}`);
  }

  return data;
}

/**
 * Query reference items with filters
 */
export async function queryReferenceItems(
  client: ReturnType<typeof createReferenceClient>,
  filters: {
    kind?: string;
    rarity?: string;
    source?: string;
    search?: string;
    limit?: number;
  } = {}
) {
  let query = client.from('reference_item').select('*');

  if (filters.kind) {
    query = query.eq('kind', filters.kind);
  }
  if (filters.rarity) {
    query = query.eq('rarity', filters.rarity);
  }
  if (filters.source) {
    query = query.eq('source', filters.source);
  }
  if (filters.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }
  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to query reference items: ${error.message}`);
  }

  return data;
}

/**
 * Query reference spells with filters
 */
export async function queryReferenceSpells(
  client: ReturnType<typeof createReferenceClient>,
  filters: {
    level?: number;
    school?: string;
    source?: string;
    search?: string;
    limit?: number;
  } = {}
) {
  let query = client.from('reference_spell').select('*');

  if (filters.level !== undefined) {
    query = query.eq('level', filters.level);
  }
  if (filters.school) {
    query = query.eq('school', filters.school);
  }
  if (filters.source) {
    query = query.eq('source', filters.source);
  }
  if (filters.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }
  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to query reference spells: ${error.message}`);
  }

  return data;
}

/**
 * Query reference monsters with filters
 */
export async function queryReferenceMonsters(
  client: ReturnType<typeof createReferenceClient>,
  filters: {
    type?: string;
    cr_min?: number;
    cr_max?: number;
    source?: string;
    search?: string;
    limit?: number;
  } = {}
) {
  let query = client.from('reference_monster').select('*');

  if (filters.type) {
    query = query.eq('type', filters.type);
  }
  if (filters.cr_min !== undefined) {
    query = query.gte('challenge_rating', filters.cr_min);
  }
  if (filters.cr_max !== undefined) {
    query = query.lte('challenge_rating', filters.cr_max);
  }
  if (filters.source) {
    query = query.eq('source', filters.source);
  }
  if (filters.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }
  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to query reference monsters: ${error.message}`);
  }

  return data;
}

