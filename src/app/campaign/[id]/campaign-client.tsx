"use client";

import { createClient } from "@supabase/supabase-js";
import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";

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
  const [, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [status, setStatus] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'npc-generator' | 'npcs'>('npc-generator');

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
      .from('campaign')
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

    // Load campaign and NPCs
    loadCampaign();
    loadNpcs();
  }, [supabase, campaignId, loadCampaign, loadNpcs]);

  if (!campaign) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading campaign...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-300">← Back to Worlds</Link>
            <button onClick={loadNpcs} className="text-xs text-gray-400 hover:text-gray-300">Refresh</button>
          </div>
          <h1 className="text-xl sm:text-2xl font-medium">{campaign.name}</h1>
          <p className="text-xs text-gray-400 mt-1">Created {new Date(campaign.created_at).toLocaleDateString()}</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-800 bg-gray-900/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('npc-generator')}
              className={`px-4 py-3 text-sm font-medium transition-colors touch-manipulation ${
                activeTab === 'npc-generator'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              NPC Generator
            </button>
            <button
              onClick={() => setActiveTab('npcs')}
              className={`px-4 py-3 text-sm font-medium transition-colors touch-manipulation ${
                activeTab === 'npcs'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              NPCs ({npcs.length})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'npc-generator' && (
          <div className="space-y-6">
            {/* NPC Generator */}
            <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-medium mb-4">Generate NPC</h2>
              <p className="text-xs text-gray-400 mb-4">Drafts are DM-only until published</p>
              
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Name hint</label>
                    <input
                      className="w-full rounded-md border border-gray-700 bg-gray-900/50 p-2.5 text-sm outline-none focus:border-blue-600 transition-colors"
                      value={npcForm.nameHint}
                      onChange={e => setNpcForm({ ...npcForm, nameHint: e.target.value })}
                      placeholder="e.g., Aelric"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Race</label>
                    <input
                      className="w-full rounded-md border border-gray-700 bg-gray-900/50 p-2.5 text-sm outline-none focus:border-blue-600 transition-colors"
                      value={npcForm.race}
                      onChange={e => setNpcForm({ ...npcForm, race: e.target.value })}
                      placeholder="e.g., elf, human, dwarf"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Temperament</label>
                    <input
                      className="w-full rounded-md border border-gray-700 bg-gray-900/50 p-2.5 text-sm outline-none focus:border-blue-600 transition-colors"
                      value={npcForm.temperament}
                      onChange={e => setNpcForm({ ...npcForm, temperament: e.target.value })}
                      placeholder="e.g., friendly, cautious, aggressive"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Equipment</label>
                    <input
                      className="w-full rounded-md border border-gray-700 bg-gray-900/50 p-2.5 text-sm outline-none focus:border-blue-600 transition-colors"
                      value={npcForm.equipment}
                      onChange={e => setNpcForm({ ...npcForm, equipment: e.target.value })}
                      placeholder="e.g., sword, staff, bow"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Level</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      className="w-full rounded-md border border-gray-700 bg-gray-900/50 p-2.5 text-sm outline-none focus:border-blue-600 transition-colors"
                      value={npcForm.level}
                      onChange={e => setNpcForm({ ...npcForm, level: Number(e.target.value || 3) })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Location ID (optional)</label>
                    <input
                      className="w-full rounded-md border border-gray-700 bg-gray-900/50 p-2.5 text-sm outline-none focus:border-blue-600 transition-colors"
                      value={npcForm.locationId}
                      onChange={e => setNpcForm({ ...npcForm, locationId: e.target.value })}
                      placeholder="UUID"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Keywords (for roleplaying)</label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      className="w-full rounded-md border border-gray-700 bg-gray-900/50 p-2.5 text-sm outline-none focus:border-blue-600 transition-colors"
                      value={npcForm.keyword1}
                      onChange={e => setNpcForm({ ...npcForm, keyword1: e.target.value })}
                      placeholder="Keyword 1"
                    />
                    <input
                      className="w-full rounded-md border border-gray-700 bg-gray-900/50 p-2.5 text-sm outline-none focus:border-blue-600 transition-colors"
                      value={npcForm.keyword2}
                      onChange={e => setNpcForm({ ...npcForm, keyword2: e.target.value })}
                      placeholder="Keyword 2"
                    />
                    <input
                      className="w-full rounded-md border border-gray-700 bg-gray-900/50 p-2.5 text-sm outline-none focus:border-blue-600 transition-colors"
                      value={npcForm.keyword3}
                      onChange={e => setNpcForm({ ...npcForm, keyword3: e.target.value })}
                      placeholder="Keyword 3"
                    />
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Random role</label>
                    <input
                      className="w-full rounded-md border border-gray-700 bg-gray-900/50 p-2.5 text-sm outline-none focus:border-blue-600 transition-colors"
                      value={npcForm.randomRole}
                      onChange={e => setNpcForm({ ...npcForm, randomRole: e.target.value })}
                      placeholder="e.g., merchant, guard"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Random biome</label>
                    <input
                      className="w-full rounded-md border border-gray-700 bg-gray-900/50 p-2.5 text-sm outline-none focus:border-blue-600 transition-colors"
                      value={npcForm.randomBiome}
                      onChange={e => setNpcForm({ ...npcForm, randomBiome: e.target.value })}
                      placeholder="e.g., forest, city"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Random faction</label>
                    <input
                      className="w-full rounded-md border border-gray-700 bg-gray-900/50 p-2.5 text-sm outline-none focus:border-blue-600 transition-colors"
                      value={npcForm.randomFaction}
                      onChange={e => setNpcForm({ ...npcForm, randomFaction: e.target.value })}
                      placeholder="e.g., thieves guild"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={async () => {
                    setStatus('Generating NPC...');
                    try {
                      const res = await fetch('/api/generate-npc', {
                        method: 'POST',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({
                          campaignId,
                          nameHint: npcForm.nameHint || undefined,
                          ruleset: 'DND5E_2024',
                          locationId: npcForm.locationId || undefined,
                          level: npcForm.level || 3,
                          tags: [npcForm.race, npcForm.temperament, npcForm.equipment, npcForm.keyword1, npcForm.keyword2, npcForm.keyword3].filter(Boolean),
                          affiliations: [],
                          connections: [],
                        })
                      });
                      if (!res.ok) throw new Error(await res.text());
                      await res.json();
                      setStatus('NPC draft created');
                      setNpcForm({ ...npcForm, nameHint: '', keyword1: '', keyword2: '', keyword3: '', equipment: '' });
                      loadNpcs();
                      setActiveTab('npcs');
                    } catch (e: unknown) {
                      const message = e instanceof Error ? e.message : String(e);
                      setStatus(`NPC generation failed: ${message}`);
                    }
                  }}
                  className="flex-1 rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation"
                >
                  Generate from Prompt
                </button>
                <button
                  onClick={async () => {
                    setStatus('Generating random NPC...');
                    try {
                      const res = await fetch('/api/generate-npc', {
                        method: 'POST',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({
                          campaignId,
                          ruleset: 'DND5E_2024',
                          tags: [npcForm.randomRole, npcForm.randomBiome, npcForm.randomFaction].filter(Boolean),
                        })
                      });
                      if (!res.ok) throw new Error(await res.text());
                      await res.json();
                      setStatus('Random NPC draft created');
                      loadNpcs();
                      setActiveTab('npcs');
                    } catch (e: unknown) {
                      const message = e instanceof Error ? e.message : String(e);
                      setStatus(`Random generation failed: ${message}`);
                    }
                  }}
                  className="flex-1 rounded-md border border-gray-700 px-4 py-3 text-sm font-medium hover:bg-gray-800 active:bg-gray-700 transition-colors touch-manipulation"
                >
                  Random Generate
                </button>
              </div>
            </div>

            {status && (
              <div className={`rounded-lg border p-4 ${
                status.includes('failed') || status.includes('Error')
                  ? 'border-red-800 bg-red-900/20 text-red-300'
                  : 'border-blue-800 bg-blue-900/20 text-blue-300'
              }`}>
                <p className="text-sm">{status}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'npcs' && (
          <div className="space-y-4">
            {npcs.length === 0 ? (
              <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-8 text-center">
                <p className="text-gray-400">No NPCs yet. Generate your first NPC using the NPC Generator tab.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {npcs.map(n => {
                  const traits = n.traits as { race?: string; temperament?: string; keywords?: string[] } | undefined;
                  const stats = n.stats as { level?: number; abilities?: Record<string, number> } | undefined;
                  return (
                    <div key={n.id} className="rounded-lg border border-gray-800 bg-gray-900/50 p-4 hover:bg-gray-900/70 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-base">{n.name}</h3>
                        {stats?.level && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Lv {stats.level}</span>
                        )}
                      </div>
                      {traits?.race && (
                        <p className="text-xs text-gray-400 mb-2">
                          {traits.race} {traits.temperament ? `• ${traits.temperament}` : ''}
                        </p>
                      )}
                      {n.bio && (
                        <p className="text-sm text-gray-300 mt-2 line-clamp-3">{n.bio}</p>
                      )}
                      {traits?.keywords && traits.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {traits.keywords.slice(0, 3).map((kw, i) => (
                            <span key={i} className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-3">Created {new Date(n.created_at).toLocaleDateString()}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
