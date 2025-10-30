// Cloudflare Pages Function for E2E connectivity check
import { createClient } from '@supabase/supabase-js';

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const req = context.request;
    const url = new URL(req.url);
    const headerToken = req.headers.get('x-bypass-token') || '';
    const queryToken = url.searchParams.get('token') || '';
    const token = headerToken || queryToken;

    const expected = context.env.E2E_BYPASS_TOKEN as string | undefined;
    if (!expected) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing E2E_BYPASS_TOKEN on Cloudflare' }), { status: 500, headers: { 'content-type': 'application/json' } });
    }
    if (token !== expected) {
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });
    }

    const supabaseUrl = context.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
    const serviceKey = context.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing Supabase envs on Cloudflare' }), { status: 500, headers: { 'content-type': 'application/json' } });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    let campaignId = (context.env.E2E_CAMPAIGN_ID as string | undefined) || url.searchParams.get('campaign') || '';
    if (!campaignId) {
      const { data: cData, error: cErr } = await supabase
        .from('campaigns')
        .insert({ name: 'E2E Auto Campaign', slug: `e2e-${Date.now()}` })
        .select('id')
        .single();
      if (cErr) throw new Error(`Create campaign failed: ${cErr.message}`);
      campaignId = cData!.id as string;
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
      .eq('id', eIns!.id)
      .single();
    if (rErr) throw new Error(`Read entity failed: ${rErr.message}`);

    return new Response(JSON.stringify({ ok: true, campaignId, entityId: eRead!.id, title: eRead!.title }), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ ok: false, error: message }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
};


