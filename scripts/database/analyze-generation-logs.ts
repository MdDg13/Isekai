/**
 * Analyze Generation Logs
 * 
 * Analyzes generation logs to understand the NPC generation process
 * and identify where AI assistance is failing.
 * 
 * Usage:
 *   npx tsx scripts/database/analyze-generation-logs.ts [npc_id]
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeLogs(npcId?: string) {
  console.log('📊 Generation Log Analysis\n');
  console.log('─────────────────────────────────────────────────────────────\n');

  // Get generation logs
  let query = supabase
    .from('generation_log')
    .select('*, generation_request!inner(prompt, kind)')
    .order('timestamp', { ascending: false })
    .limit(100);

  if (npcId) {
    // Find generation request for this NPC
    const { data: npc } = await supabase
      .from('world_npc')
      .select('id, created_at')
      .eq('id', npcId)
      .single();

    if (npc) {
      // Find generation request around the same time
      const { data: requests } = await supabase
        .from('generation_request')
        .select('id')
        .eq('kind', 'world_npc')
        .gte('created_at', new Date(new Date(npc.created_at).getTime() - 60000).toISOString())
        .lte('created_at', new Date(new Date(npc.created_at).getTime() + 60000).toISOString())
        .limit(1);

      if (requests && requests.length > 0) {
        query = query.eq('generation_request_id', requests[0].id);
      }
    }
  }

  const { data: logs, error } = await query;

  if (error) {
    console.error(`❌ Error: ${error.message}`);
    return;
  }

  if (!logs || logs.length === 0) {
    console.log('❌ No generation logs found');
    console.log('💡 Make sure the generation_log table exists and has been populated');
    return;
  }

  // Group logs by generation request
  const logsByRequest = new Map<string, typeof logs>();
  logs.forEach(log => {
    const reqId = log.generation_request_id as string;
    if (!logsByRequest.has(reqId)) {
      logsByRequest.set(reqId, []);
    }
    logsByRequest.get(reqId)!.push(log);
  });

  console.log(`Found ${logsByRequest.size} generation requests with logs\n`);

  // Analyze each generation
  for (const [reqId, requestLogs] of logsByRequest.entries()) {
    const sortedLogs = requestLogs.sort((a, b) => 
      new Date(a.timestamp as string).getTime() - new Date(b.timestamp as string).getTime()
    );

    const firstLog = sortedLogs[0];
    const request = firstLog.generation_request as { prompt?: Record<string, unknown>; kind?: string };
    const prompt = request?.prompt as Record<string, unknown> | undefined;

    console.log(`\n📋 Generation Request: ${reqId.substring(0, 8)}...`);
    if (prompt?.tags) {
      console.log(`   Tags: ${Array.isArray(prompt.tags) ? prompt.tags.join(', ') : prompt.tags}`);
    }
    if (prompt?.nameHint) {
      console.log(`   Name Hint: ${prompt.nameHint}`);
    }
    console.log(`   Logs: ${sortedLogs.length} entries\n`);

    // Group by step
    const logsByStep = new Map<string, typeof sortedLogs>();
    sortedLogs.forEach(log => {
      const step = log.step as string;
      if (!logsByStep.has(step)) {
        logsByStep.set(step, []);
      }
      logsByStep.get(step)!.push(log);
    });

    // Analyze each step
    const steps = ['procedural', 'context_fetch', 'ai_enhance', 'critique', 'style_fix', 'grammar_fix', 'programmatic_fix', 'final'];
    
    for (const step of steps) {
      const stepLogs = logsByStep.get(step) || [];
      if (stepLogs.length === 0) continue;

      console.log(`   ${step.toUpperCase()}:`);
      
      const errors = stepLogs.filter(l => l.log_type === 'error');
      const warnings = stepLogs.filter(l => l.log_type === 'warning');
      const infos = stepLogs.filter(l => l.log_type === 'info');

      if (errors.length > 0) {
        console.log(`      ❌ Errors: ${errors.length}`);
        errors.forEach(err => {
          console.log(`         - ${err.message}`);
          if (err.data) {
            const data = err.data as Record<string, unknown>;
            if (data.error) console.log(`           Error: ${data.error}`);
          }
        });
      }

      if (warnings.length > 0) {
        console.log(`      ⚠️  Warnings: ${warnings.length}`);
        warnings.forEach(warn => {
          console.log(`         - ${warn.message}`);
        });
      }

      // Show key info logs
      const keyInfos = infos.filter(l => {
        const msg = l.message.toLowerCase();
        return msg.includes('complete') || msg.includes('fetched') || msg.includes('enabled') || msg.includes('failed');
      });

      if (keyInfos.length > 0) {
        keyInfos.forEach(info => {
          console.log(`      ✅ ${info.message}`);
          if (info.data) {
            const data = info.data as Record<string, unknown>;
            // Show relevant data
            if (step === 'context_fetch') {
              if (data.elementsCount !== undefined) console.log(`         Elements: ${data.elementsCount}`);
              if (data.snippetsCount !== undefined) console.log(`         Snippets: ${data.snippetsCount}`);
              if (data.count !== undefined) console.log(`         Random snippets: ${data.count}`);
            }
            if (step === 'ai_enhance') {
              if (data.hasContext !== undefined) console.log(`         Context used: ${data.hasContext}`);
              if (data.model) console.log(`         Model: ${data.model}`);
              if (data.hasSummary !== undefined) console.log(`         Summary generated: ${data.hasSummary}`);
            }
            if (step === 'critique') {
              if (data.issuesCount !== undefined) console.log(`         Issues found: ${data.issuesCount}`);
            }
          }
          if (info.duration_ms) {
            console.log(`         Duration: ${info.duration_ms}ms`);
          }
        });
      }

      // Calculate total duration for step
      const stepDuration = stepLogs
        .map(l => l.duration_ms as number | null)
        .filter((d): d is number => d !== null)
        .reduce((sum, d) => sum + d, 0);
      
      if (stepDuration > 0) {
        console.log(`      ⏱️  Total duration: ${stepDuration}ms`);
      }
    }

    // Summary
    const totalDuration = sortedLogs
      .map(l => l.duration_ms as number | null)
      .filter((d): d is number => d !== null)
      .reduce((sum, d) => sum + d, 0);

    console.log(`\n   📊 Summary:`);
    console.log(`      Total steps: ${logsByStep.size}`);
    console.log(`      Total duration: ${totalDuration}ms`);
    console.log(`      Errors: ${sortedLogs.filter(l => l.log_type === 'error').length}`);
    console.log(`      Warnings: ${sortedLogs.filter(l => l.log_type === 'warning').length}`);
  }
}

const npcId = process.argv[2];
analyzeLogs(npcId).catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

