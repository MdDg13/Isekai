"use client";

import { createClient } from "@supabase/supabase-js";
import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import NPCPortrait from "../../../../../components/npc/NPCPortrait";

interface NPCDetailPageProps {
  worldId: string;
  npcId: string;
}

type TabType = 'overview' | 'stats' | 'personality' | 'backstory' | 'details';

export default function NPCDetailPage({ worldId, npcId }: NPCDetailPageProps) {
  console.log('[NPCDetailPage] Component rendered with:', { worldId, npcId });
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      console.warn('[NPCDetailPage] Supabase environment variables not found');
      return null;
    }
    console.log('[NPCDetailPage] Supabase client created');
    return createClient(url, key);
  }, []);

  const [npc, setNpc] = useState<{
    id: string;
    name: string;
    bio?: string;
    backstory?: string;
    traits?: unknown;
    stats?: unknown;
    image_url?: string | null;
    voice_id?: string | null;
    created_at: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const loadNPC = useCallback(async () => {
    console.log('[NPCDetailPage] loadNPC called with:', { supabase: !!supabase, npcId });
    if (!supabase || !npcId) {
      console.warn('[NPCDetailPage] Cannot load NPC - missing supabase or npcId');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    console.log('[NPCDetailPage] Fetching NPC from database...');
    const { data, error: err } = await supabase
      .from('world_npc')
      .select('*')
      .eq('id', npcId)
      .single();
    
    if (err) {
      console.error('[NPCDetailPage] Error loading NPC:', err);
      setError(`Error loading NPC: ${err.message}`);
    } else {
      console.log('[NPCDetailPage] NPC loaded successfully:', { id: data?.id, name: data?.name });
      setNpc(data);
    }

    setLoading(false);
  }, [supabase, npcId]);

  useEffect(() => {
    loadNPC();
  }, [loadNPC]);

  const handleRegeneratePortrait = useCallback(async () => {
    if (!supabase || !npc) return;
    
    try {
      // Call Cloudflare Pages Function to regenerate portrait
      const apiUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : process.env.NEXT_PUBLIC_API_URL || 'https://isekai-f2i.pages.dev';
      const response = await fetch(`${apiUrl}/api/regenerate-npc-portrait`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ npcId: npc.id, worldId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to regenerate portrait');
      }
      
      // Reload NPC to get new image URL
      await loadNPC();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setError(`Failed to regenerate portrait: ${message}`);
    }
  }, [supabase, npc, worldId, loadNPC]);

  const handleDelete = useCallback(async () => {
    if (!supabase || !npc) return;
    if (!confirm(`Delete ${npc.name}? This cannot be undone.`)) return;
    
    setDeleting(true);
    try {
      // Delete portrait from storage if it exists
      if (npc.image_url) {
        try {
          // Extract path from URL (format: https://...supabase.co/storage/v1/object/public/npc-assets/npc-portraits/{id}.png)
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
      
      // Delete NPC record
      const { error: deleteError } = await supabase
        .from('world_npc')
        .delete()
        .eq('id', npcId)
        .eq('world_id', worldId);
      
      if (deleteError) {
        throw deleteError;
      }
      
      console.log('[NPCDetailPage] NPC deleted, redirecting to world page');
      window.location.href = `/world/world/?worldId=${worldId}`;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setError(`Failed to delete NPC: ${message}`);
      setDeleting(false);
    }
  }, [supabase, npc, npcId, worldId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading NPC...</p>
        </div>
      </div>
    );
  }

  if (error || !npc) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'NPC not found'}</p>
          <Link href={`/world/world/?worldId=${worldId}`} className="text-blue-400 hover:text-blue-300 underline">
            Back to World
          </Link>
        </div>
      </div>
    );
  }

  const traits = npc.traits as {
    race?: string;
    class?: string;
    background?: string;
    temperament?: string;
    personalityTraits?: string[];
    ideal?: string;
    bond?: string;
    flaw?: string;
    keywords?: string[];
    summary?: {
      oneLiner?: string;
      keyPoints?: string[];
    };
  } | undefined;
  
  const summary = traits?.summary;

  const stats = npc.stats as {
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
      weapons?: Array<{ name?: string; type?: string; damage?: string; damageType?: string; toHit?: number; damageBonus?: number; range?: string; }>;
    };
  } | undefined;

  const tabs: Array<{ id: TabType; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'stats', label: 'Stats & Combat' },
    { id: 'personality', label: 'Personality' },
    { id: 'backstory', label: 'Backstory' },
    { id: 'details', label: 'Details' },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm border-b border-gray-800">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link href={`/world/world/?worldId=${worldId}`} className="text-blue-400 hover:text-blue-300 text-sm underline">
                ← Back to World
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-display">{npc.name}</h1>
                {traits?.race && traits?.class && (
                  <p className="text-xs text-gray-400 mt-1">
                    {traits.race} {traits.class} {stats?.level ? `• Level ${stats.level}` : ''}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-md bg-red-600 text-sm font-medium text-white hover:bg-red-700 active:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete NPC'}
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-800">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Left Sidebar - Portrait */}
          <div className="space-y-4">
            <NPCPortrait
              imageUrl={npc.image_url ?? null}
              npcName={npc.name}
              onRegenerate={handleRegeneratePortrait}
              size="large"
              showRegenerate={true}
            />
            
            {/* Quick Info Card */}
            <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Quick Info</h3>
              <div className="space-y-2 text-sm">
                {traits?.race && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Race:</span>
                    <span className="text-gray-300 capitalize">{traits.race}</span>
                  </div>
                )}
                {traits?.class && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Class:</span>
                    <span className="text-gray-300">{traits.class}</span>
                  </div>
                )}
                {stats?.level !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Level:</span>
                    <span className="text-gray-300 font-medium">{stats.level}</span>
                  </div>
                )}
                {traits?.background && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Background:</span>
                    <span className="text-gray-300">{traits.background}</span>
                  </div>
                )}
                {traits?.temperament && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Temperament:</span>
                    <span className="text-gray-300 capitalize">{traits.temperament}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area - Tab Content */}
          <div className="space-y-6">
            {activeTab === 'overview' && (
              <>
                {/* Bio */}
                {npc.bio && (
                  <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
                    <h2 className="text-lg font-semibold mb-3">Quick Reference</h2>
                    <p className="text-sm text-gray-300 leading-relaxed">{npc.bio}</p>
                  </div>
                )}

                {/* Summary */}
                {summary && (
                  <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
                    <h2 className="text-lg font-semibold mb-3">Summary</h2>
                    {summary.oneLiner && (
                      <p className="text-sm text-gray-300 leading-relaxed mb-4">
                        {summary.oneLiner}
                      </p>
                    )}
                    {summary.keyPoints && summary.keyPoints.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Key Points</p>
                        <ul className="space-y-2">
                          {summary.keyPoints.map((point, i) => (
                            <li key={i} className="text-sm text-gray-300 flex items-start">
                              <span className="text-blue-400 mr-2">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Keywords */}
                {traits?.keywords && traits.keywords.length > 0 && (
                  <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
                    <h2 className="text-lg font-semibold mb-3">Keywords</h2>
                    <div className="flex flex-wrap gap-2">
                      {traits.keywords.map((kw, i) => (
                        <span key={i} className="text-xs bg-gray-800 text-gray-300 px-3 py-1.5 rounded-md">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'stats' && (
              <div className="space-y-6">
                {/* Ability Scores */}
                {stats?.abilities && (
                  <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
                    <h2 className="text-lg font-semibold mb-4">Ability Scores</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {Object.entries(stats.abilities).map(([key, value]) => {
                        const mod = Math.floor((value - 10) / 2);
                        return (
                          <div key={key} className="text-center p-3 bg-gray-800/50 rounded-lg">
                            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">{key}</div>
                            <div className="text-2xl font-bold text-gray-100">{value}</div>
                            <div className="text-sm text-gray-400 mt-1">
                              {mod >= 0 ? '+' : ''}{mod}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Combat Stats */}
                {stats?.combat && (
                  <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
                    <h2 className="text-lg font-semibold mb-4">Combat Stats</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      {stats.combat.hitpoints !== undefined && (
                        <div>
                          <div className="text-gray-400 mb-1">Hit Points</div>
                          <div className="text-gray-100 font-medium">
                            {stats.combat.hitpoints} / {stats.combat.maxHitpoints || stats.combat.hitpoints}
                          </div>
                        </div>
                      )}
                      {stats.combat.armorClass !== undefined && (
                        <div>
                          <div className="text-gray-400 mb-1">Armor Class</div>
                          <div className="text-gray-100 font-medium">{stats.combat.armorClass}</div>
                        </div>
                      )}
                      {stats.combat.speed !== undefined && (
                        <div>
                          <div className="text-gray-400 mb-1">Speed</div>
                          <div className="text-gray-100 font-medium">{stats.combat.speed} ft</div>
                        </div>
                      )}
                    </div>
                    
                    {/* Weapons */}
                    {stats.combat.weapons && stats.combat.weapons.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-sm font-semibold text-gray-300 mb-3">Weapons</h3>
                        <div className="space-y-2">
                          {stats.combat.weapons.map((weapon, i) => (
                            <div key={i} className="p-3 bg-gray-800/50 rounded-lg text-sm">
                              <div className="font-medium text-gray-100">{weapon.name}</div>
                              <div className="text-gray-400 mt-1">
                                {weapon.damage} {weapon.damageType} • +{weapon.toHit} to hit
                                {weapon.range && ` • Range: ${weapon.range}`}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Equipment */}
                {stats?.equipment && (
                  <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
                    <h2 className="text-lg font-semibold mb-3">Equipment</h2>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{stats.equipment}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'personality' && (
              <div className="space-y-6">
                {traits?.personalityTraits && traits.personalityTraits.length > 0 && (
                  <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
                    <h2 className="text-lg font-semibold mb-3">Personality Traits</h2>
                    <ul className="space-y-2">
                      {traits.personalityTraits.map((trait, i) => (
                        <li key={i} className="text-sm text-gray-300 flex items-start">
                          <span className="text-blue-400 mr-2">•</span>
                          <span>{trait}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {traits?.ideal && (
                  <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
                    <h2 className="text-lg font-semibold mb-3">Ideal</h2>
                    <p className="text-sm text-gray-300">{traits.ideal}</p>
                  </div>
                )}

                {traits?.bond && (
                  <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
                    <h2 className="text-lg font-semibold mb-3">Bond</h2>
                    <p className="text-sm text-gray-300">{traits.bond}</p>
                  </div>
                )}

                {traits?.flaw && (
                  <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
                    <h2 className="text-lg font-semibold mb-3">Flaw</h2>
                    <p className="text-sm text-gray-300">{traits.flaw}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'backstory' && npc.backstory && (
              <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
                <h2 className="text-lg font-semibold mb-4">Backstory</h2>
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{npc.backstory}</p>
              </div>
            )}

            {activeTab === 'details' && (
              <div className="space-y-6">
                <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
                  <h2 className="text-lg font-semibold mb-4">Metadata</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Created:</span>
                      <span className="text-gray-300">{new Date(npc.created_at).toLocaleString()}</span>
                    </div>
                    {npc.voice_id && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Voice ID:</span>
                        <span className="text-gray-300">{npc.voice_id}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
