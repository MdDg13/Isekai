import { createClient } from '@supabase/supabase-js';
import { runWorkersAIText } from '../_lib/ai';
import { generateNPC, type GenerateNPCOptions, type GeneratedNPC } from '../_lib/npc-procedural';

interface GenerateWorldNpcBody {
  worldId: string;
  nameHint?: string;
  tags?: string[];
  ruleset?: string;
  locationId?: string;
  level?: number;
  race?: string;
  class?: string;
  background?: string;
  temperament?: string;
  fullyRandom?: boolean;
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

  // Parse tags for race, class, temperament
  const raceFromTags = body.tags?.find(t => ['elf', 'dwarf', 'human', 'halfling', 'orc', 'tiefling', 'dragonborn', 'gnome'].includes(t.toLowerCase()));
  const temperamentFromTags = body.tags?.find(t => ['aggressive', 'friendly', 'cautious', 'reckless', 'stoic', 'cheerful', 'neutral'].includes(t.toLowerCase()));
  const classFromTags = body.tags?.find(t => ['commoner', 'guard', 'noble', 'merchant', 'scholar', 'warrior', 'spellcaster', 'rogue', 'ranger', 'cleric'].includes(t.toLowerCase()));

  // Generate base NPC procedurally (always)
  const proceduralOptions: GenerateNPCOptions = {
    nameHint: body.nameHint,
    race: body.race || raceFromTags,
    class: body.class || classFromTags,
    level: body.level ?? 0,
    background: body.background,
    temperament: body.temperament || temperamentFromTags || 'neutral',
    fullyRandom: body.fullyRandom ?? false
  };

  const npcDraft = generateNPC(proceduralOptions);

  // Optionally enhance with AI if enabled
  const modelEnabled = (env.WORKERS_AI_ENABLE as string | undefined)?.toLowerCase() === 'true';
  if (modelEnabled) {
    try {
      const system = 'You are a TTRPG content generator. Enhance the given NPC with creative details while maintaining the core structure. Return ONLY JSON matching the schema with no extra text.';
      const prompt = `Enhance this D&D 5e NPC with more creative and detailed content. Base NPC: ${JSON.stringify({
        name: npcDraft.name,
        bio: npcDraft.bio,
        backstory: npcDraft.backstory,
        traits: npcDraft.traits,
        stats: npcDraft.stats
      })}. Return enhanced JSON with keys: name (string), bio (string), backstory (string), traits { race, temperament, personalityTraits[], ideal, bond, flaw, background, class, keywords[] }, stats { level, abilities { str,dex,con,int,wis,cha }, equipment }. Make the content more vivid and original while keeping the same structure.`;
      
      const output = await runWorkersAIText(
        {
          CLOUDFLARE_API_TOKEN: env.CLOUDFLARE_API_TOKEN as string | undefined,
          CLOUDFLARE_ACCOUNT_ID: env.CLOUDFLARE_ACCOUNT_ID as string | undefined,
          WORKERS_AI_MODEL: (env.WORKERS_AI_MODEL as string | undefined) || undefined,
        },
        prompt,
        { system, maxTokens: 1000, temperature: 0.8 }
      );

      // Try to extract JSON
      const jsonStart = output.indexOf('{');
      const jsonEnd = output.lastIndexOf('}');
      const maybe = jsonStart >= 0 && jsonEnd > jsonStart ? output.slice(jsonStart, jsonEnd + 1) : output;
      const aiEnhanced = JSON.parse(maybe);
      
      // Merge AI enhancements with procedural base (AI can enhance but not replace core structure)
      if (aiEnhanced.name) npcDraft.name = aiEnhanced.name;
      if (aiEnhanced.bio) npcDraft.bio = aiEnhanced.bio;
      if (aiEnhanced.backstory) npcDraft.backstory = aiEnhanced.backstory;
      if (aiEnhanced.traits) {
        npcDraft.traits = { ...npcDraft.traits, ...aiEnhanced.traits };
      }
      if (aiEnhanced.stats) {
        npcDraft.stats = { ...npcDraft.stats, ...aiEnhanced.stats };
      }
    } catch (err) {
      // If AI fails, use procedural base (no degradation)
      console.error('AI enhancement failed, using procedural base:', err);
    }
  }

  // Add metadata (extend GeneratedNPC with additional fields)
  interface ExtendedNPC extends GeneratedNPC {
    image_url: null;
    voice_id: null;
    ruleset: string;
    location_id: string | null;
    affiliations: unknown[];
    relationships: Record<string, unknown>;
    connections: unknown[];
  }
  
  const finalNpc: ExtendedNPC = {
    ...npcDraft,
    image_url: null,
    voice_id: null,
    ruleset: body.ruleset ?? 'DND5E_2024',
    location_id: body.locationId ?? null,
    affiliations: [],
    relationships: {},
    connections: []
  };

  const { data: outRow, error: outErr } = await supabase
    .from('generation_output')
    .insert({
      request_id: reqRow.id,
      content: finalNpc,
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
      name: finalNpc.name,
      bio: finalNpc.bio,
      backstory: finalNpc.backstory,
      traits: finalNpc.traits,
      stats: finalNpc.stats,
      location_id: finalNpc.location_id ?? null,
      affiliations: finalNpc.affiliations ?? [],
      relationships: finalNpc.relationships ?? {},
      connections: finalNpc.connections ?? [],
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

