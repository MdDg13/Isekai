import { createClient } from '@supabase/supabase-js';

interface CreateCustomReferenceBody {
  type: 'item' | 'spell' | 'monster' | 'class' | 'race' | 'background' | 'feat' | 'trait';
  data: Record<string, unknown>;
}

export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context;
  
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
  
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Missing Supabase env' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  // Get user from auth header (simplified - implement proper auth)
  const authHeader = request.headers.get('Authorization');
  let userId: string | undefined;
  
  if (authHeader?.startsWith('Bearer ')) {
    // In production, decode JWT to get user ID
    // For now, placeholder
    userId = undefined;
  }

  let body: CreateCustomReferenceBody;
  try {
    body = (await request.json()) as CreateCustomReferenceBody;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (!body.type || !body.data) {
    return new Response(JSON.stringify({ error: 'Missing type or data' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  // Map type to table name
  const tableMap: Record<string, string> = {
    item: 'reference_item',
    spell: 'reference_spell',
    monster: 'reference_monster',
    class: 'reference_class',
    race: 'reference_race',
    background: 'reference_background',
    feat: 'reference_feat',
    trait: 'reference_trait',
  };

  const tableName = tableMap[body.type];
  if (!tableName) {
    return new Response(JSON.stringify({ error: `Invalid type: ${body.type}` }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  // Prepare data for insertion
  const insertData = {
    ...body.data,
    source: 'custom',
    created_by: userId || null,
  };

  // Basic validation based on type
  if (body.type === 'item') {
    if (!insertData.name || !insertData.kind || !insertData.description) {
      return new Response(JSON.stringify({ error: 'Item requires name, kind, and description' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }
  } else if (body.type === 'spell') {
    if (!insertData.name || insertData.level === undefined || !insertData.school) {
      return new Response(JSON.stringify({ error: 'Spell requires name, level, and school' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (insertData.level < 0 || insertData.level > 9) {
      return new Response(JSON.stringify({ error: 'Spell level must be 0-9' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }
  } else if (body.type === 'monster') {
    if (!insertData.name || !insertData.size || !insertData.type || insertData.challenge_rating === undefined) {
      return new Response(JSON.stringify({ error: 'Monster requires name, size, type, and challenge_rating' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }
  }

  // Insert into appropriate table
  const { data, error } = await supabase
    .from(tableName)
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true, data }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};

