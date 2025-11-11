import { createClient } from '@supabase/supabase-js';
import { runWorkersAIText, runWorkersAIJSON } from '../_lib/ai';
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
      const intentParts: string[] = [];
      if (body.nameHint) intentParts.push(`nameHint="${body.nameHint}"`);
      if (body.class) intentParts.push(`class=${body.class}`);
      if (body.race) intentParts.push(`race=${body.race}`);
      if (body.background) intentParts.push(`background=${body.background}`);
      if (body.temperament) intentParts.push(`temperament=${body.temperament}`);
      if (body.tags && body.tags.length) intentParts.push(`tags=${body.tags.join(', ')}`);
      const intent = intentParts.length ? `User intent: ${intentParts.join(' | ')}.` : 'User intent: none specified.';

      // Step 1: Enhancement with strict schema + examples
      type Enhanced = {
        name: string;
        bio: string;
        backstory: string;
        traits: {
          race?: string; temperament?: string; personalityTraits?: string[]; ideal?: string; bond?: string; flaw?: string;
          background?: string; class?: string; keywords?: string[];
        };
        stats: {
          level?: number;
          abilities?: { str?: number; dex?: number; con?: number; int?: number; wis?: number; cha?: number };
          equipment?: string;
          combat?: {
            hitpoints?: number; maxHitpoints?: number; armorClass?: number; speed?: number;
            weapons?: Array<{ name?: string; type?: string; damage?: string; damageType?: string; toHit?: number; damageBonus?: number; range?: string; }>;
            damageResistances?: string[]; damageImmunities?: string[]; conditionImmunities?: string[];
          };
        };
      };

      const enhancePrompt =
`You are improving a D&D 5e NPC so it is creative, coherent, and immediately usable by a DM.
${intent}
Rules:
- Respect all explicit user constraints (class, race, background, temperament, name hints). Do not change them.
- Keep content concise but evocative; avoid generic filler.
- Align bio/backstory with the specified class/race and setting-neutral fantasy tone.
- Prefer concrete, game-usable hooks over vague traits.

Return JSON matching the Enhanced schema only.
Base NPC JSON:
${JSON.stringify(npcDraft)}`;

      const aiEnhanced = await runWorkersAIJSON<Enhanced>(
        {
          CLOUDFLARE_API_TOKEN: env.CLOUDFLARE_API_TOKEN as string | undefined,
          CLOUDFLARE_ACCOUNT_ID: env.CLOUDFLARE_ACCOUNT_ID as string | undefined,
          WORKERS_AI_MODEL: (env.WORKERS_AI_MODEL as string | undefined) || undefined,
        },
        enhancePrompt,
        { maxTokens: 1200, temperature: 0.5 }
      );

      // Step 2: Self-critique and targeted edits
      type Critique = {
        issues: string[];
        edits: Partial<Enhanced>;
      };
      const critiquePrompt =
`Critique the NPC for:
- Adherence to constraints (${intent}).
- Clarity and DM usability (hooks, motivations, conflicts).
- Creativity and uniqueness.
Provide JSON: { "issues": string[], "edits": Partial<Enhanced> }.
Only include edits that materially improve adherence/quality; keep structure.`;

      const critique = await runWorkersAIJSON<Critique>(
        {
          CLOUDFLARE_API_TOKEN: env.CLOUDFLARE_API_TOKEN as string | undefined,
          CLOUDFLARE_ACCOUNT_ID: env.CLOUDFLARE_ACCOUNT_ID as string | undefined,
          WORKERS_AI_MODEL: (env.WORKERS_AI_MODEL as string | undefined) || undefined,
        },
        `Current NPC:\n${JSON.stringify(aiEnhanced)}\n\n${critiquePrompt}`,
        { maxTokens: 800, temperature: 0.3 }
      );

      const mergedAfterCritique: Enhanced = {
        ...aiEnhanced,
        ...critique.edits,
        traits: { ...(aiEnhanced.traits || {}), ...(critique.edits?.traits || {}) },
        stats: { ...(aiEnhanced.stats || {}), ...(critique.edits?.stats || {}) },
      };

      // Enforce explicit constraints (final guardrails)
      if (body.class) {
        mergedAfterCritique.traits = { ...(mergedAfterCritique.traits || {}), class: body.class };
      }
      if (body.race) {
        mergedAfterCritique.traits = { ...(mergedAfterCritique.traits || {}), race: body.race };
      }
      if (body.background) {
        mergedAfterCritique.traits = { ...(mergedAfterCritique.traits || {}), background: body.background };
      }
      if (!mergedAfterCritique.stats) mergedAfterCritique.stats = {};
      if (!mergedAfterCritique.stats.combat) mergedAfterCritique.stats.combat = {};

      // Merge back into draft
      if (mergedAfterCritique.name) npcDraft.name = mergedAfterCritique.name;
      if (mergedAfterCritique.bio) npcDraft.bio = mergedAfterCritique.bio;
      if (mergedAfterCritique.backstory) npcDraft.backstory = mergedAfterCritique.backstory;
      npcDraft.traits = { ...npcDraft.traits, ...(mergedAfterCritique.traits || {}) };
      npcDraft.stats = { ...npcDraft.stats, ...(mergedAfterCritique.stats || {}) };

      // Step 3: Style normalization (third-person, coherent, concrete hooks)
      type StyleEdit = { bio?: string; backstory?: string };
      const stylePrompt =
`Rewrite the NPC's bio and backstory to be:
- Third-person perspective only (never "I", "me", or "my").
- Grammatically correct, varied sentence structure, and vivid but concise.
- Coherent: motivations and history should connect logically.
- Concrete: replace vague references (e.g., "a punishment") with specific, setting-neutral details.
Return JSON with optionally: { "bio": string, "backstory": string }.
Do not change race/class/background facts.

Current NPC:
${JSON.stringify({
  name: npcDraft.name,
  bio: npcDraft.bio,
  backstory: npcDraft.backstory,
  traits: npcDraft.traits,
})}`;

      const styleEdits = await runWorkersAIJSON<StyleEdit>(
        {
          CLOUDFLARE_API_TOKEN: env.CLOUDFLARE_API_TOKEN as string | undefined,
          CLOUDFLARE_ACCOUNT_ID: env.CLOUDFLARE_ACCOUNT_ID as string | undefined,
          WORKERS_AI_MODEL: (env.WORKERS_AI_MODEL as string | undefined) || undefined,
        },
        stylePrompt,
        { maxTokens: 800, temperature: 0.3 }
      );

      if (styleEdits?.bio) npcDraft.bio = styleEdits.bio;
      if (styleEdits?.backstory) npcDraft.backstory = styleEdits.backstory;
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
  // Fill in basic combat stats if missing
  function abilityMod(score?: number): number {
    if (typeof score !== 'number') return 0;
    return Math.floor((score - 10) / 2);
  }

  type StatsShape = NonNullable<GeneratedNPC['stats']> & {
    combat?: {
      hitpoints?: number; maxHitpoints?: number; armorClass?: number; speed?: number;
      weapons?: Array<{ name?: string; type?: string; damage?: string; damageType?: string; toHit?: number; damageBonus?: number; range?: string; }>;
    };
  };

  const statsObj = (finalNpc.stats || {}) as StatsShape;
  const abilities = statsObj.abilities || {};
  const dexMod = abilityMod(abilities.dex);
  const conMod = abilityMod(abilities.con);
  const lvl = typeof statsObj.level === 'number' && statsObj.level >= 0 ? statsObj.level : 0;

  if (!statsObj.combat) statsObj.combat = {};
  if (statsObj.combat.hitpoints === undefined) {
    const baseHP = 6 + conMod; // simple baseline
    statsObj.combat.hitpoints = Math.max(1, baseHP + Math.max(0, lvl) * 5);
    statsObj.combat.maxHitpoints = statsObj.combat.hitpoints;
  }
  if (statsObj.combat.armorClass === undefined) {
    const eq = (statsObj.equipment || '').toLowerCase();
    let ac = 10 + dexMod;
    if (eq.includes('leather armor')) ac = 11 + dexMod;
    if (eq.includes('studded leather')) ac = 12 + dexMod;
    if (eq.includes('chain shirt')) ac = 13 + Math.min(2, dexMod);
    if (eq.includes('chain mail')) ac = 16; // no dex mod
    statsObj.combat.armorClass = ac;
  }
  if (!statsObj.combat.weapons || statsObj.combat.weapons.length === 0) {
    const eq = (statsObj.equipment || '').toLowerCase();
    const weapons: NonNullable<StatsShape['combat']>['weapons'] = [];
    const toHit = dexMod >= abilityMod(abilities.str) ? dexMod : abilityMod(abilities.str);

    if (eq.includes('longbow')) {
      weapons.push({ name: 'Longbow', type: 'ranged', damage: '1d8', damageType: 'piercing', toHit, damageBonus: dexMod, range: '150/600' });
    }
    if (eq.includes('shortsword')) {
      weapons.push({ name: 'Shortsword', type: 'melee', damage: '1d6', damageType: 'piercing', toHit, damageBonus: dexMod, range: '5' });
    }
    if (eq.includes('longsword')) {
      weapons.push({ name: 'Longsword', type: 'melee', damage: '1d8', damageType: 'slashing', toHit: abilityMod(abilities.str), damageBonus: abilityMod(abilities.str), range: '5' });
    }

    if (weapons.length === 0) {
      weapons.push({ name: 'Dagger', type: 'melee', damage: '1d4', damageType: 'piercing', toHit, damageBonus: dexMod, range: '5/20/60' });
    }
    statsObj.combat.weapons = weapons;
  }

  const { data: npcRow, error: npcErr } = await supabase
    .from('world_npc')
    .insert({
      world_id: body.worldId,
      name: finalNpc.name,
      bio: finalNpc.bio,
      backstory: finalNpc.backstory,
      traits: finalNpc.traits,
      stats: { ...finalNpc.stats, combat: statsObj.combat },
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

