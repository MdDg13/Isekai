"use client";

import { createClient } from "@supabase/supabase-js";
import { useMemo, useState, useEffect, useCallback } from "react";

interface CampaignClientProps {
  campaignId: string;
}

export default function CampaignClient({ campaignId }: CampaignClientProps) {
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      console.warn('Supabase environment variables not found');
      return null;
    }
    return createClient(url, key);
  }, []);

  const [campaign, setCampaign] = useState<{ id: string; name: string; created_at: string } | null>(null);
  const [entities, setEntities] = useState<{ id: string; type: string; title: string; summary: string; created_at: string }[]>([]);
  const [npcs, setNpcs] = useState<Array<{
    id: string;
    name: string;
    created_at: string;
    bio?: string;
    backstory?: string;
    traits?: unknown;
    stats?: unknown;
    location_id?: string | null;
    affiliations?: unknown;
  }>>([]);
  const [_user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEntity, setNewEntity] = useState({ type: 'npc', title: '', summary: '' });
  const [status, setStatus] = useState<string>("");

  // NPC generator form state
  const [npcForm, setNpcForm] = useState({
    nameHint: '',
    race: '',
    temperament: '',
    keyword1: '',
    keyword2: '',
    keyword3: '',
    equipment: '',
    level: 3,
    locationId: '',
    randomRole: '',
    randomBiome: '',
    randomFaction: '',
  });

  const loadCampaign = useCallback(async () => {
    if (!supabase) return;
    
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();
    
    if (error) {
      console.error('Error loading campaign:', error);
      setStatus(`Error loading campaign: ${error.message}`);
    } else {
      setCampaign(data);
    }
  }, [supabase, campaignId]);

  const loadEntities = useCallback(async () => {
    if (!supabase) return;
    
    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error loading entities:', error);
      setStatus(`Error loading entities: ${error.message}`);
    } else {
      setEntities(data || []);
    }
  }, [supabase, campaignId]);

  const loadNpcs = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('npc')
      .select('id,name,created_at,bio,backstory,traits,stats,location_id,affiliations')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error loading NPCs:', error);
    } else {
      setNpcs(data || []);
    }
  }, [supabase, campaignId]);

  useEffect(() => {
    if (!supabase) return;
    
    // Check auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Load campaign and entities
    loadCampaign();
    loadEntities();
    loadNpcs();
  }, [supabase, campaignId, loadCampaign, loadEntities, loadNpcs]);

  const createEntity = async () => {
    if (!newEntity.title.trim() || !supabase) return;
    
    setStatus("Creating entity...");
    
    const { error } = await supabase.rpc('create_entity', {
      p_campaign_id: campaignId,
      p_type: newEntity.type,
      p_title: newEntity.title.trim(),
      p_summary: newEntity.summary.trim(),
    });

    if (error) {
      setStatus(`Error creating entity: ${error.message}`);
    } else {
      setStatus("Entity created!");
      setNewEntity({ type: 'npc', title: '', summary: '' });
      setShowCreateForm(false);
      loadEntities();
    }
  };

  if (!campaign) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <header className="mb-8">
        <h1 className="font-display text-3xl">{campaign.name}</h1>
        <p className="text-sm text-[var(--color-muted)]">Campaign created {new Date(campaign.created_at).toLocaleDateString()}</p>
      </header>

      <div className="space-y-6">
        {/* NPC Generator (DM) */}
        <div className="rounded-lg border border-[var(--color-border)] bg-black/20 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">NPC Generator</h2>
            <div className="text-xs text-[var(--color-muted)]">Drafts are DM-only until published</div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm mb-1">Name hint</label>
              <input className="w-full rounded-md border border-[var(--color-border)] bg-transparent p-2 outline-none" value={npcForm.nameHint} onChange={e=>setNpcForm({...npcForm,nameHint:e.target.value})} />
            </div>
            <div>
              <label className="block text-sm mb-1">Race</label>
              <input className="w-full rounded-md border border-[var(--color-border)] bg-transparent p-2 outline-none" value={npcForm.race} onChange={e=>setNpcForm({...npcForm,race:e.target.value})} />
            </div>
            <div>
              <label className="block text-sm mb-1">Temperament</label>
              <input className="w-full rounded-md border border-[var(--color-border)] bg-transparent p-2 outline-none" value={npcForm.temperament} onChange={e=>setNpcForm({...npcForm,temperament:e.target.value})} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm mb-1">Keyword 1</label>
                <input className="w-full rounded-md border border-[var(--color-border)] bg-transparent p-2 outline-none" value={npcForm.keyword1} onChange={e=>setNpcForm({...npcForm,keyword1:e.target.value})} />
              </div>
              <div>
                <label className="block text-sm mb-1">Keyword 2</label>
                <input className="w-full rounded-md border border-[var(--color-border)] bg-transparent p-2 outline-none" value={npcForm.keyword2} onChange={e=>setNpcForm({...npcForm,keyword2:e.target.value})} />
              </div>
              <div>
                <label className="block text-sm mb-1">Keyword 3</label>
                <input className="w-full rounded-md border border-[var(--color-border)] bg-transparent p-2 outline-none" value={npcForm.keyword3} onChange={e=>setNpcForm({...npcForm,keyword3:e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1">Equipment</label>
              <input className="w-full rounded-md border border-[var(--color-border)] bg-transparent p-2 outline-none" value={npcForm.equipment} onChange={e=>setNpcForm({...npcForm,equipment:e.target.value})} />
            </div>
            <div>
              <label className="block text-sm mb-1">Level</label>
              <input type="number" min={1} max={20} className="w-full rounded-md border border-[var(--color-border)] bg-transparent p-2 outline-none" value={npcForm.level} onChange={e=>setNpcForm({...npcForm,level:Number(e.target.value||3)})} />
            </div>
            <div>
              <label className="block text-sm mb-1">Location Id (optional)</label>
              <input className="w-full rounded-md border border-[var(--color-border)] bg-transparent p-2 outline-none" value={npcForm.locationId} onChange={e=>setNpcForm({...npcForm,locationId:e.target.value})} />
            </div>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div>
              <label className="block text-sm mb-1">Random role</label>
              <input className="w-full rounded-md border border-[var(--color-border)] bg-transparent p-2 outline-none" value={npcForm.randomRole} onChange={e=>setNpcForm({...npcForm,randomRole:e.target.value})} />
            </div>
            <div>
              <label className="block text-sm mb-1">Random biome</label>
              <input className="w-full rounded-md border border-[var(--color-border)] bg-transparent p-2 outline-none" value={npcForm.randomBiome} onChange={e=>setNpcForm({...npcForm,randomBiome:e.target.value})} />
            </div>
            <div>
              <label className="block text-sm mb-1">Random faction</label>
              <input className="w-full rounded-md border border-[var(--color-border)] bg-transparent p-2 outline-none" value={npcForm.randomFaction} onChange={e=>setNpcForm({...npcForm,randomFaction:e.target.value})} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={async ()=>{
                setStatus('Generating NPC...');
                try {
                  const res = await fetch('/api/generate-npc', { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({
                    campaignId,
                    nameHint: npcForm.nameHint || undefined,
                    ruleset: 'DND5E_2024',
                    locationId: npcForm.locationId || undefined,
                    level: npcForm.level || 3,
                    tags: [npcForm.race, npcForm.temperament, npcForm.equipment, npcForm.keyword1, npcForm.keyword2, npcForm.keyword3].filter(Boolean),
                    affiliations: [],
                    connections: [],
                  })});
                  if (!res.ok) throw new Error(await res.text());
                  await res.json();
                  setStatus('NPC draft created');
                  setNpcForm({ ...npcForm, nameHint:'', keyword1:'', keyword2:'', keyword3:'', equipment:'' });
                  loadNpcs();
                } catch (e: unknown) {
                  const message = e instanceof Error ? e.message : String(e);
                  setStatus(`NPC generation failed: ${message}`);
                }
              }}
              className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-hover)]"
            >
              Generate from prompt
            </button>
            <button
              onClick={async ()=>{
                setStatus('Generating random NPC...');
                try {
                  const res = await fetch('/api/generate-npc', { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({
                    campaignId,
                    ruleset: 'DND5E_2024',
                    tags: [npcForm.randomRole, npcForm.randomBiome, npcForm.randomFaction].filter(Boolean),
                  })});
                  if (!res.ok) throw new Error(await res.text());
                  await res.json();
                  setStatus('Random NPC draft created');
                  loadNpcs();
                } catch(e: unknown) {
                  const message = e instanceof Error ? e.message : String(e);
                  setStatus(`Random generation failed: ${message}`);
                }
              }}
              className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm font-medium"
            >
              Random generate
            </button>
          </div>
        </div>

        {/* Entities Section */}
        <div className="rounded-lg border border-[var(--color-border)] bg-black/20 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Entities</h2>
            <button
              onClick={() => setShowCreateForm(true)}
              className="rounded-md bg-[var(--color-primary)] px-3 py-1 text-sm font-medium text-white hover:bg-[var(--primary-hover)]"
            >
              Add Entity
            </button>
          </div>
          
          {entities.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">No entities yet. Add your first NPC, location, or item!</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {entities.map((entity) => (
                <div key={entity.id} className="rounded border border-[var(--color-border)] p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-[var(--color-primary)] text-white px-2 py-1 rounded uppercase">
                      {entity.type}
                    </span>
                  </div>
                  <h3 className="font-medium">{entity.title}</h3>
                  {entity.summary && (
                    <p className="text-sm text-[var(--color-muted)] mt-1">{entity.summary}</p>
                  )}
                  <p className="text-xs text-[var(--color-muted)] mt-2">
                    Created {new Date(entity.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* NPC Drafts */}
        <div className="rounded-lg border border-[var(--color-border)] bg-black/20 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">NPC Drafts</h2>
            <button onClick={loadNpcs} className="rounded-md border border-[var(--color-border)] px-3 py-1 text-sm font-medium">Refresh</button>
          </div>
          {npcs.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">No NPCs yet.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {npcs.map(n => {
                const traits = n.traits as { race?: string; temperament?: string; keywords?: string[] } | undefined;
                const stats = n.stats as { level?: number; abilities?: Record<string, number> } | undefined;
                return (
                  <div key={n.id} className="rounded border border-[var(--color-border)] p-3 hover:bg-black/10 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium">{n.name}</h3>
                      {stats?.level && <span className="text-xs bg-[var(--color-primary)] text-white px-2 py-0.5 rounded">Lv {stats.level}</span>}
                    </div>
                    {traits?.race && <p className="text-xs text-[var(--color-muted)] mb-1">{traits.race} {traits.temperament ? `• ${traits.temperament}` : ''}</p>}
                    {n.bio && <p className="text-sm text-[var(--color-muted)] mt-1 line-clamp-2">{n.bio}</p>}
                    {traits?.keywords && traits.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {traits.keywords.slice(0, 3).map((kw, i) => (
                          <span key={i} className="text-xs bg-[var(--color-border)] px-1.5 py-0.5 rounded">{kw}</span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-[var(--color-muted)] mt-2">Created {new Date(n.created_at).toLocaleDateString()}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create Entity Form */}
        {showCreateForm && (
          <div className="rounded-lg border border-[var(--color-border)] bg-black/20 p-4">
            <h3 className="text-lg font-medium mb-4">Add New Entity</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Type</label>
                <select
                  className="w-full rounded-md border border-[var(--color-border)] bg-transparent p-2 outline-none"
                  value={newEntity.type}
                  onChange={(e) => setNewEntity({ ...newEntity, type: e.target.value })}
                >
                  <option value="npc">NPC</option>
                  <option value="location">Location</option>
                  <option value="item">Item</option>
                  <option value="faction">Faction</option>
                  <option value="lore">Lore</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm mb-1">Title</label>
                <input
                  className="w-full rounded-md border border-[var(--color-border)] bg-transparent p-2 outline-none"
                  type="text"
                  placeholder="Entity name"
                  value={newEntity.title}
                  onChange={(e) => setNewEntity({ ...newEntity, title: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm mb-1">Summary</label>
                <textarea
                  className="w-full rounded-md border border-[var(--color-border)] bg-transparent p-2 outline-none"
                  rows={3}
                  placeholder="Brief description"
                  value={newEntity.summary}
                  onChange={(e) => setNewEntity({ ...newEntity, summary: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={createEntity}
                className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-hover)]"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewEntity({ type: 'npc', title: '', summary: '' });
                }}
                className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {status && <p className="text-sm">{status}</p>}
      </div>
    </div>
  );
}
