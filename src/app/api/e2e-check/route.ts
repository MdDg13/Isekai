import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const bypassHeader = request.headers.get('x-bypass-token') || '';
  const bypassQuery = url.searchParams.get('token') || '';
  const bypassToken = bypassHeader || bypassQuery;

  const expectedToken = process.env.E2E_BYPASS_TOKEN || '';
  if (!expectedToken) {
    return NextResponse.json({ ok: false, error: 'Missing E2E_BYPASS_TOKEN on server' }, { status: 500 });
  }
  if (bypassToken !== expectedToken) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ ok: false, error: 'Missing Supabase envs on server' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Optional: campaign id from env or query; creates one if absent
  const campaignIdParam = url.searchParams.get('campaign');
  const e2eCampaignId = process.env.E2E_CAMPAIGN_ID || campaignIdParam || '';

  try {
    let campaignId = e2eCampaignId;
    if (!campaignId) {
      const { data: cData, error: cErr } = await supabase
        .from('campaigns')
        .insert({ name: 'E2E Auto Campaign', slug: `e2e-${Date.now()}` })
        .select('id')
        .single();
      if (cErr) throw new Error(`Create campaign failed: ${cErr.message}`);
      campaignId = cData.id as string;
    }

    const title = `e2e-${Math.random().toString(36).slice(2, 10)}`;
    const { data: eIns, error: eErr } = await supabase
      .from('entities')
      .insert({ campaign_id: campaignId, type: 'e2e', title, summary: 'connectivity check' })
      .select('id, title')
      .single();
    if (eErr) throw new Error(`Insert entity failed: ${eErr.message}`);

    const { data: eRead, error: rErr } = await supabase
      .from('entities')
      .select('id, title')
      .eq('id', eIns.id)
      .single();
    if (rErr) throw new Error(`Read entity failed: ${rErr.message}`);

    return NextResponse.json({ ok: true, campaignId, entityId: eRead.id, title: eRead.title });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}


