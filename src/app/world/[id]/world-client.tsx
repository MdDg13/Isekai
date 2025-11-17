"use client";

import { createClient } from "@supabase/supabase-js";
import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface WorldRecord {
  id: string;
  name: string;
  slug?: string | null;
  ruleset?: string | null;
  created_at: string;
}

interface WorldNpcRecord {
  id: string;
  name: string;
  created_at: string;
  bio?: string;
  backstory?: string;
  traits?: unknown;
  stats?: unknown;
  location_id?: string | null;
  affiliations?: unknown[];
  relationships?: Record<string, unknown>;
}

interface WorldClientProps {
  worldId: string;
}

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

export default function WorldClient({ worldId }: WorldClientProps) {
  const router = useRouter();
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      console.warn('Supabase environment variables not found');
      return null;
    }
    return createClient(url, key);
  }, []);

  const [world, setWorld] = useState<WorldRecord | null>(null);
  const [worldNpcs, setWorldNpcs] = useState<WorldNpcRecord[]>([]);
  const [status, setStatus] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'npc-generator' | 'npcs' | 'locations' | 'items'>('npc-generator');
  const [isRenamingWorld, setIsRenamingWorld] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [savingWorldName, setSavingWorldName] = useState(false);
  const [showWorldMenu, setShowWorldMenu] = useState(false);
  const worldMenuRef = useRef<HTMLDivElement | null>(null);

  // NPC generator form state
  const [npcForm, setNpcForm] = useState({
    keywords: '',
    level: '0',
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
const [selectedNpc, setSelectedNpc] = useState<WorldNpcRecord | null>(null);

  const loadWorld = useCallback(async () => {
    if (!supabase) return;
    
    const { data, error } = await supabase
      .from('world')
      .select('id,name,slug,ruleset,created_at')
      .eq('id', worldId)
      .single();
    
    if (error) {
      console.error('Error loading world:', error);
      setStatus(`Error loading world: ${error.message}`);
    } else {
      setWorld(data as WorldRecord);
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
      setWorldNpcs((data as WorldNpcRecord[]) || []);
    }
  }, [supabase, worldId]);

  useEffect(() => {
    if (!supabase) return;
    
    loadWorld();
    loadWorldNpcs();
  }, [supabase, worldId, loadWorld, loadWorldNpcs]);
  
  useEffect(() => {
    if (selectedNpcId && worldNpcs.length > 0) {
      const npc = worldNpcs.find(n => n.id === selectedNpcId);
      setSelectedNpc(npc || null);
    } else {
      setSelectedNpc(null);
    }
  }, [selectedNpcId, worldNpcs]);

  useEffect(() => {
    if (!showWorldMenu) return;
    const handleClick = (event: MouseEvent) => {
      if (worldMenuRef.current && !worldMenuRef.current.contains(event.target as Node)) {
        setShowWorldMenu(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowWorldMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [showWorldMenu]);

  const handleStartRename = () => {
    if (!world) return;
    setRenameValue(world.name);
    setIsRenamingWorld(true);
  };

  const handleCancelRename = () => {
    setIsRenamingWorld(false);
    setRenameValue('');
  };

  const handleSaveWorldName = async () => {
    if (!supabase || !world || !renameValue.trim()) return;
    setSavingWorldName(true);
    setStatus('Updating world name...');
    try {
      const { data, error } = await supabase
        .from('world')
        .update({ name: renameValue.trim() })
        .eq('id', worldId)
        .select('*')
        .single();

      if (error) throw error;
      setWorld(data);
      setIsRenamingWorld(false);
      setRenameValue('');
      setStatus('World name updated');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setStatus(`Rename failed: ${message}`);
    } finally {
      setSavingWorldName(false);
    }
  };

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-') || `world-${Date.now()}`;

  const handleDuplicateWorld = async () => {
    if (!supabase || !world) return;
    setStatus('Duplicating world...');
    try {
      const baseName = `${world.name} Copy`;
      const newName = baseName.length > 60 ? `${baseName.slice(0, 57)}...` : baseName;
      const slugBase = slugify(world.slug || world.name || 'world');
      const slug = `${slugBase}-${Math.random().toString(36).slice(2, 6)}`;

      const { data: newWorld, error: worldErr } = await supabase
        .from('world')
        .insert({
          name: newName,
          slug,
          ruleset: world.ruleset ?? 'DND5E_2024',
        })
        .select('*')
        .single();

      if (worldErr || !newWorld) throw worldErr;

      if (worldNpcs.length > 0) {
        const npcCopies = worldNpcs.map((npc) => {
          const { id: _unusedId, created_at: _unusedCreated, ...rest } = npc;
          void _unusedId;
          void _unusedCreated;
          return {
            ...rest,
            world_id: newWorld.id,
            created_at: new Date().toISOString(),
            visibility: 'public',
          };
        });
        await supabase.from('world_npc').insert(npcCopies);
      }

      setStatus('World duplicated');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setStatus(`Duplicate failed: ${message}`);
    } finally {
      setShowWorldMenu(false);
    }
  };

  const handleDeleteWorld = async () => {
    if (!supabase || !world) return;
    if (!confirm(`Delete world "${world.name}"? This cannot be undone.`)) return;
    setStatus('Deleting world...');
    try {
      const { error } = await supabase
        .from('world')
        .delete()
        .eq('id', worldId);
      if (error) throw error;
      setStatus('World deleted');
      router.push('/');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setStatus(`Delete failed: ${message}`);
    }
  };

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
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-300">← Back to Worlds</Link>
            <button onClick={loadWorldNpcs} className="text-xs text-gray-400 hover:text-gray-300">Refresh</button>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-medium">{world.name}</h1>
            <div className="relative" ref={worldMenuRef}>
              <button
                onClick={() => setShowWorldMenu((prev) => !prev)}
                className="p-2 rounded-md border border-gray-700 bg-gray-900/40 hover:bg-gray-800 transition-colors"
                aria-label="World actions"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-200">
                  <path d="M15.232 5.232a2.5 2.5 0 013.536 3.536L8.964 18.572a4 4 0 01-1.682.986l-2.817.805a.75.75 0 01-.924-.924l.805-2.817a4 4 0 01.986-1.682l9.9-9.9z" />
                  <path d="M5 13l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              {showWorldMenu && (
                <div
                  ref={worldMenuRef}
                  className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-800 bg-black/90 shadow-xl z-10"
                >
                  <button
                    onClick={() => {
                      setShowWorldMenu(false);
                      handleStartRename();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-800 transition-colors"
                  >
                    Rename World
                  </button>
                  <button
                    onClick={() => {
                      setShowWorldMenu(false);
                      handleDuplicateWorld();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-800 transition-colors"
                  >
                    Duplicate World
                  </button>
                  <button
                    onClick={() => {
                      setShowWorldMenu(false);
                      handleDeleteWorld();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-900/40 transition-colors"
                  >
                    Delete World
                  </button>
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">World-level content (shared across all campaigns)</p>
          {isRenamingWorld && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                className="rounded-md border border-gray-700 bg-gray-900/50 px-3 py-1.5 text-sm outline-none focus:border-blue-600"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="World name"
                autoFocus
              />
              <button
                onClick={handleSaveWorldName}
                disabled={savingWorldName || !renameValue.trim()}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {savingWorldName ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancelRename}
                disabled={savingWorldName}
                className="rounded-md border border-gray-700 px-3 py-1.5 text-xs font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-800 bg-gray-900/30">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
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
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'npc-generator' && (
          <div className="space-y-6">
            {/* NPC Generator */}
            <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-medium mb-4">Generate World NPC</h2>
              <p className="text-xs text-gray-400 mb-4">These NPCs are part of the world and shared across all campaigns</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Keywords (comma separated)</label>
                  <input
                    className="w-full rounded-md border border-gray-700 bg-gray-900/50 p-2.5 text-sm outline-none focus:border-blue-600 transition-colors"
                    value={npcForm.keywords}
                    onChange={e => setNpcForm({ ...npcForm, keywords: e.target.value })}
                    placeholder="e.g., bard, halfling, trickster, wandering performer"
                  />
                  <p className="mt-1 text-[11px] text-gray-500">Use keywords to hint race, class, background, role, etc.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="block text-xs text-gray-400 mb-1.5">Level</label>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      step={1}
                      className="w-full rounded-md border border-gray-700 bg-gray-900/50 p-2.5 text-sm outline-none focus:border-blue-600 transition-colors"
                      value={npcForm.level}
                      onChange={e => setNpcForm({ ...npcForm, level: e.target.value })}
                      inputMode="numeric"
                    />
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
                      const parsedLevel = Number.parseInt(npcForm.level, 10);
                      const safeLevel = Number.isFinite(parsedLevel) ? Math.min(Math.max(parsedLevel, 0), 20) : 0;
                      const keywordTags = npcForm.keywords
                        .split(/[,\\n]+/)
                        .map(tag => tag.trim())
                        .filter(tag => tag.length > 0);

                      const res = await fetch('/api/generate-world-npc', {
                        method: 'POST',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({
                          worldId,
                          ruleset: 'DND5E_2024',
                          locationId: npcForm.locationId || undefined,
                          level: safeLevel,
                          temperament: npcForm.temperament !== 'random' ? npcForm.temperament : undefined,
                          tags: keywordTags.length ? keywordTags : undefined,
                          fullyRandom: keywordTags.length === 0 && npcForm.temperament === 'random',
                        }),
                      });
                      if (!res.ok) throw new Error(await res.text());
                      await res.json();
                      setStatus('World NPC created');
                      setNpcForm({ keywords: '', level: '0', temperament: 'random', locationId: '' });
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
                            
                            <p className="text-xs text-gray-500">Created: {formatDateTime(selectedNpc.created_at)}</p>
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
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Created</th>
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
                                <td className="px-4 py-3 text-sm text-gray-300">{formatDateTime(n.created_at)}</td>
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

