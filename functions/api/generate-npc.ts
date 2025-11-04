import { createClient } from '@supabase/supabase-js';

interface GenerateNpcBody {
  campaignId: string;
  nameHint?: string;
  tags?: string[];
  ruleset?: string; // e.g., DND5E_2024
  locationId?: string;
  level?: number;
  affiliations?: Array<{ type?: string; name?: string; ref_id?: string }>;
  connections?: Array<{ kind: 'npc' | 'location' | 'item'; ref_id: string; label?: string }>;
}

export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context;
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Missing Supabase env' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  let body: GenerateNpcBody;
  try {
    body = (await request.json()) as GenerateNpcBody;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (!body.campaignId) {
    return new Response(JSON.stringify({ error: 'campaignId required' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  // Create a generation_request row
  const { data: reqRow, error: reqErr } = await supabase
    .from('generation_request')
    .insert({
      campaign_id: body.campaignId,
      kind: 'npc',
      prompt: {
        nameHint: body.nameHint ?? null,
        tags: body.tags ?? [],
        ruleset: body.ruleset ?? 'DND5E_2024',
      },
      model: 'placeholder',
    })
    .select()
    .single();

  if (reqErr || !reqRow) {
    return new Response(JSON.stringify({ error: reqErr?.message || 'insert request failed' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  // Generate NPC draft from provided inputs (will be enhanced with AI later)
  const race = body.tags?.find(t => t && ['elf', 'dwarf', 'human', 'halfling', 'orc', 'tiefling', 'dragonborn', 'gnome'].includes(t.toLowerCase())) || 'human';
  const temperament = body.tags?.find(t => t && ['aggressive', 'friendly', 'cautious', 'reckless', 'stoic', 'cheerful'].includes(t.toLowerCase())) || 'neutral';
  const keywords = body.tags?.filter(t => t && !['elf', 'dwarf', 'human', 'halfling', 'orc', 'tiefling', 'dragonborn', 'gnome', 'aggressive', 'friendly', 'cautious', 'reckless', 'stoic', 'cheerful'].includes(t.toLowerCase())).slice(0, 3) || [];
  
  // Generate name from hint or random
  const name = body.nameHint || `${race.charAt(0).toUpperCase() + race.slice(1)} ${['Thorn', 'Grim', 'Bright', 'Swift', 'Iron', 'Storm'].sort(() => Math.random() - 0.5)[0]}`;
  
  // Generate stats based on level (placeholder - will be enhanced)
  const level = body.level || 3;
  const statRoll = () => 8 + Math.floor(Math.random() * 5); // 8-12 range for NPCs
  
  const npcDraft = {
    name,
    bio: `A ${temperament} ${race} ${keywords.length > 0 ? `known for ${keywords.join(', ')}` : 'with a mysterious past'}.`,
    backstory: `Born in ${['a small village', 'the capital', 'a remote outpost', 'the wilderness'][Math.floor(Math.random() * 4)]}, this ${race} has lived a life marked by ${keywords[0] || 'uncertainty'}. ${keywords[1] ? `They are ${keywords[1]}.` : ''} ${keywords[2] ? `Their ${keywords[2]} defines much of who they are.` : ''}`,
    traits: {
      race,
      temperament,
      ideals: keywords.slice(0, 1) || ['survival'],
      flaws: keywords.slice(1, 2) || ['trust'],
      bonds: keywords.slice(2, 3) || ['family'],
      keywords: keywords.slice(0, 3),
    },
    stats: {
      level,
      abilities: {
        str: statRoll(),
        dex: statRoll(),
        con: statRoll(),
        int: statRoll(),
        wis: statRoll(),
        cha: statRoll(),
      },
      equipment: body.tags?.find(t => t.toLowerCase().includes('sword') || t.toLowerCase().includes('staff') || t.toLowerCase().includes('bow')) || 'basic gear',
    },
    image_url: null,
    voice_id: null,
    ruleset: body.ruleset ?? 'DND5E_2024',
    location_id: body.locationId ?? null,
    affiliations: body.affiliations ?? [],
    relationships: {},
    connections: body.connections ?? [],
  };

  const { data: outRow, error: outErr } = await supabase
    .from('generation_output')
    .insert({
      request_id: reqRow.id,
      content: npcDraft,
      status: 'draft',
    })
    .select()
    .single();

  if (outErr || !outRow) {
    return new Response(JSON.stringify({ error: outErr?.message || 'insert output failed' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  // Also materialize an npc row as draft with dm_only visibility
  const { data: npcRow, error: npcErr } = await supabase
    .from('npc')
    .insert({
      campaign_id: body.campaignId,
      name: npcDraft.name,
      bio: npcDraft.bio,
      backstory: npcDraft.backstory,
      traits: npcDraft.traits,
      stats: npcDraft.stats,
      location_id: npcDraft.location_id,
      affiliations: npcDraft.affiliations,
      relationships: npcDraft.relationships,
      connections: npcDraft.connections,
      visibility: 'dm_only',
      permitted_member_ids: [],
    })
    .select()
    .single();

  if (npcErr || !npcRow) {
    return new Response(JSON.stringify({ error: npcErr?.message || 'insert npc failed' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  // Seed an initial interaction log entry
  await supabase.from('npc_interaction').insert({
    campaign_id: body.campaignId,
    npc_id: npcRow.id,
    entry: 'NPC generated as draft. Awaiting DM approval.',
    metadata: { generator: 'ai-placeholder' },
  });

  return new Response(JSON.stringify({ request: reqRow, output: outRow, npc: npcRow }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};


