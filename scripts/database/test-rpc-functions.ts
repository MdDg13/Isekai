/**
 * Test RPC Functions
 * 
 * Tests the Supabase RPC functions for context graph.
 * Run after deploying RPC functions to Supabase.
 * 
 * Usage:
 *   npx tsx scripts/database/test-rpc-functions.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testGetContextPack() {
  console.log('Testing get_context_pack...\n');

  const { data, error } = await supabase.rpc('get_context_pack', {
    p_world_id: null,
    p_tags: ['npc'],
    p_limit: 5,
    p_min_quality: 80
  });

  if (error) {
    console.error('❌ Error:', error.message);
    return false;
  }

  console.log(`✅ Success: Got ${Array.isArray(data) ? data.length : 0} snippets`);
  if (Array.isArray(data) && data.length > 0) {
    console.log(`   First snippet: ${data[0].excerpt?.substring(0, 60)}...`);
  }
  return true;
}

async function testGetRandomSnippets() {
  console.log('\nTesting get_random_snippets...\n');

  const { data, error } = await supabase.rpc('get_random_snippets', {
    p_tags: ['location'],
    p_count: 3,
    p_min_quality: 80,
    p_ensure_diversity: true
  });

  if (error) {
    console.error('❌ Error:', error.message);
    return false;
  }

  console.log(`✅ Success: Got ${Array.isArray(data) ? data.length : 0} snippets`);
  if (Array.isArray(data) && data.length > 0) {
    const archetypes = data.map(s => s.archetype).filter(Boolean);
    console.log(`   Archetypes: ${archetypes.join(', ')}`);
  }
  return true;
}

async function testGetWorldContext() {
  console.log('\nTesting get_world_context...\n');

  // First, get a world ID
  const { data: worlds } = await supabase
    .from('world')
    .select('id')
    .limit(1);

  if (!worlds || worlds.length === 0) {
    console.log('⚠️  No worlds found, skipping world context test');
    return true;
  }

  const worldId = worlds[0].id;

  const { data, error } = await supabase.rpc('get_world_context', {
    p_world_id: worldId,
    p_include_snippets: true,
    p_snippet_count: 5
  });

  if (error) {
    console.error('❌ Error:', error.message);
    return false;
  }

  console.log('✅ Success: Got world context');
  if (data) {
    const elements = data.elements || [];
    const snippets = data.snippets || [];
    const summary = data.summary || {};
    console.log(`   Elements: ${elements.length}`);
    console.log(`   Snippets: ${snippets.length}`);
    console.log(`   Summary: ${JSON.stringify(summary)}`);
  }
  return true;
}

async function main() {
  console.log('🧪 Testing RPC Functions\n');
  console.log('─────────────────────────────────────────────────────────────\n');

  const results = {
    contextPack: false,
    randomSnippets: false,
    worldContext: false
  };

  results.contextPack = await testGetContextPack();
  results.randomSnippets = await testGetRandomSnippets();
  results.worldContext = await testGetWorldContext();

  console.log('\n─────────────────────────────────────────────────────────────');
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  console.log(`\n📊 Results: ${passed}/${total} tests passed\n`);

  if (passed === total) {
    console.log('✅ All RPC functions working!');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Make sure RPC functions are deployed to Supabase.');
    console.log('   Run SQL files in docs/db/rpc/ in Supabase SQL Editor.');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

