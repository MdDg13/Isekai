import { createClient } from '@supabase/supabase-js';
import { runWorkersAIJSON } from '../_lib/ai';
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
- Respect all explicit user constraints (class, race, background, temperament). Do not change them.
- If nameHint is provided, generate a PROPER NAME inspired by it (e.g., "apprentice blacksmith" → "Thorin Ironforge", not the hint text itself).
- Keep content concise but evocative; avoid generic filler.
- Align bio/backstory with the specified class/race and setting-neutral fantasy tone.
- Prefer concrete, game-usable hooks over vague traits.
- Bio must be a complete, grammatically correct sentence. Never use fragments like "known for X and Y".
- Use ONLY third person ("they/their/them"). Never use "I", "me", "my", "I am", etc.

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
      } else if (raceFromTags) {
        // Also enforce race from tags if no explicit race was set
        mergedAfterCritique.traits = { ...(mergedAfterCritique.traits || {}), race: raceFromTags };
      }
      if (body.background) {
        mergedAfterCritique.traits = { ...(mergedAfterCritique.traits || {}), background: body.background };
      }
      if (!mergedAfterCritique.stats) mergedAfterCritique.stats = {};
      if (!mergedAfterCritique.stats.combat) mergedAfterCritique.stats.combat = {};

      // Merge back into draft
      // Only use AI-generated name if it's a proper name (not the prompt text)
      // Check for common prompt patterns that shouldn't be used as names
      const aiName = mergedAfterCritique.name?.trim() || '';
      const isPromptText = aiName.includes(',') || 
                          aiName.toLowerCase().includes('training to') ||
                          aiName.toLowerCase().includes('against') ||
                          aiName.toLowerCase().includes('dreams of') ||
                          aiName.toLowerCase().includes('apprentice') ||
                          aiName.split(' ').length > 4 ||
                          aiName.length > 50;
      
      if (aiName && !isPromptText && aiName.length >= 2) {
        npcDraft.name = aiName;
      } else if (body.nameHint && isPromptText) {
        // If nameHint looks like prompt text, generate a proper name from it
        const nameGenPrompt = `Generate a proper fantasy name (first and last name) inspired by this description: "${body.nameHint}". 
Return ONLY a name in JSON format: { "name": "FirstName LastName" }.
Examples: "shy dwarf training to become wizard" → "Thorin Spellweaver", "apprentice blacksmith" → "Gareth Forgehand"`;
        
        const nameGen = await runWorkersAIJSON<{ name?: string }>(
          {
            CLOUDFLARE_API_TOKEN: env.CLOUDFLARE_API_TOKEN as string | undefined,
            CLOUDFLARE_ACCOUNT_ID: env.CLOUDFLARE_ACCOUNT_ID as string | undefined,
            WORKERS_AI_MODEL: (env.WORKERS_AI_MODEL as string | undefined) || undefined,
          },
          nameGenPrompt,
          { maxTokens: 50, temperature: 0.7 }
        );
        
        if (nameGen?.name && nameGen.name.trim().length >= 2 && nameGen.name.length < 50) {
          npcDraft.name = nameGen.name.trim();
        }
      }
      if (mergedAfterCritique.bio) npcDraft.bio = mergedAfterCritique.bio;
      if (mergedAfterCritique.backstory) npcDraft.backstory = mergedAfterCritique.backstory;
      npcDraft.traits = { ...npcDraft.traits, ...(mergedAfterCritique.traits || {}) };
      npcDraft.stats = { ...npcDraft.stats, ...(mergedAfterCritique.stats || {}) };

      // Step 3: Style normalization (third-person, coherent, concrete hooks)
      type StyleEdit = { bio?: string; backstory?: string };
      const stylePrompt =
`CRITICAL TASK: You MUST fix all grammar, specificity, and coherence issues. This is a final quality pass.

Current text:
Bio: "${mergedAfterCritique.bio || ''}"
Backstory: "${mergedAfterCritique.backstory || ''}"

MANDATORY FIXES (apply ALL of these):

1. GRAMMAR - THIRD PERSON ONLY:
   - Find and replace EVERY instance of: "I", "me", "my", "I am", "I will", "I have", "I learned", "I know", "I protect", "I served"
   - Replace with: "they", "them", "their", "they are", "they will", "they have", "they learned", "they know", "they protect", "they served"
   - Example: "I am well known" → "they are well known", "my work" → "their work", "protect me" → "protect them"

2. SENTENCE STRUCTURE:
   - Fix broken sentences like "known for guard and opportunistic" → "known for their guard duties and opportunistic nature"
   - Fix fragments like "known for scholar and pious" → "a pious scholar known for their devotion to ancient texts"
   - Every sentence must be complete and grammatically correct

3. SPECIFICITY - REPLACE VAGUE TERMS:
   - "a punishment" → "exiled from their homeland for stealing a noble's signet ring"
   - "an event" → "the day their mentor was assassinated by rival guild members"
   - "something" → specific action or object
   - "a thing" → concrete detail

4. COHERENCE - LOGICAL CONNECTIONS:
   - If ideal is "knowledge", show HOW it connects to their bond/flaw/backstory
   - If bond mentions "protect the temple", explain WHY (e.g., "they were raised there after being orphaned")
   - Make relationships EXPLICIT, not implied

Return JSON: { "bio": string, "backstory": string } with ALL fixes applied.
Do not change race/class/background/level facts.

Current NPC traits (for context):
${JSON.stringify(mergedAfterCritique.traits || {})}

EXAMPLES OF FIXES:

BAD: "A neutral tiefling ranger known for ranger and humble."
GOOD: "A humble tiefling ranger who patrols the borderlands, known for their unwavering dedication to protecting travelers from bandits."

BAD: "Their life was marked by a punishment, which shaped who they are today. They are driven by knowledge, and i will do anything to protect the temple where i served."
GOOD: "Their life was marked by exile from their homeland after they exposed corruption in the merchant's guild. This experience taught them that knowledge is power, and they now protect the temple library where they found refuge, ensuring its ancient texts remain safe from those who would misuse them."

BAD: "As a ranger, they have learned to i am well known for my work, and i always make sure everyone knows it."
GOOD: "As a ranger, they have learned to track their quarry through any terrain, and their reputation for never abandoning a hunt has spread throughout the borderlands."

BAD: "known for guard and opportunistic"
GOOD: "a guard known for their opportunistic nature and willingness to bend rules when it serves their interests"

Now apply ALL fixes to the bio and backstory.`;

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

      // Step 4: Grammar-specific pass (focus ONLY on first-person removal)
      const grammarPrompt =
`CRITICAL: Remove ALL first-person references. This is a grammar-only pass.

Current text:
Bio: "${npcDraft.bio || ''}"
Backstory: "${npcDraft.backstory || ''}"

TASK: Find and replace EVERY instance of:
- "I " → "they "
- " I " → " they "
- " I," → " they,"
- " I." → " they."
- "I am" → "they are"
- "I have" → "they have"
- "I will" → "they will"
- "I learned" → "they learned"
- "I know" → "they know"
- "I protect" → "they protect"
- "I served" → "they served"
- "my " → "their "
- " me " → " them "
- " me," → " them,"
- " me." → " them."

Return JSON: { "bio": string, "backstory": string } with ALL first-person references removed.
Keep everything else exactly the same.`;

      const grammarEdits = await runWorkersAIJSON<StyleEdit>(
        {
          CLOUDFLARE_API_TOKEN: env.CLOUDFLARE_API_TOKEN as string | undefined,
          CLOUDFLARE_ACCOUNT_ID: env.CLOUDFLARE_ACCOUNT_ID as string | undefined,
          WORKERS_AI_MODEL: (env.WORKERS_AI_MODEL as string | undefined) || undefined,
        },
        grammarPrompt,
        { maxTokens: 600, temperature: 0.1 }
      );

      if (grammarEdits?.bio) npcDraft.bio = grammarEdits.bio;
      if (grammarEdits?.backstory) npcDraft.backstory = grammarEdits.backstory;

      // Step 5: Final quality check and bio sentence structure fix
      const qualityPrompt =
`FINAL QUALITY CHECK: Fix broken bio sentences and ensure coherence.

Current text:
Bio: "${npcDraft.bio || ''}"
Backstory: "${npcDraft.backstory || ''}"

SPECIFIC FIXES NEEDED:
1. Fix broken bio patterns like "known for X and Y" → make complete sentences
   - "known for noble and humble" → "a humble noble known for their dedication to their people"
   - "known for spellcaster and pious" → "a pious spellcaster known for their devotion to ancient magic"
   - "known for guard and opportunistic" → "a guard known for their opportunistic nature"

2. Ensure bio is ONE complete, grammatically correct sentence (or two short sentences max)

3. Ensure backstory flows logically and connects to traits

4. Remove any remaining first-person references ("I", "me", "my")

Return JSON: { "bio": string, "backstory": string } with fixes applied.`;

      const qualityEdits = await runWorkersAIJSON<StyleEdit>(
        {
          CLOUDFLARE_API_TOKEN: env.CLOUDFLARE_API_TOKEN as string | undefined,
          CLOUDFLARE_ACCOUNT_ID: env.CLOUDFLARE_ACCOUNT_ID as string | undefined,
          WORKERS_AI_MODEL: (env.WORKERS_AI_MODEL as string | undefined) || undefined,
        },
        qualityPrompt,
        { maxTokens: 700, temperature: 0.2 }
      );

      if (qualityEdits?.bio) npcDraft.bio = qualityEdits.bio;
      if (qualityEdits?.backstory) npcDraft.backstory = qualityEdits.backstory;
    } catch (err) {
      // If AI fails, use procedural base (no degradation)
      console.error('AI enhancement failed, using procedural base:', err);
      // Log the error details for debugging
      if (err instanceof Error) {
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
      }
    }
  } else {
    console.log('AI enhancement disabled (WORKERS_AI_ENABLE not set to "true")');
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
  if (statsObj.combat.speed === undefined) {
    // Default speed: 30 ft for most races, 25 ft for small races
    const race = (finalNpc.traits?.race || '').toLowerCase();
    statsObj.combat.speed = (race === 'halfling' || race === 'gnome' || race === 'dwarf') ? 25 : 30;
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

