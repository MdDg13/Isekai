/**
 * Count All Source Snippets
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
  const { data, error, count } = await supabase
    .from('source_snippet')
    .select('source_name, tags, biome, tone, quality_score', { count: 'exact' });

  if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }

  console.log(`\n📊 Total Source Snippets: ${count}\n`);

  // Group by source
  const bySource = data?.reduce((acc, s) => {
    acc[s.source_name] = (acc[s.source_name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  console.log('By Source:');
  Object.entries(bySource).sort((a, b) => b[1] - a[1]).forEach(([source, count]) => {
    console.log(`  ${source}: ${count}`);
  });

  // Group by tags
  const tagCounts: Record<string, number> = {};
  data?.forEach(s => {
    s.tags?.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  console.log('\nTop Tags:');
  Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([tag, count]) => {
    console.log(`  ${tag}: ${count}`);
  });

  // Quality distribution
  const qualityRanges = {
    '90-100': 0,
    '80-89': 0,
    '70-79': 0,
    '50-69': 0,
    '0-49': 0
  };

  data?.forEach(s => {
    const score = s.quality_score || 0;
    if (score >= 90) qualityRanges['90-100']++;
    else if (score >= 80) qualityRanges['80-89']++;
    else if (score >= 70) qualityRanges['70-79']++;
    else if (score >= 50) qualityRanges['50-69']++;
    else qualityRanges['0-49']++;
  });

  console.log('\nQuality Distribution:');
  Object.entries(qualityRanges).forEach(([range, count]) => {
    console.log(`  ${range}: ${count}`);
  });

  process.exit(0);
}

main().catch(console.error);

