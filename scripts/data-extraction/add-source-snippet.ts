/**
 * Interactive Tool for Adding Source Snippets
 * 
 * Makes it easy to add new snippets to the library one at a time.
 * 
 * Usage:
 *   npx tsx scripts/data-extraction/add-source-snippet.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function addSnippet() {
  console.log('\n📝 Add New Source Snippet\n');
  console.log('Press Ctrl+C to cancel at any time\n');

  try {
    // Required fields
    const sourceName = await question('Source name: ');
    if (!sourceName.trim()) {
      console.log('❌ Source name is required');
      process.exit(1);
    }

    const sourceLink = await question('Source link (optional): ');
    
    console.log('\nLicense options:');
    console.log('1. public_domain  2. cc0  3. cc_by  4. cc_by_sa');
    console.log('5. open_game_license  6. orc  7. commercial_with_credit  8. synthetic');
    const licenseChoice = await question('License (1-8): ');
    const licenseOptions = [
      'public_domain',
      'cc0',
      'cc_by',
      'cc_by_sa',
      'open_game_license',
      'orc',
      'commercial_with_credit',
      'synthetic'
    ] as const;
    type LicenseOption = (typeof licenseOptions)[number];
    const licenseIndex = Number.parseInt(licenseChoice, 10) - 1;
    const license: LicenseOption = licenseOptions[licenseIndex] ?? 'synthetic';

    const excerpt = await question('\nExcerpt (description): ');
    if (!excerpt.trim()) {
      console.log('❌ Excerpt is required');
      process.exit(1);
    }

    // Optional fields
    const tagsInput = await question('Tags (comma-separated): ');
    const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t);

    const archetype = await question('Archetype (optional): ');
    const conflictHook = await question('Conflict hook (optional): ');
    
    const rpCuesInput = await question('Roleplay cues (comma-separated, optional): ');
    const rpCues = rpCuesInput.split(',').map(c => c.trim()).filter(c => c);

    const culture = await question('Culture (optional): ');
    const biome = await question('Biome (optional): ');
    const tone = await question('Tone (optional): ');

    const qualityScoreInput = await question('Quality score (0-100, default 80): ');
    const qualityScore = qualityScoreInput ? parseInt(qualityScoreInput) : 80;

    // Insert
    const insertData = {
      source_name: sourceName.trim(),
      source_link: sourceLink.trim() || null,
      license,
      excerpt: excerpt.trim(),
      tags: tags,
      archetype: archetype.trim() || null,
      conflict_hook: conflictHook.trim() || null,
      rp_cues: rpCues,
      culture: culture.trim() || null,
      biome: biome.trim() || null,
      tone: tone.trim() || null,
      mechanics: {},
      quality_score: qualityScore,
    };

    console.log('\n📋 Review:');
    console.log(JSON.stringify(insertData, null, 2));
    
    const confirm = await question('\nInsert this snippet? (y/n): ');
    if (confirm.toLowerCase() !== 'y') {
      console.log('Cancelled');
      process.exit(0);
    }

    const { data, error } = await supabase
      .from('source_snippet')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }

    console.log('\n✅ Snippet added successfully!');
    console.log(`ID: ${data.id}`);
    
    // Ask if they want to add another
    const another = await question('\nAdd another snippet? (y/n): ');
    if (another.toLowerCase() === 'y') {
      await addSnippet();
    }
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

addSnippet().catch(console.error);

