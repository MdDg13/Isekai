"use client";

import { createClient } from "@supabase/supabase-js";
import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DungeonGenerator from "../../../components/dungeon/DungeonGenerator";
import DungeonDetailView from "../../../components/dungeon/DungeonDetailView";
import DungeonExportDrawer from "../../../components/dungeon/DungeonExportDrawer";
import type { DungeonDetail, DungeonGenerationParams, DungeonLevel } from "../../../types/dungeon";
import { Toast, type ToastVariant } from "../../../components/ui/Toast";

function generateDungeonName(theme: string, difficulty: string, worldName: string) {
  const themeDescriptors: Record<string, string[]> = {
    dungeon: ['Vault', 'Sanctum', 'Depths', 'Hall'],
    cave: ['Hollow', 'Grotto', 'Delve', 'Burrow'],
    ruin: ['Ruins', 'Remnant', 'Fallen Keep', 'Shards'],
    fortress: ['Citadel', 'Redoubt', 'Bastion', 'Bulwark'],
    tower: ['Spire', 'Watch', 'Needle', 'Pillar'],
    temple: ['Shrine', 'Reliquary', 'Catacomb', 'Sanctuary'],
    lair: ['Den', 'Nest', 'Haunt', 'Refuge'],
  };
  const difficultyAdjectives: Record<string, string[]> = {
    easy: ['Quiet', 'Drifting', 'Shrouded'],
    medium: ['Silent', 'Veiled', 'Forgotten'],
    hard: ['Forsaken', 'Grim', 'Bloodied'],
    deadly: ['Doomed', 'Cataclysmic', 'Blighted'],
  };
  const themeKey = theme in themeDescriptors ? theme : 'dungeon';
  const diffKey = difficulty in difficultyAdjectives ? difficulty : 'medium';
  const descriptor =
    difficultyAdjectives[diffKey][Math.floor(Math.random() * difficultyAdjectives[diffKey].length)];
  const noun =
    themeDescriptors[themeKey][Math.floor(Math.random() * themeDescriptors[themeKey].length)];
  const worldFragment = worldName.split(' ')[0] || 'Wandering';
  return `${descriptor} ${noun} of ${worldFragment}`;
}

interface PreviewDungeonState {
  id: string;
  name: string;
  created_at: string;
  detail: DungeonDetail;
  params: DungeonGenerationParams & { name?: string };
  saved?: boolean;
}

interface WorldRecord {
  id: string;
  name: string;
  slug?: string | null;
  ruleset?: string | null;
  created_at: string;
}

interface NpcSummary {
  oneLiner?: string;
  keyPoints?: string[];
}

interface NpcTraits {
  race?: string;
  class?: string;
  background?: string;
  temperament?: string;
  summary?: NpcSummary;
  personalityTraits?: string[];
  ideal?: string;
  bond?: string;
  flaw?: string;
  keywords?: string[];
}

interface NpcStats {
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
}

interface WorldNpcRecord {
  id: string;
  name: string;
  created_at: string;
  bio?: string;
  backstory?: string;
  traits?: NpcTraits | null;
  stats?: NpcStats | null;
  location_id?: string | null;
  image_url?: string | null;
  affiliations?: unknown[];
  relationships?: Record<string, unknown>;
}

interface NpcQualityCheck {
  id: string;
  label: string;
  pass: boolean;
}

type QualityTier = 'excellent' | 'solid' | 'needs-review';

interface NpcQualitySummary {
  score: number;
  tier: QualityTier;
  checks: NpcQualityCheck[];
  warnings: string[];
  contextSignals: string[];
  traits: NpcTraits;
  stats: NpcStats;
  summary?: NpcSummary;
}

const CONTEXT_KEYWORDS = ['village', 'city', 'district', 'guild', 'order', 'temple', 'clan', 'faction', 'fort', 'port', 'festival', 'tavern'];
const HOOK_KEYWORDS = ['perform', 'stage', 'crowd', 'song', 'story', 'wander', 'tongue', 'bard', 'actor', 'cabal', 'secret'];

const evaluateNpcQuality = (npc: WorldNpcRecord): NpcQualitySummary => {
  const traits = npc.traits ?? {};
  const stats = npc.stats ?? {};
  const summary = traits.summary;
  const bioText = npc.bio ?? '';
  const backstoryText = npc.backstory ?? '';
  const combined = `${bioText} ${backstoryText}`.toLowerCase();

  const contextSignals = CONTEXT_KEYWORDS.filter((keyword) => combined.includes(keyword));
  const hasHook = HOOK_KEYWORDS.some((keyword) => combined.includes(keyword));

  const checks: NpcQualityCheck[] = [
    { id: 'bio', label: 'Bio (≥ 80 chars)', pass: bioText.length >= 80 },
    { id: 'backstory', label: 'Backstory depth (≥ 250 chars)', pass: backstoryText.length >= 250 },
    { id: 'summary', label: 'One-liner present', pass: Boolean(summary?.oneLiner && summary.oneLiner.length >= 40) },
    { id: 'keypoints', label: '3–5 key points', pass: Boolean(summary?.keyPoints && summary.keyPoints.length >= 3) },
    { id: 'hooks', label: 'Actionable hook keywords', pass: hasHook },
  ];

  const score = Math.round((checks.filter((c) => c.pass).length / checks.length) * 100);
  const tier: QualityTier = score >= 85 ? 'excellent' : score >= 65 ? 'solid' : 'needs-review';

  const warnings: string[] = [];
  if (contextSignals.length === 0) warnings.push('No location or faction references detected.');
  if (!summary?.keyPoints || summary.keyPoints.length < 3) warnings.push('Add more quick-reference key points.');

  return {
    score,
    tier,
    checks,
    warnings,
    contextSignals,
    traits,
    stats,
    summary,
  };
};

interface WorldClientProps {
  worldId: string;
}

const UTC_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  timeZone: 'UTC',
};

const UTC_DATETIME_OPTIONS: Intl.DateTimeFormatOptions = {
  ...UTC_DATE_OPTIONS,
  hour: '2-digit',
  minute: '2-digit',
  timeZoneName: 'short',
};

const formatDateOnly = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Invalid date';
  }
  return new Intl.DateTimeFormat('en-US', UTC_DATE_OPTIONS).format(date);
};

const formatDateTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Invalid date';
  }
  return new Intl.DateTimeFormat('en-US', UTC_DATETIME_OPTIONS).format(date);
};

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
  const [worldDungeons, setWorldDungeons] = useState<Array<{ id: string; name: string; created_at: string; detail: unknown }>>([]);
  const [status, setStatus] = useState<string>("");
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const [activeTab, setActiveTab] = useState<'npc-generator' | 'npcs' | 'locations' | 'items' | 'dungeons'>('npc-generator');
  const [isRenamingWorld, setIsRenamingWorld] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [savingWorldName, setSavingWorldName] = useState(false);
  const [showWorldMenu, setShowWorldMenu] = useState(false);
  const worldMenuRef = useRef<HTMLDivElement | null>(null);
  const npcSelectAllRef = useRef<HTMLInputElement | null>(null);

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

  const pushToast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      setToast({ message, variant });
    },
    [],
  );

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
      .select('id,name,created_at,bio,backstory,traits,stats,location_id,image_url')
      .eq('world_id', worldId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error loading world NPCs:', error);
    } else {
      setWorldNpcs((data as WorldNpcRecord[]) || []);
    }
  }, [supabase, worldId]);

  const loadWorldDungeons = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('world_element')
      .select('id,name,created_at,detail')
      .eq('world_id', worldId)
      .eq('type', 'dungeon')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error loading dungeons:', error);
    } else {
      setWorldDungeons((data || []) as Array<{ id: string; name: string; created_at: string; detail: unknown }>);
    }
  }, [supabase, worldId]);

  useEffect(() => {
    if (!supabase) return;
    
    loadWorld();
    loadWorldNpcs();
    loadWorldDungeons();
  }, [supabase, worldId, loadWorld, loadWorldNpcs, loadWorldDungeons]);
  
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

  const filterAndSortNpcs = () => {
    return worldNpcs
      .filter((n) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        const traits = n.traits as NpcTraits | undefined;
        const stats = n.stats as NpcStats | undefined;
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
          const aStats = a.stats as NpcStats | undefined;
          const bStats = b.stats as NpcStats | undefined;
          aVal = aStats?.level ?? 0;
          bVal = bStats?.level ?? 0;
        } else if (sortBy === 'race') {
          const aTraits = a.traits as NpcTraits | undefined;
          const bTraits = b.traits as NpcTraits | undefined;
          aVal = aTraits?.race ?? '';
          bVal = bTraits?.race ?? '';
        } else {
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
        }

        if (sortOrder === 'asc') {
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        }
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      });
  };

  const renderNpcDetailView = () => {
    if (!selectedNpc) return null;
    const filtered = filterAndSortNpcs();
    const currentIndex = filtered.findIndex((npc) => npc.id === selectedNpcId);
    const quality = evaluateNpcQuality(selectedNpc);
    const traits = quality.traits;
    const stats = quality.stats;

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
              onClick={() => currentIndex > 0 && setSelectedNpcId(filtered[currentIndex - 1].id)}
              disabled={currentIndex === 0}
              className="px-3 py-1.5 rounded-md border border-gray-700 bg-gray-900/50 text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            <span className="text-sm text-gray-400">
              {currentIndex + 1} / {filtered.length}
            </span>
            <button
              onClick={() => currentIndex < filtered.length - 1 && setSelectedNpcId(filtered[currentIndex + 1].id)}
              disabled={currentIndex === filtered.length - 1}
              className="px-3 py-1.5 rounded-md border border-gray-700 bg-gray-900/50 text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>

        <div className="surface-card p-6">
          <div className="grid gap-6 lg:grid-cols-3">
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

            <div className="lg:col-span-1 space-y-6">
            <div className="surface-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-medium">Quality Review</h2>
                  <span
                    className={`text-xs px-3 py-1 rounded-full ${
                      quality.tier === 'excellent'
                        ? 'bg-green-500/15 text-green-300 border border-green-500/30'
                        : quality.tier === 'solid'
                        ? 'bg-amber-500/15 text-amber-200 border border-amber-500/30'
                        : 'bg-red-500/15 text-red-300 border border-red-500/30'
                    }`}
                  >
                    Score {quality.score}%
                  </span>
                </div>
                <div className="space-y-2">
                  {quality.checks.map((check) => (
                    <div key={check.id} className="flex items-center gap-2 text-sm">
                      <span className={`w-2 h-2 rounded-full ${check.pass ? 'bg-green-400' : 'bg-gray-500'}`} />
                      <span className={check.pass ? 'text-gray-200' : 'text-gray-500'}>{check.label}</span>
                    </div>
                  ))}
                </div>
                {quality.warnings.length > 0 && (
                  <div className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200 space-y-1">
                    {quality.warnings.map((warning, idx) => (
                      <p key={idx}>• {warning}</p>
                    ))}
                  </div>
                )}
                {quality.contextSignals.length > 0 && (
                  <p className="mt-2 text-xs text-gray-400">Context mentions: {quality.contextSignals.join(', ')}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/report-error?item_type=npc&item_name=${encodeURIComponent(selectedNpc.name)}`}
                    className="flex-1 rounded-md border border-gray-700 px-3 py-2 text-xs text-center text-gray-200 hover:bg-gray-800 transition-colors"
                  >
                    Report Issue
                  </Link>
                  <Link
                    href="/admin/qc-feedback"
                    className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-xs text-center text-white hover:bg-blue-700 transition-colors"
                  >
                    QC Dashboard
                  </Link>
                </div>
              </div>

              <div className="surface-card p-4">
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

              <div className="surface-card p-4">
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
                              {weapon.toHit !== undefined && <span>To Hit: {weapon.toHit >= 0 ? '+' : ''}{weapon.toHit}</span>}
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
                </div>
              </div>

              <div className="surface-card p-4">
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
                      // Delete portrait from storage if it exists
                      if (selectedNpc.image_url) {
                        try {
                          const urlParts = selectedNpc.image_url.split('/npc-portraits/');
                          if (urlParts.length > 1) {
                            const fileName = `npc-portraits/${urlParts[1]}`;
                            await supabase.storage.from('npc-assets').remove([fileName]);
                          }
                        } catch (storageError) {
                          console.warn('Failed to delete portrait from storage:', storageError);
                          // Continue with NPC deletion
                        }
                      }
                      
                      const { error } = await supabase.from('world_npc').delete().eq('id', selectedNpc.id);
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
  };

  const renderNpcListView = () => {
    const filtered = filterAndSortNpcs();
    const npcSelectAllChecked = filtered.length > 0 && filtered.every((npc) => selectedNpcs.has(npc.id));
    if (npcSelectAllRef.current) {
      npcSelectAllRef.current.indeterminate = selectedNpcs.size > 0 && !npcSelectAllChecked;
    }

    return (
      <>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search NPCs by name, race, class..."
              className="w-full rounded-md border border-gray-700 bg-gray-900/50 p-2.5 text-sm outline-none focus:border-blue-600 transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="rounded-md border border-gray-700 bg-gray-900/50 p-2.5 text-sm outline-none focus:border-blue-600 transition-colors"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
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
          </div>
        </div>

        {selectedNpcs.size > 0 && (
          <div className="surface-card flex items-center justify-between p-4 mb-4">
            <span className="text-sm text-gray-300">
              {selectedNpcs.size} NPC{selectedNpcs.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={async () => {
                if (!supabase) return;
                if (!confirm(`Delete ${selectedNpcs.size} NPC${selectedNpcs.size !== 1 ? 's' : ''}? This cannot be undone.`)) return;
                setStatus('Deleting NPCs...');
                try {
                  const ids = Array.from(selectedNpcs);
                  
                  // Get NPCs with image URLs to delete from storage
                  const { data: npcsToDelete } = await supabase
                    .from('world_npc')
                    .select('id, image_url')
                    .in('id', ids);
                  
                  // Delete portraits from storage
                  if (npcsToDelete) {
                    const filesToDelete = npcsToDelete
                      .filter((npc) => npc.image_url)
                      .map((npc) => {
                        const urlParts = npc.image_url?.split('/npc-portraits/');
                        if (urlParts && urlParts.length > 1) {
                          return `npc-portraits/${urlParts[1]}`;
                        }
                        return null;
                      })
                      .filter((f): f is string => f !== null);
                    
                    if (filesToDelete.length > 0) {
                      try {
                        await supabase.storage.from('npc-assets').remove(filesToDelete);
                      } catch (storageError) {
                        console.warn('Failed to delete some portraits from storage:', storageError);
                        // Continue with NPC deletion
                      }
                    }
                  }
                  
                  // Delete NPC records
                  await Promise.all(ids.map((id) => supabase.from('world_npc').delete().eq('id', id)));
                  setStatus(`${ids.length} NPC${ids.length !== 1 ? 's' : ''} deleted`);
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

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-8 text-center">
            <p className="text-gray-400">No NPCs match the current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900/30">
            <table className="min-w-full divide-y divide-gray-800 text-sm">
              <thead className="bg-gray-900/60 text-gray-400">
                <tr>
                  <th className="px-4 py-3">
                    <input
                      ref={npcSelectAllRef}
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-600 bg-gray-900 text-blue-500 focus:ring-blue-500"
                      checked={npcSelectAllChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedNpcs(new Set(filtered.map((npc) => npc.id)));
                        } else {
                          setSelectedNpcs(new Set());
                        }
                      }}
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">Portrait</th>
                  <th className="px-4 py-3 text-left font-semibold">Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Race</th>
                  <th className="px-4 py-3 text-left font-semibold">Class</th>
                  <th className="px-4 py-3 text-left font-semibold">Level</th>
                  <th className="px-4 py-3 text-left font-semibold">Created</th>
                  <th className="px-4 py-3 text-left font-semibold">Quality</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-gray-200">
                {filtered.map((npc) => {
                  const quality = evaluateNpcQuality(npc);
                  const traits = quality.traits;
                  const stats = quality.stats;
                  return (
                    <tr key={npc.id} className="bg-gray-900/30 hover:bg-gray-900/60">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-600 bg-gray-900 text-blue-500 focus:ring-blue-500"
                          checked={selectedNpcs.has(npc.id)}
                          onChange={(e) => {
                            const updated = new Set(selectedNpcs);
                            if (e.target.checked) {
                              updated.add(npc.id);
                            } else {
                              updated.delete(npc.id);
                            }
                            setSelectedNpcs(updated);
                          }}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-12 h-12 rounded-lg border border-gray-800 bg-gray-900/50 overflow-hidden flex-shrink-0 relative">
                          {npc.image_url ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={npc.image_url}
                                alt={npc.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // If image fails to load, show placeholder
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent && !parent.querySelector('.image-placeholder')) {
                                    const placeholder = document.createElement('div');
                                    placeholder.className = 'image-placeholder absolute inset-0 w-full h-full bg-gray-800 flex items-center justify-center';
                                    placeholder.innerHTML = '<span class="text-gray-600 text-xs">—</span>';
                                    parent.appendChild(placeholder);
                                  }
                                  console.error('Failed to load NPC image:', npc.image_url);
                                }}
                                onLoad={() => {
                                  console.log('NPC image loaded successfully:', npc.image_url);
                                }}
                              />
                              {/* Fallback placeholder (hidden if image loads) */}
                              <div className="image-placeholder absolute inset-0 w-full h-full bg-gray-800 flex items-center justify-center pointer-events-none" style={{ display: 'none' }}>
                                <span className="text-gray-600 text-xs">—</span>
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                              <span className="text-gray-600 text-xs">—</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{npc.name}</div>
                        <div className="text-xs text-gray-500">{formatDateTime(npc.created_at)}</div>
                      </td>
                      <td className="px-4 py-3">{traits.race || '-'}</td>
                      <td className="px-4 py-3">{traits.class || '-'}</td>
                      <td className="px-4 py-3">{stats.level ?? 0}</td>
                      <td className="px-4 py-3 text-gray-400">{formatDateOnly(npc.created_at)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            quality.tier === 'excellent'
                              ? 'bg-green-500/15 text-green-200 border border-green-500/30'
                              : quality.tier === 'solid'
                              ? 'bg-amber-500/15 text-amber-200 border border-amber-500/30'
                              : 'bg-red-500/15 text-red-200 border border-red-500/30'
                          }`}
                        >
                          {quality.score}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();

                              const targetPath = `/world/world/npc/npc/?worldId=${encodeURIComponent(
                                worldId
                              )}&npcId=${encodeURIComponent(npc.id)}`;

                              console.log('[Navigation] View button clicked', {
                                worldId,
                                npcId: npc.id,
                                npcName: npc.name,
                                targetUrl: targetPath,
                              });

                              sessionStorage.setItem('npcView_worldId', worldId);
                              sessionStorage.setItem('npcView_npcId', npc.id);

                              window.location.href = targetPath;
                            }}
                            className="rounded border border-gray-700 px-3 py-1 text-xs hover:bg-gray-800"
                          >
                            View
                          </button>
                          <button
                            onClick={async () => {
                              if (!supabase) return;
                              if (!confirm(`Delete NPC "${npc.name}"? This cannot be undone.`)) return;
                              setStatus('Deleting NPC...');
                              try {
                                // Delete portrait from storage if it exists
                                if (npc.image_url) {
                                  try {
                                    const urlParts = npc.image_url.split('/npc-portraits/');
                                    if (urlParts.length > 1) {
                                      const fileName = `npc-portraits/${urlParts[1]}`;
                                      await supabase.storage.from('npc-assets').remove([fileName]);
                                    }
                                  } catch (storageError) {
                                    console.warn('Failed to delete portrait from storage:', storageError);
                                    // Continue with NPC deletion even if storage deletion fails
                                  }
                                }
                                
                                const { error } = await supabase.from('world_npc').delete().eq('id', npc.id);
                                if (error) throw error;
                                setStatus(`NPC "${npc.name}" deleted`);
                                setSelectedNpcs((prev) => {
                                  const updated = new Set(prev);
                                  updated.delete(npc.id);
                                  return updated;
                                });
                                loadWorldNpcs();
                              } catch (e: unknown) {
                                const message = e instanceof Error ? e.message : String(e);
                                setStatus(`Delete failed: ${message}`);
                              }
                            }}
                            className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </>
    );
  };

  const renderNpcTabContent = () => {
    if (worldNpcs.length === 0) {
      return (
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-8 text-center">
          <p className="text-gray-400">No world NPCs yet. Generate your first NPC using the NPC Generator tab.</p>
        </div>
      );
    }
    if (viewMode === 'detail' && selectedNpc) {
      return renderNpcDetailView();
    }
    return renderNpcListView();
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
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm border-b border-gray-800">
        <div className="app-shell app-shell--wide app-shell--bleed py-4">
          <div className="flex items-center justify-between mb-2">
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-300">← Back to Worlds</Link>
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
                  <path d="M16.862 3.487a2.25 2.25 0 113.182 3.182L7.5 19.313 3 21l1.688-4.5L16.862 3.487z" />
                  <path d="M12.5 7l4.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
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
        <div className="app-shell app-shell--wide app-shell--bleed">
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
            <button
              onClick={() => setActiveTab('dungeons')}
              className={`px-4 py-3 text-sm font-medium transition-colors touch-manipulation whitespace-nowrap ${
                activeTab === 'dungeons'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Dungeons ({worldDungeons.length})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="app-shell app-shell--wide py-6">
        {activeTab === 'npc-generator' && (
          <div className="space-y-6">
            {/* NPC Generator */}
            <div className="surface-card p-4 sm:p-6">
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
                      // Parse keywords: split on commas/newlines, but preserve phrases
                      // If no commas/newlines, treat entire input as single tag
                      const keywordTags = npcForm.keywords.trim()
                        ? npcForm.keywords.includes(',') || npcForm.keywords.includes('\n')
                          ? npcForm.keywords.split(/[,\n]+/)
                              .map(tag => tag.trim())
                              .filter(tag => tag.length > 0)
                          : [npcForm.keywords.trim()] // Single phrase as one tag
                        : [];

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
            {renderNpcTabContent()}
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

        {activeTab === 'dungeons' && (
          <DungeonsTab
            worldId={worldId}
            worldName={world?.name || 'Dungeon'}
            dungeons={worldDungeons}
            onGenerate={async () => {
              await loadWorldDungeons();
            }}
            status={status}
            setStatus={setStatus}
            supabase={supabase as ReturnType<typeof createClient>}
            loadWorldDungeons={loadWorldDungeons}
            pushToast={pushToast}
          />
        )}
      </div>
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}

// Dungeons Tab Component
function DungeonsTab({
  worldId,
  worldName,
  dungeons,
  onGenerate,
  status,
  setStatus,
  supabase,
  loadWorldDungeons,
  pushToast,
}: {
  worldId: string;
  worldName: string;
  dungeons: Array<{ id: string; name: string; created_at: string; detail: unknown }>;
  onGenerate: () => Promise<void>;
  status: string;
  setStatus: (s: string) => void;
  supabase: ReturnType<typeof createClient>;
  loadWorldDungeons: () => Promise<void>;
  pushToast: (message: string, variant?: ToastVariant) => void;
}) {
  const [viewMode, setViewMode] = useState<'generator' | 'list' | 'detail'>('generator');
  const [selectedDungeon, setSelectedDungeon] = useState<{ id: string; name: string; created_at: string; detail: unknown } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewDungeon, setPreviewDungeon] = useState<PreviewDungeonState | null>(null);
  const [generationHistory, setGenerationHistory] = useState<PreviewDungeonState[]>([]);
  const [exportDrawerOpen, setExportDrawerOpen] = useState(false);
  const [selectedDungeons, setSelectedDungeons] = useState<Set<string>>(new Set());
  const dungeonSelectAllRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!dungeonSelectAllRef.current) return;
    dungeonSelectAllRef.current.indeterminate =
      selectedDungeons.size > 0 && selectedDungeons.size < dungeons.length;
  }, [selectedDungeons, dungeons.length]);

  useEffect(() => {
    if (!previewDungeon) {
      setExportDrawerOpen(false);
    }
  }, [previewDungeon]);

  const handleGenerate = async (params: { name?: string } & DungeonGenerationParams) => {
    setIsGenerating(true);
    setStatus('Generating preview...');
    try {
      const resolvedName =
        params.name && params.name.trim().length > 0
          ? params.name
          : generateDungeonName(params.theme ?? 'dungeon', params.difficulty ?? 'medium', worldName);
      const res = await fetch('/api/generate-dungeon', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          world_id: worldId,
          name: resolvedName,
          params: { ...params, name: resolvedName },
          preview: true,
        }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }
      const data = await res.json();
      const detail = data.dungeon as DungeonDetail;
      const previewId = (crypto as Crypto | undefined)?.randomUUID?.() ?? `preview-${Date.now()}`;
      const createdAt = new Date().toISOString();
      const entry: PreviewDungeonState = {
        id: previewId,
        name: resolvedName || detail.identity.name || 'Preview Dungeon',
        created_at: createdAt,
        detail,
        params: { ...params, name: resolvedName },
        saved: false,
      };
      setPreviewDungeon(entry);
      setGenerationHistory((prev) => [entry, ...prev].slice(0, 5));
      setStatus('Preview generated. Save when ready.');
      pushToast('Preview generated. Review before saving.', 'info');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      const errorMessage = `Generation failed: ${message}`;
      setStatus(errorMessage);
      pushToast(errorMessage, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const selectAllDungeonsChecked = dungeons.length > 0 && dungeons.every((dungeon) => selectedDungeons.has(dungeon.id));

  const handleBulkDeleteDungeons = async () => {
    if (!supabase || selectedDungeons.size === 0) return;
    if (!confirm(`Delete ${selectedDungeons.size} dungeon${selectedDungeons.size !== 1 ? 's' : ''}? This cannot be undone.`)) return;
    setStatus('Deleting dungeons...');
    try {
      const ids = Array.from(selectedDungeons);
      const { error } = await supabase.from('world_element').delete().in('id', ids);
      if (error) throw error;
      const successMessage = `${ids.length} dungeon${ids.length !== 1 ? 's' : ''} deleted`;
      setStatus(successMessage);
      pushToast(successMessage, 'success');
      setSelectedDungeons(new Set());
      await loadWorldDungeons();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const errorMessage = `Delete failed: ${message}`;
      setStatus(errorMessage);
      pushToast(errorMessage, 'error');
    }
  };

  if (viewMode === 'detail' && selectedDungeon) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => {
            setViewMode('list');
            setSelectedDungeon(null);
          }}
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          ← Back to list
        </button>
        <DungeonDetailView
          dungeon={selectedDungeon.detail as DungeonDetail}
        />
      </div>
    );
  }

  if (viewMode === 'generator') {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <button
            onClick={() => setViewMode('list')}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            View Dungeons ({dungeons.length})
          </button>
        </div>
        <div className="grid gap-4 lg:grid-cols-[0.32fr_0.68fr] items-start">
          <div className="space-y-3">
            <DungeonGenerator worldId={worldId} onGenerate={handleGenerate} isGenerating={isGenerating} />
            {status && (
              <div
                className={`rounded-lg border p-4 ${
                  status.includes('failed') || status.includes('Error')
                    ? 'border-red-800 bg-red-900/20 text-red-300'
                    : 'border-blue-800 bg-blue-900/20 text-blue-300'
                }`}
              >
                <p className="text-sm">{status}</p>
              </div>
            )}
          </div>
          <div className="space-y-4">
            {previewDungeon ? (
              <div className="space-y-3 rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-100">
                    {previewDungeon.name || 'Previewed Dungeon'}
                  </h3>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      onClick={() => {
                        setSelectedDungeon({
                          id: previewDungeon.id,
                          name: previewDungeon.name,
                          created_at: previewDungeon.created_at,
                          detail: previewDungeon.detail,
                        });
                        setViewMode('detail');
                      }}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      View Details →
                    </button>
                    <button
                      onClick={() => setPreviewDungeon(null)}
                      className="text-gray-400 hover:text-gray-200"
                    >
                      Discard
                    </button>
                  </div>
                </div>
                <DungeonDetailView dungeon={previewDungeon.detail} compact={true} showControls={false} />
                <div className="flex flex-wrap gap-2">
                  <button
                    disabled={isSaving || previewDungeon.saved}
                    onClick={async () => {
                      if (!previewDungeon) return;
                      setIsSaving(true);
                      setStatus('Saving dungeon...');
                      try {
                        const res = await fetch('/api/generate-dungeon', {
                          method: 'POST',
                          headers: { 'content-type': 'application/json' },
                          body: JSON.stringify({
                            world_id: worldId,
                            name: previewDungeon.name,
                            params: previewDungeon.params,
                            detail: previewDungeon.detail,
                          }),
                        });
                        if (!res.ok) {
                          const errorText = await res.text();
                          throw new Error(errorText);
                        }
                        const data = await res.json();
                        const successMessage = 'Dungeon saved successfully!';
                        setStatus(successMessage);
                        pushToast(successMessage, 'success');
                        await onGenerate();
                        const previousId = previewDungeon.id;
                        const savedPreview = {
                          ...previewDungeon,
                          id: data.dungeon_id || previewDungeon.id,
                          created_at: new Date().toISOString(),
                          detail: (data.dungeon as DungeonDetail) || previewDungeon.detail,
                          saved: true,
                        };
                        setPreviewDungeon(savedPreview);
                        setGenerationHistory((prev) =>
                          prev.map((entry) => (entry.id === previousId ? savedPreview : entry))
                        );
                      } catch (err) {
                        const message = err instanceof Error ? err.message : String(err);
                        const errorMessage = `Save failed: ${message}`;
                        setStatus(errorMessage);
                        pushToast(errorMessage, 'error');
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                    className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {previewDungeon.saved ? 'Saved' : isSaving ? 'Saving...' : 'Save Dungeon'}
                  </button>
                  <button
                    onClick={() => setExportDrawerOpen(true)}
                    className="rounded border border-gray-700 px-4 py-2 text-sm font-medium text-gray-100 hover:bg-gray-800"
                  >
                    Export…
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-700 p-6 text-center text-sm text-gray-500">
                Generate to see a live preview here.
              </div>
            )}
            {generationHistory.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-300">Recent Runs</h3>
                  <span className="text-xs text-gray-500">Showing {generationHistory.length}</span>
                </div>
                <div className="space-y-2">
                  {generationHistory.map((entry) => (
                    <div
                      key={`${entry.id}-${entry.created_at}`}
                      className="flex items-center justify-between rounded-lg border border-gray-800/70 bg-gray-900/40 p-2 text-xs"
                    >
                      <div>
                        <p className="font-medium text-gray-100">{entry.name}</p>
                        <p className="text-gray-500">{formatDateTime(entry.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setPreviewDungeon(entry);
                          }}
                          className="rounded border border-gray-700 px-2 py-1 text-gray-200 hover:bg-gray-800"
                        >
                          Load
                        </button>
                        <button
                          disabled={isGenerating}
                          onClick={() => handleGenerate(entry.params)}
                          className="rounded bg-blue-600 px-2 py-1 text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          Regenerate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {previewDungeon && (
          <DungeonExportDrawer
            open={exportDrawerOpen}
            dungeon={previewDungeon.detail}
            onClose={() => setExportDrawerOpen(false)}
            pushToast={pushToast}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-100">Dungeons</h2>
        <button
          onClick={() => setViewMode('generator')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors"
        >
          Generate New
        </button>
      </div>

      {selectedDungeons.size > 0 && (
        <div className="surface-card flex items-center justify-between p-4">
          <span className="text-sm text-gray-300">
            {selectedDungeons.size} dungeon{selectedDungeons.size !== 1 ? 's' : ''} selected
          </span>
          <button
            onClick={handleBulkDeleteDungeons}
            className="px-4 py-2 rounded-md bg-red-600 text-sm font-medium text-white hover:bg-red-700 active:bg-red-800 transition-colors"
          >
            Delete Selected
          </button>
        </div>
      )}

      {dungeons.length === 0 ? (
        <div className="surface-card p-8 text-center">
          <p className="text-gray-400">No dungeons yet. Generate your first dungeon!</p>
          <button
            onClick={() => setViewMode('generator')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors"
          >
            Generate Dungeon
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900/30">
          <table className="min-w-full divide-y divide-gray-800 text-sm">
            <thead className="bg-gray-900/60 text-gray-400">
              <tr>
                <th className="px-4 py-3">
                  <input
                    ref={dungeonSelectAllRef}
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-600 bg-gray-900 text-blue-500 focus:ring-blue-500"
                    checked={selectAllDungeonsChecked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDungeons(new Set(dungeons.map((d) => d.id)));
                      } else {
                        setSelectedDungeons(new Set());
                      }
                    }}
                  />
                </th>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">Created</th>
                <th className="px-4 py-3 text-left font-semibold">Type & Theme</th>
                <th className="px-4 py-3 text-left font-semibold">Levels</th>
                <th className="px-4 py-3 text-left font-semibold">Rooms</th>
                <th className="px-4 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-gray-200">
              {dungeons.map((dungeon) => {
                const detail = dungeon.detail as DungeonDetail | null;
                const levelCount = detail ? detail.structure.levels.length : '-';
                const roomCount = detail
                  ? detail.structure.levels.reduce((sum: number, level: DungeonLevel) => sum + level.rooms.length, 0)
                  : '-';
                return (
                  <tr key={dungeon.id} className="bg-gray-900/30 hover:bg-gray-900/60">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-600 bg-gray-900 text-blue-500 focus:ring-blue-500"
                        checked={selectedDungeons.has(dungeon.id)}
                        onChange={(e) => {
                          const updated = new Set(selectedDungeons);
                          if (e.target.checked) {
                            updated.add(dungeon.id);
                          } else {
                            updated.delete(dungeon.id);
                          }
                          setSelectedDungeons(updated);
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setSelectedDungeon(dungeon);
                          setViewMode('detail');
                        }}
                        className="text-left text-blue-300 hover:text-blue-200"
                      >
                        {dungeon.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{formatDateOnly(dungeon.created_at)}</td>
                    <td className="px-4 py-3">
                      {detail ? `${detail.identity.type} • ${detail.identity.theme}` : '—'}
                    </td>
                    <td className="px-4 py-3">{levelCount}</td>
                    <td className="px-4 py-3">{roomCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setSelectedDungeon(dungeon);
                            setViewMode('detail');
                          }}
                          className="rounded border border-gray-700 px-3 py-1 text-xs hover:bg-gray-800"
                        >
                          View
                        </button>
                        <button
                          onClick={async () => {
                            if (!supabase) return;
                            if (!confirm(`Delete "${dungeon.name}"? This cannot be undone.`)) return;
                            try {
                              const { error } = await supabase.from('world_element').delete().eq('id', dungeon.id);
                              if (error) throw error;
                              setSelectedDungeons((prev) => {
                                const updated = new Set(prev);
                                updated.delete(dungeon.id);
                                return updated;
                              });
                              await loadWorldDungeons();
                              const successMessage = 'Dungeon deleted successfully';
                              setStatus(successMessage);
                              pushToast(successMessage, 'success');
                            } catch (err) {
                              const errorMessage = `Error deleting dungeon: ${err instanceof Error ? err.message : 'Unknown error'}`;
                              setStatus(errorMessage);
                              pushToast(errorMessage, 'error');
                            }
                          }}
                          className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

