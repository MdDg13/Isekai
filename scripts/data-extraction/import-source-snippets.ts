/**
 * Source Snippet Ingestion Script
 * 
 * Imports structured source data (folklore, literature, SRD, etc.) into the
 * `source_snippet` table for use in world content generation.
 * 
 * Usage:
 *   npx ts-node scripts/data-extraction/import-source-snippets.ts <source-file> [--dry-run]
 * 
 * Source file format (JSON):
 * {
 *   "source_name": "D&D 5e SRD",
 *   "source_link": "https://dnd.wizards.com/resources/systems-reference-document",
 *   "license": "open_game_license",
 *   "snippets": [
 *     {
 *       "excerpt": "Brief description or template",
 *       "tags": ["npc", "wizard", "mentor"],
 *       "archetype": "wise mentor",
 *       "conflict_hook": "Searching for lost artifact",
 *       "rp_cues": ["speaks in metaphors", "taps staff for emphasis"],
 *       "culture": "european",
 *       "biome": "urban",
 *       "tone": "heroic",
 *       "mechanics": { "class": "wizard", "level": 5 },
 *       "quality_score": 85
 *     }
 *   ]
 * }
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

interface SourceSnippet {
  excerpt: string;
  tags?: string[];
  archetype?: string;
  conflict_hook?: string;
  rp_cues?: string[];
  culture?: string;
  biome?: string;
  tone?: string;
  mechanics?: Record<string, unknown>;
  quality_score?: number;
}

interface SourceFile {
  source_name: string;
  source_link?: string;
  license: 'public_domain' | 'cc0' | 'cc_by' | 'cc_by_sa' | 'open_game_license' | 'orc' | 'commercial_with_credit' | 'synthetic';
  snippets: SourceSnippet[];
}

async function importSourceSnippets(
  sourceFile: string,
  dryRun: boolean = false
): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set'
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Read and parse source file
  const filePath = path.resolve(sourceFile);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Source file not found: ${filePath}`);
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const sourceData: SourceFile = JSON.parse(fileContent);

  console.log(`\n📚 Importing from: ${sourceData.source_name}`);
  console.log(`   License: ${sourceData.license}`);
  console.log(`   Snippets: ${sourceData.snippets.length}`);
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);

  const results = {
    inserted: 0,
    skipped: 0,
    errors: 0,
  };

  for (const snippet of sourceData.snippets) {
    try {
      // Validate required fields
      if (!snippet.excerpt) {
        console.warn(`⚠️  Skipping snippet: missing excerpt`);
        results.skipped++;
        continue;
      }

      // Prepare insert data matching source_snippet schema
      const insertData = {
        source_name: sourceData.source_name,
        source_link: sourceData.source_link || null,
        license: sourceData.license,
        excerpt: snippet.excerpt,
        tags: snippet.tags || [],
        archetype: snippet.archetype || null,
        conflict_hook: snippet.conflict_hook || null,
        rp_cues: snippet.rp_cues || [],
        culture: snippet.culture || null,
        biome: snippet.biome || null,
        tone: snippet.tone || null,
        mechanics: snippet.mechanics || {},
        quality_score: snippet.quality_score ?? 0,
      };

      if (dryRun) {
        console.log(`[DRY RUN] Would insert: ${snippet.excerpt.substring(0, 50)}...`);
        results.inserted++;
      } else {
        const { error } = await supabase
          .from('source_snippet')
          .insert(insertData);

        if (error) {
          console.error(`❌ Error inserting snippet: ${error.message}`);
          results.errors++;
        } else {
          results.inserted++;
          if (results.inserted % 10 === 0) {
            process.stdout.write(`\r   Inserted: ${results.inserted}/${sourceData.snippets.length}`);
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error processing snippet: ${error instanceof Error ? error.message : String(error)}`);
      results.errors++;
    }
  }

  console.log(`\n\n✅ Import complete:`);
  console.log(`   Inserted: ${results.inserted}`);
  console.log(`   Skipped: ${results.skipped}`);
  console.log(`   Errors: ${results.errors}`);
}

// CLI
const args = process.argv.slice(2);
const sourceFile = args[0];
const dryRun = args.includes('--dry-run');

if (!sourceFile) {
  console.error('Usage: npx ts-node import-source-snippets.ts <source-file> [--dry-run]');
  process.exit(1);
}

importSourceSnippets(sourceFile, dryRun)
  .then(() => {
    console.log('\n✨ Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

