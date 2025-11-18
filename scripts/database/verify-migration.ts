/**
 * Verify Schema Enhancement Migration
 * 
 * Checks if migration was successfully applied by verifying:
 * - Views exist and are accessible
 * - world_element table structure
 * - Query performance
 * 
 * Usage:
 *   npx ts-node scripts/database/verify-migration.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface VerificationResult {
  name: string;
  passed: boolean;
  message: string;
  duration?: number;
}

async function verifyViews(): Promise<VerificationResult[]> {
  const results: VerificationResult[] = [];
  const views = ['npc_with_location', 'location_with_npc_count'];

  for (const viewName of views) {
    const start = Date.now();
    try {
      const { data, error } = await supabase.from(viewName).select('*').limit(1);
      const duration = Date.now() - start;
      results.push({
        name: `View: ${viewName}`,
        passed: !error,
        message: error ? `Error: ${error.message}` : 'View exists and is accessible',
        duration,
      });
    } catch (err) {
      results.push({
        name: `View: ${viewName}`,
        passed: false,
        message: `Exception: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  return results;
}

async function verifyTableStructure(): Promise<VerificationResult[]> {
  const results: VerificationResult[] = [];

  // Check world_element table exists
  const start = Date.now();
  const { data, error } = await supabase
    .from('world_element')
    .select('id, type, name, detail')
    .limit(1);
  const duration = Date.now() - start;

  results.push({
    name: 'Table: world_element',
    passed: !error,
    message: error
      ? `Error: ${error.message}`
      : `Table exists (${data?.length || 0} sample rows)`,
    duration,
  });

  return results;
}

async function verifyQueryPerformance(): Promise<VerificationResult[]> {
  const results: VerificationResult[] = [];

  // Test NPC query
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
    message: npcError
      ? `Error: ${npcError.message}`
      : `Found ${npcData?.length || 0} NPCs in ${duration1}ms`,
    duration: duration1,
  });

  // Test location query
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
    message: locError
      ? `Error: ${locError.message}`
      : `Found ${locData?.length || 0} locations in ${duration2}ms`,
    duration: duration2,
  });

  return results;
}

async function main() {
  console.log('🔍 Verifying Schema Enhancement Migration\n');
  console.log('─────────────────────────────────────────────────────────────\n');

  const allResults: VerificationResult[] = [];

  // Verify views
  console.log('📊 Checking views...');
  const viewResults = await verifyViews();
  allResults.push(...viewResults);
  viewResults.forEach((r) => {
    console.log(`  ${r.passed ? '✅' : '❌'} ${r.name}: ${r.message}${r.duration ? ` (${r.duration}ms)` : ''}`);
  });

  // Verify table structure
  console.log('\n📋 Checking table structure...');
  const tableResults = await verifyTableStructure();
  allResults.push(...tableResults);
  tableResults.forEach((r) => {
    console.log(`  ${r.passed ? '✅' : '❌'} ${r.name}: ${r.message}${r.duration ? ` (${r.duration}ms)` : ''}`);
  });

  // Verify query performance
  console.log('\n⚡ Testing query performance...');
  const perfResults = await verifyQueryPerformance();
  allResults.push(...perfResults);
  perfResults.forEach((r) => {
    console.log(`  ${r.passed ? '✅' : '❌'} ${r.name}: ${r.message}`);
  });

  // Summary
  console.log('\n─────────────────────────────────────────────────────────────');
  const passed = allResults.filter((r) => r.passed).length;
  const total = allResults.length;
  console.log(`\n📈 Summary: ${passed}/${total} checks passed\n`);

  if (passed === total) {
    console.log('✅ Migration verification complete!');
    console.log('\n📝 Note: Index verification requires manual SQL check:');
    console.log('   Run in Supabase SQL Editor:');
    console.log('   SELECT indexname FROM pg_indexes WHERE tablename = \'world_element\';');
    process.exit(0);
  } else {
    console.log('⚠️  Some checks failed.');
    console.log('\n📝 To run the migration:');
    console.log('   1. Open Supabase Dashboard → SQL Editor');
    console.log('   2. Copy contents of docs/db/migrations/2025-11-schema-enhancement.sql');
    console.log('   3. Paste and execute');
    console.log('   4. Run this script again to verify');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

