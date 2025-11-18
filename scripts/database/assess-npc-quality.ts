/**
 * Assess NPC Quality and Context Integration
 * 
 * Detailed analysis of NPC generation quality and whether context system is engaged.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function assessNPCs() {
  console.log('📊 NPC Quality & Context Integration Assessment\n');
  console.log('─────────────────────────────────────────────────────────────\n');

  // Get most recent NPCs
  const { data: npcs, error } = await supabase
    .from('world_npc')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error(`❌ Error: ${error.message}`);
    return;
  }

  if (!npcs || npcs.length === 0) {
    console.log('❌ No NPCs found');
    return;
  }

  console.log(`Found ${npcs.length} recent NPCs\n`);

  // Get generation requests to match with NPCs
  const { data: requests } = await supabase
    .from('generation_request')
    .select('*')
    .eq('kind', 'world_npc')
    .order('created_at', { ascending: false })
    .limit(10);

  const requestMap = new Map();
  if (requests) {
    requests.forEach(req => {
      const prompt = req.prompt as Record<string, unknown> | undefined;
      const tags = prompt?.tags as string[] | undefined;
      requestMap.set(req.created_at, {
        tags: tags || [],
        nameHint: prompt?.nameHint,
        ruleset: prompt?.ruleset
      });
    });
  }

  let contextUsedCount = 0;
  const qualityIssues: string[] = [];

  for (let i = 0; i < npcs.length; i++) {
    const npc = npcs[i];
    const traits = (npc.traits as Record<string, unknown>) || {};
    const summary = traits.summary as { oneLiner?: string; keyPoints?: string[] } | undefined;
    const bio = npc.bio as string | undefined;
    const backstory = npc.backstory as string | undefined;
    
    console.log(`\n${i + 1}. ${npc.name || 'Unnamed'}`);
    console.log(`   Created: ${npc.created_at ? new Date(npc.created_at).toLocaleString() : 'Unknown'}`);
    
    // Find matching request
    const matchingRequest = requestMap.get(npc.created_at);
    if (matchingRequest) {
      console.log(`   Request Tags: ${JSON.stringify(matchingRequest.tags)}`);
      if (matchingRequest.nameHint) console.log(`   Name Hint: ${matchingRequest.nameHint}`);
    }
    
    console.log(`   Class: ${traits.class || 'N/A'}, Race: ${traits.race || 'N/A'}, Level: ${traits.level || 'N/A'}`);
    
    // Quality checks
    const issues: string[] = [];
    
    // Check for repetitive/generic bio
    if (bio) {
      const bioLower = bio.toLowerCase();
      if (bioLower.includes('known for their') && bioLower.includes('nature')) {
        issues.push('Generic repetitive bio pattern');
      }
      if (bioLower.split(' ').length < 10) {
        issues.push('Bio too short/generic');
      }
    }
    
    // Check one-liner quality
    if (summary?.oneLiner) {
      const oneLiner = summary.oneLiner.toLowerCase();
      if (oneLiner === bio?.toLowerCase() || oneLiner.includes('known for')) {
        issues.push('One-liner just repeats bio');
      }
      if (oneLiner.split(' ').length < 8) {
        issues.push('One-liner too short');
      }
    } else {
      issues.push('Missing one-liner');
    }
    
    // Check key points
    if (!summary?.keyPoints || summary.keyPoints.length === 0) {
      issues.push('Missing key points');
    } else if (summary.keyPoints.length < 3) {
      issues.push('Too few key points');
    }
    
    // Check backstory quality
    if (!backstory || backstory.length < 200) {
      issues.push('Backstory too short or missing');
    }
    
    // Context indicators
    const contextIndicators = [
      'culture', 'faction', 'location', 'world', 'biome', 'region',
      'archetype', 'conflict', 'hook', 'inspiration', 'source'
    ];
    
    const hasContext = backstory && contextIndicators.some(indicator => 
      backstory.toLowerCase().includes(indicator)
    );
    
    if (hasContext) {
      contextUsedCount++;
      console.log(`   ✅ Context indicators found in backstory`);
    } else {
      console.log(`   ⚠️  No context indicators found`);
    }
    
    // Check if prompt was followed
    if (matchingRequest?.tags && matchingRequest.tags.length > 0) {
      const tagText = matchingRequest.tags.join(' ').toLowerCase();
      const allText = `${bio} ${backstory} ${summary?.oneLiner || ''}`.toLowerCase();
      
      const relevantWords = tagText.split(' ').filter((w: string) => w.length > 3);
      const matches = relevantWords.filter((word: string) => allText.includes(word));
      
      if (matches.length === 0) {
        issues.push('Prompt tags not reflected in NPC');
      } else {
        console.log(`   ✅ Prompt tags reflected: ${matches.slice(0, 3).join(', ')}`);
      }
    }
    
    if (issues.length > 0) {
      qualityIssues.push(...issues);
      console.log(`   ⚠️  Quality Issues: ${issues.join(', ')}`);
    } else {
      console.log(`   ✅ Quality checks passed`);
    }
    
    // Show sample content
    if (bio) {
      console.log(`   Bio: "${bio.substring(0, 100)}${bio.length > 100 ? '...' : ''}"`);
    }
    if (summary?.oneLiner) {
      console.log(`   One-liner: "${summary.oneLiner.substring(0, 100)}${summary.oneLiner.length > 100 ? '...' : ''}"`);
    }
  }

  // Summary
  console.log('\n─────────────────────────────────────────────────────────────');
  console.log('\n📊 Assessment Summary:\n');
  console.log(`Total NPCs analyzed: ${npcs.length}`);
  console.log(`Context indicators found: ${contextUsedCount}/${npcs.length}`);
  console.log(`Quality issues: ${qualityIssues.length} total`);
  
  const uniqueIssues = [...new Set(qualityIssues)];
  console.log(`\nUnique issue types:`);
  uniqueIssues.forEach(issue => {
    const count = qualityIssues.filter(i => i === issue).length;
    console.log(`  - ${issue}: ${count} occurrences`);
  });
  
  // Check if AI is likely enabled
  console.log(`\n🔍 Context System Status:`);
  if (contextUsedCount === 0) {
    console.log(`  ⚠️  No context indicators found - context system may not be engaged`);
    console.log(`  💡 Check if WORKERS_AI_ENABLE is set to "true" in Cloudflare Pages`);
  } else {
    console.log(`  ✅ Context indicators found in ${contextUsedCount} NPCs`);
  }
}

assessNPCs().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

