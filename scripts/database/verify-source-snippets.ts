/**
 * Verify Source Snippets in Database
 * 
 * Checks that source snippets were imported correctly.
 * 
 * Usage:
 *   npx tsx scripts/database/verify-source-snippets.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔍 Verifying Source Snippets\n');

  const { data, error } = await supabase
    .from('source_snippet')
    .select('id, source_name, excerpt, quality_score, tags, archetype')
    .order('quality_score', { ascending: false })
    .limit(20);

  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  console.log(`✅ Found ${data?.length || 0} source snippets\n`);

  if (data && data.length > 0) {
    console.log('Sample snippets:');
    data.forEach((snippet, i) => {
      console.log(`\n${i + 1}. [${snippet.source_name}] Quality: ${snippet.quality_score}`);
      console.log(`   Archetype: ${snippet.archetype || 'N/A'}`);
      console.log(`   Tags: ${snippet.tags?.join(', ') || 'none'}`);
      console.log(`   ${snippet.excerpt.substring(0, 100)}...`);
    });

    // Group by source
    const bySource = data.reduce((acc, s) => {
      acc[s.source_name] = (acc[s.source_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n\nBy source:');
    Object.entries(bySource).forEach(([source, count]) => {
      console.log(`  ${source}: ${count} snippets`);
    });
  }

  process.exit(0);
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

