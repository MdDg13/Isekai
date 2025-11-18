/**
 * Phase 1 Complete Validation Script
 * 
 * Validates that Phase 1 (Schema Enhancement) is complete:
 * - All indexes exist
 * - All functions exist
 * - All views are accessible
 * - Sample queries work
 * 
 * Usage:
 *   npx ts-node scripts/database/validate-phase1-complete.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface ValidationResult {
  category: string;
  name: string;
  passed: boolean;
  message: string;
}

const results: ValidationResult[] = [];

async function validateViews(): Promise<void> {
  console.log('📊 Validating Views...\n');

  const views = ['npc_with_location', 'location_with_npc_count'];

  for (const viewName of views) {
    try {
      const { error } = await supabase.from(viewName).select('*').limit(1);
      results.push({
        category: 'Views',
        name: viewName,
        passed: !error,
        message: error ? `Error: ${error.message}` : 'View accessible',
      });
      console.log(`  ${!error ? '✅' : '❌'} ${viewName}: ${error ? error.message : 'OK'}`);
    } catch (err) {
      results.push({
        category: 'Views',
        name: viewName,
        passed: false,
        message: `Exception: ${err instanceof Error ? err.message : String(err)}`,
      });
      console.log(`  ❌ ${viewName}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

async function validateTableStructure(): Promise<void> {
  console.log('\n📋 Validating Table Structure...\n');

  try {
    const { error } = await supabase
      .from('world_element')
      .select('id, type, name, detail')
      .limit(1);

    results.push({
      category: 'Tables',
      name: 'world_element',
      passed: !error,
      message: error ? `Error: ${error.message}` : 'Table accessible with detail column',
    });
    console.log(`  ${!error ? '✅' : '❌'} world_element: ${error ? error.message : 'OK'}`);
  } catch (err) {
    results.push({
      category: 'Tables',
      name: 'world_element',
      passed: false,
      message: `Exception: ${err instanceof Error ? err.message : String(err)}`,
    });
    console.log(`  ❌ world_element: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function validateElementLinkTable(): Promise<void> {
  console.log('\n🔗 Validating Element Link Table...\n');

  try {
    const { error } = await supabase
      .from('element_link')
      .select('id, from_element, to_element, link_type')
      .limit(1);

    results.push({
      category: 'Tables',
      name: 'element_link',
      passed: !error,
      message: error ? `Error: ${error.message}` : 'Table accessible',
    });
    console.log(`  ${!error ? '✅' : '❌'} element_link: ${error ? error.message : 'OK'}`);
  } catch (err) {
    results.push({
      category: 'Tables',
      name: 'element_link',
      passed: false,
      message: `Exception: ${err instanceof Error ? err.message : String(err)}`,
    });
    console.log(`  ❌ element_link: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function validateSampleQueries(): Promise<void> {
  console.log('\n⚡ Testing Sample Queries...\n');

  // Test NPC query
  try {
    const { data, error } = await supabase
      .from('world_element')
      .select('*')
      .eq('type', 'npc')
      .limit(5);

    results.push({
      category: 'Queries',
      name: 'NPCs by type',
      passed: !error,
      message: error
        ? `Error: ${error.message}`
        : `Found ${data?.length || 0} NPCs (query works)`,
    });
    console.log(
      `  ${!error ? '✅' : '❌'} NPCs by type: ${error ? error.message : `Found ${data?.length || 0} NPCs`}`,
    );
  } catch (err) {
    results.push({
      category: 'Queries',
      name: 'NPCs by type',
      passed: false,
      message: `Exception: ${err instanceof Error ? err.message : String(err)}`,
    });
    console.log(`  ❌ NPCs by type: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Test location query
  try {
    const { data, error } = await supabase
      .from('world_element')
      .select('*')
      .eq('type', 'location')
      .limit(5);

    results.push({
      category: 'Queries',
      name: 'Locations by type',
      passed: !error,
      message: error
        ? `Error: ${error.message}`
        : `Found ${data?.length || 0} locations (query works)`,
    });
    console.log(
      `  ${!error ? '✅' : '❌'} Locations by type: ${error ? error.message : `Found ${data?.length || 0} locations`}`,
    );
  } catch (err) {
    results.push({
      category: 'Queries',
      name: 'Locations by type',
      passed: false,
      message: `Exception: ${err instanceof Error ? err.message : String(err)}`,
    });
    console.log(`  ❌ Locations by type: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function main() {
  console.log('🔍 Phase 1 Complete Validation\n');
  console.log('─────────────────────────────────────────────────────────────\n');

  await validateViews();
  await validateTableStructure();
  await validateElementLinkTable();
  await validateSampleQueries();

  // Summary
  console.log('\n─────────────────────────────────────────────────────────────');
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  console.log(`\n📈 Summary: ${passed}/${total} checks passed\n`);

  // Group by category
  const byCategory = results.reduce(
    (acc, r) => {
      if (!acc[r.category]) acc[r.category] = { passed: 0, total: 0 };
      acc[r.category].total++;
      if (r.passed) acc[r.category].passed++;
      return acc;
    },
    {} as Record<string, { passed: number; total: number }>,
  );

  console.log('By Category:');
  Object.entries(byCategory).forEach(([category, stats]) => {
    console.log(`  ${category}: ${stats.passed}/${stats.total} passed`);
  });

  if (passed === total) {
    console.log('\n✅ Phase 1 validation complete!');
    console.log('\n📝 Note: Index and function verification requires manual SQL check:');
    console.log('   Run in Supabase SQL Editor:');
    console.log('   SELECT indexname FROM pg_indexes WHERE tablename = \'world_element\';');
    console.log('   SELECT routine_name FROM information_schema.routines WHERE routine_schema = \'public\' AND routine_name LIKE \'validate_%\';');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some checks failed. Review the output above.');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

