"use client";

import { createClient } from "@supabase/supabase-js";
import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import BuildBadge from "@/components/BuildBadge";

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
    level: 0,
    race: 'random',
    class: 'random',
    background: 'random',
    temperament: 'random',
    locationId: '',
  });
  const [stayOnGenerator, setStayOnGenerator] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('npc-generator-stay-on-screen');
      return saved === 'true';
    }
    return false;
  });
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('npc-generator-stay-on-screen', String(stayOnGenerator));
    }
  }, [stayOnGenerator]);
  
  // Table view state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'level' | 'race' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedNpcs, setSelectedNpcs] = useState<Set<string>>(new Set());
  
  // Detail view state
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedNpcId, setSelectedNpcId] = useState<string | null>(null);
  const [selectedNpc, setSelectedNpc] = useState<typeof worldNpcs[0] | null>(null);

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
  
  // Update selected NPC when ID changes
  useEffect(() => {
    if (selectedNpcId && worldNpcs.length > 0) {
      const npc = worldNpcs.find(n => n.id === selectedNpcId);
      setSelectedNpc(npc || null);
    } else {
      setSelectedNpc(null);
    }
  }, [selectedNpcId, worldNpcs]);

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
            <div className="flex items-center gap-3">
              <BuildBadge />
              <button onClick={loadWorldNpcs} className="text-xs text-gray-400 hover:text-gray-300">Refresh</button>
            </div>
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
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Name Hint (optional)</label>
                  <input
                    className="w-full rounded-md border border-gray-700 bg-gray-900/50 p-2.5 text-sm outline-none focus:border-blue-600 transition-colors"
                    value={npcForm.nameHint}
                    onChange={e => setNpcForm({ ...npcForm, nameHint: e.target.value })}
                    placeholder="e.g., Aldric Blackwood"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Level</label>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      className="w-full rounded-md border border-gray-700 bg-gray-900/50 p-2.5 text-sm outline-none focus:border-blue-600 transition-colors"
                      value={npcForm.level}
                      onChange={e => setNpcForm({ ...npcForm, level: Number(e.target.value ?? 0) })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Race</label>
                    <select
                      className="w-full rounded-md border border-gray-700 bg-gray-900/50 p-2.5 text-sm outline-none focus:border-blue-600 transition-colors"
                      value={npcForm.race}
                      onChange={e => setNpcForm({ ...npcForm, race: e.target.value })}
                    >
                      <option value="random">Random</option>
                      <option value="human">Human</option>
                      <option value="elf">Elf</option>
                      <option value="dwarf">Dwarf</option>
                      <option value="halfling">Halfling</option>
                      <option value="orc">Orc</option>
                      <option value="tiefling">Tiefling</option>
                      <option value="dragonborn">Dragonborn</option>
                      <option value="gnome">Gnome</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Class</label>
                    <select
                      className="w-full rounded-md border border-gray-700 bg-gray-900/50 p-2.5 text-sm outline-none focus:border-blue-600 transition-colors"
                      value={npcForm.class}
                      onChange={e => setNpcForm({ ...npcForm, class: e.target.value })}
                    >
                      <option value="random">Random</option>
                      <option value="Commoner">Commoner</option>
                      <option value="Guard">Guard</option>
                      <option value="Merchant">Merchant</option>
                      <option value="Scholar">Scholar</option>
                      <option value="Warrior">Warrior</option>
                      <option value="Noble">Noble</option>
                      <option value="Spellcaster">Spellcaster</option>
                      <option value="Rogue">Rogue</option>
                      <option value="Ranger">Ranger</option>
                      <option value="Cleric">Cleric</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Background</label>
                    <select
                      className="w-full rounded-md border border-gray-700 bg-gray-900/50 p-2.5 text-sm outline-none focus:border-blue-600 transition-colors"
                      value={npcForm.background}
                      onChange={e => setNpcForm({ ...npcForm, background: e.target.value })}
                    >
                      <option value="random">Random</option>
                      <option value="Acolyte">Acolyte</option>
                      <option value="Criminal">Criminal</option>
                      <option value="Folk Hero">Folk Hero</option>
                      <option value="Hermit">Hermit</option>
                      <option value="Noble">Noble</option>
                      <option value="Sage">Sage</option>
                      <option value="Soldier">Soldier</option>
                      <option value="Entertainer">Entertainer</option>
                      <option value="Guild Artisan">Guild Artisan</option>
                      <option value="Outlander">Outlander</option>
                      <option value="Sailor">Sailor</option>
                      <option value="Charlatan">Charlatan</option>
                      <option value="Urchin">Urchin</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Temperament</label>
                    <select
                      className="w-full rounded-md border border-gray-700 bg-gray-900/50 p-2.5 text-sm outline-none focus:border-blue-600 transition-colors"
                      value={npcForm.temperament}
                      onChange={e => setNpcForm({ ...npcForm, temperament: e.target.value })}
                    >
                      <option value="random">Random</option>
                      <option value="friendly">Friendly</option>
                      <option value="cautious">Cautious</option>
                      <option value="aggressive">Aggressive</option>
                      <option value="stoic">Stoic</option>
                      <option value="cheerful">Cheerful</option>
                      <option value="neutral">Neutral</option>
                    </select>
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
              </div>

              <div className="flex items-center gap-3 mt-4">
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stayOnGenerator}
                    onChange={e => setStayOnGenerator(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-blue-600 focus:ring-offset-gray-900"
                  />
                  <span>Stay on generation screen after creating NPC</span>
                </label>
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
                        level: Number.isFinite(npcForm.level) ? npcForm.level : 0,
                        race: npcForm.race !== 'random' ? npcForm.race : undefined,
                        class: npcForm.class !== 'random' ? npcForm.class : undefined,
                        background: npcForm.background !== 'random' ? npcForm.background : undefined,
                        temperament: npcForm.temperament !== 'random' ? npcForm.temperament : undefined,
                        fullyRandom: npcForm.nameHint === '' && npcForm.race === 'random' && npcForm.class === 'random' && npcForm.background === 'random' && npcForm.temperament === 'random',
                      })
                      });
                      if (!res.ok) throw new Error(await res.text());
                      await res.json();
                      setStatus('World NPC created');
                      setNpcForm({ nameHint: '', level: 0, race: 'random', class: 'random', background: 'random', temperament: 'random', locationId: '' });
                      loadWorldNpcs();
                      if (!stayOnGenerator) {
                        setActiveTab('npcs');
                      }
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
                        body: JSON.stringify({ worldId, ruleset: 'DND5E_2024', fullyRandom: true })
                      });
                      if (!res.ok) throw new Error(await res.text());
                      await res.json();
                      setStatus('Random world NPC created');
                      loadWorldNpcs();
                      if (!stayOnGenerator) {
                        setActiveTab('npcs');
                      }
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
            ) : viewMode === 'detail' && selectedNpc ? (
              <>
                {/* Detail View */}
                {(() => {
                  const filtered = worldNpcs.filter(n => {
                    if (!searchQuery) return true;
                    const query = searchQuery.toLowerCase();
                    const traits = n.traits as { race?: string; class?: string; background?: string } | undefined;
                    const stats = n.stats as { level?: number } | undefined;
                    return (
                      n.name.toLowerCase().includes(query) ||
                      traits?.race?.toLowerCase().includes(query) ||
                      traits?.class?.toLowerCase().includes(query) ||
                      traits?.background?.toLowerCase().includes(query) ||
                      n.bio?.toLowerCase().includes(query) ||
                      stats?.level?.toString().includes(query)
                    );
                  }).sort((a, b) => {
                    let aVal: string | number = '';
                    let bVal: string | number = '';
                    if (sortBy === 'name') {
                      aVal = a.name;
                      bVal = b.name;
                    } else if (sortBy === 'level') {
                      const aStats = a.stats as { level?: number } | undefined;
                      const bStats = b.stats as { level?: number } | undefined;
                      aVal = aStats?.level ?? 0;
                      bVal = bStats?.level ?? 0;
                    } else if (sortBy === 'race') {
                      const aTraits = a.traits as { race?: string } | undefined;
                      const bTraits = b.traits as { race?: string } | undefined;
                      aVal = aTraits?.race ?? '';
                      bVal = bTraits?.race ?? '';
                    } else {
                      aVal = new Date(a.created_at).getTime();
                      bVal = new Date(b.created_at).getTime();
                    }
                    if (sortOrder === 'asc') {
                      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
                    } else {
                      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
                    }
                  });
                  const currentIndex = filtered.findIndex(n => n.id === selectedNpcId);
                  const traits = selectedNpc.traits as {
                    race?: string;
                    class?: string;
                    background?: string;
                    temperament?: string;
                    personalityTraits?: string[];
                    ideal?: string;
                    bond?: string;
                    flaw?: string;
                    keywords?: string[];
                  } | undefined;
                  const stats = selectedNpc.stats as {
                    level?: number;
                    abilities?: {
                      str?: number;
                      dex?: number;
                      con?: number;
                      int?: number;
                      wis?: number;
                      cha?: number;
                    };
                    equipment?: string;
                    combat?: {
                      hitpoints?: number;
                      maxHitpoints?: number;
                      armorClass?: number;
                      speed?: number;
                      weapons?: Array<{
                        name?: string;
                        type?: string;
                        damage?: string;
                        damageType?: string;
                        toHit?: number;
                        damageBonus?: number;
                        range?: string;
                      }>;
                      damageResistances?: string[];
                      damageImmunities?: string[];
                      conditionImmunities?: string[];
                    };
                  } | undefined;
                  
                  return (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <button
                          onClick={() => {
                            setViewMode('list');
                            setSelectedNpcId(null);
                          }}
                          className="text-blue-400 hover:text-blue-300 text-sm underline"
                        >
                          ← Back to List
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (currentIndex > 0) {
                                setSelectedNpcId(filtered[currentIndex - 1].id);
                              }
                            }}
                            disabled={currentIndex === 0}
                            className="px-3 py-1.5 rounded-md border border-gray-700 bg-gray-900/50 text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            ← Previous
                          </button>
                          <span className="text-sm text-gray-400">
                            {currentIndex + 1} / {filtered.length}
                          </span>
                          <button
                            onClick={() => {
                              if (currentIndex < filtered.length - 1) {
                                setSelectedNpcId(filtered[currentIndex + 1].id);
                              }
                            }}
                            disabled={currentIndex === filtered.length - 1}
                            className="px-3 py-1.5 rounded-md border border-gray-700 bg-gray-900/50 text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Next →
                          </button>
                        </div>
                      </div>
                      
                      {/* NPC Detail Content */}
                      <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
                        <div className="grid gap-6 lg:grid-cols-3">
                          {/* Main Content */}
                          <div className="lg:col-span-2 space-y-6">
                            <div>
                              <h1 className="text-2xl sm:text-3xl font-display mb-2">{selectedNpc.name}</h1>
                              {traits?.race && traits?.class && (
                                <p className="text-sm text-gray-400">
                                  {traits.race} {traits.class} {stats?.level ? `• Level ${stats.level}` : ''}
                                </p>
                              )}
                            </div>
                            
                            {selectedNpc.bio && (
                              <div>
                                <h2 className="text-lg font-medium mb-2">Bio</h2>
                                <p className="text-gray-300">{selectedNpc.bio}</p>
                              </div>
                            )}
                            
                            {selectedNpc.backstory && (
                              <div>
                                <h2 className="text-lg font-medium mb-2">Backstory</h2>
                                <p className="text-gray-300 whitespace-pre-wrap">{selectedNpc.backstory}</p>
                              </div>
                            )}
                          </div>
                          
                          {/* Sidebar */}
                          <div className="lg:col-span-1 space-y-6">
                            {/* Stats */}
                            <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                              <h2 className="text-lg font-medium mb-3">Stats</h2>
                              <p className="text-gray-300 mb-2">Level: {stats?.level ?? 0}</p>
                              {stats?.abilities && (
                                <div className="grid grid-cols-2 gap-2 text-sm text-gray-300 mb-3">
                                  <span>STR: {stats.abilities.str ?? '-'}</span>
                                  <span>DEX: {stats.abilities.dex ?? '-'}</span>
                                  <span>CON: {stats.abilities.con ?? '-'}</span>
                                  <span>INT: {stats.abilities.int ?? '-'}</span>
                                  <span>WIS: {stats.abilities.wis ?? '-'}</span>
                                  <span>CHA: {stats.abilities.cha ?? '-'}</span>
                                </div>
                              )}
                              {stats?.equipment && <p className="text-gray-300 text-sm mb-3">Equipment: {stats.equipment}</p>}
                            </div>
                            
                            {/* Combat Stats */}
                            <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                              <h2 className="text-lg font-medium mb-3">Combat</h2>
                              <div className="space-y-2 text-sm">
                                {stats?.combat?.hitpoints !== undefined && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">HP:</span>
                                    <span className="text-gray-300">
                                      {stats.combat.hitpoints}
                                      {stats.combat.maxHitpoints !== undefined && ` / ${stats.combat.maxHitpoints}`}
                                    </span>
                                  </div>
                                )}
                                {stats?.combat?.armorClass !== undefined && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">AC:</span>
                                    <span className="text-gray-300">{stats.combat.armorClass}</span>
                                  </div>
                                )}
                                {stats?.combat?.speed !== undefined && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Speed:</span>
                                    <span className="text-gray-300">{stats.combat.speed} ft</span>
                                  </div>
                                )}
                                {stats?.combat?.weapons && stats.combat.weapons.length > 0 && (
                                  <div className="mt-3">
                                    <p className="text-gray-400 mb-2 font-medium">Weapons:</p>
                                    <div className="space-y-2">
                                      {stats.combat.weapons.map((weapon, i) => (
                                        <div key={i} className="border-l-2 border-gray-700 pl-2">
                                          <p className="text-gray-300 font-medium">{weapon.name || 'Unnamed Weapon'}</p>
                                          {weapon.type && <p className="text-gray-400 text-xs">{weapon.type}</p>}
                                          <div className="text-gray-300 text-xs mt-1">
                                            {weapon.toHit !== undefined && (
                                              <span>To Hit: {weapon.toHit >= 0 ? '+' : ''}{weapon.toHit}</span>
                                            )}
                                            {weapon.damage && (
                                              <span className="ml-2">
                                                Damage: {weapon.damage}
                                                {weapon.damageBonus !== undefined && (
                                                  <span> {weapon.damageBonus >= 0 ? '+' : ''}{weapon.damageBonus}</span>
                                                )}
                                                {weapon.damageType && <span> {weapon.damageType}</span>}
                                              </span>
                                            )}
                                            {weapon.range && <span className="ml-2">Range: {weapon.range}</span>}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {stats?.combat?.damageResistances && stats.combat.damageResistances.length > 0 && (
                                  <div className="mt-3">
                                    <p className="text-gray-400 mb-1 text-xs">Resistances:</p>
                                    <p className="text-gray-300 text-xs">{stats.combat.damageResistances.join(', ')}</p>
                                  </div>
                                )}
                                {stats?.combat?.damageImmunities && stats.combat.damageImmunities.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-gray-400 mb-1 text-xs">Immunities:</p>
                                    <p className="text-gray-300 text-xs">{stats.combat.damageImmunities.join(', ')}</p>
                                  </div>
                                )}
                                {stats?.combat?.conditionImmunities && stats.combat.conditionImmunities.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-gray-400 mb-1 text-xs">Condition Immunities:</p>
                                    <p className="text-gray-300 text-xs">{stats.combat.conditionImmunities.join(', ')}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Traits */}
                            <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                              <h2 className="text-lg font-medium mb-3">Traits</h2>
                              <p className="text-gray-300 mb-2">Race: {traits?.race || '-'}</p>
                              <p className="text-gray-300 mb-2">Class: {traits?.class || '-'}</p>
                              <p className="text-gray-300 mb-2">Background: {traits?.background || '-'}</p>
                              <p className="text-gray-300 mb-2">Temperament: {traits?.temperament || '-'}</p>
                              {traits?.personalityTraits && traits.personalityTraits.length > 0 && (
                                <div className="mb-2">
                                  <p className="text-gray-300 font-medium">Personality Traits:</p>
                                  <ul className="list-disc list-inside text-gray-400 text-sm">
                                    {traits.personalityTraits.map((t, i) => <li key={i}>{t}</li>)}
                                  </ul>
                                </div>
                              )}
                              {traits?.ideal && <p className="text-gray-300 mb-2">Ideal: {traits.ideal}</p>}
                              {traits?.bond && <p className="text-gray-300 mb-2">Bond: {traits.bond}</p>}
                              {traits?.flaw && <p className="text-gray-300 mb-2">Flaw: {traits.flaw}</p>}
                              {traits?.keywords && traits.keywords.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1">
                                  {traits.keywords.map((kw, i) => (
                                    <span key={i} className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">
                                      {kw}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  if (!supabase || !selectedNpc) return;
                                  if (!confirm(`Delete ${selectedNpc.name}? This cannot be undone.`)) return;
                                  try {
                                    const { error } = await supabase
                                      .from('world_npc')
                                      .delete()
                                      .eq('id', selectedNpc.id);
                                    if (error) throw error;
                                    setStatus(`${selectedNpc.name} deleted`);
                                    setViewMode('list');
                                    setSelectedNpcId(null);
                                    loadWorldNpcs();
                                  } catch (e: unknown) {
                                    const message = e instanceof Error ? e.message : String(e);
                                    setStatus(`Delete failed: ${message}`);
                                  }
                                }}
                                className="flex-1 px-4 py-2 rounded-md bg-red-600 text-sm font-medium text-white hover:bg-red-700 active:bg-red-800 transition-colors"
                              >
                                Delete NPC
                              </button>
                            </div>
                            
                            <p className="text-xs text-gray-500">Created: {new Date(selectedNpc.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </>
            ) : (
              <>
                {/* Search and Sort Controls */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search NPCs by name, race, class..."
                      className="w-full rounded-md border border-gray-700 bg-gray-900/50 p-2.5 text-sm outline-none focus:border-blue-600 transition-colors"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      className="rounded-md border border-gray-700 bg-gray-900/50 p-2.5 text-sm outline-none focus:border-blue-600 transition-colors"
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as typeof sortBy)}
                    >
                      <option value="created_at">Created</option>
                      <option value="name">Name</option>
                      <option value="level">Level</option>
                      <option value="race">Race</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="rounded-md border border-gray-700 bg-gray-900/50 px-3 py-2.5 text-sm hover:bg-gray-800 transition-colors"
                    >
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                    <button
                      onClick={() => {
                        if (worldNpcs.length > 0) {
                          if (viewMode === 'list') {
                            setSelectedNpcId(worldNpcs[0].id);
                            setViewMode('detail');
                          } else {
                            setViewMode('list');
                            setSelectedNpcId(null);
                          }
                        }
                      }}
                      className="rounded-md border border-gray-700 bg-gray-900/50 px-3 py-2.5 text-sm hover:bg-gray-800 transition-colors"
                    >
                      {viewMode === 'list' ? 'Details View' : 'List View'}
                    </button>
                  </div>
                </div>

                {/* Selection Actions */}
                {selectedNpcs.size > 0 && (
                  <div className="flex items-center justify-between p-4 rounded-lg border border-gray-800 bg-gray-900/50 mb-4">
                    <span className="text-sm text-gray-300">
                      {selectedNpcs.size} NPC{selectedNpcs.size !== 1 ? 's' : ''} selected
                    </span>
                    <button
                      onClick={async () => {
                        if (!supabase) return;
                        if (!confirm(`Delete ${selectedNpcs.size} NPC${selectedNpcs.size !== 1 ? 's' : ''}? This cannot be undone.`)) return;
                        setStatus('Deleting NPCs...');
                        try {
                          const deletePromises = Array.from(selectedNpcs).map(id =>
                            supabase.from('world_npc').delete().eq('id', id)
                          );
                          await Promise.all(deletePromises);
                          setStatus(`${selectedNpcs.size} NPC${selectedNpcs.size !== 1 ? 's' : ''} deleted`);
                          setSelectedNpcs(new Set());
                          loadWorldNpcs();
                        } catch (e: unknown) {
                          const message = e instanceof Error ? e.message : String(e);
                          setStatus(`Delete failed: ${message}`);
                        }
                      }}
                      className="px-4 py-2 rounded-md bg-red-600 text-sm font-medium text-white hover:bg-red-700 active:bg-red-800 transition-colors"
                    >
                      Delete Selected
                    </button>
                  </div>
                )}

                {/* Table */}
                <div className="rounded-lg border border-gray-800 bg-gray-900/50 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-800/50">
                        <tr>
                          <th className="px-4 py-3 text-left">
                            <input
                              type="checkbox"
                              checked={selectedNpcs.size > 0 && selectedNpcs.size === worldNpcs.length}
                              onChange={e => {
                                if (e.target.checked) {
                                  setSelectedNpcs(new Set(worldNpcs.map(n => n.id)));
                                } else {
                                  setSelectedNpcs(new Set());
                                }
                              }}
                              className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-blue-600 focus:ring-offset-gray-900"
                            />
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Race</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Class</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Level</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {worldNpcs
                          .filter(n => {
                            if (!searchQuery) return true;
                            const query = searchQuery.toLowerCase();
                            const traits = n.traits as { race?: string; class?: string; background?: string } | undefined;
                            const stats = n.stats as { level?: number } | undefined;
                            return (
                              n.name.toLowerCase().includes(query) ||
                              traits?.race?.toLowerCase().includes(query) ||
                              traits?.class?.toLowerCase().includes(query) ||
                              traits?.background?.toLowerCase().includes(query) ||
                              n.bio?.toLowerCase().includes(query) ||
                              stats?.level?.toString().includes(query)
                            );
                          })
                          .sort((a, b) => {
                            let aVal: string | number = '';
                            let bVal: string | number = '';
                            
                            if (sortBy === 'name') {
                              aVal = a.name;
                              bVal = b.name;
                            } else if (sortBy === 'level') {
                              const aStats = a.stats as { level?: number } | undefined;
                              const bStats = b.stats as { level?: number } | undefined;
                              aVal = aStats?.level ?? 0;
                              bVal = bStats?.level ?? 0;
                            } else if (sortBy === 'race') {
                              const aTraits = a.traits as { race?: string } | undefined;
                              const bTraits = b.traits as { race?: string } | undefined;
                              aVal = aTraits?.race ?? '';
                              bVal = bTraits?.race ?? '';
                            } else {
                              aVal = new Date(a.created_at).getTime();
                              bVal = new Date(b.created_at).getTime();
                            }
                            
                            if (sortOrder === 'asc') {
                              return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
                            } else {
                              return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
                            }
                          })
                          .map(n => {
                            const traits = n.traits as { race?: string; class?: string; background?: string; temperament?: string } | undefined;
                            const stats = n.stats as { level?: number } | undefined;
                            return (
                              <tr key={n.id} className="hover:bg-gray-800/30 transition-colors">
                                <td className="px-4 py-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedNpcs.has(n.id)}
                                    onChange={e => {
                                      const newSelected = new Set(selectedNpcs);
                                      if (e.target.checked) {
                                        newSelected.add(n.id);
                                      } else {
                                        newSelected.delete(n.id);
                                      }
                                      setSelectedNpcs(newSelected);
                                    }}
                                    onClick={e => e.stopPropagation()}
                                    className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-blue-600 focus:ring-offset-gray-900"
                                  />
                                </td>
                                <td className="px-4 py-3 text-sm font-medium">{n.name}</td>
                                <td className="px-4 py-3 text-sm text-gray-300">{traits?.race || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-300">{traits?.class || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-300">{stats?.level ?? 0}</td>
                                <td className="px-4 py-3">
                                  <button
                                    onClick={e => {
                                      e.stopPropagation();
                                      setSelectedNpcId(n.id);
                                      setViewMode('detail');
                                    }}
                                    className="text-blue-400 hover:text-blue-300 text-sm underline cursor-pointer"
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
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

