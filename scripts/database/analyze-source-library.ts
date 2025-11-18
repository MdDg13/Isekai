/**
 * Analyze Source Library
 * 
 * Generates reports on coverage, diversity, and quality.
 * Useful for the Phase 3 data review.
 * 
 * Usage:
 *   npx tsx scripts/database/analyze-source-library.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyze() {
  console.log('📊 Source Library Analysis\n');
  console.log('─────────────────────────────────────────────────────────────\n');

  const { data, error, count } = await supabase
    .from('source_snippet')
    .select('*');

  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  console.log(`Total Snippets: ${count}\n`);

  // Group by source
  const bySource: Record<string, number> = {};
  data?.forEach(s => {
    bySource[s.source_name] = (bySource[s.source_name] || 0) + 1;
  });

  console.log('By Source:');
  Object.entries(bySource).sort((a, b) => b[1] - a[1]).forEach(([source, count]) => {
    console.log(`  ${source}: ${count}`);
  });

  // Category analysis
  const categories: Record<string, number> = {};
  data?.forEach(s => {
    s.tags?.forEach((tag: string) => {
      if (['npc', 'location', 'conflict', 'item', 'puzzle', 'faction', 'culture', 'tone', 'biome'].includes(tag)) {
        categories[tag] = (categories[tag] || 0) + 1;
      }
    });
  });

  console.log('\nBy Category:');
  Object.entries(categories).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`);
  });

  // Culture coverage
  const cultures = new Set(data?.map(s => s.culture).filter(Boolean));
  console.log(`\nUnique Cultures: ${cultures.size}`);
  Array.from(cultures).forEach(c => console.log(`  - ${c}`));

  // Biome coverage
  const biomes = new Set(data?.map(s => s.biome).filter(Boolean));
  console.log(`\nUnique Biomes: ${biomes.size}`);
  Array.from(biomes).forEach(b => console.log(`  - ${b}`));

  // Tone coverage
  const tones = new Set(data?.map(s => s.tone).filter(Boolean));
  console.log(`\nUnique Tones: ${tones.size}`);
  Array.from(tones).forEach(t => console.log(`  - ${t}`));

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
    const pct = count > 0 ? ((count / (count || 1)) * 100).toFixed(1) : '0.0';
    console.log(`  ${range}: ${count} (${pct}%)`);
  });

  // Completeness check
  const completeness = {
    hasArchetype: 0,
    hasConflictHook: 0,
    hasRpCues: 0,
    hasCulture: 0,
    hasBiome: 0,
    hasTone: 0,
    hasTags: 0,
  };

  data?.forEach(s => {
    if (s.archetype) completeness.hasArchetype++;
    if (s.conflict_hook) completeness.hasConflictHook++;
    if (s.rp_cues && s.rp_cues.length > 0) completeness.hasRpCues++;
    if (s.culture) completeness.hasCulture++;
    if (s.biome) completeness.hasBiome++;
    if (s.tone) completeness.hasTone++;
    if (s.tags && s.tags.length > 0) completeness.hasTags++;
  });

  const total = count || 1;
  console.log('\nCompleteness (% with field):');
  Object.entries(completeness).forEach(([field, count]) => {
    const pct = ((count / total) * 100).toFixed(1);
    console.log(`  ${field}: ${pct}%`);
  });

  // Coverage gaps
  console.log('\nPotential Coverage Gaps:');
  const commonBiomes = ['forest', 'desert', 'mountain', 'coastal', 'urban', 'underground', 'swamp', 'arctic'];
  const missingBiomes = commonBiomes.filter(b => !Array.from(biomes).some(existing => existing?.toLowerCase().includes(b.toLowerCase())));
  if (missingBiomes.length > 0) {
    console.log(`  Missing biomes: ${missingBiomes.join(', ')}`);
  }

  const commonTones = ['heroic', 'dark', 'comedy', 'tragic', 'epic', 'intimate', 'mysterious', 'action'];
  const missingTones = commonTones.filter(t => !Array.from(tones).some(existing => existing?.toLowerCase().includes(t.toLowerCase())));
  if (missingTones.length > 0) {
    console.log(`  Missing tones: ${missingTones.join(', ')}`);
  }

  console.log('\n─────────────────────────────────────────────────────────────');
  console.log('\n✅ Analysis complete');
  console.log('\nNext steps:');
  console.log('  - Review coverage gaps');
  console.log('  - Check quality distribution');
  console.log('  - Plan expansion based on gaps');
  console.log('  - See docs/checkpoints/phase-3-data-review-scheduled.md for review process');
}

analyze().catch(console.error);

