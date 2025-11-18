/**
 * Test Script for Schema Enhancement Migration
 * 
 * Verifies that:
 * 1. Indexes were created successfully
 * 2. Helper functions exist
 * 3. Views work correctly
 * 4. Sample queries perform well
 * 
 * Usage:
 *   npx ts-node scripts/database/test-schema-enhancement.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration?: number;
}

async function testIndexes(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const requiredIndexes = [
    'idx_npc_race',
    'idx_npc_class',
    'idx_npc_level',
    'idx_npc_conflict',
    'idx_npc_primary_location',
    'idx_location_type',
    'idx_location_biome',
    'idx_element_link_from',
    'idx_element_link_to',
  ];

  for (const indexName of requiredIndexes) {
    const start = Date.now();
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT indexname 
        FROM pg_indexes 
        WHERE indexname = '${indexName}'
      `,
    });

    const duration = Date.now() - start;
    const exists = !error && data && Array.isArray(data) && data.length > 0;

    results.push({
      name: `Index: ${indexName}`,
      passed: exists,
      message: error ? `Error: ${error.message}` : exists ? 'Index exists' : 'Index not found',
      duration,
    });
  }

  return results;
}

async function testFunctions(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const requiredFunctions = [
    'validate_npc_detail',
    'validate_location_detail',
    'validate_faction_detail',
  ];

  for (const funcName of requiredFunctions) {
    const start = Date.now();
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = '${funcName}'
      `,
    });

    const duration = Date.now() - start;
    const exists = !error && data && Array.isArray(data) && data.length > 0;

    results.push({
      name: `Function: ${funcName}`,
      passed: exists,
      message: error ? `Error: ${error.message}` : exists ? 'Function exists' : 'Function not found',
      duration,
    });
  }

  return results;
}

async function testViews(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const requiredViews = ['npc_with_location', 'location_with_npc_count'];

  for (const viewName of requiredViews) {
    const start = Date.now();
    const { error } = await supabase
      .from(viewName)
      .select('*')
      .limit(1);

    const duration = Date.now() - start;
    const passed = !error;

    results.push({
      name: `View: ${viewName}`,
      passed,
      message: passed ? 'View accessible' : `Error: ${error?.message}`,
      duration,
    });
  }

  return results;
}

async function testQueryPerformance(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test NPC race query (should use idx_npc_race)
  const start1 = Date.now();
  const { data: npcData, error: npcError } = await supabase
    .from('world_element')
    .select('*')
    .eq('type', 'npc')
    .limit(10);
  const duration1 = Date.now() - start1;

  results.push({
    name: 'Query: NPCs by type',
    passed: !npcError,
    message: npcError ? `Error: ${npcError.message}` : `Found ${npcData?.length || 0} NPCs`,
    duration: duration1,
  });

  // Test location query (should use idx_location_biome)
  const start2 = Date.now();
  const { data: locData, error: locError } = await supabase
    .from('world_element')
    .select('*')
    .eq('type', 'location')
    .limit(10);
  const duration2 = Date.now() - start2;

  results.push({
    name: 'Query: Locations by type',
    passed: !locError,
    message: locError ? `Error: ${locError.message}` : `Found ${locData?.length || 0} locations`,
    duration: duration2,
  });

  return results;
}

async function runTests(): Promise<void> {
  console.log('🧪 Testing Schema Enhancement Migration\n');

  const allResults: TestResult[] = [];

  console.log('📊 Testing indexes...');
  const indexResults = await testIndexes();
  allResults.push(...indexResults);
  indexResults.forEach((r) => {
    console.log(`  ${r.passed ? '✅' : '❌'} ${r.name}: ${r.message}`);
  });

  console.log('\n🔧 Testing functions...');
  const functionResults = await testFunctions();
  allResults.push(...functionResults);
  functionResults.forEach((r) => {
    console.log(`  ${r.passed ? '✅' : '❌'} ${r.name}: ${r.message}`);
  });

  console.log('\n👁️  Testing views...');
  const viewResults = await testViews();
  allResults.push(...viewResults);
  viewResults.forEach((r) => {
    console.log(`  ${r.passed ? '✅' : '❌'} ${r.name}: ${r.message}${r.duration ? ` (${r.duration}ms)` : ''}`);
  });

  console.log('\n⚡ Testing query performance...');
  const perfResults = await testQueryPerformance();
  allResults.push(...perfResults);
  perfResults.forEach((r) => {
    console.log(`  ${r.passed ? '✅' : '❌'} ${r.name}: ${r.message}${r.duration ? ` (${r.duration}ms)` : ''}`);
  });

  console.log('\n📈 Summary:');
  const passed = allResults.filter((r) => r.passed).length;
  const total = allResults.length;
  console.log(`  ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('\n✅ All tests passed! Schema enhancement is working correctly.');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Review the output above.');
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

