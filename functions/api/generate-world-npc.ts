import { createClient } from '@supabase/supabase-js';
import { runWorkersAIText } from '../_lib/ai';

interface GenerateWorldNpcBody {
  worldId: string;
  nameHint?: string;
  tags?: string[];
  ruleset?: string;
  locationId?: string;
  level?: number;
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

  let body: GenerateWorldNpcBody;
  try {
    body = (await request.json()) as GenerateWorldNpcBody;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (!body.worldId) {
    return new Response(JSON.stringify({ error: 'worldId required' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  // Create a generation_request row (schema supports campaign_id only; store world info in prompt)
  const { data: reqRow, error: reqErr } = await supabase
    .from('generation_request')
    .insert({
      // campaign_id omitted for world-level generations
      kind: 'world_npc',
      prompt: {
        worldId: body.worldId,
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

  // Generate world NPC draft using Workers AI if configured; fallback to lightweight randomizer
  const modelEnabled = (env.WORKERS_AI_ENABLE as string | undefined)?.toLowerCase() === 'true';
  let npcDraft: any;
  if (modelEnabled) {
    const userPromptParts = [
      body.nameHint ? `User prompt: ${body.nameHint}` : '',
      body.tags && body.tags.length ? `Tags: ${body.tags.join(', ')}` : '',
      body.level != null ? `Desired level: ${body.level}` : '',
    ].filter(Boolean);
    const system = 'You are a TTRPG content generator. Return ONLY JSON matching the schema with no extra text.';
    const prompt = `Generate a D&D 5e NPC as compact JSON with keys: name (string), bio (string), backstory (string), traits { race, temperament, keywords[] }, stats { level, abilities { str,dex,con,int,wis,cha }, equipment }, image_url (null), voice_id (null). ${userPromptParts.join(' ')}.`;
    try {
      const output = await runWorkersAIText(
        {
          CLOUDFLARE_API_TOKEN: env.CLOUDFLARE_API_TOKEN as string | undefined,
          CLOUDFLARE_ACCOUNT_ID: env.CLOUDFLARE_ACCOUNT_ID as string | undefined,
          WORKERS_AI_MODEL: (env.WORKERS_AI_MODEL as string | undefined) || undefined,
        },
        prompt,
        { system, maxTokens: 700 }
      );
      // Try to extract JSON
      const jsonStart = output.indexOf('{');
      const jsonEnd = output.lastIndexOf('}');
      const maybe = jsonStart >= 0 && jsonEnd > jsonStart ? output.slice(jsonStart, jsonEnd + 1) : output;
      npcDraft = JSON.parse(maybe);
      npcDraft.ruleset = body.ruleset ?? 'DND5E_2024';
      npcDraft.location_id = body.locationId ?? null;
      npcDraft.affiliations = npcDraft.affiliations ?? [];
      npcDraft.relationships = npcDraft.relationships ?? {};
      npcDraft.connections = npcDraft.connections ?? [];
    } catch (err) {
      // Fall back to local generation
      npcDraft = null;
    }
  }
  if (!npcDraft) {
    const race = body.tags?.find(t => t && ['elf', 'dwarf', 'human', 'halfling', 'orc', 'tiefling', 'dragonborn', 'gnome'].includes(t.toLowerCase())) || 'human';
    const temperament = body.tags?.find(t => t && ['aggressive', 'friendly', 'cautious', 'reckless', 'stoic', 'cheerful'].includes(t.toLowerCase())) || 'neutral';
    const keywords = body.tags?.filter(t => t && !['elf', 'dwarf', 'human', 'halfling', 'orc', 'tiefling', 'dragonborn', 'gnome', 'aggressive', 'friendly', 'cautious', 'reckless', 'stoic', 'cheerful'].includes(t.toLowerCase())).slice(0, 3) || [];
    const name = body.nameHint || `${race.charAt(0).toUpperCase() + race.slice(1)} ${['Thorn', 'Grim', 'Bright', 'Swift', 'Iron', 'Storm'].sort(() => Math.random() - 0.5)[0]}`;
    const level = typeof body.level === 'number' ? body.level : 0;
    const statRoll = () => 8 + Math.floor(Math.random() * 5);
    npcDraft = {
      name,
      bio: `A ${temperament} ${race} ${keywords.length > 0 ? `known for ${keywords.join(', ')}` : 'with a mysterious past'}.`,
      backstory: `Born in ${['a small village', 'the capital', 'a remote outpost', 'the wilderness'][Math.floor(Math.random() * 4)]}, this ${race} has lived a life marked by ${keywords[0] || 'uncertainty'}. ${keywords[1] ? `They are ${keywords[1]}.` : ''} ${keywords[2] ? `Their ${keywords[2]} defines much of who they are.` : ''}`,
      traits: {
        race,
        temperament,
        keywords: keywords.slice(0, 3),
      },
      stats: {
        level,
        abilities: { str: statRoll(), dex: statRoll(), con: statRoll(), int: statRoll(), wis: statRoll(), cha: statRoll() },
        equipment: body.tags?.find(t => t?.toLowerCase().includes('sword') || t?.toLowerCase().includes('staff') || t?.toLowerCase().includes('bow')) || 'basic gear',
      },
      image_url: null,
      voice_id: null,
      ruleset: body.ruleset ?? 'DND5E_2024',
      location_id: body.locationId ?? null,
      affiliations: [],
      relationships: {},
      connections: [],
    };
  }

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

  // Materialize a world_npc row
  const { data: npcRow, error: npcErr } = await supabase
    .from('world_npc')
    .insert({
      world_id: body.worldId,
      name: npcDraft.name,
      bio: npcDraft.bio,
      backstory: npcDraft.backstory,
      traits: npcDraft.traits,
      stats: npcDraft.stats,
      location_id: npcDraft.location_id,
      affiliations: npcDraft.affiliations,
      relationships: npcDraft.relationships,
      connections: npcDraft.connections,
      visibility: 'public',
    })
    .select()
    .single();

  if (npcErr || !npcRow) {
    return new Response(JSON.stringify({ error: npcErr?.message || 'insert world_npc failed' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ request: reqRow, output: outRow, npc: npcRow }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};

