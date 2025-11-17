"use client";

import { createClient } from "@supabase/supabase-js";
import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BuildBadge from "@/components/BuildBadge";
import SettingsIcon from "@/components/SettingsIcon";

interface NPCDetailPageProps {
  worldId: string;
  npcId: string;
}

export default function NPCDetailPage({ worldId, npcId }: NPCDetailPageProps) {
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

  const loadNPC = useCallback(async () => {
    if (!supabase || !npcId) return;
    
    setLoading(true);
    setError(null);
    
    const { data, error: err } = await supabase
      .from('world_npc')
      .select('*')
      .eq('id', npcId)
      .single();
    
    if (err) {
      console.error('Error loading NPC:', err);
      setError(`Error loading NPC: ${err.message}`);
    } else {
      setNpc(data);
    }
    
    setLoading(false);
  }, [supabase, npcId]);

  useEffect(() => {
    loadNPC();
  }, [loadNPC]);

  const handleDelete = useCallback(async () => {
    if (!supabase || !npc) return;
    if (!confirm(`Delete ${npc.name}? This cannot be undone.`)) return;
    
    setDeleting(true);
    try {
      const { error: deleteError } = await supabase
        .from('world_npc')
        .delete()
        .eq('id', npcId)
        .eq('world_id', worldId);
      
      if (deleteError) {
        throw deleteError;
      }
      
      router.push(`/world/${worldId}`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setError(`Failed to delete NPC: ${message}`);
      setDeleting(false);
    }
  }, [supabase, npc, npcId, worldId, router]);

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
          <Link href={`/world/${worldId}`} className="text-blue-400 hover:text-blue-300 underline">
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
  } | undefined;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/world/${worldId}`} className="text-blue-400 hover:text-blue-300 text-sm underline">
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
              <SettingsIcon />
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-md bg-red-600 text-sm font-medium text-white hover:bg-red-700 active:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete NPC'}
              </button>
              <BuildBadge />
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Placeholder */}
            <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-8 text-center">
              {npc.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={npc.image_url} alt={npc.name} className="w-full h-auto rounded-lg" />
              ) : (
                <div className="w-full aspect-square bg-gray-800 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500 text-sm">Image placeholder</p>
                </div>
              )}
            </div>

            {/* Quick Reference Bio */}
            {npc.bio && (
              <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4 sm:p-6">
                <h2 className="text-lg font-medium mb-2">Quick Reference</h2>
                <p className="text-sm text-gray-300 leading-relaxed font-medium">{npc.bio}</p>
              </div>
            )}

            {/* Summary - One-liner and Key Points */}
            {summary && (
              <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4 sm:p-6">
                <h2 className="text-lg font-medium mb-3">Summary</h2>
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

            {/* Backstory - Detailed Narrative */}
            {npc.backstory && (
              <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4 sm:p-6">
                <h2 className="text-lg font-medium mb-3">Backstory</h2>
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{npc.backstory}</p>
              </div>
            )}

            {/* Personality */}
            {traits && (traits.personalityTraits || traits.ideal || traits.bond || traits.flaw) && (
              <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4 sm:p-6">
                <h2 className="text-lg font-medium mb-3">Personality</h2>
                <div className="space-y-3 text-sm">
                  {traits.personalityTraits && traits.personalityTraits.length > 0 && (
                    <div>
                      <p className="text-gray-400 mb-1">Traits:</p>
                      <ul className="list-disc list-inside text-gray-300 space-y-1">
                        {traits.personalityTraits.map((trait, i) => (
                          <li key={i}>{trait}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {traits.ideal && (
                    <div>
                      <p className="text-gray-400 mb-1">Ideal:</p>
                      <p className="text-gray-300">{traits.ideal}</p>
                    </div>
                  )}
                  {traits.bond && (
                    <div>
                      <p className="text-gray-400 mb-1">Bond:</p>
                      <p className="text-gray-300">{traits.bond}</p>
                    </div>
                  )}
                  {traits.flaw && (
                    <div>
                      <p className="text-gray-400 mb-1">Flaw:</p>
                      <p className="text-gray-300">{traits.flaw}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            {stats && (
              <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4 sm:p-6">
                <h2 className="text-lg font-medium mb-4">Stats</h2>
                <div className="space-y-2 text-sm">
                  {stats.level !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Level:</span>
                      <span className="text-gray-300 font-medium">{stats.level}</span>
                    </div>
                  )}
                  {stats.abilities && (
                    <div className="mt-4 space-y-2">
                      <p className="text-gray-400 mb-2">Abilities:</p>
                      {Object.entries(stats.abilities).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-400 capitalize">{key}:</span>
                          <span className="text-gray-300 font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {stats.equipment && (
                    <div className="mt-4">
                      <p className="text-gray-400 mb-2">Equipment:</p>
                      <p className="text-gray-300 text-sm">{stats.equipment}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Traits */}
            {traits && (
              <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4 sm:p-6">
                <h2 className="text-lg font-medium mb-4">Traits</h2>
                <div className="space-y-2 text-sm">
                  {traits.race && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Race:</span>
                      <span className="text-gray-300 capitalize">{traits.race}</span>
                    </div>
                  )}
                  {traits.class && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Class:</span>
                      <span className="text-gray-300">{traits.class}</span>
                    </div>
                  )}
                  {traits.background && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Background:</span>
                      <span className="text-gray-300">{traits.background}</span>
                    </div>
                  )}
                  {traits.temperament && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Temperament:</span>
                      <span className="text-gray-300 capitalize">{traits.temperament}</span>
                    </div>
                  )}
                  {traits.keywords && traits.keywords.length > 0 && (
                    <div className="mt-4">
                      <p className="text-gray-400 mb-2">Keywords:</p>
                      <div className="flex flex-wrap gap-1">
                        {traits.keywords.map((kw, i) => (
                          <span key={i} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Voice Placeholder */}
            <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4 sm:p-6">
              <h2 className="text-lg font-medium mb-3">Voice</h2>
              {npc.voice_id ? (
                <p className="text-sm text-gray-300">Voice ID: {npc.voice_id}</p>
              ) : (
                <div className="w-full h-24 bg-gray-800 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500 text-xs">Voice placeholder</p>
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4 sm:p-6">
              <h2 className="text-lg font-medium mb-4">Metadata</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Created:</span>
                  <span className="text-gray-300">{new Date(npc.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
