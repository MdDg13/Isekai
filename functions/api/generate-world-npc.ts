import { createClient } from '@supabase/supabase-js';
import { runWorkersAIJSON } from '../_lib/ai';
import { generateNPC, type GenerateNPCOptions, type GeneratedNPC } from '../_lib/npc-procedural';
import { getWorldContext, getRandomSnippets, formatContextForPrompt } from '../_lib/context-builder';
import { GenerationLogger } from '../_lib/generation-logger';
import { generateNPCPortrait, uploadPortraitToStorage } from '../_lib/npc-portrait';

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

  // Initialize generation logger
  const logger = new GenerationLogger(supabase, reqRow.id, body.worldId);

  // Parse tags for race, class, temperament - extract from phrases too
  const allTagText = body.tags?.join(' ').toLowerCase() || '';
  
  // Extract race (check both exact matches and phrases)
  const raceKeywords = ['elf', 'dwarf', 'human', 'halfling', 'orc', 'tiefling', 'dragonborn', 'gnome'];
  const raceFromTags = body.tags?.find(t => raceKeywords.includes(t.toLowerCase())) ||
    raceKeywords.find(race => allTagText.includes(race));
  
  // Extract class (check both exact matches and phrases like "training to become wizard", "ex-mercenary", "turned to peace")
  const classKeywords = ['commoner', 'guard', 'noble', 'merchant', 'scholar', 'warrior', 'spellcaster', 'wizard', 'rogue', 'ranger', 'cleric', 'bard', 'sorcerer', 'paladin', 'barbarian', 'druid', 'monk', 'fighter', 'mercenary'];
  let classFromTags = body.tags?.find(t => classKeywords.includes(t.toLowerCase())) ||
    classKeywords.find(cls => allTagText.includes(cls));
  
  // Special handling for ex-mercenary → monk/cleric (peace/meditation)
  if (allTagText.includes('ex-mercenary') || allTagText.includes('former mercenary') || allTagText.includes('turned to peace') || allTagText.includes('meditation')) {
    // Prefer monk or cleric for ex-mercenary who turned to peace
    if (!classFromTags || classFromTags === 'mercenary' || classFromTags === 'warrior' || classFromTags === 'fighter') {
      // Override with monk (meditation) or cleric (helping poor/defending weak)
      if (allTagText.includes('meditation')) {
        classFromTags = 'monk';
      } else if (allTagText.includes('help') || allTagText.includes('defend') || allTagText.includes('poor') || allTagText.includes('weak')) {
        classFromTags = 'cleric';
      } else {
        classFromTags = 'monk'; // Default to monk for peace/meditation theme
      }
    }
  }
  
  // Extract temperament
  const temperamentKeywords = ['aggressive', 'friendly', 'cautious', 'reckless', 'stoic', 'cheerful', 'neutral', 'shy', 'timid', 'reserved', 'bold', 'confident', 'peaceful', 'calm', 'serene'];
  const temperamentFromTags = body.tags?.find(t => temperamentKeywords.includes(t.toLowerCase())) ||
    temperamentKeywords.find(temp => allTagText.includes(temp)) ||
    (allTagText.includes('peace') || allTagText.includes('meditation') ? 'peaceful' : undefined);
  
  // Extract conflict indicators (for backstory)
  const conflictIndicators = ['against', 'disapprove', 'conflict', 'wishes', 'parent', 'family', 'oppose'];
  const hasConflict = conflictIndicators.some(indicator => allTagText.includes(indicator));

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

  // Step 1: Procedural generation
  logger.startStep('procedural');
  logger.log({
    step: 'procedural',
    logType: 'info',
    message: 'Starting procedural NPC generation',
    data: { options: proceduralOptions }
  });

  const npcDraft = generateNPC(proceduralOptions);

  logger.log({
    step: 'procedural',
    logType: 'info',
    message: 'Procedural generation complete',
    data: {
      name: npcDraft.name,
      class: (npcDraft.traits as Record<string, unknown>)?.class,
      race: (npcDraft.traits as Record<string, unknown>)?.race,
      bio: npcDraft.bio?.substring(0, 100)
    }
  });
  logger.endStep('procedural');

  // Optionally enhance with AI if enabled
  const modelEnabled = (env.WORKERS_AI_ENABLE as string | undefined)?.toLowerCase() === 'true';
  logger.log({
    step: 'procedural',
    logType: modelEnabled ? 'info' : 'warning',
    message: `AI enhancement: ${modelEnabled ? 'ENABLED' : 'DISABLED'}`,
    data: { WORKERS_AI_ENABLE: env.WORKERS_AI_ENABLE }
  });

  if (modelEnabled) {
    try {
      // Build explicit constraints list
      const finalClass = body.class || classFromTags;
      const finalRace = body.race || raceFromTags;
      const finalTemperament = body.temperament || temperamentFromTags;
      
      const intentParts: string[] = [];
      const constraintParts: string[] = [];
      
      if (body.nameHint) intentParts.push(`nameHint="${body.nameHint}"`);
      if (finalClass) {
        constraintParts.push(`class: ${finalClass} (REQUIRED - DO NOT CHANGE)`);
        intentParts.push(`class=${finalClass} (MANDATORY)`);
      }
      if (finalRace) {
        constraintParts.push(`race: ${finalRace} (REQUIRED - DO NOT CHANGE)`);
        intentParts.push(`race=${finalRace} (MANDATORY)`);
      }
      if (body.background) {
        constraintParts.push(`background: ${body.background} (REQUIRED - DO NOT CHANGE)`);
        intentParts.push(`background=${body.background} (MANDATORY)`);
      }
      if (finalTemperament) {
        intentParts.push(`temperament=${finalTemperament}`);
      }
      if (hasConflict) {
        intentParts.push(`family conflict: REQUIRED in backstory`);
      }
      if (body.tags && body.tags.length) {
        // Include full tag context for better interpretation
        const tagContext = body.tags.join(', ');
        intentParts.push(`additional context: ${tagContext}`);
        
        // Extract key themes from tags for explicit mention
        if (allTagText.includes('ex-mercenary') || allTagText.includes('former mercenary')) {
          intentParts.push(`background: ex-mercenary (soldier/mercenary past)`);
        }
        if (allTagText.includes('peace') || allTagText.includes('meditation')) {
          intentParts.push(`theme: peace and meditation (calm, serene, contemplative)`);
        }
        if (allTagText.includes('wandering') || allTagText.includes('wander')) {
          intentParts.push(`lifestyle: wandering/traveling`);
        }
        if (allTagText.includes('help') && allTagText.includes('poor')) {
          intentParts.push(`motivation: help the poor and needy`);
        }
        if (allTagText.includes('defend') && allTagText.includes('weak')) {
          intentParts.push(`motivation: defend the weak and vulnerable`);
        }
      }
      
      const intent = intentParts.length ? `User intent: ${intentParts.join(' | ')}.` : 'User intent: none specified.';
      const explicitConstraints = constraintParts.length > 0 
        ? `\n\nCRITICAL CONSTRAINTS (MANDATORY - DO NOT CHANGE):\n${constraintParts.map(c => `- ${c}`).join('\n')}\n`
        : '';

      // Get world context and source snippets for richer generation
      logger.startStep('context_fetch');
      let worldContextText = '';
      try {
        logger.log({
          step: 'context_fetch',
          logType: 'info',
          message: 'Fetching world context and source snippets'
        });

        const worldContext = await getWorldContext(supabase, body.worldId, {
          elementType: 'npc',
          includeSnippets: true,
          snippetCount: 5
        });
        
        logger.log({
          step: 'context_fetch',
          logType: 'info',
          message: 'World context fetched',
          data: {
            elementsCount: worldContext.elements?.length || 0,
            snippetsCount: worldContext.snippets?.length || 0,
            summary: worldContext.summary
          }
        });
        
        // Also get random NPC snippets for inspiration
        const randomSnippets = await getRandomSnippets(supabase, {
          tags: ['npc'],
          count: 3,
          minQuality: 80,
          ensureDiversity: true
        });
        
        logger.log({
          step: 'context_fetch',
          logType: 'info',
          message: 'Random snippets fetched',
          data: {
            count: randomSnippets.length,
            archetypes: randomSnippets.map(s => s.archetype).filter(Boolean)
          }
        });
        
        // Combine world context with random snippets
        const combinedContext = {
          ...worldContext,
          snippets: [...(worldContext.snippets || []), ...randomSnippets]
        };
        
        worldContextText = formatContextForPrompt(combinedContext);
        
        logger.log({
          step: 'context_fetch',
          logType: 'info',
          message: 'Context formatted for prompt',
          data: {
            contextLength: worldContextText.length,
            totalSnippets: combinedContext.snippets?.length || 0
          }
        });
      } catch (contextError) {
        // If context fetching fails, continue without it (graceful degradation)
        logger.log({
          step: 'context_fetch',
          logType: 'error',
          message: 'Failed to fetch world context',
          data: {
            error: contextError instanceof Error ? contextError.message : String(contextError)
          }
        });
      }
      logger.endStep('context_fetch');

      // Step 2: AI Enhancement with strict schema + examples
      logger.startStep('ai_enhance');
      logger.log({
        step: 'ai_enhance',
        logType: 'info',
        message: 'Starting AI enhancement',
        data: {
          hasContext: !!worldContextText,
          contextLength: worldContextText.length,
          intent: intent.substring(0, 200),
          constraintsCount: constraintParts.length
        }
      });

      // Structured for DM usability: quick reference → summary → details
      type Enhanced = {
        name: string;
        bio: string; // One-line quick reference (e.g., "A shy dwarf wizard apprentice defying traditionalist parents")
        summary: {
          oneLiner: string; // Concise description (1 sentence)
          keyPoints: string[]; // 3-5 bullet points for quick reference
        };
        backstory: string; // Detailed narrative (2-4 paragraphs)
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
`You are creating a cohesive, DM-friendly D&D 5e NPC. Think holistically: all elements must connect and support each other.
${intent}${explicitConstraints}
${worldContextText ? `\n\nWORLD CONTEXT:\n${worldContextText}\n` : ''}

CRITICAL RULES (MUST FOLLOW):

1. CONSTRAINT ADHERENCE (HIGHEST PRIORITY):
   ${constraintParts.length > 0 ? constraintParts.map(c => `   - ${c}`).join('\n') : '   - No explicit constraints specified'}
   - These constraints are MANDATORY. Do NOT change race, class, or background even if you think another choice would be more creative.
   - If user wants "dwarf wizard", the NPC MUST be dwarf race and wizard class - no exceptions.

2. STRUCTURED OUTPUT FORMAT (DM-FRIENDLY) - ALL FIELDS REQUIRED:
   - **bio**: One-line quick reference (e.g., "A shy dwarf wizard apprentice defying traditionalist parents")
   - **summary.oneLiner**: REQUIRED - One complete sentence capturing the NPC's essence (MUST be provided)
   - **summary.keyPoints**: REQUIRED - 3-5 bullet points for quick reference during play (MUST be provided):
     * Key personality trait or behavior
     * Primary motivation or goal
     * Notable relationship or conflict
     * Distinctive quirk or mannerism
     * Role or function in the world
   - **backstory**: 2-4 paragraphs of detailed narrative connecting all elements logically
   
   CRITICAL: You MUST provide both summary.oneLiner and summary.keyPoints in your JSON response. Do not omit these fields.

3. COHESION REQUIREMENTS:
   - ALL elements must connect: personality → motivation → backstory → traits → stats
   - If shy, show HOW it manifests (avoids eye contact, speaks quietly, hides in corners)
   - If family conflict, explain WHY (specific reason: tradition, honor, religion, business)
   - If wizard training, show WHERE/WHEN/HOW they're learning (secret study, mentor, location)
   - Make relationships EXPLICIT: "their parents, who are miners, disapprove because..."
   - Connect ideal/bond/flaw to backstory: show HOW they developed

4. CONTENT QUALITY:
   - Use ONLY third person ("they/their/them"). Never use "I", "me", "my", "I am", etc.
   - Prefer concrete, game-usable details over vague references
   - Avoid generic filler; every detail should serve the DM
   - Make personality traits ACTIONABLE (how DM can roleplay them)

5. NAME GENERATION:
   - Generate a PROPER FANTASY NAME (first and last)
   - Never use prompt text or description as the NPC's name

6. FAMILY CONFLICT (if indicated):
   ${hasConflict ? '- MUST include family/parent conflict in backstory. Explain WHY parents disapprove (tradition, honor, religion, business, etc.). Make it SPECIFIC and CONCRETE.' : '- No family conflict required.'}

EXAMPLE OF COHESIVE STRUCTURE:
{
  "name": "Thorin Spellweaver",
  "bio": "A shy dwarf wizard apprentice secretly studying magic despite their miner parents' disapproval",
  "summary": {
    "oneLiner": "A timid dwarf who discovered an ancient spellbook in the mines and now practices magic in secret, terrified of their parents' reaction.",
    "keyPoints": [
      "Speaks in hushed tones and avoids direct eye contact when nervous",
      "Desperately wants to prove magic can help miners, not replace them",
      "Parents are traditional miners who see magic as dangerous and unnatural",
      "Practices spells in abandoned mine shafts using crystals as foci",
      "Carries the spellbook hidden in a false-bottomed mining satchel"
    ]
  },
  "backstory": "Born into a clan of renowned miners, Thorin was expected to follow in their parents' footsteps... [detailed narrative connecting all elements]"
}

Return JSON matching the Enhanced schema. Ensure ALL elements connect cohesively.
Base NPC JSON:
${JSON.stringify(npcDraft)}`;

      // Lower temperature when constraints exist (better constraint adherence)
      const hasExplicitConstraints = !!(finalClass || finalRace || body.background);
      const temperature = hasExplicitConstraints ? 0.3 : 0.5;
      
      const aiEnhanced = await runWorkersAIJSON<Enhanced>(
        {
          CLOUDFLARE_API_TOKEN: env.CLOUDFLARE_API_TOKEN as string | undefined,
          CLOUDFLARE_ACCOUNT_ID: env.CLOUDFLARE_ACCOUNT_ID as string | undefined,
          WORKERS_AI_MODEL: (env.WORKERS_AI_MODEL as string | undefined) || undefined,
        },
        enhancePrompt,
        { maxTokens: 1200, temperature }
      );

      logger.log({
        step: 'ai_enhance',
        logType: 'info',
        message: 'AI enhancement complete',
        data: {
          hasName: !!aiEnhanced.name,
          hasBio: !!aiEnhanced.bio,
          hasBackstory: !!aiEnhanced.backstory,
          hasSummary: !!aiEnhanced.summary,
          summaryOneLiner: aiEnhanced.summary?.oneLiner?.substring(0, 100),
          summaryKeyPointsCount: aiEnhanced.summary?.keyPoints?.length || 0,
          temperature,
          model: env.WORKERS_AI_MODEL
        }
      });

      // Step 3: Self-critique and targeted edits
      type Critique = {
        issues: string[];
        edits: Partial<Enhanced>;
      };
      const critiquePrompt =
`Critique the NPC for adherence to constraints and quality.

CRITICAL CONSTRAINT CHECK (verify these first):
${finalClass ? `- Is class exactly "${finalClass}"? (not similar, not changed - must be exact match)` : ''}
${finalRace ? `- Is race exactly "${finalRace}"? (not similar, not changed - must be exact match)` : ''}
${body.background ? `- Is background exactly "${body.background}"? (must be exact match)` : ''}
${hasConflict ? `- Does backstory include family/parent conflict? (must be explicit, not implied)` : ''}

QUALITY CHECKS:
- Clarity and DM usability (hooks, motivations, conflicts).
- Creativity and uniqueness.
- Coherence (all elements connect logically).

${intent}

If constraints are NOT met, you MUST fix them in your edits.
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

      // Enforce explicit constraints (final guardrails) - including tag-derived constraints
      if (finalClass) {
        mergedAfterCritique.traits = { ...(mergedAfterCritique.traits || {}), class: finalClass };
      }
      if (finalRace) {
        mergedAfterCritique.traits = { ...(mergedAfterCritique.traits || {}), race: finalRace };
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
      const promptText = body.nameHint || body.tags?.join(' ') || '';
      const isPromptText = aiName.includes(',') || 
                          aiName.toLowerCase().includes('training to') ||
                          aiName.toLowerCase().includes('against') ||
                          aiName.toLowerCase().includes('dreams of') ||
                          aiName.toLowerCase().includes('apprentice') ||
                          aiName.split(' ').length > 4 ||
                          aiName.length > 50 ||
                          (promptText && aiName.toLowerCase().includes(promptText.toLowerCase().substring(0, 20)));
      
      if (aiName && !isPromptText && aiName.length >= 2) {
        npcDraft.name = aiName;
      } else if (promptText && isPromptText) {
        // If nameHint or tags look like prompt text, generate a proper name from it
        const nameSource = body.nameHint || body.tags?.filter(t => !['shy', 'dwarf', 'wizard', 'training', 'against', 'parent', 'wishes'].includes(t.toLowerCase())).join(' ') || 'fantasy character';
        const nameGenPrompt = `Generate a proper fantasy name (first and last name) inspired by this description: "${nameSource}". 
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
      // Merge enhanced content back into draft
      if (mergedAfterCritique.bio) npcDraft.bio = mergedAfterCritique.bio;
      if (mergedAfterCritique.backstory) npcDraft.backstory = mergedAfterCritique.backstory;
      
      // Ensure summary exists - generate from bio if AI didn't provide it
      let finalSummary = mergedAfterCritique.summary;
      if (!finalSummary || !finalSummary.oneLiner || !finalSummary.keyPoints || finalSummary.keyPoints.length === 0) {
        // Fallback: generate summary from bio and backstory
        const bioText = mergedAfterCritique.bio || npcDraft.bio || '';
        const backstoryText = mergedAfterCritique.backstory || npcDraft.backstory || '';
        finalSummary = {
          oneLiner: bioText || 'A character in the world.',
          keyPoints: [
            bioText ? bioText.substring(0, 80) + (bioText.length > 80 ? '...' : '') : 'No description available',
            ...(backstoryText ? [backstoryText.substring(0, 100) + (backstoryText.length > 100 ? '...' : '')] : [])
          ].slice(0, 3)
        };
      }
      
      // Store summary in traits
      npcDraft.traits = { 
        ...npcDraft.traits, 
        ...(mergedAfterCritique.traits || {}),
        summary: finalSummary
      };
      npcDraft.stats = { ...npcDraft.stats, ...(mergedAfterCritique.stats || {}) };

      // Step 3: Style normalization (third-person, coherent, concrete hooks)
      type StyleEdit = { 
        bio?: string; 
        summary?: { oneLiner?: string; keyPoints?: string[] };
        backstory?: string;
      };
      const currentSummary = mergedAfterCritique.summary || { oneLiner: '', keyPoints: [] };
      const stylePrompt =
`CRITICAL TASK: You MUST fix all grammar, specificity, and coherence issues. This is a final quality pass.

CONSTRAINT REMINDER (DO NOT CHANGE):
${finalClass ? `- Class MUST remain "${finalClass}"` : ''}
${finalRace ? `- Race MUST remain "${finalRace}"` : ''}
${hasConflict ? `- Backstory MUST include family/parent conflict` : ''}

Current text:
Bio: "${mergedAfterCritique.bio || ''}"
Summary one-liner: "${currentSummary.oneLiner || ''}"
Summary key points: ${JSON.stringify(currentSummary.keyPoints || [])}
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

Return JSON: { "bio": string, "summary": { "oneLiner": string, "keyPoints": string[] }, "backstory": string } with ALL fixes applied.
- Ensure summary.oneLiner is one complete sentence
- Ensure summary.keyPoints are 3-5 actionable bullet points (not vague)
- Do not change race/class/background/level facts.

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
      if (styleEdits?.summary) {
        const currentTraits = npcDraft.traits as Record<string, unknown>;
        npcDraft.traits = { ...currentTraits, summary: styleEdits.summary };
      }

      // Step 5: Grammar-specific pass (focus ONLY on first-person removal)
      logger.startStep('grammar_fix');
      logger.log({
        step: 'grammar_fix',
        logType: 'info',
        message: 'Starting grammar fixes (first-person removal)'
      });

      const currentSummaryForGrammar = (npcDraft.traits as { summary?: { oneLiner?: string; keyPoints?: string[] } })?.summary || { oneLiner: '', keyPoints: [] };
      const grammarPrompt =
`CRITICAL: Remove ALL first-person references. This is a grammar-only pass.

Current text:
Bio: "${npcDraft.bio || ''}"
Summary one-liner: "${currentSummaryForGrammar.oneLiner || ''}"
Summary key points: ${JSON.stringify(currentSummaryForGrammar.keyPoints || [])}
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

Return JSON: { "bio": string, "summary": { "oneLiner": string, "keyPoints": string[] }, "backstory": string } with ALL first-person references removed.
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
      if (grammarEdits?.summary) {
        const currentTraits = npcDraft.traits as Record<string, unknown>;
        npcDraft.traits = { ...currentTraits, summary: grammarEdits.summary };
      }

      // Step 5: Final quality check and bio sentence structure fix
      const currentSummaryForQuality = (npcDraft.traits as { summary?: { oneLiner?: string; keyPoints?: string[] } })?.summary || { oneLiner: '', keyPoints: [] };
      const qualityPrompt =
`FINAL QUALITY CHECK: Fix broken bio sentences and ensure coherence.

Current text:
Bio: "${npcDraft.bio || ''}"
Summary one-liner: "${currentSummaryForQuality.oneLiner || ''}"
Summary key points: ${JSON.stringify(currentSummaryForQuality.keyPoints || [])}
Backstory: "${npcDraft.backstory || ''}"

SPECIFIC FIXES NEEDED (APPLY ALL):

1. FIX BROKEN BIO PATTERNS (CRITICAL):
   - "known for noble and brave" → "a brave noble known for their unwavering courage and dedication to their people"
   - "known for X and Y" → "a [descriptor] [class] known for [specific trait] and [specific trait]"
   - "known for noble and humble" → "a humble noble known for their dedication to their people"
   - "known for spellcaster and pious" → "a pious spellcaster known for their devotion to ancient magic"
   - NEVER leave fragments like "known for X and Y" - ALWAYS make complete sentences

2. REMOVE ALL FIRST-PERSON REFERENCES (CRITICAL):
   - "i suffer" → "they suffer"
   - "i care about" → "they care about"
   - "i am" → "they are"
   - "i will" → "they will"
   - "i have" → "they have"
   - "my" → "their"
   - Find and replace EVERY instance - this is a grammar error that MUST be fixed

3. ENSURE BIO IS ONE COMPLETE SENTENCE:
   - Bio must be grammatically correct and complete
   - No fragments, no broken patterns

4. ENSURE BACKSTORY FLOWS LOGICALLY:
   - All sentences must connect
   - Remove contradictions
   - Ensure coherence with traits

Return JSON: { "bio": string, "summary": { "oneLiner": string, "keyPoints": string[] }, "backstory": string } with fixes applied.
- Ensure summary.oneLiner is one complete sentence
- Ensure summary.keyPoints are 3-5 actionable, specific bullet points`;

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
      if (qualityEdits?.summary) {
        const currentTraits = npcDraft.traits as Record<string, unknown>;
        npcDraft.traits = { ...currentTraits, summary: qualityEdits.summary };
      }

      const readabilitySourceSummary = (npcDraft.traits as { summary?: { oneLiner?: string; keyPoints?: string[] } })?.summary || { oneLiner: '', keyPoints: [] };

      const readabilityPrompt =
`FINAL READABILITY POLISH:
- Ensure the bio is a single, vivid sentence under 30 words that highlights a hook or tension.
- Ensure summary.oneLiner is 1 sentence (max 28 words) that combines role + motivation + current tension.
- Ensure summary.keyPoints contains 3-5 bullet points, each under 18 words, starting with an action verb or descriptor (e.g., "Protects the river shrine from smugglers").
- Make key points concrete and DM-usable (relationships, quirks, actionable behaviors).
- Ensure backstory paragraphs are no longer than 3 sentences each and highlight cause → effect → current agenda.
- Keep everything third-person (no "I/my/me").

Return JSON: { "bio": string, "summary": { "oneLiner": string, "keyPoints": string[] }, "backstory": string } with all fixes applied.

Current content:
Bio: "${npcDraft.bio || ''}"
Summary one-liner: "${readabilitySourceSummary.oneLiner || ''}"
Summary key points: ${JSON.stringify(readabilitySourceSummary.keyPoints || [])}
Backstory: "${npcDraft.backstory || ''}"`;

      const readabilityEdits = await runWorkersAIJSON<StyleEdit>(
        {
          CLOUDFLARE_API_TOKEN: env.CLOUDFLARE_API_TOKEN as string | undefined,
          CLOUDFLARE_ACCOUNT_ID: env.CLOUDFLARE_ACCOUNT_ID as string | undefined,
          WORKERS_AI_MODEL: (env.WORKERS_AI_MODEL as string | undefined) || undefined,
        },
        readabilityPrompt,
        { maxTokens: 600, temperature: 0.2 }
      );

      if (readabilityEdits?.bio) npcDraft.bio = readabilityEdits.bio;
      if (readabilityEdits?.backstory) npcDraft.backstory = readabilityEdits.backstory;
      if (readabilityEdits?.summary) {
        const currentTraits = npcDraft.traits as Record<string, unknown>;
        npcDraft.traits = { ...currentTraits, summary: readabilityEdits.summary };
      }
      
      // Note: Programmatic fixes are applied after AI block (see below) to ensure they always run
    } catch (err) {
      // If AI fails, use procedural base (no degradation)
      logger.log({
        step: 'ai_enhance',
        logType: 'error',
        message: 'AI enhancement failed, using procedural base',
        data: {
          error: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined
        }
      });
      logger.endStep('ai_enhance');
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

  // ALWAYS ensure summary exists and apply programmatic fixes (even if AI is disabled or failed)
  const currentTraits = npcDraft.traits as { summary?: { oneLiner?: string; keyPoints?: string[] } } | undefined;
  if (!currentTraits?.summary || !currentTraits.summary.oneLiner || !currentTraits.summary.keyPoints || currentTraits.summary.keyPoints.length === 0) {
    // Generate summary from bio and backstory
    const bioText = npcDraft.bio || '';
    const backstoryText = npcDraft.backstory || '';
    const summary = {
      oneLiner: bioText || 'A character in the world.',
      keyPoints: [
        ...(bioText ? [bioText.substring(0, 80) + (bioText.length > 80 ? '...' : '')] : []),
        ...(backstoryText ? [backstoryText.substring(0, 100) + (backstoryText.length > 100 ? '...' : '')] : []),
        ...(currentTraits?.race ? [`Race: ${currentTraits.race}`] : []),
        ...(currentTraits?.class ? [`Class: ${currentTraits.class}`] : [])
      ].slice(0, 5).filter(Boolean)
    };
    npcDraft.traits = { ...npcDraft.traits, summary };
  }

  // ALWAYS apply programmatic fixes (even if AI is disabled or failed)
  // Fix broken bio patterns
  if (npcDraft.bio) {
    const traits = npcDraft.traits as { race?: string; class?: string } | undefined;
    const race = traits?.race || '';
    const npcClass = traits?.class || '';
    const descriptor = npcClass || race || 'character';
    
    // Fix "known for X and Y" patterns (more flexible matching)
    // Handle cases like "known for noble and brave" where adjectives might repeat class/race
    if (npcDraft.bio.match(/\bknown for \w+ and \w+/i)) {
      // Extract the adjectives
      const match = npcDraft.bio.match(/\bknown for (\w+) and (\w+)/i);
      if (match) {
        const [, adj1, adj2] = match;
        // Check if bio starts with "A [adj] [class/race]" pattern
        const prefixMatch = npcDraft.bio.match(/^A \w+ \w+/i);
        if (prefixMatch) {
          // Use the existing structure but fix the "known for" part
          npcDraft.bio = npcDraft.bio.replace(
            /\bknown for \w+ and \w+\.?\s*$/i,
            `known for their ${adj1} nature and ${adj2} demeanor.`
          );
        } else {
          // Reconstruct as proper sentence
          npcDraft.bio = npcDraft.bio.replace(
            /\bknown for \w+ and \w+.*$/i,
            `a ${adj2} ${descriptor} known for their ${adj1} nature and ${adj2} demeanor`
          );
        }
      }
    }
  }
  
  // Fix first-person references programmatically
  const fixFirstPerson = (text: string): string => {
    return text
      .replace(/\bi\s+suffer\b/gi, 'they suffer')
      .replace(/\bi\s+care\s+about\b/gi, 'they care about')
      .replace(/\bi\s+am\b/gi, 'they are')
      .replace(/\bi\s+will\b/gi, 'they will')
      .replace(/\bi\s+have\b/gi, 'they have')
      .replace(/\bi\s+learned\b/gi, 'they learned')
      .replace(/\bi\s+know\b/gi, 'they know')
      .replace(/\bi\s+protect\b/gi, 'they protect')
      .replace(/\bi\s+served\b/gi, 'they served')
      .replace(/\bmy\s+/gi, 'their ')
      .replace(/\s+me\s+/gi, ' them ')
      .replace(/\s+me\./gi, ' them.')
      .replace(/\s+me,/gi, ' them,');
  };
  
  if (npcDraft.bio) npcDraft.bio = fixFirstPerson(npcDraft.bio);
  if (npcDraft.backstory) npcDraft.backstory = fixFirstPerson(npcDraft.backstory);
  
  // Fix summary if it exists
  const finalTraits = npcDraft.traits as { summary?: { oneLiner?: string; keyPoints?: string[] } } | undefined;
  if (finalTraits?.summary) {
    if (finalTraits.summary.oneLiner) {
      finalTraits.summary.oneLiner = fixFirstPerson(finalTraits.summary.oneLiner);
    }
    if (finalTraits.summary.keyPoints) {
      finalTraits.summary.keyPoints = finalTraits.summary.keyPoints.map(p => fixFirstPerson(p));
    }
  }

  // Generate portrait if Workers AI is enabled (store buffer for upload after NPC creation)
  let portraitBuffer: Buffer | null = null;
  const portraitEnabled = (env.WORKERS_AI_ENABLE as string | undefined)?.toLowerCase() === 'true';
  
  if (portraitEnabled) {
    try {
      logger.startStep('portrait_generation');
      logger.log({
        step: 'portrait_generation',
        logType: 'info',
        message: 'Starting NPC portrait generation'
      });
      
      portraitBuffer = await generateNPCPortrait(npcDraft, {
        CF_ACCOUNT_ID: env.CLOUDFLARE_ACCOUNT_ID as string | undefined,
        CF_WORKERS_AI_TOKEN: env.CLOUDFLARE_API_TOKEN as string | undefined,
      });
      
      if (portraitBuffer) {
        logger.log({
          step: 'portrait_generation',
          logType: 'info',
          message: 'Portrait generated successfully',
          data: { size: portraitBuffer.length }
        });
      } else {
        logger.log({
          step: 'portrait_generation',
          logType: 'warn',
          message: 'Portrait generation returned null (credentials may be missing)'
        });
      }
      
      logger.endStep('portrait_generation');
    } catch (portraitError) {
      logger.log({
        step: 'portrait_generation',
        logType: 'error',
        message: 'Portrait generation failed',
        data: {
          error: portraitError instanceof Error ? portraitError.message : String(portraitError)
        }
      });
      logger.endStep('portrait_generation');
      // Continue without portrait - not critical
      console.warn('Portrait generation failed:', portraitError);
    }
  }

  // Add metadata (extend GeneratedNPC with additional fields)
  interface ExtendedNPC extends GeneratedNPC {
    image_url: string | null;
    voice_id: null;
    ruleset: string;
    location_id: string | null;
    affiliations: unknown[];
    relationships: Record<string, unknown>;
    connections: unknown[];
  }
  
  const finalNpc: ExtendedNPC = {
    ...npcDraft,
    image_url: null, // Will be set after upload
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
      image_url: null, // Will be updated after upload
      visibility: 'public',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (npcErr || !npcRow) {
    return new Response(JSON.stringify({ error: npcErr?.message || 'insert world_npc failed' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  // Upload portrait to Supabase Storage if generated
  let portraitUrl: string | null = null;
  if (portraitBuffer && npcRow.id) {
    try {
      logger.startStep('portrait_upload');
      logger.log({
        step: 'portrait_upload',
        logType: 'info',
        message: 'Uploading portrait to Supabase Storage',
        data: { npcId: npcRow.id }
      });
      
      portraitUrl = await uploadPortraitToStorage(supabase, npcRow.id, portraitBuffer);
      
      if (portraitUrl) {
        // Update NPC with portrait URL
        const { error: updateErr } = await supabase
          .from('world_npc')
          .update({ image_url: portraitUrl })
          .eq('id', npcRow.id);
        
        if (updateErr) {
          logger.log({
            step: 'portrait_upload',
            logType: 'error',
            message: 'Failed to update NPC with portrait URL',
            data: { error: updateErr.message }
          });
        } else {
          npcRow.image_url = portraitUrl;
          logger.log({
            step: 'portrait_upload',
            logType: 'info',
            message: 'Portrait uploaded and NPC updated successfully',
            data: { url: portraitUrl }
          });
        }
      } else {
        logger.log({
          step: 'portrait_upload',
          logType: 'warn',
          message: 'Portrait upload returned null (bucket may not exist)'
        });
      }
      
      logger.endStep('portrait_upload');
    } catch (uploadError) {
      logger.log({
        step: 'portrait_upload',
        logType: 'error',
        message: 'Portrait upload failed',
        data: {
          error: uploadError instanceof Error ? uploadError.message : String(uploadError)
        }
      });
      logger.endStep('portrait_upload');
      // Continue without portrait URL - not critical
      console.warn('Portrait upload failed:', uploadError);
    }
  }

  // Final logging
  logger.startStep('final');
  logger.log({
    step: 'final',
    logType: 'info',
    message: 'NPC generation complete',
    data: {
      npcId: npcRow?.id,
      name: finalNpc.name,
      hasBio: !!finalNpc.bio,
      hasBackstory: !!finalNpc.backstory,
      hasSummary: !!(finalNpc.traits as Record<string, unknown>)?.summary,
      aiEnabled: modelEnabled
    }
  });
  logger.endStep('final');

  // Flush all logs to database
  await logger.flush();

  return new Response(JSON.stringify({ request: reqRow, output: outRow, npc: npcRow }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};

