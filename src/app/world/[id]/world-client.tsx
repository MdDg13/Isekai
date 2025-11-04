"use client";

import { createClient } from "@supabase/supabase-js";
import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface WorldClientProps {
  worldId: string;
}

export default function WorldClient({ worldId }: WorldClientProps) {
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      console.warn('Supabase environment variables not found');
      return null;
    }
    return createClient(url, key);
  }, []);

  const [world, setWorld] = useState<{ id: string; name: string; created_at: string } | null>(null);
  const [worldNpcs, setWorldNpcs] = useState<Array<{
    id: string;
    name: string;
    created_at: string;
    bio?: string;
    backstory?: string;
    traits?: unknown;
    stats?: unknown;
    location_id?: string | null;
  }>>([]);
  const [status, setStatus] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'npc-generator' | 'npcs' | 'locations' | 'items'>('npc-generator');

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

  const loadWorld = useCallback(async () => {
    if (!supabase) return;
    
    const { data, error } = await supabase
      .from('world')
      .select('*')
      .eq('id', worldId)
      .single();
    
    if (error) {
      console.error('Error loading world:', error);
      setStatus(`Error loading world: ${error.message}`);
    } else {
      setWorld(data);
    }
  }, [supabase, worldId]);

  const loadWorldNpcs = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('world_npc')
      .select('id,name,created_at,bio,backstory,traits,stats,location_id')
      .eq('world_id', worldId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error loading world NPCs:', error);
    } else {
      setWorldNpcs(data || []);
    }
  }, [supabase, worldId]);

  useEffect(() => {
    if (!supabase) return;
    
    loadWorld();
    loadWorldNpcs();
  }, [supabase, worldId, loadWorld, loadWorldNpcs]);

  if (!world) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading world...</p>
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
            <button onClick={loadWorldNpcs} className="text-xs text-gray-400 hover:text-gray-300">Refresh</button>
          </div>
          <h1 className="text-xl sm:text-2xl font-medium">{world.name}</h1>
          <p className="text-xs text-gray-400 mt-1">World-level content (shared across all campaigns)</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-800 bg-gray-900/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('npc-generator')}
              className={`px-4 py-3 text-sm font-medium transition-colors touch-manipulation whitespace-nowrap ${
                activeTab === 'npc-generator'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              NPC Generator
            </button>
            <button
              onClick={() => setActiveTab('npcs')}
              className={`px-4 py-3 text-sm font-medium transition-colors touch-manipulation whitespace-nowrap ${
                activeTab === 'npcs'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              World NPCs ({worldNpcs.length})
            </button>
            <button
              onClick={() => setActiveTab('locations')}
              className={`px-4 py-3 text-sm font-medium transition-colors touch-manipulation whitespace-nowrap ${
                activeTab === 'locations'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Locations
            </button>
            <button
              onClick={() => setActiveTab('items')}
              className={`px-4 py-3 text-sm font-medium transition-colors touch-manipulation whitespace-nowrap ${
                activeTab === 'items'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Items
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
              <h2 className="text-lg sm:text-xl font-medium mb-4">Generate World NPC</h2>
              <p className="text-xs text-gray-400 mb-4">These NPCs are part of the world and shared across all campaigns</p>
              
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
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={async () => {
                    setStatus('Generating world NPC...');
                    try {
                      const res = await fetch('/api/generate-world-npc', {
                        method: 'POST',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({
                          worldId,
                          nameHint: npcForm.nameHint || undefined,
                          ruleset: 'DND5E_2024',
                          locationId: npcForm.locationId || undefined,
                          level: npcForm.level || 3,
                          tags: [npcForm.race, npcForm.temperament, npcForm.equipment, npcForm.keyword1, npcForm.keyword2, npcForm.keyword3].filter(Boolean),
                        })
                      });
                      if (!res.ok) throw new Error(await res.text());
                      await res.json();
                      setStatus('World NPC created');
                      setNpcForm({ ...npcForm, nameHint: '', keyword1: '', keyword2: '', keyword3: '', equipment: '' });
                      loadWorldNpcs();
                      setActiveTab('npcs');
                    } catch (e: unknown) {
                      const message = e instanceof Error ? e.message : String(e);
                      setStatus(`NPC generation failed: ${message}`);
                    }
                  }}
                  className="flex-1 rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation"
                >
                  Generate World NPC
                </button>
                <button
                  onClick={async () => {
                    setStatus('Generating random world NPC...');
                    try {
                      const res = await fetch('/api/generate-world-npc', {
                        method: 'POST',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({
                          worldId,
                          ruleset: 'DND5E_2024',
                          tags: [npcForm.randomRole, npcForm.randomBiome, npcForm.randomFaction].filter(Boolean),
                        })
                      });
                      if (!res.ok) throw new Error(await res.text());
                      await res.json();
                      setStatus('Random world NPC created');
                      loadWorldNpcs();
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
            {worldNpcs.length === 0 ? (
              <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-8 text-center">
                <p className="text-gray-400">No world NPCs yet. Generate your first NPC using the NPC Generator tab.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {worldNpcs.map(n => {
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

        {activeTab === 'locations' && (
          <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-8 text-center">
            <p className="text-gray-400">Locations feature coming soon</p>
          </div>
        )}

        {activeTab === 'items' && (
          <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-8 text-center">
            <p className="text-gray-400">Items feature coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
}

