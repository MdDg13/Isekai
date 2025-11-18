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
 *   "license": "OGL 1.0a",
 *   "snippets": [
 *     {
 *       "type": "npc_archetype" | "conflict" | "location" | "item" | "puzzle" | "hook",
 *       "content": "Brief description or template",
 *       "culture_tags": ["european", "medieval"],
 *       "archetype_tags": ["hero", "mentor"],
 *       "conflict_tags": ["resource-scarcity"],
 *       "tone_tags": ["heroic"],
 *       "mechanical_tags": ["combat-focused"],
 *       "quality_score": 85,
 *       "metadata": { "class": "bard", "race": "halfling" }
 *     }
 *   ]
 * }
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

interface SourceSnippet {
  type: 'npc_archetype' | 'conflict' | 'location' | 'item' | 'puzzle' | 'hook';
  content: string;
  culture_tags?: string[];
  archetype_tags?: string[];
  conflict_tags?: string[];
  tone_tags?: string[];
  mechanical_tags?: string[];
  quality_score?: number;
  metadata?: Record<string, unknown>;
}

interface SourceFile {
  source_name: string;
  license: string;
  source_url?: string;
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
      if (!snippet.type || !snippet.content) {
        console.warn(`⚠️  Skipping snippet: missing type or content`);
        results.skipped++;
        continue;
      }

      // Prepare insert data
      const insertData = {
        source_name: sourceData.source_name,
        license: sourceData.license,
        source_url: sourceData.source_url || null,
        type: snippet.type,
        content: snippet.content,
        culture_tags: snippet.culture_tags || [],
        archetype_tags: snippet.archetype_tags || [],
        conflict_tags: snippet.conflict_tags || [],
        tone_tags: snippet.tone_tags || [],
        mechanical_tags: snippet.mechanical_tags || [],
        quality_score: snippet.quality_score ?? 50,
        metadata: snippet.metadata || {},
        extracted_at: new Date().toISOString(),
      };

      if (dryRun) {
        console.log(`[DRY RUN] Would insert: ${snippet.type} - ${snippet.content.substring(0, 50)}...`);
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

