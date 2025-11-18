/**
 * Inspect Generated NPCs
 * 
 * Analyzes recently generated NPCs to assess quality and context integration.
 * 
 * Usage:
 *   npx tsx scripts/database/inspect-npcs.ts [world_id]
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectNPCs(worldId?: string) {
  console.log('🔍 Inspecting Generated NPCs\n');
  console.log('─────────────────────────────────────────────────────────────\n');

  // Get all worlds if no world ID provided
  let worlds: { id: string; name: string }[] = [];
  if (worldId) {
    const { data } = await supabase
      .from('world')
      .select('id, name')
      .eq('id', worldId)
      .limit(1);
    if (data) worlds = data;
  } else {
    const { data } = await supabase
      .from('world')
      .select('id, name')
      .order('created_at', { ascending: false })
      .limit(5);
    if (data) worlds = data;
  }

  if (worlds.length === 0) {
    console.log('❌ No worlds found');
    return;
  }

  for (const world of worlds) {
    console.log(`\n📖 World: ${world.name} (${world.id.substring(0, 8)}...)\n`);

    // Get NPCs for this world, ordered by creation time (newest first)
    const { data: npcs, error } = await supabase
      .from('world_npc')
      .select('*')
      .eq('world_id', world.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error(`❌ Error fetching NPCs: ${error.message}`);
      continue;
    }

    if (!npcs || npcs.length === 0) {
      console.log('   No NPCs found in this world');
      continue;
    }

    console.log(`   Found ${npcs.length} NPCs (showing most recent 10):\n`);

    // Analyze the most recent NPCs
    const recentNPCs = npcs.slice(0, 10);
    
    for (let i = 0; i < recentNPCs.length; i++) {
      const npc = recentNPCs[i];
      const traits = (npc.traits as Record<string, unknown>) || {};
      const summary = traits.summary as { oneLiner?: string; keyPoints?: string[] } | undefined;
      const bio = npc.bio as string | undefined;
      const backstory = npc.backstory as string | undefined;
      
      console.log(`   ${i + 1}. ${npc.name || 'Unnamed'}`);
      console.log(`      Created: ${npc.created_at ? new Date(npc.created_at).toLocaleString() : 'Unknown'}`);
      
      if (traits.class) console.log(`      Class: ${traits.class}`);
      if (traits.race) console.log(`      Race: ${traits.race}`);
      if (traits.level) console.log(`      Level: ${traits.level}`);
      
      if (bio) {
        console.log(`      Bio: ${bio.substring(0, 100)}${bio.length > 100 ? '...' : ''}`);
      }
      
      if (summary?.oneLiner) {
        console.log(`      One-liner: ${summary.oneLiner.substring(0, 100)}${summary.oneLiner.length > 100 ? '...' : ''}`);
      }
      
      if (summary?.keyPoints && summary.keyPoints.length > 0) {
        console.log(`      Key Points: ${summary.keyPoints.length} points`);
        summary.keyPoints.slice(0, 2).forEach((point: string, idx: number) => {
          console.log(`        ${idx + 1}. ${point.substring(0, 80)}${point.length > 80 ? '...' : ''}`);
        });
      }
      
      // Check for context indicators
      const hasContext = backstory && (
        backstory.toLowerCase().includes('culture') ||
        backstory.toLowerCase().includes('faction') ||
        backstory.toLowerCase().includes('location') ||
        backstory.toLowerCase().includes('world')
      );
      
      if (hasContext) {
        console.log(`      ✅ Context indicators found`);
      }
      
      console.log('');
    }

    // Analyze variety
    const classes = [...new Set(recentNPCs.map(n => (n.traits as Record<string, unknown>)?.class).filter(Boolean))];
    const races = [...new Set(recentNPCs.map(n => (n.traits as Record<string, unknown>)?.race).filter(Boolean))];
    
    console.log(`   📊 Variety Analysis:`);
    console.log(`      Classes: ${classes.length} unique (${classes.join(', ')})`);
    console.log(`      Races: ${races.length} unique (${races.join(', ')})`);
    console.log('');
  }

  // Check generation requests
  console.log('\n📋 Recent Generation Requests:\n');
  const { data: requests } = await supabase
    .from('generation_request')
    .select('*')
    .eq('kind', 'world_npc')
    .order('created_at', { ascending: false })
    .limit(10);

  if (requests && requests.length > 0) {
    requests.forEach((req, idx) => {
      const prompt = req.prompt as Record<string, unknown> | undefined;
      console.log(`   ${idx + 1}. ${req.created_at ? new Date(req.created_at).toLocaleString() : 'Unknown'}`);
      if (prompt?.nameHint) console.log(`      Name hint: ${prompt.nameHint}`);
      if (prompt?.tags) console.log(`      Tags: ${Array.isArray(prompt.tags) ? prompt.tags.join(', ') : prompt.tags}`);
      if (prompt?.ruleset) console.log(`      Ruleset: ${prompt.ruleset}`);
      console.log('');
    });
  } else {
    console.log('   No generation requests found');
  }
}

const worldId = process.argv[2];
inspectNPCs(worldId).catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

